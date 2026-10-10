// session-revocation.test.ts — a JWT must stop working when the account behind it is shut off.
// Before: tokens lived their full life (24h web / 30d mobile) after a user was deactivated,
// suspended, re-roled or deleted, or the tenant was suspended. Now requireAuth checks per-user and
// per-tenant "not valid before" markers in Redis (revokeUserSessions / revokeTenantSessions).
//   requireAuth                    — marker semantics (older/same-second rejected, newer passes)
//   PATCH /v1/users/:id            — role change + suspend revoke; a name edit does not
//   DELETE /v1/users/:id           — revokes
//   PATCH /v1/admin/tenants/:id    — suspend revokes every token in the tenant; other statuses don't

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { randomUUID } from 'node:crypto';
import Fastify from 'fastify';
import jwt from 'jsonwebtoken';
import { testPool } from './setup.js';
import { redis } from '../lib/redis.js';
import { userRoutes } from '../routes/v1/users.js';
import { adminRoutes } from '../routes/v1/admin.js';
import { registerErrorHandler } from '../plugins/error-handler.js';
import {
  requireAuth, revokeUserSessions, revokeTenantSessions, issueSuperAdminToken,
} from '../middleware/auth.js';

const tenantId = randomUUID();
const ownerId = randomUUID();
const techId = randomUUID();
const pmId = randomUUID();
const app = Fastify({ logger: false });

const now = () => Math.floor(Date.now() / 1000);
const SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production';

function token(uid: string, role: string, iat = now() - 60): string {
  return jwt.sign(
    { jti: randomUUID(), user_id: uid, tenant_id: tenantId, role,
      email: `rev-${uid.slice(0, 8)}@ex.com`, preferred_language: 'en', iat, exp: iat + 3600 },
    SECRET,
  );
}
const H = (t: string) => ({ 'user-agent': 'test-runner/1.0', authorization: `Bearer ${t}`, 'content-type': 'application/json' });
const probe = (t: string) => app.inject({ method: 'GET', url: '/v1/probe', headers: H(t) });

async function clearMarkers(): Promise<void> {
  await redis.del(
    `auth:nbf:tenant:${tenantId}`,
    ...[ownerId, techId, pmId].map((u) => `auth:nbf:user:${u}`),
  );
}

beforeAll(async () => {
  registerErrorHandler(app);
  app.get('/v1/probe', { preHandler: requireAuth }, async () => ({ ok: true }));
  await app.register(userRoutes, { prefix: '/v1' });
  await app.register(adminRoutes, { prefix: '/v1' });
  await app.ready();
  await testPool.query(`INSERT INTO tenants (id,name,slug,tier,status) VALUES ($1,'Rev',$2,'professional','active')`,
    [tenantId, `rev-${tenantId.slice(0, 8)}`]);
  for (const [id, role] of [[ownerId, 'owner'], [techId, 'field_tech'], [pmId, 'project_manager']]) {
    await testPool.query(
      `INSERT INTO users (id,tenant_id,email,password_hash,first_name,last_name,role,status)
       VALUES ($1,$2,$3,'x','R','V',$4,'active')`, [id, tenantId, `rev-${id.slice(0, 8)}@ex.com`, role]);
  }
});

beforeEach(clearMarkers);

afterAll(async () => {
  await clearMarkers();
  await app.close();
  await testPool.query(`DELETE FROM audit_log WHERE tenant_id=$1`, [tenantId]);
  await testPool.query(`DELETE FROM users WHERE tenant_id=$1`, [tenantId]);
  await testPool.query(`DELETE FROM tenants WHERE id=$1`, [tenantId]);
});

describe('requireAuth — not-valid-before markers', () => {
  it('rejects a token issued before a user revoke, accepts one issued after', async () => {
    const old = token(techId, 'FIELD_TECH');
    expect((await probe(old)).statusCode).toBe(200);
    await revokeUserSessions(techId);
    const res = await probe(old);
    expect(res.statusCode).toBe(401);
    expect(res.json().error.code).toBe('SESSION_REVOKED');
    expect((await probe(token(techId, 'FIELD_TECH', now() + 1))).statusCode).toBe(200);
  });

  it('fails closed on a token minted in the same second as the revoke', async () => {
    await revokeUserSessions(techId);
    const marker = Number(await redis.get(`auth:nbf:user:${techId}`));
    expect((await probe(token(techId, 'FIELD_TECH', marker))).statusCode).toBe(401);
  });

  it('a user revoke does not touch other users', async () => {
    await revokeUserSessions(techId);
    expect((await probe(token(pmId, 'PROJECT_MANAGER'))).statusCode).toBe(200);
  });

  it('a tenant revoke rejects every user in the tenant with TENANT_SUSPENDED', async () => {
    await revokeTenantSessions(tenantId);
    for (const [uid, role] of [[ownerId, 'OWNER'], [techId, 'FIELD_TECH']]) {
      const res = await probe(token(uid, role));
      expect(res.statusCode).toBe(401);
      expect(res.json().error.code).toBe('TENANT_SUSPENDED');
    }
  });

  it('markers outlive the longest token (30d mobile)', async () => {
    await revokeUserSessions(techId);
    expect(await redis.ttl(`auth:nbf:user:${techId}`)).toBeGreaterThan(30 * 24 * 3600);
  });
});

describe('PATCH /v1/users/:id', () => {
  const patch = (body: object, uid = techId) => app.inject({
    method: 'PATCH', url: `/v1/users/${uid}`, headers: H(token(ownerId, 'OWNER')), payload: body,
  });

  it('a role change revokes the target user’s tokens', async () => {
    const old = token(techId, 'FIELD_TECH');
    expect((await patch({ role: 'foreman' })).statusCode).toBe(200);
    expect((await probe(old)).json().error.code).toBe('SESSION_REVOKED');
    await testPool.query(`UPDATE users SET role='field_tech' WHERE id=$1`, [techId]);
  });

  it('suspending revokes', async () => {
    const old = token(techId, 'FIELD_TECH');
    expect((await patch({ status: 'suspended' })).statusCode).toBe(200);
    expect((await probe(old)).statusCode).toBe(401);
    await testPool.query(`UPDATE users SET status='active' WHERE id=$1`, [techId]);
  });

  it('a name edit does not revoke', async () => {
    const old = token(techId, 'FIELD_TECH');
    expect((await patch({ first_name: 'Renamed' })).statusCode).toBe(200);
    expect((await probe(old)).statusCode).toBe(200);
  });
});

describe('DELETE /v1/users/:id', () => {
  it('revokes the deleted user’s tokens', async () => {
    const old = token(pmId, 'PROJECT_MANAGER');
    const res = await app.inject({ method: 'DELETE', url: `/v1/users/${pmId}`, headers: H(token(ownerId, 'OWNER')) });
    expect(res.statusCode).toBe(204);
    expect((await probe(old)).json().error.code).toBe('SESSION_REVOKED');
  });
});

describe('PATCH /v1/admin/tenants/:id', () => {
  const setStatus = (status: string) => app.inject({
    method: 'PATCH', url: `/v1/admin/tenants/${tenantId}`,
    headers: H(issueSuperAdminToken(randomUUID(), 'root@ex.com')), payload: { status },
  });

  it('a non-suspend status change leaves tokens alive', async () => {
    const old = token(ownerId, 'OWNER');
    expect((await setStatus('grace_period')).statusCode).toBe(200);
    expect((await probe(old)).statusCode).toBe(200);
  });

  it('suspending the tenant revokes every token in it', async () => {
    const old = token(ownerId, 'OWNER');
    expect((await setStatus('suspended')).statusCode).toBe(200);
    expect((await probe(old)).json().error.code).toBe('TENANT_SUSPENDED');
    await testPool.query(`UPDATE tenants SET status='active' WHERE id=$1`, [tenantId]);
  });
});
