// cross-tenant-map.test.ts — Doc 20 Phase 6b cross-tenant site layer + revoke disposition worker.
//   GET /v1/connections/map returns the latest counterparty project.location pin per ACTIVE
//   connection (source != caller — T-45 membership in the WHERE); addon-gated (PR-08).
//   publishProjectLocationForProject fans a GC pin to sharing connections only.
//   handleConnectionClosed (no reason_code) puts the sub's mirror project on_hold + notifies OWNER/PM.

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
import { connectionRoutes } from '../routes/v1/connections.js';
import { projectRoutes } from '../routes/v1/projects.js';
import { registerErrorHandler } from '../plugins/error-handler.js';
import { publishSharedEvent, publishProjectLocationForProject } from '../lib/cross-tenant/bridge.js';
import { handleConnectionClosed } from '../workers/stripe-worker.js';

const gc = randomUUID();       // business
const sub = randomUUID();      // business
const pro = randomUUID();      // professional, no addon → map 402
const owner: Record<string, string> = { [gc]: randomUUID(), [sub]: randomUUID(), [pro]: randomUUID() };
const allTenants = [gc, sub, pro];

const gcProjectId = randomUUID();
let activeConn = '';
let revokedConn = '';

const app = Fastify({ logger: false });

function token(tenantId: string): string {
  return jwt.sign(
    { jti: randomUUID(), user_id: owner[tenantId], tenant_id: tenantId, role: 'OWNER', email: `o@${tenantId.slice(0, 6)}.t`, preferred_language: 'en' },
    process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
    { expiresIn: 86400 },
  );
}
const HNoBody = (t: string) => ({ 'user-agent': 'test-runner/1.0', authorization: `Bearer ${t}` });

beforeAll(async () => {
  registerErrorHandler(app);
  await app.register(connectionRoutes, { prefix: '/v1' });
  await app.register(projectRoutes, { prefix: '/v1' });
  await app.ready();

  await testPool.query(
    `INSERT INTO tenants (id,name,slug,tier,status) VALUES
       ($1,'Map GC',$4,'business','active'),
       ($2,'Map Sub',$5,'business','active'),
       ($3,'Map Pro',$6,'professional','active')`,
    [gc, sub, pro, `mgc-${gc.slice(0, 8)}`, `msub-${sub.slice(0, 8)}`, `mpro-${pro.slice(0, 8)}`],
  );
  const pw = await bcrypt.hash('x', 10);
  for (const t of allTenants) {
    await testPool.query(
      `INSERT INTO users (id,tenant_id,email,password_hash,first_name,last_name,role,status)
       VALUES ($1,$2,$3,$4,'O','W','owner','active')`,
      [owner[t], t, `o@${t.slice(0, 6)}.t`, pw],
    );
  }
  await testPool.query(
    `INSERT INTO projects (id, tenant_id, name, status, city, state, latitude, longitude, geocode_status)
     VALUES ($1, $2, 'Site Alpha', 'active', 'Madison', 'WI', 43.07, -89.40, 'exact')`,
    [gcProjectId, gc],
  );

  // One ACTIVE connection sharing the project, one REVOKED connection with a stale pin.
  const a = await testPool.query<{ id: string }>(
    `INSERT INTO tenant_connections (gc_tenant_id, sub_tenant_id, status, project_id, scope_description)
     VALUES ($1, $2, 'active', $3, 'Electrical') RETURNING id`,
    [gc, sub, gcProjectId],
  );
  activeConn = a.rows[0].id;
  const r = await testPool.query<{ id: string }>(
    `INSERT INTO tenant_connections (gc_tenant_id, sub_tenant_id, status, project_id)
     VALUES ($1, $2, 'revoked', $3) RETURNING id`,
    [gc, sub, gcProjectId],
  );
  revokedConn = r.rows[0].id;
  // Stale pin on the revoked connection — must NOT surface.
  await publishSharedEvent(revokedConn, gc, 'project.location', {
    project_name: 'Old Site', lat: 1, lng: 1, status: 'active', geocode_status: 'exact', city: null, state: null,
  });

  await Promise.all(allTenants.map((t) => redis.del(`sub:${t}`)));
});

afterAll(async () => {
  await Promise.all(allTenants.map((t) => redis.del(`sub:${t}`)));
  await testPool.query(
    `DELETE FROM shared_project_events WHERE connection_id IN
       (SELECT id FROM tenant_connections WHERE gc_tenant_id = ANY($1) OR sub_tenant_id = ANY($1))`,
    [allTenants],
  );
  await testPool.query(`DELETE FROM notifications WHERE tenant_id = ANY($1)`, [allTenants]);
  // Circular FK: connections.project_id ↔ projects.connection_id — unlink before deleting.
  await testPool.query(`UPDATE tenant_connections SET project_id = NULL WHERE gc_tenant_id = ANY($1) OR sub_tenant_id = ANY($1)`, [allTenants]);
  await testPool.query(`DELETE FROM projects WHERE tenant_id = ANY($1)`, [allTenants]);
  await testPool.query(`DELETE FROM tenant_connections WHERE gc_tenant_id = ANY($1) OR sub_tenant_id = ANY($1)`, [allTenants]);
  await testPool.query(`DELETE FROM audit_log WHERE tenant_id = ANY($1)`, [allTenants]);
  await testPool.query(`DELETE FROM users WHERE tenant_id = ANY($1)`, [allTenants]);
  await testPool.query(`DELETE FROM tenants WHERE id = ANY($1)`, [allTenants]);
  await app.close();
});

describe('publishProjectLocationForProject', () => {
  it('publishes one pin to the ACTIVE sharing connection only (revoked skipped)', async () => {
    await publishProjectLocationForProject(gc, gcProjectId, {
      name: 'Site Alpha', latitude: 43.07, longitude: -89.4, status: 'active',
      geocode_status: 'exact', city: 'Madison', state: 'WI',
    });
    const active = await testPool.query(
      `SELECT payload FROM shared_project_events WHERE connection_id=$1 AND event_type='project.location'`,
      [activeConn],
    );
    expect(active.rowCount).toBe(1);
    expect(active.rows[0].payload.project_name).toBe('Site Alpha');
    // Revoked connection still has only its original stale event.
    const revoked = await testPool.query(
      `SELECT COUNT(*)::int AS n FROM shared_project_events WHERE connection_id=$1 AND event_type='project.location'`,
      [revokedConn],
    );
    expect(revoked.rows[0].n).toBe(1);
  });
});

describe('GET /v1/connections/map', () => {
  it('sub sees the GC pin with counterparty name; revoked connection excluded', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/connections/map', headers: HNoBody(token(sub)) });
    expect(res.statusCode).toBe(200);
    const pins = res.json().pins;
    expect(pins).toHaveLength(1);
    expect(pins[0].connection_id).toBe(activeConn);
    expect(pins[0].counterparty_name).toBe('Map GC');
    expect(pins[0].project_name).toBe('Site Alpha');
    expect(pins[0].lat).toBeCloseTo(43.07, 2);
  });

  it('GC sees no pins until the sub publishes (source != caller)', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/connections/map', headers: HNoBody(token(gc)) });
    expect(res.statusCode).toBe(200);
    expect(res.json().pins).toHaveLength(0);
  });

  it('latest event wins per connection', async () => {
    await publishSharedEvent(activeConn, gc, 'project.location', {
      project_name: 'Site Alpha (moved)', lat: 44.5, lng: -88.0, status: 'active',
      geocode_status: 'exact', city: 'Green Bay', state: 'WI',
    });
    const res = await app.inject({ method: 'GET', url: '/v1/connections/map', headers: HNoBody(token(sub)) });
    const pins = res.json().pins;
    expect(pins).toHaveLength(1);
    expect(pins[0].project_name).toBe('Site Alpha (moved)');
    expect(pins[0].lat).toBeCloseTo(44.5, 2);
  });

  it('Professional without the add-on → 402 ADDON_REQUIRED (web gated banner)', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/connections/map', headers: HNoBody(token(pro)) });
    expect(res.statusCode).toBe(402);
    expect(res.json().error.code).toBe('ADDON_REQUIRED');
  });
});

describe('sub→GC location publishing (mirror project pin)', () => {
  let mirrorId = '';

  it('sub pin-drop on the mirror project publishes back to the GC (source = sub)', async () => {
    const mirror = await testPool.query<{ id: string }>(
      `INSERT INTO projects (tenant_id, name, status, connection_id, geocode_status)
       VALUES ($1, 'Mirror — Site Alpha (sub)', 'active', $2, 'pending') RETURNING id`,
      [sub, activeConn],
    );
    mirrorId = mirror.rows[0].id;

    // Real route: sub drops a pin on their own mirror project.
    const res = await app.inject({
      method: 'PATCH',
      url: `/v1/projects/${mirrorId}/location`,
      headers: { ...HNoBody(token(sub)), 'content-type': 'application/json' },
      payload: { latitude: 43.1, longitude: -89.5, version: 1 },
    });
    expect(res.statusCode).toBe(200);

    // The route fans out fire-and-forget (`void publish...`) — poll for the event landing.
    for (let i = 0; i < 20; i++) {
      const { rows } = await testPool.query(
        `SELECT 1 FROM shared_project_events WHERE connection_id=$1 AND source_tenant_id=$2 AND event_type='project.location'`,
        [activeConn, sub],
      );
      if (rows.length > 0) break;
      await new Promise((r) => setTimeout(r, 50));
    }

    // GC's map now shows the sub-sourced pin.
    const map = await app.inject({ method: 'GET', url: '/v1/connections/map', headers: HNoBody(token(gc)) });
    expect(map.statusCode).toBe(200);
    const pins = map.json().pins;
    expect(pins).toHaveLength(1);
    expect(pins[0].connection_id).toBe(activeConn);
    expect(pins[0].counterparty_name).toBe('Map Sub');
    expect(pins[0].project_name).toBe('Mirror — Site Alpha (sub)');
    expect(pins[0].lat).toBeCloseTo(43.1, 2);

    // Sub's own map still shows the GC pin (both directions coexist; source != caller each way).
    const subMap = await app.inject({ method: 'GET', url: '/v1/connections/map', headers: HNoBody(token(sub)) });
    expect(subMap.json().pins).toHaveLength(1);
    expect(subMap.json().pins[0].counterparty_name).toBe('Map GC');
  });

  it('publishes nothing for a mirror on a non-active connection', async () => {
    await publishProjectLocationForProject(sub, mirrorId, {
      name: 'Should not publish', latitude: 1, longitude: 1, status: 'active',
      geocode_status: 'exact', city: null, state: null, connection_id: revokedConn,
    });
    const evs = await testPool.query(
      `SELECT COUNT(*)::int AS n FROM shared_project_events
        WHERE connection_id=$1 AND event_type='project.location' AND source_tenant_id=$2`,
      [revokedConn, sub],
    );
    expect(evs.rows[0].n).toBe(0);
  });
});

describe('handleConnectionClosed (worker)', () => {
  it('puts the sub mirror project on_hold and notifies sub OWNER/PM', async () => {
    // Seed a mirror project in the sub tenant linked to the active connection, then revoke it.
    const mirror = await testPool.query<{ id: string }>(
      `INSERT INTO projects (tenant_id, name, status, connection_id)
       VALUES ($1, 'Mirror — Site Alpha', 'active', $2) RETURNING id`,
      [sub, activeConn],
    );
    await testPool.query(`UPDATE tenant_connections SET status='revoked' WHERE id=$1`, [activeConn]);

    await handleConnectionClosed(sub, { connection_id: activeConn, revoked_by_tenant_id: gc });

    const proj = await testPool.query(`SELECT status FROM projects WHERE id=$1`, [mirror.rows[0].id]);
    expect(proj.rows[0].status).toBe('on_hold');

    const notes = await testPool.query(
      `SELECT user_id, category FROM notifications WHERE tenant_id=$1 AND category='cross_tenant'`,
      [sub],
    );
    expect(notes.rowCount).toBeGreaterThan(0);
    expect(notes.rows[0].user_id).toBe(owner[sub]);
  });
});
