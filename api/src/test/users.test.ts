// users.test.ts — User CRUD + invite + tier enforcement integration tests
// Routes: GET /v1/users, POST /v1/users, GET /v1/users/:id, PATCH /v1/users/:id, DELETE /v1/users/:id
// Locked decisions: A-05, T-03, T-11, PR-01 (Starter user limit = 5)

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import Fastify from 'fastify';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { testPool } from './setup.js';
import { userRoutes } from '../routes/v1/users.js';
import { registerErrorHandler } from '../plugins/error-handler.js';
import type { JWTPayload } from '../middleware/auth.js';

// ─── Test fixtures ────────────────────────────────────────────────────────────

const tenantId = randomUUID();
const ownerId = randomUUID();
const tenantSlug = `users-test-${tenantId.slice(0, 8)}`;
const ownerEmail = `owner-${ownerId.slice(0, 8)}@example.com`;

// Additional user IDs created during tests — tracked for cleanup
const createdUserIds: string[] = [];

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
  await app.register(userRoutes, { prefix: '/v1' });
  await app.ready();

  // Seed tenant as Starter (5-user limit)
  await testPool.query(
    `INSERT INTO tenants (id, name, slug, tier, status)
     VALUES ($1, 'Users Test Tenant', $2, 'starter', 'active')`,
    [tenantId, tenantSlug]
  );

  const passwordHash = await bcrypt.hash('test-password-123', 10);
  await testPool.query(
    `INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, status)
     VALUES ($1, $2, $3, $4, 'Test', 'Owner', 'owner', 'active')`,
    [ownerId, tenantId, ownerEmail, passwordHash]
  );
});

afterAll(async () => {
  await app.close();
  // Clean up created users first (FK dependency on tenant)
  if (createdUserIds.length > 0) {
    await testPool.query(
      `DELETE FROM users WHERE id = ANY($1::uuid[])`,
      [createdUserIds]
    );
  }
  await testPool.query(`DELETE FROM users WHERE id = $1`, [ownerId]);
  await testPool.query(`DELETE FROM tenants WHERE id = $1`, [tenantId]);
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('GET /v1/users', () => {
  it('returns 200 with paginated user list for OWNER', async () => {
    const token = makeToken();
    const res = await app.inject({
      method: 'GET',
      url: '/v1/users',
      headers: { 'user-agent': 'test-runner/1.0', authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body).toHaveProperty('users');
    expect(body).toHaveProperty('pagination');
    expect(Array.isArray(body.users)).toBe(true);
    // Owner user should appear in the list
    const ownerInList = body.users.find((u: { id: string }) => u.id === ownerId);
    expect(ownerInList).toBeDefined();
  });

  it('returns 403 for FIELD_TECH (insufficient role)', async () => {
    const token = makeToken({ role: 'FIELD_TECH' });
    const res = await app.inject({
      method: 'GET',
      url: '/v1/users',
      headers: { 'user-agent': 'test-runner/1.0', authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(403);
    const body = JSON.parse(res.body);
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('returns 401 with no token', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/users',
      headers: { 'user-agent': 'test-runner/1.0' },
    });
    expect(res.statusCode).toBe(401);
  });
});

describe('GET /v1/users/:id', () => {
  it('returns 200 with user for valid id in same tenant', async () => {
    const token = makeToken();
    const res = await app.inject({
      method: 'GET',
      url: `/v1/users/${ownerId}`,
      headers: { 'user-agent': 'test-runner/1.0', authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.user.id).toBe(ownerId);
    expect(body.user.email).toBe(ownerEmail);
    // Ensure password_hash is never exposed
    expect(body.user.password_hash).toBeUndefined();
  });

  it('returns 404 for non-existent user (RLS isolation — T-03)', async () => {
    const token = makeToken();
    const res = await app.inject({
      method: 'GET',
      url: `/v1/users/${randomUUID()}`,
      headers: { 'user-agent': 'test-runner/1.0', authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(404);
  });
});

describe('PATCH /v1/users/:id', () => {
  it('OWNER can update language_preference', async () => {
    const token = makeToken();
    const res = await app.inject({
      method: 'PATCH',
      url: `/v1/users/${ownerId}`,
      headers: { 'user-agent': 'test-runner/1.0', authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ language_preference: 'es' }),
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.user.language_preference).toBe('es');

    // Restore to 'en'
    await app.inject({
      method: 'PATCH',
      url: `/v1/users/${ownerId}`,
      headers: { 'user-agent': 'test-runner/1.0', authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ language_preference: 'en' }),
    });
  });

  it('non-OWNER cannot change another user\'s role', async () => {
    const token = makeToken({ role: 'PROJECT_MANAGER', user_id: randomUUID() });
    const res = await app.inject({
      method: 'PATCH',
      url: `/v1/users/${ownerId}`,
      headers: { 'user-agent': 'test-runner/1.0', authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ role: 'estimator' }),
    });
    // Non-owner editing another user → 403
    expect(res.statusCode).toBe(403);
  });
});

describe('DELETE /v1/users/:id', () => {
  it('OWNER can soft-delete a user (deactivate)', async () => {
    // Create a user to deactivate
    const targetId = randomUUID();
    createdUserIds.push(targetId);
    const pwHash = await bcrypt.hash('pass', 10);
    await testPool.query(
      `INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, status)
       VALUES ($1, $2, $3, $4, 'To', 'Delete', 'estimator', 'active')`,
      [targetId, tenantId, `del-${targetId.slice(0, 8)}@example.com`, pwHash]
    );

    const token = makeToken();
    const res = await app.inject({
      method: 'DELETE',
      url: `/v1/users/${targetId}`,
      headers: { 'user-agent': 'test-runner/1.0', authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(204);

    // Verify soft-deleted user no longer appears in list
    const getRes = await app.inject({
      method: 'GET',
      url: `/v1/users/${targetId}`,
      headers: { 'user-agent': 'test-runner/1.0', authorization: `Bearer ${token}` },
    });
    expect(getRes.statusCode).toBe(404);
  });

  it('returns 400 when OWNER tries to deactivate themselves', async () => {
    const token = makeToken();
    const res = await app.inject({
      method: 'DELETE',
      url: `/v1/users/${ownerId}`,
      headers: { 'user-agent': 'test-runner/1.0', authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.error.code).toBe('CANNOT_DEACTIVATE_SELF');
  });
});

describe('POST /v1/users — tier enforcement', () => {
  /**
   * Starter tier = 5 users max (PR-01).
   * The tenant already has 1 user (owner). Seed 4 more to hit the limit,
   * then verify the 6th attempt returns 402.
   */
  it('returns 402 when Starter tenant hits 5-user limit', async () => {
    // Seed 4 more users (bringing total to 5 — at the limit)
    const seedIds: string[] = [];
    for (let i = 0; i < 4; i++) {
      const uid = randomUUID();
      seedIds.push(uid);
      createdUserIds.push(uid);
      await testPool.query(
        `INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, status)
         VALUES ($1, $2, $3, 'x', 'Filler', 'User', 'field_tech', 'active')`,
        [uid, tenantId, `filler-${uid.slice(0, 8)}@example.com`]
      );
    }

    // Invalidate subscription cache so the count is fresh
    const { redis } = await import('../lib/redis.js');
    await redis.del(`sub:${tenantId}`);

    // 6th user attempt → 402
    const token = makeToken();
    const res = await app.inject({
      method: 'POST',
      url: '/v1/users',
      headers: { 'user-agent': 'test-runner/1.0', authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        email: `newuser-${randomUUID().slice(0, 8)}@example.com`,
        first_name: 'New',
        last_name: 'User',
        role: 'field_tech',
      }),
    });

    expect(res.statusCode).toBe(402);
    const body = JSON.parse(res.body);
    expect(body.error.code).toBe('USER_LIMIT_REACHED');
    expect(body.error.upgrade_to).toBe('PROFESSIONAL');
  });
});
