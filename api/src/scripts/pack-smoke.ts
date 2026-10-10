// pack-smoke.ts — show what a pack actually produces: work steps per recipe (bare + with sample
// blueprint facts), seeded estimate quantities, and the knowledge/hazards payloads. Eyeball before PR.
// Usage: npm run pack:smoke -- <key>
import { packFor, packKnowledge, pickRecipe, unresolvedPlaceholders } from '../lib/trades/packs/runtime.js';
import { buildTaskSteps, EMPTY_FACTS } from '../lib/task-buildout/index.js';
import { seedFromPacks } from '../lib/estimating/quantities.js';
import { estTradeFor } from '../lib/estimating/trade-bucket.js';
import { tradeDef } from '../lib/trades/taxonomy.js';
import { getBuildingInspectionSequence } from '../lib/building-codes/inspection-sequences.js';
import { getInspectionSequence } from '../lib/electrical-codes/inspection-sequences.js';
import { getPlumbingInspectionSequence } from '../lib/plumbing-codes/inspection-sequences.js';
import { getMechanicalInspectionSequence } from '../lib/mechanical-codes/inspection-sequences.js';
import type { BlueprintFacts, BuildContext } from '../lib/task-buildout/types.js';
import type { ResolvedTradeCode } from '../lib/jurisdictions/types.js';
import { seededCatalogCodes } from '../lib/trades/packs/catalog-scan.js';

const key = process.argv[2];
// Optional building type (default residential_sf): `pack:smoke -- <key> commercial`. pole_barn maps to
// residential_sf for the codes engine and is passed as the plan type.
const BT_ARG = process.argv[3] ?? 'residential_sf';
const JURIS_BT = (BT_ARG === 'pole_barn' ? 'residential_sf' : BT_ARG) as 'residential_sf';
const pack = packFor(key);
const def = tradeDef(key);
if (!pack || !def) { console.error(`no pack for '${key}'`); process.exit(2); }

const fam = def.permit_trade;
const seq = fam === 'electrical' ? getInspectionSequence(JURIS_BT)
  : fam === 'plumbing' ? getPlumbingInspectionSequence(JURIS_BT)
  : fam === 'mechanical' ? getMechanicalInspectionSequence(JURIS_BT)
  : fam === 'building' ? getBuildingInspectionSequence(JURIS_BT) : [];
const codeType = { electrical: 'NEC', plumbing: 'IPC', mechanical: 'IMC', building: 'IRC' }[fam ?? 'building'] ?? '';
const resolved: ResolvedTradeCode = {
  code_type: fam ? codeType : '', code_edition: fam ? '2021' : null, nec_edition: null, jurisdiction_notes: null,
  steps: seq.map((s, i) => ({ ...s, sequence_order: i + 1 })) as never,
};
const SAMPLE: BlueprintFacts = {
  ...EMPTY_FACTS,
  panels: [{ amperage: 200, location: null }],
  rooms: [{ name: 'KITCHEN', area_sf: 220 }, { name: 'LIVING', area_sf: 340 }, { name: 'BEDROOM 1', area_sf: 160 }],
  window_count: 12, door_count: 8,
  fixtures: [{ type: 'fau', count: 1 }, { type: 'water_heater', count: 1 }],
  components: (pack.components ?? []).map((c) => c.token),
};

for (const r of pack.recipes.length ? pack.recipes : [{ id: '(none)', when: {} } as never]) {
  const title = (r as { example_title?: string }).example_title ?? `${def.label}`;
  const phase = (r as { when: { phase?: string[] } }).when.phase?.[0] ?? def.default_phase;
  for (const facts of [EMPTY_FACTS, SAMPLE]) {
    const ctx: BuildContext = { task: { trade_type: key, phase, csi_division: def.csi_division, title, description: null }, resolved, buildingType: JURIS_BT, planBuildingType: BT_ARG, facts };
    const steps = buildTaskSteps(ctx);
    console.log(`\n── recipe ${(r as { id: string }).id} · phase ${phase} · ${facts === EMPTY_FACTS ? 'no facts' : 'sample facts'} → ${steps.length} step(s)`);
    for (const s of steps) {
      console.log(`  ${s.step_order}. ${s.title}${s.gating_inspection_type ? `  [gate: ${s.gating_inspection_type}]` : ''}`);
      console.log(`     ${s.instruction}`);
      if (s.code_refs.length) console.log(`     codes: ${s.code_refs.map((c) => `${c.code_type} ${c.section}`).join(', ')}`);
      if (s.equipment?.length) console.log(`     equipment: ${s.equipment.map((e) => e.type).join(', ')}`);
    }
    const rec = pickRecipe(pack, ctx);
    for (const st of rec?.steps ?? []) {
      const miss = [st.title, st.instruction, st.detail ?? ''].flatMap((t) => unresolvedPlaceholders(t, ctx));
      if (miss.length) console.log(`     ⚠ unresolved placeholder(s) in "${st.title}": ${miss.join(', ')}`);
    }
  }
}
const available = new Set([...seededCatalogCodes().keys(), ...(pack.assemblies ?? []).map((a) => a.code)]);
const qty = seedFromPacks([key], SAMPLE, available, [estTradeFor(key)], new Set(), BT_ARG);
console.log(`\n── estimate quantities (sample facts, ${BT_ARG}, bucket ${estTradeFor(key)}): ${qty.length}`);
for (const q of qty) console.log(`  ${q.assembly_code} × ${q.quantity}  ${q.assumptions?.join(' ')}`);
const k = packKnowledge(pack, 'en');
console.log(`\n── knowledge: ${k.qa_checklist.length} QA · ${k.hazards.length} hazards · ${Object.keys(k.inspection_checklists).length} inspection checklists · ${k.glossary.length} glossary`);
const esK = packKnowledge(pack, 'es');
console.log(`   ES pending: ${esK.hazards.filter((h) => h.es_pending).length} hazards, ${esK.qa_checklist.filter((q) => q.es_pending).length} QA items`);
