// seed-zip-county.ts — seed the WI pilot ZIP↔county rows into zip_county (Doc 16 Phase 2).
//
// Data lives in lib/jurisdictions/ts-seed-source.ts (WI_PILOT_ZIP_ROWS), formerly inline in
// zip-county.ts. The full US ZIP crosswalk (~41k) arrives with Phase 3 (import-zip-county.ts
// from the HUD/Census source). ratio = 1.0 for these single-county pilot ZIPs.
//
// Idempotent: upsert on PK (zip, county_fips).
//
// Usage:
//   npm run seed:zip-county
//   npm run seed:zip-county -- --apply

import { pgPool } from '../lib/db.js';
import { WI_PILOT_ZIP_ROWS } from '../lib/jurisdictions/ts-seed-source.js';

const APPLY = process.argv.includes('--apply');

async function main() {
  console.log(`zip_county rows to upsert: ${WI_PILOT_ZIP_ROWS.length} (Dane County WI pilot)`);
  if (!APPLY) {
    console.log('\nDRY RUN — pass --apply to write.');
    await pgPool.end();
    return;
  }

  const client = await pgPool.connect();
  try {
    await client.query('BEGIN');
    for (const r of WI_PILOT_ZIP_ROWS) {
      await client.query(
        `INSERT INTO zip_county (zip, county_fips, county_name, state_code, primary_city, ratio)
         VALUES ($1,$2,$3,$4,$5,1.0)
         ON CONFLICT (zip, county_fips) DO UPDATE SET
           county_name=EXCLUDED.county_name, state_code=EXCLUDED.state_code,
           primary_city=EXCLUDED.primary_city, ratio=EXCLUDED.ratio`,
        [r.zip, r.county_fips, r.county_name, r.state_code, r.primary_city],
      );
    }
    await client.query('COMMIT');
    console.log(`\n✅ Applied ${WI_PILOT_ZIP_ROWS.length} zip_county rows.`);
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
