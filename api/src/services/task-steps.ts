// services/task-steps.ts — build + persist task_steps for a set of tasks (used by blueprint import
// and the build-steps endpoints). The engine itself (lib/task-buildout) is pure; this layer does the
// jurisdiction resolve + facts load + DB write. Resolves the project's jurisdiction ONCE and reuses
// it across all the project's tasks.

import type { PoolClient } from 'pg';
import { resolveJurisdiction } from '../lib/jurisdictions/resolver.js';
import { tradeToPermitTrade } from '../lib/jurisdictions/trade-map.js';
import type { BuildingType, ResolvedTradeCode, Trade } from '../lib/jurisdictions/types.js';
import { buildTaskSteps, buildBlueprintFacts, EMPTY_FACTS, type BlueprintFacts } from '../lib/task-buildout/index.js';
import { BUILDING_TYPES } from '../lib/blueprint-templates/index.js';

// Plan building types accepted on a blueprint analysis (blueprint-templates set) — the SAME set the
// route/worker use (single source: BUILDING_TYPES). pole_barn is a post-frame residential
// outbuilding with no distinct jurisdiction occupancy class, so it resolves codes as residential_sf
// (mirrors the worker's toJurisBuildingType). Anything unrecognized also degrades to residential_sf.
const PLAN_BUILDING_TYPES = BUILDING_TYPES;
type PlanBuildingType = (typeof PLAN_BUILDING_TYPES)[number];

function toJurisBuildingType(bt: PlanBuildingType): BuildingType {
  return bt === 'pole_barn' ? 'residential_sf' : bt;
}

export interface BuildoutTaskRow {
  id: string;
  trade_type: string | null;
  phase: string | null;
  csi_division: string | null;
  title: string;
  description: string | null;
}

const EMPTY_RESOLVED: ResolvedTradeCode = {
  code_type: '', code_edition: null, nec_edition: null, jurisdiction_notes: null, steps: [],
};

/**
 * Build steps for the given project tasks and persist them, replacing prior rule_engine steps.
 * Returns the number of steps inserted. analysisId (optional) supplies blueprint facts; when null
 * the engine produces generic (non-parameterized) steps.
 */
export async function buildStepsForProjectTasks(
  client: PoolClient,
  tenantId: string,
  projectId: string,
  tasks: BuildoutTaskRow[],
  analysisId: string | null,
): Promise<number> {
  if (tasks.length === 0) return 0;

  // Project geo + building type.
  const { rows: pr } = await client.query(
    `SELECT state, city, county_fips, county_name FROM projects WHERE id = $1`,
    [projectId],
  );
  const project = pr[0] ?? {};
  // Building type comes from THE IMPORTING analysis (when known) — not "the latest analysis for
  // the project", which is wrong whenever a project has more than one analysis of differing type.
  // Fall back to the most recent analysis only when no analysisId was supplied (manual backfill).
  let planType: PlanBuildingType = 'residential_sf';
  const { rows: ba } = analysisId
    ? await client.query(`SELECT building_type FROM blueprint_analyses WHERE id = $1`, [analysisId])
    : await client.query(
        `SELECT building_type FROM blueprint_analyses WHERE project_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 1`,
        [projectId],
      );
  if (ba[0]?.building_type && (PLAN_BUILDING_TYPES as readonly string[]).includes(ba[0].building_type)) {
    planType = ba[0].building_type as PlanBuildingType;
  }
  const buildingType: BuildingType = toJurisBuildingType(planType);

  // Resolve jurisdiction once (all 4 trades). Degrade to empty resolved if no state.
  let trades: Record<Trade, ResolvedTradeCode>;
  if (project.state) {
    const rj = resolveJurisdiction({
      state: project.state, county_fips: project.county_fips, county_name: project.county_name,
      city: project.city, building_type: buildingType,
    });
    trades = rj.trades;
  } else {
    trades = { electrical: EMPTY_RESOLVED, plumbing: EMPTY_RESOLVED, mechanical: EMPTY_RESOLVED, building: EMPTY_RESOLVED };
  }

  const facts: BlueprintFacts = analysisId ? await buildBlueprintFacts(analysisId, client) : { ...EMPTY_FACTS };

  // Replace prior rule_engine steps for these tasks.
  const ids = tasks.map((t) => t.id);
  await client.query(
    `UPDATE task_steps SET deleted_at = NOW() WHERE task_id = ANY($1::uuid[]) AND source = 'rule_engine' AND deleted_at IS NULL`,
    [ids],
  );

  let inserted = 0;
  for (const task of tasks) {
    const permitTrade = tradeToPermitTrade(task.trade_type);
    const resolved = permitTrade ? trades[permitTrade] : EMPTY_RESOLVED;
    const steps = buildTaskSteps({ task, resolved, buildingType, planBuildingType: planType, facts });
    for (const s of steps) {
      await client.query(
        `INSERT INTO task_steps
           (tenant_id, task_id, step_order, title, instruction, detail, code_refs, tools, materials, safety, equipment, gating_inspection_type, qa_check, source)
         VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9::jsonb,$10::jsonb,$11::jsonb,$12,$13,'rule_engine')`,
        [
          tenantId, task.id, s.step_order, s.title, s.instruction, s.detail ?? null,
          JSON.stringify(s.code_refs), JSON.stringify(s.tools), JSON.stringify(s.materials), JSON.stringify(s.safety),
          JSON.stringify(s.equipment ?? []),
          s.gating_inspection_type ?? null, s.qa_check ?? null,
        ],
      );
      inserted++;
    }
  }
  return inserted;
}
