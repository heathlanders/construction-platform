// lib/blueprint-templates/commercial.ts
// Commercial (office / retail / mixed-use) template — 13 phases, 58 tasks across 13 trades

import type { TemplateTask } from './types.js';

export const commercialTasks: TemplateTask[] = [
  // ─── Site Preparation ─────────────────────────────────────────────────────
  { sort_order: 1,  phase: 'site_prep',   trade_type: 'surveying',         csi_division: '02 21 00', estimated_duration_days: 3,  title: 'Survey, ALTA & geotechnical investigation' },
  { sort_order: 2,  phase: 'site_prep',   trade_type: 'demolition',         csi_division: '02 41 00', estimated_duration_days: 5,  title: 'Demolition of existing structures' },
  { sort_order: 3,  phase: 'site_prep',   trade_type: 'excavation',         csi_division: '31 23 00', estimated_duration_days: 7,  title: 'Mass excavation, shoring & dewatering' },
  { sort_order: 4,  phase: 'site_prep',   trade_type: 'site_utilities',         csi_division: '33 10 00', estimated_duration_days: 7,  title: 'Underground utilities (domestic water, fire, sewer, gas, power)' },
  { sort_order: 5,  phase: 'site_prep',   trade_type: 'erosion_control',         csi_division: '31 25 00', estimated_duration_days: 3,  title: 'Stormwater detention & erosion controls' },

  // ─── Foundation ──────────────────────────────────────────────────────────
  { sort_order: 6,  phase: 'foundation',  trade_type: 'concrete',      csi_division: '03 11 00', estimated_duration_days: 5,  title: 'Spread footings, grade beams & pile caps' },
  { sort_order: 7,  phase: 'foundation',  trade_type: 'concrete',      csi_division: '03 30 00', estimated_duration_days: 5,  title: 'Foundation walls & basement slab' },
  { sort_order: 8,  phase: 'foundation',  trade_type: 'plumbing',      csi_division: '22 11 00', estimated_duration_days: 4,  title: 'Under-slab plumbing & floor drains' },
  { sort_order: 9,  phase: 'foundation',  trade_type: 'electrical',    csi_division: '26 05 33', estimated_duration_days: 3,  title: 'Under-slab conduit & grounding' },
  { sort_order: 10, phase: 'foundation',  trade_type: 'waterproofing',      csi_division: '07 10 00', estimated_duration_days: 3,  title: 'Waterproofing & below-grade drainage' },

  // ─── Structural / Framing ────────────────────────────────────────────────
  { sort_order: 11, phase: 'framing',     trade_type: 'structural_steel',    csi_division: '05 12 00', estimated_duration_days: 10, title: 'Structural steel erection' },
  { sort_order: 12, phase: 'framing',     trade_type: 'concrete',      csi_division: '03 35 00', estimated_duration_days: 8,  title: 'Concrete floor decks — all levels' },
  { sort_order: 13, phase: 'framing',     trade_type: 'metal_decking',    csi_division: '05 30 00', estimated_duration_days: 4,  title: 'Metal deck & shear connections' },
  { sort_order: 14, phase: 'framing',     trade_type: 'metal_stud_framing',       csi_division: '09 22 00', estimated_duration_days: 8,  title: 'Interior metal stud framing — all floors' },
  { sort_order: 15, phase: 'framing',     trade_type: 'framing',       csi_division: '08 10 00', estimated_duration_days: 3,  title: 'Window & storefront rough openings' },

  // ─── Roofing ─────────────────────────────────────────────────────────────
  { sort_order: 16, phase: 'roofing',     trade_type: 'roofing',       csi_division: '07 51 00', estimated_duration_days: 5,  title: 'Roof insulation & membrane installation' },
  { sort_order: 17, phase: 'roofing',     trade_type: 'roofing',       csi_division: '07 60 00', estimated_duration_days: 3,  title: 'Roof drains, scuppers, expansion joints & flashing' },
  { sort_order: 18, phase: 'roofing',     trade_type: 'roofing',       csi_division: '07 42 00', estimated_duration_days: 2,  title: 'Parapet caps, mechanical curbs & equipment screens' },

  // ─── Rough MEP ───────────────────────────────────────────────────────────
  { sort_order: 19, phase: 'rough_in',    trade_type: 'electrical',    csi_division: '26 05 00', estimated_duration_days: 7,  title: 'Electrical service, switchgear & distribution' },
  { sort_order: 20, phase: 'rough_in',    trade_type: 'electrical',    csi_division: '26 27 26', estimated_duration_days: 8,  title: 'Branch circuit conduit & wiring — all floors' },
  { sort_order: 21, phase: 'rough_in',    trade_type: 'electrical',    csi_division: '26 51 00', estimated_duration_days: 3,  title: 'Lighting rough-in — ceiling & emergency egress' },
  { sort_order: 22, phase: 'rough_in',    trade_type: 'fire_alarm',    csi_division: '28 46 00', estimated_duration_days: 4,  title: 'Fire alarm, sprinkler monitoring & PA rough-in' },
  { sort_order: 23, phase: 'rough_in',    trade_type: 'low_voltage',    csi_division: '27 15 00', estimated_duration_days: 4,  title: 'Data, telecom & security system rough-in' },
  { sort_order: 24, phase: 'rough_in',    trade_type: 'plumbing',      csi_division: '22 11 16', estimated_duration_days: 6,  title: 'Domestic water supply & drain rough-in' },
  { sort_order: 25, phase: 'rough_in',    trade_type: 'fire_sprinkler',      csi_division: '21 13 00', estimated_duration_days: 5,  title: 'Fire suppression sprinkler rough-in' },
  { sort_order: 26, phase: 'rough_in',    trade_type: 'hvac',          csi_division: '23 31 00', estimated_duration_days: 8,  title: 'HVAC ductwork distribution — all floors' },
  { sort_order: 27, phase: 'rough_in',    trade_type: 'hvac',          csi_division: '23 09 00', estimated_duration_days: 5,  title: 'AHU, VAV boxes & rooftop unit installation' },
  { sort_order: 28, phase: 'rough_in',    trade_type: 'controls_bms',          csi_division: '25 00 00', estimated_duration_days: 3,  title: 'Building automation & controls rough-in' },

  // ─── Inspections ─────────────────────────────────────────────────────────
  { sort_order: 29, phase: 'inspections', trade_type: 'general',       csi_division: '01 45 00', estimated_duration_days: 2,  title: 'Structural & framing inspection' },
  { sort_order: 30, phase: 'inspections', trade_type: 'general',       csi_division: '01 45 00', estimated_duration_days: 3,  title: 'MEP rough-in inspections (multi-floor)' },
  { sort_order: 31, phase: 'inspections', trade_type: 'general',       csi_division: '01 45 00', estimated_duration_days: 1,  title: 'Fire suppression inspection' },

  // ─── Insulation ──────────────────────────────────────────────────────────
  { sort_order: 32, phase: 'insulation',  trade_type: 'insulation',    csi_division: '07 21 00', estimated_duration_days: 5,  title: 'Wall & roof insulation — all floors' },
  { sort_order: 33, phase: 'insulation',  trade_type: 'insulation',    csi_division: '09 84 00', estimated_duration_days: 3,  title: 'Acoustic insulation — conference rooms & restrooms' },

  // ─── Drywall ─────────────────────────────────────────────────────────────
  { sort_order: 34, phase: 'drywall',     trade_type: 'drywall',       csi_division: '09 29 00', estimated_duration_days: 8,  title: 'Drywall hang — tenant spaces & corridors' },
  { sort_order: 35, phase: 'drywall',     trade_type: 'drywall',       csi_division: '09 29 00', estimated_duration_days: 8,  title: 'Drywall tape, mud & finish' },
  { sort_order: 36, phase: 'drywall',     trade_type: 'drywall',       csi_division: '09 22 00', estimated_duration_days: 3,  title: 'Shaft wall & stairwell enclosures' },

  // ─── Interior Finishes ───────────────────────────────────────────────────
  { sort_order: 37, phase: 'finishes_interior', trade_type: 'painting', csi_division: '09 91 00', estimated_duration_days: 8,  title: 'Interior painting — all spaces' },
  { sort_order: 38, phase: 'finishes_interior', trade_type: 'flooring_carpet', csi_division: '09 65 00', estimated_duration_days: 6,  title: 'Flooring — carpet, tile & luxury vinyl tile' },
  { sort_order: 39, phase: 'finishes_interior', trade_type: 'acoustical_ceilings', csi_division: '09 51 00', estimated_duration_days: 5,  title: 'Suspended acoustic ceiling system' },
  { sort_order: 40, phase: 'finishes_interior', trade_type: 'millwork', csi_division: '06 40 00', estimated_duration_days: 5,  title: 'Interior millwork, doors & hardware' },
  { sort_order: 41, phase: 'finishes_interior', trade_type: 'toilet_partitions', csi_division: '10 21 00', estimated_duration_days: 4,  title: 'Restroom accessories, partitions & casework' },
  { sort_order: 42, phase: 'finishes_interior', trade_type: 'plumbing', csi_division: '22 40 00', estimated_duration_days: 4,  title: 'Plumbing fixture trim-out' },
  { sort_order: 43, phase: 'finishes_interior', trade_type: 'electrical', csi_division: '26 27 26', estimated_duration_days: 5, title: 'Electrical device, panel trim & fixture installation' },
  { sort_order: 44, phase: 'finishes_interior', trade_type: 'hvac',     csi_division: '23 37 00', estimated_duration_days: 3,  title: 'HVAC diffusers, grilles & controls trim-out' },

  // ─── Exterior Finishes ───────────────────────────────────────────────────
  { sort_order: 45, phase: 'finishes_exterior', trade_type: 'masonry', csi_division: '04 21 13', estimated_duration_days: 7, title: 'Exterior masonry or cladding system' },
  { sort_order: 46, phase: 'finishes_exterior', trade_type: 'curtain_wall', csi_division: '08 44 00', estimated_duration_days: 5, title: 'Curtain wall & storefront glazing' },
  { sort_order: 47, phase: 'finishes_exterior', trade_type: 'painting', csi_division: '09 91 13', estimated_duration_days: 3, title: 'Exterior painting & sealants' },
  { sort_order: 48, phase: 'finishes_exterior', trade_type: 'exterior_doors', csi_division: '08 11 00', estimated_duration_days: 2, title: 'Exterior doors, canopies & signage' },

  // ─── Site Work ───────────────────────────────────────────────────────────
  { sort_order: 49, phase: 'sitework',    trade_type: 'asphalt_paving',         csi_division: '32 12 16', estimated_duration_days: 5,  title: 'Parking lot base course & paving' },
  { sort_order: 50, phase: 'sitework',    trade_type: 'pavement_marking',         csi_division: '32 17 23', estimated_duration_days: 2,  title: 'Site signage, striping & ADA compliance' },
  { sort_order: 51, phase: 'sitework',    trade_type: 'landscaping',         csi_division: '32 90 00', estimated_duration_days: 4,  title: 'Final grading, landscaping & irrigation' },
  { sort_order: 52, phase: 'sitework',    trade_type: 'electrical',    csi_division: '26 56 00', estimated_duration_days: 2,  title: 'Site lighting & parking lot poles' },

  // ─── Commissioning ───────────────────────────────────────────────────────
  { sort_order: 53, phase: 'commissioning', trade_type: 'test_balance',        csi_division: '23 05 93', estimated_duration_days: 5,  title: 'HVAC test, adjust & balance (TAB)' },
  { sort_order: 54, phase: 'commissioning', trade_type: 'electrical',  csi_division: '26 08 00', estimated_duration_days: 3,  title: 'Electrical systems testing & acceptance' },
  { sort_order: 55, phase: 'commissioning', trade_type: 'general',     csi_division: '28 31 00', estimated_duration_days: 2,  title: 'Fire alarm & suppression acceptance testing' },
  { sort_order: 56, phase: 'commissioning', trade_type: 'commissioning_agent',     csi_division: '01 91 00', estimated_duration_days: 3,  title: 'Building systems commissioning & owner training' },

  // ─── Punch ───────────────────────────────────────────────────────────────
  { sort_order: 57, phase: 'punch',       trade_type: 'general',       csi_division: '01 77 00', estimated_duration_days: 7,  title: 'Punch list walkthrough (all floors & spaces)' },
  { sort_order: 58, phase: 'punch',       trade_type: 'general',       csi_division: '01 77 00', estimated_duration_days: 2,  title: 'Final inspections, CO & permit closeout' },
];
