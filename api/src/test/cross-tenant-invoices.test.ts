// cross-tenant-invoices.test.ts — Doc 07 §5.1 invoice workflow (migration 0041).
//   Direction is REVERSED vs rfis/COs: the SUB bills the GC. Sub-side connection link on
//   invoices, invoice.submitted on the submit transition + amend-while-sent, GC-only
//   invoice-response (approved|paid), reserved-prefix forgery guard, notify-without-publish.
// Locked decisions: T-44, T-45 (whitelist stays the leak floor), T-02 (cents).

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
import { invoiceRoutes } from '../routes/v1/invoices.js';
import { connectionRoutes } from '../routes/v1/connections.js';
import { registerErrorHandler } from '../plugins/error-handler.js';
import { eventTypePermitted, type ConnectionPermissions } from '../lib/cross-tenant/bridge.js';

const gcTenant = randomUUID();
const subTenant = randomUUID();
const gcOwner = randomUUID();
const subOwner = randomUUID();
const subProject = randomUUID();
const conn = randomUUID();
const pendingConn = randomUUID();

const app = Fastify({ logger: false });

function token(userId: string, tenantId: string): string {
  return jwt.sign(
    { jti: randomUUID(), user_id: userId, tenant_id: tenantId, role: 'OWNER', email: 'o@inv.test', preferred_language: 'en' },
    process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
    { expiresIn: 86400 },
  );
}
const H = (t: string) => ({ 'user-agent': 'test-runner/1.0', authorization: `Bearer ${t}`, 'content-type': 'application/json' });
const gcTok = () => token(gcOwner, gcTenant);
const subTok = () => token(subOwner, subTenant);

async function submittedEvents(): Promise<Record<string, unknown>[]> {
  const { rows } = await testPool.query(
    `SELECT payload FROM shared_project_events WHERE connection_id=$1 AND event_type='invoice.submitted' ORDER BY created_at`,
    [conn],
  );
  return rows.map((r) => r.payload);
}
const notifyCalls = () => vi.mocked(sendJob).mock.calls.filter((c) => c[0] === 'cross_tenant.notify');

beforeAll(async () => {
  registerErrorHandler(app);
  await app.register(invoiceRoutes, { prefix: '/v1' });
  await app.register(connectionRoutes, { prefix: '/v1' });
  await app.ready();

  await testPool.query(
    `INSERT INTO tenants (id,name,slug,tier,status) VALUES
       ($1,'GC Inv',$3,'professional','active'),
       ($2,'Sub Inv',$4,'professional','active')`,
    [gcTenant, subTenant, `gci-${gcTenant.slice(0, 8)}`, `sbi-${subTenant.slice(0, 8)}`],
  );
  const pw = await bcrypt.hash('x', 10);
  await testPool.query(
    `INSERT INTO users (id,tenant_id,email,password_hash,first_name,last_name,role,status) VALUES
       ($1,$2,'gc@inv.test',$5,'G','C','owner','active'),
       ($3,$4,'sub@inv.test',$5,'S','B','owner','active')`,
    [gcOwner, gcTenant, subOwner, subTenant, pw],
  );
  // The sub's mirror project — invoices are the SUB's rows (golden rule: never in GC tables).
  await testPool.query(`INSERT INTO projects (id,tenant_id,name,status,state) VALUES ($1,$2,'Sub Mirror','active','WI')`, [subProject, subTenant]);
  await testPool.query(
    `INSERT INTO tenant_connections (id,gc_tenant_id,sub_tenant_id,status,invited_by) VALUES
       ($1,$3,$4,'active',$5),
       ($2,$3,$4,'pending',$5)`,
    [conn, pendingConn, gcTenant, subTenant, gcOwner],
  );
});

afterAll(async () => {
  await testPool.query(`DELETE FROM shared_project_events WHERE connection_id = ANY($1)`, [[conn, pendingConn]]);
  await testPool.query(`DELETE FROM invoices WHERE tenant_id = ANY($1)`, [[gcTenant, subTenant]]);
  await testPool.query(`DELETE FROM tenant_connections WHERE id = ANY($1)`, [[conn, pendingConn]]);
  await testPool.query(`DELETE FROM audit_log WHERE tenant_id = ANY($1)`, [[gcTenant, subTenant]]);
  await testPool.query(`DELETE FROM projects WHERE tenant_id = ANY($1)`, [[gcTenant, subTenant]]);
  await testPool.query(`DELETE FROM users WHERE tenant_id = ANY($1)`, [[gcTenant, subTenant]]);
  await testPool.query(`DELETE FROM tenants WHERE id = ANY($1)`, [[gcTenant, subTenant]]);
  await app.close();
});

describe('eventTypePermitted — invoice.* is core, never gated', () => {
  it('invoice.* passes even with every optional family off', () => {
    const allOff = {
      core_events: { task_updates: true, inspection_events: true, invoice_workflow: true, change_orders: true, lien_waivers: true },
      optional_events: { daily_reports: false, rfi_events: false, submittal_events: false, messages: false },
      labor_visibility: { show_total_hours: false, show_crew_names: false, show_labor_costs: false },
      negotiated_at: null,
      accepted_by_sub: true,
    } as ConnectionPermissions;
    for (const et of ['invoice.submitted', 'invoice.approved', 'invoice.paid']) {
      expect(eventTypePermitted(allOff, et)).toBe(true);
    }
  });
});

describe('invoice workflow over the bridge (route chain)', () => {
  let invoiceId = '';
  let version = 1;

  it('sub creates a connection-linked invoice as sent → invoice.submitted with the exact whitelist + notify to GC', async () => {
    vi.mocked(sendJob).mockClear();
    const res = await app.inject({
      method: 'POST', url: '/v1/invoices', headers: H(subTok()),
      payload: { project_id: subProject, amount_cents: 250000, status: 'sent', due_date: '2026-08-15', retainage_held_cents: 12500, connection_id: conn },
    });
    expect(res.statusCode).toBe(201);
    invoiceId = res.json().invoice.id;
    version = res.json().invoice.version;

    const evs = await submittedEvents();
    expect(evs).toHaveLength(1);
    // Whitelist is the leak floor — exactly these keys, no contract/retainage internals.
    expect(Object.keys(evs[0]).sort()).toEqual(['amount_cents', 'due_date', 'invoice_id', 'status']);
    expect(evs[0].invoice_id).toBe(invoiceId);
    expect(evs[0].amount_cents).toBe(250000);
    expect(evs[0].status).toBe('sent');

    const notifies = notifyCalls();
    expect(notifies).toHaveLength(1);
    expect(notifies[0][1]).toBe(gcTenant); // recipient = the party that did not author
  });

  it('GC cannot connection-link an invoice (sub-side only) → 403, no row, no event', async () => {
    const res = await app.inject({
      method: 'POST', url: '/v1/invoices', headers: H(gcTok()),
      payload: { project_id: subProject, amount_cents: 100, status: 'sent', connection_id: conn },
    });
    expect(res.statusCode).toBe(403);
    expect((await submittedEvents())).toHaveLength(1);
  });

  it('pending connection → 409 CONNECTION_NOT_ACTIVE', async () => {
    const res = await app.inject({
      method: 'POST', url: '/v1/invoices', headers: H(subTok()),
      payload: { project_id: subProject, amount_cents: 100, status: 'sent', connection_id: pendingConn },
    });
    expect(res.statusCode).toBe(409);
    expect(res.json().error.code).toBe('CONNECTION_NOT_ACTIVE');
  });

  let draftId = '';
  let draftVersion = 1;

  it('draft create publishes nothing; draft→sent PATCH publishes invoice.submitted', async () => {
    vi.mocked(sendJob).mockClear();
    const draft = await app.inject({
      method: 'POST', url: '/v1/invoices', headers: H(subTok()),
      payload: { project_id: subProject, amount_cents: 90000, status: 'draft', connection_id: conn },
    });
    expect(draft.statusCode).toBe(201);
    draftId = draft.json().invoice.id;
    draftVersion = draft.json().invoice.version;
    expect(await submittedEvents()).toHaveLength(1);
    expect(notifyCalls()).toHaveLength(0);

    const sent = await app.inject({
      method: 'PATCH', url: `/v1/invoices/${draftId}`, headers: H(subTok()),
      payload: { status: 'sent', version: draftVersion },
    });
    expect(sent.statusCode).toBe(200);
    draftVersion = sent.json().invoice.version;
    const evs = await submittedEvents();
    expect(evs).toHaveLength(2);
    expect(evs[1].invoice_id).toBe(draftId);
    expect(notifyCalls()).toHaveLength(1);
  });

  it('amount amendment while sent re-publishes; retainage-only PATCH does not', async () => {
    const amend = await app.inject({
      method: 'PATCH', url: `/v1/invoices/${draftId}`, headers: H(subTok()),
      payload: { amount_cents: 95000, version: draftVersion },
    });
    expect(amend.statusCode).toBe(200);
    draftVersion = amend.json().invoice.version;
    let evs = await submittedEvents();
    expect(evs).toHaveLength(3);
    expect(evs[2].amount_cents).toBe(95000);

    const retainage = await app.inject({
      method: 'PATCH', url: `/v1/invoices/${draftId}`, headers: H(subTok()),
      payload: { retainage_held_cents: 4500, version: draftVersion },
    });
    expect(retainage.statusCode).toBe(200);
    draftVersion = retainage.json().invoice.version;
    evs = await submittedEvents();
    expect(evs).toHaveLength(3);
  });

  it('sub marking its own row paid publishes NO invoice.paid (GC is the payer)', async () => {
    const res = await app.inject({
      method: 'PATCH', url: `/v1/invoices/${draftId}`, headers: H(subTok()),
      payload: { status: 'paid', version: draftVersion },
    });
    expect(res.statusCode).toBe(200);
    draftVersion = res.json().invoice.version;
    const { rows } = await testPool.query(
      `SELECT id FROM shared_project_events WHERE connection_id=$1 AND event_type IN ('invoice.paid','invoice.approved')`,
      [conn],
    );
    expect(rows).toHaveLength(0);
  });

  it('GC invoice-response: approved then paid → typed ledger events stamped responded_by_tenant_id', async () => {
    vi.mocked(sendJob).mockClear();
    const approved = await app.inject({
      method: 'POST', url: `/v1/connections/${conn}/invoice-response`, headers: H(gcTok()),
      payload: { invoice_id: invoiceId, decision: 'approved', note: 'Looks right' },
    });
    expect(approved.statusCode).toBe(201);
    expect(approved.json().event.event_type).toBe('invoice.approved');
    expect(approved.json().event.payload.responded_by_tenant_id).toBe(gcTenant);

    const paid = await app.inject({
      method: 'POST', url: `/v1/connections/${conn}/invoice-response`, headers: H(gcTok()),
      payload: { invoice_id: invoiceId, decision: 'paid' },
    });
    expect(paid.statusCode).toBe(201);
    expect(paid.json().event.event_type).toBe('invoice.paid');

    const notifies = notifyCalls();
    expect(notifies).toHaveLength(2);
    expect(notifies.every((c) => c[1] === subTenant)).toBe(true);
  });

  it('sub calling invoice-response → 403 (GC-only side guard)', async () => {
    const res = await app.inject({
      method: 'POST', url: `/v1/connections/${conn}/invoice-response`, headers: H(subTok()),
      payload: { invoice_id: invoiceId, decision: 'paid' },
    });
    expect(res.statusCode).toBe(403);
  });

  it('generic events endpoint rejects invoice.* (reserved prefix — forgery guard)', async () => {
    const res = await app.inject({
      method: 'POST', url: `/v1/connections/${conn}/events`, headers: H(subTok()),
      payload: { event_type: 'invoice.submitted', payload: { invoice_id: randomUUID(), amount_cents: 1, status: 'sent', due_date: null } },
    });
    expect(res.statusCode).toBe(422);
    expect(res.json().error.code).toBe('EVENT_TYPE_NOT_ALLOWED');
  });

  it('revoked connection: PATCH on the linked invoice publishes nothing and does not notify', async () => {
    await testPool.query(`UPDATE tenant_connections SET status='revoked' WHERE id=$1`, [conn]);
    vi.mocked(sendJob).mockClear();
    // draftId is 'paid' — send it back to sent (a → sent transition would publish if active)
    const res = await app.inject({
      method: 'PATCH', url: `/v1/invoices/${draftId}`, headers: H(subTok()),
      payload: { status: 'sent', version: draftVersion },
    });
    expect(res.statusCode).toBe(200); // the sub's own row still updates
    expect(await submittedEvents()).toHaveLength(3);
    expect(notifyCalls()).toHaveLength(0);
    await testPool.query(`UPDATE tenant_connections SET status='active' WHERE id=$1`, [conn]);
  });
});
