// blueprint-vision.test.ts — unit tests for the local vision-model (Ollama) augmentation.
// Pure functions + mocked fetch — no DB, no Ollama server needed.
//
// Covers: the env gate, the zod strip-don't-reject validation (hallucinated enum tokens,
// malformed JSON, bad field types), analyzeSheetPng failure modes (non-200, network error,
// timeout) all returning null, the parser-wins merge algorithm, and vision page selection.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  visionEnabled,
  analyzeSheetPng,
  checkOllamaHealth,
  type VisionSheetData,
} from '../lib/blueprint-pdf/vision.js';
import {
  mergeSheetExtraction,
  selectVisionPages,
  emptyMergeStats,
  accumulateMergeStats,
} from '../lib/blueprint-pdf/merge-vision.js';
import type { SheetExtractedData } from '../lib/blueprint-pdf/parse-sheets.js';
import { EMPTY_TITLE_BLOCK } from '../lib/blueprint-pdf/title-block.js';

// ─── Helpers ────────────────────────────────────────────────────────────────────

const EMPTY_FLAGS: SheetExtractedData['flags'] = {
  has_solar_ready: false, has_hers_verification: false, has_title24: false,
  has_calgreen: false, has_wildfire_zone: false, has_seismic_design: false,
  seismic_category: null, has_ess: false, has_propane_gas: false, has_natural_gas: false,
  has_exit_signage: false, has_accessibility: false,
};

function parserSheet(overrides: Partial<SheetExtractedData> = {}): SheetExtractedData {
  return {
    detected_discipline: 'architectural',
    schedules: {},
    flags: { ...EMPTY_FLAGS },
    components: [],
    raw_callouts: [],
    title_block: { ...EMPTY_TITLE_BLOCK },
    ...overrides,
  };
}

function emptyVision(overrides: Partial<VisionSheetData> = {}): VisionSheetData {
  return { schedules: {}, flags: {}, components: [], title_block: {}, ...overrides };
}

// Ollama /api/chat reply wrapping a model JSON payload.
function ollamaReply(payload: unknown): Response {
  return new Response(
    JSON.stringify({ message: { content: JSON.stringify(payload) } }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
}

const PNG = Buffer.from('fake-png');

// ─── Env gate ───────────────────────────────────────────────────────────────────

describe('visionEnabled', () => {
  const orig = process.env.BLUEPRINT_VISION_ENABLED;
  afterEach(() => {
    if (orig === undefined) delete process.env.BLUEPRINT_VISION_ENABLED;
    else process.env.BLUEPRINT_VISION_ENABLED = orig;
  });

  it('is off when unset', () => {
    delete process.env.BLUEPRINT_VISION_ENABLED;
    expect(visionEnabled()).toBe(false);
  });

  it('accepts 1 and true', () => {
    process.env.BLUEPRINT_VISION_ENABLED = '1';
    expect(visionEnabled()).toBe(true);
    process.env.BLUEPRINT_VISION_ENABLED = 'true';
    expect(visionEnabled()).toBe(true);
    process.env.BLUEPRINT_VISION_ENABLED = 'no';
    expect(visionEnabled()).toBe(false);
  });
});

// ─── analyzeSheetPng — validation + failure modes ──────────────────────────────

describe('analyzeSheetPng', () => {
  beforeEach(() => { vi.stubGlobal('fetch', vi.fn()); });
  afterEach(() => { vi.unstubAllGlobals(); });
  const fetchMock = () => fetch as unknown as ReturnType<typeof vi.fn>;

  it('parses a valid response into VisionSheetData', async () => {
    fetchMock().mockResolvedValue(ollamaReply({
      discipline: 'electrical',
      windows: [{ mark: 'A', dimension: `6'-0" x 4'-0"`, type: 'SLIDING', notes: null }],
      panels: [{ amperage: 200 }],
      fixtures: ['gfci_outlet', 'smoke_detector'],
      components: ['engineered_trusses'],
      flags: { has_natural_gas: true },
      seismic_category: 'D1',
      title_block: { city: 'madison', state: 'wi', zip: '53527', lot_number: '25' },
    }));

    const res = await analyzeSheetPng(PNG);
    expect(res).not.toBeNull();
    expect(res!.data.detected_discipline).toBe('electrical');
    expect(res!.data.schedules.windows).toHaveLength(1);
    expect(res!.data.schedules.panels).toEqual([{ amperage: 200 }]);
    expect(res!.data.schedules.fixtures?.map((f) => f.type).sort())
      .toEqual(['gfci_outlet', 'smoke_detector']);
    expect(res!.data.schedules.fixtures?.[0].notes).toBe('vision');
    expect(res!.data.components).toEqual(['engineered_trusses']);
    // Flags are NOT taken from vision (the parser owns flags) — always empty.
    expect(res!.data.flags).toEqual({});
    // Title block normalized: city/state uppercased
    expect(res!.data.title_block.city).toBe('MADISON');
    expect(res!.data.title_block.state).toBe('WI');
    expect(res!.data.title_block.zip).toBe('53527');
    expect(res!.tokens_stripped).toBe(0);

    // Request sanity: chat endpoint, model + base64 image present
    const [url, init] = fetchMock().mock.calls[0];
    expect(String(url)).toContain('/api/chat');
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.stream).toBe(false);
    expect(body.options.temperature).toBe(0);
    expect(body.messages[0].images[0]).toBe(PNG.toString('base64'));
  });

  it('strips hallucinated enum tokens but keeps known ones', async () => {
    fetchMock().mockResolvedValue(ollamaReply({
      fixtures: ['gfci_outlet', 'laser_grid'],
      components: ['engineered_trusses', 'unicorn_beam', 'vinyl_siding'],
    }));

    const res = await analyzeSheetPng(PNG);
    expect(res!.data.schedules.fixtures?.map((f) => f.type)).toEqual(['gfci_outlet']);
    expect(res!.data.components.sort()).toEqual(['engineered_trusses', 'vinyl_siding']);
    expect(res!.tokens_stripped).toBe(2);
  });

  it('drops a field with bad types via .catch but keeps the rest of the sheet', async () => {
    fetchMock().mockResolvedValue(ollamaReply({
      panels: [{ amperage: 'two hundred' }],       // invalid → panels dropped wholesale
      windows: [{ mark: 'B', dimension: '30"', type: 'FIXED', notes: null }],
      seismic_category: 'X9',                       // invalid pattern → dropped
      flags: { has_title24: 'yes' },                // non-boolean → caught to false
    }));

    const res = await analyzeSheetPng(PNG);
    expect(res).not.toBeNull();
    expect(res!.data.schedules.panels).toBeUndefined();
    expect(res!.data.schedules.windows).toHaveLength(1);
    expect(res!.data.flags).toEqual({});   // flags never surface from vision
  });

  it('drops over-eager non-room labels (drawing elements / orientation)', async () => {
    fetchMock().mockResolvedValue(ollamaReply({
      rooms: [
        { name: 'BEDROOM #2', dimensions: null },
        { name: 'VALENTINE CEILING', dimensions: null },   // drawing element → dropped
        { name: 'WEST ENDWALL', dimensions: null },        // wall label → dropped
        { name: 'FRONT', dimensions: null },               // orientation → dropped
        { name: 'KITCHEN', dimensions: null },
      ],
    }));
    const res = await analyzeSheetPng(PNG);
    expect(res!.data.schedules.rooms?.map((r) => r.name)).toEqual(['BEDROOM #2', 'KITCHEN']);
  });

  it('pole_barn: injects the post-frame prompt hint AND strips stick-frame components', async () => {
    fetchMock().mockResolvedValue(ollamaReply({
      components: ['engineered_trusses', 'i_joists', 'lvl_beam', 'floor_joists',
        'wall_girts', 'roof_purlins', 'metal_roofing', 'wood_studs'],
    }));
    const res = await analyzeSheetPng(PNG, { buildingType: 'pole_barn' });
    // engineered_trusses/i_joists/lvl_beam/floor_joists stripped (incompatible); rest kept
    // (wood_studs stays — a pole barn can have interior partition studs).
    expect(res!.data.components.sort())
      .toEqual(['metal_roofing', 'roof_purlins', 'wall_girts', 'wood_studs']);
    // #1: the request prompt carried the building-type hint
    const body = JSON.parse((fetchMock().mock.calls[0][1] as RequestInit).body as string);
    expect(body.messages[0].content).toContain('POST-FRAME');
  });

  it('drops all-null schedule rows (structured-output filler)', async () => {
    fetchMock().mockResolvedValue(ollamaReply({
      windows: [{ mark: null, dimension: null, type: null, notes: null }],
    }));
    const res = await analyzeSheetPng(PNG);
    expect(res!.data.schedules.windows).toBeUndefined();
  });

  it('returns null on malformed JSON content', async () => {
    fetchMock().mockResolvedValue(new Response(
      JSON.stringify({ message: { content: '{"discipline": "electr' } }), { status: 200 }));
    expect(await analyzeSheetPng(PNG)).toBeNull();
  });

  it('returns null on non-200', async () => {
    fetchMock().mockResolvedValue(new Response('model not found', { status: 404 }));
    expect(await analyzeSheetPng(PNG)).toBeNull();
  });

  it('returns null on network error / timeout — never throws', async () => {
    fetchMock().mockRejectedValue(new DOMException('This operation was aborted', 'AbortError'));
    await expect(analyzeSheetPng(PNG)).resolves.toBeNull();
  });

  it('returns null on an empty response body', async () => {
    fetchMock().mockResolvedValue(new Response(JSON.stringify({ message: {} }), { status: 200 }));
    expect(await analyzeSheetPng(PNG)).toBeNull();
  });
});

describe('checkOllamaHealth', () => {
  beforeEach(() => { vi.stubGlobal('fetch', vi.fn()); });
  afterEach(() => { vi.unstubAllGlobals(); });

  it('true on 200, false on error', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(new Response('{}', { status: 200 }));
    expect(await checkOllamaHealth()).toBe(true);
    (fetch as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('ECONNREFUSED'));
    expect(await checkOllamaHealth()).toBe(false);
  });
});

// ─── mergeSheetExtraction — parser wins, vision adds ────────────────────────────

describe('mergeSheetExtraction', () => {
  it('parser owns flags — vision flags are ignored (no false positives injected)', () => {
    const parser = parserSheet({ flags: { ...EMPTY_FLAGS, has_title24: true } });
    // Even if a caller hands vision flags, the merge must not adopt them.
    const { merged, stats } = mergeSheetExtraction(parser, emptyVision({
      flags: { has_title24: true, has_natural_gas: true, has_seismic_design: true, seismic_category: 'A' },
    }));
    expect(merged.flags.has_title24).toBe(true);            // parser's own flag, unchanged
    expect(merged.flags.has_natural_gas).toBe(false);        // vision-only → NOT adopted
    expect(merged.flags.has_seismic_design).toBe(false);     // the WI false-positive class → gone
    expect(merged.flags.seismic_category).toBeNull();
    expect(stats.flags_set).toEqual([]);
  });

  it('window mark collision → parser row wins; new marks append', () => {
    const parser = parserSheet({ schedules: { windows: [
      { mark: 'A', dimension: `6'-0" x 4'-0"`, type: 'SLIDING', notes: null },
    ] } });
    const { merged, stats } = mergeSheetExtraction(parser, emptyVision({ schedules: { windows: [
      { mark: 'A', dimension: 'WRONG', type: 'FIXED', notes: null },     // collision — dropped
      { mark: 'B', dimension: '30" x 30"', type: 'FIXED', notes: null }, // new — added
    ] } }));
    expect(merged.schedules.windows).toHaveLength(2);
    expect(merged.schedules.windows![0].dimension).toBe(`6'-0" x 4'-0"`); // parser row intact
    expect(stats.window_rows_added).toBe(1);
  });

  it('null-mark rows dedupe by dimension|type', () => {
    const parser = parserSheet({ schedules: { doors: [
      { mark: null, dimension: `3'-0"`, type: 'SWINGING', notes: null },
    ] } });
    const { merged, stats } = mergeSheetExtraction(parser, emptyVision({ schedules: { doors: [
      { mark: null, dimension: `3'-0"`, type: 'SWINGING', notes: 'dup' },  // same key — dropped
      { mark: null, dimension: `8'-0"`, type: 'OVERHEAD', notes: null },   // new
    ] } }));
    expect(merged.schedules.doors).toHaveLength(2);
    expect(stats.door_rows_added).toBe(1);
  });

  it('rooms dedupe by upper-cased name; panels by amperage; fixtures by type', () => {
    const parser = parserSheet({ schedules: {
      rooms: [{ name: 'BEDROOM #2', dimensions: null }],
      panels: [{ amperage: 200 }],
      fixtures: [{ type: 'gfci_outlet', count_estimate: null, notes: 'symbol present in legend' }],
    } });
    const { merged, stats } = mergeSheetExtraction(parser, emptyVision({ schedules: {
      rooms: [{ name: 'Bedroom #2', dimensions: null }, { name: '2 CAR GARAGE', dimensions: null }],
      panels: [{ amperage: 200 }, { amperage: 100 }],
      fixtures: [
        { type: 'gfci_outlet', count_estimate: null, notes: 'vision' },
        { type: 'smoke_detector', count_estimate: null, notes: 'vision' },
      ],
    } }));
    expect(merged.schedules.rooms).toHaveLength(2);
    expect(merged.schedules.panels).toHaveLength(2);
    expect(merged.schedules.fixtures).toHaveLength(2);
    expect(stats.room_rows_added).toBe(1);
    expect(stats.panel_rows_added).toBe(1);
    expect(stats.fixtures_added).toEqual(['smoke_detector']);
  });

  it('components set-union with stats', () => {
    const parser = parserSheet({ components: ['concrete_footing'] });
    const { merged, stats } = mergeSheetExtraction(parser, emptyVision({
      components: ['concrete_footing', 'wall_girts'],
    }));
    expect(merged.components.sort()).toEqual(['concrete_footing', 'wall_girts']);
    expect(stats.components_added).toEqual(['wall_girts']);
  });

  it('title_block: vision fills only null fields — parser stays authoritative', () => {
    const parser = parserSheet({ title_block: { ...EMPTY_TITLE_BLOCK, zip: '53527', city: 'MADISON' } });
    const { merged, stats } = mergeSheetExtraction(parser, emptyVision({
      title_block: { zip: '53521', lot_number: '25' },   // zip collides (parser wins), lot fills
    }));
    expect(merged.title_block.zip).toBe('53527');
    expect(merged.title_block.lot_number).toBe('25');
    expect(stats.title_block_fields_filled).toEqual(['lot_number']);
  });

  it('accumulateMergeStats sums counts and unions token lists', () => {
    const total = emptyMergeStats();
    accumulateMergeStats(total, { ...emptyMergeStats(), window_rows_added: 2, components_added: ['wall_girts'] });
    accumulateMergeStats(total, { ...emptyMergeStats(), window_rows_added: 3, components_added: ['wall_girts', 'lvl_beam'] });
    expect(total.window_rows_added).toBe(5);
    expect(total.components_added.sort()).toEqual(['lvl_beam', 'wall_girts']);
  });
});

// ─── selectVisionPages ──────────────────────────────────────────────────────────

describe('selectVisionPages', () => {
  const page = (n: number) => ({ page_number: n });

  it('prioritizes low-yield trade sheets over high-yield civil, respects cap, ascending order', () => {
    const pages = [page(1), page(2), page(3), page(4)];
    const perSheet = [
      // p1: civil, rich parser yield → 1 (+1 first page) = 2
      parserSheet({ detected_discipline: 'civil', components: ['concrete_footing', 'anchor_bolts'],
        schedules: { rooms: [{ name: 'SITE', dimensions: null }] } }),
      // p2: electrical, low yield → 3 + 2 = 5
      parserSheet({ detected_discipline: 'electrical' }),
      // p3: mechanical, low yield → 2 + 2 = 4
      parserSheet({ detected_discipline: 'mechanical' }),
      // p4: architectural, rich yield → 3
      parserSheet({ detected_discipline: 'architectural',
        schedules: { windows: [{ mark: 'A', dimension: null, type: null, notes: 'x' }] },
        components: ['wood_studs', 'roof_sheathing'] }),
    ];
    expect(selectVisionPages(pages, perSheet, 2)).toEqual([1, 2]);   // p2 (5) + p3 (4), ascending
    expect(selectVisionPages(pages, perSheet, 10)).toEqual([0, 1, 2, 3]);
    expect(selectVisionPages(pages, perSheet, 0)).toEqual([]);
  });

  it('first page gets the title-block bonus', () => {
    const pages = [page(1), page(2)];
    const perSheet = [
      parserSheet({ detected_discipline: 'civil' }),   // 1 + 2 (low yield) + 1 (first) = 4
      parserSheet({ detected_discipline: 'civil' }),   // 1 + 2 = 3
    ];
    expect(selectVisionPages(pages, perSheet, 1)).toEqual([0]);
  });
});
