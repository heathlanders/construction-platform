// blueprint-pdf/vision.ts — Local vision-model (Ollama) sheet analysis.
//
// AUGMENTATION layer, not a replacement: the deterministic text/OCR extractors remain the
// trusted baseline; this module asks a locally-hosted vision LLM (default Qwen2.5-VL 7B via
// Ollama on the same box — zero API cost, no data egress) to read what regex can't: schedule
// TABLES on scanned sheets, flags, components, and title-block fields. Output is constrained
// to the pipeline's fixed enum vocabularies (FIXTURE_TOKENS / COMPONENT_TOKENS) both in the
// prompt AND in the zod validator, so a hallucinated token can never reach build-tasks.
//
// Failure philosophy (mirrors file-scan-worker scanFile): env-gated; any failure — server
// down, timeout, malformed JSON, schema violation — returns null with a warn. The caller
// (blueprint-worker) proceeds with the parser-only result. Vision can only ever ADD.

import {
  VISION_COMPONENT_TOKENS,
  FIXTURE_TOKENS,
  type SheetExtractedData,
  type ScheduleRow,
  type RoomInfo,
  type PanelInfo,
} from './parse-sheets.js';
import type { TitleBlockInfo } from './title-block.js';
import { renderRegionPng } from './ocr.js';
import { z } from 'zod';

// ─── Env (module top, process.env.X ?? default convention) ─────────────────────

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? 'http://127.0.0.1:11434';
export const OLLAMA_VISION_MODEL = process.env.OLLAMA_VISION_MODEL ?? 'qwen2.5vl:7b';
const OLLAMA_KEEP_ALIVE = process.env.OLLAMA_KEEP_ALIVE ?? '10m';
// Per-sheet inference timeout. A 7B VLM on an older GPU (GTX 1070-class) runs 1–3+ min/sheet.
export const VISION_PAGE_TIMEOUT_MS = Number(process.env.VISION_PAGE_TIMEOUT_MS ?? 240_000);
// How many sheets of a set get vision analysis (selectVisionPages prioritizes).
export const VISION_MAX_PAGES = Number(process.env.VISION_MAX_PAGES ?? 12);
// Soft total budget — the worker stops (keeping partial augments) when exceeded. Must leave
// headroom under the blueprint.analyze queue expiry (3600s), which OCR also draws from.
export const VISION_TOTAL_BUDGET_MS = Number(process.env.VISION_TOTAL_BUDGET_MS ?? 1_500_000);
// Longest-side pixel target for the page render. Qwen2.5-VL is dynamic-resolution; ~1400px
// keeps the vision encoder + KV cache inside an 8GB card. Drop to 1024 if the host CPU-offloads.
export const VISION_MAX_PX = Number(process.env.VISION_MAX_PX ?? 1408);

/** Master gate — vision runs only when explicitly enabled. */
export function visionEnabled(): boolean {
  const v = (process.env.BLUEPRINT_VISION_ENABLED ?? '').toLowerCase();
  return v === '1' || v === 'true';
}

// ─── Output shape ───────────────────────────────────────────────────────────────

/** What the vision model contributes for one sheet — maps onto Partial<SheetExtractedData>. */
export interface VisionSheetData {
  detected_discipline?: string;
  schedules: SheetExtractedData['schedules'];
  flags: Partial<SheetExtractedData['flags']>;
  components: string[];                    // ⊆ COMPONENT_TOKENS (post-filtered)
  title_block: Partial<TitleBlockInfo>;
}

export interface VisionResult {
  data: VisionSheetData;
  model: string;
  duration_ms: number;
  /** Hallucinated enum tokens the validator stripped (provenance/debug). */
  tokens_stripped: number;
}

// ─── Prompt (built from the canonical token lists — cannot drift from the validator) ─

const DISCIPLINES = ['architectural', 'structural', 'electrical', 'plumbing', 'mechanical', 'civil'] as const;
const FLAG_KEYS = [
  'has_solar_ready', 'has_hers_verification', 'has_title24', 'has_calgreen',
  'has_wildfire_zone', 'has_seismic_design', 'has_ess', 'has_propane_gas',
  'has_natural_gas', 'has_exit_signage', 'has_accessibility',
] as const;

const PROMPT = `You are extracting structured data from ONE construction blueprint sheet image.
Return ONLY JSON matching the schema. If something is not clearly visible on this sheet, omit
the field or use null — NEVER guess or infer from what "should" be on a sheet like this.

- discipline: one of ${DISCIPLINES.join('|')}
- windows / doors: rows read from an explicit WINDOW SCHEDULE / DOOR SCHEDULE table only
  (mark like "A" or "101", dimension like 6'-0" x 4'-0", type like SLIDING/FIXED/SWINGING, notes).
  If there is no schedule table on this sheet, omit.
- rooms: names printed INSIDE a room on a floor plan (name, printed dimensions if any). Do NOT
  return orientation/view labels (FRONT, BACK, NORTH/SOUTH/EAST/WEST, ENDWALL, SIDEWALL),
  sheet/drawing titles, section/detail/elevation callouts, or schedule/legend headers as rooms.
- panels: electrical panel amperage numbers, e.g. 200 for a "200A PANEL"
- fixtures: ONLY these tokens, when that fixture symbol/legend appears: ${FIXTURE_TOKENS.join(', ')}
- components: ONLY these tokens, when that exact component is labelled/called-out/legended on THIS
  sheet: ${VISION_COMPONENT_TOKENS.join(', ')}. Do NOT infer a typical framing system — a post-frame /
  pole barn has NO trusses/joists/studs unless drawn. Omit anything you do not literally see.
- title_block: from the title block (usually bottom-right corner): sheet_number, sheet_title,
  drafter firm, builder/owner, street_address, lot_number, city, state (2 letters), zip (5 digits)

Do NOT report flags/seismic — those are handled elsewhere.`;

// Hand-written JSON Schema passed as Ollama's `format` (structured outputs). The zod schema
// below re-validates the reply regardless — this just steers generation.
const VISION_JSON_SCHEMA = {
  type: 'object',
  properties: {
    discipline: { type: ['string', 'null'] },
    windows: { type: 'array', items: { type: 'object', properties: {
      mark: { type: ['string', 'null'] }, dimension: { type: ['string', 'null'] },
      type: { type: ['string', 'null'] }, notes: { type: ['string', 'null'] } } } },
    doors: { type: 'array', items: { type: 'object', properties: {
      mark: { type: ['string', 'null'] }, dimension: { type: ['string', 'null'] },
      type: { type: ['string', 'null'] }, notes: { type: ['string', 'null'] } } } },
    rooms: { type: 'array', items: { type: 'object', properties: {
      name: { type: 'string' }, dimensions: { type: ['string', 'null'] } }, required: ['name'] } },
    panels: { type: 'array', items: { type: 'object', properties: {
      amperage: { type: 'number' } }, required: ['amperage'] } },
    fixtures: { type: 'array', items: { type: 'string' } },
    components: { type: 'array', items: { type: 'string' } },
    flags: { type: 'object' },
    seismic_category: { type: ['string', 'null'] },
    title_block: { type: 'object' },
  },
} as const;

// ─── Validation (strip, don't reject — one bad field must not kill the sheet) ──

const nullableStr = (max: number) => z.string().max(max).nullable().catch(null);

const scheduleRowZ = z.object({
  mark: nullableStr(8),
  dimension: nullableStr(40),
  type: nullableStr(24),
  notes: nullableStr(120),
});

const flagsZ = z.object(
  Object.fromEntries(FLAG_KEYS.map((k) => [k, z.boolean().catch(false)])) as Record<
    (typeof FLAG_KEYS)[number], z.ZodCatch<z.ZodBoolean>
  >,
).partial().catch({});

const visionResponseZ = z.object({
  discipline: z.enum(DISCIPLINES).nullish().catch(undefined),
  windows: z.array(scheduleRowZ).max(60).optional().catch(undefined),
  doors: z.array(scheduleRowZ).max(60).optional().catch(undefined),
  rooms: z.array(z.object({
    name: z.string().min(1).max(40),
    dimensions: nullableStr(30),
  })).max(80).optional().catch(undefined),
  panels: z.array(z.object({
    amperage: z.number().int().min(60).max(4000),
  })).max(10).optional().catch(undefined),
  fixtures: z.array(z.string()).max(40).optional().catch(undefined),
  components: z.array(z.string()).max(40).optional().catch(undefined),
  flags: flagsZ.optional(),
  seismic_category: z.string().regex(/^[A-F][12]?$/).nullish().catch(undefined),
  title_block: z.object({
    sheet_number: nullableStr(12),
    sheet_title: nullableStr(60),
    drafter: nullableStr(60),
    builder: nullableStr(60),
    street_address: nullableStr(80),
    lot_number: nullableStr(12),
    city: nullableStr(40),
    state: z.string().regex(/^[A-Za-z]{2}$/).nullable().catch(null),
    zip: z.string().regex(/^\d{5}$/).nullable().catch(null),
  }).partial().optional().catch(undefined),
}).strip();

const COMPONENT_SET = new Set(VISION_COMPONENT_TOKENS);
const FIXTURE_SET = new Set(FIXTURE_TOKENS);

// Precision guard: reject "rooms" that are really drawing elements or orientation/view labels the
// VLM over-eagerly returns (e.g. "VALENTINE CEILING", "WEST ENDWALL", "FRONT"). Conservative —
// only clear non-room words; real rooms (BEDROOM/KITCHEN/GARAGE…) pass.
const ROOM_STOPWORD =
  /\b(CEILING|ELEVATION|SECTION|DETAIL|SCHEDULE|LEGEND|TYPICAL|DIAGRAM|ENDWALL|SIDEWALL|NOTES?)\b/;
const ROOM_ORIENTATION_ONLY =
  /^(FRONT|BACK|REAR|LEFT|RIGHT|NORTH|SOUTH|EAST|WEST|NORTHEAST|NORTHWEST|SOUTHEAST|SOUTHWEST)$/;
function isRealRoom(name: string): boolean {
  const n = name.toUpperCase().trim();
  return !ROOM_STOPWORD.test(n) && !ROOM_ORIENTATION_ONLY.test(n);
}

// #1 Building-type steering: a POSITIVE, specific per-type cue (a 7B VLM follows "expect X, not Y"
// far better than a bare negative). The worker already knows building_type — pass it through.
// Only types that need steering are listed; others get the base prompt unchanged.
const BUILDING_TYPE_HINT: Record<string, string> = {
  pole_barn:
    'BUILDING TYPE: POST-FRAME / POLE BARN. Its structure is posts/columns, wall girts, roof ' +
    'purlins, and metal roofing/siding. It has NO engineered trusses, I-joists, LVL beams, or ' +
    'dimensional floor joists — do not report those unless one is unmistakably drawn and labelled ' +
    'on THIS sheet.',
};

// #2 Deterministic backstop: component tokens structurally incompatible with a building type are
// stripped from vision output even if the model returns them — the prompt hint alone does not fully
// suppress the model's stick-frame prior on graphic-heavy pole-barn scans. Scoped to the clearly
// incompatible engineered-lumber/truss tokens (wood_studs is NOT stripped — a pole barn can have
// interior partition studs).
const INCOMPATIBLE_COMPONENTS: Record<string, Set<string>> = {
  pole_barn: new Set(['engineered_trusses', 'i_joists', 'lvl_beam', 'floor_joists']),
};

function promptFor(buildingType?: string): string {
  const hint = buildingType ? BUILDING_TYPE_HINT[buildingType] : undefined;
  return hint ? `${PROMPT}\n\n${hint}` : PROMPT;
}

/** Drop schedule rows the model emitted with every field null (structured-output filler). */
function dropEmptyRows(rows: ScheduleRow[] | undefined): ScheduleRow[] | undefined {
  const kept = (rows ?? []).filter((r) => r.mark || r.dimension || r.type || r.notes);
  return kept.length ? kept : undefined;
}

function toVisionSheetData(raw: unknown, buildingType?: string): { data: VisionSheetData; tokens_stripped: number } {
  const parsed = visionResponseZ.parse(raw);

  const incompatible = buildingType ? INCOMPATIBLE_COMPONENTS[buildingType] : undefined;
  const fixturesIn = parsed.fixtures ?? [];
  const componentsIn = parsed.components ?? [];
  const fixtures = fixturesIn.filter((t) => FIXTURE_SET.has(t));
  const components = [...new Set(componentsIn.filter((t) => COMPONENT_SET.has(t) && !incompatible?.has(t)))];
  const tokens_stripped =
    (fixturesIn.length - fixtures.length) + (componentsIn.length - components.length);

  const schedules: SheetExtractedData['schedules'] = {};
  const windows = dropEmptyRows(parsed.windows);
  if (windows) schedules.windows = windows;
  const doors = dropEmptyRows(parsed.doors);
  if (doors) schedules.doors = doors;
  const roomList = (parsed.rooms ?? [])
    .filter((r) => isRealRoom(r.name))
    .map((r) => ({ name: r.name, dimensions: r.dimensions ?? null }));
  const rooms: RoomInfo[] | undefined = roomList.length ? roomList : undefined;
  if (rooms) schedules.rooms = rooms;
  const panels: PanelInfo[] | undefined = parsed.panels?.length
    ? [...new Set(parsed.panels.map((p) => p.amperage))].map((amperage) => ({ amperage }))
    : undefined;
  if (panels) schedules.panels = panels;
  if (fixtures.length) {
    schedules.fixtures = [...new Set(fixtures)].map((type) => ({
      type, count_estimate: null, notes: 'vision',
    }));
  }

  // Flags are NOT taken from vision. The measured prove-out (2026-07-21) found every vision-set
  // flag was a false positive (has_seismic_design on WI plans, has_title24 mis-set) and a wrong
  // flag injects bad downstream tasks. The deterministic parser owns flags (region-aware). Vision
  // contributes only visual extraction (schedules / fixtures / components / rooms / title-block).
  const flags: Partial<SheetExtractedData['flags']> = {};

  const tb = parsed.title_block;
  const title_block: Partial<TitleBlockInfo> = tb ? {
    ...(tb.drafter ? { architect_name: tb.drafter } : {}),
    ...(tb.builder ? { builder_name: tb.builder } : {}),
    ...(tb.street_address ? { street_address: tb.street_address } : {}),
    ...(tb.lot_number ? { lot_number: tb.lot_number } : {}),
    ...(tb.city ? { city: tb.city.toUpperCase() } : {}),
    ...(tb.state ? { state: tb.state.toUpperCase() } : {}),
    ...(tb.zip ? { zip: tb.zip } : {}),
  } : {};

  return {
    data: {
      ...(parsed.discipline ? { detected_discipline: parsed.discipline } : {}),
      schedules,
      flags,
      components,
      title_block,
    },
    tokens_stripped,
  };
}

// ─── Rendering ─────────────────────────────────────────────────────────────────

/**
 * Render a full page as a grayscale PNG sized for the vision encoder: DPI chosen so the
 * longest side ≈ maxPx (a 36" ARCH-D sheet lands ~40dpi; a letter sheet ~128dpi).
 */
export function renderPageForVision(
  mupdf: typeof import('mupdf'),
  page: import('mupdf').Page,
  maxPx: number = VISION_MAX_PX,
): Buffer {
  const b = page.getBounds();
  const longestPts = Math.max(b[2] - b[0], b[3] - b[1]);
  const dpi = Math.max(36, Math.min(200, Math.floor((maxPx * 72) / Math.max(1, longestPts))));
  return renderRegionPng(mupdf, page, dpi, 0, 0, 1, 1);
}

// ─── Ollama calls ──────────────────────────────────────────────────────────────

/** Cheap reachability probe — the worker calls this once per job before rendering anything. */
export async function checkOllamaHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      signal: AbortSignal.timeout(2_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Analyze one sheet PNG with the local vision model.
 * Returns null on ANY failure (unreachable, timeout, non-200, bad JSON, schema violation) —
 * logged as a warn, never thrown. The blueprint pipeline must degrade, not fail, on vision.
 */
export async function analyzeSheetPng(
  png: Buffer,
  opts?: { timeoutMs?: number; buildingType?: string },
): Promise<VisionResult | null> {
  const started = Date.now();
  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(opts?.timeoutMs ?? VISION_PAGE_TIMEOUT_MS),
      body: JSON.stringify({
        model: OLLAMA_VISION_MODEL,
        stream: false,
        keep_alive: OLLAMA_KEEP_ALIVE,
        format: VISION_JSON_SCHEMA,
        options: { temperature: 0, num_ctx: 8192 },
        messages: [{
          role: 'user',
          content: promptFor(opts?.buildingType),
          images: [png.toString('base64')],
        }],
      }),
    });
    if (!res.ok) {
      console.warn({ status: res.status }, 'vision: ollama non-200 — skipping sheet');
      return null;
    }
    const body = (await res.json()) as { message?: { content?: string } };
    const content = body?.message?.content;
    if (!content) {
      console.warn('vision: empty ollama response — skipping sheet');
      return null;
    }
    const { data, tokens_stripped } = toVisionSheetData(JSON.parse(content), opts?.buildingType);
    if (tokens_stripped > 0) {
      console.warn({ tokens_stripped }, 'vision: stripped unknown enum tokens from model output');
    }
    return { data, model: OLLAMA_VISION_MODEL, duration_ms: Date.now() - started, tokens_stripped };
  } catch (err) {
    console.warn({ err: (err as Error).message }, 'vision: sheet analysis failed — skipping');
    return null;
  }
}
