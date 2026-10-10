// lib/blueprint-templates/pole-barn.ts
// Post-frame (pole barn) template — agricultural / light-commercial post-frame
// construction. Differs from stick-frame: embedded/laminated columns instead of
// continuous foundation walls, girts + purlins instead of stud walls + rafters,
// metal roof & wall panels, large overhead doors. 30 tasks across 8 trades.

import type { TemplateTask } from './types.js';

export const poleBarnTasks: TemplateTask[] = [
  // ─── Site Preparation ──────────────────────────────────────────────────────
  { sort_order: 1,  phase: 'site_prep',   trade_type: 'surveying',      csi_division: '02 21 00', estimated_duration_days: 1, title: 'Survey & stake building footprint' },
  { sort_order: 2,  phase: 'site_prep',   trade_type: 'civil',      csi_division: '31 20 00', estimated_duration_days: 2, title: 'Site clearing & grubbing' },
  { sort_order: 3,  phase: 'site_prep',   trade_type: 'excavation',      csi_division: '31 23 00', estimated_duration_days: 2, title: 'Excavation, cut/fill & rough grading' },
  { sort_order: 4,  phase: 'site_prep',   trade_type: 'erosion_control',      csi_division: '31 25 00', estimated_duration_days: 1, title: 'Temporary erosion controls' },

  // ─── Foundation (post-frame) ─────────────────────────────────────────────────
  { sort_order: 10, phase: 'foundation',  trade_type: 'concrete',   csi_division: '31 63 00', estimated_duration_days: 2, title: 'Auger / drill column post holes per layout' },
  { sort_order: 11, phase: 'foundation',  trade_type: 'concrete',   csi_division: '03 30 00', estimated_duration_days: 2, title: 'Set column footing pads / concrete collars' },
  { sort_order: 12, phase: 'foundation',  trade_type: 'concrete',   csi_division: '03 30 00', estimated_duration_days: 1, title: 'Perimeter skirt board / grade beam' },

  // ─── Framing (post-frame) ────────────────────────────────────────────────────
  { sort_order: 20, phase: 'framing',     trade_type: 'post_frame',    csi_division: '06 13 00', estimated_duration_days: 3, title: 'Set post-frame columns / poles & plumb' },
  { sort_order: 21, phase: 'framing',     trade_type: 'framing',    csi_division: '06 11 00', estimated_duration_days: 2, title: 'Install splash plank & skirt board' },
  { sort_order: 22, phase: 'framing',     trade_type: 'framing',    csi_division: '06 11 00', estimated_duration_days: 3, title: 'Install wall girts' },
  { sort_order: 23, phase: 'framing',     trade_type: 'truss_setting',    csi_division: '06 17 53', estimated_duration_days: 2, title: 'Set roof trusses & header beams on columns' },
  { sort_order: 24, phase: 'framing',     trade_type: 'framing',    csi_division: '06 11 00', estimated_duration_days: 2, title: 'Install roof purlins' },
  { sort_order: 25, phase: 'framing',     trade_type: 'framing',    csi_division: '06 11 00', estimated_duration_days: 1, title: 'Knee bracing & diaphragm bracing' },
  { sort_order: 26, phase: 'framing',     trade_type: 'framing',    csi_division: '08 36 00', estimated_duration_days: 1, title: 'Frame overhead & entry door openings' },

  // ─── Roofing (metal) ─────────────────────────────────────────────────────────
  { sort_order: 30, phase: 'roofing',     trade_type: 'roofing',    csi_division: '07 41 13', estimated_duration_days: 2, title: 'Install metal roof panels' },
  { sort_order: 31, phase: 'roofing',     trade_type: 'roofing',    csi_division: '07 71 00', estimated_duration_days: 1, title: 'Ridge cap, closures & roof trim' },
  { sort_order: 32, phase: 'roofing',     trade_type: 'gutters',    csi_division: '07 71 23', estimated_duration_days: 1, title: 'Gutters & downspouts' },

  // ─── Exterior finishes (metal cladding + doors) ──────────────────────────────
  { sort_order: 40, phase: 'finishes_exterior', trade_type: 'siding', csi_division: '07 42 13', estimated_duration_days: 3, title: 'Install metal wall panels' },
  { sort_order: 41, phase: 'finishes_exterior', trade_type: 'sheet_metal_flashing', csi_division: '07 62 00', estimated_duration_days: 1, title: 'Corner, base & eave trim' },
  { sort_order: 42, phase: 'finishes_exterior', trade_type: 'overhead_doors', csi_division: '08 36 00', estimated_duration_days: 1, title: 'Install overhead / sliding doors' },
  { sort_order: 43, phase: 'finishes_exterior', trade_type: 'windows', csi_division: '08 50 00', estimated_duration_days: 1, title: 'Install entry / man doors & windows' },

  // ─── Rough MEP (if conditioned / powered) ────────────────────────────────────
  { sort_order: 50, phase: 'rough_in',    trade_type: 'electrical', csi_division: '26 05 00', estimated_duration_days: 2, title: 'Service entrance & panel' },
  { sort_order: 51, phase: 'rough_in',    trade_type: 'electrical', csi_division: '26 27 26', estimated_duration_days: 2, title: 'Lighting & receptacle rough-in' },

  // ─── Insulation (optional) ───────────────────────────────────────────────────
  { sort_order: 60, phase: 'insulation',  trade_type: 'insulation', csi_division: '07 21 00', estimated_duration_days: 2, title: 'Roof & wall insulation (banded / batt)' },

  // ─── Slab ────────────────────────────────────────────────────────────────────
  { sort_order: 70, phase: 'finishes_interior', trade_type: 'concrete', csi_division: '03 30 00', estimated_duration_days: 2, title: 'Interior concrete slab: granular fill, vapor barrier & pour' },

  // ─── Inspections ───────────────────────────────────────────────────────────
  { sort_order: 80, phase: 'inspections', trade_type: 'general',    csi_division: '01 45 00', estimated_duration_days: 1, title: 'Footing / column inspection' },
  { sort_order: 81, phase: 'inspections', trade_type: 'general',    csi_division: '01 45 00', estimated_duration_days: 1, title: 'Framing inspection' },
  { sort_order: 82, phase: 'inspections', trade_type: 'general',    csi_division: '01 45 00', estimated_duration_days: 1, title: 'Final building inspection' },

  // ─── Site Work / Closeout ────────────────────────────────────────────────────
  { sort_order: 90, phase: 'sitework',    trade_type: 'landscaping',      csi_division: '32 90 00', estimated_duration_days: 2, title: 'Final grading, aprons & site restoration' },
  { sort_order: 91, phase: 'punch',       trade_type: 'general',    csi_division: '01 77 00', estimated_duration_days: 1, title: 'Punch list & closeout' },
];
