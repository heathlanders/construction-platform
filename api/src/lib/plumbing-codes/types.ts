// Plumbing code types — used by permits, inspection milestone generation, and Blueprint Intelligence.
// Mirrors the electrical-codes library shape (NEC) but models the IPC/UPC split:
// unlike the NEC (one model code with state amendments), US plumbing is governed by TWO
// competing model codes — the International Plumbing Code (IPC, ICC) and the
// Uniform Plumbing Code (UPC, IAPMO) — adopted state-by-state.

export type PlumbingCodeFamily = 'IPC' | 'UPC';

// Recent editions of each model code. IPC and UPC are both on a 3-year cycle, but
// state adoption lags widely — some states (and state-derived codes) sit on older years.
export type PlumbingCodeEdition =
  | '2014'
  | '2015'
  | '2017'
  | '2018'
  | '2020'
  | '2021'
  | '2024';

export type PlumbingInspectionType =
  | 'underground'    // DWV + water lines below slab/grade, before cover
  | 'rough_in'       // DWV + water rough (top-out), before walls close
  | 'water_supply'   // water service / supply pressure test
  | 'gas_test'       // fuel-gas piping pressure test (where gas present)
  | 'final';         // fixtures set, trim complete, final AHJ sign-off

// Building type is shared conceptually with electrical but redefined here to keep the
// plumbing-codes library self-contained (no cross-import on electrical-codes).
export type BuildingType =
  | 'residential_sf'
  | 'residential_mf'
  | 'commercial'
  | 'industrial';

export interface PlumbingJurisdictionInfo {
  state_code: string;             // CHAR(2) — matches projects.state
  state_name: string;
  code_family: PlumbingCodeFamily; // IPC or UPC
  edition: PlumbingCodeEdition;
  notes?: string;                  // ALWAYS display when present — home-rule / amended jurisdictions
}

export interface PlumbingInspectionStep {
  sequence_order: number;
  inspection_type: PlumbingInspectionType;
  title: string;
  description: string;
  csi_division: string;                        // '22 08 00' — Commissioning of Plumbing
  estimated_duration_days: number;
  required_for_building_types: BuildingType[]; // empty = all types
}

export const PLUMBING_INSPECTION_TYPE_LABELS: Record<PlumbingInspectionType, string> = {
  underground:  'Underground / Groundwork',
  rough_in:     'Plumbing Rough-In',
  water_supply: 'Water Supply Test',
  gas_test:     'Fuel-Gas Pressure Test',
  final:        'Final Plumbing',
};

export const PLUMBING_CODE_FAMILY_LABELS: Record<PlumbingCodeFamily, string> = {
  IPC: 'International Plumbing Code (ICC)',
  UPC: 'Uniform Plumbing Code (IAPMO)',
};

export const BUILDING_TYPE_LABELS: Record<BuildingType, string> = {
  residential_sf: 'Residential — Single Family',
  residential_mf: 'Residential — Multi-Family',
  commercial:     'Commercial',
  industrial:     'Industrial',
};
