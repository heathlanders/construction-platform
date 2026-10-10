// lib/blueprint-templates/residential-mf.ts
// Residential multi-family template — 13 phases, 52 tasks across 12 trades

import type { TemplateTask } from './types.js';

export const residentialMfTasks: TemplateTask[] = [
  // ─── Site Preparation ─────────────────────────────────────────────────────
  { sort_order: 1,  phase: 'site_prep',   trade_type: 'surveying',         csi_division: '02 21 00', estimated_duration_days: 3,  title: 'Survey, stake & geotechnical investigation' },
  { sort_order: 2,  phase: 'site_prep',   trade_type: 'demolition',         csi_division: '02 41 00', estimated_duration_days: 3,  title: 'Site demolition, clearing & grubbing' },
  { sort_order: 3,  phase: 'site_prep',   trade_type: 'excavation',         csi_division: '31 23 00', estimated_duration_days: 5,  title: 'Mass excavation & haul-off' },
  { sort_order: 4,  phase: 'site_prep',   trade_type: 'site_utilities',         csi_division: '33 10 00', estimated_duration_days: 5,  title: 'Underground utilities (water, sewer, gas, electric)' },
  { sort_order: 5,  phase: 'site_prep',   trade_type: 'erosion_control',         csi_division: '31 25 00', estimated_duration_days: 2,  title: 'Stormwater management & erosion controls' },

  // ─── Foundation ──────────────────────────────────────────────────────────
  { sort_order: 6,  phase: 'foundation',  trade_type: 'concrete',      csi_division: '03 11 00', estimated_duration_days: 4,  title: 'Spread footings & grade beams — form & pour' },
  { sort_order: 7,  phase: 'foundation',  trade_type: 'concrete',      csi_division: '03 30 00', estimated_duration_days: 3,  title: 'Foundation walls — form, rebar & pour' },
  { sort_order: 8,  phase: 'foundation',  trade_type: 'plumbing',      csi_division: '22 11 00', estimated_duration_days: 3,  title: 'Under-slab plumbing rough-in (all units)' },
  { sort_order: 9,  phase: 'foundation',  trade_type: 'concrete',      csi_division: '03 30 00', estimated_duration_days: 3,  title: 'Slab-on-grade pour' },
  { sort_order: 10, phase: 'foundation',  trade_type: 'waterproofing',      csi_division: '07 10 00', estimated_duration_days: 2,  title: 'Waterproofing, damp-proofing & drainage mat' },

  // ─── Framing ─────────────────────────────────────────────────────────────
  { sort_order: 11, phase: 'framing',     trade_type: 'framing',       csi_division: '06 11 00', estimated_duration_days: 8,  title: 'Structural floor & wall framing — all levels' },
  { sort_order: 12, phase: 'framing',     trade_type: 'framing',       csi_division: '06 11 00', estimated_duration_days: 4,  title: 'Corridor & common-area framing' },
  { sort_order: 13, phase: 'framing',     trade_type: 'framing',       csi_division: '06 11 00', estimated_duration_days: 4,  title: 'Roof framing & decking' },
  { sort_order: 14, phase: 'framing',     trade_type: 'framing',       csi_division: '06 16 00', estimated_duration_days: 3,  title: 'Exterior sheathing, housewrap & air barrier' },
  { sort_order: 15, phase: 'framing',     trade_type: 'framing',       csi_division: '08 10 00', estimated_duration_days: 2,  title: 'Window & door rough openings' },

  // ─── Roofing ─────────────────────────────────────────────────────────────
  { sort_order: 16, phase: 'roofing',     trade_type: 'roofing',       csi_division: '07 51 00', estimated_duration_days: 4,  title: 'Roof underlayment & ice & water shield' },
  { sort_order: 17, phase: 'roofing',     trade_type: 'roofing',       csi_division: '07 31 13', estimated_duration_days: 4,  title: 'Finish roofing installation' },
  { sort_order: 18, phase: 'roofing',     trade_type: 'gutters',       csi_division: '07 71 23', estimated_duration_days: 2,  title: 'Flashing, gutters & roof drainage' },

  // ─── Rough MEP ───────────────────────────────────────────────────────────
  { sort_order: 19, phase: 'rough_in',    trade_type: 'electrical',    csi_division: '26 05 00', estimated_duration_days: 5,  title: 'Service entrance, main switchgear & risers' },
  { sort_order: 20, phase: 'rough_in',    trade_type: 'electrical',    csi_division: '26 27 26', estimated_duration_days: 6,  title: 'Unit electrical rough-in — all units' },
  { sort_order: 21, phase: 'rough_in',    trade_type: 'electrical',    csi_division: '26 27 26', estimated_duration_days: 2,  title: 'Common-area & corridor lighting rough-in' },
  { sort_order: 22, phase: 'rough_in',    trade_type: 'fire_alarm',    csi_division: '28 46 00', estimated_duration_days: 2,  title: 'Fire alarm & smoke detector system rough-in' },
  { sort_order: 23, phase: 'rough_in',    trade_type: 'low_voltage',    csi_division: '27 15 00', estimated_duration_days: 2,  title: 'Data, intercom & access control rough-in' },
  { sort_order: 24, phase: 'rough_in',    trade_type: 'plumbing',      csi_division: '22 11 16', estimated_duration_days: 6,  title: 'Unit plumbing rough-in — all units' },
  { sort_order: 25, phase: 'rough_in',    trade_type: 'plumbing',      csi_division: '22 11 16', estimated_duration_days: 3,  title: 'Common-area plumbing rough-in (laundry, lobby)' },
  { sort_order: 26, phase: 'rough_in',    trade_type: 'hvac',          csi_division: '23 31 00', estimated_duration_days: 6,  title: 'HVAC ductwork & ventilation rough-in — all units' },
  { sort_order: 27, phase: 'rough_in',    trade_type: 'hvac',          csi_division: '23 09 00', estimated_duration_days: 2,  title: 'HVAC equipment sets & corridor ventilation' },

  // ─── Inspections ─────────────────────────────────────────────────────────
  { sort_order: 28, phase: 'inspections', trade_type: 'general',       csi_division: '01 45 00', estimated_duration_days: 1,  title: 'Framing inspection — all levels' },
  { sort_order: 29, phase: 'inspections', trade_type: 'general',       csi_division: '01 45 00', estimated_duration_days: 2,  title: 'MEP rough-in inspections' },

  // ─── Insulation ──────────────────────────────────────────────────────────
  { sort_order: 30, phase: 'insulation',  trade_type: 'insulation',    csi_division: '07 21 00', estimated_duration_days: 4,  title: 'Wall, floor & ceiling batt insulation' },
  { sort_order: 31, phase: 'insulation',  trade_type: 'insulation',    csi_division: '07 21 16', estimated_duration_days: 2,  title: 'Attic & roof insulation' },
  { sort_order: 32, phase: 'insulation',  trade_type: 'insulation',    csi_division: '09 84 00', estimated_duration_days: 2,  title: 'Sound attenuation (party walls & floors)' },

  // ─── Drywall ─────────────────────────────────────────────────────────────
  { sort_order: 33, phase: 'drywall',     trade_type: 'drywall',       csi_division: '09 29 00', estimated_duration_days: 6,  title: 'Drywall hang — all units & common areas' },
  { sort_order: 34, phase: 'drywall',     trade_type: 'drywall',       csi_division: '09 29 00', estimated_duration_days: 7,  title: 'Drywall tape, mud & finish' },

  // ─── Interior Finishes ───────────────────────────────────────────────────
  { sort_order: 35, phase: 'finishes_interior', trade_type: 'painting', csi_division: '09 91 00', estimated_duration_days: 6,  title: 'Interior painting — units & common areas' },
  { sort_order: 36, phase: 'finishes_interior', trade_type: 'flooring_resilient', csi_division: '09 65 00', estimated_duration_days: 5,  title: 'Unit flooring installation' },
  { sort_order: 37, phase: 'finishes_interior', trade_type: 'tile', csi_division: '09 30 00', estimated_duration_days: 2,  title: 'Common-area tile & flooring' },
  { sort_order: 38, phase: 'finishes_interior', trade_type: 'finish_carpentry', csi_division: '06 20 00', estimated_duration_days: 4,  title: 'Interior trim, doors & hardware — all units' },
  { sort_order: 39, phase: 'finishes_interior', trade_type: 'cabinetry', csi_division: '12 32 00', estimated_duration_days: 3,  title: 'Unit cabinet & countertop installation' },
  { sort_order: 40, phase: 'finishes_interior', trade_type: 'plumbing', csi_division: '22 40 00', estimated_duration_days: 3,  title: 'Plumbing fixture trim-out — all units' },
  { sort_order: 41, phase: 'finishes_interior', trade_type: 'electrical', csi_division: '26 27 26', estimated_duration_days: 3, title: 'Electrical device & fixture trim-out' },
  { sort_order: 42, phase: 'finishes_interior', trade_type: 'hvac',     csi_division: '23 37 00', estimated_duration_days: 2,  title: 'HVAC register, grille & thermostat install' },

  // ─── Exterior Finishes ───────────────────────────────────────────────────
  { sort_order: 43, phase: 'finishes_exterior', trade_type: 'siding', csi_division: '07 46 00', estimated_duration_days: 5, title: 'Exterior cladding (siding, stucco, or veneer)' },
  { sort_order: 44, phase: 'finishes_exterior', trade_type: 'painting', csi_division: '09 91 13', estimated_duration_days: 3, title: 'Exterior painting & caulking' },
  { sort_order: 45, phase: 'finishes_exterior', trade_type: 'windows', csi_division: '08 50 00', estimated_duration_days: 2, title: 'Exterior doors, windows & balcony railings' },

  // ─── Site Work ───────────────────────────────────────────────────────────
  { sort_order: 46, phase: 'sitework',    trade_type: 'asphalt_paving',         csi_division: '32 12 16', estimated_duration_days: 4,  title: 'Parking lot & drive aisle paving' },
  { sort_order: 47, phase: 'sitework',    trade_type: 'pavement_marking',         csi_division: '32 17 23', estimated_duration_days: 1,  title: 'Site signage & pavement markings' },
  { sort_order: 48, phase: 'sitework',    trade_type: 'landscaping',         csi_division: '32 90 00', estimated_duration_days: 3,  title: 'Final grading, landscaping & irrigation' },

  // ─── Commissioning ───────────────────────────────────────────────────────
  { sort_order: 49, phase: 'commissioning', trade_type: 'general',     csi_division: '01 91 00', estimated_duration_days: 3,  title: 'HVAC & life-safety systems commissioning' },
  { sort_order: 50, phase: 'commissioning', trade_type: 'electrical',  csi_division: '26 08 00', estimated_duration_days: 2,  title: 'Electrical systems testing & balancing' },

  // ─── Punch ───────────────────────────────────────────────────────────────
  { sort_order: 51, phase: 'punch',       trade_type: 'general',       csi_division: '01 77 00', estimated_duration_days: 5,  title: 'Punch list walkthrough — all units' },
  { sort_order: 52, phase: 'punch',       trade_type: 'general',       csi_division: '01 77 00', estimated_duration_days: 2,  title: 'Final inspections & certificate of occupancy' },
];
