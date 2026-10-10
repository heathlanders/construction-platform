// seed-reference.ts — test helper to populate the codes/jurisdiction reference tables and load
// the in-memory cache (Doc 16 Phase 2). Uses the same ts-seed-source builders as the CLI seed
// scripts, so tests exercise the real DB-backed loader path.

import type pg from 'pg';
import {
  buildEditionRows,
  BASELINE_COUNTIES,
  WI_PILOT_ZIP_ROWS,
  SEED_LAYERS,
  SEED_SOURCE_TAG,
  LAYER_SOURCE_TAG,
  SEED_VERIFIED,
} from '../lib/jurisdictions/ts-seed-source.js';
import { loadReferenceCache } from '../lib/jurisdictions/reference-store.js';

type Pool = Pick<pg.Pool, 'query'>;

/** Insert (upsert) all WI-pilot reference rows into the test DB. Idempotent. */
export async function seedReferenceTables(pool: Pool): Promise<void> {
  for (const r of buildEditionRows()) {
    await pool.query(
      `INSERT INTO code_editions (trade, state_code, code_type, code_edition, nec_edition, notes, source, last_verified)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (trade, state_code) DO UPDATE SET
         code_type=EXCLUDED.code_type, code_edition=EXCLUDED.code_edition,
         nec_edition=EXCLUDED.nec_edition, notes=EXCLUDED.notes,
         source=EXCLUDED.source, last_verified=EXCLUDED.last_verified, updated_at=NOW()`,
      [r.trade, r.state_code, r.code_type, r.code_edition, r.nec_edition, r.notes, SEED_SOURCE_TAG, SEED_VERIFIED],
    );
  }
  for (const c of BASELINE_COUNTIES) {
    await pool.query(
      `INSERT INTO counties (county_fips, county_name, state_code) VALUES ($1,$2,$3)
       ON CONFLICT (county_fips) DO UPDATE SET county_name=EXCLUDED.county_name, state_code=EXCLUDED.state_code`,
      [c.county_fips, c.county_name, c.state_code],
    );
  }
  for (const r of WI_PILOT_ZIP_ROWS) {
    await pool.query(
      `INSERT INTO zip_county (zip, county_fips, county_name, state_code, primary_city, ratio)
       VALUES ($1,$2,$3,$4,$5,1.0)
       ON CONFLICT (zip, county_fips) DO UPDATE SET
         county_name=EXCLUDED.county_name, state_code=EXCLUDED.state_code,
         primary_city=EXCLUDED.primary_city, ratio=EXCLUDED.ratio`,
      [r.zip, r.county_fips, r.county_name, r.state_code, r.primary_city],
    );
  }
  await pool.query(`DELETE FROM jurisdiction_layers WHERE source = $1`, [LAYER_SOURCE_TAG]);
  for (const l of SEED_LAYERS) {
    await pool.query(
      `INSERT INTO jurisdiction_layers
         (level, state_code, county_fips, county_name, city_name, ahj, codes, notes, source, last_verified)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        l.level, l.state_code ?? null, l.county_fips ?? null, l.county_name ?? null, l.city_name ?? null,
        l.ahj ? JSON.stringify(l.ahj) : null, l.codes ? JSON.stringify(l.codes) : null, l.notes ?? null,
        LAYER_SOURCE_TAG, SEED_VERIFIED,
      ],
    );
  }
}

/** Seed the reference tables and load the in-memory cache. Call in a test beforeAll. */
export async function setupReferenceCache(pool: Pool): Promise<void> {
  await seedReferenceTables(pool);
  await loadReferenceCache(pool);
}
