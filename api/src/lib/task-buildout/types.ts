// task-buildout/types.ts — types for the per-trade work-step engine.
//
// Deterministic, no I/O, no AI (mirrors task-dependencies/rules.ts + jurisdictions/). The engine
// expands one schedule_task into ordered WorkSteps for the field, referencing the resolved codes
// (ResolvedTradeCode) and the blueprint analysis facts (extracted panels/fixtures/rooms/flags/
// components). Output is persisted to task_steps (migration 0022).

import type { BuildingType, ResolvedTradeCode } from '../jurisdictions/types.js';

export interface CodeRef {
  code_type: string;   // 'NEC' | 'IPC' | 'IMC' | 'IRC' | ...
  section: string;     // e.g. '210.12', '300', 'R905'
  note?: string;       // what it governs
}

// A piece of equipment recommended to do a step efficiently. `type` is a CANONICAL value aligned to
// company_assets.asset_type (EAM join, Phase 2) and the EQUIP-{TYPE} estimating catalog code (Phase 3);
// `category` aligns to company_assets.asset_category. Advisory — never blocks/auto-reserves/auto-costs.
export interface EquipmentNeed {
  type: string;        // canonical: 'excavator','scissor_lift','concrete_pump',...
  category: string;    // 'heavy_equipment' | 'power_tool' | 'vehicle' | 'trailer' | 'attachment'
  reason: string;      // why this step needs it
  optional?: boolean;  // true = efficiency nice-to-have, not strictly required
}

export interface WorkStep {
  step_order: number;
  title: string;
  instruction: string;            // the how-to for the laborer
  detail?: string;                // optional elaboration
  code_refs: CodeRef[];           // governing code sections for this step
  tools: string[];
  materials: string[];
  safety: string[];
  // Recipe modules may omit this; the engine (index.ts) always populates it on output via equipmentFor().
  equipment?: EquipmentNeed[];    // heavy equipment / power tools to do it efficiently (canonical types)
  gating_inspection_type?: string; // aligns to an inspection_type in the resolved sequence
  qa_check?: string;              // what to verify before calling for inspection
}

// Aggregated blueprint extraction the engine can use to make steps concrete. Empty for manual tasks.
export interface BlueprintFacts {
  panels: { amperage: number | null; location: string | null }[];
  fixtures: { type: string; count: number | null }[];
  rooms: { name: string; area_sf?: number | null }[];
  window_count: number;
  door_count: number;
  components: string[];           // 'engineered_trusses','i_joists','lvl_beam','metal_roofing',...
  flags: {
    has_natural_gas?: boolean;
    has_propane_gas?: boolean;
    has_title24?: boolean;
    has_hers_verification?: boolean;
    has_solar_ready?: boolean;
    has_seismic_design?: boolean;
    has_wildfire_zone?: boolean;
    has_exit_signage?: boolean;
    has_accessibility?: boolean;
    [k: string]: boolean | undefined;
  };
}

export const EMPTY_FACTS: BlueprintFacts = {
  panels: [], fixtures: [], rooms: [], window_count: 0, door_count: 0, components: [], flags: {},
};

export interface BuildTask {
  trade_type: string | null;
  phase: string | null;
  csi_division: string | null;
  title: string;
  description: string | null;
}

export interface BuildContext {
  task: BuildTask;
  resolved: ResolvedTradeCode;   // the task's permit-trade resolved code + inspection steps
  buildingType: BuildingType;
  /** Blueprint plan building type when it differs from the codes-engine type (e.g. 'pole_barn'). */
  planBuildingType?: string;
  facts: BlueprintFacts;
}
