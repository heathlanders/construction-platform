// blueprint-pdf.test.ts — unit tests for PDF text-layer extraction
// Uses real San Diego County PDS-670 ADU plan as fixture (vector PDF, AutoCAD-generated).
// No DB required — these test the pure extraction/parsing/task-build functions.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { extractPdfText, disciplineFromSheetNumber } from '../lib/blueprint-pdf/extract.js';
import { parseSheetText } from '../lib/blueprint-pdf/parse-sheets.js';
import { aggregateExtractions, buildTasksFromExtraction } from '../lib/blueprint-pdf/build-tasks.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const FIXTURE = resolve(__dirname, '../../test/fixtures/sd-adu.pdf');

describe('disciplineFromSheetNumber', () => {
  it('maps common prefixes', () => {
    expect(disciplineFromSheetNumber('A1')).toBe('architectural');
    expect(disciplineFromSheetNumber('E1.0')).toBe('electrical');
    expect(disciplineFromSheetNumber('P-2.3')).toBe('plumbing');
    expect(disciplineFromSheetNumber('M-101')).toBe('mechanical');
    expect(disciplineFromSheetNumber('S1')).toBe('structural');
    expect(disciplineFromSheetNumber('SP-1')).toBe('civil');
    expect(disciplineFromSheetNumber('CS-1')).toBe('specs');
  });
  it('returns architectural for unknown', () => {
    expect(disciplineFromSheetNumber(null)).toBe('architectural');
    expect(disciplineFromSheetNumber('XYZ-99')).toBe('architectural');
  });
});

describe('extractPdfText (SD ADU fixture)', () => {
  it('detects 9 pages and is_vector=true', async () => {
    const buf = readFileSync(FIXTURE);
    const r = await extractPdfText(buf);
    expect(r.page_count).toBe(9);
    expect(r.metadata.is_vector).toBe(true);
    expect(r.metadata.creator).toMatch(/AutoCAD/i);
  });

  it('extracts correct sheet numbers for all 9 sheets', async () => {
    const buf = readFileSync(FIXTURE);
    const r = await extractPdfText(buf);
    const numbers = r.pages.map((p) => p.sheet_number);
    expect(numbers).toEqual(['SP-1', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'S1', 'S2']);
  });

  it('classifies disciplines based on sheet number', async () => {
    const buf = readFileSync(FIXTURE);
    const r = await extractPdfText(buf);
    expect(r.pages[0].discipline).toBe('civil');         // SP-1
    expect(r.pages[1].discipline).toBe('architectural'); // A1
    expect(r.pages[7].discipline).toBe('structural');    // S1
  });
});

describe('parseSheetText (SD ADU fixture)', () => {
  it('detects content discipline overriding sheet prefix on A2 (electrical)', async () => {
    const buf = readFileSync(FIXTURE);
    const r = await extractPdfText(buf);
    const electricalPage = r.pages.find((p) => p.sheet_number === 'A2')!;
    const parsed = parseSheetText(electricalPage.discipline, electricalPage.text);
    expect(parsed.detected_discipline).toBe('electrical');
  });

  it('extracts 200A panel from electrical sheet', async () => {
    const buf = readFileSync(FIXTURE);
    const r = await extractPdfText(buf);
    const electricalPage = r.pages.find((p) => p.sheet_number === 'A2')!;
    const parsed = parseSheetText(electricalPage.discipline, electricalPage.text);
    expect(parsed.schedules.panels).toBeDefined();
    expect(parsed.schedules.panels![0].amperage).toBe(200);
  });

  it('extracts window schedule from floor plan (A1)', async () => {
    const buf = readFileSync(FIXTURE);
    const r = await extractPdfText(buf);
    const floorPage = r.pages.find((p) => p.sheet_number === 'A1')!;
    const parsed = parseSheetText(floorPage.discipline, floorPage.text);
    expect(parsed.schedules.windows).toBeDefined();
    expect(parsed.schedules.windows!.length).toBeGreaterThanOrEqual(3);
    expect(parsed.schedules.windows![0]).toMatchObject({ mark: 'A', type: 'SLIDING' });
  });

  it('extracts code flags (Title-24, HERS, Solar Ready, Wildfire) across sheets', async () => {
    const buf = readFileSync(FIXTURE);
    const r = await extractPdfText(buf);
    const allFlags = r.pages.map((p) => parseSheetText(p.discipline, p.text).flags);
    const anyTitle24 = allFlags.some((f) => f.has_title24);
    const anyHers = allFlags.some((f) => f.has_hers_verification);
    const anySolar = allFlags.some((f) => f.has_solar_ready);
    const anyWildfire = allFlags.some((f) => f.has_wildfire_zone);
    expect(anyTitle24).toBe(true);
    expect(anyHers).toBe(true);
    expect(anySolar).toBe(true);
    expect(anyWildfire).toBe(true);
  });

  it('extracts at least 6 rooms from floor plan', async () => {
    const buf = readFileSync(FIXTURE);
    const r = await extractPdfText(buf);
    const floorPage = r.pages.find((p) => p.sheet_number === 'A1')!;
    const parsed = parseSheetText(floorPage.discipline, floorPage.text);
    expect(parsed.schedules.rooms).toBeDefined();
    expect(parsed.schedules.rooms!.length).toBeGreaterThanOrEqual(6);
  });
});

describe('buildTasksFromExtraction (SD ADU fixture)', () => {
  it('produces ≥60 tasks for residential_sf with extraction-derived specifics', async () => {
    const buf = readFileSync(FIXTURE);
    const r = await extractPdfText(buf);
    const perSheet = r.pages.map((p) => parseSheetText(p.discipline, p.text));
    const agg = aggregateExtractions(perSheet);
    const tasks = buildTasksFromExtraction('residential_sf', agg);

    expect(tasks.length).toBeGreaterThanOrEqual(60);

    // 200A panel task should be present
    const panelTask = tasks.find((t) => /200A/.test(t.title));
    expect(panelTask).toBeDefined();
    expect(panelTask!.trade_type).toBe('electrical');
    expect(panelTask!.phase).toBe('rough_in');

    // Solar Ready task should be present (CA flag detected)
    const solarTask = tasks.find((t) => /solar\s*ready/i.test(t.title));
    expect(solarTask).toBeDefined();

    // HERS verification task should be present
    const hersTask = tasks.find((t) => /HERS/i.test(t.title));
    expect(hersTask).toBeDefined();

    // Window install task with correct count (extraction-derived, sort_order ≥ 2000)
    const windowTask = tasks.find((t) => /3 units per schedule/i.test(t.title));
    expect(windowTask).toBeDefined();
    expect(windowTask!.sort_order).toBeGreaterThanOrEqual(2000);

    // Wildfire-zone task
    const wildfireTask = tasks.find((t) => /wildfire/i.test(t.title));
    expect(wildfireTask).toBeDefined();
  });

  it('aggregates fixture types from all sheets', async () => {
    const buf = readFileSync(FIXTURE);
    const r = await extractPdfText(buf);
    const perSheet = r.pages.map((p) => parseSheetText(p.discipline, p.text));
    const agg = aggregateExtractions(perSheet);

    expect(agg.fixture_types.has('duplex_outlet')).toBe(true);
    expect(agg.fixture_types.has('smoke_detector')).toBe(true);
    expect(agg.fixture_types.has('water_heater')).toBe(true);
    expect(agg.fixture_types.has('fau')).toBe(true);
  });
});
