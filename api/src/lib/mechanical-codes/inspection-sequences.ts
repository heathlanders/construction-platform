/**
 * Standard mechanical (HVAC) inspection milestone sequences by building type.
 *
 * Typical AHJ checkpoints under IMC- and UMC-based codes. The milestone set is broadly the
 * same under both model codes; jurisdictions add or combine steps (e.g. duct-leakage testing
 * is driven by the energy code — IECC / Title 24 — and may be waived on some scopes). These
 * are a best-practice starting point — PMs should confirm the exact sequence with the AHJ.
 *
 * CSI Division: 23 08 00 — Commissioning of HVAC (all mechanical inspection milestones)
 */

import type { BuildingType, MechanicalInspectionStep } from './types.js';

// Residential sequence (single-family and multi-family)
const RESIDENTIAL_SEQUENCE: MechanicalInspectionStep[] = [
  {
    sequence_order: 1,
    inspection_type: 'rough_in',
    title: 'Mechanical Rough-In Inspection',
    description:
      'Inspection of ductwork, refrigerant line sets, and flue/vent rough before walls and ceilings are closed. Verifies duct support, sealing, clearances to combustibles, and combustion-air provisions.',
    csi_division: '23 08 00',
    estimated_duration_days: 1,
    required_for_building_types: [],  // required all types
  },
  {
    sequence_order: 2,
    inspection_type: 'duct_leakage',
    title: 'Duct Leakage Test',
    description:
      'Energy-code duct tightness / leakage test (IECC or state energy code, e.g. California Title 24). Verifies measured duct leakage is within the allowed threshold. May be combined with rough-in or waived on some scopes.',
    csi_division: '23 08 00',
    estimated_duration_days: 1,
    required_for_building_types: [],  // energy-code dependent — confirm with AHJ
  },
  {
    sequence_order: 3,
    inspection_type: 'equipment_set',
    title: 'Equipment Set Inspection',
    description:
      'Inspection of installed equipment placement: furnace / air handler, condensing unit or heat pump, condensate drainage, gas/electric disconnects, and required clearances and pads/curbs.',
    csi_division: '23 08 00',
    estimated_duration_days: 1,
    required_for_building_types: [],  // required all types
  },
  {
    sequence_order: 4,
    inspection_type: 'gas_refrigerant_test',
    title: 'Gas / Refrigerant Pressure Test',
    description:
      'Pressure test of fuel-gas piping (natural gas / propane) and/or refrigerant lines where applicable. Verifies sizing, joints, and a sustained pressure/leak test. Applicable only when gas or field-charged refrigerant piping is present.',
    csi_division: '23 08 00',
    estimated_duration_days: 1,
    required_for_building_types: [],  // applicable when gas/refrigerant piping present
  },
  {
    sequence_order: 5,
    inspection_type: 'final',
    title: 'Final Mechanical Inspection',
    description:
      'Final inspection after startup. Verifies airflow / balancing, thermostat and controls, condensate and safety switches, combustion safety, and label/listing compliance.',
    csi_division: '23 08 00',
    estimated_duration_days: 1,
    required_for_building_types: [],  // required all types
  },
];

// Commercial / industrial sequence — duct leakage and gas/refrigerant tests are effectively
// always required; equipment set covers rooftop units, makeup air, and exhaust systems.
const COMMERCIAL_SEQUENCE: MechanicalInspectionStep[] = RESIDENTIAL_SEQUENCE.map((step) => {
  if (step.inspection_type === 'duct_leakage') {
    return { ...step, required_for_building_types: ['commercial', 'industrial'] };
  }
  if (step.inspection_type === 'gas_refrigerant_test') {
    return {
      ...step,
      description:
        'Pressure test of fuel-gas piping and refrigerant lines on commercial/industrial systems (rooftop units, VRF, makeup air). Verifies sizing, joints, and sustained pressure/leak tests.',
      required_for_building_types: ['commercial', 'industrial'],
    };
  }
  if (step.inspection_type === 'equipment_set') {
    return {
      ...step,
      title: 'Equipment Set & Exhaust Inspection',
      description:
        'Inspection of rooftop units, air handlers, makeup-air and exhaust systems, curbs/supports, condensate, disconnects, and required clearances on commercial mechanical systems.',
    };
  }
  return step;
});

const SEQUENCES: Record<BuildingType, MechanicalInspectionStep[]> = {
  residential_sf: RESIDENTIAL_SEQUENCE,
  residential_mf: RESIDENTIAL_SEQUENCE,
  commercial:     COMMERCIAL_SEQUENCE,
  industrial:     COMMERCIAL_SEQUENCE,
};

export function getMechanicalInspectionSequence(buildingType: BuildingType): MechanicalInspectionStep[] {
  return SEQUENCES[buildingType] ?? RESIDENTIAL_SEQUENCE;
}
