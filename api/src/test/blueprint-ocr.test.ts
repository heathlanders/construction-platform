// blueprint-ocr.test.ts — OCR path for scanned (image-only) builder PDFs.
//
// Fixtures are real scanned plans from a Madison WI builder (no text layer):
//   madison-lot25.pdf / madison-lot437.pdf — residential single-family
//   madison-polebarn.pdf                    — post-frame (graphic-heavy, OCR-poor)
// madison-lot25-ocr.txt is the vendored Tesseract output for lot25 (deterministic,
// fast) so the detector assertions don't depend on re-running OCR.
// These fixtures are a private client's plans and are NOT in the public repo; the tests
// that need them skip cleanly when the files are absent.

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect, beforeAll } from 'vitest';
import { parseSheetText } from '../lib/blueprint-pdf/parse-sheets.js';
import { aggregateExtractions, buildTasksFromExtraction } from '../lib/blueprint-pdf/build-tasks.js';
import { getTemplate } from '../lib/blueprint-templates/index.js';
import { ocrPdfToText, ocrYieldChars } from '../lib/blueprint-pdf/ocr.js';
import { extractTitleBlock, resolveBuilderProfile } from '../lib/blueprint-pdf/title-block.js';
import { repairOcrZip } from '../lib/jurisdictions/index.js';
import { testPool } from './setup.js';
import { setupReferenceCache } from './seed-reference.js';

beforeAll(async () => {
  // repairOcrZip is now DB-backed (Doc 16 Phase 2) — seed WI ZIPs + load the cache.
  await setupReferenceCache(testPool);
});

const FIX = (f: string) => resolve(__dirname, '../../test/fixtures', f);
// Private fixture (a client's plans) — absent from the public repo; dependent tests skip.
const HAVE_OCR_TEXT = existsSync(FIX('madison-lot25-ocr.txt'));
const HAVE_SCAN_PDF = existsSync(FIX('madison-lot25.pdf'));

describe('OCR-text detectors (Madison Lot 25, vendored OCR text)', () => {
  const text = HAVE_OCR_TEXT ? readFileSync(FIX('madison-lot25-ocr.txt'), 'utf8') : '';
  const parsed = parseSheetText('architectural', text);
  const agg = aggregateExtractions([parsed]);

  it.skipIf(!HAVE_OCR_TEXT)('detects residential room labels with no schedule table', () => {
    const names = agg.rooms.map((r) => r.name);
    expect(agg.rooms.length).toBeGreaterThanOrEqual(8);
    expect(names).toContain('KITCHEN');
    expect(names.some((n) => /BEDROOM/.test(n))).toBe(true);
    expect(names.some((n) => /GARAGE/.test(n))).toBe(true);
    // bare GARAGE collapsed when "N CAR GARAGE" present
    expect(names.filter((n) => n === 'GARAGE').length).toBe(0);
  });

  it.skipIf(!HAVE_OCR_TEXT)('detects structural + envelope components from on-sheet callouts', () => {
    const c = agg.components;
    for (const key of ['engineered_trusses', 'i_joists', 'lvl_beam', 'concrete_footing',
      'anchor_bolts', 'batt_insulation', 'vapor_barrier', 'vinyl_siding']) {
      expect(c.has(key), `missing component ${key}`).toBe(true);
    }
  });

  it.skipIf(!HAVE_OCR_TEXT)('surfaces Wisconsin UDC code reference (OCR-mangled SPS)', () => {
    expect(agg.callouts.some((c) => /3\d{2}/.test(c))).toBe(true);
  });

  it.skipIf(!HAVE_OCR_TEXT)('extracts the title block — drafter, builder, build location', () => {
    const tb = agg.title_block;
    expect(tb.architect_name).toBe('EXAMPLE DRAFTING SERVICES');
    expect(tb.builder_name).toMatch(/EXAMPLE PROPERTIES/);
    expect(tb.state).toBe('WI');
    // NOTE: the real ZIP is 53527 (Cottage Grove); Tesseract misreads the 7 as a 1 on this
    // builder's title block. We assert the actual (wrong) OCR output here to document the
    // misread — and DON'T trust the OCR zip for jurisdiction (county comes from the builder
    // profile instead; see the profile test below).
    expect(tb.zip).toBe('53521');
    expect(tb.city).toMatch(/COTTAGE/);
    expect(tb.architect_phone).toBe('608-555-0100');
    expect(tb.architect_email).toMatch(/gmail\.com$/);
  });

  it.skipIf(!HAVE_OCR_TEXT)('per-sheet extractTitleBlock matches the voted aggregate', () => {
    const direct = extractTitleBlock(text);
    expect(direct.architect_name).toBe('EXAMPLE DRAFTING SERVICES');
    expect(direct.builder_name).toMatch(/EXAMPLE/);
  });

  it.skipIf(!HAVE_OCR_TEXT)('resolves the Madison-area builder profile (processing hint)', () => {
    const profile = resolveBuilderProfile(agg.title_block);
    expect(profile).not.toBeNull();
    expect(profile!.region_state).toBe('WI');
    expect(profile!.building_type_hint).toBe('residential_sf');
    // Example Drafting matches first
    expect(profile!.key).toBe('example-drafting');
    // Authoritative county — bypasses the unreliable OCR zip (Dane County, FIPS 55025)
    expect(profile!.region_county_fips).toBe('55025');
    expect(profile!.region_county_name).toBe('Dane');
  });

  it('repairs the OCR ZIP misread against the builder jurisdiction (53521 → 53527)', async () => {
    // Dane County + Cottage Grove → the 7→1 misread snaps back to the real ZIP.
    expect(await repairOcrZip('53521', { county_fips: '55025', city: 'COTTAGE GROVE', state: 'WI' })).toBe('53527');
    // A correct ZIP is returned unchanged.
    expect(await repairOcrZip('53527', { county_fips: '55025', city: 'COTTAGE GROVE' })).toBe('53527');
    // No false correction: wrong county filter → no seeded match → keep the original.
    expect(await repairOcrZip('53521', { county_fips: '06073' })).toBe('53521');
    // Unknown ZIP with no jurisdiction hint and no seeded variant → unchanged.
    expect(await repairOcrZip('99999', {})).toBe('99999');
  });

  it('resolves a builder profile from a synthetic title block (no fixture needed)', () => {
    const profile = resolveBuilderProfile({
      architect_name: 'EXAMPLE DRAFTING SERVICES', architect_phone: null, architect_email: null,
      builder_name: 'EXAMPLE PROPERTIES LLC', city: null, state: null, zip: null,
      street_address: null, lot_number: null, location_raw: null,
    });
    expect(profile).not.toBeNull();
    expect(profile!.key).toBe('example-drafting');
    expect(profile!.region_county_fips).toBe('55025');
  });

  it('returns null profile for an unrecognized title block', () => {
    expect(resolveBuilderProfile({
      architect_name: 'ACME ARCHITECTS', architect_phone: null, architect_email: null,
      builder_name: 'NOWHERE HOMES', city: null, state: null, zip: null,
      street_address: null, lot_number: null, location_raw: null,
    })).toBeNull();
  });

  it.skipIf(!HAVE_OCR_TEXT)('builds augment tasks on top of the residential_sf baseline', () => {
    const tasks = buildTasksFromExtraction('residential_sf', agg);
    const baseN = getTemplate('residential_sf').length;
    expect(tasks.length).toBeGreaterThan(baseN);
    const augments = tasks.filter((t) => t.sort_order >= 2000);
    expect(augments.length).toBeGreaterThanOrEqual(10);
    expect(augments.some((t) => /footing/i.test(t.title) && t.phase === 'foundation')).toBe(true);
    expect(augments.some((t) => /truss/i.test(t.title))).toBe(true);
    expect(augments.some((t) => /vinyl siding/i.test(t.title) && t.phase === 'finishes_exterior')).toBe(true);
  });
});

describe('pole_barn template registered', () => {
  it('returns a non-empty post-frame task list', () => {
    const t = getTemplate('pole_barn');
    expect(t.length).toBeGreaterThan(20);
    expect(t.some((x) => /post-frame columns|poles/i.test(x.title))).toBe(true);
    expect(t.some((x) => /metal roof panel/i.test(x.title))).toBe(true);
  });
});

// Slow: runs the real WASM OCR stack (mupdf render + tesseract.js) on a scanned PDF.
describe('ocrPdfToText (real scanned PDF)', () => {
  it.skipIf(!HAVE_SCAN_PDF)('OCRs Lot 25 to usable text → rooms + components extracted', async () => {
    const buf = readFileSync(FIX('madison-lot25.pdf'));
    const progress: Array<[number, number]> = [];
    const r = await ocrPdfToText(buf, (done, total) => { progress.push([done, total]); });
    expect(r.page_count).toBe(3);
    // Progress hook fires once per page, 1-based, with the full page count.
    expect(progress).toEqual([[1, 3], [2, 3], [3, 3]]);
    expect(r.metadata.is_vector).toBe(false);
    expect(ocrYieldChars(r)).toBeGreaterThan(200);

    const agg = aggregateExtractions(r.pages.map((p) => parseSheetText(p.discipline, p.text, p.title_block_text)));
    expect(agg.rooms.length).toBeGreaterThanOrEqual(6);
    expect(agg.components.size).toBeGreaterThanOrEqual(8);

    // High-DPI title-block pass reads the small ZIP glyph correctly: 53527, NOT the
    // full-page misread 53521. This is the actual OCR fix (Tesseract reads the 7).
    expect(r.pages.some((p) => p.title_block_text && /53527/.test(p.title_block_text))).toBe(true);
    expect(agg.title_block.zip).toBe('53527');
    expect(agg.title_block.architect_name).toMatch(/EXAMPLE DRAFTING/);
  }, 180_000);
});
