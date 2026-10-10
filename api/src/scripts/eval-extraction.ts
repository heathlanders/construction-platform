// eval-extraction.ts — Accuracy harness for blueprint extraction (parser-only vs +vision).
//
// WHY: nothing measured how well the local vision model (Qwen2.5-VL via Ollama) actually
// improves blueprint extraction — the pipeline only had `count > 0` tests. This script runs
// the REAL extraction pipeline (extract → OCR-fallback → parseSheetText → aggregate), then
// re-runs it WITH vision augmentation, and reports:
//   • the vision DELTA per field-group (what vision added / removed vs the parser) — no labels needed
//   • precision / recall / F1 vs a hand-authored golden file, when one exists
//   • per-sheet vision latency
//
// It reuses the exact pipeline functions (no reimplementation) so numbers match production.
// Standalone: pure functions + Ollama HTTP only — NO database, NO withTenantContext.
//
// Usage:
//   npx tsx --require dotenv/config src/scripts/eval-extraction.ts [fixture...] [--no-vision] [--json <path>]
//     fixture   basename(s) under api/test/fixtures (e.g. madison-lot25). Default: all *.pdf there.
//     --no-vision   parser-only (skip Ollama) — baseline sanity / CI.
//     --json PATH   also write the full result object as JSON.
//   Vision runs only when BLUEPRINT_VISION_ENABLED is set AND Ollama is reachable; otherwise the
//   run is parser-only and says so (never fabricates a vision column).

import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

import { extractPdfText, type PdfExtractResult } from '../lib/blueprint-pdf/extract.js';
import { ocrPdfToText, ocrYieldChars } from '../lib/blueprint-pdf/ocr.js';
import { parseSheetText, type SheetExtractedData } from '../lib/blueprint-pdf/parse-sheets.js';
import { aggregateExtractions, type AggregatedExtraction } from '../lib/blueprint-pdf/build-tasks.js';
import {
  visionEnabled, checkOllamaHealth, renderPageForVision,
  analyzeSheetPng, VISION_MAX_PAGES, OLLAMA_VISION_MODEL,
} from '../lib/blueprint-pdf/vision.js';
import { mergeSheetExtraction, selectVisionPages } from '../lib/blueprint-pdf/merge-vision.js';

const OCR_MIN_YIELD_CHARS = 200; // mirrors blueprint-worker

// Fixtures don't declare a building_type; the live pipeline gets it from the analysis row. Map it
// here so the harness exercises the same building-type steering (prompt hint + incompatible-
// component gate) the worker uses. Unknown fixture → undefined (base prompt, no gate).
const FIXTURE_BUILDING_TYPE: Record<string, string> = {
  'madison-polebarn': 'pole_barn',
  'madison-lot25': 'residential_sf',
  'madison-lot437': 'residential_sf',
  'cjpia-commercial': 'commercial',
  'sd-adu': 'residential_sf',
};
const FIXTURES_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'test', 'fixtures');
const GOLDEN_DIR = join(FIXTURES_DIR, 'golden');

// ─── Field-group projections of an aggregate (what we score/diff) ────────────────

interface Groups {
  flags: Set<string>;          // flag keys that are TRUE
  seismic_category: string | null;
  components: Set<string>;
  fixtures: Set<string>;
  panels: Set<string>;         // amperage as string
  window_marks: Set<string>;
  door_marks: Set<string>;
  rooms: Set<string>;          // upper-cased room names
  title_block: Record<string, string>; // non-null tb fields
}

const TB_FIELDS = ['architect_name', 'builder_name', 'street_address', 'lot_number', 'city', 'state', 'zip'] as const;

function projectGroups(agg: AggregatedExtraction): Groups {
  const flags = new Set<string>();
  for (const [k, v] of Object.entries(agg.flags)) {
    if (k === 'seismic_category') continue;
    if (v === true) flags.add(k);
  }
  const marks = (rows: { mark: string | null }[]) =>
    new Set(rows.map((r, i) => (r.mark ? r.mark.toUpperCase().trim() : `#${i}`)));
  const tb: Record<string, string> = {};
  for (const f of TB_FIELDS) {
    const v = (agg.title_block as unknown as Record<string, unknown>)[f];
    if (typeof v === 'string' && v.trim()) tb[f] = v.trim();
  }
  return {
    flags,
    seismic_category: agg.flags.seismic_category ?? null,
    components: new Set(agg.components),
    fixtures: new Set(agg.fixture_types),
    panels: new Set(agg.panels.filter((p) => p.amperage != null).map((p) => String(p.amperage))),
    window_marks: marks(agg.windows),
    door_marks: marks(agg.doors),
    rooms: new Set(agg.rooms.map((r) => r.name.toUpperCase().trim())),
    title_block: tb,
  };
}

// ─── Set diff + PRF ──────────────────────────────────────────────────────────────

const diffAdded = (a: Set<string>, b: Set<string>) => [...b].filter((x) => !a.has(x)); // in b, not a

interface PRF { tp: number; fp: number; fn: number; precision: number; recall: number; f1: number; }
function prf(pred: Set<string>, gold: Set<string>): PRF {
  let tp = 0, fp = 0;
  for (const x of pred) (gold.has(x) ? tp++ : fp++);
  const fn = [...gold].filter((x) => !pred.has(x)).length;
  const precision = tp + fp ? tp / (tp + fp) : 1;
  const recall = tp + fn ? tp / (tp + fn) : 1;
  const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0;
  return { tp, fp, fn, precision, recall, f1 };
}

const SET_GROUPS = ['flags', 'components', 'fixtures', 'panels', 'window_marks', 'door_marks', 'rooms'] as const;

// ─── Extraction (mirrors runTextExtractionPath, sans DB) ─────────────────────────

async function extractPerSheet(buffer: Buffer): Promise<{ perSheet: SheetExtractedData[]; extraction: PdfExtractResult; source: string }> {
  let extraction = await extractPdfText(buffer);
  let source = 'text_extraction';
  if (!extraction.metadata.is_vector) {
    const ocr = await ocrPdfToText(buffer);
    if (ocrYieldChars(ocr) >= OCR_MIN_YIELD_CHARS) { extraction = ocr; source = 'ocr_extraction'; }
    else source = 'template_scanned_fallback';
  }
  const perSheet = extraction.pages.map((p) => parseSheetText(p.discipline, p.text, p.title_block_text));
  return { perSheet, extraction, source };
}

async function runVision(buffer: Buffer, extraction: PdfExtractResult, perSheet: SheetExtractedData[], buildingType?: string) {
  const indices = selectVisionPages(extraction.pages, perSheet, VISION_MAX_PAGES);
  const merged = perSheet.slice();
  const timings: number[] = [];
  let analyzed = 0, failed = 0;
  const mupdf = await import('mupdf');
  const doc = mupdf.Document.openDocument(buffer, 'application/pdf');
  for (const idx of indices) {
    const t0 = Date.now();
    let res = null;
    try { res = await analyzeSheetPng(renderPageForVision(mupdf, doc.loadPage(idx)), { buildingType }); }
    catch { /* skip */ }
    if (res) { merged[idx] = mergeSheetExtraction(perSheet[idx], res.data).merged; analyzed++; timings.push(Date.now() - t0); }
    else failed++;
  }
  return { merged, indices, analyzed, failed, timings };
}

// ─── Report helpers ──────────────────────────────────────────────────────────────

const pct = (n: number) => `${(n * 100).toFixed(0)}%`;
function loadGolden(name: string): Partial<Record<string, string[] | Record<string, string> | string>> | null {
  const p = join(GOLDEN_DIR, `${name}.json`);
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, 'utf8'));
}

async function evalFixture(pdfPath: string, useVision: boolean) {
  const name = basename(pdfPath).replace(/\.pdf$/i, '');
  const buffer = readFileSync(pdfPath);
  const { perSheet, extraction, source } = await extractPerSheet(buffer);
  const parserAgg = aggregateExtractions(perSheet);
  const parserG = projectGroups(parserAgg);

  const buildingType = FIXTURE_BUILDING_TYPE[name];
  let visionG: Groups | null = null;
  let visionMeta: { analyzed: number; failed: number; selected: number; avg_ms: number } | null = null;
  if (useVision) {
    const v = await runVision(buffer, extraction, perSheet, buildingType);
    const visionAgg = aggregateExtractions(v.merged);
    visionG = projectGroups(visionAgg);
    visionMeta = {
      analyzed: v.analyzed, failed: v.failed, selected: v.indices.length,
      avg_ms: v.timings.length ? Math.round(v.timings.reduce((a, b) => a + b, 0) / v.timings.length) : 0,
    };
  }

  // Console report
  console.log(`\n\x1b[1m━━ ${name} \x1b[0m (${source}, ${extraction.page_count} sheets${buildingType ? `, ${buildingType}` : ''})`);
  const golden = loadGolden(name);
  console.log(`  ${'group'.padEnd(16)} ${'parser'.padStart(7)} ${'+vision'.padStart(8)}  vision added${golden ? '   P/R/F1 (parser → +vision)' : ''}`);
  for (const g of SET_GROUPS) {
    const p = parserG[g] as Set<string>;
    const v = visionG ? (visionG[g] as Set<string>) : null;
    const added = v ? diffAdded(p, v) : [];
    let scoreCol = '';
    if (golden && Array.isArray(golden[g])) {
      const gold = new Set(golden[g] as string[]);
      const pp = prf(p, gold);
      const vp = v ? prf(v, gold) : null;
      scoreCol = `   F1 ${pct(pp.f1)}${vp ? ` → ${pct(vp.f1)}` : ''} (P${pct(pp.precision)}/R${pct(pp.recall)}${vp ? ` → P${pct(vp.precision)}/R${pct(vp.recall)}` : ''})`;
    }
    console.log(
      `  ${g.padEnd(16)} ${String(p.size).padStart(7)} ${String(v ? v.size : '-').padStart(8)}  ` +
      `${added.length ? added.slice(0, 6).join(', ') + (added.length > 6 ? '…' : '') : '·'}${scoreCol}`,
    );
  }
  // title block
  const tbParser = Object.keys(parserG.title_block).length;
  const tbVision = visionG ? Object.keys(visionG.title_block).length : null;
  const tbFilled = visionG ? TB_FIELDS.filter((f) => !parserG.title_block[f] && visionG!.title_block[f]) : [];
  console.log(`  ${'title_block'.padEnd(16)} ${String(tbParser).padStart(7)} ${String(tbVision ?? '-').padStart(8)}  ${tbFilled.length ? 'filled: ' + tbFilled.join(', ') : '·'}`);
  if (golden && golden.title_block && typeof golden.title_block === 'object') {
    const gold = golden.title_block as Record<string, string>;
    const scoreTb = (gs: Groups) => {
      const keys = Object.keys(gold);
      const correct = keys.filter((k) => gs.title_block[k] && gs.title_block[k].toUpperCase() === String(gold[k]).toUpperCase()).length;
      return keys.length ? correct / keys.length : 1;
    };
    console.log(`  ${''.padEnd(16)} ${''.padStart(7)} ${''.padStart(8)}  title-block correct: ${pct(scoreTb(parserG))}${visionG ? ` → ${pct(scoreTb(visionG))}` : ''}`);
  }
  if (visionMeta) {
    console.log(`  \x1b[2mvision: ${visionMeta.analyzed} analyzed / ${visionMeta.failed} failed of ${visionMeta.selected} selected sheets, ~${visionMeta.avg_ms}ms/sheet\x1b[0m`);
  }
  if (!golden) console.log(`  \x1b[2m(no golden labels at test/fixtures/golden/${name}.json — showing vision delta only)\x1b[0m`);

  return {
    name, source, sheets: extraction.page_count,
    parser: serialize(parserG), vision: visionG ? serialize(visionG) : null,
    vision_meta: visionMeta, has_golden: !!golden,
  };
}

function serialize(g: Groups) {
  return {
    flags: [...g.flags], seismic_category: g.seismic_category,
    components: [...g.components], fixtures: [...g.fixtures], panels: [...g.panels],
    window_marks: [...g.window_marks], door_marks: [...g.door_marks], rooms: [...g.rooms],
    title_block: g.title_block,
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────────

async function main() {
  const argv = process.argv.slice(2);
  const noVision = argv.includes('--no-vision');
  const jsonIdx = argv.indexOf('--json');
  const jsonOut = jsonIdx >= 0 ? argv[jsonIdx + 1] : null;
  const names = argv.filter((a) => !a.startsWith('--') && a !== jsonOut);

  const fixtures = (names.length ? names.map((n) => n.replace(/\.pdf$/i, '')) :
    readdirSync(FIXTURES_DIR).filter((f) => f.endsWith('.pdf')).map((f) => f.replace(/\.pdf$/, '')))
    .map((n) => join(FIXTURES_DIR, `${n}.pdf`));

  let useVision = !noVision;
  if (useVision) {
    if (!visionEnabled()) {
      console.log('\x1b[33m⚠ BLUEPRINT_VISION_ENABLED not set — running PARSER-ONLY. Set it (and start Ollama) to measure the vision delta.\x1b[0m');
      useVision = false;
    } else if (!(await checkOllamaHealth())) {
      console.log('\x1b[33m⚠ Ollama unreachable — running PARSER-ONLY. Start the ollama service to measure the vision delta.\x1b[0m');
      useVision = false;
    } else {
      console.log(`\x1b[36mVision ON — model ${OLLAMA_VISION_MODEL}, up to ${VISION_MAX_PAGES} sheets/plan.\x1b[0m`);
    }
  }

  const results = [];
  for (const f of fixtures) {
    if (!existsSync(f)) { console.warn(`skip (missing): ${f}`); continue; }
    results.push(await evalFixture(f, useVision));
  }

  if (jsonOut) {
    writeFileSync(jsonOut, JSON.stringify({ generated: null, vision: useVision, model: useVision ? OLLAMA_VISION_MODEL : null, results }, null, 2));
    console.log(`\nWrote ${jsonOut}`);
  }
  console.log('\nDone.');
}

main().catch((err) => { console.error(err); process.exit(1); });
