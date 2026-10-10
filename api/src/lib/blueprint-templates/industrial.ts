// lib/blueprint-templates/industrial.ts
// Industrial (warehouse / manufacturing / distribution) template — 13 phases, 60 tasks across 13 trades

import type { TemplateTask } from './types.js';

export const industrialTasks: TemplateTask[] = [
  // ─── Site Preparation ─────────────────────────────────────────────────────
  { sort_order: 1,  phase: 'site_prep',   trade_type: 'surveying',         csi_division: '02 21 00', estimated_duration_days: 4,  title: 'Survey, geotechnical & environmental assessment' },
  { sort_order: 2,  phase: 'site_prep',   trade_type: 'demolition',         csi_division: '02 41 00', estimated_duration_days: 5,  title: 'Site clearing, demolition & contamination remediation' },
  { sort_order: 3,  phase: 'site_prep',   trade_type: 'excavation',         csi_division: '31 23 00', estimated_duration_days: 7,  title: 'Mass grading, excavation & compaction testing' },
  { sort_order: 4,  phase: 'site_prep',   trade_type: 'site_utilities',         csi_division: '33 10 00', estimated_duration_days: 8,  title: 'Utility infrastructure (heavy power, water, sewer, gas, fire)' },
  { sort_order: 5,  phase: 'site_prep',   trade_type: 'civil',         csi_division: '33 40 00', estimated_duration_days: 4,  title: 'Stormwater management, swales & detention basin' },

  // ─── Foundation ──────────────────────────────────────────────────────────
  { sort_order: 6,  phase: 'foundation',  trade_type: 'deep_foundations',      csi_division: '31 60 00', estimated_duration_days: 6,  title: 'Deep foundations (piers, piles or caissons)' },
  { sort_order: 7,  phase: 'foundation',  trade_type: 'concrete',      csi_division: '03 30 00', estimated_duration_days: 5,  title: 'Grade beams & perimeter footings' },
  { sort_order: 8,  phase: 'foundation',  trade_type: 'plumbing',      csi_division: '22 11 00', estimated_duration_days: 5,  title: 'Under-slab process & sanitary plumbing' },
  { sort_order: 9,  phase: 'foundation',  trade_type: 'electrical',    csi_division: '26 05 33', estimated_duration_days: 4,  title: 'Under-slab power conduit & ground grid' },
  { sort_order: 10, phase: 'foundation',  trade_type: 'concrete',      csi_division: '03 35 00', estimated_duration_days: 7,  title: 'Heavy-duty industrial slab-on-grade (6"+ reinforced)' },
  { sort_order: 11, phase: 'foundation',  trade_type: 'waterproofing',      csi_division: '07 10 00', estimated_duration_days: 3,  title: 'Foundation waterproofing & vapor barrier' },

  // ─── Structural / Framing ────────────────────────────────────────────────
  { sort_order: 12, phase: 'framing',     trade_type: 'structural_steel',    csi_division: '05 12 00', estimated_duration_days: 12, title: 'Primary structural steel erection (columns & frames)' },
  { sort_order: 13, phase: 'framing',     trade_type: 'structural_steel',    csi_division: '05 12 00', estimated_duration_days: 6,  title: 'Secondary steel, purlins, girts & bracing' },
  { sort_order: 14, phase: 'framing',     trade_type: 'framing',       csi_division: '06 11 00', estimated_duration_days: 4,  title: 'Office / mezzanine framing' },
  { sort_order: 15, phase: 'framing',     trade_type: 'concrete',      csi_division: '03 30 00', estimated_duration_days: 5,  title: 'Mezzanine & elevated slab pours' },

  // ─── Roofing ─────────────────────────────────────────────────────────────
  { sort_order: 16, phase: 'roofing',     trade_type: 'roofing',       csi_division: '07 51 00', estimated_duration_days: 6,  title: 'Metal roof deck & insulation' },
  { sort_order: 17, phase: 'roofing',     trade_type: 'roofing',       csi_division: '07 61 00', estimated_duration_days: 5,  title: 'Standing seam metal roof panels' },
  { sort_order: 18, phase: 'roofing',     trade_type: 'roofing',       csi_division: '07 60 00', estimated_duration_days: 3,  title: 'Roof drains, skylights & smoke vents' },

  // ─── Rough MEP ───────────────────────────────────────────────────────────
  { sort_order: 19, phase: 'rough_in',    trade_type: 'electrical',    csi_division: '26 05 00', estimated_duration_days: 7,  title: 'Medium-voltage service entrance & main switchgear' },
  { sort_order: 20, phase: 'rough_in',    trade_type: 'electrical',    csi_division: '26 24 00', estimated_duration_days: 8,  title: 'Motor control centers & distribution panels' },
  { sort_order: 21, phase: 'rough_in',    trade_type: 'electrical',    csi_division: '26 27 26', estimated_duration_days: 7,  title: 'Branch circuit & equipment wiring — production floor' },
  { sort_order: 22, phase: 'rough_in',    trade_type: 'electrical',    csi_division: '26 27 26', estimated_duration_days: 3,  title: 'Office / breakroom electrical rough-in' },
  { sort_order: 23, phase: 'rough_in',    trade_type: 'fire_alarm',    csi_division: '28 46 00', estimated_duration_days: 4,  title: 'Fire alarm, emergency lighting & exit signs' },
  { sort_order: 24, phase: 'rough_in',    trade_type: 'security_access',    csi_division: '28 20 00', estimated_duration_days: 3,  title: 'Data, CCTV & access control rough-in' },
  { sort_order: 25, phase: 'rough_in',    trade_type: 'plumbing',      csi_division: '22 11 16', estimated_duration_days: 5,  title: 'Domestic & process water supply rough-in' },
  { sort_order: 26, phase: 'rough_in',    trade_type: 'fire_sprinkler',      csi_division: '21 13 00', estimated_duration_days: 6,  title: 'Fire suppression sprinkler system rough-in' },
  { sort_order: 27, phase: 'rough_in',    trade_type: 'hvac',          csi_division: '23 31 00', estimated_duration_days: 6,  title: 'Make-up air units & industrial ventilation ductwork' },
  { sort_order: 28, phase: 'rough_in',    trade_type: 'hvac',          csi_division: '23 09 00', estimated_duration_days: 4,  title: 'HVAC equipment sets — office & production areas' },
  { sort_order: 29, phase: 'rough_in',    trade_type: 'hvac',          csi_division: '23 35 00', estimated_duration_days: 3,  title: 'Exhaust, dust collection & process ventilation rough-in' },
  { sort_order: 30, phase: 'rough_in',    trade_type: 'process_piping',      csi_division: '40 00 00', estimated_duration_days: 3,  title: 'Compressed air & process piping rough-in' },

  // ─── Inspections ─────────────────────────────────────────────────────────
  { sort_order: 31, phase: 'inspections', trade_type: 'general',       csi_division: '01 45 00', estimated_duration_days: 2,  title: 'Structural steel & slab inspection' },
  { sort_order: 32, phase: 'inspections', trade_type: 'general',       csi_division: '01 45 00', estimated_duration_days: 3,  title: 'MEP rough-in inspections' },
  { sort_order: 33, phase: 'inspections', trade_type: 'general',       csi_division: '01 45 00', estimated_duration_days: 2,  title: 'Fire suppression & life-safety inspection' },

  // ─── Insulation ──────────────────────────────────────────────────────────
  { sort_order: 34, phase: 'insulation',  trade_type: 'insulation',    csi_division: '07 21 00', estimated_duration_days: 5,  title: 'Wall & roof insulation — production & office' },
  { sort_order: 35, phase: 'insulation',  trade_type: 'insulation',    csi_division: '07 24 00', estimated_duration_days: 3,  title: 'Exterior insulation & air barrier' },

  // ─── Drywall ─────────────────────────────────────────────────────────────
  { sort_order: 36, phase: 'drywall',     trade_type: 'drywall',       csi_division: '09 29 00', estimated_duration_days: 5,  title: 'Office & restroom drywall hang' },
  { sort_order: 37, phase: 'drywall',     trade_type: 'drywall',       csi_division: '09 29 00', estimated_duration_days: 5,  title: 'Office drywall tape, mud & finish' },

  // ─── Interior Finishes (office / common areas) ───────────────────────────
  { sort_order: 38, phase: 'finishes_interior', trade_type: 'painting', csi_division: '09 91 00', estimated_duration_days: 5,  title: 'Interior painting — office & restrooms' },
  { sort_order: 39, phase: 'finishes_interior', trade_type: 'flooring_carpet', csi_division: '09 65 00', estimated_duration_days: 3,  title: 'Office flooring (carpet, LVT, tile)' },
  { sort_order: 40, phase: 'finishes_interior', trade_type: 'flooring_epoxy', csi_division: '09 67 23', estimated_duration_days: 4,  title: 'Production floor epoxy coating & joint fill' },
  { sort_order: 41, phase: 'finishes_interior', trade_type: 'acoustical_ceilings', csi_division: '09 51 00', estimated_duration_days: 3,  title: 'Office ceiling grid & tiles' },
  { sort_order: 42, phase: 'finishes_interior', trade_type: 'doors_hardware', csi_division: '08 14 00', estimated_duration_days: 3,  title: 'Interior doors, hardware & restroom accessories' },
  { sort_order: 43, phase: 'finishes_interior', trade_type: 'plumbing', csi_division: '22 40 00', estimated_duration_days: 3,  title: 'Plumbing fixture trim-out (restrooms, eyewash, hose bibs)' },
  { sort_order: 44, phase: 'finishes_interior', trade_type: 'electrical', csi_division: '26 27 26', estimated_duration_days: 4, title: 'Electrical device, panel & lighting trim-out' },
  { sort_order: 45, phase: 'finishes_interior', trade_type: 'hvac',     csi_division: '23 37 00', estimated_duration_days: 2,  title: 'HVAC diffusers, registers & control panels' },

  // ─── Exterior Finishes ───────────────────────────────────────────────────
  { sort_order: 46, phase: 'finishes_exterior', trade_type: 'siding', csi_division: '07 42 13', estimated_duration_days: 6, title: 'Metal wall panel system (insulated panels)' },
  { sort_order: 47, phase: 'finishes_exterior', trade_type: 'overhead_doors', csi_division: '08 36 00', estimated_duration_days: 3, title: 'Overhead dock doors, man-doors & loading bumpers' },
  { sort_order: 48, phase: 'finishes_exterior', trade_type: 'painting', csi_division: '09 91 13', estimated_duration_days: 2, title: 'Exterior painting & caulking' },

  // ─── Site Work ───────────────────────────────────────────────────────────
  { sort_order: 49, phase: 'sitework',    trade_type: 'civil',         csi_division: '32 11 00', estimated_duration_days: 5,  title: 'Truck court & heavy-duty pavement base' },
  { sort_order: 50, phase: 'sitework',    trade_type: 'asphalt_paving',         csi_division: '32 12 16', estimated_duration_days: 5,  title: 'Truck court & parking asphalt paving' },
  { sort_order: 51, phase: 'sitework',    trade_type: 'pavement_marking',         csi_division: '32 17 23', estimated_duration_days: 2,  title: 'Site markings, safety striping & ADA ramps' },
  { sort_order: 52, phase: 'sitework',    trade_type: 'electrical',    csi_division: '26 56 00', estimated_duration_days: 3,  title: 'Site & security lighting' },
  { sort_order: 53, phase: 'sitework',    trade_type: 'landscaping',         csi_division: '32 90 00', estimated_duration_days: 3,  title: 'Final grading, seeding & landscaping buffer' },

  // ─── Commissioning ───────────────────────────────────────────────────────
  { sort_order: 54, phase: 'commissioning', trade_type: 'test_balance',        csi_division: '23 05 93', estimated_duration_days: 5,  title: 'HVAC & ventilation test, adjust & balance' },
  { sort_order: 55, phase: 'commissioning', trade_type: 'electrical',  csi_division: '26 08 00', estimated_duration_days: 4,  title: 'Electrical systems load testing & acceptance' },
  { sort_order: 56, phase: 'commissioning', trade_type: 'general',     csi_division: '28 31 00', estimated_duration_days: 3,  title: 'Fire alarm, suppression & life-safety acceptance' },
  { sort_order: 57, phase: 'commissioning', trade_type: 'process_piping',    csi_division: '40 00 00', estimated_duration_days: 2,  title: 'Process piping & compressed air pressure testing' },
  { sort_order: 58, phase: 'commissioning', trade_type: 'commissioning_agent',     csi_division: '01 91 00', estimated_duration_days: 3,  title: 'Facility systems commissioning & operator training' },

  // ─── Punch ───────────────────────────────────────────────────────────────
  { sort_order: 59, phase: 'punch',       trade_type: 'general',       csi_division: '01 77 00', estimated_duration_days: 7,  title: 'Punch list walkthrough (all areas)' },
  { sort_order: 60, phase: 'punch',       trade_type: 'general',       csi_division: '01 77 00', estimated_duration_days: 2,  title: 'Final inspections, CO & permit closeout' },
];
