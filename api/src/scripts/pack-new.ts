// pack-new.ts — scaffold a stub Trade Knowledge Pack (+ dossier) for a taxonomy key.
// Usage: npm run pack:new -- <key>            one pack + dossier
//        npm run pack:new -- --all-stubs      a stub pack for every taxonomy key without one (no dossiers)
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { TRADE_TAXONOMY, TRADE_BY_KEY, type TradeDef } from '../lib/trades/taxonomy.js';
import { REPO_ROOT } from '../lib/trades/packs/catalog-scan.js';
import { PACKS_DIR } from './pack-barrel.js';

export function stubPackSource(d: TradeDef): string {
  const q = (s: string) => JSON.stringify(s);
  return `// Trade Knowledge Pack — ${d.key} (${d.label}). STUB — research per docs/trade-packs/RESEARCH_PROMPT.md.
import { definePack } from './schema.js';

export default definePack({
  key: ${q(d.key)},
  schema_version: 1,
  pack_version: '0.0.1',
  status: 'stub',
  identity: {
    summary: ${q(`${d.label}.`)},
    summary_es: ${q(`${d.label_es}.`)},
    glossary: [],
  },
  recipes: [],
});
`;
}

function writeDossier(d: TradeDef): string {
  const dir = join(REPO_ROOT, 'docs', 'trade-packs', 'dossiers');
  mkdirSync(dir, { recursive: true });
  const path = join(dir, `${d.key}.md`);
  if (existsSync(path)) return path;
  const tpl = readFileSync(join(REPO_ROOT, 'docs', 'trade-packs', '_DOSSIER_TEMPLATE.md'), 'utf8');
  writeFileSync(path, tpl
    .replaceAll('<key>', d.key).replace('<Label>', d.label).replace('<category>', d.category)
    .replace('<family|null>', String(d.permit_trade)).replace('<default_phase>', d.default_phase)
    .replace('<csi>', d.csi_division));
  return path;
}

if (process.argv[1]?.endsWith('pack-new.ts')) {
  const arg = process.argv[2];
  if (!arg) { console.error('usage: pack:new -- <key> | --all-stubs'); process.exit(2); }
  const defs = arg === '--all-stubs' ? TRADE_TAXONOMY : [TRADE_BY_KEY.get(arg)];
  if (!defs[0]) { console.error(`unknown trade key '${arg}' — keys come from lib/trades/taxonomy.ts`); process.exit(2); }
  let made = 0;
  for (const d of defs as TradeDef[]) {
    const path = join(PACKS_DIR, `${d.key}.ts`);
    if (!existsSync(path)) { writeFileSync(path, stubPackSource(d)); made++; }
    if (arg !== '--all-stubs') console.log(`dossier: ${writeDossier(d)}`);
  }
  console.log(`created ${made} pack file(s). Now run: npm run pack:barrel`);
}
