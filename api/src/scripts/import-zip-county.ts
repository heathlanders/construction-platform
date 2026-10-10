// import-zip-county.ts — bulk US ZIP→county + county-FIPS ingest (Doc 16 Phase 3).
//
// Populates the two reference tables that scale to the whole US:
//   counties    (~3,143)  ← Census national_county2020.txt
//   zip_county  (~46k ZCTA↔county pairs) ← Census ZCTA↔county 2020 relationship file
//
// Source = free, no-auth, versioned public Census data (HUD's USPS crosswalk requires an API
// token; the Census ZCTA relationship file is the equivalent open source). ZCTA ≈ ZIP (PO-box-only
// ZIPs are absent — acceptable: those carry no buildable address). Primary county per ZIP = the
// county with the largest land-area intersection (ratio = part_land / sum_part_land for the ZIP);
// HUD's residential-address ratio is slightly better but token-gated. Multi-county ZIPs keep every
// row (the engine takes max ratio).
//
// Provenance (D-3): rows carry source + the dataset is dated via `last_verified` on counties? —
// counties has no such column; zip_county likewise. We record provenance in the run log only.
// Seeded primary_city hints (WI pilot) are PRESERVED via COALESCE on upsert.
//
// Usage:
//   npm run import:zip-county -- --fetch                  (dry run — fetch + parse + print counts)
//   npm run import:zip-county -- --fetch --apply          (fetch from Census + write)
//   npm run import:zip-county -- --zcta=a.txt --counties=b.txt --apply   (local files)

import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import https from 'node:https';
import { pgPool } from '../lib/db.js';

const ZCTA_REL_URL =
  'https://www2.census.gov/geo/docs/maps-data/data/rel2020/zcta520/tab20_zcta520_county20_natl.txt';
const NATIONAL_COUNTY_URL =
  'https://www2.census.gov/geo/docs/reference/codes2020/national_county2020.txt';

// ─── Pure parsers (unit-tested; no I/O) ──────────────────────────────────────────

export interface CountyRow {
  county_fips: string;
  county_name: string;
  state_code: string;
}

export interface ZipCountyRow {
  zip: string;
  county_fips: string;
  county_name: string;
  state_code: string;
  ratio: number;
}

// Split a pipe-delimited header into a name→index map (BOM-tolerant).
function headerIndex(headerLine: string): Record<string, number> {
  const cols = headerLine.replace(/^﻿/, '').split('|');
  const idx: Record<string, number> = {};
  cols.forEach((c, i) => (idx[c.trim()] = i));
  return idx;
}

/** Parse Census national_county2020.txt → county FIPS reference rows. */
export function parseCounties(text: string): CountyRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length === 0) return [];
  const h = headerIndex(lines[0]);
  const iState = h['STATE'], iStateFp = h['STATEFP'], iCountyFp = h['COUNTYFP'], iName = h['COUNTYNAME'];
  const out: CountyRow[] = [];
  for (let n = 1; n < lines.length; n++) {
    const f = lines[n].split('|');
    const stateFp = f[iStateFp]?.trim();
    const countyFp = f[iCountyFp]?.trim();
    const state = f[iState]?.trim();
    const name = f[iName]?.trim();
    if (!stateFp || !countyFp || !state || !name) continue;
    const fips = (stateFp + countyFp).padStart(5, '0');
    if (!/^\d{5}$/.test(fips)) continue;
    out.push({ county_fips: fips, county_name: name, state_code: state.toUpperCase() });
  }
  return out;
}

/**
 * Parse the Census ZCTA↔county relationship file → zip_county rows with a land-area ratio.
 * stateByFips maps a 5-digit county FIPS to its alpha state code (built from parseCounties).
 */
export function parseZctaCounty(text: string, stateByFips: Map<string, string>): ZipCountyRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length === 0) return [];
  const h = headerIndex(lines[0]);
  const iZip = h['GEOID_ZCTA5_20'], iCounty = h['GEOID_COUNTY_20'];
  const iName = h['NAMELSAD_COUNTY_20'], iPart = h['AREALAND_PART'];

  // First pass: collect raw (zip, county, name, part) for valid ZCTA rows + per-zip area totals.
  interface Raw { zip: string; county_fips: string; county_name: string; part: number; }
  const raws: Raw[] = [];
  const totalByZip = new Map<string, number>();
  for (let n = 1; n < lines.length; n++) {
    const f = lines[n].split('|');
    const zip = f[iZip]?.trim();
    const county = f[iCounty]?.trim();
    if (!zip || !/^\d{5}$/.test(zip)) continue;          // skip empty/county-only rows
    if (!county || !/^\d{5}$/.test(county)) continue;
    const part = Number(f[iPart]?.trim() || '0') || 0;
    raws.push({ zip, county_fips: county, county_name: (f[iName]?.trim() || ''), part });
    totalByZip.set(zip, (totalByZip.get(zip) ?? 0) + part);
  }

  const out: ZipCountyRow[] = [];
  for (const r of raws) {
    const total = totalByZip.get(r.zip) ?? 0;
    // Even-split fallback when every part is 0 (degenerate) so a primary still resolves.
    const ratio = total > 0 ? r.part / total : 1;
    out.push({
      zip: r.zip,
      county_fips: r.county_fips,
      county_name: r.county_name,
      state_code: (stateByFips.get(r.county_fips) ?? '').toUpperCase(),
      ratio,
    });
  }
  return out;
}

// ─── I/O ─────────────────────────────────────────────────────────────────────────

function fetchUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { 'User-Agent': 'thejobsite-codes-engine/1.0' } }, (res) => {
        if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
          res.resume();
          reject(new Error(`GET ${url} → ${res.statusCode}`));
          return;
        }
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (c) => (data += c));
        res.on('end', () => resolve(data));
      })
      .on('error', reject);
  });
}

function argVal(name: string): string | undefined {
  const p = process.argv.find((a) => a.startsWith(`--${name}=`));
  return p ? p.slice(name.length + 3) : undefined;
}

async function loadSource(kind: 'zcta' | 'counties', url: string): Promise<string> {
  const path = argVal(kind);
  if (path) {
    console.log(`  ${kind}: reading local file ${path}`);
    return readFileSync(path, 'utf8');
  }
  if (process.argv.includes('--fetch')) {
    console.log(`  ${kind}: fetching ${url}`);
    return fetchUrl(url);
  }
  throw new Error(`No source for ${kind}: pass --${kind}=<path> or --fetch`);
}

// Batched multi-row upsert.
async function upsertBatch<T>(
  client: { query: (q: string, p: unknown[]) => Promise<unknown> },
  rows: T[],
  cols: number,
  sql: (placeholders: string) => string,
  toParams: (r: T) => unknown[],
  batch = 1000,
): Promise<void> {
  for (let i = 0; i < rows.length; i += batch) {
    const slice = rows.slice(i, i + batch);
    const ph = slice
      .map((_, j) => `(${Array.from({ length: cols }, (_, k) => `$${j * cols + k + 1}`).join(',')})`)
      .join(',');
    const params = slice.flatMap(toParams);
    await client.query(sql(ph), params);
  }
}

async function main() {
  const APPLY = process.argv.includes('--apply');
  console.log(`import-zip-county — ${APPLY ? 'APPLY' : 'DRY RUN'}`);

  const [countiesText, zctaText] = await Promise.all([
    loadSource('counties', NATIONAL_COUNTY_URL),
    loadSource('zcta', ZCTA_REL_URL),
  ]);

  const counties = parseCounties(countiesText);
  const stateByFips = new Map(counties.map((c) => [c.county_fips, c.state_code]));
  const zips = parseZctaCounty(zctaText, stateByFips);

  const distinctZips = new Set(zips.map((z) => z.zip)).size;
  const missingState = zips.filter((z) => !/^[A-Z]{2}$/.test(z.state_code)).length;
  console.log(`  counties parsed:        ${counties.length}`);
  console.log(`  zip_county pairs parsed: ${zips.length} (distinct ZIPs: ${distinctZips})`);
  if (missingState) console.log(`  ⚠️  ${missingState} zip rows had no state match (county not in counties file)`);

  if (!APPLY) {
    console.log('\nDRY RUN — pass --apply to write.');
    await pgPool.end();
    return;
  }

  const client = await pgPool.connect();
  try {
    await client.query('BEGIN');

    await upsertBatch(
      client,
      counties,
      3,
      (ph) =>
        `INSERT INTO counties (county_fips, county_name, state_code) VALUES ${ph}
         ON CONFLICT (county_fips) DO UPDATE SET
           county_name=EXCLUDED.county_name, state_code=EXCLUDED.state_code`,
      (c) => [c.county_fips, c.county_name, c.state_code],
    );

    await upsertBatch(
      client,
      zips,
      5,
      (ph) =>
        `INSERT INTO zip_county (zip, county_fips, county_name, state_code, ratio) VALUES ${ph}
         ON CONFLICT (zip, county_fips) DO UPDATE SET
           county_name=EXCLUDED.county_name, state_code=EXCLUDED.state_code, ratio=EXCLUDED.ratio,
           primary_city=COALESCE(zip_county.primary_city, EXCLUDED.primary_city)`,
      (z) => [z.zip, z.county_fips, z.county_name, z.state_code, z.ratio],
    );

    await client.query('COMMIT');
    console.log(`\n✅ Applied ${counties.length} counties + ${zips.length} zip_county rows.`);
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
    await pgPool.end();
  }
}

// Run only when invoked directly (so the pure parsers can be imported by tests without side effects).
const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
