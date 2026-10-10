// import-zip-county.test.ts — pure parser tests for the Census bulk ingest (Doc 16 Phase 3).
// No network, no DB — feeds tiny sample slices of the real Census file formats.

import { describe, it, expect } from 'vitest';
import { parseCounties, parseZctaCounty } from '../scripts/import-zip-county.js';

const COUNTIES_SAMPLE = [
  'STATE|STATEFP|COUNTYFP|COUNTYNS|COUNTYNAME|CLASSFP|FUNCSTAT',
  'AL|01|001|00161526|Autauga County|H1|A',
  'WI|55|025|01581104|Dane County|H1|A',
  'CA|06|037|00277283|Los Angeles County|H1|A',
].join('\n');

// ZCTA rel layout: GEOID_ZCTA5_20 = col1, GEOID_COUNTY_20 = col9, NAMELSAD_COUNTY_20 = col10,
// AREALAND_PART = col16. Empty leading columns mimic the real county-only rows.
const ZCTA_HEADER =
  '﻿OID_ZCTA5_20|GEOID_ZCTA5_20|NAMELSAD_ZCTA5_20|AREALAND_ZCTA5_20|AREAWATER_ZCTA5_20|MTFCC_ZCTA5_20|CLASSFP_ZCTA5_20|FUNCSTAT_ZCTA5_20|OID_COUNTY_20|GEOID_COUNTY_20|NAMELSAD_COUNTY_20|AREALAND_COUNTY_20|AREAWATER_COUNTY_20|MTFCC_COUNTY_20|CLASSFP_COUNTY_20|FUNCSTAT_COUNTY_20|AREALAND_PART|AREAWATER_PART';

function zctaRow(zip: string, county: string, name: string, part: string): string {
  const f = new Array(18).fill('');
  f[1] = zip; f[9] = county; f[10] = name; f[16] = part;
  return f.join('|');
}

const ZCTA_SAMPLE = [
  ZCTA_HEADER,
  '||||||||999|01001|County Only Row||||||500|0',   // empty ZCTA → skipped
  zctaRow('53703', '55025', 'Dane County', '1000'),  // single-county ZIP
  zctaRow('90210', '06037', 'Los Angeles County', '800'), // split ZIP, part A (bigger)
  zctaRow('90210', '06059', 'Orange County', '200'),      // split ZIP, part B
].join('\n');

describe('parseCounties', () => {
  it('builds 5-digit FIPS from STATEFP+COUNTYFP with alpha state', () => {
    const rows = parseCounties(COUNTIES_SAMPLE);
    expect(rows).toHaveLength(3);
    expect(rows.find((r) => r.county_fips === '55025')).toMatchObject({
      county_name: 'Dane County', state_code: 'WI',
    });
    expect(rows.find((r) => r.county_fips === '06037')?.state_code).toBe('CA');
  });
});

describe('parseZctaCounty', () => {
  const stateByFips = new Map(parseCounties(COUNTIES_SAMPLE).map((c) => [c.county_fips, c.state_code]));
  const rows = parseZctaCounty(ZCTA_SAMPLE, stateByFips);

  it('skips county-only rows (no ZCTA) and keeps valid ZIP↔county pairs', () => {
    expect(rows).toHaveLength(3); // 53703 + 90210×2
    expect(rows.some((r) => r.county_name === 'County Only Row')).toBe(false);
  });

  it('resolves alpha state_code from the county FIPS map', () => {
    expect(rows.find((r) => r.zip === '53703')?.state_code).toBe('WI');
    expect(rows.find((r) => r.zip === '90210' && r.county_fips === '06037')?.state_code).toBe('CA');
  });

  it('computes a land-area ratio per ZIP (primary = max ratio)', () => {
    const la = rows.find((r) => r.zip === '90210' && r.county_fips === '06037')!;
    const oc = rows.find((r) => r.zip === '90210' && r.county_fips === '06059')!;
    expect(la.ratio).toBeCloseTo(0.8, 5);
    expect(oc.ratio).toBeCloseTo(0.2, 5);
    expect(la.ratio).toBeGreaterThan(oc.ratio); // LA is the primary county for 90210
    // Single-county ZIP → ratio 1.
    expect(rows.find((r) => r.zip === '53703')?.ratio).toBeCloseTo(1, 5);
  });
});
