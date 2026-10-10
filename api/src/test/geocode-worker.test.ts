// geocode-worker.test.ts — Project Map Phase 1 geocoding worker.
//   exact       — Census one-line geocoder match → lat/lng, geocode_status='exact'
//   approximate — geocoder miss → county centroid fallback (counties.centroid_lat/lng)
//   failed      — no address + no county → geocode_status='failed', coords stay null
//
// The Census fetch is mocked (no network). Fixtures via testPool (BYPASSRLS); the handler runs
// under withTenantContext (real RLS path).

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { randomUUID } from 'node:crypto';

import { testPool } from './setup.js';
import { handleGeocodeProject } from '../workers/geocode-worker.js';

const tenantId = randomUUID();
const slug = `geo-${tenantId.slice(0, 8)}`;
const COUNTY = '55997'; // synthetic FIPS for this test only

const projExact = randomUUID();
const projApprox = randomUUID();
const projZipOnly = randomUUID();
const projFailed = randomUUID();
const ZIP_ONLY = '54998'; // synthetic ZIP mapped to COUNTY via zip_county for this test

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

function censusMatch(lat: number, lng: number) {
  return {
    ok: true,
    json: async () => ({ result: { addressMatches: [{ coordinates: { x: lng, y: lat } }] } }),
  };
}
const censusNoMatch = { ok: true, json: async () => ({ result: { addressMatches: [] } }) };

async function projectRow(id: string) {
  const { rows } = await testPool.query(
    `SELECT latitude, longitude, geocode_status, geocoded_at FROM projects WHERE id=$1`,
    [id],
  );
  return rows[0];
}

beforeAll(async () => {
  await testPool.query(
    `INSERT INTO tenants (id, name, slug, tier, status) VALUES ($1,'Geo Tenant',$2,'professional','active')`,
    [tenantId, slug],
  );
  await testPool.query(
    `INSERT INTO projects (id, tenant_id, name, status, address, city, state, zip, county_fips)
     VALUES
       ($1,$5,'Exact',       'active','1 Capitol Sq','Madison','WI','53703',$6),
       ($2,$5,'Approx',      'active','999 Nowhere Rd','Ruralton','WI','54999',$6),
       ($3,$5,'ZipOnly',     'active',NULL,'Ruralton','WI',$7,NULL),
       ($4,$5,'Failed',      'active',NULL,NULL,NULL,NULL,NULL)`,
    [projExact, projApprox, projZipOnly, projFailed, tenantId, COUNTY, ZIP_ONLY],
  );
  // ZIP→county crosswalk row so the zip-derived county fallback can resolve.
  await testPool.query(
    `INSERT INTO zip_county (zip, county_fips, county_name, state_code, primary_city, ratio)
     VALUES ($1,$2,'Test County','WI','Ruralton',1.0)
     ON CONFLICT (zip, county_fips) DO NOTHING`,
    [ZIP_ONLY, COUNTY],
  );
  // County centroid fallback source (migration 0036 cols).
  await testPool.query(
    `INSERT INTO counties (county_fips, county_name, state_code, centroid_lat, centroid_lng)
     VALUES ($1,'Test County','WI',43.500000,-89.900000)
     ON CONFLICT (county_fips) DO UPDATE SET centroid_lat=EXCLUDED.centroid_lat, centroid_lng=EXCLUDED.centroid_lng`,
    [COUNTY],
  );
});

afterAll(async () => {
  await testPool.query(`DELETE FROM audit_log WHERE tenant_id=$1`, [tenantId]);
  await testPool.query(`DELETE FROM projects WHERE tenant_id=$1`, [tenantId]);
  await testPool.query(`DELETE FROM tenants WHERE id=$1`, [tenantId]);
  await testPool.query(`DELETE FROM zip_county WHERE zip=$1`, [ZIP_ONLY]);
  await testPool.query(`DELETE FROM counties WHERE county_fips=$1`, [COUNTY]);
});

beforeEach(() => fetchMock.mockReset());

describe('handleGeocodeProject', () => {
  it('exact: stores geocoder coordinates', async () => {
    fetchMock.mockResolvedValueOnce(censusMatch(43.074, -89.384));
    await handleGeocodeProject(tenantId, { project_id: projExact });

    const r = await projectRow(projExact);
    expect(r.geocode_status).toBe('exact');
    expect(Number(r.latitude)).toBeCloseTo(43.074, 3);
    expect(Number(r.longitude)).toBeCloseTo(-89.384, 3);
    expect(r.geocoded_at).not.toBeNull();
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('approximate: falls back to county centroid on a geocoder miss', async () => {
    fetchMock.mockResolvedValueOnce(censusNoMatch);
    await handleGeocodeProject(tenantId, { project_id: projApprox });

    const r = await projectRow(projApprox);
    expect(r.geocode_status).toBe('approximate');
    expect(Number(r.latitude)).toBeCloseTo(43.5, 4);
    expect(Number(r.longitude)).toBeCloseTo(-89.9, 4);
    expect(r.geocoded_at).not.toBeNull();
  });

  it('approximate: also falls back when the geocoder throws', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network down'));
    await handleGeocodeProject(tenantId, { project_id: projApprox });

    const r = await projectRow(projApprox);
    expect(r.geocode_status).toBe('approximate');
    expect(Number(r.latitude)).toBeCloseTo(43.5, 4);
  });

  it('approximate: derives county from ZIP when project has no county_fips (city/state/zip only)', async () => {
    fetchMock.mockResolvedValueOnce(censusNoMatch);
    await handleGeocodeProject(tenantId, { project_id: projZipOnly });

    const r = await projectRow(projZipOnly);
    expect(r.geocode_status).toBe('approximate');
    expect(Number(r.latitude)).toBeCloseTo(43.5, 4);
    expect(Number(r.longitude)).toBeCloseTo(-89.9, 4);

    // Derived county persisted onto the project (user-correctable; feeds the jurisdiction engine).
    const { rows } = await testPool.query(`SELECT county_fips, county_name FROM projects WHERE id=$1`, [projZipOnly]);
    expect(rows[0].county_fips).toBe(COUNTY);
    expect(rows[0].county_name).toBe('Test County');
  });

  it('failed: no address and no county → failed, coords null, no fetch', async () => {
    await handleGeocodeProject(tenantId, { project_id: projFailed });

    const r = await projectRow(projFailed);
    expect(r.geocode_status).toBe('failed');
    expect(r.latitude).toBeNull();
    expect(r.longitude).toBeNull();
    expect(r.geocoded_at).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('no project_id → no-op', async () => {
    await expect(handleGeocodeProject(tenantId, {})).resolves.toBeUndefined();
  });
});
