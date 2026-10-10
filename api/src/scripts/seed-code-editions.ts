// seed-code-editions.ts — migrate the 4 inline *-editions.ts trade libs into the code_editions
// table (Doc 16 Phase 2). Also seeds a baseline counties row set (Dane County WI pilot; the full
// ~3,143-county list arrives with the Phase 3 HUD/Census ingest via import-zip-county.ts).
//
// Row shapes come from lib/jurisdictions/ts-seed-source.ts (shared with the test seeder).
// Idempotent: upserts on the natural keys.
//
// Usage:
//   npm run seed:code-editions            (dry run — prints counts, writes nothing)
//   npm run seed:code-editions -- --apply (writes)

import { pgPool } from '../lib/db.js';
import {
  buildEditionRows,
  BASELINE_COUNTIES,
  SEED_SOURCE_TAG,
  SEED_VERIFIED,
} from '../lib/jurisdictions/ts-seed-source.js';

const APPLY = process.argv.includes('--apply');

async function main() {
  const rows = buildEditionRows();
  console.log(`code_editions rows to upsert: ${rows.length}`);
  const byTrade = rows.reduce<Record<string, number>>((a, r) => ((a[r.trade] = (a[r.trade] ?? 0) + 1), a), {});
  console.log('  by trade:', byTrade);
  console.log(`counties rows to upsert: ${BASELINE_COUNTIES.length}`);

  if (!APPLY) {
    console.log('\nDRY RUN — pass --apply to write.');
    await pgPool.end();
    return;
  }

  const client = await pgPool.connect();
  try {
    await client.query('BEGIN');
    for (const r of rows) {
      await client.query(
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
      await client.query(
        `INSERT INTO counties (county_fips, county_name, state_code) VALUES ($1,$2,$3)
         ON CONFLICT (county_fips) DO UPDATE SET county_name=EXCLUDED.county_name, state_code=EXCLUDED.state_code`,
        [c.county_fips, c.county_name, c.state_code],
      );
    }
    await client.query('COMMIT');
    console.log(`\n✅ Applied ${rows.length} code_editions + ${BASELINE_COUNTIES.length} counties.`);
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
    await pgPool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
