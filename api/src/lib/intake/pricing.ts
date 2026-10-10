// intake/pricing.ts — spec → priced quantities → budget RANGE (never a single number to the client).
//
//   values → derive → scopeToQuantities → buildEstimateLines(catalog) → computeTotals → range
//
// The range widens when any quantity-driving answer is unverified (a photo estimate) or the contractor
// hasn't verified measurements yet. Money in cents with FLOOR (T-02); the client-facing bounds are
// rounded outward to $100. The CLIENT DTO is only {low_cents, high_cents} (invariant 2) — lines and
// totals are for the contractor side and the frozen quantities snapshot.

import { buildEstimateLines, computeTotals } from '../estimating/index.js';
import type { CatalogItem, EstimateLineDraft, EstimateParams, EstimateTotals, QuantityInput } from '../estimating/types.js';
import { handlerFor } from './fields.js';
import { allFields } from './spec.js';
import type { Derived, ScopeSpec, TradeIntakeModule } from './types.js';

export const DEFAULT_RANGE_POLICY = { base_band_pct: 10, unverified_band_pct: 15 } as const;
const ROUND_CENTS = 10_000; // $100

export interface ScopePricing {
  derived: Derived;
  quantities: QuantityInput[];
  lines: EstimateLineDraft[];
  totals: EstimateTotals;
  range: { low_cents: number; high_cents: number; base_cents: number; band_pct: number; unverified: boolean };
}

/** True when a quantity-driving value came from a photo estimate (or nothing was verified on site). */
export function hasUnverifiedQuantities(module: TradeIntakeModule, spec: ScopeSpec, measurementsVerified: boolean): boolean {
  if (!measurementsVerified) return true;
  return allFields(module.steps).some(({ field }) =>
    handlerFor(field).quantityDriving && spec.values[field.id] !== undefined
    && spec.provenance[field.id] === 'photo_estimate');
}

export function priceScope(
  module: TradeIntakeModule,
  spec: ScopeSpec,
  catalog: Map<string, CatalogItem>,
  params: EstimateParams,
  opts: { measurementsVerified: boolean },
): ScopePricing {
  const derived = module.derive?.(spec.values) ?? {};
  const quantities = module.scopeToQuantities(spec.values, derived)
    .filter((q) => Number.isFinite(q.quantity) && q.quantity > 0);
  const lines = buildEstimateLines(quantities, catalog, params);
  const totals = computeTotals(lines, params);

  const policy = module.range_policy ?? DEFAULT_RANGE_POLICY;
  const unverified = hasUnverifiedQuantities(module, spec, opts.measurementsVerified);
  const band = policy.base_band_pct + (unverified ? policy.unverified_band_pct : 0);
  const base = totals.total_cents;
  const low = Math.max(0, Math.floor((base * (100 - band)) / 100 / ROUND_CENTS) * ROUND_CENTS);
  const high = Math.ceil((base * (100 + band)) / 100 / ROUND_CENTS) * ROUND_CENTS;
  return { derived, quantities, lines, totals, range: { low_cents: low, high_cents: high, base_cents: base, band_pct: band, unverified } };
}
