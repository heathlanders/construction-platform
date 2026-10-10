// task-buildout/equipment-vocab.ts — canonical equipment vocabulary. SINGLE SOURCE OF TRUTH for the
// `type` string used across three surfaces:
//   1. task_steps.equipment[].type            (recommendation, this engine)
//   2. company_assets.asset_type              (EAM fleet join, Phase 2)
//   3. EQUIP-{TYPE} estimate_assemblies code  (estimating catalog, Phase 3)
// Keep these three in lockstep — a `type` here must be a valid company_assets.asset_type and, once
// Phase 3 lands, have a matching EQUIP-{TYPE} catalog row.

export type EquipmentCategory =
  | 'heavy_equipment'
  | 'power_tool'
  | 'vehicle'
  | 'trailer'
  | 'attachment';

export interface EquipmentSpec {
  type: string;
  category: EquipmentCategory;
  label: string; // English display (data — ES is v1.1)
}

// Canonical catalog. Add a machine here (and, Phase 3, a matching EQUIP-{TYPE} catalog row) to make it
// recommendable. `type` values are snake_case and MUST match company_assets.asset_type.
export const EQUIPMENT: Record<string, EquipmentSpec> = {
  excavator:       { type: 'excavator',       category: 'heavy_equipment', label: 'Excavator' },
  backhoe:         { type: 'backhoe',         category: 'heavy_equipment', label: 'Backhoe' },
  skid_steer:      { type: 'skid_steer',      category: 'heavy_equipment', label: 'Skid steer' },
  trencher:        { type: 'trencher',        category: 'heavy_equipment', label: 'Trencher' },
  compactor:       { type: 'compactor',       category: 'heavy_equipment', label: 'Plate compactor / roller' },
  dump_truck:      { type: 'dump_truck',      category: 'vehicle',         label: 'Dump truck' },
  concrete_pump:   { type: 'concrete_pump',   category: 'heavy_equipment', label: 'Concrete pump' },
  power_trowel:    { type: 'power_trowel',    category: 'power_tool',      label: 'Power trowel' },
  scissor_lift:    { type: 'scissor_lift',    category: 'heavy_equipment', label: 'Scissor lift' },
  boom_lift:       { type: 'boom_lift',       category: 'heavy_equipment', label: 'Boom lift' },
  telehandler:     { type: 'telehandler',     category: 'heavy_equipment', label: 'Telehandler' },
  forklift:        { type: 'forklift',        category: 'heavy_equipment', label: 'Rough-terrain forklift' },
  crane:           { type: 'crane',           category: 'heavy_equipment', label: 'Crane' },
  material_hoist:  { type: 'material_hoist',  category: 'heavy_equipment', label: 'Material hoist' },
  generator:       { type: 'generator',       category: 'power_tool',      label: 'Generator' },
  air_compressor:  { type: 'air_compressor',  category: 'power_tool',      label: 'Air compressor' },
  welder:          { type: 'welder',          category: 'power_tool',      label: 'Welder' },
};

export type EquipmentType = keyof typeof EQUIPMENT;

/** Build an EquipmentNeed from a canonical type + a reason. Unknown type falls back to a bare record. */
export function need(type: EquipmentType, reason: string, optional = false): {
  type: string; category: string; reason: string; optional?: boolean;
} {
  const spec = EQUIPMENT[type];
  const base = { type: spec?.type ?? type, category: spec?.category ?? 'heavy_equipment', reason };
  return optional ? { ...base, optional: true } : base;
}
