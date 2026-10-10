// import-county-centroids.test.ts — pure parser + inline zip extractor (no DB, no network).

import { describe, it, expect } from 'vitest';
import { deflateRawSync } from 'node:zlib';
import { parseGazetteerCounties, extractSingleZipEntry } from '../scripts/import-county-centroids.js';

const GAZ =
  'USPS\tGEOID\tANSICODE\tNAME\tALAND\tAWATER\tALAND_SQMI\tAWATER_SQMI\tINTPTLAT\tINTPTLONG\n' +
  'AL\t01001\t00161526\tAutauga County\t1\t1\t1\t1\t32.532237\t-86.646440\n' +
  'WI\t55025\t01581104\tDane County\t1\t1\t1\t1\t43.067000\t-89.418000\n' +
  'XX\t9999\t0\tBad County\t1\t1\t1\t1\t1.0\t2.0\n';        // bad FIPS → skipped

describe('parseGazetteerCounties', () => {
  it('parses valid rows with centroids and skips non-5-digit FIPS', () => {
    const rows = parseGazetteerCounties(GAZ);
    expect(rows).toHaveLength(2);
    const dane = rows.find((r) => r.county_fips === '55025')!;
    expect(dane.state_code).toBe('WI');
    expect(dane.county_name).toBe('Dane County');
    expect(dane.centroid_lat).toBeCloseTo(43.067, 3);
    expect(dane.centroid_lng).toBeCloseTo(-89.418, 3);
  });

  it('empty input → []', () => {
    expect(parseGazetteerCounties('')).toEqual([]);
  });
});

describe('extractSingleZipEntry', () => {
  // Build a minimal single-entry zip (deflate) around GAZ and round-trip it.
  function buildZip(name: string, content: string): Buffer {
    const body = deflateRawSync(Buffer.from(content, 'utf8'));
    const nameBuf = Buffer.from(name, 'utf8');
    const lfh = Buffer.alloc(30);
    lfh.writeUInt32LE(0x04034b50, 0);      // local file header signature
    lfh.writeUInt16LE(8, 8);               // method = deflate
    lfh.writeUInt32LE(body.length, 18);    // compressed size
    lfh.writeUInt32LE(content.length, 22); // uncompressed size
    lfh.writeUInt16LE(nameBuf.length, 26); // filename length
    lfh.writeUInt16LE(0, 28);              // extra length
    const cdir = Buffer.from([0x50, 0x4b, 0x01, 0x02]); // central dir sig (terminator)
    return Buffer.concat([lfh, nameBuf, body, cdir]);
  }

  it('inflates the single deflated entry', () => {
    const zip = buildZip('2023_Gaz_counties_national.txt', GAZ);
    expect(extractSingleZipEntry(zip)).toBe(GAZ);
  });

  it('extract → parse round-trip', () => {
    const zip = buildZip('x.txt', GAZ);
    expect(parseGazetteerCounties(extractSingleZipEntry(zip))).toHaveLength(2);
  });
});
