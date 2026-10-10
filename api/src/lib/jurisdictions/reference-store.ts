// reference-store.ts — DB-backed in-memory cache for the jurisdiction/codes engine.
//
// Phase 2 of the Codes Engine National Plan (Doc 16). Replaces the inline-TS loaders:
//   - code_editions  → per-(trade,state) code family/edition facts (was the 4 *-editions.ts libs)
//   - jurisdiction_layers → sparse city/county/state override layers (was seed/wi-*.ts)
//   - zip_county     → ZIP↔county crosswalk (was zip-county.ts ZIP_COUNTY map), queried on demand
//
// The engine stays PURE and SYNCHRONOUS: code_editions + jurisdiction_layers are loaded into
// memory at boot (small, hot) so resolveJurisdiction() reads them with zero I/O. zip_county is
// large (~41k at full US scale) and only consulted at permit/project creation, so it is queried
// on demand (async) — never cached.
//
// All four tables are platform-scoped reference data with NO RLS (migration 0020), so the cache
// loads on the raw pg pool WITHOUT a tenant context (there is no tenant to scope to).

import type pg from 'pg';
import { pgPool } from '../db.js';
import type { JurisdictionLayer, Trade } from './types.js';
import {
  normalizeCityName,
  normalizeCountyName,
  normalizeStateCode,
  normalizeCountyFips,
} from './geography.js';

type Queryable = Pick<pg.Pool, 'query'>;

// ─── Cached shapes ──────────────────────────────────────────────────────────────

// Code facts for one (trade, state). Steps are NOT here — national-default inspection
// sequences stay in TS (*-codes/inspection-sequences.ts); only code family/edition/notes move.
export interface CachedEdition {
  code_type: string;          // 'NEC','IPC','UPC','IMC','UMC' — building stored as 'ICC' (ignored; occupancy-derived)
  code_edition: string | null;
  nec_edition: string | null;
  notes: string | null;
}

export interface ZipCountyRow {
  county_fips: string;
  county_name: string;
  state_code: string;
  primary_city: string | null;
  ratio: number | null;
}

// ─── Module-level cache state ───────────────────────────────────────────────────

let loaded = false;
// key = `${trade}:${STATE}` (state upper-cased)
const editionCache = new Map<string, CachedEdition>();
let layerCache: JurisdictionLayer[] = [];

function editionKey(trade: string, stateCode: string): string {
  return `${trade}:${stateCode.toUpperCase()}`;
}

// Normalize a layer's match keys once at load so resolve-time comparisons are direct equality.
// (Lifted from registry.ts — the registry now reads pre-normalized layers from this cache.)
// Exported so the admin `validate` route can dry-run it per row to surface any layer that would
// throw on the next cache reload (Doc 16 Phase 4).
export function normalizeLayer(layer: JurisdictionLayer): JurisdictionLayer {
  const n: JurisdictionLayer = {
    ...layer,
    state_code: layer.state_code ? normalizeStateCode(layer.state_code) : undefined,
    county_fips: layer.county_fips ? normalizeCountyFips(layer.county_fips) ?? undefined : undefined,
    county_name: layer.county_name ? normalizeCountyName(layer.county_name) ?? undefined : undefined,
    city_name: layer.city_name ? normalizeCityName(layer.city_name) ?? undefined : undefined,
  };
  // Validate required keys per level — fail loud at load, never silently mis-index.
  if (n.level !== 'national' && !n.state_code) {
    throw new Error(`jurisdiction layer (${n.level}) missing state_code`);
  }
  if (n.level === 'county' && !n.county_fips && !n.county_name) {
    throw new Error(`county jurisdiction layer (${n.state_code}) missing county_fips/county_name`);
  }
  if (n.level === 'city' && !n.city_name) {
    throw new Error(`city jurisdiction layer (${n.state_code}) missing city_name`);
  }
  return n;
}

// ─── Loaders ────────────────────────────────────────────────────────────────────

/**
 * Load code_editions + jurisdiction_layers into memory. Call once at boot (and in test setup)
 * before any resolveJurisdiction() call. Idempotent — safe to call again to reload.
 */
export async function loadReferenceCache(pool: Queryable = pgPool): Promise<void> {
  const [editions, layers] = await Promise.all([
    pool.query(
      `SELECT trade, state_code, code_type, code_edition, nec_edition, notes FROM code_editions`,
    ),
    pool.query(
      `SELECT level, state_code, county_fips, county_name, city_name, ahj, codes, notes
         FROM jurisdiction_layers`,
    ),
  ]);

  const nextEditions = new Map<string, CachedEdition>();
  for (const r of editions.rows) {
    nextEditions.set(editionKey(r.trade, r.state_code), {
      code_type: r.code_type,
      code_edition: r.code_edition ?? null,
      nec_edition: r.nec_edition ?? null,
      notes: r.notes ?? null,
    });
  }

  const nextLayers: JurisdictionLayer[] = layers.rows.map((r) =>
    normalizeLayer({
      level: r.level,
      state_code: r.state_code ?? undefined,
      county_fips: r.county_fips ?? undefined,
      county_name: r.county_name ?? undefined,
      city_name: r.city_name ?? undefined,
      // ahj / codes are JSONB — pg returns them already parsed.
      ahj: r.ahj ?? undefined,
      codes: r.codes ?? undefined,
      notes: r.notes ?? undefined,
    }),
  );

  editionCache.clear();
  for (const [k, v] of nextEditions) editionCache.set(k, v);
  layerCache = nextLayers;
  loaded = true;
}

/** Reload the cache after an admin edit to code_editions / jurisdiction_layers. */
export async function refreshReferenceCache(pool: Queryable = pgPool): Promise<void> {
  await loadReferenceCache(pool);
}

/** True once loadReferenceCache() has succeeded at least once. */
export function isReferenceCacheLoaded(): boolean {
  return loaded;
}

function assertLoaded(): void {
  if (!loaded) {
    throw new Error(
      'jurisdiction reference cache not loaded — call loadReferenceCache() at boot before resolving',
    );
  }
}

// ─── Sync getters (read by the pure engine) ──────────────────────────────────────

/** Cached code facts for a (trade, state). null = no row → caller applies national fallback. */
export function getCachedEdition(trade: Trade, stateCode: string): CachedEdition | null {
  assertLoaded();
  return editionCache.get(editionKey(trade, stateCode)) ?? null;
}

/** All normalized override layers. Registry filters/sorts these per geo. */
export function getCachedLayers(): JurisdictionLayer[] {
  assertLoaded();
  return layerCache;
}

// ─── Async on-demand ZIP lookup ──────────────────────────────────────────────────

/**
 * Resolve a 5-digit ZIP to its primary county (max ratio). Queried on demand — zip_county is
 * never cached (large, low-frequency). Returns null for an unknown ZIP.
 */
export async function lookupZipCounty(
  zip: string,
  pool: Queryable = pgPool,
): Promise<ZipCountyRow | null> {
  const res = await pool.query(
    `SELECT county_fips, county_name, state_code, primary_city, ratio
       FROM zip_county
      WHERE zip = $1
      ORDER BY ratio DESC NULLS LAST
      LIMIT 1`,
    [zip],
  );
  if (res.rows.length === 0) return null;
  const r = res.rows[0];
  return {
    county_fips: r.county_fips,
    county_name: r.county_name,
    state_code: r.state_code,
    primary_city: r.primary_city ?? null,
    ratio: r.ratio === null || r.ratio === undefined ? null : Number(r.ratio),
  };
}
