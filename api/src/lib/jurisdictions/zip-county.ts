// ZIP → county lookup. Reference data, queried on demand from the zip_county table.
//
// Phase 2 (Doc 16): the inline ZIP_COUNTY map was migrated to the zip_county table and is now
// queried via reference-store.lookupZipCounty(). These functions became async — all callers
// (permit create, blueprint worker, jurisdictions routes) already run in async contexts.
//
// Used to derive a project's county (and a hint city) when projects.county_fips is unset.
// `primary_city` is the dominant municipality for the ZIP — a hint for AHJ matching when the
// project's own city field is blank. The project's city always wins when present.

import type pg from 'pg';
import { pgPool } from '../db.js';
import { lookupZipCounty } from './reference-store.js';

type Queryable = Pick<pg.Pool, 'query'>;

export interface ZipCountyEntry {
  county_fips: string;
  county_name: string;
  state_code: string;
  primary_city: string | null;
}

// Normalize a ZIP+4 or padded ZIP down to the 5-digit key.
function zip5(zip: string | null | undefined): string | null {
  if (!zip) return null;
  const m = zip.trim().match(/^(\d{5})/);
  return m ? m[1] : null;
}

export async function deriveCountyFromZip(
  zip: string | null | undefined,
  pool: Queryable = pgPool,
): Promise<ZipCountyEntry | null> {
  const key = zip5(zip);
  if (!key) return null;
  const row = await lookupZipCounty(key, pool);
  if (!row) return null;
  return {
    county_fips: row.county_fips,
    county_name: row.county_name,
    state_code: row.state_code,
    primary_city: row.primary_city,
  };
}

// ─── OCR ZIP repair ──────────────────────────────────────────────────────────────
// Tesseract misreads digits on builder title blocks (observed: Cottage Grove 53527 → 53521,
// a 7→1 swap). We repair conservatively: generate single-digit OCR-confusable variants of the
// OCR'd ZIP and accept one ONLY if it's a ZIP we already know for the expected jurisdiction
// (county/city/state from a matched builder profile). Never invents an unseeded ZIP.
const OCR_DIGIT_CONFUSIONS: Record<string, string[]> = {
  '0': ['8', '6', '9'],
  '1': ['7'],
  '2': ['7'],
  '3': ['8', '9'],
  '4': ['9'],
  '5': ['6', '8', '9'],
  '6': ['5', '8', '0'],
  '7': ['1', '2'],
  '8': ['6', '0', '3', '5'],
  '9': ['4', '0', '3', '5'],
};

function confusableVariants(zip: string): string[] {
  const out = new Set<string>();
  for (let i = 0; i < zip.length; i++) {
    for (const alt of OCR_DIGIT_CONFUSIONS[zip[i]] ?? []) {
      out.add(zip.slice(0, i) + alt + zip.slice(i + 1));
    }
  }
  return [...out];
}

export interface ZipRepairFilter {
  county_fips?: string | null;
  city?: string | null;       // matched case-insensitively against entry.primary_city
  state?: string | null;
}

function normCity(s: string | null | undefined): string | null {
  if (!s) return null;
  return s.trim().toLowerCase().replace(/\s+/g, ' ') || null;
}

/**
 * Repair an OCR'd ZIP against a known jurisdiction. Returns the corrected 5-digit ZIP, the
 * original if it's already valid for the filter, or the original (uncorrected) when no
 * single-digit confusable variant matches a known ZIP for that jurisdiction.
 *
 * One DB round-trip: fetch the original + all confusable candidates at once, then prefer the
 * original, falling back to the first matching variant.
 */
export async function repairOcrZip(
  zip: string | null | undefined,
  filter: ZipRepairFilter = {},
  pool: Queryable = pgPool,
): Promise<string | null> {
  const z = zip5(zip);
  if (!z) return zip ?? null;

  const variants = confusableVariants(z);
  const candidates = [z, ...variants];

  // Pull primary county row per candidate ZIP in one query.
  const res = await pool.query(
    `SELECT DISTINCT ON (zip) zip, county_fips, county_name, state_code, primary_city
       FROM zip_county
      WHERE zip = ANY($1::char(5)[])
      ORDER BY zip, ratio DESC NULLS LAST`,
    [candidates],
  );
  const byZip = new Map<string, { county_fips: string; state_code: string; primary_city: string | null }>();
  for (const r of res.rows) {
    byZip.set(r.zip, { county_fips: r.county_fips, state_code: r.state_code, primary_city: r.primary_city ?? null });
  }

  const matches = (zipKey: string): boolean => {
    const e = byZip.get(zipKey);
    return (
      !!e &&
      (!filter.county_fips || e.county_fips === filter.county_fips) &&
      (!filter.state || e.state_code === filter.state.toUpperCase()) &&
      (!filter.city || normCity(e.primary_city) === normCity(filter.city))
    );
  };

  if (matches(z)) return z; // already correct for this jurisdiction
  for (const v of variants) {
    if (matches(v)) return v;
  }
  return z; // unrepairable — keep what OCR read
}
