// web/src/lib/colors.ts — canonical JS color values for consumers that need raw
// values (reactflow node styles, inline-style chips) rather than Tailwind tokens.
// Status/brand/neutral tokens live in tailwind.config.ts; these are the two scales
// that need JS values on web. See DESIGN.md §2.4 (severity) and §2.5 (trade).

// ---------------------------------------------------------------------------
// Incident severity — DESIGN.md §2.4.
// Mirrors SEVERITY in mobile/src/lib/theme.ts (hexes must stay identical).
// Ordinal gray→amber→orange→red→dark-red; solid chips (white-on-solid).
// ---------------------------------------------------------------------------
export const SEVERITY: Record<string, string> = {
  near_miss: '#6b7280',
  first_aid: '#d97706',
  recordable: '#ea580c',
  lost_time: '#dc2626',
  fatality: '#7f1d1d',
};

// ---------------------------------------------------------------------------
// Trade colors — DESIGN.md §2.5. Web-only (mobile has no trade-color UI).
// TRADE_COLORS (hex) is CANONICAL — used for reactflow nodes + inline chips.
// ---------------------------------------------------------------------------
export const TRADE_COLORS: Record<string, string> = {
  general: '#64748b', civil: '#a16207', structural: '#7c3aed', concrete: '#6b7280',
  framing: '#b45309', roofing: '#dc2626', architectural: '#0891b2', electrical: '#eab308',
  plumbing: '#2563eb', hvac: '#0d9488', insulation: '#db2777', drywall: '#9333ea',
  finishes: '#16a34a',
  // T-64 taxonomy trades (Doc 21) — family hues: sitework greens/browns, structural
  // violets/oranges, envelope reds, electrical yellows, plumbing blues, mechanical teals,
  // interior pinks/greens.
  surveying: '#84cc16', excavation: '#a16207', demolition: '#78716c', erosion_control: '#4d7c0f',
  site_utilities: '#0f766e', deep_foundations: '#57534e', landscaping: '#15803d',
  asphalt_paving: '#525252', concrete_flatwork: '#9ca3af', pavement_marking: '#a3a3a3',
  rebar: '#71717a', waterproofing: '#0e7490', masonry: '#9f1239',
  truss_setting: '#ea580c', structural_steel: '#6d28d9', metal_decking: '#8b5cf6',
  metal_stud_framing: '#f97316', post_frame: '#c2410c',
  siding: '#be123c', stucco_eifs: '#be185d', gutters: '#ef4444', sheet_metal_flashing: '#b91c1c',
  air_barrier: '#f59e0b', curtain_wall: '#4f46e5', glazing: '#6366f1', windows: '#818cf8',
  exterior_doors: '#a78bfa', overhead_doors: '#94a3b8', skylights: '#e11d48',
  low_voltage: '#ca8a04', fire_alarm: '#f43f5e', security_access: '#fb923c',
  fire_sprinkler: '#1d4ed8', process_piping: '#1e40af', gas_piping: '#3b82f6',
  controls_bms: '#0891b2', test_balance: '#06b6d4', commissioning_agent: '#64748b',
  painting: '#ec4899', tile: '#f472b6', cabinetry: '#d946ef', millwork: '#c026d3',
  countertops: '#a21caf', finish_carpentry: '#fb7185', doors_hardware: '#fda4af',
  acoustical_ceilings: '#22d3ee', toilet_partitions: '#93c5fd',
  flooring_carpet: '#10b981', flooring_resilient: '#059669', flooring_epoxy: '#047857',
  final_clean: '#94a3b8',
};

// Tailwind badge-class variant used on the blueprint review page.
// Each hue is the nearest Tailwind family to the canonical TRADE_COLORS hex.
// structural=violet / drywall=purple are kept distinct (both were 'purple') —
// canonical #7c3aed is violet, #9333ea is purple.
export const TRADE_BADGE_CLASSES: Record<string, string> = {
  electrical: 'bg-yellow-100 text-yellow-800',   // #eab308
  plumbing:   'bg-blue-100 text-blue-800',       // #2563eb
  hvac:       'bg-teal-100 text-teal-800',        // #0d9488
  framing:    'bg-orange-100 text-orange-800',   // #b45309
  concrete:   'bg-gray-100 text-gray-800',       // #6b7280
  roofing:    'bg-red-100 text-red-800',         // #dc2626
  structural: 'bg-violet-100 text-violet-800',    // #7c3aed
  civil:      'bg-amber-100 text-amber-800',      // #a16207
  finishes:   'bg-green-100 text-green-800',      // #16a34a
  general:    'bg-slate-100 text-slate-800',     // #64748b
  insulation: 'bg-pink-100 text-pink-800',        // #db2777
  drywall:    'bg-purple-100 text-purple-800',    // #9333ea
  architectural: 'bg-cyan-100 text-cyan-800',     // #0891b2
  // T-64 taxonomy trades — nearest Tailwind family per canonical hex.
  surveying: 'bg-lime-100 text-lime-800', excavation: 'bg-amber-100 text-amber-800',
  demolition: 'bg-stone-100 text-stone-800', erosion_control: 'bg-green-100 text-green-800',
  site_utilities: 'bg-teal-100 text-teal-800', deep_foundations: 'bg-stone-100 text-stone-700',
  landscaping: 'bg-emerald-100 text-emerald-800', asphalt_paving: 'bg-neutral-100 text-neutral-800',
  concrete_flatwork: 'bg-gray-100 text-gray-700', pavement_marking: 'bg-neutral-100 text-neutral-700',
  rebar: 'bg-zinc-100 text-zinc-800', waterproofing: 'bg-cyan-100 text-cyan-900',
  masonry: 'bg-rose-100 text-rose-900', truss_setting: 'bg-orange-100 text-orange-700',
  structural_steel: 'bg-violet-100 text-violet-700', metal_decking: 'bg-violet-100 text-violet-600',
  metal_stud_framing: 'bg-orange-100 text-orange-600', post_frame: 'bg-orange-100 text-orange-900',
  siding: 'bg-rose-100 text-rose-800', stucco_eifs: 'bg-pink-100 text-pink-900',
  gutters: 'bg-red-100 text-red-700', sheet_metal_flashing: 'bg-red-100 text-red-900',
  air_barrier: 'bg-amber-100 text-amber-700', curtain_wall: 'bg-indigo-100 text-indigo-700',
  glazing: 'bg-indigo-100 text-indigo-800', windows: 'bg-indigo-100 text-indigo-600',
  exterior_doors: 'bg-violet-100 text-violet-500', overhead_doors: 'bg-slate-100 text-slate-700',
  skylights: 'bg-rose-100 text-rose-700', low_voltage: 'bg-yellow-100 text-yellow-700',
  fire_alarm: 'bg-rose-100 text-rose-800', security_access: 'bg-orange-100 text-orange-500',
  fire_sprinkler: 'bg-blue-100 text-blue-900', process_piping: 'bg-blue-100 text-blue-700',
  gas_piping: 'bg-blue-100 text-blue-600', controls_bms: 'bg-cyan-100 text-cyan-700',
  test_balance: 'bg-cyan-100 text-cyan-600', commissioning_agent: 'bg-slate-100 text-slate-600',
  painting: 'bg-pink-100 text-pink-800', tile: 'bg-pink-100 text-pink-700',
  cabinetry: 'bg-fuchsia-100 text-fuchsia-800', millwork: 'bg-fuchsia-100 text-fuchsia-700',
  countertops: 'bg-fuchsia-100 text-fuchsia-900', finish_carpentry: 'bg-rose-100 text-rose-600',
  doors_hardware: 'bg-rose-100 text-rose-500', acoustical_ceilings: 'bg-cyan-100 text-cyan-800',
  toilet_partitions: 'bg-blue-100 text-blue-500', flooring_carpet: 'bg-emerald-100 text-emerald-700',
  flooring_resilient: 'bg-emerald-100 text-emerald-800', flooring_epoxy: 'bg-emerald-100 text-emerald-900',
  final_clean: 'bg-slate-100 text-slate-700',
};
