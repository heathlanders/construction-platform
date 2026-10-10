/**
 * Standard building-permit inspection milestone sequence by building type.
 *
 * These are the typical AHJ structural/envelope checkpoints under the IRC (residential 1-2
 * family) and IBC (all else). This sequence covers the work of the concrete, framing, and
 * roofing trades, which are inspected under the single building permit rather than separate
 * trade permits. A best-practice starting point — confirm the exact sequence with the AHJ.
 *
 * CSI divisions are per-step to match the responsible trade:
 *   03 30 00 Cast-in-Place Concrete · 06 10 00 Rough Carpentry · 07 30 00 Steep-Slope Roofing
 *   07 20 00 Thermal Protection     · 01 45 00 Quality Control (final)
 */

import type { BuildingType, BuildingInspectionStep } from './types.js';

// Residential sequence (IRC — single & multi family)
const RESIDENTIAL_SEQUENCE: BuildingInspectionStep[] = [
  {
    sequence_order: 1,
    inspection_type: 'footing',
    title: 'Footing / Setback Inspection',
    description:
      'Inspection of excavated footings, reinforcement, and setbacks before concrete is placed. Verifies depth, width, rebar size/placement, and bearing per the approved plans.',
    csi_division: '03 30 00',
    estimated_duration_days: 1,
    required_for_building_types: [],  // required all types
  },
  {
    sequence_order: 2,
    inspection_type: 'foundation',
    title: 'Foundation / Slab Inspection',
    description:
      'Pre-pour inspection of foundation walls or slab: reinforcement, vapor barrier, embedded anchors/hold-downs, and under-slab utilities. Verifies compliance before concrete is placed.',
    csi_division: '03 30 00',
    estimated_duration_days: 1,
    required_for_building_types: [],  // required all types
  },
  {
    sequence_order: 3,
    inspection_type: 'framing',
    title: 'Framing Inspection',
    description:
      'Inspection of structural framing after rough MEP and before cover: members, spans, connections, headers, fire blocking, and bracing per the approved structural plans.',
    csi_division: '06 10 00',
    estimated_duration_days: 1,
    required_for_building_types: [],  // required all types
  },
  {
    sequence_order: 4,
    inspection_type: 'sheathing',
    title: 'Sheathing / Shear Nailing Inspection',
    description:
      'Inspection of wall and roof sheathing and shear-wall nailing patterns, hold-downs, and straps. Verifies the lateral force-resisting system before the envelope is closed.',
    csi_division: '06 10 00',
    estimated_duration_days: 1,
    required_for_building_types: [],  // required all types
  },
  {
    sequence_order: 5,
    inspection_type: 'roof_dry_in',
    title: 'Roof Dry-In Inspection',
    description:
      'Inspection of roof underlayment / dry-in (and ice-and-water shield where required) before finish roofing. Verifies weather protection and fastening of the roofing trade work.',
    csi_division: '07 30 00',
    estimated_duration_days: 1,
    required_for_building_types: [],  // required all types
  },
  {
    sequence_order: 6,
    inspection_type: 'insulation',
    title: 'Insulation Inspection',
    description:
      'Inspection of insulation and air/vapor barriers after rough-in approvals and before drywall. Verifies R-values and envelope air sealing per the energy code.',
    csi_division: '07 20 00',
    estimated_duration_days: 1,
    required_for_building_types: [],  // required all types
  },
  {
    sequence_order: 7,
    inspection_type: 'final',
    title: 'Building Final Inspection',
    description:
      'Final building inspection after all trades are complete. Verifies life-safety items, egress, guards/handrails, and readiness for the certificate of occupancy.',
    csi_division: '01 45 00',
    estimated_duration_days: 1,
    required_for_building_types: [],  // required all types
  },
];

// Commercial / industrial sequence (IBC) — same milestones; titles note special inspections.
const COMMERCIAL_SEQUENCE: BuildingInspectionStep[] = RESIDENTIAL_SEQUENCE.map((step) => {
  if (step.inspection_type === 'footing' || step.inspection_type === 'foundation') {
    return {
      ...step,
      description:
        `${step.description} On IBC projects this is commonly coupled with special inspections (IBC Chapter 17) for concrete and reinforcement.`,
    };
  }
  if (step.inspection_type === 'sheathing') {
    return {
      ...step,
      description:
        `${step.description} On IBC projects, structural steel/welding and high-strength bolting may require special inspection.`,
    };
  }
  return step;
});

const SEQUENCES: Record<BuildingType, BuildingInspectionStep[]> = {
  residential_sf: RESIDENTIAL_SEQUENCE,
  residential_mf: COMMERCIAL_SEQUENCE,  // multifamily 3+ falls under IBC
  commercial:     COMMERCIAL_SEQUENCE,
  industrial:     COMMERCIAL_SEQUENCE,
};

export function getBuildingInspectionSequence(buildingType: BuildingType): BuildingInspectionStep[] {
  return SEQUENCES[buildingType] ?? RESIDENTIAL_SEQUENCE;
}
