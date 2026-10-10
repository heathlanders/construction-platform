// seed-jurisdiction-layers.ts — migrate the inline seed/wi-*.ts override layers into the
// jurisdiction_layers table (Doc 16 Phase 2). ahj + codes (incl. sequence_ops) are stored as
// JSONB exactly as the TS literals define them.
//
// Idempotent: clears prior rows from this seed source, then re-inserts. jurisdiction_layers has
// no natural unique key (a state may carry many city layers), so we scope deletes by `source`.
//
// Usage:
//   npm run seed:jurisdiction-layers
//   npm run seed:jurisdiction-layers -- --apply

import { pgPool } from '../lib/db.js';
import { SEED_LAYERS, LAYER_SOURCE_TAG, SEED_VERIFIED } from '../lib/jurisdictions/ts-seed-source.js';

const APPLY = process.argv.includes('--apply');
const SOURCE = LAYER_SOURCE_TAG;
const VERIFIED = SEED_VERIFIED;

async function main() {
  console.log(`jurisdiction_layers to seed: ${SEED_LAYERS.length}`);
  for (const l of SEED_LAYERS) {
    const where = [l.state_code, l.county_fips, l.city_name].filter(Boolean).join('/');
    console.log(`  ${l.level.padEnd(6)} ${where}${l.ahj ? ` (AHJ: ${l.ahj.ahj_name})` : ''}`);
  }

  if (!APPLY) {
    console.log('\nDRY RUN — pass --apply to write.');
    await pgPool.end();
    return;
  }

  const client = await pgPool.connect();
  try {
    await client.query('BEGIN');
    // Replace this source's rows so re-runs don't duplicate.
    await client.query(`DELETE FROM jurisdiction_layers WHERE source = $1`, [SOURCE]);
    for (const l of SEED_LAYERS) {
      await client.query(
        `INSERT INTO jurisdiction_layers
           (level, state_code, county_fips, county_name, city_name, ahj, codes, notes, source, last_verified)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          l.level,
          l.state_code ?? null,
          l.county_fips ?? null,
          l.county_name ?? null,
          l.city_name ?? null,
          l.ahj ? JSON.stringify(l.ahj) : null,
          l.codes ? JSON.stringify(l.codes) : null,
          l.notes ?? null,
          SOURCE,
          VERIFIED,
        ],
      );
    }
    await client.query('COMMIT');
    console.log(`\n✅ Applied ${SEED_LAYERS.length} jurisdiction_layers.`);
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
