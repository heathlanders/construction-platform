// lib/blueprint-templates/residential-sf.ts
// Residential single-family template — 12 phases, 47 tasks across 12 trades

import type { TemplateTask } from './types.js';

export const residentialSfTasks: TemplateTask[] = [
  // ─── Site Preparation ─────────────────────────────────────────────────────
  { sort_order: 1,  phase: 'site_prep',   trade_type: 'surveying',     csi_division: '02 21 00', estimated_duration_days: 2, title: 'Survey & stake building footprint' },
  { sort_order: 2,  phase: 'site_prep',   trade_type: 'excavation',    csi_division: '31 20 00', estimated_duration_days: 2, title: 'Site clearing & grubbing' },
  { sort_order: 3,  phase: 'site_prep',   trade_type: 'excavation',    csi_division: '31 23 00', estimated_duration_days: 3, title: 'Excavation & rough grading' },
  { sort_order: 4,  phase: 'site_prep',   trade_type: 'erosion_control', csi_division: '31 25 00', estimated_duration_days: 2, title: 'Temporary erosion controls' },

  // ─── Foundation ──────────────────────────────────────────────────────────
  { sort_order: 5,  phase: 'foundation',  trade_type: 'concrete',      csi_division: '03 11 00', estimated_duration_days: 2, title: 'Form & pour footings' },
  { sort_order: 6,  phase: 'foundation',  trade_type: 'rebar',         csi_division: '03 20 00', estimated_duration_days: 1, title: 'Rebar & anchor bolt placement' },
  { sort_order: 7,  phase: 'foundation',  trade_type: 'concrete',      csi_division: '03 30 00', estimated_duration_days: 3, title: 'Foundation walls / slab-on-grade pour' },
  { sort_order: 8,  phase: 'foundation',  trade_type: 'plumbing',      csi_division: '22 11 00', estimated_duration_days: 2, title: 'Under-slab plumbing rough-in' },
  { sort_order: 9,  phase: 'foundation',  trade_type: 'waterproofing', csi_division: '07 10 00', estimated_duration_days: 1, title: 'Waterproofing & damp-proofing' },

  // ─── Framing ─────────────────────────────────────────────────────────────
  { sort_order: 10, phase: 'framing',     trade_type: 'framing',       csi_division: '06 11 00', estimated_duration_days: 5, title: 'Floor system framing' },
  { sort_order: 11, phase: 'framing',     trade_type: 'framing',       csi_division: '06 11 00', estimated_duration_days: 6, title: 'Exterior wall framing' },
  { sort_order: 12, phase: 'framing',     trade_type: 'framing',       csi_division: '06 11 00', estimated_duration_days: 3, title: 'Interior partition framing' },
  { sort_order: 13, phase: 'framing',     trade_type: 'truss_setting', csi_division: '06 17 53', estimated_duration_days: 4, title: 'Roof truss installation' },
  { sort_order: 14, phase: 'framing',     trade_type: 'framing',       csi_division: '06 16 00', estimated_duration_days: 2, title: 'Exterior sheathing & housewrap' },
  { sort_order: 15, phase: 'framing',     trade_type: 'framing',       csi_division: '08 10 00', estimated_duration_days: 1, title: 'Window & door rough openings' },

  // ─── Roofing ─────────────────────────────────────────────────────────────
  { sort_order: 16, phase: 'roofing',     trade_type: 'roofing',       csi_division: '07 51 00', estimated_duration_days: 3, title: 'Roof decking & underlayment' },
  { sort_order: 17, phase: 'roofing',     trade_type: 'roofing',       csi_division: '07 31 13', estimated_duration_days: 3, title: 'Shingle / finish roofing installation' },
  { sort_order: 18, phase: 'roofing',     trade_type: 'gutters',       csi_division: '07 71 23', estimated_duration_days: 1, title: 'Gutters, downspouts & flashing' },

  // ─── Rough MEP ───────────────────────────────────────────────────────────
  { sort_order: 19, phase: 'rough_in',    trade_type: 'electrical',    csi_division: '26 05 00', estimated_duration_days: 4, title: 'Service entrance & main panel' },
  { sort_order: 20, phase: 'rough_in',    trade_type: 'electrical',    csi_division: '26 27 26', estimated_duration_days: 3, title: 'Branch circuits — kitchen & bathrooms' },
  { sort_order: 21, phase: 'rough_in',    trade_type: 'electrical',    csi_division: '26 27 26', estimated_duration_days: 2, title: 'Branch circuits — bedrooms & living areas' },
  { sort_order: 22, phase: 'rough_in',    trade_type: 'electrical',    csi_division: '28 31 11', estimated_duration_days: 1, title: 'Smoke & CO detector rough-in' },
  { sort_order: 23, phase: 'rough_in',    trade_type: 'low_voltage',   csi_division: '27 15 00', estimated_duration_days: 1, title: 'Low-voltage (data, AV, security) rough-in' },
  { sort_order: 24, phase: 'rough_in',    trade_type: 'plumbing',      csi_division: '22 11 16', estimated_duration_days: 4, title: 'Supply & drain rough-in — bathrooms' },
  { sort_order: 25, phase: 'rough_in',    trade_type: 'plumbing',      csi_division: '22 11 16', estimated_duration_days: 2, title: 'Supply & drain rough-in — kitchen & laundry' },
  { sort_order: 26, phase: 'rough_in',    trade_type: 'hvac',          csi_division: '23 31 00', estimated_duration_days: 4, title: 'HVAC ductwork rough-in' },
  { sort_order: 27, phase: 'rough_in',    trade_type: 'hvac',          csi_division: '23 09 00', estimated_duration_days: 1, title: 'Furnace & AC equipment set' },

  // ─── Inspections ─────────────────────────────────────────────────────────
  { sort_order: 28, phase: 'inspections', trade_type: 'general',       csi_division: '01 45 00', estimated_duration_days: 1, title: 'Framing rough-in inspection' },
  { sort_order: 29, phase: 'inspections', trade_type: 'general',       csi_division: '01 45 00', estimated_duration_days: 1, title: 'MEP rough-in inspection' },

  // ─── Insulation ──────────────────────────────────────────────────────────
  { sort_order: 30, phase: 'insulation',  trade_type: 'insulation',    csi_division: '07 21 00', estimated_duration_days: 3, title: 'Wall & ceiling batt insulation' },
  { sort_order: 31, phase: 'insulation',  trade_type: 'insulation',    csi_division: '07 21 16', estimated_duration_days: 1, title: 'Attic insulation' },

  // ─── Drywall ─────────────────────────────────────────────────────────────
  { sort_order: 32, phase: 'drywall',     trade_type: 'drywall',       csi_division: '09 29 00', estimated_duration_days: 4, title: 'Drywall hang' },
  { sort_order: 33, phase: 'drywall',     trade_type: 'drywall',       csi_division: '09 29 00', estimated_duration_days: 5, title: 'Drywall tape, mud & finish' },

  // ─── Interior Finishes ───────────────────────────────────────────────────
  { sort_order: 34, phase: 'finishes_interior', trade_type: 'painting', csi_division: '09 91 00', estimated_duration_days: 4, title: 'Interior painting' },
  { sort_order: 35, phase: 'finishes_interior', trade_type: 'flooring_carpet', csi_division: '09 68 00', estimated_duration_days: 3, title: 'Flooring installation' },
  { sort_order: 36, phase: 'finishes_interior', trade_type: 'finish_carpentry', csi_division: '06 20 00', estimated_duration_days: 3, title: 'Interior trim, doors & hardware' },
  { sort_order: 37, phase: 'finishes_interior', trade_type: 'cabinetry', csi_division: '12 32 00', estimated_duration_days: 2, title: 'Cabinet & countertop installation' },
  { sort_order: 38, phase: 'finishes_interior', trade_type: 'plumbing', csi_division: '22 40 00', estimated_duration_days: 2, title: 'Plumbing fixture trim-out' },
  { sort_order: 39, phase: 'finishes_interior', trade_type: 'electrical', csi_division: '26 27 26', estimated_duration_days: 2, title: 'Electrical device trim-out & fixtures' },
  { sort_order: 40, phase: 'finishes_interior', trade_type: 'hvac',     csi_division: '23 37 00', estimated_duration_days: 1, title: 'HVAC grille, register & thermostat install' },

  // ─── Exterior Finishes ───────────────────────────────────────────────────
  { sort_order: 41, phase: 'finishes_exterior', trade_type: 'siding',   csi_division: '07 46 00', estimated_duration_days: 4, title: 'Siding & exterior cladding' },
  { sort_order: 42, phase: 'finishes_exterior', trade_type: 'painting', csi_division: '09 91 13', estimated_duration_days: 2, title: 'Exterior painting & caulking' },
  { sort_order: 43, phase: 'finishes_exterior', trade_type: 'windows',  csi_division: '08 50 00', estimated_duration_days: 1, title: 'Exterior door & window installation' },

  // ─── Site Work ───────────────────────────────────────────────────────────
  { sort_order: 44, phase: 'sitework',    trade_type: 'asphalt_paving', csi_division: '32 12 16', estimated_duration_days: 2, title: 'Driveway & walkway paving' },
  { sort_order: 45, phase: 'sitework',    trade_type: 'landscaping',   csi_division: '32 90 00', estimated_duration_days: 2, title: 'Final grading, seeding & landscaping' },

  // ─── Punch ────────────────────────────────────────────────────────────────
  { sort_order: 46, phase: 'punch',       trade_type: 'general',       csi_division: '01 77 00', estimated_duration_days: 3, title: 'Punch list walkthrough & corrections' },
  { sort_order: 47, phase: 'punch',       trade_type: 'general',       csi_division: '01 77 00', estimated_duration_days: 1, title: 'Final inspection & certificate of occupancy' },
];
