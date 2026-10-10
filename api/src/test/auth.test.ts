// auth.test.ts — Auth flow integration tests
// Tests the full auth path end-to-end through the Fastify app:
// login → JWT issued → /me returns user → logout → token blacklisted
//
// Uses app.inject() — no real HTTP listener needed.
// Locked decisions: A-05, T-09, T-11

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import Fastify from 'fastify';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { testPool } from './setup.js';
import { authRoutes } from '../routes/v1/auth.js';
import { userRoutes } from '../routes/v1/users.js';
import type { JWTPayload } from '../middleware/auth.js';

// ─── Test fixtures ────────────────────────────────────────────────────────────

const tenantId = randomUUID();
const userId = randomUUID();
const tenantSlug = `auth-test-${tenantId.slice(0, 8)}`;
const userEmail = `auth-test-${userId.slice(0, 8)}@example.com`;
const userPassword = 'test-password-secure-123';

// ─── Minimal test Fastify app ─────────────────────────────────────────────────

// We don't import api/src/index.ts because it calls start() at module level.
// Instead, we create a minimal app with just the routes under test.
const app = Fastify({ logger: false });

// ─── Setup / teardown ────────────────────────────────────────────────────────

beforeAll(async () => {
  // Register routes
  await app.register(authRoutes, { prefix: '/v1' });
  await app.register(userRoutes, { prefix: '/v1' });
  await app.ready();

  // Seed test tenant (direct pool — no RLS needed for tenants table)
  await testPool.query(
    `INSERT INTO tenants (id, name, slug, tier, status)
     VALUES ($1, 'Auth Test Tenant', $2, 'professional', 'active')`,
    [tenantId, tenantSlug]
  );

  // Seed test user with hashed password
  const passwordHash = await bcrypt.hash(userPassword, 10);
  await testPool.query(
    `INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, status)
     VALUES ($1, $2, $3, $4, 'Test', 'User', 'owner', 'active')`,
    [userId, tenantId, userEmail, passwordHash]
  );
});

afterAll(async () => {
  await app.close();
  // Clean up in dependency order
  await testPool.query(`DELETE FROM users WHERE id = $1`, [userId]);
  await testPool.query(`DELETE FROM tenants WHERE id = $1`, [tenantId]);
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /v1/auth/login', () => {
  it('returns 200 + valid JWT on correct credentials', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      headers: { 'user-agent': 'test-runner/1.0', 'content-type': 'application/json' },
      body: JSON.stringify({
        email: userEmail,
        password: userPassword,
        tenant_slug: tenantSlug,
        platform: 'web',
      }),
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body).toHaveProperty('token');
    expect(body).toHaveProperty('user');
    expect(body.user.email).toBe(userEmail);
    expect(body.user.role).toBe('owner');
    expect(body.user.tenant_id).toBe(tenantId);

    // JWT must have correct claims (A-05)
    const decoded = jwt.decode(body.token) as JWTPayload;
    expect(decoded.tenant_id).toBe(tenantId);
    expect(decoded.user_id).toBe(userId);
    expect(decoded.role).toBe('OWNER');
    expect(decoded.jti).toBeTruthy();
  });

  it('returns 401 on wrong password', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      headers: { 'user-agent': 'test-runner/1.0', 'content-type': 'application/json' },
      body: JSON.stringify({
        email: userEmail,
        password: 'wrong-password',
        tenant_slug: tenantSlug,
        platform: 'web',
      }),
    });

    expect(res.statusCode).toBe(401);
    const body = JSON.parse(res.body);
    expect(body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('returns 401 on unknown tenant slug', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      headers: { 'user-agent': 'test-runner/1.0', 'content-type': 'application/json' },
      body: JSON.stringify({
        email: userEmail,
        password: userPassword,
        tenant_slug: 'does-not-exist',
        platform: 'web',
      }),
    });

    expect(res.statusCode).toBe(401);
  });
});

describe('GET /v1/users/me', () => {
  let validToken: string;

  beforeAll(async () => {
    // Get a fresh token for these tests
    const res = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      headers: { 'user-agent': 'test-runner/1.0', 'content-type': 'application/json' },
      body: JSON.stringify({
        email: userEmail,
        password: userPassword,
        tenant_slug: tenantSlug,
        platform: 'web',
      }),
    });
    validToken = JSON.parse(res.body).token;
  });

  it('returns 200 with user profile for valid token', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/users/me',
      headers: {
        'user-agent': 'test-runner/1.0',
        authorization: `Bearer ${validToken}`,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.id).toBe(userId);
    expect(body.email).toBe(userEmail);
    expect(body.tenant_id).toBe(tenantId);
    // Note: route sends user object directly (not wrapped in { user: ... })
  });

  it('returns 401 with no token', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/users/me',
      headers: { 'user-agent': 'test-runner/1.0' },
    });

    expect(res.statusCode).toBe(401);
  });

  it('returns 400 without User-Agent header (T-11)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/users/me',
      // Explicitly empty user-agent to override Fastify inject's default
      headers: { authorization: `Bearer ${validToken}`, 'user-agent': '' },
    });

    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.error.code).toBe('MISSING_USER_AGENT');
  });
});

describe('POST /v1/auth/logout', () => {
  it('blacklists token so subsequent requests return 401', async () => {
    // Obtain a token
    const loginRes = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      headers: { 'user-agent': 'test-runner/1.0', 'content-type': 'application/json' },
      body: JSON.stringify({
        email: userEmail,
        password: userPassword,
        tenant_slug: tenantSlug,
        platform: 'web',
      }),
    });
    const { token } = JSON.parse(loginRes.body);

    // Confirm token works before logout
    const beforeLogout = await app.inject({
      method: 'GET',
      url: '/v1/users/me',
      headers: { 'user-agent': 'test-runner/1.0', authorization: `Bearer ${token}` },
    });
    expect(beforeLogout.statusCode).toBe(200);

    // Logout
    const logoutRes = await app.inject({
      method: 'POST',
      url: '/v1/auth/logout',
      headers: { 'user-agent': 'test-runner/1.0', authorization: `Bearer ${token}` },
    });
    expect(logoutRes.statusCode).toBe(204);

    // Token must now be blacklisted
    const afterLogout = await app.inject({
      method: 'GET',
      url: '/v1/users/me',
      headers: { 'user-agent': 'test-runner/1.0', authorization: `Bearer ${token}` },
    });
    expect(afterLogout.statusCode).toBe(401);
    const body = JSON.parse(afterLogout.body);
    expect(body.error.code).toBe('TOKEN_REVOKED');
  });
});
