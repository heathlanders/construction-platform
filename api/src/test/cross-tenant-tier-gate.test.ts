// cross-tenant-tier-gate.test.ts — Phase 4: PR-08 cross-tenant add-on gate.
//   Inviting (GC) and accepting (Sub) a connection both require the `cross_tenant` entitlement:
//   included Business+, add-on on Professional. Without it → 402 ADDON_REQUIRED.
// Locked decisions: PR-08, P-03, tier-matrix §5, T-44, T-45.

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
import { registerErrorHandler } from '../plugins/error-handler.js';

// GCs (inviters)
const gcPro = randomUUID();    // professional, NO add-on → invite blocked
const gcAddon = randomUUID();  // professional + cross_tenant add-on → allowed
const gcBiz = randomUUID();    // business (included) → allowed
// Subs (accepters)
const subPro = randomUUID();   // professional, NO add-on → accept blocked
const subBiz = randomUUID();   // business (included) → accept allowed

const owner: Record<string, string> = {
  [gcPro]: randomUUID(), [gcAddon]: randomUUID(), [gcBiz]: randomUUID(),
  [subPro]: randomUUID(), [subBiz]: randomUUID(),
};
const allTenants = [gcPro, gcAddon, gcBiz, subPro, subBiz];

const app = Fastify({ logger: false });

function token(tenantId: string): string {
  return jwt.sign(
    { jti: randomUUID(), user_id: owner[tenantId], tenant_id: tenantId, role: 'OWNER', email: `owner@${tenantId.slice(0, 6)}.test`, preferred_language: 'en' },
    process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
    { expiresIn: 86400 },
  );
}
const H = (t: string) => ({ 'user-agent': 'test-runner/1.0', authorization: `Bearer ${t}`, 'content-type': 'application/json' });
// Accept has no request body — sending content-type: application/json with an empty body makes
// Fastify 400 ("Body cannot be empty…"), so use a bodyless header set.
const HNoBody = (t: string) => ({ 'user-agent': 'test-runner/1.0', authorization: `Bearer ${t}` });

beforeAll(async () => {
  registerErrorHandler(app);
  await app.register(connectionRoutes, { prefix: '/v1' });
  await app.ready();

  await testPool.query(
    `INSERT INTO tenants (id,name,slug,tier,status) VALUES
       ($1,'GC Pro',$6,'professional','active'),
       ($2,'GC Addon',$7,'professional','active'),
       ($3,'GC Biz',$8,'business','active'),
       ($4,'Sub Pro',$9,'professional','active'),
       ($5,'Sub Biz',$10,'business','active')`,
    [gcPro, gcAddon, gcBiz, subPro, subBiz,
     `gcpro-${gcPro.slice(0, 6)}`, `gcaddon-${gcAddon.slice(0, 6)}`, `gcbiz-${gcBiz.slice(0, 6)}`,
     `subpro-${subPro.slice(0, 6)}`, `subbiz-${subBiz.slice(0, 6)}`],
  );
  // gcAddon buys the cross_tenant add-on (Professional). Others have no subscription row →
  // COALESCE falls back to tenants.tier with add-on flags false.
  await testPool.query(
    `INSERT INTO tenant_subscriptions (tenant_id, tier, status, addon_cross_tenant)
     VALUES ($1, 'professional', 'active', true)`,
    [gcAddon],
  );

  const pw = await bcrypt.hash('x', 10);
  for (const t of allTenants) {
    await testPool.query(
      `INSERT INTO users (id,tenant_id,email,password_hash,first_name,last_name,role,status)
       VALUES ($1,$2,$3,$4,'O','W','owner','active')`,
      [owner[t], t, `owner@${t.slice(0, 6)}.test`, pw],
    );
  }
  // Bust any stale subscription cache for these fresh tenants.
  await Promise.all(allTenants.map((t) => redis.del(`sub:${t}`)));
});

afterAll(async () => {
  await Promise.all(allTenants.map((t) => redis.del(`sub:${t}`)));
  await testPool.query(`DELETE FROM tenant_connections WHERE gc_tenant_id = ANY($1)`, [allTenants]);
  await testPool.query(`DELETE FROM audit_log WHERE tenant_id = ANY($1)`, [allTenants]);
  await testPool.query(`DELETE FROM tenant_subscriptions WHERE tenant_id = ANY($1)`, [allTenants]);
  await testPool.query(`DELETE FROM users WHERE tenant_id = ANY($1)`, [allTenants]);
  await testPool.query(`DELETE FROM tenants WHERE id = ANY($1)`, [allTenants]);
  await app.close();
});

const invite = (gc: string, sub: string) =>
  app.inject({ method: 'POST', url: '/v1/connections', headers: H(token(gc)), payload: { sub_tenant_id: sub } });

describe('cross-tenant add-on gate (PR-08)', () => {
  let connBizPro = ''; // gcBiz → subPro (pending): reused for the accept-402 + non-member-403 cases
  const accept = (connId: string, subTenant: string) =>
    app.inject({ method: 'POST', url: `/v1/connections/${connId}/accept`, headers: HNoBody(token(subTenant)) });

  it('Professional GC without the add-on cannot invite → 402 ADDON_REQUIRED', async () => {
    const res = await invite(gcPro, subBiz);
    expect(res.statusCode).toBe(402);
    expect(res.json().error.code).toBe('ADDON_REQUIRED');
    // No connection row was created.
    const chk = await testPool.query(`SELECT 1 FROM tenant_connections WHERE gc_tenant_id=$1`, [gcPro]);
    expect(chk.rowCount).toBe(0);
  });

  it('Professional GC WITH the cross_tenant add-on can invite → 201', async () => {
    const res = await invite(gcAddon, subBiz);
    expect(res.statusCode).toBe(201);
    expect(res.json().connection.status).toBe('pending');
  });

  it('Business GC (add-on included) can invite → 201 pending', async () => {
    const res = await invite(gcBiz, subPro);
    expect(res.statusCode).toBe(201);
    connBizPro = res.json().connection.id;
  });

  it('a Professional Sub without the add-on cannot accept → 402 ADDON_REQUIRED', async () => {
    const res = await accept(connBizPro, subPro);
    expect(res.statusCode).toBe(402);
    expect(res.json().error.code).toBe('ADDON_REQUIRED');
    // Still pending — the gate blocked the transition.
    const chk = await testPool.query(`SELECT status FROM tenant_connections WHERE id=$1`, [connBizPro]);
    expect(chk.rows[0].status).toBe('pending');
  });

  it('the accept gate runs AFTER membership — a non-member gets 403, not 402', async () => {
    // gcAddon is neither the GC nor the Sub of connBizPro → membership fails first.
    const res = await accept(connBizPro, gcAddon);
    expect(res.statusCode).toBe(403);
  });

  it('a Business Sub (add-on included) can accept → 200 active', async () => {
    const inv = await invite(gcBiz, subBiz);
    expect(inv.statusCode).toBe(201);
    const res = await accept(inv.json().connection.id, subBiz);
    expect(res.statusCode).toBe(200);
    expect(res.json().connection.status).toBe('active');
  });
});
