// jurisdictions.test.ts — tests for the deterministic jurisdiction/AHJ engine.
// Phase 2 (Doc 16): reference data (code_editions / jurisdiction_layers / zip_county) is now
// DB-backed. beforeAll seeds the WI-pilot reference rows and loads the in-memory cache, so these
// exercise the real loader path. Pure helpers (geography/merge) still need no DB.

import { describe, it, expect, beforeAll } from 'vitest';
import { resolveJurisdiction } from '../lib/jurisdictions/resolver.js';
import { listStateJurisdictions } from '../lib/jurisdictions/registry.js';
import { resolveDefaultTradeCode } from '../lib/jurisdictions/default-layer.js';
import { normalizeCityName, normalizeGeo, jurisdictionKey } from '../lib/jurisdictions/geography.js';
import { deriveCountyFromZip } from '../lib/jurisdictions/zip-county.js';
import { applySequenceOps, renumber, appendNote } from '../lib/jurisdictions/merge.js';
import type { InspectionStepDef } from '../lib/jurisdictions/types.js';
import { testPool } from './setup.js';
import { setupReferenceCache } from './seed-reference.js';

beforeAll(async () => {
  await setupReferenceCache(testPool);
});

describe('geography normalization', () => {
  it('strips municipal prefixes/suffixes and lowercases', () => {
    expect(normalizeCityName('City of Madison')).toBe('madison');
    expect(normalizeCityName('Village of Windsor')).toBe('windsor');
    expect(normalizeCityName('  Stoughton ')).toBe('stoughton');
    expect(normalizeCityName(null)).toBeNull();
  });

  it('builds a canonical jurisdiction_key, FIPS-preferred', () => {
    const geo = normalizeGeo({ state: 'wi', county_fips: '55025', city: 'City of Madison' });
    expect(jurisdictionKey(geo)).toBe('WI/55025/madison');
  });
});

describe('zip → county', () => {
  it('resolves Dane County for seeded Madison/Stoughton/Windsor zips', async () => {
    expect((await deriveCountyFromZip('53703'))?.county_fips).toBe('55025');
    expect((await deriveCountyFromZip('53589'))?.primary_city).toBe('Stoughton');
    expect((await deriveCountyFromZip('53598'))?.primary_city).toBe('Windsor');
    expect((await deriveCountyFromZip('53703-1234'))?.county_name).toBe('Dane'); // ZIP+4 tolerated
  });
  it('returns null for non-existent zips', async () => {
    expect(await deriveCountyFromZip('00000')).toBeNull(); // never a real US ZIP/ZCTA
    expect(await deriveCountyFromZip(null)).toBeNull();
  });
});

describe('merge helpers', () => {
  const steps: InspectionStepDef[] = [
    { sequence_order: 1, inspection_type: 'a', title: 'A', csi_division: '00', estimated_duration_days: 1 },
    { sequence_order: 2, inspection_type: 'b', title: 'B', csi_division: '00', estimated_duration_days: 1 },
  ];

  it('add/remove/modify/replace_all apply in order', () => {
    const added = applySequenceOps(steps, [{ op: 'add', step: { sequence_order: 0, inspection_type: 'pre', title: 'Pre', csi_division: '00', estimated_duration_days: 1 } }]);
    expect(added).toHaveLength(3);
    const removed = applySequenceOps(steps, [{ op: 'remove', inspection_type: 'a' }]);
    expect(removed.map((s) => s.inspection_type)).toEqual(['b']);
    const modified = applySequenceOps(steps, [{ op: 'modify', inspection_type: 'a', patch: { title: 'A2' } }]);
    expect(modified[0].title).toBe('A2');
    const replaced = applySequenceOps(steps, [{ op: 'replace_all', steps: [{ sequence_order: 1, inspection_type: 'x', title: 'X', csi_division: '00', estimated_duration_days: 1 }] }]);
    expect(replaced.map((s) => s.inspection_type)).toEqual(['x']);
  });

  it('renumber sorts and makes sequence contiguous 1..N', () => {
    const r = renumber([
      { sequence_order: 5, inspection_type: 'b', title: 'B', csi_division: '00', estimated_duration_days: 1 },
      { sequence_order: 0, inspection_type: 'a', title: 'A', csi_division: '00', estimated_duration_days: 1 },
    ]);
    expect(r.map((s) => [s.sequence_order, s.inspection_type])).toEqual([[1, 'a'], [2, 'b']]);
  });

  it('appendNote is additive and idempotent', () => {
    expect(appendNote(null, 'x')).toBe('x');
    expect(appendNote('a', 'b')).toBe('a b');
    expect(appendNote('a b', 'b')).toBe('a b'); // no dup
  });
});

describe('resolveJurisdiction — Dane County cities', () => {
  const base = { state: 'WI', county_fips: '55025', building_type: 'residential_sf' as const };

  it('Madison resolves the city AHJ and full cascade', () => {
    const r = resolveJurisdiction({ ...base, city: 'Madison' });
    expect(r.ahj?.ahj_name).toBe('City of Madison');
    expect(r.ahj?.ahj_level).toBe('city');
    expect(r.jurisdiction_key).toBe('WI/55025/madison');
    expect(r.matched_levels).toEqual(['state', 'county', 'city']);
  });

  it('Stoughton and Windsor resolve their own distinct AHJs', () => {
    expect(resolveJurisdiction({ ...base, city: 'Stoughton' }).ahj?.ahj_name).toBe('City of Stoughton');
    expect(resolveJurisdiction({ ...base, city: 'Village of Windsor' }).ahj?.ahj_name).toBe('Village of Windsor');
  });

  it('all three cities share the WI state-administered codes', () => {
    const cities = ['Madison', 'Stoughton', 'Windsor'].map((c) => resolveJurisdiction({ ...base, city: c }));
    const editions = cities.map((r) => r.trades.building.code_edition);
    expect(new Set(editions).size).toBe(1); // identical code edition
    for (const r of cities) {
      expect(r.trades.plumbing.jurisdiction_notes).toContain('SPS 382-387');
      expect(r.trades.building.jurisdiction_notes).toContain('Uniform Dwelling Code');
    }
  });

  it('Madison adds an erosion-control building inspection, renumbered into the sequence', () => {
    const def = resolveDefaultTradeCode('building', 'WI', 'residential_sf');
    const r = resolveJurisdiction({ ...base, city: 'Madison' });
    expect(r.trades.building.steps.length).toBe(def.steps.length + 1);
    expect(r.trades.building.steps.some((s) => s.inspection_type === 'erosion_control')).toBe(true);
    // contiguous 1..N
    expect(r.trades.building.steps.map((s) => s.sequence_order)).toEqual(
      r.trades.building.steps.map((_, i) => i + 1),
    );
    // a non-Madison Dane city does NOT get the erosion-control step
    const stoughton = resolveJurisdiction({ ...base, city: 'Stoughton' });
    expect(stoughton.trades.building.steps.some((s) => s.inspection_type === 'erosion_control')).toBe(false);
  });
});

describe('resolveJurisdiction — fallbacks', () => {
  it('WI county-only (no city) resolves the county AHJ', () => {
    const r = resolveJurisdiction({ state: 'WI', county_fips: '55025', building_type: 'commercial' });
    expect(r.ahj?.ahj_name).toBe('Dane County');
    expect(r.matched_levels).toEqual(['state', 'county']);
  });

  it('WI state-only resolves state codes but no AHJ', () => {
    const r = resolveJurisdiction({ state: 'WI', building_type: 'residential_sf' });
    expect(r.ahj).toBeNull();
    expect(r.matched_levels).toEqual(['state']);
    expect(r.trades.electrical.jurisdiction_notes).toContain('SPS 316');
  });

  it('listStateJurisdictions returns seeded WI layers (state→county→city) and nothing for unseeded', () => {
    const wi = listStateJurisdictions('wi');
    expect(wi.map((j) => j.level)).toEqual(['state', 'county', 'city', 'city', 'city']);
    expect(wi.filter((j) => j.level === 'city').map((j) => j.city_name).sort()).toEqual(['madison', 'stoughton', 'windsor']);
    expect(listStateJurisdictions('TX')).toEqual([]);
  });

  it('unknown state still resolves via the national default layer (no AHJ)', () => {
    const r = resolveJurisdiction({ state: 'TX', city: 'Austin', building_type: 'commercial' });
    expect(r.ahj).toBeNull();
    expect(r.matched_levels).toEqual([]);
    expect(r.trades.electrical.code_type).toBe('NEC');
    expect(r.trades.building.code_type).toBe('IBC'); // commercial → IBC
    expect(r.trades.building.steps.length).toBeGreaterThan(0);
  });
});
