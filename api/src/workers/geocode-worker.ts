// workers/geocode-worker.ts — Project Map Phase 1 geocoding
// Locked decisions: T-10 (envelope tenant_id), T-42 (withTenantContext), A-14
//
// Job type handled:
//   geocode.project — enqueued on POST /v1/projects (create). Resolves the project's
//                     street address to lat/lng via the free US Census one-line geocoder
//                     (no key, no billing). On a miss, falls back to the county centroid.
//
// Registration model: the handler is exported and called from the combined
// boss.work('jobs', ...) consumer in stripe-worker.ts (single queue, no competing consumers).
//
// Provider: geocoding.geo.census.gov — US-only (OQ-09), higher rural miss rate. Manual pin-drop
// (PATCH /v1/projects/:id/location) is the escape hatch for misses/failures. Geocode once, store
// forever — only new addresses hit the API (near-zero load).
//
// The handler NEVER throws for a geocode failure — a bad/unmatchable address marks the project
// `failed` (surfaced in the UI as "location not set"), it does not dead-letter the job.

import { withTenantContext } from '../lib/tenant-context.js';
import { deriveCountyFromZip } from '../lib/jurisdictions/zip-county.js';
import { publishProjectLocationForProject } from '../lib/cross-tenant/bridge.js';

const CENSUS_ONELINE_URL =
  'https://geocoding.geo.census.gov/geocoder/locations/onelineaddress';

export interface GeoPoint {
  lat: number;
  lng: number;
}

/**
 * Call the US Census one-line geocoder. Returns the first match's coordinates, or null on no match.
 * Throws only on a transport / non-2xx error (caller treats a throw the same as a miss → fallback).
 * Exported for direct unit testing.
 */
export async function geocodeOneLine(address: string): Promise<GeoPoint | null> {
  const url =
    `${CENSUS_ONELINE_URL}?address=${encodeURIComponent(address)}` +
    `&benchmark=Public_AR_Current&format=json`;

  const res = await fetch(url, {
    headers: { 'User-Agent': 'thejobsite-geocoder/1.0' },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    throw new Error(`census geocoder ${res.status}`);
  }
  const data = (await res.json()) as {
    result?: { addressMatches?: Array<{ coordinates?: { x?: unknown; y?: unknown } }> };
  };
  const match = data?.result?.addressMatches?.[0];
  if (!match?.coordinates) return null;
  const lng = Number(match.coordinates.x);
  const lat = Number(match.coordinates.y);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

/**
 * geocode.project — resolve a project's address → lat/lng.
 * exact       = matched by the Census geocoder.
 * approximate = fell back to the county centroid (counties.centroid_lat/lng, via project.county_fips).
 * failed      = no match and no county centroid (leaves any existing manual pin untouched).
 */
export async function handleGeocodeProject(
  tenantId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const projectId = payload.project_id as string | undefined;
  if (!projectId) {
    console.info({ tenantId }, 'geocode.project: no project_id — skipping');
    return;
  }

  await withTenantContext(tenantId, async (client) => {
    const { rows } = await client.query<{
      id: string;
      address: string | null;
      city: string | null;
      state: string | null;
      zip: string | null;
      county_fips: string | null;
    }>(
      `SELECT id, address, city, state, zip, county_fips
       FROM projects WHERE id = $1 AND deleted_at IS NULL`,
      [projectId],
    );
    if (rows.length === 0) {
      console.info({ tenantId, projectId }, 'geocode.project: project not found — skipping');
      return;
    }
    const p = rows[0];

    let lat: number | null = null;
    let lng: number | null = null;
    let status: 'exact' | 'approximate' | 'failed' = 'failed';

    // 1) Exact — Census one-line geocode (only when we have a usable address string).
    const oneLine = [p.address, p.city, p.state, p.zip].filter(Boolean).join(', ');
    if (oneLine) {
      try {
        const match = await geocodeOneLine(oneLine);
        if (match) {
          lat = match.lat;
          lng = match.lng;
          status = 'exact';
        }
      } catch (err) {
        console.warn(
          { tenantId, projectId, err: (err as Error).message },
          'geocode.project: census geocoder error — trying county fallback',
        );
      }
    }

    // 2) Approximate — county centroid fallback. When the project has no county_fips, derive it
    //    from the ZIP via the platform zip_county crosswalk (same source the jurisdiction engine
    //    uses) — a city/state/zip-only address (no street) then still lands near the right place.
    //    A ZIP-derived county is also persisted onto the project (nullable, user-correctable —
    //    mirrors how permits resolve county from ZIP) so the jurisdiction engine benefits too.
    let countyFips = p.county_fips;
    let derivedCountyName: string | null = null;
    if (status !== 'exact' && !countyFips && p.zip) {
      const derived = await deriveCountyFromZip(p.zip, client);
      if (derived) {
        countyFips = derived.county_fips;
        derivedCountyName = derived.county_name;
      }
    }
    if (status !== 'exact' && countyFips) {
      const c = await client.query<{ centroid_lat: string | null; centroid_lng: string | null }>(
        `SELECT centroid_lat, centroid_lng FROM counties WHERE county_fips = $1`,
        [countyFips],
      );
      const row = c.rows[0];
      if (row?.centroid_lat != null && row?.centroid_lng != null) {
        lat = Number(row.centroid_lat);
        lng = Number(row.centroid_lng);
        status = 'approximate';
      }
    }

    if (status === 'failed') {
      // Mark failed but never wipe an existing manual pin (latitude already set).
      await client.query(
        `UPDATE projects SET geocode_status = 'failed', updated_at = NOW()
         WHERE id = $1 AND deleted_at IS NULL AND latitude IS NULL`,
        [projectId],
      );
    } else {
      const { rows: updated } = await client.query<{
        name: string;
        latitude: string | null;
        longitude: string | null;
        status: string;
        geocode_status: string;
        city: string | null;
        state: string | null;
        connection_id: string | null;
      }>(
        `UPDATE projects
         SET latitude = $1, longitude = $2, geocode_status = $3, geocoded_at = NOW(), updated_at = NOW(),
             county_fips = COALESCE(county_fips, $5), county_name = COALESCE(county_name, $6)
         WHERE id = $4 AND deleted_at IS NULL
         RETURNING name, latitude, longitude, status, geocode_status, city, state, connection_id`,
        [lat, lng, status, projectId, derivedCountyName ? countyFips : null, derivedCountyName],
      );
      // Cross-tenant map layer (Doc 20 Phase 6b): fan fresh coords to any active connections
      // sharing this project (no-op unless this tenant is a GC on one). Best-effort.
      if (updated[0]) {
        void publishProjectLocationForProject(tenantId, projectId, updated[0]);
      }
    }
    console.info({ tenantId, projectId, status }, 'geocode.project: done');
  });
}
