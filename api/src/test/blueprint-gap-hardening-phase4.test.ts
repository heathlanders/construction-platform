// blueprint-gap-hardening-phase4.test.ts — Phase 4 (B4.1–B4.4) unit tests.
// Pure functions — no DB. Covers region-gated CA wording, tightened component regexes,
// routing heuristics (dotted sheet numbers + multi-letter discipline), and dead-field removal.

import { describe, it, expect } from 'vitest';
import { disciplineFromSheetNumber } from '../lib/blueprint-pdf/extract.js';
import { parseSheetText } from '../lib/blueprint-pdf/parse-sheets.js';
import { aggregateExtractions, buildTasksFromExtraction } from '../lib/blueprint-pdf/build-tasks.js';
import { BUILDING_TYPES, isValidBuildingType } from '../lib/blueprint-templates/index.js';

function aggFor(text: string) {
  return aggregateExtractions([parseSheetText('architectural', text)]);
}

describe('B4.1 — region-gate CA code wording', () => {
  it('non-CA project: recessed-light task uses generic wording (no Title-24)', () => {
    const agg = aggFor('RECESSED LIGHT fixture legend');
    const tasks = buildTasksFromExtraction('residential_sf', agg, 'WI');
    const light = tasks.find((t) => /lighting rough-in/i.test(t.title));
    expect(light).toBeDefined();
    expect(light!.title).toBe('Lighting rough-in');
    expect(light!.title).not.toMatch(/title-24/i);
  });

  it('CA project: recessed-light task carries Title-24 wording', () => {
    const agg = aggFor('RECESSED LIGHT fixture legend');
    const tasks = buildTasksFromExtraction('residential_sf', agg, 'CA');
    const light = tasks.find((t) => /lighting rough-in/i.test(t.title));
    expect(light!.title).toMatch(/title-24/i);
  });

  it('Title-24 flag on the sheet forces CA wording even if state unknown', () => {
    const agg = aggFor('RECESSED LIGHT — COMPLY WITH TITLE-24');
    const tasks = buildTasksFromExtraction('residential_sf', agg, null);
    const light = tasks.find((t) => /lighting rough-in/i.test(t.title));
    expect(light!.title).toMatch(/title-24/i);
  });
});

describe('B4.1 — tightened component regexes', () => {
  it('EGRESS LIGHTING (electrical note) does NOT emit an egress_window', () => {
    expect(parseSheetText('electrical', 'EMERGENCY EGRESS LIGHTING ON GENERATOR').components)
      .not.toContain('egress_window');
  });
  it('EGRESS WINDOW / WINDOW WELL still detected', () => {
    expect(parseSheetText('architectural', 'BEDROOM EGRESS WINDOW W/ WINDOW WELL').components)
      .toContain('egress_window');
  });
  it('bare "slab" prose does NOT emit slab_on_grade; "SLAB ON GRADE" does', () => {
    expect(parseSheetText('general', 'see slab detail note on another sheet').components)
      .not.toContain('slab_on_grade');
    expect(parseSheetText('structural', '4" CONCRETE SLAB ON GRADE').components)
      .toContain('slab_on_grade');
  });
  it('bare "footing" prose does NOT emit concrete_footing; qualified footing does', () => {
    expect(parseSheetText('general', 'contractor to verify footing').components)
      .not.toContain('concrete_footing');
    expect(parseSheetText('structural', 'CONTINUOUS FOOTING PER PLAN').components)
      .toContain('concrete_footing');
  });
});

describe('B4.2 — routing heuristics (discipline from sheet number)', () => {
  it.each([
    ['A.1', 'architectural'],   // dotted separator
    ['A2.1', 'architectural'],
    ['E1.0', 'electrical'],
    ['FA-1', 'electrical'],     // fire alarm (not plumbing)
    ['FP-2', 'plumbing'],       // fire protection piping
    ['FS-1', 'plumbing'],
    ['G-001', 'general'],       // general/cover
    ['SP-1', 'civil'],          // site plan (not structural)
    ['CS-1', 'specs'],          // cover sheet
    ['S-2', 'structural'],
  ])('%s → %s', (sheet, disc) => {
    expect(disciplineFromSheetNumber(sheet)).toBe(disc);
  });
});

describe('B4.3 — building-type enum consolidation', () => {
  it('BUILDING_TYPES is the 5-type set and isValidBuildingType agrees', () => {
    expect([...BUILDING_TYPES].sort()).toEqual(
      ['commercial', 'industrial', 'pole_barn', 'residential_mf', 'residential_sf'],
    );
    for (const bt of BUILDING_TYPES) expect(isValidBuildingType(bt)).toBe(true);
    expect(isValidBuildingType('mansion')).toBe(false);
  });

  it('extraction still builds tasks after dead-field removal (no disciplines_present)', () => {
    const agg = aggFor('200A ELECTRICAL PANEL, RECESSED LIGHT');
    expect(agg).not.toHaveProperty('disciplines_present');
    const tasks = buildTasksFromExtraction('residential_sf', agg, 'WI');
    expect(tasks.length).toBeGreaterThan(0);
  });
});
