// projects.test.ts — Project CRUD + member management + tier enforcement
// Routes: POST /v1/projects, GET /v1/projects, GET /v1/projects/:id
//         GET /v1/projects/:id/members, POST /v1/projects/:id/members,
//         DELETE /v1/projects/:id/members/:memberId
// Locked decisions: A-01, A-03, T-01, T-03, T-11, PR-01 (Starter project limit = 5)

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import Fastify from 'fastify';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// POST /v1/projects enqueues geocode.project — stub the queue so create stays hermetic (no pg-boss).
vi.mock('../lib/queue.js', () => ({
  sendJob: vi.fn().mockResolvedValue(undefined),
  getQueue: vi.fn(),
  stopQueue: vi.fn().mockResolvedValue(undefined),
}));

import { testPool } from './setup.js';
import { projectRoutes } from '../routes/v1/projects.js';
import { registerErrorHandler } from '../plugins/error-handler.js';
import type { JWTPayload } from '../middleware/auth.js';

// ─── Test fixtures ────────────────────────────────────────────────────────────

const tenantId = randomUUID();
const ownerId = randomUUID();
const memberId = randomUUID();
const tenantSlug = `projects-test-${tenantId.slice(0, 8)}`;
const ownerEmail = `projects-owner-${ownerId.slice(0, 8)}@example.com`;
const memberEmail = `projects-member-${memberId.slice(0, 8)}@example.com`;

const createdProjectIds: string[] = [];

// ─── Test app ─────────────────────────────────────────────────────────────────

const app = Fastify({ logger: false });

// ─── Token helper ─────────────────────────────────────────────────────────────

function makeToken(overrides: Partial<JWTPayload> = {}): string {
  return jwt.sign(
    {
      jti: randomUUID(),
      user_id: ownerId,
      tenant_id: tenantId,
      role: 'OWNER' as const,
      email: ownerEmail,
      preferred_language: 'en' as const,
      ...overrides,
    },
    process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
    { expiresIn: 86400 }
  );
}

// ─── Setup / teardown ────────────────────────────────────────────────────────

beforeAll(async () => {
  registerErrorHandler(app);
  await app.register(projectRoutes, { prefix: '/v1' });
  await app.ready();

  await testPool.query(
    `INSERT INTO tenants (id, name, slug, tier, status)
     VALUES ($1, 'Projects Test Tenant', $2, 'professional', 'active')`,
    [tenantId, tenantSlug]
  );

  const pwHash = await bcrypt.hash('test-password-123', 10);
  await testPool.query(
    `INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, status)
     VALUES ($1, $2, $3, $4, 'Test', 'Owner', 'owner', 'active'),
            ($5, $2, $6, $4, 'Test', 'Member', 'field_tech', 'active')`,
    [ownerId, tenantId, ownerEmail, pwHash, memberId, memberEmail]
  );
});

afterAll(async () => {
  await app.close();
  if (createdProjectIds.length > 0) {
    await testPool.query(
      `DELETE FROM project_members WHERE project_id = ANY($1::uuid[])`,
      [createdProjectIds]
    );
    await testPool.query(
      `DELETE FROM projects WHERE id = ANY($1::uuid[])`,
      [createdProjectIds]
    );
  }
  await testPool.query(`DELETE FROM users WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM tenants WHERE id = $1`, [tenantId]);
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /v1/projects', () => {
  it('creates a project and returns 201', async () => {
    const token = makeToken();
    const res = await app.inject({
      method: 'POST',
      url: '/v1/projects',
      headers: { 'user-agent': 'test-runner/1.0', authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Test Project Alpha', status: 'active', city: 'Austin', state: 'TX' }),
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.project).toBeDefined();
    expect(body.project.name).toBe('Test Project Alpha');
    expect(body.project.tenant_id).toBe(tenantId);
    expect(body.project.id).toBeTruthy();
    createdProjectIds.push(body.project.id);
  });

  it('returns 422 for missing required fields', async () => {
    const token = makeToken();
    const res = await app.inject({
      method: 'POST',
      url: '/v1/projects',
      headers: { 'user-agent': 'test-runner/1.0', authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({}), // name is required
    });
    expect(res.statusCode).toBe(422);
    const body = JSON.parse(res.body);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 403 for FIELD_TECH (insufficient role)', async () => {
    const token = makeToken({ role: 'FIELD_TECH', user_id: memberId, email: memberEmail });
    const res = await app.inject({
      method: 'POST',
      url: '/v1/projects',
      headers: { 'user-agent': 'test-runner/1.0', authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Should Fail' }),
    });
    expect(res.statusCode).toBe(403);
  });
});

describe('GET /v1/projects', () => {
  it('returns 200 with project list — RLS filters to own tenant', async () => {
    const token = makeToken();
    const res = await app.inject({
      method: 'GET',
      url: '/v1/projects',
      headers: { 'user-agent': 'test-runner/1.0', authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(Array.isArray(body.projects)).toBe(true);
    expect(body.pagination).toHaveProperty('has_more');
    // All returned projects must belong to this tenant (RLS assertion)
    for (const p of body.projects as Array<{ tenant_id: string }>) {
      expect(p.tenant_id).toBe(tenantId);
    }
  });

  it('supports cursor-based pagination (T-01)', async () => {
    // Create 3 projects to paginate
    const token = makeToken();
    const pids: string[] = [];
    for (let i = 0; i < 3; i++) {
      const r = await app.inject({
        method: 'POST',
        url: '/v1/projects',
        headers: { 'user-agent': 'test-runner/1.0', authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ name: `Pagination Project ${i}` }),
      });
      const b = JSON.parse(r.body);
      pids.push(b.project.id);
      createdProjectIds.push(b.project.id);
    }

    // Fetch with limit=1, then use cursor
    const first = await app.inject({
      method: 'GET',
      url: '/v1/projects?limit=1',
      headers: { 'user-agent': 'test-runner/1.0', authorization: `Bearer ${token}` },
    });
    const firstBody = JSON.parse(first.body);
    expect(firstBody.projects).toHaveLength(1);
    expect(firstBody.pagination.has_more).toBe(true);
    expect(firstBody.pagination.next_cursor).toBeTruthy();

    // Second page
    const second = await app.inject({
      method: 'GET',
      url: `/v1/projects?limit=1&cursor=${firstBody.pagination.next_cursor}`,
      headers: { 'user-agent': 'test-runner/1.0', authorization: `Bearer ${token}` },
    });
    const secondBody = JSON.parse(second.body);
    expect(secondBody.projects).toHaveLength(1);
    // Second page project must differ from first page
    expect(secondBody.projects[0].id).not.toBe(firstBody.projects[0].id);
  });
});

describe('GET /v1/projects/:id', () => {
  it('returns 200 for an existing project in the same tenant', async () => {
    const token = makeToken();
    const createRes = await app.inject({
      method: 'POST',
      url: '/v1/projects',
      headers: { 'user-agent': 'test-runner/1.0', authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Get By ID Project' }),
    });
    const { project } = JSON.parse(createRes.body);
    createdProjectIds.push(project.id);

    const res = await app.inject({
      method: 'GET',
      url: `/v1/projects/${project.id}`,
      headers: { 'user-agent': 'test-runner/1.0', authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).project.id).toBe(project.id);
  });

  it('returns 404 for a project in a different tenant (RLS isolation)', async () => {
    // Create a project for a foreign tenant via direct pool (bypasses RLS)
    const foreignTenantId = randomUUID();
    const foreignProjectId = randomUUID();
    await testPool.query(
      `INSERT INTO tenants (id, name, slug, tier, status) VALUES ($1, 'Foreign', $2, 'starter', 'active')`,
      [foreignTenantId, `foreign-${foreignTenantId.slice(0, 8)}`]
    );
    await testPool.query(
      `INSERT INTO projects (id, tenant_id, name, status) VALUES ($1, $2, 'Foreign Project', 'active')`,
      [foreignProjectId, foreignTenantId]
    );

    // Query as our tenant — RLS must block access
    const token = makeToken();
    const res = await app.inject({
      method: 'GET',
      url: `/v1/projects/${foreignProjectId}`,
      headers: { 'user-agent': 'test-runner/1.0', authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(404);

    // Cleanup
    await testPool.query(`DELETE FROM projects WHERE id = $1`, [foreignProjectId]);
    await testPool.query(`DELETE FROM tenants WHERE id = $1`, [foreignTenantId]);
  });
});

describe('Project members — POST + DELETE /v1/projects/:id/members', () => {
  let projectId: string;

  beforeAll(async () => {
    const token = makeToken();
    const r = await app.inject({
      method: 'POST',
      url: '/v1/projects',
      headers: { 'user-agent': 'test-runner/1.0', authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Members Test Project' }),
    });
    projectId = JSON.parse(r.body).project.id;
    createdProjectIds.push(projectId);
  });

  it('adds a tenant user as project member (201)', async () => {
    const token = makeToken();
    const res = await app.inject({
      method: 'POST',
      url: `/v1/projects/${projectId}/members`,
      headers: { 'user-agent': 'test-runner/1.0', authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ user_id: memberId, role: 'field_tech' }),
    });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.member.user_id).toBe(memberId);
  });

  it('lists project members (200)', async () => {
    const token = makeToken();
    const res = await app.inject({
      method: 'GET',
      url: `/v1/projects/${projectId}/members`,
      headers: { 'user-agent': 'test-runner/1.0', authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(Array.isArray(body.members)).toBe(true);
    const found = body.members.find((m: { user_id: string }) => m.user_id === memberId);
    expect(found).toBeDefined();
  });

  it('removes a project member (204)', async () => {
    const token = makeToken();

    // Get the member record ID
    const listRes = await app.inject({
      method: 'GET',
      url: `/v1/projects/${projectId}/members`,
      headers: { 'user-agent': 'test-runner/1.0', authorization: `Bearer ${token}` },
    });
    const members = JSON.parse(listRes.body).members as Array<{ id: string; user_id: string }>;
    const memberRecord = members.find((m) => m.user_id === memberId);
    expect(memberRecord).toBeDefined();

    const deleteRes = await app.inject({
      method: 'DELETE',
      url: `/v1/projects/${projectId}/members/${memberRecord!.id}`,
      headers: { 'user-agent': 'test-runner/1.0', authorization: `Bearer ${token}` },
    });
    expect(deleteRes.statusCode).toBe(204);
  });
});

describe('POST /v1/projects — tier enforcement (Starter project limit = 5)', () => {
  it('returns 402 when Starter tenant hits 5-project limit', async () => {
    // Seed a fresh tenant so this test doesn't interfere with others
    const capTenantId = randomUUID();
    const capOwnerId = randomUUID();
    await testPool.query(
      `INSERT INTO tenants (id, name, slug, tier, status)
       VALUES ($1, 'Cap Tenant', $2, 'starter', 'active')`,
      [capTenantId, `cap-${capTenantId.slice(0, 8)}`]
    );
    await testPool.query(
      `INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, status)
       VALUES ($1, $2, $3, 'x', 'Cap', 'Owner', 'owner', 'active')`,
      [capOwnerId, capTenantId, `capowner-${capOwnerId.slice(0, 8)}@example.com`]
    );

    // Seed 5 projects directly (at the limit)
    const seedProjectIds: string[] = [];
    for (let i = 0; i < 5; i++) {
      const pid = randomUUID();
      seedProjectIds.push(pid);
      await testPool.query(
        `INSERT INTO projects (id, tenant_id, name, status) VALUES ($1, $2, $3, 'active')`,
        [pid, capTenantId, `Seeded Project ${i}`]
      );
    }

    // Invalidate subscription cache
    const { redis } = await import('../lib/redis.js');
    await redis.del(`sub:${capTenantId}`);

    const token = jwt.sign(
      {
        jti: randomUUID(),
        user_id: capOwnerId,
        tenant_id: capTenantId,
        role: 'OWNER' as const,
        email: `capowner-${capOwnerId.slice(0, 8)}@example.com`,
        preferred_language: 'en' as const,
      },
      process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
      { expiresIn: 86400 }
    );

    const res = await app.inject({
      method: 'POST',
      url: '/v1/projects',
      headers: { 'user-agent': 'test-runner/1.0', authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Should Be Blocked' }),
    });

    expect(res.statusCode).toBe(402);
    const body = JSON.parse(res.body);
    expect(body.error.code).toBe('PROJECT_LIMIT_REACHED');

    // Cleanup
    await testPool.query(`DELETE FROM projects WHERE id = ANY($1::uuid[])`, [seedProjectIds]);
    await testPool.query(`DELETE FROM users WHERE id = $1`, [capOwnerId]);
    await testPool.query(`DELETE FROM tenants WHERE id = $1`, [capTenantId]);
  });
});
