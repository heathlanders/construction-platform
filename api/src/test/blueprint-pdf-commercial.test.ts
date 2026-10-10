// blueprint-pdf-commercial.test.ts — text-layer extraction smoke test on a real
// COMMERCIAL plan set (complements blueprint-pdf.test.ts, which uses an SFR ADU).
//
// Fixture: cjpia-commercial.pdf — a 10-sheet vector slice of CJPIA's "4-Architectural-
// Design-Plans" set (La Palma, CA commercial building, ~6,995 SF). Sliced from the 53-page
// original (32 MB) down to representative architectural + civil + landscape + plumbing +
// code sheets (3.3 MB). Heavy raster pages (roof/elevation renders) were dropped; the
// drawings are vector CAD, so the text layer is fully intact.
//
// COMMERCIAL EXTRACTION: parse-sheets.ts detects commercial-building signals
// (exit signage / egress lighting, ADA accessible route) and build-tasks.ts turns them
// into extraction-derived augment tasks (sort_order >= 2000) on top of the commercial
// template baseline. This fixture exercises that path. (Residential schedule/flag parsers
// — panels, WINDOW/DOOR SCHEDULE rows, Title-24/HERS/Solar — do not match a commercial set,
// which is expected; see blueprint-pdf.test.ts for residential coverage.)

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { extractPdfText } from '../lib/blueprint-pdf/extract.js';
import { parseSheetText } from '../lib/blueprint-pdf/parse-sheets.js';
import { aggregateExtractions, buildTasksFromExtraction } from '../lib/blueprint-pdf/build-tasks.js';
import { getTemplate } from '../lib/blueprint-templates/index.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const FIXTURE = resolve(__dirname, '../../test/fixtures/cjpia-commercial.pdf');
// Private fixture (third-party plan set) — not in the public repo; these tests skip when absent.
const HAVE_FIXTURE = existsSync(FIXTURE);

describe('extractPdfText (CJPIA commercial fixture)', () => {
  it.skipIf(!HAVE_FIXTURE)('detects 10 vector sheets', async () => {
    const buf = readFileSync(FIXTURE);
    const r = await extractPdfText(buf);
    expect(r.page_count).toBe(10);
    expect(r.metadata.is_vector).toBe(true);
  });

  it.skipIf(!HAVE_FIXTURE)('extracts a title-block sheet number for every sheet', async () => {
    const buf = readFileSync(FIXTURE);
    const r = await extractPdfText(buf);
    const numbered = r.pages.filter((p) => p.sheet_number !== null);
    expect(numbered.length).toBe(10);
  });

  it.skipIf(!HAVE_FIXTURE)('classifies both architectural and civil disciplines from sheet numbers', async () => {
    const buf = readFileSync(FIXTURE);
    const r = await extractPdfText(buf);
    const disciplines = new Set(r.pages.map((p) => p.discipline));
    expect(disciplines.has('architectural')).toBe(true);
    expect(disciplines.has('civil')).toBe(true);
  });
});

describe('parseSheetText (CJPIA commercial fixture)', () => {
  it.skipIf(!HAVE_FIXTURE)('detects commercial code signals (exit signage + accessibility)', async () => {
    const buf = readFileSync(FIXTURE);
    const r = await extractPdfText(buf);
    const perSheet = r.pages.map((p) => parseSheetText(p.discipline, p.text));
    expect(perSheet.some((s) => s.flags.has_exit_signage)).toBe(true);
    expect(perSheet.some((s) => s.flags.has_accessibility)).toBe(true);
  });
});

describe('buildTasksFromExtraction (CJPIA commercial fixture)', () => {
  it.skipIf(!HAVE_FIXTURE)('produces commercial-specific augment tasks on top of the baseline', async () => {
    const buf = readFileSync(FIXTURE);
    const r = await extractPdfText(buf);
    const perSheet = r.pages.map((p) => parseSheetText(p.discipline, p.text));
    const agg = aggregateExtractions(perSheet);
    const tasks = buildTasksFromExtraction('commercial', agg);

    // Augments are appended to the commercial template baseline.
    expect(tasks.length).toBeGreaterThan(getTemplate('commercial').length);

    const augments = tasks.filter((t) => t.sort_order >= 2000);
    expect(augments.length).toBeGreaterThanOrEqual(2);

    // The two reliably-detected commercial signals each produce a task.
    expect(augments.some((t) => /exit sign/i.test(t.title))).toBe(true);
    expect(augments.some((t) => /accessible|ADA/i.test(t.title))).toBe(true);

    // Every task is well-formed (trade + phase + csi present).
    for (const t of tasks) {
      expect(t.trade_type).toBeTruthy();
      expect(t.phase).toBeTruthy();
      expect(t.csi_division).toBeTruthy();
    }
  });
});
