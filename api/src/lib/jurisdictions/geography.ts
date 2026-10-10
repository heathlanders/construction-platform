// Geography normalization for the jurisdiction engine. Pure functions, no I/O.
//
// Turns loose (state, county, city) input into canonical keys, and builds the denormalized
// jurisdiction_key that is frozen onto each permit. City names are matched case-insensitively;
// county is matched by FIPS first, name second.

import type { NormalizedGeo } from './types.js';

// Lowercase, collapse whitespace, drop common municipal prefixes/suffixes so
// "City of Madison", "Madison ", "Village of Windsor" all match the seeded city_name.
export function normalizeCityName(city: string | null | undefined): string | null {
  if (!city) return null;
  let s = city.trim().toLowerCase().replace(/\s+/g, ' ');
  s = s.replace(/^(city|town|village|township)\s+of\s+/i, '');
  s = s.replace(/\s+(city|town|village|township)$/i, '');
  s = s.trim();
  return s.length > 0 ? s : null;
}

export function normalizeCountyName(county: string | null | undefined): string | null {
  if (!county) return null;
  const s = county.trim().replace(/\s+/g, ' ').replace(/\s+county$/i, '').trim();
  return s.length > 0 ? s : null;
}

export function normalizeStateCode(state: string | null | undefined): string {
  return (state ?? '').trim().toUpperCase().slice(0, 2);
}

export function normalizeCountyFips(fips: string | null | undefined): string | null {
  if (!fips) return null;
  const s = fips.trim();
  return /^\d{5}$/.test(s) ? s : null;
}

export interface GeoInput {
  state?: string | null;
  county_fips?: string | null;
  county_name?: string | null;
  city?: string | null;
}

export function normalizeGeo(input: GeoInput): NormalizedGeo {
  return {
    state_code: normalizeStateCode(input.state),
    county_fips: normalizeCountyFips(input.county_fips),
    county_name: normalizeCountyName(input.county_name),
    city_name: normalizeCityName(input.city),
  };
}

// Canonical denormalized key stored on permits. Always includes state; appends the most
// specific geography available. county component prefers FIPS, falls back to normalized name.
export function jurisdictionKey(geo: NormalizedGeo): string {
  const parts: string[] = [geo.state_code || '??'];
  const county = geo.county_fips ?? (geo.county_name ? geo.county_name.toLowerCase() : null);
  if (county) parts.push(county);
  if (geo.city_name) parts.push(geo.city_name);
  return parts.join('/');
}
