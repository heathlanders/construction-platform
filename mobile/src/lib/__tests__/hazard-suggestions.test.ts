// hazard-suggestions.test.ts — JSA hazard suggestions (Trade Knowledge Packs, Wave S1).
// Active-trade selection, provenance mapping, and the offline cache fallback.

const mockStore: Record<string, string> = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async (k: string) => mockStore[k] ?? null),
    setItem: jest.fn(async (k: string, v: string) => { mockStore[k] = v; }),
  },
}));
const mockApi = jest.fn();
jest.mock('../api', () => ({ mobileApi: (...a: unknown[]) => mockApi(...a) }));

import { tradesActiveOn, toJsaHazard, loadHazardSuggestions, type ApiHazard } from '../hazard-suggestions';

const HZ: ApiHazard = {
  hazard_id: 'decks.fall_edge', trade: 'decks', pack_version: '1.0.0',
  hazard: null, hazard_en: 'Fall from the deck edge', controls: null, controls_en: ['Guardrails at 6 ft', 'Cover holes'],
  osha_ref: '1926.501(b)(13)', severity: 4, severity_label: 'critical', ppe: ['harness'], es_pending: true,
};

describe('tradesActiveOn', () => {
  const tasks = [
    { trade_type: 'decks', status: 'not_started', planned_start: '2026-10-08', planned_end: '2026-10-10' },
    { trade_type: 'roofing', status: 'in_progress', planned_start: '2026-09-01', planned_end: '2026-09-02' },
    { trade_type: 'painting', status: 'not_started', planned_start: '2026-11-01', planned_end: null },
    { trade_type: 'decks', status: 'not_started', planned_start: '2026-10-08', planned_end: null },
    { trade_type: null, status: 'in_progress', planned_start: null, planned_end: null },
  ];
  it('keeps trades whose window covers the day or that are in progress, deduped', () => {
    expect(tradesActiveOn(tasks, '2026-10-09').sort()).toEqual(['decks', 'roofing']);
  });
  it('a single-day task with no end date only counts on its start day', () => {
    expect(tradesActiveOn(tasks.slice(3, 4), '2026-10-08')).toEqual(['decks']);
    expect(tradesActiveOn(tasks.slice(3, 4), '2026-10-09')).toEqual([]);
  });
});

describe('toJsaHazard', () => {
  it('falls back to English when Spanish is pending and keeps provenance', () => {
    expect(toJsaHazard(HZ)).toEqual({
      description: 'Fall from the deck edge', controls: 'Guardrails at 6 ft; Cover holes', severity: 'critical',
      osha_ref: '1926.501(b)(13)', hazard_id: 'decks.fall_edge', pack_version: '1.0.0', source: 'pack', ppe: ['harness'],
    });
  });
});

describe('loadHazardSuggestions', () => {
  beforeEach(() => { mockApi.mockReset(); for (const k of Object.keys(mockStore)) delete mockStore[k]; });

  it('fetches active trades then their hazards and caches the result', async () => {
    mockApi.mockResolvedValueOnce({ schedule_tasks: [{ trade_type: 'decks', status: 'in_progress', planned_start: null, planned_end: null }] })
       .mockResolvedValueOnce({ hazards: [HZ] });
    const r = await loadHazardSuggestions('p1', '2026-10-08', 'es');
    expect(mockApi.mock.calls[1][0]).toContain('/trades/hazards?keys=decks&lang=es');
    expect(r).toEqual({ hazards: [HZ], trades: ['decks'], fromCache: false });
    expect(mockStore['opt:hazards:p1:2026-10-08:es']).toBeDefined();
  });

  it('offline → returns the cached result, flagged fromCache', async () => {
    mockStore['opt:hazards:p1:2026-10-08:en'] = JSON.stringify({ hazards: [HZ], trades: ['decks'], fromCache: false });
    mockApi.mockRejectedValue(new Error('Network request failed'));
    const r = await loadHazardSuggestions('p1', '2026-10-08', 'en');
    expect(r.fromCache).toBe(true);
    expect(r.hazards).toHaveLength(1);
  });

  it('offline with no cache → throws', async () => {
    mockApi.mockRejectedValue(new Error('Network request failed'));
    await expect(loadHazardSuggestions('p2', '2026-10-08', 'en')).rejects.toThrow();
  });

  it('no active trades → no hazard call', async () => {
    mockApi.mockResolvedValueOnce({ schedule_tasks: [] });
    const r = await loadHazardSuggestions('p3', '2026-10-08', 'en');
    expect(r.trades).toEqual([]);
    expect(mockApi).toHaveBeenCalledTimes(1);
  });
});
