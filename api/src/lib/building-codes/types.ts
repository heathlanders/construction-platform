// Building code types — the general building permit that governs structural / envelope work
// (concrete, framing, roofing, sheathing, insulation). Unlike electrical/plumbing/mechanical,
// roofing/concrete/framing do NOT get their own AHJ permits — their work is inspected under a
// single building permit (permit_type='building').
//
// US building codes are near-universally ICC-based (no UPC/UMC-style competing family):
//   IRC — International Residential Code (1-2 family dwellings & townhouses)
//   IBC — International Building Code (everything else: multifamily 3+, commercial, industrial)
// Which one applies is derived from the building's occupancy (building_type), NOT the state.
// The state library therefore carries a single adopted ICC edition per jurisdiction.

export type BuildingCodeFamily = 'IRC' | 'IBC';

export type BuildingCodeEdition =
  | '2012'
  | '2015'
  | '2018'
  | '2020'
  | '2021'
  | '2024';

export type BuildingInspectionType =
  | 'footing'        // footing / setback — before concrete
  | 'foundation'     // foundation wall / slab — rebar & pre-pour
  | 'framing'        // structural framing — before cover
  | 'sheathing'      // shear wall / roof & wall sheathing nailing
  | 'roof_dry_in'    // roof underlayment / dry-in (roofing trade)
  | 'insulation'     // insulation & vapor barrier — before drywall
  | 'final';         // building final / certificate of occupancy

export type BuildingType =
  | 'residential_sf'
  | 'residential_mf'
  | 'commercial'
  | 'industrial';

export interface BuildingJurisdictionInfo {
  state_code: string;            // CHAR(2) — matches projects.state
  state_name: string;
  edition: BuildingCodeEdition;  // adopted ICC edition (applies to both IRC and IBC)
  notes?: string;                // ALWAYS display when present — amended / home-rule jurisdictions
}

export interface BuildingInspectionStep {
  sequence_order: number;
  inspection_type: BuildingInspectionType;
  title: string;
  description: string;
  csi_division: string;                        // per-step trade division (03/06/07/01)
  estimated_duration_days: number;
  required_for_building_types: BuildingType[]; // empty = all types
}

// Occupancy → applicable ICC code family. IRC covers detached 1-2 family + townhouses;
// everything else falls under the IBC.
export function buildingCodeFamily(buildingType: BuildingType): BuildingCodeFamily {
  return buildingType === 'residential_sf' ? 'IRC' : 'IBC';
}

export const BUILDING_INSPECTION_TYPE_LABELS: Record<BuildingInspectionType, string> = {
  footing:     'Footing',
  foundation:  'Foundation / Slab',
  framing:     'Framing',
  sheathing:   'Sheathing / Shear',
  roof_dry_in: 'Roof Dry-In',
  insulation:  'Insulation',
  final:       'Building Final',
};

export const BUILDING_CODE_FAMILY_LABELS: Record<BuildingCodeFamily, string> = {
  IRC: 'International Residential Code (ICC)',
  IBC: 'International Building Code (ICC)',
};

export const BUILDING_TYPE_LABELS: Record<BuildingType, string> = {
  residential_sf: 'Residential — Single Family',
  residential_mf: 'Residential — Multi-Family',
  commercial:     'Commercial',
  industrial:     'Industrial',
};
