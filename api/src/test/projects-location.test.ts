// projects-location.test.ts — PATCH /v1/projects/:id/location (manual pin-drop, Project Map).
//   - OWNER sets coords → 200, geocode_status='exact', version bumped
//   - stale version → 409 VERSION_CONFLICT + server_record
//   - FIELD_TECH → 403 (OWNER/PM only)
//   - unknown id → 404
//
// queue is mocked so the create path's geocode enqueue is a no-op (we only exercise PATCH here).

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
const techId = randomUUID();
const projectId = randomUUID();
const slug = `loc-${tenantId.slice(0, 8)}`;
const ownerEmail = `loc-owner-${ownerId.slice(0, 8)}@example.com`;
const techEmail = `loc-tech-${techId.slice(0, 8)}@example.com`;

const app = Fastify({ logger: false });

function tok(overrides: Partial<JWTPayload> = {}): string {
  return jwt.sign(
    { jti: randomUUID(), user_id: ownerId, tenant_id: tenantId, role: 'OWNER' as const,
      email: ownerEmail, preferred_language: 'en' as const, ...overrides },
    process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
    { expiresIn: 86400 },
  );
}
const techTok = () => tok({ role: 'FIELD_TECH', user_id: techId, email: techEmail });
const H = (t: string) => ({ 'user-agent': 'test/1.0', authorization: `Bearer ${t}`, 'content-type': 'application/json' });

beforeAll(async () => {
  registerErrorHandler(app);
  await app.register(projectRoutes, { prefix: '/v1' });
  await app.ready();

  await testPool.query(
    `INSERT INTO tenants (id, name, slug, tier, status) VALUES ($1,'Loc Tenant',$2,'professional','active')`,
    [tenantId, slug]);
  const pw = await bcrypt.hash('x', 10);
  await testPool.query(
    `INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, status)
     VALUES ($1,$2,$3,$4,'O','O','owner','active'),($5,$2,$6,$4,'T','T','field_tech','active')`,
    [ownerId, tenantId, ownerEmail, pw, techId, techEmail]);
  await testPool.query(
    `INSERT INTO projects (id, tenant_id, name, status, version) VALUES ($1,$2,'Pin Project','active',1)`,
    [projectId, tenantId]);
});

afterAll(async () => {
  await app.close();
  await testPool.query(`DELETE FROM audit_log WHERE tenant_id=$1`, [tenantId]);
  await testPool.query(`DELETE FROM projects WHERE tenant_id=$1`, [tenantId]);
  await testPool.query(`DELETE FROM users WHERE tenant_id=$1`, [tenantId]);
  await testPool.query(`DELETE FROM tenants WHERE id=$1`, [tenantId]);
});

describe('PATCH /v1/projects/:id/location', () => {
  it('OWNER sets coords → 200, exact, version bumped', async () => {
    const res = await app.inject({
      method: 'PATCH', url: `/v1/projects/${projectId}/location`, headers: H(tok()),
      body: JSON.stringify({ latitude: 43.0731, longitude: -89.4012, version: 1 }),
    });
    expect(res.statusCode).toBe(200);
    const { project } = JSON.parse(res.body);
    expect(project.geocode_status).toBe('exact');
    expect(Number(project.latitude)).toBeCloseTo(43.0731, 4);
    expect(Number(project.longitude)).toBeCloseTo(-89.4012, 4);
    expect(project.version).toBe(2);
  });

  it('stale version → 409 VERSION_CONFLICT with server_record', async () => {
    const res = await app.inject({
      method: 'PATCH', url: `/v1/projects/${projectId}/location`, headers: H(tok()),
      body: JSON.stringify({ latitude: 40, longitude: -80, version: 1 }),
    });
    expect(res.statusCode).toBe(409);
    const b = JSON.parse(res.body);
    expect(b.error.code).toBe('VERSION_CONFLICT');
    expect(b.server_record.version).toBe(2);
  });

  it('FIELD_TECH → 403', async () => {
    const res = await app.inject({
      method: 'PATCH', url: `/v1/projects/${projectId}/location`, headers: H(techTok()),
      body: JSON.stringify({ latitude: 43, longitude: -89, version: 2 }),
    });
    expect(res.statusCode).toBe(403);
  });

  it('unknown project → 404', async () => {
    const res = await app.inject({
      method: 'PATCH', url: `/v1/projects/${randomUUID()}/location`, headers: H(tok()),
      body: JSON.stringify({ latitude: 43, longitude: -89, version: 1 }),
    });
    expect(res.statusCode).toBe(404);
  });

  it('out-of-range latitude → 422', async () => {
    const res = await app.inject({
      method: 'PATCH', url: `/v1/projects/${projectId}/location`, headers: H(tok()),
      body: JSON.stringify({ latitude: 200, longitude: -89, version: 2 }),
    });
    expect(res.statusCode).toBe(422);
  });
});
