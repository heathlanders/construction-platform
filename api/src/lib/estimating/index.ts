// estimating/index.ts — engine entry point. Pure, no I/O.
//
// buildEstimateLines(quantities, catalog, params) resolves each quantity against the catalog for its
// cost basis, computes money amounts, and attaches assumptions. Missing catalog codes degrade to a
// zero-cost line with an explicit assumption (never throws) so the estimator can fill it in.

import type { CatalogItem, EstimateLineDraft, EstimateParams, QuantityInput } from './types.js';
import { computeAmounts } from './math.js';

export type {
  CatalogItem, EstimateLineDraft, EstimateParams, EstimateTotals, QuantityInput, EstTrade, LineCostBasis, LineAmounts,
} from './types.js';
export { EST_TRADES } from './types.js';
export { computeAmounts, computeTotals } from './math.js';
export { seedQuantities, seedParametricQuantities, seedEquipmentQuantities, seedFromPacks, equipmentCode } from './quantities.js';

/** Build priced line drafts from quantities + a code→CatalogItem map + estimate params. */
export function buildEstimateLines(
  quantities: QuantityInput[],
  catalog: Map<string, CatalogItem>,
  params: EstimateParams,
): EstimateLineDraft[] {
  return quantities
    .filter((q) => q.quantity > 0)
    .map((q, i) => {
      const item = q.assembly_code ? catalog.get(q.assembly_code) ?? null : null;
      const assumptions = [...(q.assumptions ?? [])];
      if (q.assembly_code && !item) {
        assumptions.push(`No catalog match for "${q.assembly_code}" — cost basis defaults to zero; enter unit costs manually.`);
      }
      const basis = {
        quantity: q.quantity,
        material_unit_cents: item?.material_cost_cents ?? 0,
        labor_hours_per_unit: item?.labor_hours_per_unit ?? 0,
        equipment_unit_cents: item?.equipment_cost_cents ?? 0,
        waste_pct: item?.waste_pct ?? 0,
      };
      const amounts = computeAmounts(basis, params.labor_rate_cents);
      return {
        assembly_id: item?.id ?? null,
        assembly_code: q.assembly_code ?? null,
        trade: q.trade ?? item?.trade ?? null,
        description: q.description ?? item?.name ?? q.assembly_code ?? 'Line item',
        csi_division: q.csi_division ?? item?.csi_division ?? null,
        unit: q.unit ?? item?.unit ?? null,
        ...basis,
        ...amounts,
        assumptions,
        source: 'rule_engine' as const,
        sort_order: (i + 1) * 10,
      };
    });
}
