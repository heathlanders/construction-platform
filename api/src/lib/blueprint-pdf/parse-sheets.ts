// blueprint-pdf/parse-sheets.ts — Per-sheet structured extraction
// Parses the raw text from extract.ts into typed schedules + flags.
// Patterns built against San Diego County PDS-670 ADU template; will need
// extension as we encounter other AHJ formats.

import { extractTitleBlock, mergeTitleBlock, EMPTY_TITLE_BLOCK, type TitleBlockInfo } from './title-block.js';
import { packComponents } from '../trades/packs/runtime.js';

export interface PanelInfo {
  amperage: number | null;
}

export interface ScheduleRow {
  mark: string | null;
  dimension: string | null;
  type: string | null;
  notes: string | null;
}

export interface RoomInfo {
  name: string;
  dimensions: string | null;
  area_sf?: number | null;   // commercial room+area schedule (e.g. "396 SF OFFICE 119")
}

export interface FixtureSummary {
  type: string;        // 'duplex_outlet', 'recessed_light', etc.
  count_estimate: number | null;     // null if not derivable from text
  notes: string | null;
}

export interface SheetExtractedData {
  // Detected discipline based on content (overrides sheet_number prefix when stronger)
  detected_discipline: string;

  // Schedules
  schedules: {
    windows?: ScheduleRow[];
    doors?: ScheduleRow[];
    rooms?: RoomInfo[];
    panels?: PanelInfo[];
    fixtures?: FixtureSummary[];
  };

  // Code-driven flags (drive task generation)
  flags: {
    has_solar_ready: boolean;
    has_hers_verification: boolean;
    has_title24: boolean;
    has_calgreen: boolean;
    has_wildfire_zone: boolean;
    has_seismic_design: boolean;
    seismic_category: string | null;
    has_ess: boolean;            // Energy Storage System
    has_propane_gas: boolean;
    has_natural_gas: boolean;
    // Commercial-building signals
    has_exit_signage: boolean;   // illuminated exit signs / egress lighting (CBC 1013)
    has_accessibility: boolean;  // ADA ramps / accessible route (CBC 11B)
  };

  // Construction components detected by keyword (OCR-friendly; no rigid schedule format
  // required). Drives extraction-derived structural/envelope tasks. e.g. 'engineered_trusses',
  // 'i_joists', 'lvl_beam', 'concrete_footing', 'batt_insulation', 'vinyl_siding',
  // and post-frame: 'post_frame_columns', 'wall_girts', 'roof_purlins', 'metal_roofing'.
  components: string[];

  // Anything we picked up but didn't categorize — surface in review UI
  raw_callouts: string[];

  // Title-block / legend: drafter, builder, build location (voted cross-sheet downstream).
  title_block: TitleBlockInfo;
}

// Match dim like 6'-0" or 6'-0" x 4'-0" or 72" or 30"
const DIM_RE = /(\d+(?:'-?\d+)?\"?(?:\s*[xX]\s*\d+(?:'-?\d+)?\"?)?)/;
const DIM_PAIR_RE = /(\d+'-\d+\"|\d+\")\s*[xX]\s*(\d+'-\d+\"|\d+\")/;

// Discipline content detectors — keyword votes
const CONTENT_VOTES: Array<{ keywords: RegExp[]; discipline: string }> = [
  { discipline: 'electrical', keywords: [
    /\bELECTRICAL\s+(PLAN|LEGEND|PANEL|SCHEDULE)\b/i,
    /\b\d{2,4}\s*A(?:MP)?\s*(?:ELECTRICAL\s+)?PANEL\b/i,
    /\bRECESSED\s+LIGHT\b/i,
    /\bDUPLEX\s+OUTLET\b/i,
    /\bSMOKE\s+DETECTOR\b/i,
  ]},
  { discipline: 'plumbing', keywords: [
    /\bPLUMBING\s+(PLAN|FIXTURE|SCHEDULE)\b/i,
    /\bWATER\s+HEATER\b/i,
    /\bDWV\b/,
    /\bFIXTURE\s+SCHEDULE\b/i,
  ]},
  { discipline: 'mechanical', keywords: [
    /\b(HVAC|MECHANICAL)\s+PLAN\b/i,
    /\bFAU\b/,
    /\bDUCTWORK\b/i,
    /\bHEAT\s+PUMP\b/i,
  ]},
  { discipline: 'structural', keywords: [
    /\bFOUNDATION\s+PLAN\b/i,
    /\b(ROOF|FLOOR)\s+FRAMING\b/i,
    /\bTRUSS\s+(LAYOUT|SCHEDULE|PER)\b/i,
    /\bSHEAR\s+PANEL\b/i,
    /\bANCHOR\s+BOLT\b/i,
  ]},
  { discipline: 'civil', keywords: [
    /\bSITE\s+PLAN\b/i,
    /\bGRADING\b/i,
    /\bPERVIOUS\s+(ITEM|AREA|SURFACE)\b/i,
    /\bSILT\s+FENCE\b/i,
    /\bBMP\b/,
  ]},
  { discipline: 'architectural', keywords: [
    /\bFLOOR\s+PLAN\b/i,
    /\bDOOR\s+SCHEDULE\b/i,
    /\bWINDOW\s+SCHEDULE\b/i,
    /\bELEVATIONS?\b/i,
    /\bSECTION\s+(A-A|B-B|KEY\s+NOTES)\b/i,
  ]},
];

function detectContentDiscipline(text: string, fallback: string): string {
  let bestDiscipline = fallback;
  let bestScore = 0;
  for (const { discipline, keywords } of CONTENT_VOTES) {
    let score = 0;
    for (const kw of keywords) if (kw.test(text)) score++;
    if (score > bestScore) {
      bestScore = score;
      bestDiscipline = discipline;
    }
  }
  return bestScore >= 1 ? bestDiscipline : fallback;
}

// ─── Panel extraction (electrical) ──────────────────────────────────────────────
function extractPanels(text: string): PanelInfo[] {
  const panels: PanelInfo[] = [];
  const seen = new Set<number>();
  // Match "200 AMP ELECTRICAL PANEL" or "200A PANEL" or "200 AMP PANEL"
  const re = /(\d{2,4})\s*(?:A|AMP)\s*(?:ELECTRICAL\s+)?(?:MAIN\s+)?PANEL/gi;
  for (const m of text.matchAll(re)) {
    const amp = parseInt(m[1], 10);
    if (amp >= 60 && amp <= 4000 && !seen.has(amp)) {
      seen.add(amp);
      panels.push({ amperage: amp });
    }
  }
  return panels;
}

// ─── Window/Door schedule extraction (architectural) ────────────────────────────
// SD ADU pattern: "WINDOW SCHEDULE MARK DIMENSION TYPE TEMPERED NOTES A 6'-0" x 4'-0" SLIDING ..."
function extractScheduleRows(text: string, header: string): ScheduleRow[] {
  const upper = text.toUpperCase();
  const idx = upper.indexOf(header.toUpperCase());
  if (idx === -1) return [];

  // Capture ~600 chars after the header — enough for several rows
  const block = text.slice(idx, idx + 800);

  // Per-row pattern: single-letter or numeric mark, dimension pair, type word
  // Examples: "A 6'-0" x 4'-0" SLIDING", "1 3'-0" x 6'-8" SWINGING 1-3/8" SOLID CORE"
  const rowRe = /\b([A-Z0-9])\s*(\d+'-\d+\"|\d+\")\s*[xX]\s*(\d+'-\d+\"|\d+\")\s*(SLIDING|SWINGING|BI-?FOLD|FIXED|CASEMENT|AWNING|DOUBLE-?HUNG|SINGLE-?HUNG|FRENCH|POCKET|BARN)/gi;

  const rows: ScheduleRow[] = [];
  for (const m of block.matchAll(rowRe)) {
    rows.push({
      mark: m[1],
      dimension: `${m[2]} x ${m[3]}`,
      type: m[4].toUpperCase(),
      notes: null,
    });
  }
  return rows;
}

// ─── Room extraction (architectural floor plan) ─────────────────────────────────
// Pattern: "KITCHEN (10'-0" x 9'-6")"
function extractRooms(text: string): RoomInfo[] {
  const re = /\b(KITCHEN|DINING\s+ROOM|LIVING\s+ROOM|BEDROOM\s*#?\d?|BATH(?:ROOM)?|MASTER\s+BEDROOM|FAMILY\s+ROOM|OFFICE|LAUNDRY|GARAGE|FOYER|HALL|CLOSET|PANTRY|UTILITY)\s*\(([^)]+)\)/gi;
  const rooms: RoomInfo[] = [];
  for (const m of text.matchAll(re)) {
    rooms.push({
      name: m[1].trim(),
      dimensions: m[2].trim(),
    });
  }
  return rooms;
}

// ─── Commercial room+area schedule ──────────────────────────────────────────────
// Pattern: "396 SF OFFICE 119", "1319 SF STUDIO 103", "136 SF EQUIPMENT ROOM 114".
// Opportunistic: many CAD exports position these area labels as separate text runs
// that pdfjs does not emit in "<area> SF <name> <num>" order, so this may yield nothing
// on a given sheet. area_sf-gated downstream so it never affects residential output.
function extractCommercialRooms(text: string): RoomInfo[] {
  const re = /(\d{2,5})\s*SF\s+([A-Z][A-Z ]{2,24}?)\s+(\d{2,4})\b/g;
  const rooms: RoomInfo[] = [];
  for (const m of text.matchAll(re)) {
    const sf = parseInt(m[1], 10);
    if (sf < 50 || sf > 100000) continue;
    rooms.push({
      name: `${m[2].trim()} ${m[3]}`,
      dimensions: null,
      area_sf: sf,
    });
  }
  return rooms;
}

// ─── Bare room-label detection (OCR / floor-plan friendly) ──────────────────────
// Scanned/OCR'd residential plans label rooms in-place ("BEDROOM #1", "2 CAR GARAGE",
// "LIVING ROOM") with no parenthesized dimensions and no schedule table — so the
// dimension-gated extractRooms() above finds nothing. This pass detects the room
// LABEL by keyword (dimensions optional) and is building-type-agnostic.
const BARE_ROOM_PATTERNS: Array<{ re: RegExp; name: (m: RegExpMatchArray) => string }> = [
  { re: /\bBEDROOM\s*#?\s*(\d)\b/gi, name: (m) => `BEDROOM #${m[1]}` },
  { re: /\bMASTER\s+(?:BEDROOM|SUITE)\b/gi, name: () => 'MASTER BEDROOM' },
  { re: /\b(?:(\d)\s*[- ]?\s*CAR\s+)?GARAGE\b/gi, name: (m) => (m[1] ? `${m[1]} CAR GARAGE` : 'GARAGE') },
  { re: /\bMASTER\s+BATH(?:ROOM)?\b/gi, name: () => 'MASTER BATH' },
  { re: /\b(?:FUTURE\s+)?BATH(?:ROOM)?\b/gi, name: (m) => (/FUTURE/i.test(m[0]) ? 'FUTURE BATH' : 'BATH') },
  { re: /\bKITCHEN\b/gi, name: () => 'KITCHEN' },
  { re: /\bLIVING\s+ROOM\b/gi, name: () => 'LIVING ROOM' },
  { re: /\bFAMILY\s+ROOM\b/gi, name: () => 'FAMILY ROOM' },
  { re: /\bDINING\s+(?:ROOM|AREA)\b/gi, name: () => 'DINING ROOM' },
  { re: /\bGREAT\s+ROOM\b/gi, name: () => 'GREAT ROOM' },
  { re: /\bLAUNDRY\b/gi, name: () => 'LAUNDRY' },
  { re: /\bMUD\s*ROOM\b/gi, name: () => 'MUDROOM' },
  { re: /\b(?:WALK[- ]?IN\s+)?CLOSET\b/gi, name: () => 'CLOSET' },
  { re: /\bPANTRY\b/gi, name: () => 'PANTRY' },
  { re: /\b(?:HOME\s+)?OFFICE\b/gi, name: () => 'OFFICE' },
  { re: /\bDEN\b/gi, name: () => 'DEN' },
  { re: /\bFOYER\b/gi, name: () => 'FOYER' },
  { re: /\bUTILITY\s+ROOM\b/gi, name: () => 'UTILITY' },
  { re: /\b(?:COVERED\s+)?PORCH\b/gi, name: () => 'PORCH' },
  { re: /\bDECK\b/gi, name: () => 'DECK' },
];

function extractBareRooms(text: string): RoomInfo[] {
  const seen = new Set<string>();
  const rooms: RoomInfo[] = [];
  for (const { re, name } of BARE_ROOM_PATTERNS) {
    for (const m of text.matchAll(re)) {
      const n = name(m);
      if (!seen.has(n)) {
        seen.add(n);
        rooms.push({ name: n, dimensions: null });
      }
    }
  }
  // Collapse bare "GARAGE" when a sized "N CAR GARAGE" was also found (same room).
  if (rooms.some((r) => /CAR\s+GARAGE/.test(r.name))) {
    return rooms.filter((r) => r.name !== 'GARAGE');
  }
  return rooms;
}

// ─── Construction component detection (OCR / annotation friendly) ────────────────
// Keyed on the component callouts that appear directly on framing / foundation /
// section sheets — no schedule table needed. Building-type-agnostic: residential,
// post-frame, and light-commercial wood construction all trip the relevant ones.
const CORE_COMPONENT_PATTERNS: Array<{ key: string; re: RegExp }> = [
  // Framing — light wood / engineered
  { key: 'engineered_trusses', re: /\bENGINEERED\s+TRUSS|\bTRUSS(?:ES)?\s*@|\bROOF\s+TRUSS/i },
  { key: 'i_joists', re: /\bTJI\b|\bI[- ]JOIST|\bTJ\s+FLOOR\s+JOIST/i },
  { key: 'lvl_beam', re: /\bLVL\b|\bMICRO[- ]?LAM|\bGLU[- ]?LAM|\bLAMINATED\s+VENEER/i },
  { key: 'floor_joists', re: /\bFLOOR\s+JOIST|\bRIM\s+JOIST|\bJOIST\s*@/i },
  { key: 'wood_studs', re: /\b2\s*[xX]\s*[46]\s+STUDS|\bSTUDS?\s*@\s*\d+\"?\s*O\.?C/i },
  { key: 'roof_sheathing', re: /\bROOF\s+SHEATHING|\bOSB\b|\bH[- ]?CLIPS?\b/i },
  // Foundation / concrete
  // FOOTING is a common word in general notes — require a structural qualifier or callout
  // context (dim/@/schedule/detail/PER) so a stray "footing" mention doesn't emit a pour task.
  { key: 'concrete_footing', re: /(?:CONC(?:RETE)?|SPREAD|STRIP|CONT(?:INUOUS)?|PAD|COLUMN|COL|WALL)\s+FOOTINGS?\b|\d["']?\s*(?:[xX]\s*\d[^A-Za-z]*)?FOOTINGS?\b|\bFOOTINGS?\s*(?:@|#|SCHEDULE|DETAIL|PER\b|SIZE|\d)/i },
  { key: 'anchor_bolts', re: /\bANCHOR\s+BOLT/i },
  { key: 'foundation_wall', re: /\bCONCRETE\s+WALL|\bFOUNDATION\s+WALL|\bPOURED\s+WALL/i },
  // Bare "SLAB" fires on unrelated notes — require concrete/on-grade/granular context.
  { key: 'slab_on_grade', re: /\bSLAB[- ]ON[- ]GRADE\b|\bCONCRETE\s+(?:FLOOR|SLAB)\b|\bGRANULAR\s+FILL\b|\b\d+\"\s*SLAB\b/i },
  // Envelope / insulation / cladding
  { key: 'batt_insulation', re: /\bR-?\s?\d{1,2}\s+INSULATION|\bBATT\s+INSULATION|\bINSULATION\b/i },
  { key: 'vapor_barrier', re: /\bVAPOR\s+BARRIER|\bMIL\s+VAPOR/i },
  { key: 'house_wrap', re: /\bHOUSE\s+WRAP|\bWEATHER[- ]RESIST|\bWRB\b/i },
  { key: 'vinyl_siding', re: /\bVINYL\s+SIDING/i },
  // Was bare \bEGRESS\b — falsely fired on "EGRESS LIGHTING" (an electrical note) and emitted
  // an egress-window task. Require an actual window/well context.
  { key: 'egress_window', re: /\bEGRESS\s+WINDOW|\bWINDOW\s+WELL|\bEGRESS\s+WELL/i },
  // Post-frame / pole barn
  { key: 'post_frame_columns', re: /\bPOST[- ]FRAME|\bPOLE\s+BARN|\bGLU[- ]?LAM\s+COLUMN|\bNAIL[- ]?LAM\s+POST|\b6\s*[xX]\s*6\s+POST/i },
  { key: 'wall_girts', re: /\bGIRT/i },
  { key: 'roof_purlins', re: /\bPURLIN/i },
  { key: 'metal_roofing', re: /\bMETAL\s+ROOF|\bSTANDING\s+SEAM|\bSTEEL\s+ROOF/i },
  { key: 'metal_siding', re: /\bMETAL\s+SIDING|\bSTEEL\s+SIDING|\bMETAL\s+WALL\s+PANEL/i },
  { key: 'overhead_door', re: /\bOVERHEAD\s+DOOR|\bOH\s+DOOR|\bGARAGE\s+DOOR/i },
  // T-64 taxonomy trades (Doc 21) — additive, building-type-agnostic.
  // Bare MASONRY/CABINET fire on general notes ("masonry contractor", "panelboard cabinet") —
  // require a wall/veneer/unit or kitchen/casework context.
  { key: 'masonry_veneer', re: /\bBRICK\s+VENEER|\bSTONE\s+VENEER|\bCMU\b|\bCONCRETE\s+MASONRY|\bMASONRY\s+(?:WALL|VENEER|UNIT)/i },
  { key: 'stucco_finish', re: /\bSTUCCO\b|\bEIFS\b/i },
  { key: 'cabinetry', re: /\bKITCHEN\s+CABINET|\bBASE\s+CABINET|\bWALL\s+CABINET|\bUPPER\s+CABINET|\bCABINETRY\b|\bCASEWORK\b/i },
  { key: 'ceramic_tile', re: /\bCERAMIC\s+TILE|\bPORCELAIN\s+TILE|\bTILE\s+(?:SHOWER|SURROUND|BACKSPLASH|FLOOR)/i },
  { key: 'asphalt_paving', re: /\bASPHALT\s+PAV|\bBITUMINOUS\s+PAV|\bAC\s+PAVING|\bHOT[- ]MIX\s+ASPHALT/i },
  { key: 'gutters_downspouts', re: /\bGUTTERS?\b|\bDOWNSPOUT/i },
];

// Canonical component vocabulary — the single source of truth for component tokens across the
// extraction pipeline AND the Build-Out Engine (task-buildout/facts.ts fallback must only emit
// tokens in this set, and engine recipes must only branch on tokens in this set). Exported so a
// dead branch (e.g. a token no extractor produces) is a detectable divergence, not silent drift.
export const CORE_COMPONENT_TOKENS: readonly string[] = CORE_COMPONENT_PATTERNS.map((p) => p.key);

// Trade Knowledge Pack callouts (Doc 23 §5) are appended after the built-in detectors.
const PACK_COMPONENTS = packComponents();
export const COMPONENT_PATTERNS: ReadonlyArray<{ key: string; re: RegExp }> = [
  ...CORE_COMPONENT_PATTERNS,
  ...PACK_COMPONENTS.map((c) => ({ key: c.token, re: new RegExp(c.re, 'i') })),
];
export const COMPONENT_TOKENS: readonly string[] = COMPONENT_PATTERNS.map((p) => p.key);

/**
 * Tokens offered to the vision model: the built-in set + only the pack tokens that opt in with a
 * `vision_hint`, capped so the prompt stays small (slow local GPU — see Blueprint_Intelligence §Vision).
 */
export const VISION_TOKEN_CAP = 120;
export const VISION_COMPONENT_TOKENS: readonly string[] = [
  ...CORE_COMPONENT_TOKENS,
  ...PACK_COMPONENTS.filter((c) => c.vision_hint).map((c) => c.token),
].slice(0, VISION_TOKEN_CAP);

function extractComponents(text: string): string[] {
  const found: string[] = [];
  for (const { key, re } of COMPONENT_PATTERNS) {
    if (re.test(text)) found.push(key);
  }
  return found;
}

// ─── Code flag detection ────────────────────────────────────────────────────────
function extractFlags(text: string): SheetExtractedData['flags'] {
  const upper = text.toUpperCase();

  let seismicCategory: string | null = null;
  const seismicMatch = upper.match(/SEISMIC\s+DESIGN\s+CATEGORY[:\s]+([A-F][12]?)/);
  if (seismicMatch) seismicCategory = seismicMatch[1];

  return {
    has_solar_ready: /SOLAR\s+READY/.test(upper) || /DEDICATED\s+SOLAR\s+ZONE/.test(upper),
    has_hers_verification: /HERS\s+VERIFICATION/.test(upper) || /HERS\s+PROVIDER/.test(upper),
    has_title24: /TITLE[-\s]?24/.test(upper) || /CF[123]R/.test(upper),
    has_calgreen: /CALGREEN/.test(upper) || /CAL\s+GREEN/.test(upper),
    has_wildfire_zone: /WILDFIRE\s+ZONE/.test(upper) || /IGNITION[-\s]RESISTANT/.test(upper) || /CHAPTER\s+7A/.test(upper),
    has_seismic_design: /SEISMIC\s+DESIGN\s+CATEGORY/.test(upper),
    seismic_category: seismicCategory,
    has_ess: /ENERGY\s+STORAGE\s+SYSTEM/.test(upper) || /\bESS\b/.test(upper),
    has_propane_gas: /\bPROPANE\b/.test(upper),
    has_natural_gas: /NATURAL\s+GAS/.test(upper),
    has_exit_signage: /EXIT\s+SIGN/.test(upper),
    has_accessibility: /\bADA\s+RAMP\b/.test(upper) || /ACCESSIBLE\s+(?:ROUTE|PARKING|STALL|ENTRANCE)/.test(upper) || /CBC\s+11B/.test(upper),
  };
}

// ─── Fixture symbol mentions ────────────────────────────────────────────────────
// Text-only path can detect SYMBOL DEFINITIONS in legend, not COUNTS.
// We surface "this sheet defines X symbol" so build-tasks knows what trades are present.
const FIXTURE_CHECKS: Array<[string, RegExp]> = [
  ['duplex_outlet', /DUPLEX\s+OUTLET/],
  ['gfci_outlet', /\bGFCI\b/],
  ['recessed_light', /RECESSED\s+LIGHT/],
  ['high_efficacy_light', /HIGH[-\s]EFFICACY/],
  ['smoke_detector', /SMOKE\s+DETECTOR/],
  ['co_alarm', /(CARBON\s+MONOXIDE|CO\s+ALARM)/],
  ['fan_light_combo', /FAN.{0,5}LIGHT.{0,5}COMBO/],
  ['vacancy_sensor', /VACANCY\s+SENSOR/],
  ['garbage_disposal', /GARBAGE\s+DISPOSAL/],
  ['dryer_vent', /DRYER\s+VENT|4\"\s*DIA\s*DRYER/],
  ['water_heater', /WATER\s+HEATER/],
  ['fau', /\bFAU\b/],
];

// Canonical fixture vocabulary — same contract as COMPONENT_TOKENS below: the single source of
// truth for fixture tokens across the extraction pipeline AND the vision path (vision.ts builds
// its prompt list and validator from this, so prompt and pipeline can never drift).
export const FIXTURE_TOKENS: readonly string[] = FIXTURE_CHECKS.map(([type]) => type);

function extractFixtureMentions(text: string): FixtureSummary[] {
  const upper = text.toUpperCase();
  const fixtures: FixtureSummary[] = [];
  for (const [type, re] of FIXTURE_CHECKS) {
    if (re.test(upper)) {
      fixtures.push({ type, count_estimate: null, notes: 'symbol present in legend' });
    }
  }
  return fixtures;
}

// ─── Main entry ─────────────────────────────────────────────────────────────────

export function parseSheetText(
  fallbackDiscipline: string,
  text: string,
  titleBlockText?: string,
): SheetExtractedData {
  if (!text) {
    return {
      detected_discipline: fallbackDiscipline,
      schedules: {},
      flags: {
        has_solar_ready: false, has_hers_verification: false, has_title24: false,
        has_calgreen: false, has_wildfire_zone: false, has_seismic_design: false,
        seismic_category: null, has_ess: false, has_propane_gas: false, has_natural_gas: false,
        has_exit_signage: false, has_accessibility: false,
      },
      components: [],
      raw_callouts: [],
      title_block: { ...EMPTY_TITLE_BLOCK },
    };
  }

  const detected = detectContentDiscipline(text, fallbackDiscipline);

  const schedules: SheetExtractedData['schedules'] = {};
  const panels = extractPanels(text);
  if (panels.length) schedules.panels = panels;

  const windows = extractScheduleRows(text, 'WINDOW SCHEDULE');
  if (windows.length) schedules.windows = windows;

  const doors = extractScheduleRows(text, 'DOOR SCHEDULE');
  if (doors.length) schedules.doors = doors;

  // Dimensioned rooms first; bare-label rooms fill in what OCR/floor-plan labels miss
  // (dedupe so a room found both ways isn't double-counted).
  const rooms: RoomInfo[] = [...extractRooms(text), ...extractCommercialRooms(text)];
  const roomNames = new Set(rooms.map((r) => r.name.toUpperCase()));
  for (const r of extractBareRooms(text)) {
    if (!roomNames.has(r.name.toUpperCase())) { roomNames.add(r.name.toUpperCase()); rooms.push(r); }
  }
  if (rooms.length) schedules.rooms = rooms;

  const fixtures = extractFixtureMentions(text);
  if (fixtures.length) schedules.fixtures = fixtures;

  const components = extractComponents(text);

  const flags = extractFlags(text);

  // Raw callouts: capture other recognizable but uncategorized snippets
  const raw_callouts: string[] = [];
  const calloutPatterns: RegExp[] = [
    /WIND\s+SPEED[:\s]+\d+\s*MPH/i,
    /SOIL\s+(VERTICAL\s+)?BEARING\s+PRESSURE[:\s]+\d+\s*PSF/i,
    /ROOF\s+LIVE\s+LOAD[:\s]+\d+\s*PSF/i,
    /\d+\s*SF\s+DETACHED\s+DWELLING/i,
    // Wisconsin Uniform Dwelling Code (DSPS SPS 320-325) — confirms WI residential jurisdiction.
    // OCR commonly mangles "SPS" → "5PS"/"5FS"/"SFS"; accept those + bare "FIGURE 321.x" refs.
    /\b[5S][FP]S\s+3\d{2}(?:\.\d+)?/i,
    /\bFIGURE\s+3\d{2}\.\d+/i,
    // ICC model-code citations (national; building/residential)
    /\bIRC\s+[A-Z]?\d{3,4}/i,
    /\bIBC\s+\d{3,4}/i,
  ];
  for (const re of calloutPatterns) {
    const m = text.match(re);
    if (m) raw_callouts.push(m[0]);
  }

  return {
    detected_discipline: detected,
    schedules,
    flags,
    components,
    raw_callouts,
    // Prefer the high-DPI title-block crop (reads small ZIP/phone glyphs correctly);
    // fall back to the full-page text for any field the crop missed.
    title_block: titleBlockText
      ? mergeTitleBlock(extractTitleBlock(titleBlockText), extractTitleBlock(text))
      : extractTitleBlock(text),
  };
}
