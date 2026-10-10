// cross-tenant-lifecycle.test.ts — v1.1 user-accessible bridge (P-02).
//   Lookup (slug/email, anti-enumeration), invite with project+scope, decline (no addon gate),
//   accept → Doc 07 §6 sub-project instantiation + project.location bridge event, true detail
//   endpoint, generic-event whitelist, revoke → async disposition job + archived reads.
// Locked decisions: A-07, T-44, T-45, PR-08.

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
import { publishIfActive } from '../lib/cross-tenant/bridge.js';

const gc = randomUUID();          // business GC
const sub = randomUUID();         // business sub — full accept flow
const subLimited = randomUUID();  // starter + addon, at project limit — accept 402 then decline
const subNoAddon = randomUUID();  // professional, NO addon — decline must still work
const outsider = randomUUID();    // business — non-member 403 checks

const owner: Record<string, string> = {
  [gc]: randomUUID(), [sub]: randomUUID(), [subLimited]: randomUUID(),
  [subNoAddon]: randomUUID(), [outsider]: randomUUID(),
};
const allTenants = [gc, sub, subLimited, subNoAddon, outsider];
const gcProjectId = randomUUID();
const outsiderProjectId = randomUUID();
const gcSlug = `gc-${gc.slice(0, 8)}`;

const app = Fastify({ logger: false });

function token(tenantId: string): string {
  return jwt.sign(
    { jti: randomUUID(), user_id: owner[tenantId], tenant_id: tenantId, role: 'OWNER', email: `owner@${tenantId.slice(0, 6)}.test`, preferred_language: 'en' },
    process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
    { expiresIn: 86400 },
  );
}
const H = (t: string) => ({ 'user-agent': 'test-runner/1.0', authorization: `Bearer ${t}`, 'content-type': 'application/json' });
const HNoBody = (t: string) => ({ 'user-agent': 'test-runner/1.0', authorization: `Bearer ${t}` });

beforeAll(async () => {
  registerErrorHandler(app);
  await app.register(connectionRoutes, { prefix: '/v1' });
  await app.ready();

  await testPool.query(
    `INSERT INTO tenants (id,name,slug,tier,status) VALUES
       ($1,'Apex General Contractors',$6,'business','active'),
       ($2,'Volt Electric',$7,'business','active'),
       ($3,'Tiny Plumbing',$8,'starter','active'),
       ($4,'Frugal HVAC',$9,'professional','active'),
       ($5,'Bystander Builders',$10,'business','active')`,
    [gc, sub, subLimited, subNoAddon, outsider,
     gcSlug, `sub-${sub.slice(0, 8)}`, `lim-${subLimited.slice(0, 8)}`,
     `noaddon-${subNoAddon.slice(0, 8)}`, `out-${outsider.slice(0, 8)}`],
  );
  // subLimited: starter WITH the add-on (so the tier gate passes and the PROJECT limit is what trips).
  await testPool.query(
    `INSERT INTO tenant_subscriptions (tenant_id, tier, status, addon_cross_tenant)
     VALUES ($1, 'starter', 'active', true)`,
    [subLimited],
  );

  const pw = await bcrypt.hash('x', 10);
  for (const t of allTenants) {
    await testPool.query(
      `INSERT INTO users (id,tenant_id,email,password_hash,first_name,last_name,role,status)
       VALUES ($1,$2,$3,$4,'O','W','owner','active')`,
      [owner[t], t, `owner@${t.slice(0, 6)}.test`, pw],
    );
  }

  // GC's shareable project (with a geocoded site) + a foreign project owned by outsider.
  await testPool.query(
    `INSERT INTO projects (id, tenant_id, name, status, address, city, state, zip, latitude, longitude, geocode_status)
     VALUES ($1, $2, 'Main St Office', 'active', '123 Main St', 'Madison', 'WI', '53703', 43.0731, -89.4012, 'exact'),
            ($3, $4, 'Not Yours', 'active', NULL, NULL, NULL, NULL, NULL, NULL, 'pending')`,
    [gcProjectId, gc, outsiderProjectId, outsider],
  );
  // subLimited sits AT the starter project limit (5).
  for (let i = 0; i < 5; i++) {
    await testPool.query(
      `INSERT INTO projects (tenant_id, name, status) VALUES ($1, $2, 'active')`,
      [subLimited, `Filler ${i}`],
    );
  }

  await Promise.all(allTenants.map((t) => redis.del(`sub:${t}`)));
});

afterAll(async () => {
  await Promise.all(allTenants.map((t) => redis.del(`sub:${t}`)));
  await testPool.query(
    `DELETE FROM shared_project_events WHERE connection_id IN
       (SELECT id FROM tenant_connections WHERE gc_tenant_id = ANY($1) OR sub_tenant_id = ANY($1))`,
    [allTenants],
  );
  // Circular FK: connections.project_id ↔ projects.connection_id — unlink before deleting.
  await testPool.query(`UPDATE tenant_connections SET project_id = NULL WHERE gc_tenant_id = ANY($1) OR sub_tenant_id = ANY($1)`, [allTenants]);
  await testPool.query(`DELETE FROM projects WHERE tenant_id = ANY($1)`, [allTenants]);
  await testPool.query(`DELETE FROM tenant_connections WHERE gc_tenant_id = ANY($1) OR sub_tenant_id = ANY($1)`, [allTenants]);
  await testPool.query(`DELETE FROM audit_log WHERE tenant_id = ANY($1)`, [allTenants]);
  await testPool.query(`DELETE FROM tenant_subscriptions WHERE tenant_id = ANY($1)`, [allTenants]);
  await testPool.query(`DELETE FROM users WHERE tenant_id = ANY($1)`, [allTenants]);
  await testPool.query(`DELETE FROM tenants WHERE id = ANY($1)`, [allTenants]);
  await app.close();
});

describe('connection lookup (slug / email)', () => {
  it('resolves a tenant by exact slug → name only', async () => {
    const res = await app.inject({ method: 'GET', url: `/v1/connections/lookup?slug=${gcSlug}`, headers: HNoBody(token(sub)) });
    expect(res.statusCode).toBe(200);
    expect(res.json().tenant).toEqual({ tenant_id: gc, name: 'Apex General Contractors' });
  });

  it('resolves a tenant by exact user email', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/v1/connections/lookup?email=${encodeURIComponent(`owner@${sub.slice(0, 6)}.test`)}`,
      headers: HNoBody(token(gc)),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().tenant.tenant_id).toBe(sub);
  });

  it('miss → uniform 404 (anti-enumeration)', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/connections/lookup?slug=does-not-exist-xyz', headers: HNoBody(token(gc)) });
    expect(res.statusCode).toBe(404);
    expect(res.json().error.code).toBe('NOT_FOUND');
  });

  it('both slug and email → 422', async () => {
    const res = await app.inject({ method: 'GET', url: `/v1/connections/lookup?slug=x&email=a%40b.co`, headers: HNoBody(token(gc)) });
    expect(res.statusCode).toBe(422);
  });
});

describe('invite with project + scope', () => {
  it('rejects a project_id the caller does not own → 404 PROJECT_NOT_FOUND', async () => {
    const res = await app.inject({
      method: 'POST', url: '/v1/connections', headers: H(token(gc)),
      payload: { sub_tenant_id: sub, project_id: outsiderProjectId },
    });
    expect(res.statusCode).toBe(404);
    expect(res.json().error.code).toBe('PROJECT_NOT_FOUND');
  });

  it('creates the connection with project/scope/value and enriches the invite job', async () => {
    const res = await app.inject({
      method: 'POST', url: '/v1/connections', headers: H(token(gc)),
      payload: { sub_tenant_id: sub, project_id: gcProjectId, scope_description: 'Electrical rough-in', contract_value_cents: 4500000 },
    });
    expect(res.statusCode).toBe(201);
    const conn = res.json().connection;
    expect(conn.project_id).toBe(gcProjectId);
    expect(conn.scope_description).toBe('Electrical rough-in');
    expect(Number(conn.contract_value_cents)).toBe(4500000);
    const call = vi.mocked(sendJob).mock.calls.find((c) => c[0] === 'connection.invite_sent');
    expect(call).toBeDefined();
    expect((call![2] as Record<string, unknown>).project_name).toBe('Main St Office');
  });
});

describe('decline (no addon gate) + re-invite', () => {
  let connId = '';

  it('a Professional sub WITHOUT the add-on can still decline → 200 rejected', async () => {
    const inv = await app.inject({
      method: 'POST', url: '/v1/connections', headers: H(token(gc)),
      payload: { sub_tenant_id: subNoAddon },
    });
    expect(inv.statusCode).toBe(201);
    connId = inv.json().connection.id;

    const res = await app.inject({ method: 'POST', url: `/v1/connections/${connId}/decline`, headers: HNoBody(token(subNoAddon)) });
    expect(res.statusCode).toBe(200);
    expect(res.json().connection.status).toBe('rejected');
  });

  it('only the sub may decline — GC gets uniform 403', async () => {
    const inv = await app.inject({
      method: 'POST', url: '/v1/connections', headers: H(token(gc)),
      payload: { sub_tenant_id: subNoAddon },
    });
    // rejected rows don't block a fresh invite (re-invite path)
    expect(inv.statusCode).toBe(201);
    const fresh = inv.json().connection.id;
    const res = await app.inject({ method: 'POST', url: `/v1/connections/${fresh}/decline`, headers: HNoBody(token(gc)) });
    expect(res.statusCode).toBe(403);
    const again = await app.inject({ method: 'POST', url: `/v1/connections/${fresh}/decline`, headers: HNoBody(token(subNoAddon)) });
    expect(again.statusCode).toBe(200);
  });
});

describe('accept → sub project instantiation (Doc 07 §6)', () => {
  let connId = '';
  let subProjectId = '';

  it('accept blocked at the sub project limit → 402, connection stays pending', async () => {
    const inv = await app.inject({
      method: 'POST', url: '/v1/connections', headers: H(token(gc)),
      payload: { sub_tenant_id: subLimited, project_id: gcProjectId, scope_description: 'Plumbing' },
    });
    expect(inv.statusCode).toBe(201);
    const id = inv.json().connection.id;
    const res = await app.inject({ method: 'POST', url: `/v1/connections/${id}/accept`, headers: HNoBody(token(subLimited)) });
    expect(res.statusCode).toBe(402);
    expect(res.json().error.code).toBe('PROJECT_LIMIT_REACHED');
    const chk = await testPool.query(`SELECT status FROM tenant_connections WHERE id=$1`, [id]);
    expect(chk.rows[0].status).toBe('pending');
    // No mirror project was created.
    const proj = await testPool.query(`SELECT 1 FROM projects WHERE tenant_id=$1 AND connection_id IS NOT NULL`, [subLimited]);
    expect(proj.rowCount).toBe(0);
  });

  it('accept creates a real project in the SUB tenant with copied site fields', async () => {
    const conn = await testPool.query<{ id: string }>(
      `SELECT id FROM tenant_connections WHERE gc_tenant_id=$1 AND sub_tenant_id=$2 AND status='pending'`,
      [gc, sub],
    );
    connId = conn.rows[0].id;

    const res = await app.inject({ method: 'POST', url: `/v1/connections/${connId}/accept`, headers: HNoBody(token(sub)) });
    expect(res.statusCode).toBe(200);
    expect(res.json().connection.status).toBe('active');
    const project = res.json().project;
    expect(project).toBeTruthy();
    subProjectId = project.id;
    expect(project.name).toBe('Main St Office — Electrical rough-in (Apex General Contractors)');

    const row = await testPool.query(
      `SELECT tenant_id, city, state, latitude, geocode_status, connection_id, status
         FROM projects WHERE id=$1`,
      [subProjectId],
    );
    expect(row.rows[0].tenant_id).toBe(sub);
    expect(row.rows[0].city).toBe('Madison');
    expect(Number(row.rows[0].latitude)).toBeCloseTo(43.0731, 3);
    expect(row.rows[0].geocode_status).toBe('exact');
    expect(row.rows[0].connection_id).toBe(connId);
    expect(row.rows[0].status).toBe('active');
  });

  it('accept materialized a project.location bridge event with source = GC', async () => {
    const ev = await testPool.query(
      `SELECT source_tenant_id, payload FROM shared_project_events
        WHERE connection_id=$1 AND event_type='project.location'`,
      [connId],
    );
    expect(ev.rowCount).toBe(1);
    expect(ev.rows[0].source_tenant_id).toBe(gc);
    expect(ev.rows[0].payload.project_name).toBe('Main St Office');
    expect(ev.rows[0].payload.lat).toBeCloseTo(43.0731, 3);
    // Whitelist: no address/zip ever crosses in the map payload.
    expect(ev.rows[0].payload.address).toBeUndefined();
    expect(ev.rows[0].payload.zip).toBeUndefined();
  });

  it('the governed snapshot copy is audited in BOTH tenants', async () => {
    const audits = await testPool.query(
      `SELECT tenant_id FROM audit_log WHERE action='connection.project_snapshot_copied' AND resource_id=$1`,
      [connId],
    );
    const tenants = audits.rows.map((r) => r.tenant_id).sort();
    expect(tenants).toEqual([gc, sub].sort());
  });

  it('true detail: sub sees names + my_project; GC sees my_project null; outsider 403', async () => {
    const subView = await app.inject({ method: 'GET', url: `/v1/connections/${connId}`, headers: HNoBody(token(sub)) });
    expect(subView.statusCode).toBe(200);
    const c = subView.json().connection;
    expect(c.gc_tenant_name).toBe('Apex General Contractors');
    expect(c.sub_tenant_name).toBe('Volt Electric');
    expect(c.your_side).toBe('sub');
    expect(c.project_name).toBe('Main St Office');
    expect(c.my_project.id).toBe(subProjectId);

    const gcView = await app.inject({ method: 'GET', url: `/v1/connections/${connId}`, headers: HNoBody(token(gc)) });
    expect(gcView.statusCode).toBe(200);
    expect(gcView.json().connection.your_side).toBe('gc');
    expect(gcView.json().connection.my_project).toBeNull();

    const outView = await app.inject({ method: 'GET', url: `/v1/connections/${connId}`, headers: HNoBody(token(outsider)) });
    expect(outView.statusCode).toBe(403);
  });

  it('generic events endpoint: reserved + unknown types 422, whitelisted type 201', async () => {
    const reserved = await app.inject({
      method: 'POST', url: `/v1/connections/${connId}/events`, headers: H(token(gc)),
      payload: { event_type: 'project.location', payload: { lat: 0, lng: 0 } },
    });
    expect(reserved.statusCode).toBe(422);
    expect(reserved.json().error.code).toBe('EVENT_TYPE_NOT_ALLOWED');

    const unknown = await app.inject({
      method: 'POST', url: `/v1/connections/${connId}/events`, headers: H(token(gc)),
      payload: { event_type: 'foo.bar', payload: {} },
    });
    expect(unknown.statusCode).toBe(422);

    const badPayload = await app.inject({
      method: 'POST', url: `/v1/connections/${connId}/events`, headers: H(token(gc)),
      payload: { event_type: 'note.posted', payload: { note: '' } },
    });
    expect(badPayload.statusCode).toBe(422);

    const ok = await app.inject({
      method: 'POST', url: `/v1/connections/${connId}/events`, headers: H(token(gc)),
      payload: { event_type: 'note.posted', payload: { note: 'Crew on site Monday' } },
    });
    expect(ok.statusCode).toBe(201);
  });

  it('revoke → disposition job to the SUB; history stays readable; new writes blocked', async () => {
    vi.mocked(sendJob).mockClear();
    const res = await app.inject({ method: 'POST', url: `/v1/connections/${connId}/revoke`, headers: HNoBody(token(gc)) });
    expect(res.statusCode).toBe(200);

    const revokeJob = vi.mocked(sendJob).mock.calls.find((c) => c[0] === 'connection.revoked');
    expect(revokeJob).toBeDefined();
    expect(revokeJob![1]).toBe(sub); // envelope tenant = the SUB (T-10)

    // Archived reads stay open for members (Doc 07 §8.3)
    const events = await app.inject({ method: 'GET', url: `/v1/connections/${connId}/events`, headers: HNoBody(token(sub)) });
    expect(events.statusCode).toBe(200);
    expect(events.json().events.length).toBeGreaterThan(0);

    // New writes blocked — generic endpoint 409, and publishIfActive refuses at publish time (T-45)
    const post = await app.inject({
      method: 'POST', url: `/v1/connections/${connId}/events`, headers: H(token(gc)),
      payload: { event_type: 'note.posted', payload: { note: 'too late' } },
    });
    expect(post.statusCode).toBe(409);
    const silent = await publishIfActive(connId, gc, 'change_order.updated', { co_id: randomUUID(), title: 'x', amount_cents: 1, status: 'approved' });
    expect(silent).toBeNull();
  });
});
