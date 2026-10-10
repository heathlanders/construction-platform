// pack-check.ts — validate one pack (or all) against the schema + guards. Fast; run per trade.
// Usage: npm run pack:check [-- <key>]
import { PACK_FILES } from '../lib/trades/packs/index.js';
import { packErrors, crossPackErrors, coverage } from '../lib/trades/packs/guards.js';
import { seededCatalogCodes } from '../lib/trades/packs/catalog-scan.js';
import { CATALOG_MANIFEST } from '../lib/trades/packs/catalog-manifest.js';
import { CORE_COMPONENT_TOKENS } from '../lib/blueprint-pdf/parse-sheets.js';

const only = process.argv[2];
const seeded = seededCatalogCodes();
const catalogCodes = new Set(seeded.keys());
const foreign = new Set([...seeded.keys()].filter((c) => !(c in CATALOG_MANIFEST)));
let bad = 0;
for (const [fileKey, pack] of PACK_FILES) {
  if (only && fileKey !== only) continue;
  const errs = packErrors(pack, { fileKey, catalogCodes: new Set([...catalogCodes, ...(pack.assemblies ?? []).map((a) => a.code)]) });
  const unseeded = (pack.assemblies ?? []).filter((a) => !(a.code in CATALOG_MANIFEST)).map((a) => a.code);
  if (errs.length) { bad++; console.log(`✗ ${fileKey}\n  - ${errs.join('\n  - ')}`); }
  else console.log(`✓ ${fileKey} (${pack.status})${unseeded.length ? ` — ${unseeded.length} assembly code(s) not yet in a migration: run gen:catalog-migration` : ''}`);
}
const cross = crossPackErrors(PACK_FILES.map(([, p]) => p), { coreTokens: CORE_COMPONENT_TOKENS, foreignCodes: foreign });
if (cross.length) { bad++; console.log(`✗ cross-pack\n  - ${cross.join('\n  - ')}`); }
if (!only) console.log('coverage:', coverage(PACK_FILES.map(([, p]) => p)));
if (only && !PACK_FILES.some(([k]) => k === only)) { console.error(`no pack file for '${only}'`); process.exit(2); }
process.exit(bad ? 1 : 0);
