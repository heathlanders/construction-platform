// blueprint-pdf/build-tasks.ts — Merge template baseline with PDF extraction.
// Returns enhanced TemplateTask[] augmented from extracted schedules + flags.

import { getTemplate } from '../blueprint-templates/index.js';
import { packComponents } from '../trades/packs/runtime.js';
import type { TemplateTask, BuildingType } from '../blueprint-templates/types.js';
import type { SheetExtractedData } from './parse-sheets.js';
import { voteTitleBlock, type TitleBlockInfo } from './title-block.js';

export interface AggregatedExtraction {
  // Combined flags across all sheets (OR semantics)
  flags: SheetExtractedData['flags'];
  // Combined schedules
  panels: NonNullable<SheetExtractedData['schedules']['panels']>;
  windows: NonNullable<SheetExtractedData['schedules']['windows']>;
  doors: NonNullable<SheetExtractedData['schedules']['doors']>;
  rooms: NonNullable<SheetExtractedData['schedules']['rooms']>;
  fixture_types: Set<string>;
  // Construction components detected by keyword (OR across all sheets)
  components: Set<string>;
  callouts: string[];
  // Title block (drafter / builder / location), voted across all sheets
  title_block: TitleBlockInfo;
}

/**
 * Aggregate per-sheet parses into a single extraction summary.
 */
export function aggregateExtractions(perSheet: SheetExtractedData[]): AggregatedExtraction {
  const agg: AggregatedExtraction = {
    flags: {
      has_solar_ready: false, has_hers_verification: false, has_title24: false,
      has_calgreen: false, has_wildfire_zone: false, has_seismic_design: false,
      seismic_category: null, has_ess: false, has_propane_gas: false, has_natural_gas: false,
      has_exit_signage: false, has_accessibility: false,
    },
    panels: [],
    windows: [],
    doors: [],
    rooms: [],
    fixture_types: new Set<string>(),
    components: new Set<string>(),
    callouts: [],
    title_block: voteTitleBlock(perSheet.map((s) => s.title_block)),
  };

  const dedupePanels = new Set<number>();
  const dedupeWindows = new Set<string>();
  const dedupeDoors = new Set<string>();
  const dedupeRooms = new Set<string>();
  const dedupeCallouts = new Set<string>();

  for (const sheet of perSheet) {
    // OR-combine boolean flags
    for (const k of Object.keys(agg.flags) as Array<keyof typeof agg.flags>) {
      const v = sheet.flags[k];
      if (typeof v === 'boolean' && v) (agg.flags[k] as boolean) = true;
      if (k === 'seismic_category' && v && !agg.flags.seismic_category) {
        agg.flags.seismic_category = v as string;
      }
    }

    if (sheet.schedules.panels) {
      for (const p of sheet.schedules.panels) {
        if (p.amperage != null && !dedupePanels.has(p.amperage)) {
          dedupePanels.add(p.amperage);
          agg.panels.push(p);
        }
      }
    }
    if (sheet.schedules.windows) {
      for (const w of sheet.schedules.windows) {
        const key = `${w.mark}|${w.dimension}|${w.type}`;
        if (!dedupeWindows.has(key)) { dedupeWindows.add(key); agg.windows.push(w); }
      }
    }
    if (sheet.schedules.doors) {
      for (const d of sheet.schedules.doors) {
        const key = `${d.mark}|${d.dimension}|${d.type}`;
        if (!dedupeDoors.has(key)) { dedupeDoors.add(key); agg.doors.push(d); }
      }
    }
    if (sheet.schedules.rooms) {
      for (const r of sheet.schedules.rooms) {
        const key = r.name + '|' + (r.dimensions ?? '');
        if (!dedupeRooms.has(key)) { dedupeRooms.add(key); agg.rooms.push(r); }
      }
    }
    if (sheet.schedules.fixtures) {
      for (const f of sheet.schedules.fixtures) agg.fixture_types.add(f.type);
    }
    for (const c of sheet.components) agg.components.add(c);
    for (const c of sheet.raw_callouts) {
      if (!dedupeCallouts.has(c)) { dedupeCallouts.add(c); agg.callouts.push(c); }
    }
  }

  // Collapse bare "GARAGE" when a sized "N CAR GARAGE" was found on any sheet (same room).
  if (agg.rooms.some((r) => /CAR\s+GARAGE/.test(r.name))) {
    agg.rooms = agg.rooms.filter((r) => r.name !== 'GARAGE');
  }

  return agg;
}

// ─── Task augmentation ──────────────────────────────────────────────────────────
// Generate extraction-derived tasks. These ADD specificity to the generic template.

function makeTask(
  title: string,
  trade: TemplateTask['trade_type'],
  phase: TemplateTask['phase'],
  csi: string,
  days: number,
  sortOrder: number,
  description?: string,
): TemplateTask {
  return {
    title, description,
    trade_type: trade, phase,
    csi_division: csi,
    // estimated_duration_days is an INTEGER column — some augments use sub-day
    // estimates (e.g. 0.5 for anchor bolts); round up to whole days so the insert
    // never sends a fractional value to an integer column.
    estimated_duration_days: Math.max(1, Math.ceil(days)),
    sort_order: sortOrder,
  };
}

// Supersede map: when a component-driven augment fires, the more-specific augment
// REPLACES the generic baseline task(s) matching these patterns — otherwise the
// exact-title dedup misses near-duplicates (truss/footing/siding/insulation/anchor
// bolt/slab/metal-panel overlap) and the same scope gets emitted twice. Keyed by the
// component token (agg.components). Only patterns whose component actually fired are
// applied (returned in `supersedes`).
const COMPONENT_SUPERSEDES: Record<string, RegExp[]> = {
  concrete_footing:   [/form & pour footings/i],
  foundation_wall:    [/foundation walls?\s*\/\s*slab-on-grade/i],
  anchor_bolts:       [/anchor bolt/i],
  slab_on_grade:      [/slab-on-grade/i, /interior concrete slab/i],
  engineered_trusses: [/roof truss installation/i, /set roof trusses & header/i],
  batt_insulation:    [/wall & ceiling batt insulation/i, /roof & wall insulation/i],
  vinyl_siding:       [/siding & exterior cladding/i],
  metal_roofing:      [/install metal roof panels/i],
  metal_siding:       [/install metal wall panels/i],
  post_frame_columns: [/set post-frame columns \/ poles & plumb/i],
  overhead_door:      [/install overhead \/ sliding doors/i],
};

/**
 * Build extraction-derived tasks. These get APPENDED to the template baseline.
 * Sort-order bands: template tasks use their own low sort_order; permit inspection
 * milestones use 1000 + sequence_order (1001-1005); these extraction augments use
 * 2000+ — so they sort AFTER both the template tasks and the permit milestones.
 * Returns the baseline patterns superseded by whichever component augments actually
 * fired, so the caller can drop the generic baseline duplicates.
 */
function buildExtractionTasks(
  agg: AggregatedExtraction,
  stateCode: string | null,
): { tasks: TemplateTask[]; supersedes: RegExp[] } {
  const tasks: TemplateTask[] = [];
  const supersedes: RegExp[] = [];
  let order = 2000;
  // California-specific code wording (Title-24 / CalGreen / CBC) only applies in CA. A recessed-
  // light callout on a Wisconsin plan is NOT "per Title-24". Gate CA-worded task titles on the
  // project state OR on an actual CA-code flag the sheet text produced (has_title24/calgreen).
  const isCA = stateCode?.toUpperCase() === 'CA' || agg.flags.has_title24 || agg.flags.has_calgreen;

  // Electrical specifics
  if (agg.panels.length > 0) {
    const amps = agg.panels.map((p) => p.amperage).filter((a): a is number => a != null);
    const ampLabel = amps.length === 1 ? `${amps[0]}A` : amps.map((a) => `${a}A`).join(' + ');
    tasks.push(makeTask(
      `Service entrance ${ampLabel} panel + 30"×36" workspace per NEC 110.26`,
      'electrical', 'rough_in', '26 24 16', 1, order++,
      'Per electrical plan extracted from blueprint',
    ));
  }

  if (agg.fixture_types.has('duplex_outlet') || agg.fixture_types.has('gfci_outlet')) {
    const has_gfci = agg.fixture_types.has('gfci_outlet');
    tasks.push(makeTask(
      `Receptacle rough-in${has_gfci ? ' incl. GFCI at wet zones' : ''}`,
      'electrical', 'rough_in', '26 27 26', 2, order++,
    ));
  }

  if (agg.fixture_types.has('recessed_light') || agg.fixture_types.has('high_efficacy_light')) {
    tasks.push(makeTask(
      isCA ? 'High-efficacy lighting rough-in per Title-24' : 'Lighting rough-in',
      'electrical', 'rough_in', '26 51 00', 2, order++,
    ));
  }

  if (agg.fixture_types.has('smoke_detector') || agg.fixture_types.has('co_alarm')) {
    tasks.push(makeTask(
      'Smoke detector + CO alarm interconnected wiring',
      'electrical', 'rough_in', '28 31 00', 1, order++,
    ));
  }

  // Plumbing specifics
  if (agg.fixture_types.has('water_heater')) {
    tasks.push(makeTask(
      'Water heater install per manufacturer enclosure spec',
      'plumbing', 'rough_in', '22 33 00', 1, order++,
    ));
  }

  if (agg.fixture_types.has('garbage_disposal')) {
    tasks.push(makeTask(
      'Kitchen sink + disposal rough-in',
      'plumbing', 'rough_in', '22 11 00', 1, order++,
    ));
  }

  // HVAC specifics
  if (agg.fixture_types.has('fau')) {
    tasks.push(makeTask(
      'FAU (Forced Air Unit) set in attic + 22"×30" attic access',
      'hvac', 'rough_in', '23 81 00', 1, order++,
    ));
  }
  if (agg.fixture_types.has('dryer_vent')) {
    tasks.push(makeTask(
      'Dryer vent install — 4" dia per IRC M1502',
      'hvac', 'rough_in', '23 33 00', 0.5, order++,
    ));
  }

  // Doors / windows from schedule
  if (agg.windows.length > 0) {
    const desc = agg.windows.map((w) => `${w.mark}: ${w.dimension} ${w.type?.toLowerCase() ?? ''}`).join(', ');
    tasks.push(makeTask(
      `Window install — ${agg.windows.length} units per schedule`,
      'finishes', 'finishes_interior', '08 50 00', Math.max(1, Math.ceil(agg.windows.length / 4)), order++,
      desc,
    ));
  }
  if (agg.doors.length > 0) {
    const desc = agg.doors.map((d) => `${d.mark}: ${d.dimension} ${d.type?.toLowerCase() ?? ''}`).join(', ');
    tasks.push(makeTask(
      `Door install — ${agg.doors.length} units per schedule`,
      'finishes', 'finishes_interior', '08 14 00', Math.max(1, Math.ceil(agg.doors.length / 4)), order++,
      desc,
    ));
  }

  // California / code-driven flags
  if (agg.flags.has_solar_ready) {
    tasks.push(makeTask(
      'Solar Ready conduit + ESS pre-wiring per CalGreen',
      'electrical', 'rough_in', '26 09 00', 1, order++,
    ));
    tasks.push(makeTask(
      'Solar PV install on Solar Ready zone',
      'electrical', 'commissioning', '26 31 00', 2, order++,
    ));
  }

  if (agg.flags.has_hers_verification) {
    tasks.push(makeTask(
      'HERS verification testing — duct leakage + envelope',
      'general', 'commissioning', '01 91 00', 1, order++,
      'CF2R/CF3R forms registered with California-approved HERS provider',
    ));
  }

  if (agg.flags.has_title24) {
    tasks.push(makeTask(
      'CF2R / CF3R Title-24 forms + registry submission',
      'general', 'commissioning', '01 33 00', 0.5, order++,
    ));
  }

  if (agg.flags.has_wildfire_zone) {
    tasks.push(makeTask(
      'Wildfire-zone ignition-resistant material verification',
      'finishes', 'finishes_exterior', '07 31 00', 1, order++,
      'CBC Chapter 7A compliance — exterior cladding, eaves, vents',
    ));
  }

  if (agg.flags.has_ess) {
    tasks.push(makeTask(
      'Energy Storage System (ESS) installation prep',
      'electrical', 'rough_in', '26 33 00', 1, order++,
    ));
  }

  // Commercial specifics
  if (agg.flags.has_exit_signage) {
    tasks.push(makeTask(
      'Exit signage + emergency egress lighting on emergency power (CBC 1013)',
      'electrical', 'rough_in', '26 52 00', 1, order++,
    ));
  }

  if (agg.flags.has_accessibility) {
    tasks.push(makeTask(
      'ADA accessible route, ramps & parking compliance (CBC 11B)',
      'general', 'sitework', '01 35 00', 2, order++,
    ));
  }

  const commercialRooms = agg.rooms.filter((r) => r.area_sf != null);
  if (commercialRooms.length > 0) {
    const desc = commercialRooms.map((r) => `${r.name} (${r.area_sf} SF)`).join(', ');
    tasks.push(makeTask(
      `Interior tenant build-out — ${commercialRooms.length} program rooms per area schedule`,
      'drywall', 'finishes_interior', '09 20 00', Math.max(2, Math.ceil(commercialRooms.length / 3)), order++,
      desc,
    ));
  }

  // Residential room program (bare floor-plan labels, no area schedule) → finish scope.
  const residentialRooms = agg.rooms.filter((r) => r.area_sf == null);
  if (residentialRooms.length >= 3) {
    const names = residentialRooms.map((r) => r.name).join(', ');
    tasks.push(makeTask(
      `Interior finishes — ${residentialRooms.length} rooms per floor plan`,
      'finishes', 'finishes_interior', '09 20 00', Math.max(2, Math.ceil(residentialRooms.length / 3)), order++,
      names,
    ));
  }

  // ─── Component-driven structural / envelope tasks ─────────────────────────────
  // Detected from on-sheet callouts (OCR-friendly) rather than schedule tables.
  const C = agg.components;
  const comp = (
    key: string, title: string, trade: TemplateTask['trade_type'],
    phase: TemplateTask['phase'], csi: string, days: number, description?: string,
  ) => {
    if (!C.has(key)) return;
    tasks.push(makeTask(title, trade, phase, csi, days, order++, description));
    const sup = COMPONENT_SUPERSEDES[key];
    if (sup) supersedes.push(...sup);
  };

  // Foundation / concrete
  comp('concrete_footing', 'Footing layout, excavation & pour per foundation plan', 'concrete', 'foundation', '03 30 00', 2);
  comp('foundation_wall', 'Foundation wall — form, pour & strip', 'concrete', 'foundation', '03 30 00', 3);
  comp('anchor_bolts', 'Sill plate anchor bolt set per foundation plan', 'concrete', 'foundation', '03 15 00', 0.5);
  comp('slab_on_grade', 'Slab-on-grade: granular fill, vapor barrier, reinforce & pour', 'concrete', 'foundation', '03 30 00', 2);
  // Framing — engineered wood
  comp('floor_joists', 'Engineered floor joist / rim system install', 'framing', 'framing', '06 17 33', 2);
  comp('i_joists', 'I-joist (TJI) floor framing per layout', 'framing', 'framing', '06 17 33', 2);
  comp('lvl_beam', 'LVL / engineered beam set per structural plan', 'framing', 'framing', '06 17 33', 1);
  comp('wood_studs', 'Wall framing — dimensional lumber studs per plan', 'framing', 'framing', '06 11 00', 4);
  comp('engineered_trusses', 'Roof truss set & brace per engineered truss layout', 'framing', 'roofing', '06 17 53', 2);
  comp('roof_sheathing', 'Roof sheathing install w/ H-clips', 'framing', 'roofing', '06 16 00', 1);
  // Envelope / cladding
  comp('batt_insulation', 'Batt insulation install per R-value schedule', 'insulation', 'insulation', '07 21 00', 2);
  comp('vapor_barrier', 'Vapor barrier / air-seal install', 'insulation', 'insulation', '07 26 00', 1);
  comp('house_wrap', 'House wrap / weather-resistive barrier install', 'finishes', 'finishes_exterior', '07 25 00', 1);
  comp('vinyl_siding', 'Vinyl siding install', 'finishes', 'finishes_exterior', '07 46 33', 3);
  comp('egress_window', 'Egress window + window well install per IRC R310', 'finishes', 'finishes_exterior', '08 51 00', 1);
  // Post-frame / pole barn
  comp('post_frame_columns', 'Set post-frame columns / poles & embed per plan', 'framing', 'framing', '06 13 00', 2);
  comp('wall_girts', 'Install wall girts', 'framing', 'framing', '06 11 00', 2);
  comp('roof_purlins', 'Install roof purlins', 'framing', 'roofing', '06 11 00', 2);
  comp('metal_roofing', 'Metal roof panel install', 'roofing', 'roofing', '07 41 13', 2);
  comp('metal_siding', 'Metal wall panel install', 'finishes', 'finishes_exterior', '07 42 13', 2);
  comp('overhead_door', 'Overhead door install', 'finishes', 'finishes_exterior', '08 36 00', 1);
  // T-64 taxonomy trades (Doc 21) — tasks carry the taxonomy trade key so the build-out engine
  // dispatches its trade-specific recipe (masonry/stucco/asphalt → building branches;
  // cabinetry/tile/gutters → no-permit recipes).
  comp('masonry_veneer', 'Masonry / brick veneer install w/ flashing, weeps & anchors', 'masonry', 'finishes_exterior', '04 21 13', 3);
  comp('stucco_finish', 'Stucco / EIFS system over lath & WRB', 'stucco_eifs', 'finishes_exterior', '09 24 00', 4);
  comp('cabinetry', 'Cabinet / casework install per elevations', 'cabinetry', 'finishes_interior', '12 32 00', 2);
  comp('ceramic_tile', 'Tile install (floors/walls/wet areas) w/ waterproofing', 'tile', 'finishes_interior', '09 30 13', 3);
  comp('asphalt_paving', 'Asphalt paving — base prep, pave & compact', 'asphalt_paving', 'sitework', '32 12 16', 2);
  comp('gutters_downspouts', 'Gutters & downspouts install', 'gutters', 'finishes_exterior', '07 71 23', 1);
  // Trade Knowledge Pack callouts (Doc 23 §5) — each carries its pack's taxonomy trade key.
  for (const pc of packComponents()) {
    comp(pc.token, pc.task.title, pc.pack_key as TemplateTask['trade_type'],
      pc.task.phase as TemplateTask['phase'], pc.task.csi, pc.task.days);
  }

  return { tasks, supersedes };
}

/**
 * Combine the building-type template with extraction-derived tasks.
 *
 * - Template provides the broad schedule (~47-60 tasks) — phase coverage, sequencing.
 * - Extraction adds project-specific tasks (panel sizing, window/door counts, code flags).
 * - Returns merged + deduped task array, ready for blueprint_proposed_tasks insert.
 */
export function buildTasksFromExtraction(
  buildingType: BuildingType,
  agg: AggregatedExtraction,
  stateCode: string | null = null,
): TemplateTask[] {
  const baseline = getTemplate(buildingType);
  const { tasks: augments, supersedes } = buildExtractionTasks(agg, stateCode);

  // Dedupe by case-insensitive title, and drop baseline tasks superseded by a
  // more-specific component augment (near-duplicates the exact-title dedup misses).
  const seen = new Set<string>();
  const merged: TemplateTask[] = [];

  for (const t of baseline) {
    if (supersedes.some((re) => re.test(t.title))) continue;  // replaced by an augment
    const key = t.title.toLowerCase().trim();
    if (!seen.has(key)) { seen.add(key); merged.push(t); }
  }
  for (const t of augments) {
    const key = t.title.toLowerCase().trim();
    if (!seen.has(key)) { seen.add(key); merged.push(t); }
  }

  return merged;
}
