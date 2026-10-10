// ts-seed-source.ts — pure builders that turn the inline TS code libs + seed layers into the
// row shapes for the reference tables (Doc 16 Phase 2). NO I/O — imported by both the CLI seed
// scripts (api/src/scripts/seed-*.ts) and the test seeding helper so they can never drift.
//
// The 4 *-editions.ts libs + seed/wi-*.ts remain the source of truth until retired post-Phase 2.

import { NEC_JURISDICTIONS } from '../electrical-codes/nec-editions.js';
import { PLUMBING_JURISDICTIONS } from '../plumbing-codes/code-editions.js';
import { MECHANICAL_JURISDICTIONS } from '../mechanical-codes/code-editions.js';
import { BUILDING_JURISDICTIONS } from '../building-codes/code-editions.js';
import { SEED_LAYERS } from './seed/index.js';
import type { JurisdictionLayer } from './types.js';

export const SEED_SOURCE_TAG = 'inline-ts:0020-phase2';
export const LAYER_SOURCE_TAG = 'inline-ts:wi-pilot';
export const SEED_VERIFIED = '2026-06-22';
// Provenance tag for rows written by the super-admin curation API (Doc 16 Phase 4).
// Distinct from the seed tags so `seed:* --apply` re-runs (which delete only their own
// source tag) never clobber admin-curated rows.
export const ADMIN_SOURCE_TAG = 'admin-curation';

export interface EditionRow {
  trade: 'electrical' | 'plumbing' | 'mechanical' | 'building';
  state_code: string;
  code_type: string;
  code_edition: string | null;
  nec_edition: string | null;
  notes: string | null;
}

export function buildEditionRows(): EditionRow[] {
  const rows: EditionRow[] = [];

  for (const j of NEC_JURISDICTIONS) {
    rows.push({
      trade: 'electrical',
      state_code: j.state_code.toUpperCase(),
      code_type: 'NEC',
      code_edition: j.nec_edition,
      nec_edition: j.nec_edition,
      notes: j.notes ?? null,
    });
  }
  for (const j of PLUMBING_JURISDICTIONS) {
    rows.push({
      trade: 'plumbing',
      state_code: j.state_code.toUpperCase(),
      code_type: j.code_family, // IPC | UPC
      code_edition: j.edition,
      nec_edition: null,
      notes: j.notes ?? null,
    });
  }
  for (const j of MECHANICAL_JURISDICTIONS) {
    rows.push({
      trade: 'mechanical',
      state_code: j.state_code.toUpperCase(),
      code_type: j.code_family, // IMC | UMC
      code_edition: j.edition,
      nec_edition: null,
      notes: j.notes ?? null,
    });
  }
  for (const j of BUILDING_JURISDICTIONS) {
    rows.push({
      trade: 'building',
      state_code: j.state_code.toUpperCase(),
      // ICC family (IRC/IBC) is occupancy-derived at resolve time — placeholder; ignored for building.
      code_type: 'ICC',
      code_edition: j.edition,
      nec_edition: null,
      notes: j.notes ?? null,
    });
  }

  return rows;
}

// Baseline counties — pilot only (Phase 3 ingest replaces with the full FIPS list).
export const BASELINE_COUNTIES: Array<{ county_fips: string; county_name: string; state_code: string }> = [
  { county_fips: '55025', county_name: 'Dane', state_code: 'WI' },
];

export interface ZipRow {
  zip: string;
  county_fips: string;
  county_name: string;
  state_code: string;
  primary_city: string;
}

function mapZips(zips: string[], base: Omit<ZipRow, 'zip'>): ZipRow[] {
  return zips.map((zip) => ({ zip, ...base }));
}

const DANE = { county_fips: '55025', county_name: 'Dane', state_code: 'WI' };

// WI pilot ZIPs — formerly inline in zip-county.ts. ratio = 1.0 (single-county).
export const WI_PILOT_ZIP_ROWS: ZipRow[] = [
  ...mapZips(
    ['53701', '53703', '53704', '53705', '53706', '53711', '53713', '53714',
     '53715', '53716', '53717', '53718', '53719', '53726', '53792'],
    { ...DANE, primary_city: 'Madison' },
  ),
  ...mapZips(['53589'], { ...DANE, primary_city: 'Stoughton' }),
  ...mapZips(['53598'], { ...DANE, primary_city: 'Windsor' }),
  ...mapZips(['53527'], { ...DANE, primary_city: 'Cottage Grove' }),
];

export { SEED_LAYERS };
export type { JurisdictionLayer };
