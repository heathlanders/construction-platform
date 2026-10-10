/**
 * Standard plumbing inspection milestone sequences by building type.
 *
 * These are the typical AHJ inspection checkpoints required under IPC- and UPC-based codes.
 * The milestone set is broadly the same under both model codes; individual jurisdictions
 * add or combine steps (e.g. some combine the water-supply test into rough-in). The
 * auto-generated milestones are a best-practice starting point — PMs should confirm the
 * exact required sequence with their local AHJ.
 *
 * CSI Division: 22 08 00 — Commissioning of Plumbing (all plumbing inspection milestones)
 */

import type { BuildingType, PlumbingInspectionStep } from './types.js';

// Residential sequence (single-family and multi-family)
const RESIDENTIAL_SEQUENCE: PlumbingInspectionStep[] = [
  {
    sequence_order: 1,
    inspection_type: 'underground',
    title: 'Underground / Groundwork Inspection',
    description:
      'Inspection of drain, waste, vent (DWV) and water lines below the slab or grade before they are covered. Verifies pipe materials, slope, and a successful water or air test on the buried DWV system.',
    csi_division: '22 08 00',
    estimated_duration_days: 1,
    required_for_building_types: [],  // required all types where there is under-slab piping
  },
  {
    sequence_order: 2,
    inspection_type: 'rough_in',
    title: 'Plumbing Rough-In Inspection',
    description:
      'Inspection of all DWV and water supply piping (top-out) after framing and before walls are closed. DWV system held under a water or air test; verifies venting, support, and fitting compliance.',
    csi_division: '22 08 00',
    estimated_duration_days: 1,
    required_for_building_types: [],  // required all types
  },
  {
    sequence_order: 3,
    inspection_type: 'water_supply',
    title: 'Water Supply Pressure Test',
    description:
      'Pressure test of the potable water distribution system. Verifies no leaks under test pressure, correct materials, and (where required) backflow / cross-connection protection.',
    csi_division: '22 08 00',
    estimated_duration_days: 1,
    required_for_building_types: [],  // required all types
  },
  {
    sequence_order: 4,
    inspection_type: 'gas_test',
    title: 'Fuel-Gas Pressure Test',
    description:
      'Pressure test of fuel-gas piping (natural gas / propane). Only applicable when the project includes fuel-gas piping. Verifies pipe sizing, joints, and a sustained pressure test.',
    csi_division: '22 08 00',
    estimated_duration_days: 1,
    required_for_building_types: [],  // applicable only when gas piping is present
  },
  {
    sequence_order: 5,
    inspection_type: 'final',
    title: 'Final Plumbing Inspection',
    description:
      'Final inspection after all fixtures are set and trimmed. Verifies fixture installation, traps, water-heater installation and relief piping, backflow devices, and functional flow/drainage.',
    csi_division: '22 08 00',
    estimated_duration_days: 1,
    required_for_building_types: [],  // required all types
  },
];

// Commercial / industrial sequence — same milestones; backflow and gas tests are
// effectively always required on commercial work.
const COMMERCIAL_SEQUENCE: PlumbingInspectionStep[] = RESIDENTIAL_SEQUENCE.map((step) => {
  if (step.inspection_type === 'gas_test') {
    return {
      ...step,
      description:
        'Pressure test of fuel-gas piping on commercial/industrial projects (natural gas / propane / medical gas where applicable). Verifies sizing, joints, and a sustained pressure test.',
      required_for_building_types: ['commercial', 'industrial'],
    };
  }
  if (step.inspection_type === 'water_supply') {
    return {
      ...step,
      title: 'Water Supply & Backflow Inspection',
      description:
        'Pressure test of the potable water distribution system plus verification of backflow / cross-connection protection assemblies required on commercial service.',
    };
  }
  return step;
});

const SEQUENCES: Record<BuildingType, PlumbingInspectionStep[]> = {
  residential_sf: RESIDENTIAL_SEQUENCE,
  residential_mf: RESIDENTIAL_SEQUENCE,
  commercial:     COMMERCIAL_SEQUENCE,
  industrial:     COMMERCIAL_SEQUENCE,
};

export function getPlumbingInspectionSequence(buildingType: BuildingType): PlumbingInspectionStep[] {
  return SEQUENCES[buildingType] ?? RESIDENTIAL_SEQUENCE;
}
