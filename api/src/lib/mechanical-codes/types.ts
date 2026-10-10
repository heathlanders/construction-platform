// Mechanical (HVAC) code types — used by permits, inspection milestone generation, and
// Blueprint Intelligence. Mirrors the plumbing-codes library shape: US mechanical work is
// governed by TWO competing model codes adopted state-by-state —
//   IMC — International Mechanical Code (ICC)
//   UMC — Uniform Mechanical Code (IAPMO)
// The IMC/UMC geography closely tracks the IPC/UPC plumbing split.
//
// Note: an HVAC permit is industry-called a "mechanical permit" — permits.permit_type
// for HVAC work is 'mechanical', while the trade/discipline label remains 'hvac'.

export type MechanicalCodeFamily = 'IMC' | 'UMC';

// Recent editions of each model code (3-year cycle); state adoption lags widely.
export type MechanicalCodeEdition =
  | '2014'
  | '2015'
  | '2017'
  | '2018'
  | '2020'
  | '2021'
  | '2024';

export type MechanicalInspectionType =
  | 'rough_in'              // ductwork, refrigerant line sets, flue/vent rough — before cover
  | 'duct_leakage'          // energy-code duct leakage / tightness test (IECC / Title 24)
  | 'equipment_set'         // equipment placement: furnace, AC, RTU, condensate, disconnect
  | 'gas_refrigerant_test'  // fuel-gas piping test + refrigerant pressure/leak test
  | 'final';                // startup, airflow, controls, final AHJ sign-off

// Shared building-type concept, redefined locally to keep the library self-contained.
export type BuildingType =
  | 'residential_sf'
  | 'residential_mf'
  | 'commercial'
  | 'industrial';

export interface MechanicalJurisdictionInfo {
  state_code: string;                  // CHAR(2) — matches projects.state
  state_name: string;
  code_family: MechanicalCodeFamily;   // IMC or UMC
  edition: MechanicalCodeEdition;
  notes?: string;                      // ALWAYS display when present — home-rule / amended jurisdictions
}

export interface MechanicalInspectionStep {
  sequence_order: number;
  inspection_type: MechanicalInspectionType;
  title: string;
  description: string;
  csi_division: string;                        // '23 08 00' — Commissioning of HVAC
  estimated_duration_days: number;
  required_for_building_types: BuildingType[]; // empty = all types
}

export const MECHANICAL_INSPECTION_TYPE_LABELS: Record<MechanicalInspectionType, string> = {
  rough_in:             'Mechanical Rough-In',
  duct_leakage:         'Duct Leakage Test',
  equipment_set:        'Equipment Set',
  gas_refrigerant_test: 'Gas / Refrigerant Test',
  final:                'Final Mechanical',
};

export const MECHANICAL_CODE_FAMILY_LABELS: Record<MechanicalCodeFamily, string> = {
  IMC: 'International Mechanical Code (ICC)',
  UMC: 'Uniform Mechanical Code (IAPMO)',
};

export const BUILDING_TYPE_LABELS: Record<BuildingType, string> = {
  residential_sf: 'Residential — Single Family',
  residential_mf: 'Residential — Multi-Family',
  commercial:     'Commercial',
  industrial:     'Industrial',
};
