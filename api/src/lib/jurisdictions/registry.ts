// Registry: matches the (pre-normalized) override layers to a geo.
// Override layers only — the national default is synthesized per-trade by default-layer.ts.
//
// Phase 2 (Doc 16): layers now come from the DB-backed in-memory cache (reference-store.ts),
// already normalized + validated at load. The registry is pure read/filter over that cache.

import type { JurisdictionLayer, NormalizedGeo, GeoLevel } from './types.js';
import { getCachedLayers } from './reference-store.js';
import { normalizeStateCode } from './geography.js';

const LEVEL_RANK: Record<GeoLevel, number> = { national: 0, state: 1, county: 2, city: 3 };

function countyMatches(layer: JurisdictionLayer, geo: NormalizedGeo): boolean {
  // FIPS is authoritative; fall back to county_name only when FIPS is absent on either side.
  if (layer.county_fips && geo.county_fips) return layer.county_fips === geo.county_fips;
  if (layer.county_name && geo.county_name) {
    return layer.county_name.toLowerCase() === geo.county_name.toLowerCase();
  }
  return false;
}

// Return all override layers matching the geo, sorted most-general → most-local.
export function findLayers(geo: NormalizedGeo): JurisdictionLayer[] {
  const matched = getCachedLayers().filter((layer) => {
    if (layer.state_code && layer.state_code !== geo.state_code) return false;
    switch (layer.level) {
      case 'national':
        return true;
      case 'state':
        return true; // state already matched above
      case 'county':
        return countyMatches(layer, geo);
      case 'city':
        // city must match name AND (county FIPS if both sides have it) to disambiguate
        // same-named cities across counties.
        if (!geo.city_name || layer.city_name !== geo.city_name) return false;
        if (layer.county_fips && geo.county_fips) return layer.county_fips === geo.county_fips;
        return true;
      default:
        return false;
    }
  });
  return matched.sort((a, b) => LEVEL_RANK[a.level] - LEVEL_RANK[b.level]);
}

// Seeded override layers for a state (which counties/cities carry an AHJ entry). Powers
// location pickers. Excludes the national default (synthesized, not a layer).
export interface JurisdictionSummary {
  level: GeoLevel;
  county_fips: string | null;
  county_name: string | null;
  city_name: string | null;
  ahj_name: string | null;
}

export function listStateJurisdictions(stateCode: string): JurisdictionSummary[] {
  const sc = normalizeStateCode(stateCode);
  return getCachedLayers().filter((l) => l.level !== 'national' && l.state_code === sc)
    .sort((a, b) => LEVEL_RANK[a.level] - LEVEL_RANK[b.level])
    .map((l) => ({
      level: l.level,
      county_fips: l.county_fips ?? null,
      county_name: l.county_name ?? null,
      city_name: l.city_name ?? null,
      ahj_name: l.ahj?.ahj_name ?? null,
    }));
}
