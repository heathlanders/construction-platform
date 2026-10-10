// services/estimates.ts — build + persist estimate line items and roll up totals.
//
// The engine (lib/estimating) is pure; this layer does the catalog load (system + tenant cascade),
// blueprint-facts load, DB writes, and header rollup. Two generate modes:
//   assembly   — seed per-trade quantities from blueprint facts → priced lines.
//   parametric — building_sf × trade $/SF.
// Optionally seed from existing takeoff_items. Generation replaces prior source='rule_engine' lines
// and preserves source='manual' lines, then recomputes header totals from ALL live lines.

import type { PoolClient } from 'pg';
import {
  buildEstimateLines, computeAmounts, computeTotals, seedQuantities, seedParametricQuantities,
  seedEquipmentQuantities, seedFromPacks,
  type CatalogItem, type EstTrade, type EstimateParams, type QuantityInput,
} from '../lib/estimating/index.js';
import { EST_TRADES } from '../lib/estimating/index.js';
import { buildBlueprintFacts, EMPTY_FACTS, type BlueprintFacts } from '../lib/task-buildout/index.js';

export interface LoadedCatalog {
  byCode: Map<string, CatalogItem>;              // resolved (tenant overrides system) by code
  codesByTrade: Map<string, Set<string>>;        // trade → set of available codes
}

/** Load the merged catalog for a tenant. Tenant rows override system rows by (trade, code). */
export async function loadCatalog(client: PoolClient, trade?: string): Promise<LoadedCatalog> {
  const params: unknown[] = [];
  let where = `deleted_at IS NULL AND is_active = TRUE`;
  if (trade) { params.push(trade); where += ` AND trade = $1`; }
  // is_system ASC so tenant rows (FALSE) come AFTER system rows (TRUE) and win the map overwrite.
  const { rows } = await client.query(
    `SELECT id, trade, code, name, unit, csi_division, material_cost_cents, labor_hours_per_unit,
            equipment_cost_cents, waste_pct, is_system
       FROM estimate_assemblies WHERE ${where}
      ORDER BY is_system DESC`,
    params,
  );
  const byCode = new Map<string, CatalogItem>();
  const codesByTrade = new Map<string, Set<string>>();
  for (const r of rows) {
    const item: CatalogItem = {
      id: r.id, trade: r.trade, code: r.code, name: r.name, unit: r.unit, csi_division: r.csi_division,
      material_cost_cents: r.material_cost_cents,
      labor_hours_per_unit: Number(r.labor_hours_per_unit),
      equipment_cost_cents: r.equipment_cost_cents,
      waste_pct: Number(r.waste_pct),
    };
    byCode.set(r.code, item); // tenant (later) overwrites system (earlier)
    if (!codesByTrade.has(r.trade)) codesByTrade.set(r.trade, new Set());
    codesByTrade.get(r.trade)!.add(r.code);
  }
  return { byCode, codesByTrade };
}

interface EstimateRow {
  id: string; project_id: string | null; trade: string | null; mode: string; building_type: string | null;
  labor_rate_cents: number; overhead_pct: string; profit_pct: string; tax_pct: string; contingency_pct: string;
}

function paramsFrom(e: EstimateRow): EstimateParams {
  return {
    labor_rate_cents: e.labor_rate_cents,
    overhead_pct: Number(e.overhead_pct),
    profit_pct: Number(e.profit_pct),
    tax_pct: Number(e.tax_pct),
    contingency_pct: Number(e.contingency_pct),
  };
}

async function latestFacts(client: PoolClient, projectId: string | null): Promise<BlueprintFacts> {
  if (!projectId) return { ...EMPTY_FACTS };
  const { rows } = await client.query(
    `SELECT id FROM blueprint_analyses WHERE project_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 1`,
    [projectId],
  );
  if (rows.length === 0) return { ...EMPTY_FACTS };
  return buildBlueprintFacts(rows[0].id, client);
}

export interface GenerateOpts {
  building_sf?: number;      // parametric mode override (else summed from facts rooms)
  from_takeoff?: boolean;    // also seed manual-priced lines from existing takeoff_items
  include_equipment?: boolean; // also seed equipment DAY lines from the project's task-step recommendations
}

/**
 * Generate rule_engine line items for an estimate and roll up totals. Returns the header totals +
 * line count. Replaces prior rule_engine lines; preserves manual lines.
 */
export async function generateEstimateLines(
  client: PoolClient,
  tenantId: string,
  estimateId: string,
  opts: GenerateOpts = {},
): Promise<{ line_count: number }> {
  const { rows: er } = await client.query(
    `SELECT id, project_id, trade, mode, building_type, labor_rate_cents, overhead_pct, profit_pct, tax_pct, contingency_pct
       FROM estimates WHERE id = $1 AND deleted_at IS NULL`,
    [estimateId],
  );
  if (er.length === 0) throw new Error('ESTIMATE_NOT_FOUND');
  const est = er[0] as EstimateRow;
  const params = paramsFrom(est);
  const catalog = await loadCatalog(client);
  const facts = await latestFacts(client, est.project_id);

  // Which trades to seed. A multi-trade (null-trade) ASSEMBLY estimate now includes the
  // 'general' bucket too — seedGeneral() exists since T-64 Phase 4 (paint/clean/tile/cabinets).
  // Parametric mode keeps the four PARAM-{TRADE} $/SF trades (no PARAM-GENERAL rate seeded).
  const tradeList: EstTrade[] = est.trade
    ? [est.trade as EstTrade]
    : est.mode === 'parametric'
      ? (EST_TRADES.filter((t) => t !== 'general') as EstTrade[])
      : [...EST_TRADES];

  let quantities: QuantityInput[] = [];
  if (est.mode === 'parametric') {
    const sf = opts.building_sf ?? facts.rooms.reduce((s, r) => s + (r.area_sf ?? 0), 0);
    quantities = seedParametricQuantities(sf, tradeList, new Set(catalog.byCode.keys()));
  } else {
    for (const trade of tradeList) {
      const codes = catalog.codesByTrade.get(trade) ?? new Set<string>();
      quantities.push(...seedQuantities(trade, facts, codes));
    }
    // Trade Knowledge Pack quantity rules for the trades actually on this project's schedule
    // (Doc 23 §5). Hand seeders above win on the same code.
    if (est.project_id) {
      const { rows: tr } = await client.query(
        `SELECT DISTINCT trade_type FROM schedule_tasks
          WHERE project_id = $1 AND deleted_at IS NULL AND trade_type IS NOT NULL`,
        [est.project_id],
      );
      quantities.push(...seedFromPacks(
        tr.map((r: { trade_type: string }) => r.trade_type),
        facts,
        new Set(catalog.byCode.keys()),
        tradeList,
        new Set(quantities.map((q) => q.assembly_code).filter((c): c is string => !!c)),
        est.building_type,
      ));
    }
  }

  // Optionally seed equipment DAY lines from the project's task-step recommendations. Days ≈ the
  // number of tasks whose steps require that equipment type (rough, defensible; estimator edits).
  if (opts.include_equipment && est.project_id) {
    const { rows: eq } = await client.query(
      `SELECT elem->>'type' AS type, COUNT(DISTINCT ts.task_id)::int AS days
         FROM task_steps ts
         JOIN schedule_tasks st ON st.id = ts.task_id AND st.deleted_at IS NULL AND st.project_id = $1
         CROSS JOIN LATERAL jsonb_array_elements(ts.equipment) elem
        WHERE ts.deleted_at IS NULL AND jsonb_typeof(ts.equipment) = 'array'
        GROUP BY elem->>'type'`,
      [est.project_id],
    );
    const projectEquipment = eq
      .filter((r: { type: string | null; days: number }) => r.type)
      .map((r: { type: string; days: number }) => ({ type: r.type, days: r.days }));
    quantities.push(...seedEquipmentQuantities(projectEquipment, new Set(catalog.byCode.keys())));
  }

  const drafts = buildEstimateLines(quantities, catalog.byCode, params);

  // Optionally add manual-priced lines from existing takeoff_items (blended unit cost → material).
  if (opts.from_takeoff && est.project_id) {
    const { rows: ti } = await client.query(
      `SELECT description, quantity, unit, unit_cost_cents FROM takeoff_items WHERE project_id = $1 AND deleted_at IS NULL`,
      [est.project_id],
    );
    let so = drafts.length;
    for (const t of ti) {
      const basis = { quantity: Number(t.quantity), material_unit_cents: t.unit_cost_cents, labor_hours_per_unit: 0, equipment_unit_cents: 0, waste_pct: 0 };
      const amounts = computeAmounts(basis, params.labor_rate_cents);
      drafts.push({
        assembly_id: null, assembly_code: null, trade: est.trade, description: t.description,
        csi_division: null, unit: t.unit ?? null, ...basis, ...amounts,
        assumptions: ['Imported from project takeoff (blended unit cost)'],
        source: 'rule_engine', sort_order: (++so) * 10,
      });
    }
  }

  // Replace prior rule_engine lines.
  await client.query(
    `UPDATE estimate_line_items SET deleted_at = NOW() WHERE estimate_id = $1 AND source = 'rule_engine' AND deleted_at IS NULL`,
    [estimateId],
  );
  for (const d of drafts) {
    await client.query(
      `INSERT INTO estimate_line_items
         (tenant_id, estimate_id, assembly_id, assembly_code, trade, description, csi_division, unit, quantity,
          material_unit_cents, labor_hours_per_unit, equipment_unit_cents, waste_pct,
          material_cents, labor_hours, labor_cents, equipment_cents, extended_cents, assumptions, source, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19::jsonb,'rule_engine',$20)`,
      [
        tenantId, estimateId, d.assembly_id, d.assembly_code, d.trade, d.description, d.csi_division, d.unit, d.quantity,
        d.material_unit_cents, d.labor_hours_per_unit, d.equipment_unit_cents, d.waste_pct,
        d.material_cents, d.labor_hours, d.labor_cents, d.equipment_cents, d.extended_cents,
        JSON.stringify(d.assumptions), d.sort_order,
      ],
    );
  }

  await recomputeEstimateTotals(client, estimateId);
  const { rows: cnt } = await client.query(
    `SELECT COUNT(*)::int AS n FROM estimate_line_items WHERE estimate_id = $1 AND deleted_at IS NULL`,
    [estimateId],
  );
  return { line_count: cnt[0].n };
}

/**
 * Recompute every live line's money amounts from its stored cost basis + the estimate's current
 * labor rate (rate/params may have changed), then roll up + persist header totals. Does NOT bump the
 * line `version` — this is an internal reconcile, not a user edit, so it never triggers a client 409.
 */
export async function recomputeEstimateTotals(client: PoolClient, estimateId: string): Promise<void> {
  const { rows: er } = await client.query(
    `SELECT id, project_id, trade, mode, building_type, labor_rate_cents, overhead_pct, profit_pct, tax_pct, contingency_pct
       FROM estimates WHERE id = $1 AND deleted_at IS NULL`,
    [estimateId],
  );
  if (er.length === 0) return;
  const params = paramsFrom(er[0] as EstimateRow);

  const { rows: lines } = await client.query(
    `SELECT id, quantity, material_unit_cents, labor_hours_per_unit, equipment_unit_cents, waste_pct,
            material_cents, labor_cents, equipment_cents
       FROM estimate_line_items WHERE estimate_id = $1 AND deleted_at IS NULL`,
    [estimateId],
  );

  const recomputed = [] as { material_cents: number; labor_cents: number; equipment_cents: number }[];
  for (const l of lines) {
    const a = computeAmounts(
      {
        quantity: Number(l.quantity), material_unit_cents: l.material_unit_cents,
        labor_hours_per_unit: Number(l.labor_hours_per_unit), equipment_unit_cents: l.equipment_unit_cents,
        waste_pct: Number(l.waste_pct),
      },
      params.labor_rate_cents,
    );
    recomputed.push(a);
    // Persist only if amounts drifted (avoids needless writes when just rolling up).
    if (a.material_cents !== l.material_cents || a.labor_cents !== l.labor_cents || a.equipment_cents !== l.equipment_cents) {
      await client.query(
        `UPDATE estimate_line_items
            SET material_cents=$2, labor_hours=$3, labor_cents=$4, equipment_cents=$5, extended_cents=$6, updated_at=NOW()
          WHERE id=$1`,
        [l.id, a.material_cents, a.labor_hours, a.labor_cents, a.equipment_cents, a.extended_cents],
      );
    }
  }

  const t = computeTotals(recomputed, params);
  await client.query(
    `UPDATE estimates
        SET material_cents=$2, labor_cents=$3, equipment_cents=$4, subtotal_cents=$5, markup_cents=$6, total_cents=$7, updated_at=NOW()
      WHERE id=$1`,
    [estimateId, t.material_cents, t.labor_cents, t.equipment_cents, t.subtotal_cents, t.markup_cents, t.total_cents],
  );
}

// ── Learn-from-actuals suggestions (Phase 2b) ────────────────────────────────
// Deterministic, tenant-scoped, advisory. Derives per-(trade, code) cost hints from the tenant's OWN
// history via the Phase-2a attribution link (assembly_code on takeoff_items + budget_line_items):
//   material → AVG(awarded vendor_bid_line_items.unit_cost_cents) keyed to the assembly via takeoff.
//   labor    → SUM(costed time_entries.hours_worked) / SUM(takeoff quantity) for the assembly (per-unit).
// No AI. Never auto-overwrites the catalog. Degrades to [] when there is no history (the default state).
export interface AssemblySuggestion {
  trade: string;
  code: string;
  current_material_cents: number;
  current_labor_hours_per_unit: number;
  suggested_material_cents: number | null;
  suggested_labor_hours_per_unit: number | null;
  material_sample_size: number;
  labor_sample_size: number;
  source: 'tenant_actuals';
}

export async function getAssemblySuggestions(client: PoolClient, trade?: string): Promise<AssemblySuggestion[]> {
  const catalog = await loadCatalog(client, trade); // code → current values + trade (tenant wins)

  // Material: awarded vendor-bid unit costs, attributed to the source assembly via takeoff_items.
  const { rows: mat } = await client.query(
    `SELECT ti.assembly_code AS code,
            ROUND(AVG(vbl.unit_cost_cents))::int AS material_cents,
            COUNT(*)::int AS n
       FROM vendor_bid_line_items vbl
       JOIN vendor_bids vb ON vb.id = vbl.vendor_bid_id AND vb.status = 'awarded' AND vb.deleted_at IS NULL
       JOIN takeoff_items ti ON ti.id = vbl.takeoff_item_id
        AND ti.assembly_code IS NOT NULL AND ti.deleted_at IS NULL
      WHERE vbl.deleted_at IS NULL AND vbl.unit_cost_cents > 0
      GROUP BY ti.assembly_code`);
  const matByCode = new Map<string, { cents: number; n: number }>();
  for (const r of mat) matByCode.set(r.code, { cents: r.material_cents, n: r.n });

  // Labor: costed time entries → budget line's assembly_code (hours); quantity from takeoff (per-unit).
  const { rows: lab } = await client.query(
    `WITH hours AS (
       SELECT bli.assembly_code AS code, SUM(te.hours_worked) AS total_hours, COUNT(*)::int AS n
         FROM time_entries te
         JOIN budget_line_items bli ON bli.id = te.budget_line_item_id
          AND bli.assembly_code IS NOT NULL AND bli.deleted_at IS NULL
        WHERE te.deleted_at IS NULL AND te.hours_worked > 0
        GROUP BY bli.assembly_code
     ), qty AS (
       SELECT assembly_code AS code, SUM(quantity) AS total_qty
         FROM takeoff_items
        WHERE assembly_code IS NOT NULL AND deleted_at IS NULL AND quantity > 0
        GROUP BY assembly_code
     )
     SELECT h.code, h.total_hours::float8 AS total_hours, h.n, q.total_qty::float8 AS total_qty
       FROM hours h LEFT JOIN qty q ON q.code = h.code`);
  const labByCode = new Map<string, { hoursPerUnit: number | null; n: number }>();
  for (const r of lab) {
    const perUnit = r.total_qty && r.total_qty > 0 ? Math.round((r.total_hours / r.total_qty) * 1000) / 1000 : null;
    labByCode.set(r.code, { hoursPerUnit: perUnit, n: r.n });
  }

  // Emit one suggestion per code that has ANY actuals AND resolves to a catalog assembly (for trade + current values).
  const out: AssemblySuggestion[] = [];
  const codes = new Set<string>([...matByCode.keys(), ...labByCode.keys()]);
  for (const code of codes) {
    const item = catalog.byCode.get(code);
    if (!item) continue; // unknown/deleted code, or filtered out by trade → skip
    const m = matByCode.get(code);
    const l = labByCode.get(code);
    if (!m && !(l && l.hoursPerUnit !== null)) continue; // nothing usable
    out.push({
      trade: item.trade,
      code,
      current_material_cents: item.material_cost_cents,
      current_labor_hours_per_unit: item.labor_hours_per_unit,
      suggested_material_cents: m ? m.cents : null,
      suggested_labor_hours_per_unit: l ? l.hoursPerUnit : null,
      material_sample_size: m ? m.n : 0,
      labor_sample_size: l ? l.n : 0,
      source: 'tenant_actuals',
    });
  }
  out.sort((a, b) => (a.trade === b.trade ? a.code.localeCompare(b.code) : a.trade.localeCompare(b.trade)));
  return out;
}
