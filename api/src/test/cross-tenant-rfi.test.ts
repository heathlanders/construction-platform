// cross-tenant-rfi.test.ts — GC↔Sub RFI bridge (v1.1 slice)
//   invite→accept→GC shares RFI→event mirrored (whitelisted)→Sub answers→GC reads answer.
//   Plus: membership 403, non-GC share 403, inactive-connection 409, payload-leak assertion.
// Locked decisions: A-07, T-44, T-45, P-02.

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
import { rfiRoutes } from '../routes/v1/rfis.js';
import { changeOrderRoutes } from '../routes/v1/change-orders.js';
import { submittalRoutes } from '../routes/v1/submittals.js';
import { connectionRoutes } from '../routes/v1/connections.js';
import { registerErrorHandler } from '../plugins/error-handler.js';

const gcTenant = randomUUID();
const subTenant = randomUUID();
const gcOwner = randomUUID();
const subOwner = randomUUID();
const projectId = randomUUID();
const activeConn = randomUUID();
const pendingConn = randomUUID();

const app = Fastify({ logger: false });

function token(role: string, userId: string, tenantId: string): string {
  return jwt.sign(
    { jti: randomUUID(), user_id: userId, tenant_id: tenantId, role, email: `${role}@ct.test`, preferred_language: 'en' },
    process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
    { expiresIn: 86400 },
  );
}
const H = (t: string) => ({ 'user-agent': 'test-runner/1.0', authorization: `Bearer ${t}`, 'content-type': 'application/json' });
const HNB = (t: string) => ({ 'user-agent': 'test-runner/1.0', authorization: `Bearer ${t}` });
const gcTok = () => token('OWNER', gcOwner, gcTenant);
const subTok = () => token('OWNER', subOwner, subTenant);

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
       ($1,$2,'gc@ct.test',$5,'G','C','owner','active'),
       ($3,$4,'sub@ct.test',$5,'S','B','owner','active')`,
    [gcOwner, gcTenant, subOwner, subTenant, pw],
  );
  await testPool.query(`INSERT INTO projects (id,tenant_id,name,status,state) VALUES ($1,$2,'GC Project','active','WI')`, [projectId, gcTenant]);
  await testPool.query(
    `INSERT INTO tenant_connections (id,gc_tenant_id,sub_tenant_id,status,invited_by) VALUES
       ($1,$2,$3,'active',$5),
       ($4,$2,$3,'pending',$5)`,
    [activeConn, gcTenant, subTenant, pendingConn, gcOwner],
  );
});

afterAll(async () => {
  await testPool.query(`DELETE FROM shared_project_events WHERE connection_id = ANY($1)`, [[activeConn, pendingConn]]);
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

describe('GC↔Sub RFI bridge', () => {
  let sharedRfiId = '';
  let sharedNumber = 0;

  it('GC shares an RFI → mirrors an rfi.created event with a WHITELISTED payload', async () => {
    const res = await app.inject({
      method: 'POST', url: '/v1/rfis', headers: H(gcTok()),
      payload: { project_id: projectId, subject: 'What gauge wire for the panel feed?', status: 'open', connection_id: activeConn },
    });
    expect(res.statusCode).toBe(201);
    const rfi = res.json().rfi;
    expect(rfi.connection_id).toBe(activeConn);
    sharedRfiId = rfi.id; sharedNumber = rfi.number;

    // Sub reads inbound events
    const ev = await app.inject({ method: 'GET', url: `/v1/connections/${activeConn}/events?event_type=rfi.created`, headers: H(subTok()) });
    expect(ev.statusCode).toBe(200);
    const events = ev.json().events;
    expect(events).toHaveLength(1);
    expect(events[0].source_tenant_id).toBe(gcTenant);
    const p = events[0].payload;
    // Whitelisted fields present…
    expect(p).toMatchObject({ rfi_id: sharedRfiId, number: sharedNumber, subject: 'What gauge wire for the panel feed?', status: 'open' });
    // …and NO internal GC fields leaked (rules 11–13)
    expect(p).not.toHaveProperty('tenant_id');
    expect(p).not.toHaveProperty('project_id');
    expect(p).not.toHaveProperty('assignee_id');
    expect(p).not.toHaveProperty('created_by');
  });

  it('Sub posts an rfi-response → mirrors rfi.answered back to the GC', async () => {
    const res = await app.inject({
      method: 'POST', url: `/v1/connections/${activeConn}/rfi-response`, headers: H(subTok()),
      payload: { rfi_id: sharedRfiId, number: sharedNumber, answer: 'Use #6 THHN copper for the 60A feed.' },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().event.event_type).toBe('rfi.answered');

    const ev = await app.inject({ method: 'GET', url: `/v1/connections/${activeConn}/events?event_type=rfi.answered`, headers: H(gcTok()) });
    expect(ev.statusCode).toBe(200);
    const events = ev.json().events;
    expect(events).toHaveLength(1);
    expect(events[0].source_tenant_id).toBe(subTenant);
    expect(events[0].payload.answer).toContain('#6 THHN');
  });

  it('GC updating a shared RFI re-mirrors an rfi.updated event', async () => {
    const cur = await app.inject({ method: 'GET', url: `/v1/rfis/${sharedRfiId}`, headers: H(gcTok()) });
    const version = cur.json().rfi.version;
    const res = await app.inject({
      method: 'PATCH', url: `/v1/rfis/${sharedRfiId}`, headers: H(gcTok()),
      payload: { status: 'answered', version },
    });
    expect(res.statusCode).toBe(200);
    const ev = await app.inject({ method: 'GET', url: `/v1/connections/${activeConn}/events?event_type=rfi.updated`, headers: H(gcTok()) });
    expect(ev.json().events[0].payload.status).toBe('answered');
  });

  it('a non-member tenant cannot read the connection events (403)', async () => {
    const strangerTenant = randomUUID();
    const res = await app.inject({
      method: 'GET', url: `/v1/connections/${activeConn}/events`,
      headers: H(token('OWNER', randomUUID(), strangerTenant)),
    });
    expect(res.statusCode).toBe(403);
  });

  it('the Sub cannot share an RFI on the connection (only the GC can) — 403', async () => {
    // Sub has no project in its own tenant here; the guard rejects before any project touch.
    const res = await app.inject({
      method: 'POST', url: '/v1/rfis', headers: H(subTok()),
      payload: { project_id: projectId, subject: 'sneaky', status: 'open', connection_id: activeConn },
    });
    expect(res.statusCode).toBe(403);
  });

  it('sharing on a non-active (pending) connection is rejected (409)', async () => {
    const res = await app.inject({
      method: 'POST', url: '/v1/rfis', headers: H(gcTok()),
      payload: { project_id: projectId, subject: 'too early', status: 'open', connection_id: pendingConn },
    });
    expect(res.statusCode).toBe(409);
  });
});

describe('GC↔Sub change-order + submittal bridge', () => {
  it('GC shares a change order → mirror (whitelisted) → Sub decides → mirrors back', async () => {
    const create = await app.inject({
      method: 'POST', url: '/v1/change-orders', headers: H(gcTok()),
      payload: { project_id: projectId, title: 'Add subpanel in garage', amount_cents: 250000, connection_id: activeConn },
    });
    expect(create.statusCode).toBe(201);
    const co = create.json().change_order;
    expect(co.connection_id).toBe(activeConn);

    const ev = await app.inject({ method: 'GET', url: `/v1/connections/${activeConn}/events?event_type=change_order.created`, headers: H(subTok()) });
    const p = ev.json().events[0].payload;
    expect(p).toMatchObject({ co_id: co.id, title: 'Add subpanel in garage', amount_cents: 250000 });
    expect(p).not.toHaveProperty('vendor_id');
    expect(p).not.toHaveProperty('project_id');
    expect(p).not.toHaveProperty('reason_code');

    const resp = await app.inject({
      method: 'POST', url: `/v1/connections/${activeConn}/change-order-response`, headers: H(subTok()),
      payload: { co_id: co.id, decision: 'approved', note: 'Priced and accepted.' },
    });
    expect(resp.statusCode).toBe(201);
    expect(resp.json().event.event_type).toBe('change_order.responded');

    const back = await app.inject({ method: 'GET', url: `/v1/connections/${activeConn}/events?event_type=change_order.responded`, headers: H(gcTok()) });
    expect(back.json().events[0].payload.decision).toBe('approved');
    expect(back.json().events[0].source_tenant_id).toBe(subTenant);
  });

  it('CO approve mirrors change_order.updated across the bridge (gap fix)', async () => {
    const create = await app.inject({
      method: 'POST', url: '/v1/change-orders', headers: H(gcTok()),
      payload: { project_id: projectId, title: 'Trench for feeder', amount_cents: 90000, connection_id: activeConn },
    });
    expect(create.statusCode).toBe(201);
    const co = create.json().change_order;

    const approve = await app.inject({ method: 'POST', url: `/v1/change-orders/${co.id}/approve`, headers: HNB(gcTok()) });
    expect(approve.statusCode).toBe(200);

    const ev = await app.inject({ method: 'GET', url: `/v1/connections/${activeConn}/events?event_type=change_order.updated`, headers: H(subTok()) });
    const approved = ev.json().events.find((e: { payload: { co_id: string } }) => e.payload.co_id === co.id);
    expect(approved).toBeDefined();
    expect(approved.payload.status).toBe('approved');
    expect(approved.payload).not.toHaveProperty('project_id');
  });

  it('GC shares a submittal → mirror → Sub reviews → mirrors back', async () => {
    const create = await app.inject({
      method: 'POST', url: '/v1/submittals', headers: H(gcTok()),
      payload: { project_id: projectId, title: 'Panelboard cut sheets', spec_section: '26 24 16', connection_id: activeConn },
    });
    expect(create.statusCode).toBe(201);
    const sub = create.json().submittal;

    const ev = await app.inject({ method: 'GET', url: `/v1/connections/${activeConn}/events?event_type=submittal.created`, headers: H(subTok()) });
    const p = ev.json().events[0].payload;
    expect(p).toMatchObject({ submittal_id: sub.id, number: sub.number, spec_section: '26 24 16' });
    expect(p).not.toHaveProperty('project_id');

    const resp = await app.inject({
      method: 'POST', url: `/v1/connections/${activeConn}/submittal-response`, headers: H(subTok()),
      payload: { submittal_id: sub.id, number: sub.number, decision: 'revise', note: 'Provide UL listing.' },
    });
    expect(resp.statusCode).toBe(201);
    const back = await app.inject({ method: 'GET', url: `/v1/connections/${activeConn}/events?event_type=submittal.responded`, headers: H(gcTok()) });
    expect(back.json().events[0].payload.decision).toBe('revise');
  });
});
