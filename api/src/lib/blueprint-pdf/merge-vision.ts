// blueprint-pdf/merge-vision.ts — Merge vision-model output into the parser baseline.
//
// Pure, no I/O (mirrors task-dependencies/rules.ts). The deterministic parser result is the
// TRUSTED baseline; vision only ever ADDS — it can set a flag the parser missed, contribute
// schedule rows the regex couldn't read, or fill a null title-block field. On any collision
// the parser value wins (deterministic regex beats VLM transcription). Per-sheet stats record
// exactly what vision contributed, summed by the worker into import_metadata.vision.added
// so a PM/debugger can always see the provenance.

import type { SheetExtractedData, ScheduleRow, RoomInfo } from './parse-sheets.js';
import type { ExtractedPage } from './extract.js';
import type { VisionSheetData } from './vision.js';

export interface VisionMergeStats {
  flags_set: string[];              // flags true ONLY because of vision
  components_added: string[];
  fixtures_added: string[];
  window_rows_added: number;
  door_rows_added: number;
  room_rows_added: number;
  panel_rows_added: number;
  title_block_fields_filled: string[];
}

export function emptyMergeStats(): VisionMergeStats {
  return {
    flags_set: [], components_added: [], fixtures_added: [],
    window_rows_added: 0, door_rows_added: 0, room_rows_added: 0, panel_rows_added: 0,
    title_block_fields_filled: [],
  };
}

/** Accumulate per-sheet stats into a running total (worker sums across sheets). */
export function accumulateMergeStats(total: VisionMergeStats, s: VisionMergeStats): void {
  total.flags_set = [...new Set([...total.flags_set, ...s.flags_set])];
  total.components_added = [...new Set([...total.components_added, ...s.components_added])];
  total.fixtures_added = [...new Set([...total.fixtures_added, ...s.fixtures_added])];
  total.window_rows_added += s.window_rows_added;
  total.door_rows_added += s.door_rows_added;
  total.room_rows_added += s.room_rows_added;
  total.panel_rows_added += s.panel_rows_added;
  total.title_block_fields_filled = [
    ...new Set([...total.title_block_fields_filled, ...s.title_block_fields_filled]),
  ];
}

// Dedup key for a schedule row: mark when present, else dimension|type. Matches the spirit of
// aggregateExtractions' cross-sheet dedup so merged rows stay consistent downstream.
function rowKey(r: ScheduleRow): string {
  return r.mark ? `M:${r.mark.toUpperCase().trim()}` : `DT:${r.dimension ?? ''}|${r.type ?? ''}`;
}

function mergeRows(
  parser: ScheduleRow[] | undefined,
  vision: ScheduleRow[] | undefined,
): { rows: ScheduleRow[] | undefined; added: number } {
  if (!vision?.length) return { rows: parser, added: 0 };
  const out = [...(parser ?? [])];
  const seen = new Set(out.map(rowKey));
  let added = 0;
  for (const r of vision) {
    const k = rowKey(r);
    if (seen.has(k)) continue;   // collision → parser row wins
    seen.add(k);
    out.push(r);
    added++;
  }
  return { rows: out.length ? out : undefined, added };
}

/**
 * Merge one sheet's vision output into its parser baseline. Parser wins every collision;
 * vision fills gaps. Returns the merged sheet plus stats of what vision uniquely added.
 */
export function mergeSheetExtraction(
  parser: SheetExtractedData,
  vision: VisionSheetData,
): { merged: SheetExtractedData; stats: VisionMergeStats } {
  const stats = emptyMergeStats();

  // 1. Flags — parser owns them; vision does NOT contribute flags. The measured prove-out
  //    (2026-07-21) found vision's flag guesses were false positives (has_seismic_design on WI,
  //    has_title24 mis-set), and a wrong flag injects bad downstream tasks. `stats.flags_set`
  //    therefore stays empty. (vision.flags is empty by construction — see toVisionSheetData.)
  const flags = parser.flags;

  // 2. Components — set union (vision already enum-filtered).
  const components = [...parser.components];
  for (const c of vision.components) {
    if (!components.includes(c)) { components.push(c); stats.components_added.push(c); }
  }

  // 3. Fixtures — union by type.
  const schedules: SheetExtractedData['schedules'] = { ...parser.schedules };
  if (vision.schedules.fixtures?.length) {
    const have = new Set((schedules.fixtures ?? []).map((f) => f.type));
    const added = vision.schedules.fixtures.filter((f) => !have.has(f.type));
    if (added.length) {
      schedules.fixtures = [...(schedules.fixtures ?? []), ...added];
      stats.fixtures_added.push(...added.map((f) => f.type));
    }
  }

  // 4. Windows / doors — union deduped by mark; parser row wins on collision.
  const w = mergeRows(schedules.windows, vision.schedules.windows);
  if (w.rows) schedules.windows = w.rows;
  stats.window_rows_added = w.added;
  const d = mergeRows(schedules.doors, vision.schedules.doors);
  if (d.rows) schedules.doors = d.rows;
  stats.door_rows_added = d.added;

  // 5. Rooms — union deduped by upper-cased name (same key aggregateExtractions uses).
  if (vision.schedules.rooms?.length) {
    const rooms: RoomInfo[] = [...(schedules.rooms ?? [])];
    const names = new Set(rooms.map((r) => r.name.toUpperCase()));
    for (const r of vision.schedules.rooms) {
      const key = r.name.toUpperCase();
      if (names.has(key)) continue;
      names.add(key);
      rooms.push(r);
      stats.room_rows_added++;
    }
    if (rooms.length) schedules.rooms = rooms;
  }

  // 6. Panels — union by amperage.
  if (vision.schedules.panels?.length) {
    const panels = [...(schedules.panels ?? [])];
    const amps = new Set(panels.map((p) => p.amperage));
    for (const p of vision.schedules.panels) {
      if (p.amperage !== null && amps.has(p.amperage)) continue;
      amps.add(p.amperage as number);
      panels.push(p);
      stats.panel_rows_added++;
    }
    if (panels.length) schedules.panels = panels;
  }

  // 7. Title block — vision fills ONLY fields the parser left null (the 450dpi OCR crop pass
  //    stays authoritative — it's tuned for exact glyph reads like ZIP digits).
  const title_block = { ...parser.title_block };
  for (const [key, val] of Object.entries(vision.title_block)) {
    const k = key as keyof typeof title_block;
    if (val && !title_block[k]) {
      title_block[k] = val as string;
      stats.title_block_fields_filled.push(key);
    }
  }

  // 8. Discipline — parser wins; vision fills only when the parser had nothing to vote on
  //    (empty-text sheets keep the page-default discipline with zero content signal).
  const merged: SheetExtractedData = {
    detected_discipline: parser.detected_discipline,
    schedules,
    flags,
    components,
    raw_callouts: parser.raw_callouts,
    title_block,
  };

  return { merged, stats };
}

// ─── Page selection ─────────────────────────────────────────────────────────────

// Discipline weights: where a vision read adds most task-generation signal.
const DISCIPLINE_WEIGHT: Record<string, number> = {
  architectural: 3, electrical: 3, plumbing: 3, structural: 3,
  mechanical: 2,
};

function parserYieldLow(sheet: SheetExtractedData): boolean {
  const scheduleRows =
    (sheet.schedules.windows?.length ?? 0) +
    (sheet.schedules.doors?.length ?? 0) +
    (sheet.schedules.panels?.length ?? 0) +
    (sheet.schedules.rooms?.length ?? 0);
  return scheduleRows === 0 && sheet.components.length < 2;
}

/**
 * Pick which pages get vision analysis (slow GPU → we can't afford every sheet of a big set).
 * Score = discipline weight + low-parser-yield bonus (+2: vision helps most where regex found
 * least) + first-page bonus (+1: title block). Returns ascending page indices, at most `max`.
 */
export function selectVisionPages(
  pages: Pick<ExtractedPage, 'page_number'>[],
  perSheet: SheetExtractedData[],
  max: number,
): number[] {
  if (max <= 0) return [];
  const scored = pages.map((p, idx) => {
    const sheet = perSheet[idx];
    let score = DISCIPLINE_WEIGHT[sheet?.detected_discipline ?? ''] ?? 1;
    if (sheet && parserYieldLow(sheet)) score += 2;
    if (idx === 0) score += 1;
    return { idx, score };
  });
  scored.sort((a, b) => b.score - a.score || a.idx - b.idx);
  return scored.slice(0, max).map((s) => s.idx).sort((a, b) => a - b);
}
