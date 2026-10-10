// trade-taxonomy-extraction.test.ts — T-64 Doc 21 data-work: blueprint component detectors +
// extraction tasks for taxonomy trades, and the new estimating quantity seeders. Pure, no DB.

import { describe, it, expect } from 'vitest';
import { parseSheetText } from '../lib/blueprint-pdf/parse-sheets.js';
import { aggregateExtractions, buildTasksFromExtraction } from '../lib/blueprint-pdf/build-tasks.js';
import { seedQuantities } from '../lib/estimating/quantities.js';
import { EMPTY_FACTS } from '../lib/task-buildout/types.js';
import type { BlueprintFacts } from '../lib/task-buildout/types.js';

const SHEET_TEXT = `
GENERAL NOTES
EXTERIOR: BRICK VENEER AT FRONT ELEVATION, THREE COAT STUCCO AT SIDES
PROVIDE 5" ALUMINUM GUTTERS AND DOWNSPOUTS AT ALL EAVES
KITCHEN CABINETS PER ELEVATIONS, CERAMIC TILE AT SHOWER SURROUND
ASPHALT PAVING AT DRIVEWAY OVER 6" AGGREGATE BASE
`;

describe('COMPONENT_PATTERNS — taxonomy trade detectors', () => {
  const parsed = parseSheetText('architectural', SHEET_TEXT);

  it('detects the six new taxonomy components', () => {
    for (const key of ['masonry_veneer', 'stucco_finish', 'cabinetry', 'ceramic_tile', 'asphalt_paving', 'gutters_downspouts']) {
      expect(parsed.components, key).toContain(key);
    }
  });

  it('does not fire cabinetry on a panelboard cabinet note', () => {
    const p = parseSheetText('electrical', 'PANELBOARD CABINET NEMA 1 SURFACE MOUNT');
    expect(p.components).not.toContain('cabinetry');
  });

  it('does not fire masonry on a bare "masonry contractor" note', () => {
    const p = parseSheetText('architectural', 'MASONRY CONTRACTOR TO VERIFY DIMENSIONS');
    expect(p.components).not.toContain('masonry_veneer');
  });
});

describe('buildTasksFromExtraction — taxonomy augment tasks', () => {
  const agg = aggregateExtractions([parseSheetText('architectural', SHEET_TEXT)]);
  const tasks = buildTasksFromExtraction('residential_sf', agg);
  const augments = tasks.filter((t) => (t.sort_order ?? 0) >= 2000);

  it('emits one augment task per detected taxonomy component, carrying the taxonomy trade key', () => {
    const byTrade = new Map(augments.map((t) => [t.trade_type, t]));
    expect(byTrade.get('masonry')?.title).toMatch(/veneer/i);
    expect(byTrade.get('stucco_eifs')?.title).toMatch(/stucco/i);
    expect(byTrade.get('cabinetry')?.title).toMatch(/cabinet/i);
    expect(byTrade.get('tile')?.title).toMatch(/tile/i);
    expect(byTrade.get('asphalt_paving')?.title).toMatch(/asphalt/i);
    expect(byTrade.get('gutters')?.title).toMatch(/gutter/i);
  });

  it('places them in sensible phases', () => {
    const asphalt = augments.find((t) => t.trade_type === 'asphalt_paving')!;
    expect(asphalt.phase).toBe('sitework');
    const cab = augments.find((t) => t.trade_type === 'cabinetry')!;
    expect(cab.phase).toBe('finishes_interior');
  });
});

describe('quantity seeders — taxonomy trades', () => {
  const facts: BlueprintFacts = {
    ...EMPTY_FACTS,
    rooms: [{ name: 'KITCHEN', area_sf: 200 }, { name: 'GREAT ROOM', area_sf: 400 }, { name: 'BED 1', area_sf: 150 }],
    components: ['slab_on_grade', 'vinyl_siding', 'masonry_veneer', 'stucco_finish', 'ceramic_tile', 'cabinetry'],
  };
  const buildingCodes = new Set([
    'B-FRAME-SF', 'B-INSUL-SF', 'B-DRYWALL-SF', 'B-ROOF-SHINGLE-SQ', 'B-CONCRETE-CY',
    'B-SIDING-SF', 'B-BRICK-VENEER-SF', 'B-STUCCO-SF', 'B-WINDOW',
  ]);
  const generalCodes = new Set(['G-PAINT-SF', 'G-CLEAN-SF', 'G-TILE-FLOOR-SF', 'G-CAB-BASE-LF', 'G-CAB-UPPER-LF']);

  it('building seeder emits component-gated taxonomy quantities (750 SF total)', () => {
    const q = seedQuantities('building', facts, buildingCodes);
    const byCode = new Map(q.map((x) => [x.assembly_code, x]));
    expect(byCode.get('B-ROOF-SHINGLE-SQ')?.quantity).toBe(Math.ceil((750 * 1.15) / 100)); // 9 SQ
    expect(byCode.get('B-CONCRETE-CY')?.quantity).toBe(Math.ceil(750 * (4 / 12) / 27));    // 10 CY
    expect(byCode.get('B-SIDING-SF')?.quantity).toBe(Math.round(750 * 1.1));
    expect(byCode.get('B-BRICK-VENEER-SF')?.quantity).toBe(Math.round(750 * 0.4));
    expect(byCode.get('B-STUCCO-SF')?.quantity).toBe(Math.round(750 * 1.1));
    for (const x of q) expect((x.assumptions ?? []).length, x.assembly_code ?? undefined).toBeGreaterThan(0);
  });

  it('skips shingle roofing when a metal-roof callout is present', () => {
    const metal = { ...facts, components: [...facts.components, 'metal_roofing'] };
    const q = seedQuantities('building', metal, buildingCodes);
    expect(q.some((x) => x.assembly_code === 'B-ROOF-SHINGLE-SQ')).toBe(false);
  });

  it('general seeder emits paint/clean always, tile/cabinets only on callouts', () => {
    const q = seedQuantities('general', facts, generalCodes);
    const codes = q.map((x) => x.assembly_code);
    expect(codes).toContain('G-PAINT-SF');
    expect(codes).toContain('G-CLEAN-SF');
    expect(codes).toContain('G-TILE-FLOOR-SF');
    expect(codes).toContain('G-CAB-BASE-LF');

    const noComps = seedQuantities('general', { ...facts, components: [] }, generalCodes);
    const codes2 = noComps.map((x) => x.assembly_code);
    expect(codes2).toContain('G-PAINT-SF');
    expect(codes2).not.toContain('G-TILE-FLOOR-SF');
    expect(codes2).not.toContain('G-CAB-BASE-LF');
  });

  it('general seeder emits nothing without room areas', () => {
    expect(seedQuantities('general', { ...EMPTY_FACTS }, generalCodes)).toEqual([]);
  });
});
