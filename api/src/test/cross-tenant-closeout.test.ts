// cross-tenant-closeout.test.ts — Doc 07 §8 connection closeout + reason codes (migration 0040).
//   GET /:id/closeout checklist over the bridge ledger; POST /:id/complete (GC-only, ack
//   escape hatch, final connection.completed ledger event); revoke reason codes; worker
//   disposition mapping (completed/mutual_agreement → mirror 'completed', else 'on_hold');
//   read-only archive after completion; re-invite after completed allowed.
// Locked decisions: T-44, T-45, A-07, T-10.

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
import { redis } from '../lib/redis.js';
import { sendJob } from '../lib/queue.js';
import { connectionRoutes } from '../routes/v1/connections.js';
import { registerErrorHandler } from '../plugins/error-handler.js';
import { publishSharedEvent } from '../lib/cross-tenant/bridge.js';
import { handleConnectionClosed } from '../workers/stripe-worker.js';

const gc = randomUUID();   // business — addon included
const sub = randomUUID();  // business
const owner: Record<string, string> = { [gc]: randomUUID(), [sub]: randomUUID() };
const allTenants = [gc, sub];

let mainConn = '';     // active — full closeout flow
let revokeConn = '';   // active — revoke-with-reason flow
let pendingConn = '';  // pending — complete must 409

const app = Fastify({ logger: false });

function token(tenantId: string): string {
  return jwt.sign(
    { jti: randomUUID(), user_id: owner[tenantId], tenant_id: tenantId, role: 'OWNER', email: `o@${tenantId.slice(0, 6)}.t`, preferred_language: 'en' },
    process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
    { expiresIn: 86400 },
  );
}
const H = (t: string) => ({ 'user-agent': 'test-runner/1.0', authorization: `Bearer ${t}`, 'content-type': 'application/json' });
const HNB = (t: string) => ({ 'user-agent': 'test-runner/1.0', authorization: `Bearer ${t}` });

beforeAll(async () => {
  registerErrorHandler(app);
  await app.register(connectionRoutes, { prefix: '/v1' });
  await app.ready();

  await testPool.query(
    `INSERT INTO tenants (id,name,slug,tier,status) VALUES
       ($1,'Closeout GC',$3,'business','active'),
       ($2,'Closeout Sub',$4,'business','active')`,
    [gc, sub, `cgc-${gc.slice(0, 8)}`, `csub-${sub.slice(0, 8)}`],
  );
  const pw = await bcrypt.hash('x', 10);
  for (const t of allTenants) {
    await testPool.query(
      `INSERT INTO users (id,tenant_id,email,password_hash,first_name,last_name,role,status)
       VALUES ($1,$2,$3,$4,'O','W','owner','active')`,
      [owner[t], t, `o@${t.slice(0, 6)}.t`, pw],
    );
  }
  const c = await testPool.query<{ id: string }>(
    `INSERT INTO tenant_connections (gc_tenant_id, sub_tenant_id, status, invited_by) VALUES
       ($1,$2,'active',$3), ($1,$2,'active',$3), ($1,$2,'pending',$3) RETURNING id`,
    [gc, sub, owner[gc]],
  );
  [mainConn, revokeConn, pendingConn] = c.rows.map((r) => r.id);
  await Promise.all(allTenants.map((t) => redis.del(`sub:${t}`)));
});

afterAll(async () => {
  await Promise.all(allTenants.map((t) => redis.del(`sub:${t}`)));
  await testPool.query(
    `DELETE FROM shared_project_events WHERE connection_id IN
       (SELECT id FROM tenant_connections WHERE gc_tenant_id = ANY($1))`,
    [allTenants],
  );
  await testPool.query(`DELETE FROM notifications WHERE tenant_id = ANY($1)`, [allTenants]);
  await testPool.query(`UPDATE tenant_connections SET project_id = NULL WHERE gc_tenant_id = ANY($1) OR sub_tenant_id = ANY($1)`, [allTenants]);
  await testPool.query(`DELETE FROM projects WHERE tenant_id = ANY($1)`, [allTenants]);
  await testPool.query(`DELETE FROM tenant_connections WHERE gc_tenant_id = ANY($1) OR sub_tenant_id = ANY($1)`, [allTenants]);
  await testPool.query(`DELETE FROM audit_log WHERE tenant_id = ANY($1)`, [allTenants]);
  await testPool.query(`DELETE FROM users WHERE tenant_id = ANY($1)`, [allTenants]);
  await testPool.query(`DELETE FROM tenants WHERE id = ANY($1)`, [allTenants]);
  await app.close();
});

describe('closeout checklist + complete FSM', () => {
  const rfiA = randomUUID();
  const rfiB = randomUUID();
  const coA = randomUUID();

  it('checklist counts unanswered RFIs and undecided COs from the ledger', async () => {
    await publishSharedEvent(mainConn, gc, 'rfi.created', { rfi_id: rfiA, number: 1, subject: 'A', status: 'open', due_date: null });
    await publishSharedEvent(mainConn, gc, 'rfi.created', { rfi_id: rfiB, number: 2, subject: 'B', status: 'open', due_date: null });
    await publishSharedEvent(mainConn, sub, 'rfi.answered', { rfi_id: rfiA, number: 1, answer: 'Done', answered_by_tenant_id: sub });
    await publishSharedEvent(mainConn, gc, 'change_order.created', { co_id: coA, title: 'CO-1', amount_cents: 1000, status: 'pending' });
    await publishSharedEvent(mainConn, sub, 'change_order.responded', { co_id: coA, decision: 'approved', note: null, responded_by_tenant_id: sub });

    const res = await app.inject({ method: 'GET', url: `/v1/connections/${mainConn}/closeout`, headers: HNB(token(gc)) });
    expect(res.statusCode).toBe(200);
    expect(res.json().checklist).toEqual({ open_rfis: 1, open_change_orders: 0, open_lien_waivers: 0, clear: false });
    expect(res.json().closeable).toBe(true);

    // Sub sees the same checklist but is not the closing party.
    const subRes = await app.inject({ method: 'GET', url: `/v1/connections/${mainConn}/closeout`, headers: HNB(token(sub)) });
    expect(subRes.json().closeable).toBe(false);
  });

  it('complete blocks on open items without acknowledge_incomplete', async () => {
    const res = await app.inject({ method: 'POST', url: `/v1/connections/${mainConn}/complete`, headers: H(token(gc)), payload: {} });
    expect(res.statusCode).toBe(409);
    expect(res.json().error.code).toBe('CLOSEOUT_INCOMPLETE');
    expect(res.json().details).toEqual({ open_rfis: 1, open_change_orders: 0, open_lien_waivers: 0 });
  });

  it('sub cannot complete; pending connection cannot complete', async () => {
    const subTry = await app.inject({ method: 'POST', url: `/v1/connections/${mainConn}/complete`, headers: H(token(sub)), payload: {} });
    expect(subTry.statusCode).toBe(403);
    const pend = await app.inject({ method: 'POST', url: `/v1/connections/${pendingConn}/complete`, headers: H(token(gc)), payload: {} });
    expect(pend.statusCode).toBe(409);
    expect(pend.json().error.code).toBe('INVALID_STATUS');
  });

  it('complete with acknowledge_incomplete → completed + final ledger event + dual audit + job', async () => {
    vi.mocked(sendJob).mockClear();
    const res = await app.inject({
      method: 'POST', url: `/v1/connections/${mainConn}/complete`, headers: H(token(gc)),
      payload: { acknowledge_incomplete: true },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().connection.status).toBe('completed');

    const row = await testPool.query(`SELECT status, closed_reason, closed_at FROM tenant_connections WHERE id=$1`, [mainConn]);
    expect(row.rows[0]).toMatchObject({ status: 'completed', closed_reason: 'completed' });
    expect(row.rows[0].closed_at).toBeTruthy();

    const last = await testPool.query(
      `SELECT event_type, payload FROM shared_project_events WHERE connection_id=$1 ORDER BY created_at DESC LIMIT 1`,
      [mainConn],
    );
    expect(last.rows[0].event_type).toBe('connection.completed');
    expect(last.rows[0].payload.acknowledged_incomplete).toBe(true);

    const audits = await testPool.query(
      `SELECT tenant_id FROM audit_log WHERE action='connection.completed' AND resource_id=$1`, [mainConn],
    );
    expect(audits.rows.map((r) => r.tenant_id).sort()).toEqual([gc, sub].sort());

    const jobs = vi.mocked(sendJob).mock.calls.filter((c) => c[0] === 'connection.closed');
    expect(jobs).toHaveLength(1);
    expect(jobs[0][1]).toBe(sub);
    expect((jobs[0][2] as Record<string, unknown>).reason_code).toBe('completed');
  });

  it('completed is terminal: complete again 409, revoke 409 ALREADY_CLOSED, writes blocked, reads open', async () => {
    const again = await app.inject({ method: 'POST', url: `/v1/connections/${mainConn}/complete`, headers: H(token(gc)), payload: { acknowledge_incomplete: true } });
    expect(again.statusCode).toBe(409);

    const revoke = await app.inject({ method: 'POST', url: `/v1/connections/${mainConn}/revoke`, headers: H(token(gc)), payload: {} });
    expect(revoke.statusCode).toBe(409);
    expect(revoke.json().error.code).toBe('ALREADY_CLOSED');

    const write = await app.inject({
      method: 'POST', url: `/v1/connections/${mainConn}/events`, headers: H(token(sub)),
      payload: { event_type: 'note.posted', payload: { note: 'too late' } },
    });
    expect(write.statusCode).toBe(409);
    expect(write.json().error.code).toBe('CONNECTION_NOT_ACTIVE');

    const respond = await app.inject({
      method: 'POST', url: `/v1/connections/${mainConn}/rfi-response`, headers: H(token(sub)),
      payload: { rfi_id: rfiB, number: 2, answer: 'archived' },
    });
    expect(respond.statusCode).toBe(409);

    // Read-only archive (§8.3): events, detail and checklist stay readable for both parties.
    const events = await app.inject({ method: 'GET', url: `/v1/connections/${mainConn}/events`, headers: HNB(token(sub)) });
    expect(events.statusCode).toBe(200);
    expect(events.json().events.length).toBeGreaterThan(0);
    const detail = await app.inject({ method: 'GET', url: `/v1/connections/${mainConn}`, headers: HNB(token(gc)) });
    expect(detail.statusCode).toBe(200);
    expect(detail.json().connection.closed_reason).toBe('completed');
    const checklist = await app.inject({ method: 'GET', url: `/v1/connections/${mainConn}/closeout`, headers: HNB(token(sub)) });
    expect(checklist.statusCode).toBe(200);
  });

  it('list filters ?status=completed; re-invite after completed is allowed', async () => {
    const list = await app.inject({ method: 'GET', url: '/v1/connections?status=completed', headers: HNB(token(gc)) });
    expect(list.statusCode).toBe(200);
    expect(list.json().connections.some((c: { id: string }) => c.id === mainConn)).toBe(true);

    // revokeConn + pendingConn are still open — close them so the dup check exercises ONLY 'completed'.
    await testPool.query(`UPDATE tenant_connections SET status='revoked' WHERE id = ANY($1)`, [[revokeConn, pendingConn]]);
    const reinvite = await app.inject({
      method: 'POST', url: '/v1/connections', headers: H(token(gc)),
      payload: { sub_tenant_id: sub },
    });
    expect(reinvite.statusCode).toBe(201);
    // restore for the revoke-reason test below
    await testPool.query(`UPDATE tenant_connections SET status='revoked', closed_reason=NULL WHERE id=$1`, [reinvite.json().connection.id]);
    await testPool.query(`UPDATE tenant_connections SET status='active' WHERE id=$1`, [revokeConn]);
  });
});

describe('revoke reason codes', () => {
  it('revoke stores reason_code + closed_at and forwards it in the job', async () => {
    vi.mocked(sendJob).mockClear();
    const res = await app.inject({
      method: 'POST', url: `/v1/connections/${revokeConn}/revoke`, headers: H(token(gc)),
      payload: { reason_code: 'mutual_agreement' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().reason_code).toBe('mutual_agreement');

    const row = await testPool.query(`SELECT status, closed_reason, closed_at FROM tenant_connections WHERE id=$1`, [revokeConn]);
    expect(row.rows[0]).toMatchObject({ status: 'revoked', closed_reason: 'mutual_agreement' });
    expect(row.rows[0].closed_at).toBeTruthy();

    const jobs = vi.mocked(sendJob).mock.calls.filter((c) => c[0] === 'connection.revoked');
    expect(jobs).toHaveLength(1);
    expect((jobs[0][2] as Record<string, unknown>).reason_code).toBe('mutual_agreement');
  });

  it("revoke with no body defaults to reason 'other'; 'completed' is not a valid revoke reason", async () => {
    // pendingConn was flipped to revoked above; give ourselves a fresh open connection.
    const fresh = await testPool.query<{ id: string }>(
      `INSERT INTO tenant_connections (gc_tenant_id, sub_tenant_id, status, invited_by)
       VALUES ($1,$2,'active',$3) RETURNING id`,
      [gc, sub, owner[gc]],
    );
    const bad = await app.inject({
      method: 'POST', url: `/v1/connections/${fresh.rows[0].id}/revoke`, headers: H(token(gc)),
      payload: { reason_code: 'completed' },
    });
    expect(bad.statusCode).toBe(422);

    const res = await app.inject({ method: 'POST', url: `/v1/connections/${fresh.rows[0].id}/revoke`, headers: HNB(token(gc)) });
    expect(res.statusCode).toBe(200);
    expect(res.json().reason_code).toBe('other');
  });
});

describe('handleConnectionClosed disposition mapping', () => {
  async function mirrorFor(connId: string): Promise<string> {
    const r = await testPool.query<{ id: string }>(
      `INSERT INTO projects (tenant_id, name, status, connection_id) VALUES ($1,'Mirror','active',$2) RETURNING id`,
      [sub, connId],
    );
    return r.rows[0].id;
  }

  it("reason 'completed' → mirror project 'completed'", async () => {
    const mirror = await mirrorFor(mainConn);
    await handleConnectionClosed(sub, { connection_id: mainConn, closed_by_tenant_id: gc, reason_code: 'completed' });
    const p = await testPool.query(`SELECT status FROM projects WHERE id=$1`, [mirror]);
    expect(p.rows[0].status).toBe('completed');
    const note = await testPool.query(
      `SELECT title FROM notifications WHERE tenant_id=$1 ORDER BY created_at DESC LIMIT 1`, [sub],
    );
    expect(note.rows[0].title).toBe('Connection completed');
  });

  it("reason 'terminated_for_cause' → 'on_hold'; absent reason (legacy envelope) → 'on_hold'", async () => {
    const m1 = await mirrorFor(revokeConn);
    await handleConnectionClosed(sub, { connection_id: revokeConn, revoked_by_tenant_id: gc, reason_code: 'terminated_for_cause' });
    expect((await testPool.query(`SELECT status FROM projects WHERE id=$1`, [m1])).rows[0].status).toBe('on_hold');

    const m2 = await mirrorFor(pendingConn);
    await handleConnectionClosed(sub, { connection_id: pendingConn, revoked_by_tenant_id: gc });
    expect((await testPool.query(`SELECT status FROM projects WHERE id=$1`, [m2])).rows[0].status).toBe('on_hold');
  });
});
