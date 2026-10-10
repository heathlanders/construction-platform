/**
 * Standard electrical inspection milestone sequences by building type.
 *
 * These are the typical AHJ inspection checkpoints required under NEC-based codes.
 * Individual jurisdictions may add or skip steps — the auto-generated milestones
 * are a best-practice starting point; PMs should confirm with their local AHJ.
 *
 * CSI Division: 26 08 00 — Electrical Testing (all electrical inspection milestones)
 */

import type { BuildingType, InspectionStep } from './types.js';

// Residential sequence (single-family and multi-family)
const RESIDENTIAL_SEQUENCE: InspectionStep[] = [
  {
    sequence_order: 1,
    inspection_type: 'temporary_power',
    title: 'Temporary Power Inspection (Optional)',
    description:
      'Inspection of temporary electrical service before construction begins. Not required by all residential AHJs — confirm with your local inspector.',
    csi_division: '26 08 00',
    estimated_duration_days: 1,
    required_for_building_types: [],  // optional for residential
  },
  {
    sequence_order: 2,
    inspection_type: 'rough_in',
    title: 'Electrical Rough-In Inspection',
    description:
      'Inspection of all wiring, conduit, boxes, and raceways before walls are closed. Verifies compliance with NEC Articles 300 (wiring methods), 310 (conductors), and 314 (outlet boxes and fittings).',
    csi_division: '26 08 00',
    estimated_duration_days: 1,
    required_for_building_types: [],  // required all types
  },
  {
    sequence_order: 3,
    inspection_type: 'service',
    title: 'Service Entrance Inspection',
    description:
      'Inspection of main service panel, meter base, and service conductors. Verifies compliance with NEC Article 230 (services) and 240 (overcurrent protection).',
    csi_division: '26 08 00',
    estimated_duration_days: 1,
    required_for_building_types: [],  // required all types
  },
  {
    sequence_order: 4,
    inspection_type: 'cover',
    title: 'Cover Inspection',
    description:
      'Inspection before insulation and drywall are installed. Verifies all rough-in corrections have been made. Some AHJs combine this with rough-in.',
    csi_division: '26 08 00',
    estimated_duration_days: 1,
    required_for_building_types: [],  // required all types
  },
  {
    sequence_order: 5,
    inspection_type: 'final',
    title: 'Final Electrical Inspection',
    description:
      'Final inspection after all electrical work is complete. Verifies fixture installation, panel labeling, AFCI protection (NEC 210.12), and GFCI protection (NEC 210.8).',
    csi_division: '26 08 00',
    estimated_duration_days: 1,
    required_for_building_types: [],  // required all types
  },
];

// Commercial sequence (same milestones, temporary_power is required not optional)
const COMMERCIAL_SEQUENCE: InspectionStep[] = RESIDENTIAL_SEQUENCE.map((step) => {
  if (step.inspection_type === 'temporary_power') {
    return {
      ...step,
      title: 'Temporary Power Inspection',
      description:
        'Inspection of temporary electrical service required before construction begins on commercial projects. NEC Article 590.',
      required_for_building_types: ['commercial', 'industrial'],
    };
  }
  return step;
});

const SEQUENCES: Record<BuildingType, InspectionStep[]> = {
  residential_sf: RESIDENTIAL_SEQUENCE,
  residential_mf: RESIDENTIAL_SEQUENCE,
  commercial:     COMMERCIAL_SEQUENCE,
  industrial:     COMMERCIAL_SEQUENCE,
};

export function getInspectionSequence(buildingType: BuildingType): InspectionStep[] {
  return SEQUENCES[buildingType] ?? RESIDENTIAL_SEQUENCE;
}
