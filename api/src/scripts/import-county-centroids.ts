// import-county-centroids.ts — county centroid ingest for the Project Map (Doc 20, MQ-1).
//
// Populates counties.centroid_lat / centroid_lng (migration 0036) from the free Census Gazetteer
// national county file (tab-delimited; INTPTLAT / INTPTLONG internal points). These centroids are
// the `approximate` geocode fallback when the Census address geocoder misses (geocode-worker.ts).
//
// Source = free, no-auth, versioned public Census Gazetteer. It ships as a single-entry .zip; this
// script fetches + inflates it inline (no zip dependency), or reads a pre-unzipped .txt via --file.
// Rows also carry NAME + USPS so a county absent from `counties` is inserted, not just updated.
//
// Usage:
//   npm run import:county-centroids -- --fetch                 (dry run — fetch + parse + counts)
//   npm run import:county-centroids -- --fetch --apply         (fetch from Census + write)
//   npm run import:county-centroids -- --file=gaz.txt --apply  (local unzipped Gazetteer .txt)

import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { inflateRawSync } from 'node:zlib';
import https from 'node:https';
import { pgPool } from '../lib/db.js';

const GAZETTEER_ZIP_URL =
  'https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2023_Gazetteer/2023_Gaz_counties_national.zip';

// ─── Pure parser (unit-testable; no I/O) ─────────────────────────────────────────

export interface CountyCentroidRow {
  county_fips: string;
  county_name: string;
  state_code: string;
  centroid_lat: number;
  centroid_lng: number;
}

function headerIndex(headerLine: string): Record<string, number> {
  const cols = headerLine.replace(/^﻿/, '').split('\t');
  const idx: Record<string, number> = {};
  cols.forEach((c, i) => (idx[c.trim()] = i));
  return idx;
}

/** Parse the Census Gazetteer national county file (tab-delimited) → centroid rows. */
export function parseGazetteerCounties(text: string): CountyCentroidRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length === 0) return [];
  const h = headerIndex(lines[0]);
  const iGeoid = h['GEOID'], iName = h['NAME'], iUsps = h['USPS'];
  const iLat = h['INTPTLAT'], iLng = h['INTPTLONG'];
  const out: CountyCentroidRow[] = [];
  for (let n = 1; n < lines.length; n++) {
    const f = lines[n].split('\t');
    const fips = f[iGeoid]?.trim();
    if (!fips || !/^\d{5}$/.test(fips)) continue;
    const lat = Number(f[iLat]?.trim());
    const lng = Number(f[iLng]?.trim());
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    out.push({
      county_fips: fips,
      county_name: (f[iName]?.trim() || ''),
      state_code: (f[iUsps]?.trim() || '').toUpperCase(),
      centroid_lat: lat,
      centroid_lng: lng,
    });
  }
  return out;
}

// ─── I/O ─────────────────────────────────────────────────────────────────────────

function fetchBuffer(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { 'User-Agent': 'thejobsite-codes-engine/1.0' } }, (res) => {
        if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
          res.resume();
          reject(new Error(`GET ${url} → ${res.statusCode}`));
          return;
        }
        const chunks: Buffer[] = [];
        res.on('data', (c) => chunks.push(c as Buffer));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      })
      .on('error', reject);
  });
}

/**
 * Extract the single text entry from a Gazetteer .zip (no zip dependency).
 * Reads the first local file header (PK\x03\x04), then either returns the stored bytes or
 * inflates the deflated bytes up to the central directory (PK\x01\x02).
 */
export function extractSingleZipEntry(zip: Buffer): string {
  const LFH = zip.indexOf(Buffer.from([0x50, 0x4b, 0x03, 0x04]));
  if (LFH !== 0 && LFH === -1) throw new Error('not a zip (no local file header)');
  const start = LFH === -1 ? 0 : LFH;
  const method = zip.readUInt16LE(start + 8);
  const compSize = zip.readUInt32LE(start + 18);
  const nameLen = zip.readUInt16LE(start + 26);
  const extraLen = zip.readUInt16LE(start + 28);
  const dataStart = start + 30 + nameLen + extraLen;

  // Prefer the header's compressed size; fall back to slicing up to the central directory
  // (handles data-descriptor entries where compSize is 0 in the header).
  const cdir = zip.indexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02]), dataStart);
  const end = compSize > 0 ? dataStart + compSize : cdir === -1 ? zip.length : cdir;
  const body = zip.subarray(dataStart, end);

  if (method === 0) return body.toString('utf8');       // stored
  if (method === 8) return inflateRawSync(body).toString('utf8'); // deflate
  throw new Error(`unsupported zip compression method ${method}`);
}

function argVal(name: string): string | undefined {
  const p = process.argv.find((a) => a.startsWith(`--${name}=`));
  return p ? p.slice(name.length + 3) : undefined;
}

async function loadGazetteer(): Promise<string> {
  const path = argVal('file');
  if (path) {
    console.log(`  reading local file ${path}`);
    return readFileSync(path, 'utf8');
  }
  if (process.argv.includes('--fetch')) {
    console.log(`  fetching ${GAZETTEER_ZIP_URL}`);
    const zip = await fetchBuffer(GAZETTEER_ZIP_URL);
    return extractSingleZipEntry(zip);
  }
  throw new Error('No source: pass --file=<path> or --fetch');
}

async function upsertBatch(
  client: { query: (q: string, p: unknown[]) => Promise<unknown> },
  rows: CountyCentroidRow[],
  batch = 1000,
): Promise<void> {
  const cols = 5;
  for (let i = 0; i < rows.length; i += batch) {
    const slice = rows.slice(i, i + batch);
    const ph = slice
      .map((_, j) => `(${Array.from({ length: cols }, (_, k) => `$${j * cols + k + 1}`).join(',')})`)
      .join(',');
    const params = slice.flatMap((r) => [
      r.county_fips, r.county_name, r.state_code, r.centroid_lat, r.centroid_lng,
    ]);
    await client.query(
      `INSERT INTO counties (county_fips, county_name, state_code, centroid_lat, centroid_lng)
       VALUES ${ph}
       ON CONFLICT (county_fips) DO UPDATE SET
         centroid_lat = EXCLUDED.centroid_lat,
         centroid_lng = EXCLUDED.centroid_lng`,
      params,
    );
  }
}

async function main() {
  const APPLY = process.argv.includes('--apply');
  console.log(`import-county-centroids — ${APPLY ? 'APPLY' : 'DRY RUN'}`);

  const text = await loadGazetteer();
  const rows = parseGazetteerCounties(text);
  console.log(`  counties parsed with centroids: ${rows.length}`);

  if (!APPLY) {
    console.log('\nDRY RUN — pass --apply to write.');
    await pgPool.end();
    return;
  }

  const client = await pgPool.connect();
  try {
    await client.query('BEGIN');
    await upsertBatch(client, rows);
    await client.query('COMMIT');
    console.log(`\n✅ Applied centroids for ${rows.length} counties.`);
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
    await pgPool.end();
  }
}

const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
