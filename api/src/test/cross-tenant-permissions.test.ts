// cross-tenant-permissions.test.ts — Doc 07 §5 per-connection permissions (migration 0040).
//   Pure eventTypePermitted gate + PUT /permissions negotiation (tighten-immediate /
//   loosen-needs-consent) + enforcement on mirror sites, generic events, response routes.
//   Also covers the notify-without-publish fix (blocked publish ⇒ no cross_tenant.notify).
// Locked decisions: T-44, T-45 (the permission layer sits ON TOP of the payload whitelist).

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import Fastify from 'fastify';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

vi.mock('../lib/queue.js', () => ({
  sendJob: vi.fn().mockResolvedValue(undefined),
  getQueue: vi.fn(),
  stopQueue: vi.fn().mockResolvedValue(undefined),
}));

import { testPool } from './setup.js';
import { sendJob } from '../lib/queue.js';
import { rfiRoutes } from '../routes/v1/rfis.js';
import { changeOrderRoutes } from '../routes/v1/change-orders.js';
import { connectionRoutes } from '../routes/v1/connections.js';
import { registerErrorHandler } from '../plugins/error-handler.js';
import {
  eventTypePermitted,
  DEFAULT_CONNECTION_PERMISSIONS,
  type ConnectionPermissions,
} from '../lib/cross-tenant/bridge.js';

function perms(overrides: Partial<ConnectionPermissions['optional_events']>): ConnectionPermissions {
  return {
    ...DEFAULT_CONNECTION_PERMISSIONS,
    optional_events: { ...DEFAULT_CONNECTION_PERMISSIONS.optional_events, ...overrides },
  };
}

describe('eventTypePermitted (pure §5 gate)', () => {
  it('gates rfi.* on optional_events.rfi_events', () => {
    expect(eventTypePermitted(DEFAULT_CONNECTION_PERMISSIONS, 'rfi.created')).toBe(true);
    expect(eventTypePermitted(perms({ rfi_events: false }), 'rfi.created')).toBe(false);
    expect(eventTypePermitted(perms({ rfi_events: false }), 'rfi.answered')).toBe(false);
  });

  it('gates submittal.* on optional_events.submittal_events', () => {
    expect(eventTypePermitted(perms({ submittal_events: false }), 'submittal.created')).toBe(false);
    expect(eventTypePermitted(perms({ submittal_events: false }), 'submittal.responded')).toBe(false);
    expect(eventTypePermitted(DEFAULT_CONNECTION_PERMISSIONS, 'submittal.updated')).toBe(true);
  });

  it('gates note.posted on optional_events.messages', () => {
    expect(eventTypePermitted(perms({ messages: false }), 'note.posted')).toBe(false);
    expect(eventTypePermitted(DEFAULT_CONNECTION_PERMISSIONS, 'note.posted')).toBe(true);
  });

  it('never gates core families — change_order/project.location/connection/milestone/schedule', () => {
    const allOff = perms({ daily_reports: false, rfi_events: false, submittal_events: false, messages: false });
    for (const et of [
      'change_order.created',
      'change_order.updated',
      'change_order.responded',
      'project.location',
      'connection.completed',
      'connection.permissions_updated',
      'milestone.updated',
      'schedule.updated',
    ]) {
      expect(eventTypePermitted(allOff, et)).toBe(true);
    }
  });

  it('fails open on null/partial permissions (whitelist stays the leak floor)', () => {
    expect(eventTypePermitted(null, 'rfi.created')).toBe(true);
    expect(eventTypePermitted(undefined, 'note.posted')).toBe(true);
    expect(eventTypePermitted({} as ConnectionPermissions, 'submittal.created')).toBe(true);
  });
});

// ─── Route chain — negotiation + enforcement ────────────────────────────────────

const gcTenant = randomUUID();
const subTenant = randomUUID();
const outsider = randomUUID();
const gcOwner = randomUUID();
const subOwner = randomUUID();
const outOwner = randomUUID();
const projectId = randomUUID();
const conn = randomUUID();

const app = Fastify({ logger: false });

function token(userId: string, tenantId: string): string {
  return jwt.sign(
    { jti: randomUUID(), user_id: userId, tenant_id: tenantId, role: 'OWNER', email: 'o@perm.test', preferred_language: 'en' },
    process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
    { expiresIn: 86400 },
  );
}
const H = (t: string) => ({ 'user-agent': 'test-runner/1.0', authorization: `Bearer ${t}`, 'content-type': 'application/json' });
const gcTok = () => token(gcOwner, gcTenant);
const subTok = () => token(subOwner, subTenant);
const outTok = () => token(outOwner, outsider);

function permBody(
  opt: Partial<ConnectionPermissions['optional_events']> = {},
  labor: Partial<ConnectionPermissions['labor_visibility']> = {},
  core: Partial<ConnectionPermissions['core_events']> = {},
) {
  return {
    core_events: { task_updates: true, inspection_events: true, invoice_workflow: true, change_orders: true, lien_waivers: true, ...core },
    optional_events: { daily_reports: true, rfi_events: true, submittal_events: true, messages: true, ...opt },
    labor_visibility: { show_total_hours: false, show_crew_names: false, show_labor_costs: false, ...labor },
  };
}

beforeAll(async () => {
  registerErrorHandler(app);
  await app.register(rfiRoutes, { prefix: '/v1' });
  await app.register(changeOrderRoutes, { prefix: '/v1' });
  await app.register(connectionRoutes, { prefix: '/v1' });
  await app.ready();

  await testPool.query(
    `INSERT INTO tenants (id,name,slug,tier,status) VALUES
       ($1,'GC Perm',$4,'professional','active'),
       ($2,'Sub Perm',$5,'professional','active'),
       ($3,'Outsider Perm',$6,'professional','active')`,
    [gcTenant, subTenant, outsider, `gcp-${gcTenant.slice(0, 8)}`, `sbp-${subTenant.slice(0, 8)}`, `out-${outsider.slice(0, 8)}`],
  );
  const pw = await bcrypt.hash('x', 10);
  await testPool.query(
    `INSERT INTO users (id,tenant_id,email,password_hash,first_name,last_name,role,status) VALUES
       ($1,$2,'gc@perm.test',$7,'G','C','owner','active'),
       ($3,$4,'sub@perm.test',$7,'S','B','owner','active'),
       ($5,$6,'out@perm.test',$7,'O','U','owner','active')`,
    [gcOwner, gcTenant, subOwner, subTenant, outOwner, outsider, pw],
  );
  await testPool.query(`INSERT INTO projects (id,tenant_id,name,status,state) VALUES ($1,$2,'GC Perm Project','active','WI')`, [projectId, gcTenant]);
  await testPool.query(
    `INSERT INTO tenant_connections (id,gc_tenant_id,sub_tenant_id,status,invited_by) VALUES ($1,$2,$3,'active',$4)`,
    [conn, gcTenant, subTenant, gcOwner],
  );
});

afterAll(async () => {
  await testPool.query(`DELETE FROM shared_project_events WHERE connection_id = $1`, [conn]);
  await testPool.query(`DELETE FROM rfis WHERE tenant_id=$1`, [gcTenant]);
  await testPool.query(`DELETE FROM change_orders WHERE tenant_id=$1`, [gcTenant]);
  await testPool.query(`DELETE FROM tenant_connections WHERE id=$1`, [conn]);
  await testPool.query(`DELETE FROM audit_log WHERE tenant_id = ANY($1)`, [[gcTenant, subTenant, outsider]]);
  await testPool.query(`DELETE FROM projects WHERE tenant_id=$1`, [gcTenant]);
  await testPool.query(`DELETE FROM users WHERE tenant_id = ANY($1)`, [[gcTenant, subTenant, outsider]]);
  await testPool.query(`DELETE FROM tenants WHERE id = ANY($1)`, [[gcTenant, subTenant, outsider]]);
  await app.close();
});

describe('permission negotiation + enforcement (route chain)', () => {
  it('detail exposes the migration-default permissions', async () => {
    const res = await app.inject({ method: 'GET', url: `/v1/connections/${conn}`, headers: H(gcTok()) });
    expect(res.statusCode).toBe(200);
    const c = res.json().connection;
    expect(c.permissions.optional_events.rfi_events).toBe(true);
    expect(c.permissions.labor_visibility.show_labor_costs).toBe(false);
    expect(c.proposed_permissions).toBeNull();
  });

  it('rejects core=false and show_labor_costs=true with 422', async () => {
    const r1 = await app.inject({
      method: 'PUT', url: `/v1/connections/${conn}/permissions`, headers: H(gcTok()),
      payload: permBody({}, {}, { change_orders: false as unknown as true }),
    });
    expect(r1.statusCode).toBe(422);
    const r2 = await app.inject({
      method: 'PUT', url: `/v1/connections/${conn}/permissions`, headers: H(gcTok()),
      payload: permBody({}, { show_labor_costs: true as unknown as false }),
    });
    expect(r2.statusCode).toBe(422);
  });

  it('non-member PUT → uniform 403', async () => {
    const res = await app.inject({
      method: 'PUT', url: `/v1/connections/${conn}/permissions`, headers: H(outTok()), payload: permBody(),
    });
    expect(res.statusCode).toBe(403);
  });

  it('pure tightening applies immediately + dual-tenant audit', async () => {
    const res = await app.inject({
      method: 'PUT', url: `/v1/connections/${conn}/permissions`, headers: H(gcTok()),
      payload: permBody({ rfi_events: false, messages: false }),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().applied).toBe(true);

    const detail = await app.inject({ method: 'GET', url: `/v1/connections/${conn}`, headers: H(subTok()) });
    expect(detail.json().connection.permissions.optional_events.rfi_events).toBe(false);

    const audits = await testPool.query(
      `SELECT tenant_id FROM audit_log WHERE action='connection.permissions_updated' AND resource_id=$1`,
      [conn],
    );
    const tenants = audits.rows.map((r) => r.tenant_id);
    expect(tenants).toContain(gcTenant);
    expect(tenants).toContain(subTenant);
  });

  it('rfi_events off: RFI mirror publishes NOTHING and does not notify; change orders still flow', async () => {
    vi.mocked(sendJob).mockClear();
    const subject = `Blocked RFI ${conn.slice(0, 8)}`;
    const rfi = await app.inject({
      method: 'POST', url: '/v1/rfis', headers: H(gcTok()),
      payload: { project_id: projectId, subject, status: 'open', connection_id: conn },
    });
    expect(rfi.statusCode).toBe(201); // the RFI itself is created — only the mirror is blocked

    const evs = await testPool.query(
      `SELECT id FROM shared_project_events WHERE connection_id=$1 AND event_type='rfi.created'`,
      [conn],
    );
    expect(evs.rowCount).toBe(0);
    const notifies = vi.mocked(sendJob).mock.calls.filter((c) => c[0] === 'cross_tenant.notify');
    expect(notifies).toHaveLength(0);

    const co = await app.inject({
      method: 'POST', url: '/v1/change-orders', headers: H(gcTok()),
      payload: { project_id: projectId, title: 'Core CO', amount_cents: 50000, connection_id: conn },
    });
    expect(co.statusCode).toBe(201);
    const coEvs = await testPool.query(
      `SELECT id FROM shared_project_events WHERE connection_id=$1 AND event_type='change_order.created'`,
      [conn],
    );
    expect(coEvs.rowCount).toBe(1);
  });

  it('response routes: rfi-response 403 EVENT_TYPE_DISABLED, change-order-response 201', async () => {
    const r = await app.inject({
      method: 'POST', url: `/v1/connections/${conn}/rfi-response`, headers: H(subTok()),
      payload: { rfi_id: randomUUID(), number: 1, answer: 'Blocked answer' },
    });
    expect(r.statusCode).toBe(403);
    expect(r.json().error.code).toBe('EVENT_TYPE_DISABLED');

    const c = await app.inject({
      method: 'POST', url: `/v1/connections/${conn}/change-order-response`, headers: H(subTok()),
      payload: { co_id: randomUUID(), decision: 'approved' },
    });
    expect(c.statusCode).toBe(201);
  });

  it('generic events: note.posted 403 when messages off, milestone.updated still 201', async () => {
    const n = await app.inject({
      method: 'POST', url: `/v1/connections/${conn}/events`, headers: H(subTok()),
      payload: { event_type: 'note.posted', payload: { note: 'hi' } },
    });
    expect(n.statusCode).toBe(403);
    expect(n.json().error.code).toBe('EVENT_TYPE_DISABLED');

    const m = await app.inject({
      method: 'POST', url: `/v1/connections/${conn}/events`, headers: H(subTok()),
      payload: { event_type: 'milestone.updated', payload: { title: 'Rough-in done' } },
    });
    expect(m.statusCode).toBe(201);
  });

  it('loosening becomes a pending proposal — nothing applies until counterparty consent', async () => {
    const res = await app.inject({
      method: 'PUT', url: `/v1/connections/${conn}/permissions`, headers: H(gcTok()),
      payload: permBody({ rfi_events: true, messages: false }), // rfi false→true = loosening
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().proposed).toBe(true);

    // Still blocked until consent
    const detail = await app.inject({ method: 'GET', url: `/v1/connections/${conn}`, headers: H(gcTok()) });
    expect(detail.json().connection.permissions.optional_events.rfi_events).toBe(false);
    expect(detail.json().connection.proposed_permissions.proposed_by_tenant_id).toBe(gcTenant);

    // Proposer cannot self-consent
    const self = await app.inject({
      method: 'POST', url: `/v1/connections/${conn}/permissions/consent`, headers: H(gcTok()),
      payload: { accept: true },
    });
    expect(self.statusCode).toBe(403);

    // Counterparty consents → applied, negotiated_at stamped, RFI mirror flows again
    const consent = await app.inject({
      method: 'POST', url: `/v1/connections/${conn}/permissions/consent`, headers: H(subTok()),
      payload: { accept: true },
    });
    expect(consent.statusCode).toBe(200);
    expect(consent.json().applied).toBe(true);
    expect(consent.json().permissions.negotiated_at).toBeTruthy();

    const rfi = await app.inject({
      method: 'POST', url: '/v1/rfis', headers: H(gcTok()),
      payload: { project_id: projectId, subject: 'Flows again', status: 'open', connection_id: conn },
    });
    expect(rfi.statusCode).toBe(201);
    const evs = await testPool.query(
      `SELECT id FROM shared_project_events WHERE connection_id=$1 AND event_type='rfi.created'`,
      [conn],
    );
    expect(evs.rowCount).toBe(1);
  });

  it('consent {accept:false} clears the proposal; consent with none → 409', async () => {
    const propose = await app.inject({
      method: 'PUT', url: `/v1/connections/${conn}/permissions`, headers: H(subTok()),
      payload: permBody({ messages: true }), // messages false→true = loosening (by the sub)
    });
    expect(propose.json().proposed).toBe(true);

    const reject = await app.inject({
      method: 'POST', url: `/v1/connections/${conn}/permissions/consent`, headers: H(gcTok()),
      payload: { accept: false },
    });
    expect(reject.statusCode).toBe(200);
    expect(reject.json().applied).toBe(false);

    const detail = await app.inject({ method: 'GET', url: `/v1/connections/${conn}`, headers: H(gcTok()) });
    expect(detail.json().connection.proposed_permissions).toBeNull();
    expect(detail.json().connection.permissions.optional_events.messages).toBe(false);

    const none = await app.inject({
      method: 'POST', url: `/v1/connections/${conn}/permissions/consent`, headers: H(gcTok()),
      payload: { accept: true },
    });
    expect(none.statusCode).toBe(409);
    expect(none.json().error.code).toBe('NO_PENDING_PROPOSAL');
  });
});
