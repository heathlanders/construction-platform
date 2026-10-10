// task-buildout/index.ts — the build-out engine entry point. Pure, no I/O.
//
// buildTaskSteps(ctx) dispatches by the task's permit trade to the right per-trade recipe module,
// renumbers steps 1..N, and drops any gating_inspection_type the resolved jurisdiction sequence does
// NOT actually contain (so a step never references an inspection an AHJ amended away). Returns [] when
// the task has no trade (no codes to build against).

import { tradeToPermitTrade } from '../jurisdictions/trade-map.js';
import { tradeDef } from '../trades/taxonomy.js';
import type { BuildContext, EquipmentNeed, WorkStep } from './types.js';
import { buildElectrical } from './electrical.js';
import { buildPlumbing } from './plumbing.js';
import { buildMechanical } from './mechanical.js';
import { buildBuilding } from './building.js';
import { buildNoPermit } from './nopermit.js';
import { equipmentFor } from './equipment-rules.js';
import { normalizeTradeKey } from '../trades/taxonomy.js';
import { packFor, renderPackSteps, packMayReplace, packEquipment } from '../trades/packs/runtime.js';

export type { WorkStep, BuildContext, BlueprintFacts, CodeRef, EquipmentNeed } from './types.js';
export { EMPTY_FACTS } from './types.js';
export { buildBlueprintFacts } from './facts.js';

// Precedence (Doc 23 §5): a Trade Knowledge Pack recipe whose Match hits wins for trades WITHOUT a
// hand-coded recipe (or when the recipe sets supersedes_hand); otherwise the hand recipe below runs.
// Pack equipment rules are consulted before the family rules on both paths.
function mergeEquipment(a: EquipmentNeed[], b: EquipmentNeed[]): EquipmentNeed[] {
  const seen = new Set<string>();
  return [...a, ...b].filter((e) => (seen.has(e.type) ? false : (seen.add(e.type), true)));
}

export function buildTaskSteps(ctx: BuildContext): WorkStep[] {
  const permitTrade = tradeToPermitTrade(ctx.task.trade_type);
  const tradeKey = normalizeTradeKey(ctx.task.trade_type);
  const pack = packFor(tradeKey);
  const packed = pack ? renderPackSteps(pack, ctx, !!permitTrade) : { steps: [], recipe: null };
  const usePack = !!tradeKey && packed.steps.length > 0 && packMayReplace(tradeKey, packed.recipe);
  const packEq = (title: string) => {
    const eq = pack ? packEquipment(pack, ctx, title) : [];
    return eq.length > 0 ? eq : null;
  };

  if (!permitTrade) {
    // T-64: a KNOWN taxonomy trade with permit_trade null (painting, tile, cabinetry, striping …)
    // still gets work steps — just with no code refs and no gating inspection. No trade at all → [].
    if (!tradeDef(ctx.task.trade_type)) return [];
    const steps = usePack ? packed.steps : buildNoPermit(ctx);
    return steps.map((s, i) => ({
      ...s,
      step_order: i + 1,
      gating_inspection_type: undefined,
      ...(s.equipment ?? packEq(s.title) ? { equipment: s.equipment ?? packEq(s.title)! } : {}),
    }));
  }

  let steps: WorkStep[];
  if (usePack) {
    steps = packed.steps;
  } else {
    switch (permitTrade) {
      case 'electrical': steps = buildElectrical(ctx); break;
      case 'plumbing': steps = buildPlumbing(ctx); break;
      case 'mechanical': steps = buildMechanical(ctx); break;
      case 'building': steps = buildBuilding(ctx); break;
      default: return [];
    }
  }

  // Only keep a gating inspection if it exists in the resolved (AHJ-merged) sequence.
  // Attach equipment recommendations centrally so the recipe modules don't each repeat the mapping.
  const validInsp = new Set(ctx.resolved.steps.map((s) => s.inspection_type));
  return steps.map((s, i) => ({
    ...s,
    step_order: i + 1,
    // Hand-recipe steps: pack equipment ADDS to the family rules (pack first, dedup by type) — never
    // hides e.g. the crane a truss set needs. Pack-recipe steps: the pack's own equipment rules win
    // (family rules are phase-keyed and misfire — an excavator on interior crack injection or asbestos
    // removal). A pack recipe with no equipment rules recommends none.
    equipment: s.equipment ?? (usePack
      ? packEq(s.title) ?? []
      : mergeEquipment(packEq(s.title) ?? [], equipmentFor(permitTrade, ctx, s.title))),
    gating_inspection_type:
      s.gating_inspection_type && validInsp.has(s.gating_inspection_type) ? s.gating_inspection_type : undefined,
  }));
}
