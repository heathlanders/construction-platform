// milestones.test.ts — Milestone CRUD + version conflict + cross-tenant isolation
// Routes: GET /v1/milestones, POST /v1/milestones, PATCH /v1/milestones/:id, DELETE /v1/milestones/:id

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import Fastify from 'fastify';
import jwt from 'jsonwebtoken';
import { testPool } from './setup.js';
import { milestoneRoutes } from '../routes/v1/milestones.js';
import { registerErrorHandler } from '../plugins/error-handler.js';
import type { JWTPayload } from '../middleware/auth.js';

const tenantId = randomUUID();
const ownerId = randomUUID();
const memberId = randomUUID();
const foreignTenantId = randomUUID();
const tenantSlug = `milestones-test-${tenantId.slice(0, 8)}`;
let projectId: string;
const createdMilestoneIds: string[] = [];

const app = Fastify({ logger: false });

function makeToken(overrides: Partial<JWTPayload> = {}): string {
  return jwt.sign(
    {
      jti: randomUUID(),
      user_id: ownerId,
      tenant_id: tenantId,
      role: 'OWNER' as const,
      email: `owner-${ownerId.slice(0, 8)}@example.com`,
      preferred_language: 'en' as const,
      ...overrides,
    },
    process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
    { expiresIn: 86400 }
  );
}

beforeAll(async () => {
  registerErrorHandler(app);
  await app.register(milestoneRoutes, { prefix: '/v1' });
  await app.ready();

  await testPool.query(
    `INSERT INTO tenants (id, name, slug, tier, status)
     VALUES ($1,'Milestones Tenant',$2,'professional','active'),
            ($3,'Foreign Tenant','foreign-${foreignTenantId.slice(0,8)}','starter','active')`,
    [tenantId, tenantSlug, foreignTenantId]
  );

  await testPool.query(
    `INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, status)
     VALUES ($1,$2,'owner@milestones.test','x','Milestone','Owner','owner','active'),
            ($3,$2,'ft@milestones.test','x','Field','Tech','field_tech','active')`,
    [ownerId, tenantId, memberId]
  );

  const { rows } = await testPool.query(
    `INSERT INTO projects (tenant_id, name, status, created_by)
     VALUES ($1,'Milestone Project','active',$2) RETURNING id`,
    [tenantId, ownerId]
  );
  projectId = rows[0].id;
});

afterAll(async () => {
  await app.close();
  if (createdMilestoneIds.length > 0) {
    await testPool.query(`DELETE FROM milestones WHERE id = ANY($1::uuid[])`, [createdMilestoneIds]);
  }
  await testPool.query(`DELETE FROM milestones WHERE tenant_id IN ($1,$2)`, [tenantId, foreignTenantId]);
  await testPool.query(`DELETE FROM projects WHERE tenant_id IN ($1,$2)`, [tenantId, foreignTenantId]);
  await testPool.query(`DELETE FROM users WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM tenants WHERE id IN ($1,$2)`, [tenantId, foreignTenantId]);
});

describe('POST /v1/milestones', () => {
  it('creates a milestone and returns 201', async () => {
    const token = makeToken();
    const res = await app.inject({
      method: 'POST', url: '/v1/milestones',
      headers: { 'user-agent': 'test/1.0', authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ project_id: projectId, title: 'Foundation Complete', due_date: '2026-08-01' }),
    });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.milestone.title).toBe('Foundation Complete');
    expect(body.milestone.project_id).toBe(projectId);
    expect(body.milestone.version).toBe(1);
    createdMilestoneIds.push(body.milestone.id);
  });

  it('returns 422 for missing title', async () => {
    const token = makeToken();
    const res = await app.inject({
      method: 'POST', url: '/v1/milestones',
      headers: { 'user-agent': 'test/1.0', authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ project_id: projectId }),
    });
    expect(res.statusCode).toBe(422);
    expect(JSON.parse(res.body).error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 403 for FIELD_TECH role', async () => {
    const token = makeToken({ role: 'FIELD_TECH', user_id: memberId, email: 'ft@milestones.test' });
    const res = await app.inject({
      method: 'POST', url: '/v1/milestones',
      headers: { 'user-agent': 'test/1.0', authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ project_id: projectId, title: 'Should Fail' }),
    });
    expect(res.statusCode).toBe(403);
  });
});

describe('GET /v1/milestones', () => {
  it('returns 200 with milestones list for own tenant project', async () => {
    const token = makeToken();
    const res = await app.inject({
      method: 'GET', url: `/v1/milestones?project_id=${projectId}`,
      headers: { 'user-agent': 'test/1.0', authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(Array.isArray(body.milestones)).toBe(true);
    expect(body.pagination).toHaveProperty('has_more');
  });

  it('returns empty list for foreign tenant project (RLS isolation)', async () => {
    const { rows } = await testPool.query(
      `INSERT INTO projects (tenant_id, name, status) VALUES ($1,'Foreign Project','active') RETURNING id`,
      [foreignTenantId]
    );
    const foreignProjectId = rows[0].id;
    await testPool.query(
      `INSERT INTO milestones (tenant_id, project_id, title) VALUES ($1,$2,'Secret Milestone')`,
      [foreignTenantId, foreignProjectId]
    );

    const token = makeToken();
    const res = await app.inject({
      method: 'GET', url: `/v1/milestones?project_id=${foreignProjectId}`,
      headers: { 'user-agent': 'test/1.0', authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).milestones).toHaveLength(0);
  });
});

describe('PATCH /v1/milestones/:id', () => {
  let milestoneId: string;

  beforeAll(async () => {
    const token = makeToken();
    const r = await app.inject({
      method: 'POST', url: '/v1/milestones',
      headers: { 'user-agent': 'test/1.0', authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ project_id: projectId, title: 'PATCH Target' }),
    });
    milestoneId = JSON.parse(r.body).milestone.id;
    createdMilestoneIds.push(milestoneId);
  });

  it('updates milestone and increments version (200)', async () => {
    const token = makeToken();
    const res = await app.inject({
      method: 'PATCH', url: `/v1/milestones/${milestoneId}`,
      headers: { 'user-agent': 'test/1.0', authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Updated Milestone', version: 1 }),
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.milestone.title).toBe('Updated Milestone');
    expect(body.milestone.version).toBe(2);
  });

  it('returns 409 on version conflict (stale version)', async () => {
    const token = makeToken();
    const res = await app.inject({
      method: 'PATCH', url: `/v1/milestones/${milestoneId}`,
      headers: { 'user-agent': 'test/1.0', authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Conflict Title', version: 1 }), // stale — current version is 2
    });
    expect(res.statusCode).toBe(409);
    expect(JSON.parse(res.body).error.code).toBe('VERSION_CONFLICT');
  });

  it('marks milestone complete via completed_at', async () => {
    const token = makeToken();
    const completedAt = new Date().toISOString();
    const res = await app.inject({
      method: 'PATCH', url: `/v1/milestones/${milestoneId}`,
      headers: { 'user-agent': 'test/1.0', authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ completed_at: completedAt, version: 2 }),
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).milestone.completed_at).toBeTruthy();
  });
});

describe('DELETE /v1/milestones/:id', () => {
  it('soft-deletes milestone and returns 204', async () => {
    const token = makeToken();
    const createRes = await app.inject({
      method: 'POST', url: '/v1/milestones',
      headers: { 'user-agent': 'test/1.0', authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ project_id: projectId, title: 'To Be Deleted' }),
    });
    const milestoneId = JSON.parse(createRes.body).milestone.id;

    const deleteRes = await app.inject({
      method: 'DELETE', url: `/v1/milestones/${milestoneId}`,
      headers: { 'user-agent': 'test/1.0', authorization: `Bearer ${token}` },
    });
    expect(deleteRes.statusCode).toBe(204);

    // Deleted milestone must not appear in list
    const listRes = await app.inject({
      method: 'GET', url: `/v1/milestones?project_id=${projectId}`,
      headers: { 'user-agent': 'test/1.0', authorization: `Bearer ${token}` },
    });
    const ids = (JSON.parse(listRes.body).milestones as Array<{ id: string }>).map(m => m.id);
    expect(ids).not.toContain(milestoneId);
  });
});
