// Electrical code types — used by permits, inspection milestone generation, and Blueprint Intelligence

export type NecEdition = '2014' | '2017' | '2020' | '2023';

export type ElectricalInspectionType =
  | 'temporary_power'
  | 'rough_in'
  | 'service'
  | 'cover'
  | 'final';

export type BuildingType =
  | 'residential_sf'
  | 'residential_mf'
  | 'commercial'
  | 'industrial';

export interface JurisdictionInfo {
  state_code: string;    // CHAR(2) — matches projects.state
  state_name: string;
  nec_edition: NecEdition;
  notes?: string;        // ALWAYS display when present — CA/OR/NYC/Chicago exceptions
}

export interface InspectionStep {
  sequence_order: number;
  inspection_type: ElectricalInspectionType;
  title: string;
  description: string;
  csi_division: string;                        // '26 08 00' for all electrical inspection milestones
  estimated_duration_days: number;
  required_for_building_types: BuildingType[]; // empty = all types
}

export const ELECTRICAL_INSPECTION_TYPE_LABELS: Record<ElectricalInspectionType, string> = {
  temporary_power: 'Temporary Power',
  rough_in:        'Electrical Rough-In',
  service:         'Service Entrance',
  cover:           'Cover Inspection',
  final:           'Final Electrical',
};

export const NEC_EDITION_LABELS: Record<NecEdition, string> = {
  '2014': 'NEC 2014',
  '2017': 'NEC 2017',
  '2020': 'NEC 2020',
  '2023': 'NEC 2023',
};

export const BUILDING_TYPE_LABELS: Record<BuildingType, string> = {
  residential_sf: 'Residential — Single Family',
  residential_mf: 'Residential — Multi-Family',
  commercial:     'Commercial',
  industrial:     'Industrial',
};
