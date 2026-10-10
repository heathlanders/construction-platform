// api-keys.test.ts — Enterprise API key generation, listing, revocation
// Routes: GET /v1/api-keys, POST /v1/api-keys, DELETE /v1/api-keys/:id
// Locked decisions: PR-04 (Enterprise tier), T-03

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import Fastify from 'fastify';
import jwt from 'jsonwebtoken';
import { testPool } from './setup.js';
import { apiKeyRoutes } from '../routes/v1/api-keys.js';
import { registerErrorHandler } from '../plugins/error-handler.js';
import { redis } from '../lib/redis.js';
import type { JWTPayload } from '../middleware/auth.js';

const starterTenantId = randomUUID();
const enterpriseTenantId = randomUUID();
const starterOwnerId = randomUUID();
const enterpriseOwnerId = randomUUID();

const app = Fastify({ logger: false });

function makeToken(tenantId: string, userId: string, email: string): string {
  return jwt.sign(
    {
      jti: randomUUID(),
      user_id: userId,
      tenant_id: tenantId,
      role: 'OWNER' as const,
      email,
      preferred_language: 'en' as const,
    },
    process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
    { expiresIn: 86400 }
  );
}

beforeAll(async () => {
  registerErrorHandler(app);
  await app.register(apiKeyRoutes, { prefix: '/v1' });
  await app.ready();

  await testPool.query(
    `INSERT INTO tenants (id, name, slug, tier, status)
     VALUES ($1,'Starter API Keys','starter-api-keys-${starterTenantId.slice(0,8)}','starter','active'),
            ($2,'Enterprise API Keys','enterprise-api-keys-${enterpriseTenantId.slice(0,8)}','enterprise','active')`,
    [starterTenantId, enterpriseTenantId]
  );
  await testPool.query(
    `INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, status)
     VALUES ($1,$2,'owner@starter-keys.test','x','Starter','Owner','owner','active'),
            ($3,$4,'owner@enterprise-keys.test','x','Enterprise','Owner','owner','active')`,
    [starterOwnerId, starterTenantId, enterpriseOwnerId, enterpriseTenantId]
  );
  // Explicit subscription rows so tier-enforcement doesn't fall back to tenants.tier
  await testPool.query(
    `INSERT INTO tenant_subscriptions (tenant_id, tier, status, addon_gc_module, addon_cross_tenant)
     VALUES ($1,'starter','active',false,false),
            ($2,'enterprise','active',true,true)`,
    [starterTenantId, enterpriseTenantId]
  );

  // Bust subscription cache so fresh rows are read
  await redis.del(`sub:${starterTenantId}`);
  await redis.del(`sub:${enterpriseTenantId}`);
});

afterAll(async () => {
  await app.close();
  await testPool.query(`DELETE FROM api_keys WHERE tenant_id IN ($1,$2)`, [starterTenantId, enterpriseTenantId]);
  await testPool.query(`DELETE FROM tenant_subscriptions WHERE tenant_id IN ($1,$2)`, [starterTenantId, enterpriseTenantId]);
  await testPool.query(`DELETE FROM users WHERE tenant_id IN ($1,$2)`, [starterTenantId, enterpriseTenantId]);
  await testPool.query(`DELETE FROM tenants WHERE id IN ($1,$2)`, [starterTenantId, enterpriseTenantId]);
});

describe('POST /v1/api-keys', () => {
  it('returns 402 TIER_REQUIRED for Starter tenant', async () => {
    const token = makeToken(starterTenantId, starterOwnerId, 'owner@starter-keys.test');
    const res = await app.inject({
      method: 'POST', url: '/v1/api-keys',
      headers: { 'user-agent': 'test/1.0', authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'My Key' }),
    });
    expect(res.statusCode).toBe(402);
    const body = JSON.parse(res.body);
    expect(body.error.code).toBe('TIER_REQUIRED');
  });

  it('returns 201 with raw key for Enterprise tenant (key starts with pk_live_)', async () => {
    const token = makeToken(enterpriseTenantId, enterpriseOwnerId, 'owner@enterprise-keys.test');
    const res = await app.inject({
      method: 'POST', url: '/v1/api-keys',
      headers: { 'user-agent': 'test/1.0', authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Production Key' }),
    });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.api_key.key).toMatch(/^pk_live_[0-9a-f]{64}$/);
    expect(body.api_key.name).toBe('Production Key');
    expect(body.api_key.id).toBeTruthy();
    expect(body.api_key.key_hash).toBeUndefined(); // never returned
  });
});

describe('GET /v1/api-keys', () => {
  it('returns 402 for Starter tenant', async () => {
    const token = makeToken(starterTenantId, starterOwnerId, 'owner@starter-keys.test');
    const res = await app.inject({
      method: 'GET', url: '/v1/api-keys',
      headers: { 'user-agent': 'test/1.0', authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(402);
  });

  it('returns 200 list for Enterprise tenant without key_hash', async () => {
    const token = makeToken(enterpriseTenantId, enterpriseOwnerId, 'owner@enterprise-keys.test');
    const res = await app.inject({
      method: 'GET', url: '/v1/api-keys',
      headers: { 'user-agent': 'test/1.0', authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(Array.isArray(body.api_keys)).toBe(true);
    for (const k of body.api_keys as Array<Record<string, unknown>>) {
      expect(k.key_hash).toBeUndefined();
      expect(k.id).toBeTruthy();
      expect(k.name).toBeTruthy();
    }
  });
});

describe('DELETE /v1/api-keys/:id', () => {
  it('revokes key and returns 204; key shows revoked_at in subsequent list', async () => {
    const token = makeToken(enterpriseTenantId, enterpriseOwnerId, 'owner@enterprise-keys.test');

    const createRes = await app.inject({
      method: 'POST', url: '/v1/api-keys',
      headers: { 'user-agent': 'test/1.0', authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Key To Revoke' }),
    });
    const keyId = JSON.parse(createRes.body).api_key.id;

    const deleteRes = await app.inject({
      method: 'DELETE', url: `/v1/api-keys/${keyId}`,
      headers: { 'user-agent': 'test/1.0', authorization: `Bearer ${token}` },
    });
    expect(deleteRes.statusCode).toBe(204);

    const listRes = await app.inject({
      method: 'GET', url: '/v1/api-keys',
      headers: { 'user-agent': 'test/1.0', authorization: `Bearer ${token}` },
    });
    const revokedKey = (JSON.parse(listRes.body).api_keys as Array<Record<string, unknown>>).find(k => k.id === keyId);
    expect(revokedKey).toBeDefined();
    expect(revokedKey!.revoked_at).not.toBeNull();
  });
});
