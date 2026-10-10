// cross-tenant-notify.test.ts — Phase 3: cross-tenant shared-event → counterparty notification.
//   Sharing a bridge object enqueues a `cross_tenant.notify` job to the OTHER party (never the
//   source); the worker writes an in-app notification to the recipient's OWNER/PM users. Includes
//   a payload-leak assertion on the enqueued notify ref (rules 11–13) + a "none to source" guard.
// Locked decisions: A-07, T-10, T-40, T-41, T-44, T-45, P-02.

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import Fastify from 'fastify';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

vi.mock('../lib/queue.js', () => ({
  sendJob: vi.fn().mockResolvedValue(undefined),
  getQueue: vi.fn(),
  stopQueue: vi.fn().mockResolvedValue(undefined),
}));

import { sendJob } from '../lib/queue.js';
import { testPool } from './setup.js';
import { rfiRoutes } from '../routes/v1/rfis.js';
import { changeOrderRoutes } from '../routes/v1/change-orders.js';
import { submittalRoutes } from '../routes/v1/submittals.js';
import { connectionRoutes } from '../routes/v1/connections.js';
import { handleCrossTenantNotify } from '../workers/stripe-worker.js';
import { registerErrorHandler } from '../plugins/error-handler.js';

const gcTenant = randomUUID();
const subTenant = randomUUID();
const gcOwner = randomUUID();
const subOwner = randomUUID();
const subPm = randomUUID();
const projectId = randomUUID();
const activeConn = randomUUID();

const app = Fastify({ logger: false });

function token(role: string, userId: string, tenantId: string): string {
  return jwt.sign(
    { jti: randomUUID(), user_id: userId, tenant_id: tenantId, role, email: `${role}@ct.test`, preferred_language: 'en' },
    process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
    { expiresIn: 86400 },
  );
}
const H = (t: string) => ({ 'user-agent': 'test-runner/1.0', authorization: `Bearer ${t}`, 'content-type': 'application/json' });
const gcTok = () => token('OWNER', gcOwner, gcTenant);
const subTok = () => token('OWNER', subOwner, subTenant);

// Extract the cross_tenant.notify calls from the sendJob spy.
type NotifyCall = [string, string, Record<string, unknown>];
function notifyCalls(): NotifyCall[] {
  return (sendJob as unknown as { mock: { calls: NotifyCall[] } }).mock.calls.filter(
    (c) => c[0] === 'cross_tenant.notify',
  );
}

beforeAll(async () => {
  registerErrorHandler(app);
  await app.register(rfiRoutes, { prefix: '/v1' });
  await app.register(changeOrderRoutes, { prefix: '/v1' });
  await app.register(submittalRoutes, { prefix: '/v1' });
  await app.register(connectionRoutes, { prefix: '/v1' });
  await app.ready();

  await testPool.query(
    `INSERT INTO tenants (id,name,slug,tier,status) VALUES
       ($1,'GC Tenant',$3,'professional','active'),
       ($2,'Sub Tenant',$4,'professional','active')`,
    [gcTenant, subTenant, `gc-${gcTenant.slice(0, 8)}`, `sub-${subTenant.slice(0, 8)}`],
  );
  const pw = await bcrypt.hash('x', 10);
  await testPool.query(
    `INSERT INTO users (id,tenant_id,email,password_hash,first_name,last_name,role,status) VALUES
       ($1,$2,'gc@ct.test',$6,'G','C','owner','active'),
       ($3,$4,'sub@ct.test',$6,'S','B','owner','active'),
       ($5,$4,'subpm@ct.test',$6,'S','P','project_manager','active')`,
    [gcOwner, gcTenant, subOwner, subTenant, subPm, pw],
  );
  await testPool.query(`INSERT INTO projects (id,tenant_id,name,status,state) VALUES ($1,$2,'GC Project','active','WI')`, [projectId, gcTenant]);
  await testPool.query(
    `INSERT INTO tenant_connections (id,gc_tenant_id,sub_tenant_id,status,invited_by) VALUES ($1,$2,$3,'active',$4)`,
    [activeConn, gcTenant, subTenant, gcOwner],
  );
});

afterAll(async () => {
  await testPool.query(`DELETE FROM notifications WHERE tenant_id = ANY($1)`, [[gcTenant, subTenant]]);
  await testPool.query(`DELETE FROM shared_project_events WHERE connection_id = $1`, [activeConn]);
  await testPool.query(`DELETE FROM rfis WHERE tenant_id=$1`, [gcTenant]);
  await testPool.query(`DELETE FROM change_orders WHERE tenant_id=$1`, [gcTenant]);
  await testPool.query(`DELETE FROM submittals WHERE tenant_id=$1`, [gcTenant]);
  await testPool.query(`DELETE FROM tenant_connections WHERE gc_tenant_id=$1`, [gcTenant]);
  await testPool.query(`DELETE FROM audit_log WHERE tenant_id = ANY($1)`, [[gcTenant, subTenant]]);
  await testPool.query(`DELETE FROM projects WHERE tenant_id=$1`, [gcTenant]);
  await testPool.query(`DELETE FROM users WHERE tenant_id = ANY($1)`, [[gcTenant, subTenant]]);
  await testPool.query(`DELETE FROM tenants WHERE id = ANY($1)`, [[gcTenant, subTenant]]);
  await app.close();
});

beforeEach(() => {
  (sendJob as unknown as { mockClear: () => void }).mockClear();
});

describe('cross-tenant shared-event → counterparty notification (Phase 3)', () => {
  it('GC sharing an RFI enqueues a cross_tenant.notify to the SUB (recipient), never the GC (source)', async () => {
    const res = await app.inject({
      method: 'POST', url: '/v1/rfis', headers: H(gcTok()),
      payload: { project_id: projectId, subject: 'Panel feed gauge?', status: 'open', connection_id: activeConn },
    });
    expect(res.statusCode).toBe(201);

    const calls = notifyCalls();
    expect(calls).toHaveLength(1);
    const [, recipientTenantId, payload] = calls[0];

    // Enqueued to the SUB, not the GC.
    expect(recipientTenantId).toBe(subTenant);
    expect(recipientTenantId).not.toBe(gcTenant);
    expect(payload.source_tenant_id).toBe(gcTenant);
    expect(payload.event_type).toBe('rfi.created');

    // The notify ref is the whitelisted payload only — no internal GC ids leak (rules 11–13).
    const ref = payload.ref as Record<string, unknown>;
    expect(ref).toMatchObject({ subject: 'Panel feed gauge?', status: 'open' });
    expect(ref).not.toHaveProperty('tenant_id');
    expect(ref).not.toHaveProperty('project_id');
    expect(ref).not.toHaveProperty('assignee_id');
    expect(ref).not.toHaveProperty('created_by');
  });

  it('a Sub response (rfi.answered) notifies the GC, not the Sub', async () => {
    // GC shares first so the Sub has something to answer.
    const created = await app.inject({
      method: 'POST', url: '/v1/rfis', headers: H(gcTok()),
      payload: { project_id: projectId, subject: 'Conductor size?', status: 'open', connection_id: activeConn },
    });
    const rfi = created.json().rfi;
    (sendJob as unknown as { mockClear: () => void }).mockClear();

    const resp = await app.inject({
      method: 'POST', url: `/v1/connections/${activeConn}/rfi-response`, headers: H(subTok()),
      payload: { rfi_id: rfi.id, number: rfi.number, answer: 'Use #6 THHN.' },
    });
    expect(resp.statusCode).toBe(201);

    const calls = notifyCalls();
    expect(calls).toHaveLength(1);
    const [, recipientTenantId, payload] = calls[0];
    expect(recipientTenantId).toBe(gcTenant); // back to the GC
    expect(payload.source_tenant_id).toBe(subTenant);
    expect(payload.event_type).toBe('rfi.answered');
  });

  it('the notify worker writes an in-app cross_tenant notification to the recipient OWNER/PM only', async () => {
    await testPool.query(`DELETE FROM notifications WHERE tenant_id = ANY($1)`, [[gcTenant, subTenant]]);

    await handleCrossTenantNotify(subTenant, {
      connection_id: activeConn,
      source_tenant_id: gcTenant,
      event_type: 'rfi.created',
      ref: { rfi_id: randomUUID(), number: 7, subject: 'Feeder run', status: 'open' },
    });

    // Both sub OWNER and sub PM get one; the GC gets none.
    const sub = await testPool.query(
      `SELECT user_id, category, title FROM notifications WHERE tenant_id=$1`,
      [subTenant],
    );
    expect(sub.rows).toHaveLength(2);
    expect(sub.rows.every((r) => r.category === 'cross_tenant')).toBe(true);
    expect(sub.rows.map((r) => r.user_id).sort()).toEqual([subOwner, subPm].sort());
    expect(sub.rows[0].title).toBe('New RFI shared');

    const gc = await testPool.query(`SELECT 1 FROM notifications WHERE tenant_id=$1`, [gcTenant]);
    expect(gc.rowCount).toBe(0);
  });

  it('change-order + submittal shares each notify the Sub exactly once', async () => {
    const co = await app.inject({
      method: 'POST', url: '/v1/change-orders', headers: H(gcTok()),
      payload: { project_id: projectId, title: 'Add subpanel', amount_cents: 250000, connection_id: activeConn },
    });
    expect(co.statusCode).toBe(201);
    let calls = notifyCalls();
    expect(calls).toHaveLength(1);
    expect(calls[0][1]).toBe(subTenant);
    expect(calls[0][2].event_type).toBe('change_order.created');
    // amount stays in cents across the bridge (T-02)
    expect((calls[0][2].ref as Record<string, unknown>).amount_cents).toBe(250000);

    (sendJob as unknown as { mockClear: () => void }).mockClear();

    const sub = await app.inject({
      method: 'POST', url: '/v1/submittals', headers: H(gcTok()),
      payload: { project_id: projectId, title: 'Panel cut sheets', spec_section: '26 24 16', connection_id: activeConn },
    });
    expect(sub.statusCode).toBe(201);
    calls = notifyCalls();
    expect(calls).toHaveLength(1);
    expect(calls[0][1]).toBe(subTenant);
    expect(calls[0][2].event_type).toBe('submittal.created');
  });

  it('an unshared RFI (no connection) enqueues no cross_tenant.notify', async () => {
    const res = await app.inject({
      method: 'POST', url: '/v1/rfis', headers: H(gcTok()),
      payload: { project_id: projectId, subject: 'internal only', status: 'open' },
    });
    expect(res.statusCode).toBe(201);
    expect(notifyCalls()).toHaveLength(0);
  });
});
