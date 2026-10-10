// cross-tenant-lien-waivers.test.ts — Doc 07 §5.1 lien waivers (event-ledger-only, no table)
//   + §8 closeout open_lien_waivers + the §5.1 message.sent optional event.
//   GC requests / Sub signs, matched by a server-generated waiver_id in the payload.
// Locked decisions: T-44, T-45.

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
import { connectionRoutes } from '../routes/v1/connections.js';
import { registerErrorHandler } from '../plugins/error-handler.js';
import { eventTypePermitted, DEFAULT_CONNECTION_PERMISSIONS, type ConnectionPermissions } from '../lib/cross-tenant/bridge.js';

const gcTenant = randomUUID();
const subTenant = randomUUID();
const gcOwner = randomUUID();
const subOwner = randomUUID();
const conn = randomUUID();

const app = Fastify({ logger: false });

function token(userId: string, tenantId: string): string {
  return jwt.sign(
    { jti: randomUUID(), user_id: userId, tenant_id: tenantId, role: 'OWNER', email: 'o@lw.test', preferred_language: 'en' },
    process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
    { expiresIn: 86400 },
  );
}
const H = (t: string) => ({ 'user-agent': 'test-runner/1.0', authorization: `Bearer ${t}`, 'content-type': 'application/json' });
const gcTok = () => token(gcOwner, gcTenant);
const subTok = () => token(subOwner, subTenant);
const notifyCalls = () => vi.mocked(sendJob).mock.calls.filter((c) => c[0] === 'cross_tenant.notify');

beforeAll(async () => {
  registerErrorHandler(app);
  await app.register(connectionRoutes, { prefix: '/v1' });
  await app.ready();

  await testPool.query(
    `INSERT INTO tenants (id,name,slug,tier,status) VALUES
       ($1,'GC LW',$3,'professional','active'),
       ($2,'Sub LW',$4,'professional','active')`,
    [gcTenant, subTenant, `gcl-${gcTenant.slice(0, 8)}`, `sbl-${subTenant.slice(0, 8)}`],
  );
  const pw = await bcrypt.hash('x', 10);
  await testPool.query(
    `INSERT INTO users (id,tenant_id,email,password_hash,first_name,last_name,role,status) VALUES
       ($1,$2,'gc@lw.test',$5,'G','C','owner','active'),
       ($3,$4,'sub@lw.test',$5,'S','B','owner','active')`,
    [gcOwner, gcTenant, subOwner, subTenant, pw],
  );
  await testPool.query(
    `INSERT INTO tenant_connections (id,gc_tenant_id,sub_tenant_id,status,invited_by) VALUES ($1,$2,$3,'active',$4)`,
    [conn, gcTenant, subTenant, gcOwner],
  );
});

afterAll(async () => {
  await testPool.query(`DELETE FROM shared_project_events WHERE connection_id=$1`, [conn]);
  await testPool.query(`DELETE FROM tenant_connections WHERE id=$1`, [conn]);
  await testPool.query(`DELETE FROM audit_log WHERE tenant_id = ANY($1)`, [[gcTenant, subTenant]]);
  await testPool.query(`DELETE FROM users WHERE tenant_id = ANY($1)`, [[gcTenant, subTenant]]);
  await testPool.query(`DELETE FROM tenants WHERE id = ANY($1)`, [[gcTenant, subTenant]]);
  await app.close();
});

describe('eventTypePermitted — lien_waiver.* core; message.sent gated on messages', () => {
  it('lien_waiver.* passes with every optional family off', () => {
    const allOff: ConnectionPermissions = {
      ...DEFAULT_CONNECTION_PERMISSIONS,
      optional_events: { daily_reports: false, rfi_events: false, submittal_events: false, messages: false },
    };
    expect(eventTypePermitted(allOff, 'lien_waiver.requested')).toBe(true);
    expect(eventTypePermitted(allOff, 'lien_waiver.signed')).toBe(true);
  });

  it('message.sent gates on optional_events.messages like note.posted', () => {
    const off: ConnectionPermissions = {
      ...DEFAULT_CONNECTION_PERMISSIONS,
      optional_events: { ...DEFAULT_CONNECTION_PERMISSIONS.optional_events, messages: false },
    };
    expect(eventTypePermitted(off, 'message.sent')).toBe(false);
    expect(eventTypePermitted(DEFAULT_CONNECTION_PERMISSIONS, 'message.sent')).toBe(true);
  });
});

describe('lien waiver lifecycle + closeout + message.sent (route chain)', () => {
  let waiverId = '';

  it('GC requests a lien waiver → ledger event with server-generated waiver_id + notify to sub', async () => {
    vi.mocked(sendJob).mockClear();
    const res = await app.inject({
      method: 'POST', url: `/v1/connections/${conn}/lien-waiver-request`, headers: H(gcTok()),
      payload: { waiver_type: 'conditional_progress', amount_cents: 250000, through_date: '2026-07-31', note: 'July progress payment' },
    });
    expect(res.statusCode).toBe(201);
    const ev = res.json().event;
    expect(ev.event_type).toBe('lien_waiver.requested');
    waiverId = ev.payload.waiver_id;
    expect(waiverId).toMatch(/^[0-9a-f-]{36}$/);
    expect(ev.payload.requested_by_tenant_id).toBe(gcTenant);

    const notifies = notifyCalls();
    expect(notifies).toHaveLength(1);
    expect(notifies[0][1]).toBe(subTenant);
  });

  it('side guards: sub cannot request; GC cannot sign', async () => {
    const req = await app.inject({
      method: 'POST', url: `/v1/connections/${conn}/lien-waiver-request`, headers: H(subTok()),
      payload: { waiver_type: 'conditional_final' },
    });
    expect(req.statusCode).toBe(403);

    const sign = await app.inject({
      method: 'POST', url: `/v1/connections/${conn}/lien-waiver-sign`, headers: H(gcTok()),
      payload: { waiver_id: waiverId },
    });
    expect(sign.statusCode).toBe(403);
  });

  it('closeout shows the open waiver; GC complete → 409 CLOSEOUT_INCOMPLETE with the count', async () => {
    const closeout = await app.inject({ method: 'GET', url: `/v1/connections/${conn}/closeout`, headers: H(gcTok()) });
    expect(closeout.statusCode).toBe(200);
    expect(closeout.json().checklist.open_lien_waivers).toBe(1);
    expect(closeout.json().checklist.clear).toBe(false);

    const complete = await app.inject({
      method: 'POST', url: `/v1/connections/${conn}/complete`, headers: H(gcTok()),
      payload: { acknowledge_incomplete: false },
    });
    expect(complete.statusCode).toBe(409);
    expect(complete.json().error.code).toBe('CLOSEOUT_INCOMPLETE');
    expect(complete.json().details.open_lien_waivers).toBe(1);
  });

  it('sign unknown waiver → 404 WAIVER_NOT_FOUND', async () => {
    const res = await app.inject({
      method: 'POST', url: `/v1/connections/${conn}/lien-waiver-sign`, headers: H(subTok()),
      payload: { waiver_id: randomUUID() },
    });
    expect(res.statusCode).toBe(404);
    expect(res.json().error.code).toBe('WAIVER_NOT_FOUND');
  });

  it('sub signs the open waiver → matched lien_waiver.signed + notify to GC; double-sign → 409', async () => {
    vi.mocked(sendJob).mockClear();
    const res = await app.inject({
      method: 'POST', url: `/v1/connections/${conn}/lien-waiver-sign`, headers: H(subTok()),
      payload: { waiver_id: waiverId, note: 'Signed via portal' },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().event.event_type).toBe('lien_waiver.signed');
    expect(res.json().event.payload.waiver_id).toBe(waiverId);
    expect(res.json().event.payload.signed_by_tenant_id).toBe(subTenant);
    const notifies = notifyCalls();
    expect(notifies).toHaveLength(1);
    expect(notifies[0][1]).toBe(gcTenant);

    const again = await app.inject({
      method: 'POST', url: `/v1/connections/${conn}/lien-waiver-sign`, headers: H(subTok()),
      payload: { waiver_id: waiverId },
    });
    expect(again.statusCode).toBe(409);
    expect(again.json().error.code).toBe('WAIVER_ALREADY_SIGNED');
  });

  it('generic events endpoint rejects lien_waiver.* (reserved prefix)', async () => {
    const res = await app.inject({
      method: 'POST', url: `/v1/connections/${conn}/events`, headers: H(subTok()),
      payload: { event_type: 'lien_waiver.signed', payload: { waiver_id: waiverId } },
    });
    expect(res.statusCode).toBe(422);
    expect(res.json().error.code).toBe('EVENT_TYPE_NOT_ALLOWED');
  });

  it('message.sent: 201 + notify when messages on; 403 EVENT_TYPE_DISABLED when off; note.posted back-compat', async () => {
    vi.mocked(sendJob).mockClear();
    const ok = await app.inject({
      method: 'POST', url: `/v1/connections/${conn}/events`, headers: H(subTok()),
      payload: { event_type: 'message.sent', payload: { message: 'Crew on site at 7am' } },
    });
    expect(ok.statusCode).toBe(201);
    expect(notifyCalls()).toHaveLength(1);

    const note = await app.inject({
      method: 'POST', url: `/v1/connections/${conn}/events`, headers: H(gcTok()),
      payload: { event_type: 'note.posted', payload: { note: 'Old alias still works' } },
    });
    expect(note.statusCode).toBe(201);

    await testPool.query(
      `UPDATE tenant_connections SET permissions = jsonb_set(permissions, '{optional_events,messages}', 'false') WHERE id=$1`,
      [conn],
    );
    const blocked = await app.inject({
      method: 'POST', url: `/v1/connections/${conn}/events`, headers: H(subTok()),
      payload: { event_type: 'message.sent', payload: { message: 'blocked' } },
    });
    expect(blocked.statusCode).toBe(403);
    expect(blocked.json().error.code).toBe('EVENT_TYPE_DISABLED');
    await testPool.query(
      `UPDATE tenant_connections SET permissions = jsonb_set(permissions, '{optional_events,messages}', 'true') WHERE id=$1`,
      [conn],
    );
  });

  it('after signing, closeout is clear and GC complete succeeds', async () => {
    const closeout = await app.inject({ method: 'GET', url: `/v1/connections/${conn}/closeout`, headers: H(gcTok()) });
    expect(closeout.json().checklist.open_lien_waivers).toBe(0);
    expect(closeout.json().checklist.clear).toBe(true);

    const complete = await app.inject({
      method: 'POST', url: `/v1/connections/${conn}/complete`, headers: H(gcTok()),
      payload: { acknowledge_incomplete: false },
    });
    expect(complete.statusCode).toBe(200);
    const { rows } = await testPool.query(`SELECT status, closed_reason FROM tenant_connections WHERE id=$1`, [conn]);
    expect(rows[0].status).toBe('completed');
    expect(rows[0].closed_reason).toBe('completed');
  });
});
