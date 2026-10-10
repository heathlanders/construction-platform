// estimating/types.ts — types for the deterministic sub-level estimating engine.
//
// Pure, no I/O, no AI (mirrors task-buildout + task-dependencies + jurisdictions). The engine takes
// quantities (seeded from blueprint facts OR supplied by the estimator) + a cost catalog + markup
// params and produces priced line drafts + rolled-up totals. Output persists to estimate_line_items
// / estimates (migration 0028). Money in cents (T-02).

export type EstTrade = 'electrical' | 'plumbing' | 'mechanical' | 'building' | 'general';
export const EST_TRADES: readonly EstTrade[] = ['electrical', 'plumbing', 'mechanical', 'building', 'general'] as const;

// One catalog row (estimate_assemblies). Tenant rows override system rows by (trade, code).
export interface CatalogItem {
  id: string;
  trade: string;
  code: string;
  name: string;
  unit: string;
  csi_division: string | null;
  material_cost_cents: number;
  labor_hours_per_unit: number;
  equipment_cost_cents: number;
  waste_pct: number;
}

// A quantity to price. `assembly_code` resolves against the catalog for its cost basis; a manual line
// without a code carries its own description (cost basis defaults to zero until edited).
export interface QuantityInput {
  assembly_code?: string | null;
  description?: string;
  trade?: string;
  csi_division?: string | null;
  unit?: string | null;
  quantity: number;
  assumptions?: string[];
}

export interface EstimateParams {
  labor_rate_cents: number; // burdened $/hr — labor_cents = FLOOR(labor_hours × rate)
  overhead_pct: number;
  profit_pct: number;       // applied to (subtotal + overhead)
  tax_pct: number;          // applied to material only
  contingency_pct: number;  // applied to subtotal
}

// The cost basis needed to compute a line's amounts — shared by generate + recompute.
export interface LineCostBasis {
  quantity: number;
  material_unit_cents: number;
  labor_hours_per_unit: number;
  equipment_unit_cents: number;
  waste_pct: number;
}

export interface LineAmounts {
  material_cents: number;   // qty × material_unit × (1 + waste%)
  labor_hours: number;      // qty × labor_hours_per_unit
  labor_cents: number;      // FLOOR(labor_hours × rate)
  equipment_cents: number;  // qty × equipment_unit
  extended_cents: number;   // material + labor + equipment
}

export interface EstimateLineDraft extends LineCostBasis, LineAmounts {
  assembly_id: string | null;
  assembly_code: string | null;
  trade: string | null;
  description: string;
  csi_division: string | null;
  unit: string | null;
  assumptions: string[];
  source: 'rule_engine' | 'manual';
  sort_order: number;
}

export interface EstimateTotals {
  material_cents: number;
  labor_cents: number;
  equipment_cents: number;
  subtotal_cents: number;
  overhead_cents: number;
  profit_cents: number;
  tax_cents: number;
  contingency_cents: number;
  markup_cents: number;
  total_cents: number;
}
