// cross-tenant-discovery.test.ts — Doc 07 §3.3 opt-in fuzzy discovery.
//   Directory search is OPT-IN (discoverable defaults false — untouched tenants unfindable),
//   addon-gated FIRST (PR-08), capped at 10, and returns ONLY the whitelisted directory
//   fields. ILIKE metacharacters are escaped so q='%%' cannot become a browse-all listing.
// Locked decisions: T-44 (no-RLS + app-layer guard), T-64 (canonical trade keys), PR-08.

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

const sfx = randomUUID().slice(0, 6);

const searcher = randomUUID();   // business GC — addon via tier; also opted in itself (self-exclusion check)
const noAddon = randomUUID();    // professional, NO addon — search must 402
const smithElec = randomUUID();  // discoverable: "Smith Electric" — electrical / WI
const smithPlumb = randomUUID(); // discoverable: "Smith Plumbing" — plumbing / IL
const optedOut = randomUUID();   // profile row present, discoverable = false
const noProfile = randomUUID();  // no profile row at all
const deletedT = randomUUID();   // discoverable but tenant soft-deleted
const capTenants = Array.from({ length: 12 }, () => randomUUID()); // 12 matches → cap at 10

const allTenants = [searcher, noAddon, smithElec, smithPlumb, optedOut, noProfile, deletedT, ...capTenants];
const owner: Record<string, string> = Object.fromEntries(allTenants.map((t) => [t, randomUUID()]));

const app = Fastify({ logger: false });

function token(tenantId: string, role = 'OWNER'): string {
  return jwt.sign(
    { jti: randomUUID(), user_id: owner[tenantId], tenant_id: tenantId, role, email: `owner@${tenantId.slice(0, 6)}.test`, preferred_language: 'en' },
    process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
    { expiresIn: 86400 },
  );
}
const H = (t: string) => ({ 'user-agent': 'test-runner/1.0', authorization: `Bearer ${t}`, 'content-type': 'application/json' });
const HNoBody = (t: string) => ({ 'user-agent': 'test-runner/1.0', authorization: `Bearer ${t}` });

async function seedProfile(tenantId: string, discoverable: boolean, trades: string[], states: string[], area: string | null = null): Promise<void> {
  await testPool.query(
    `INSERT INTO tenant_discovery_profiles (tenant_id, discoverable, trades, states, service_area)
     VALUES ($1, $2, $3, $4, $5)`,
    [tenantId, discoverable, trades, states, area],
  );
}

beforeAll(async () => {
  registerErrorHandler(app);
  await app.register(connectionRoutes, { prefix: '/v1' });
  await app.ready();

  const rows: Array<[string, string, string]> = [
    [searcher, `Apex Searcher ${sfx}`, 'business'],
    [noAddon, `Frugal GC ${sfx}`, 'professional'],
    [smithElec, `Smith Electric ${sfx}`, 'business'],
    [smithPlumb, `Smith Plumbing ${sfx}`, 'business'],
    [optedOut, `Hermit Drywall ${sfx}`, 'business'],
    [noProfile, `Ghost Concrete ${sfx}`, 'business'],
    [deletedT, `Smith Departed ${sfx}`, 'business'],
    ...capTenants.map((t, i): [string, string, string] => [t, `Capfill Roofing ${i} ${sfx}`, 'business']),
  ];
  for (const [id, name] of rows) {
    await testPool.query(
      `INSERT INTO tenants (id, name, slug, tier, status) VALUES ($1, $2, $3, $4, 'active')`,
      [id, name, `d-${id.slice(0, 12)}`, rows.find((r) => r[0] === id)![2]],
    );
  }
  await testPool.query(`UPDATE tenants SET deleted_at = NOW() WHERE id = $1`, [deletedT]);

  const pw = await bcrypt.hash('x', 10);
  for (const t of allTenants) {
    await testPool.query(
      `INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, status)
       VALUES ($1, $2, $3, $4, 'O', 'W', 'owner', 'active')`,
      [owner[t], t, `owner@${t.slice(0, 6)}.test`, pw],
    );
  }

  await seedProfile(searcher, true, ['general'], ['WI'], null);
  await seedProfile(smithElec, true, ['electrical'], ['WI'], 'Dane County WI');
  await seedProfile(smithPlumb, true, ['plumbing'], ['IL'], null);
  await seedProfile(optedOut, false, ['drywall'], ['WI'], null);
  await seedProfile(deletedT, true, ['electrical'], ['WI'], null);
  for (const t of capTenants) await seedProfile(t, true, ['roofing'], ['WI'], null);

  await Promise.all(allTenants.map((t) => redis.del(`sub:${t}`)));
});

afterAll(async () => {
  await Promise.all(allTenants.map((t) => redis.del(`sub:${t}`)));
  await testPool.query(`DELETE FROM tenant_discovery_profiles WHERE tenant_id = ANY($1)`, [allTenants]);
  await testPool.query(`DELETE FROM audit_log WHERE tenant_id = ANY($1)`, [allTenants]);
  await testPool.query(`DELETE FROM users WHERE tenant_id = ANY($1)`, [allTenants]);
  await testPool.query(`DELETE FROM tenants WHERE id = ANY($1)`, [allTenants]);
  await app.close();
});

describe('discovery search — visibility + fuzziness', () => {
  it('finds an opted-in tenant by exact-ish name and returns ONLY whitelisted fields', async () => {
    const res = await app.inject({ method: 'GET', url: `/v1/connections/discovery?q=${encodeURIComponent(`Smith Electric ${sfx}`)}`, headers: HNoBody(token(searcher)) });
    expect(res.statusCode).toBe(200);
    const results = res.json().results;
    // Fuzzy by design: sibling "Smith …" tenants may co-match; best match ranks first.
    expect(results[0].tenant_id).toBe(smithElec);
    // Leak floor: the response row shape IS the whitelist — no slug/email/tier/user data.
    expect(Object.keys(results[0]).sort()).toEqual(['name', 'service_area', 'states', 'tenant_id', 'trades']);
    expect(results[0].trades).toEqual(['electrical']);
    expect(results[0].states).toEqual(['WI']);
  });

  it('fuzzy: a one-typo query still matches (similarity path)', async () => {
    const res = await app.inject({ method: 'GET', url: `/v1/connections/discovery?q=${encodeURIComponent(`Smith Electrik ${sfx}`)}`, headers: HNoBody(token(searcher)) });
    expect(res.statusCode).toBe(200);
    expect(res.json().results.map((r: { tenant_id: string }) => r.tenant_id)).toContain(smithElec);
  });

  it('opted-out (flag false) and profile-less tenants are invisible', async () => {
    for (const q of [`Hermit Drywall ${sfx}`, `Ghost Concrete ${sfx}`]) {
      const res = await app.inject({ method: 'GET', url: `/v1/connections/discovery?q=${encodeURIComponent(q)}`, headers: HNoBody(token(searcher)) });
      expect(res.statusCode).toBe(200);
      expect(res.json().results).toEqual([]);
    }
  });

  it('soft-deleted tenant is invisible even with discoverable=true', async () => {
    const res = await app.inject({ method: 'GET', url: `/v1/connections/discovery?q=${encodeURIComponent(`Smith Departed ${sfx}`)}`, headers: HNoBody(token(searcher)) });
    expect(res.statusCode).toBe(200);
    expect(res.json().results.map((r: { tenant_id: string }) => r.tenant_id)).not.toContain(deletedT);
  });

  it('own tenant is excluded from results', async () => {
    const res = await app.inject({ method: 'GET', url: `/v1/connections/discovery?q=${encodeURIComponent(`Apex Searcher ${sfx}`)}`, headers: HNoBody(token(searcher)) });
    expect(res.statusCode).toBe(200);
    expect(res.json().results.map((r: { tenant_id: string }) => r.tenant_id)).not.toContain(searcher);
  });

  it('trade and state filters narrow the result set', async () => {
    const base = `/v1/connections/discovery?q=${encodeURIComponent(`Smith ${sfx}`)}`;
    const byTrade = await app.inject({ method: 'GET', url: `${base}&trade=electrical`, headers: HNoBody(token(searcher)) });
    expect(byTrade.json().results.map((r: { tenant_id: string }) => r.tenant_id)).toEqual([smithElec]);
    const byState = await app.inject({ method: 'GET', url: `${base}&state=IL`, headers: HNoBody(token(searcher)) });
    expect(byState.json().results.map((r: { tenant_id: string }) => r.tenant_id)).toEqual([smithPlumb]);
    // trade filter accepts aliases (T-64): 'striping' → pavement_marking (no match here)
    const byAlias = await app.inject({ method: 'GET', url: `${base}&trade=striping`, headers: HNoBody(token(searcher)) });
    expect(byAlias.statusCode).toBe(200);
    expect(byAlias.json().results).toEqual([]);
  });

  it('results are capped at 10', async () => {
    const res = await app.inject({ method: 'GET', url: `/v1/connections/discovery?q=${encodeURIComponent(`Capfill Roofing`)}&state=WI`, headers: HNoBody(token(searcher)) });
    expect(res.statusCode).toBe(200);
    expect(res.json().results.length).toBe(10);
  });
});

describe('discovery search — guards', () => {
  it('ILIKE metacharacters are escaped — %% / __ are NOT a browse-all bypass', async () => {
    for (const q of ['%%', '__']) {
      const res = await app.inject({ method: 'GET', url: `/v1/connections/discovery?q=${encodeURIComponent(q)}`, headers: HNoBody(token(searcher)) });
      expect(res.statusCode).toBe(200);
      expect(res.json().results).toEqual([]);
    }
  });

  it('q is required, min 2 chars → 422', async () => {
    for (const url of ['/v1/connections/discovery', '/v1/connections/discovery?q=a']) {
      const res = await app.inject({ method: 'GET', url, headers: HNoBody(token(searcher)) });
      expect(res.statusCode).toBe(422);
    }
  });

  it('unknown trade filter → 422 UNKNOWN_TRADE', async () => {
    const res = await app.inject({ method: 'GET', url: `/v1/connections/discovery?q=Smith&trade=underwater_basket`, headers: HNoBody(token(searcher)) });
    expect(res.statusCode).toBe(422);
    expect(res.json().error.code).toBe('UNKNOWN_TRADE');
  });

  it('no cross_tenant addon → 402 BEFORE any results (scanner learns nothing)', async () => {
    const res = await app.inject({ method: 'GET', url: `/v1/connections/discovery?q=${encodeURIComponent(`Smith Electric ${sfx}`)}`, headers: HNoBody(token(noAddon)) });
    expect(res.statusCode).toBe(402);
    expect(res.json().error.code).toBe('ADDON_REQUIRED');
    expect(res.body).not.toContain(smithElec);
  });

  it('role gate: field tech cannot search → 403', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/connections/discovery?q=Smith', headers: HNoBody(token(searcher, 'FIELD_TECH')) });
    expect(res.statusCode).toBe(403);
  });
});

describe('discovery profile', () => {
  it('GET returns the default opted-out shape when no row exists', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/connections/discovery-profile', headers: HNoBody(token(noProfile)) });
    expect(res.statusCode).toBe(200);
    expect(res.json().profile).toEqual({ discoverable: false, trades: [], states: [], service_area: null, updated_at: null });
  });

  it('PUT upserts; trade aliases normalize to canonical keys (mechanical → hvac)', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/v1/connections/discovery-profile',
      headers: H(token(noProfile)),
      payload: { discoverable: true, trades: ['mechanical', 'electrical'], states: ['WI', 'IL'], service_area: 'Southern Wisconsin' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().profile.trades).toEqual(['hvac', 'electrical']);
    // now findable
    const found = await app.inject({ method: 'GET', url: `/v1/connections/discovery?q=${encodeURIComponent(`Ghost Concrete ${sfx}`)}`, headers: HNoBody(token(searcher)) });
    expect(found.json().results.map((r: { tenant_id: string }) => r.tenant_id)).toEqual([noProfile]);
    // opt back out — flips invisibility live
    const off = await app.inject({
      method: 'PUT', url: '/v1/connections/discovery-profile', headers: H(token(noProfile)),
      payload: { discoverable: false, trades: [], states: [] },
    });
    expect(off.statusCode).toBe(200);
    const gone = await app.inject({ method: 'GET', url: `/v1/connections/discovery?q=${encodeURIComponent(`Ghost Concrete ${sfx}`)}`, headers: HNoBody(token(searcher)) });
    expect(gone.json().results).toEqual([]);
  });

  it('PUT unknown trade key → 422 UNKNOWN_TRADE', async () => {
    const res = await app.inject({
      method: 'PUT', url: '/v1/connections/discovery-profile', headers: H(token(noProfile)),
      payload: { discoverable: true, trades: ['underwater_basket'], states: [] },
    });
    expect(res.statusCode).toBe(422);
    expect(res.json().error.code).toBe('UNKNOWN_TRADE');
  });

  it('PUT is OWNER-only → 403 for PM', async () => {
    const res = await app.inject({
      method: 'PUT', url: '/v1/connections/discovery-profile', headers: H(token(noProfile, 'PROJECT_MANAGER')),
      payload: { discoverable: true, trades: [], states: [] },
    });
    expect(res.statusCode).toBe(403);
  });

  it('PUT requires no addon (opting in/out is free)', async () => {
    const res = await app.inject({
      method: 'PUT', url: '/v1/connections/discovery-profile', headers: H(token(noAddon)),
      payload: { discoverable: true, trades: ['hvac'], states: ['WI'] },
    });
    expect(res.statusCode).toBe(200);
  });
});
