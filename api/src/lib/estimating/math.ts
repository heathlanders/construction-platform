// estimating/math.ts — pure costing math. Cents only, always FLOOR (T-02: never fractional cents).

import type { EstimateParams, EstimateTotals, LineAmounts, LineCostBasis } from './types.js';

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

/** Compute a line's money amounts from its cost basis + the estimate's burdened labor rate. */
export function computeAmounts(basis: LineCostBasis, laborRateCents: number): LineAmounts {
  const qty = basis.quantity < 0 ? 0 : basis.quantity;
  const material_cents = Math.floor(qty * basis.material_unit_cents * (1 + basis.waste_pct / 100));
  const labor_hours = round3(qty * basis.labor_hours_per_unit);
  const labor_cents = Math.floor(labor_hours * laborRateCents);
  const equipment_cents = Math.floor(qty * basis.equipment_unit_cents);
  return {
    material_cents,
    labor_hours,
    labor_cents,
    equipment_cents,
    extended_cents: material_cents + labor_cents + equipment_cents,
  };
}

/**
 * Roll up line amounts into estimate totals, applying markups:
 *   subtotal    = material + labor + equipment
 *   overhead    = subtotal × overhead%
 *   profit      = (subtotal + overhead) × profit%   (profit on cost + overhead)
 *   tax         = material × tax%                    (material only)
 *   contingency = subtotal × contingency%
 *   total       = subtotal + overhead + profit + tax + contingency
 */
export function computeTotals(
  lines: Pick<LineAmounts, 'material_cents' | 'labor_cents' | 'equipment_cents'>[],
  params: EstimateParams,
): EstimateTotals {
  const material_cents = lines.reduce((s, l) => s + l.material_cents, 0);
  const labor_cents = lines.reduce((s, l) => s + l.labor_cents, 0);
  const equipment_cents = lines.reduce((s, l) => s + l.equipment_cents, 0);
  const subtotal_cents = material_cents + labor_cents + equipment_cents;

  const overhead_cents = Math.floor((subtotal_cents * params.overhead_pct) / 100);
  const profit_cents = Math.floor(((subtotal_cents + overhead_cents) * params.profit_pct) / 100);
  const tax_cents = Math.floor((material_cents * params.tax_pct) / 100);
  const contingency_cents = Math.floor((subtotal_cents * params.contingency_pct) / 100);
  const markup_cents = overhead_cents + profit_cents + tax_cents + contingency_cents;

  return {
    material_cents,
    labor_cents,
    equipment_cents,
    subtotal_cents,
    overhead_cents,
    profit_cents,
    tax_cents,
    contingency_cents,
    markup_cents,
    total_cents: subtotal_cents + markup_cents,
  };
}
