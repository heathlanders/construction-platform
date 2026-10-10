// projects-map.test.ts — GET /v1/projects/map (portfolio map pins).
//   - only projects with coordinates are returned
//   - bbox filters to the viewport
//   - status filter
//   - percent_complete = AVG(schedule_tasks.percent_complete)
//
// queue mocked (create path enqueues geocode); fixtures via testPool (BYPASSRLS).

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
import { projectRoutes } from '../routes/v1/projects.js';
import { registerErrorHandler } from '../plugins/error-handler.js';
import type { JWTPayload } from '../middleware/auth.js';

const tenantId = randomUUID();
const ownerId = randomUUID();
const slug = `map-${tenantId.slice(0, 8)}`;
const ownerEmail = `map-owner-${ownerId.slice(0, 8)}@example.com`;

const pIn = randomUUID();        // Madison, active, has tasks
const pOut = randomUUID();       // far away, active
const pCompleted = randomUUID(); // Madison, completed
const pNoCoord = randomUUID();   // no coords — never on the map

const app = Fastify({ logger: false });

function tok(): string {
  return jwt.sign(
    { jti: randomUUID(), user_id: ownerId, tenant_id: tenantId, role: 'OWNER' as const,
      email: ownerEmail, preferred_language: 'en' as const },
    process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
    { expiresIn: 86400 },
  );
}
const H = () => ({ 'user-agent': 'test/1.0', authorization: `Bearer ${tok()}` });
const get = (qs: string) => app.inject({ method: 'GET', url: `/v1/projects/map${qs}`, headers: H() });

beforeAll(async () => {
  registerErrorHandler(app);
  await app.register(projectRoutes, { prefix: '/v1' });
  await app.ready();

  await testPool.query(
    `INSERT INTO tenants (id, name, slug, tier, status) VALUES ($1,'Map Tenant',$2,'professional','active')`,
    [tenantId, slug]);
  const pw = await bcrypt.hash('x', 10);
  await testPool.query(
    `INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, status)
     VALUES ($1,$2,$3,$4,'O','O','owner','active')`,
    [ownerId, tenantId, ownerEmail, pw]);
  await testPool.query(
    `INSERT INTO projects (id, tenant_id, name, status, latitude, longitude, geocode_status)
     VALUES
       ($1,$5,'In',        'active',    43.070000,-89.400000,'exact'),
       ($2,$5,'Out',       'active',    40.000000,-80.000000,'exact'),
       ($3,$5,'Completed', 'completed', 43.100000,-89.410000,'approximate'),
       ($4,$5,'NoCoord',   'active',    NULL,NULL,'failed')`,
    [pIn, pOut, pCompleted, pNoCoord, tenantId]);
  await testPool.query(
    `INSERT INTO schedule_tasks (id, tenant_id, project_id, title, status, percent_complete)
     VALUES ($1,$2,$3,'T1','in_progress',40),($4,$2,$3,'T2','in_progress',60)`,
    [randomUUID(), tenantId, pIn, randomUUID()]);
});

afterAll(async () => {
  await app.close();
  await testPool.query(`DELETE FROM schedule_tasks WHERE tenant_id=$1`, [tenantId]);
  await testPool.query(`DELETE FROM projects WHERE tenant_id=$1`, [tenantId]);
  await testPool.query(`DELETE FROM users WHERE tenant_id=$1`, [tenantId]);
  await testPool.query(`DELETE FROM tenants WHERE id=$1`, [tenantId]);
});

describe('GET /v1/projects/map', () => {
  it('returns only projects with coordinates', async () => {
    const res = await get('');
    expect(res.statusCode).toBe(200);
    const ids = JSON.parse(res.body).projects.map((p: { id: string }) => p.id);
    expect(ids).toContain(pIn);
    expect(ids).toContain(pOut);
    expect(ids).toContain(pCompleted);
    expect(ids).not.toContain(pNoCoord);
  });

  it('bbox filters to the viewport', async () => {
    // Box around Madison — excludes the far-away pOut.
    const res = await get('?bbox=-90,42,-89,44');
    const ids = JSON.parse(res.body).projects.map((p: { id: string }) => p.id);
    expect(ids).toContain(pIn);
    expect(ids).toContain(pCompleted);
    expect(ids).not.toContain(pOut);
  });

  it('status filter', async () => {
    const res = await get('?status=completed');
    const rows = JSON.parse(res.body).projects;
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(pCompleted);
  });

  it('percent_complete = AVG of schedule tasks', async () => {
    const res = await get('');
    const row = JSON.parse(res.body).projects.find((p: { id: string }) => p.id === pIn);
    expect(row.percent_complete).toBeCloseTo(50, 1);
    const done = JSON.parse(res.body).projects.find((p: { id: string }) => p.id === pCompleted);
    expect(done.percent_complete).toBeNull(); // no tasks
  });

  it('bad bbox → 422', async () => {
    const res = await get('?bbox=notabbox');
    expect(res.statusCode).toBe(422);
  });
});
