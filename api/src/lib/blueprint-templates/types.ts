// lib/blueprint-templates/types.ts — shared types for building templates

export type TradeType =
  | 'general'
  | 'civil'
  | 'structural'
  | 'concrete'
  | 'framing'
  | 'roofing'
  | 'architectural'
  | 'electrical'
  | 'plumbing'
  | 'hvac'
  | 'insulation'
  | 'drywall'
  | 'finishes'
  // T-64 taxonomy keys (Doc 21) — emitted by component-driven extraction tasks and, since the
  // blueprint trade reclassification, by the building-type templates themselves. Every key here
  // MUST exist in the canonical trade taxonomy (api/src/lib/trades/taxonomy.ts) — enforced by
  // api/src/test/blueprint-template-trades.test.ts.
  | 'masonry'
  | 'stucco_eifs'
  | 'cabinetry'
  | 'tile'
  | 'asphalt_paving'
  | 'gutters'
  // Sitework / foundations
  | 'surveying'
  | 'geotech'
  | 'excavation'
  | 'demolition'
  | 'erosion_control'
  | 'site_utilities'
  | 'shoring_underpinning'
  | 'dewatering'
  | 'deep_foundations'
  | 'concrete_flatwork'
  | 'landscaping'
  | 'irrigation'
  | 'pavement_marking'
  | 'signage'
  | 'abatement'
  // Concrete / structural
  | 'rebar'
  | 'waterproofing'
  | 'truss_setting'
  | 'structural_steel'
  | 'metal_decking'
  | 'metal_stud_framing'
  | 'post_frame'
  // Envelope / openings
  | 'siding'
  | 'sheet_metal_flashing'
  | 'air_barrier'
  | 'curtain_wall'
  | 'glazing'
  | 'windows'
  | 'exterior_doors'
  | 'overhead_doors'
  | 'skylights'
  | 'loading_dock_equipment'
  // MEP specialty
  | 'low_voltage'
  | 'fire_alarm'
  | 'security_access'
  | 'fire_sprinkler'
  | 'process_piping'
  | 'controls_bms'
  | 'test_balance'
  | 'commissioning_agent'
  // Interior finishes
  | 'painting'
  | 'flooring_carpet'
  | 'flooring_resilient'
  | 'flooring_epoxy'
  | 'finish_carpentry'
  | 'doors_hardware'
  | 'acoustical_ceilings'
  | 'toilet_partitions'
  | 'millwork'
  | 'countertops'
  | 'final_clean';

export type PhaseType =
  | 'site_prep'
  | 'foundation'
  | 'framing'
  | 'roofing'
  | 'rough_in'
  | 'inspections'
  | 'insulation'
  | 'drywall'
  | 'finishes_interior'
  | 'finishes_exterior'
  | 'sitework'
  | 'commissioning'
  | 'punch';

export const PHASE_ORDER: PhaseType[] = [
  'site_prep', 'foundation', 'framing', 'roofing', 'rough_in',
  'inspections', 'insulation', 'drywall', 'finishes_interior',
  'finishes_exterior', 'sitework', 'commissioning', 'punch',
];

export const PHASE_LABELS: Record<PhaseType, string> = {
  site_prep:         'Site Preparation',
  foundation:        'Foundation & Concrete',
  framing:           'Framing',
  roofing:           'Roofing',
  rough_in:          'Rough MEP',
  inspections:       'Inspections',
  insulation:        'Insulation',
  drywall:           'Drywall & Plaster',
  finishes_interior: 'Interior Finishes',
  finishes_exterior: 'Exterior Finishes',
  sitework:          'Site Work',
  commissioning:     'Commissioning & Closeout',
  punch:             'Punch List',
};

export interface TemplateTask {
  title: string;
  description?: string;
  trade_type: TradeType;
  phase: PhaseType;
  csi_division: string;
  estimated_duration_days: number;
  sort_order: number;
}

// Single source of truth for the accepted building types. Derive the union from the tuple so the
// route Zod enum, the templates registry, and task-steps all agree (no hand-maintained duplicate).
export const BUILDING_TYPES = ['residential_sf', 'residential_mf', 'commercial', 'industrial', 'pole_barn'] as const;
export type BuildingType = (typeof BUILDING_TYPES)[number];
