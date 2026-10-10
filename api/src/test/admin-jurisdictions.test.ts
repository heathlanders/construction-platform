// admin-jurisdictions.test.ts — super-admin curation CRUD for the codes-engine reference tables.
// Doc 16 Phase 4. Routes: /v1/admin/jurisdiction-layers* + /v1/admin/code-editions*.
//
// Exercises the real DB-backed loader path: beforeAll seeds the WI-pilot reference rows + loads the
// in-memory cache; writes go through the route handlers (pgPool), which refreshReferenceCache() so
// resolveJurisdiction()/getCachedEdition() reflect the edit.
//
// Test DB == dev DB → self-clean: all writes use throwaway state 'ZZ' + source='admin-curation';
// afterEach/afterAll delete only admin-curation rows. Seeded WI rows are never touched.

import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import Fastify, { type FastifyInstance } from 'fastify';
import jwt from 'jsonwebtoken';
import { testPool } from './setup.js';
import { setupReferenceCache } from './seed-reference.js';
import { adminJurisdictionRoutes } from '../routes/v1/admin-jurisdictions.js';
import { registerErrorHandler } from '../plugins/error-handler.js';
import { resolveJurisdiction } from '../lib/jurisdictions/resolver.js';
import { getCachedEdition } from '../lib/jurisdictions/reference-store.js';

const SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production';
const UA = 'ConstructionPlatform-Test/1.0';

let app: FastifyInstance;

function adminToken(): string {
  return jwt.sign(
    { jti: randomUUID(), admin_id: randomUUID(), role: 'SUPER_ADMIN', tenant_id: 'PLATFORM' },
    SECRET,
    { expiresIn: 3600 },
  );
}
function tenantToken(): string {
  return jwt.sign(
    {
      jti: randomUUID(), user_id: randomUUID(), tenant_id: randomUUID(),
      role: 'OWNER', email: 'owner@x.test', preferred_language: 'en',
    },
    SECRET,
    { expiresIn: 3600 },
  );
}
function adminHeaders(): Record<string, string> {
  return { 'user-agent': UA, authorization: `Bearer ${adminToken()}` };
}

async function cleanup(): Promise<void> {
  await testPool.query(`DELETE FROM jurisdiction_layers WHERE source = 'admin-curation'`);
  await testPool.query(`DELETE FROM code_editions WHERE source = 'admin-curation'`);
}

beforeAll(async () => {
  app = Fastify({ logger: false });
  registerErrorHandler(app);
  await app.register(adminJurisdictionRoutes, { prefix: '/v1' });
  await app.ready();
  await setupReferenceCache(testPool);
  await cleanup();
});

afterEach(async () => {
  await cleanup();
  // Reload cache so a removed admin row never leaks into the next test's engine state.
  await setupReferenceCache(testPool);
});

afterAll(async () => {
  await cleanup();
  await app.close();
});

// ─── auth gate ────────────────────────────────────────────────────────────────────
describe('auth gate', () => {
  it('401 without a token', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/admin/jurisdiction-layers', headers: { 'user-agent': UA } });
    expect(res.statusCode).toBe(401);
  });
  it('403 with a tenant (non-super-admin) JWT', async () => {
    const res = await app.inject({
      method: 'GET', url: '/v1/admin/jurisdiction-layers',
      headers: { 'user-agent': UA, authorization: `Bearer ${tenantToken()}` },
    });
    expect(res.statusCode).toBe(403);
  });
  it('400 without a User-Agent', async () => {
    // inject auto-adds a default user-agent, so send an explicit empty one to exercise the guard.
    const res = await app.inject({
      method: 'GET', url: '/v1/admin/jurisdiction-layers',
      headers: { 'user-agent': '', authorization: `Bearer ${adminToken()}` },
    });
    expect(res.statusCode).toBe(400);
  });
});

// ─── jurisdiction_layers ────────────────────────────────────────────────────────────
describe('jurisdiction_layers CRUD', () => {
  it('creates a city layer, refreshes cache, engine resolves the new AHJ', async () => {
    const res = await app.inject({
      method: 'POST', url: '/v1/admin/jurisdiction-layers', headers: adminHeaders(),
      payload: {
        level: 'city', state_code: 'zz', city_name: 'Testville',
        ahj: { ahj_name: 'Testville Building Dept', ahj_level: 'city', phone: '555-0100' },
      },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.cache_refreshed).toBe(true);
    expect(body.layer.source).toBe('admin-curation');
    expect(body.layer.state_code).toBe('ZZ');           // upper-cased at write
    expect(body.layer.last_verified).toBeTruthy();        // defaulted to CURRENT_DATE

    const resolved = resolveJurisdiction({ state: 'ZZ', county_fips: null, county_name: null, city: 'Testville', building_type: 'commercial' });
    expect(resolved.ahj?.ahj_name).toBe('Testville Building Dept');
  });

  it('rejects a city layer missing city_name (422) and inserts nothing', async () => {
    const before = await testPool.query(`SELECT count(*)::int AS n FROM jurisdiction_layers WHERE state_code='ZZ'`);
    const res = await app.inject({
      method: 'POST', url: '/v1/admin/jurisdiction-layers', headers: adminHeaders(),
      payload: { level: 'city', state_code: 'ZZ' },
    });
    expect(res.statusCode).toBe(422);
    const after = await testPool.query(`SELECT count(*)::int AS n FROM jurisdiction_layers WHERE state_code='ZZ'`);
    expect(after.rows[0].n).toBe(before.rows[0].n);
  });

  it('rejects malformed sequence_ops (422); valid op round-trips into resolved steps', async () => {
    const bad = await app.inject({
      method: 'POST', url: '/v1/admin/jurisdiction-layers', headers: adminHeaders(),
      payload: { level: 'state', state_code: 'ZZ', codes: { electrical: { sequence_ops: [{ op: 'bogus' }] } } },
    });
    expect(bad.statusCode).toBe(422);

    const ok = await app.inject({
      method: 'POST', url: '/v1/admin/jurisdiction-layers', headers: adminHeaders(),
      payload: {
        level: 'state', state_code: 'ZZ',
        codes: { electrical: { sequence_ops: [{ op: 'add', step: { sequence_order: 99, inspection_type: 'zz_special', title: 'ZZ Special', csi_division: '26', estimated_duration_days: 1 } }] } },
      },
    });
    expect(ok.statusCode).toBe(201);
    const resolved = resolveJurisdiction({ state: 'ZZ', county_fips: null, county_name: null, city: null, building_type: 'commercial' });
    expect(resolved.trades.electrical.steps.some((s) => s.inspection_type === 'zz_special')).toBe(true);
  });

  it('PATCH nulling city_name on a city layer → 422 (merged-row validation)', async () => {
    const created = await app.inject({
      method: 'POST', url: '/v1/admin/jurisdiction-layers', headers: adminHeaders(),
      payload: { level: 'city', state_code: 'ZZ', city_name: 'Patchville' },
    });
    const id = created.json().layer.id;
    const res = await app.inject({
      method: 'PATCH', url: `/v1/admin/jurisdiction-layers/${id}`, headers: adminHeaders(),
      payload: { city_name: null },
    });
    expect(res.statusCode).toBe(422);
  });

  it('DELETE removes the layer; engine stops resolving it; second DELETE → 404', async () => {
    const created = await app.inject({
      method: 'POST', url: '/v1/admin/jurisdiction-layers', headers: adminHeaders(),
      payload: { level: 'city', state_code: 'ZZ', city_name: 'Deleteville', ahj: { ahj_name: 'Deleteville AHJ', ahj_level: 'city' } },
    });
    const id = created.json().layer.id;

    const del = await app.inject({ method: 'DELETE', url: `/v1/admin/jurisdiction-layers/${id}`, headers: adminHeaders() });
    expect(del.statusCode).toBe(200);
    expect(del.json().cache_refreshed).toBe(true);

    const resolved = resolveJurisdiction({ state: 'ZZ', county_fips: null, county_name: null, city: 'Deleteville', building_type: 'commercial' });
    expect(resolved.ahj?.ahj_name).not.toBe('Deleteville AHJ');

    const again = await app.inject({ method: 'DELETE', url: `/v1/admin/jurisdiction-layers/${id}`, headers: adminHeaders() });
    expect(again.statusCode).toBe(404);
  });

  it('validate returns ok on a clean DB', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/admin/jurisdiction-layers/validate', headers: adminHeaders() });
    expect(res.statusCode).toBe(200);
    expect(res.json().ok).toBe(true);
  });
});

// ─── code_editions ──────────────────────────────────────────────────────────────────
describe('code_editions CRUD', () => {
  it('PUT upserts, cache reflects it, re-PUT updates in place (no dup), DELETE removes', async () => {
    const put = await app.inject({
      method: 'PUT', url: '/v1/admin/code-editions', headers: adminHeaders(),
      payload: { trade: 'electrical', state_code: 'zz', code_type: 'NEC', code_edition: '2023', nec_edition: '2023' },
    });
    expect(put.statusCode).toBe(200);
    expect(put.json().cache_refreshed).toBe(true);
    expect(getCachedEdition('electrical', 'ZZ')?.code_edition).toBe('2023');

    const rePut = await app.inject({
      method: 'PUT', url: '/v1/admin/code-editions', headers: adminHeaders(),
      payload: { trade: 'electrical', state_code: 'ZZ', code_type: 'NEC', code_edition: '2026', nec_edition: '2026' },
    });
    expect(rePut.statusCode).toBe(200);
    const rows = await testPool.query(`SELECT count(*)::int AS n FROM code_editions WHERE trade='electrical' AND state_code='ZZ'`);
    expect(rows.rows[0].n).toBe(1);
    expect(getCachedEdition('electrical', 'ZZ')?.code_edition).toBe('2026');

    const id = rePut.json().edition.id;
    const del = await app.inject({ method: 'DELETE', url: `/v1/admin/code-editions/${id}`, headers: adminHeaders() });
    expect(del.statusCode).toBe(200);
    expect(getCachedEdition('electrical', 'ZZ')).toBeNull();
  });
});

// ─── audit ────────────────────────────────────────────────────────────────────────────
describe('audit trail', () => {
  it('writes a PLATFORM-scope audit row on create', async () => {
    const created = await app.inject({
      method: 'POST', url: '/v1/admin/jurisdiction-layers', headers: adminHeaders(),
      payload: { level: 'city', state_code: 'ZZ', city_name: 'Auditville' },
    });
    const id = created.json().layer.id;
    const res = await testPool.query(
      `SELECT action, tenant_id FROM audit_log WHERE resource_id = $1 AND action = 'jurisdiction_layer.created'`,
      [id],
    );
    expect(res.rows.length).toBe(1);
    expect(res.rows[0].tenant_id).toBe('PLATFORM');
  });
});
