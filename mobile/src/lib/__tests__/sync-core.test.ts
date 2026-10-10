// sync-core.test.ts — the sync ENGINE against a fake local DB and a fake server (§C2).
//
// `sync-payload.test.ts` covers the pure payload maths; this covers the orchestration
// that had zero coverage and where every real bug lived: version mirroring, conflict
// routing by tier, delete propagation, the cursor not advancing past a failed apply,
// and `forbidden` rows not being retried forever.

import { jest } from '@jest/globals';

// ─── Fakes ────────────────────────────────────────────────────────────────────
// A minimal in-memory stand-in for the WatermelonDB surface sync-core actually uses:
// collections.get(table).query(...).fetch(), collection.create(fn), record.update(fn).

interface Row { id: string; [k: string]: unknown; update: (fn: (r: Row) => void) => Promise<void> }

const mockTables: Record<string, Row[]> = {};
let mockLocalIdSeq = 0;

function mockMakeRow(table: string, fields: Record<string, unknown>): Row {
  const row: Row = {
    id: `local-${++mockLocalIdSeq}`,
    ...fields,
    update: async (fn: (r: Row) => void) => { fn(row); },
  };
  mockTables[table] = mockTables[table] ?? [];
  mockTables[table].push(row);
  return row;
}

type Pred = { field: string; value: unknown };

jest.mock('@nozbe/watermelondb', () => ({
  Q: { where: (field: string, value: unknown): Pred => ({ field, value }) },
  Model: class {},
}));

jest.mock('../database', () => ({
  database: {
    write: async (fn: () => Promise<void>) => fn(),
    collections: {
      get: (table: string) => ({
        query: (...preds: Pred[]) => ({
          fetch: async () =>
            (mockTables[table] ?? []).filter((r) => preds.every((p) => r[p.field] === p.value)),
        }),
        create: async (fn: (r: Row) => void) => {
          const row = mockMakeRow(table, {});
          fn(row);
          return row;
        },
      }),
    },
  },
}));

const mockStorage: Record<string, string> = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: async (k: string) => mockStorage[k] ?? null,
    setItem: async (k: string, v: string) => { mockStorage[k] = v; },
    removeItem: async (k: string) => { delete mockStorage[k]; },
  },
}));

// The API: each test sets `mockPushResponse` / `mockPullResponse`.
let mockPushBody: Record<string, unknown> | null = null;
let mockPushResponse: unknown = { conflicts: [] };
let mockPullResponse: unknown = { changes: {}, timestamp: '2026-07-27T00:00:00.000Z' };
let mockPushShouldThrow = false;

jest.mock('../api', () => ({
  mobileApi: async (path: string, opts?: { method?: string; body?: string }) => {
    if (path === '/sync/push') {
      if (mockPushShouldThrow) throw new Error('Network request failed');
      mockPushBody = JSON.parse(opts?.body ?? '{}');
      return mockPushResponse;
    }
    if (path.startsWith('/sync/pull')) return mockPullResponse;
    throw new Error(`unexpected path ${path}`);
  },
  ApiError: class ApiError extends Error {},
}));

const mockStashed: Record<string, unknown> = {};
jest.mock('../conflicts', () => ({
  saveConflictFor: async (table: string, localId: string, server: unknown) => {
    mockStashed[`${table}:${localId}`] = server;
  },
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { pushAll, pullAll } = require('../sync-core') as typeof import('../sync-core');

beforeEach(() => {
  for (const k of Object.keys(mockTables)) delete mockTables[k];
  for (const k of Object.keys(mockStorage)) delete mockStorage[k];
  for (const k of Object.keys(mockStashed)) delete mockStashed[k];
  mockPushBody = null;
  mockPushResponse = { conflicts: [] };
  mockPullResponse = { changes: {}, timestamp: '2026-07-27T00:00:00.000Z' };
  mockPushShouldThrow = false;
});

function pendingTimeEntry(over: Partial<Row> = {}): Row {
  return mockMakeRow('time_entries', {
    project_id: 'p1', user_id: 'u1', date: '2026-07-20', hours_worked: 8,
    cost_code_id: null, budget_line_item_id: null, hourly_rate_cents: 5000, notes: null,
    server_id: '', version: 1, sync_status: 'pending', synced_at: null, is_deleted: false,
    ...over,
  });
}

describe('pushAll', () => {
  it('mints a server_id before the first push so creates are idempotent', async () => {
    const rec = pendingTimeEntry();
    await pushAll();

    expect(rec.server_id).toMatch(/^[0-9a-f-]{36}$/);
    const created = (mockPushBody as any).changes.time_entries.created;
    expect(created).toHaveLength(1);
    expect(created[0].id).toBe(rec.server_id); // client-minted id goes on the wire
    expect(rec.sync_status).toBe('synced');
  });

  it('mirrors the server version bump on an accepted UPDATE', async () => {
    const rec = pendingTimeEntry({ server_id: 'srv-1', version: 3, synced_at: 'yesterday' });
    await pushAll();

    // Server does version+1; mirroring it keeps the next push from being stale.
    expect(rec.version).toBe(4);
    expect(rec.sync_status).toBe('synced');
    expect((mockPushBody as any).changes.time_entries.updated[0].version).toBe(3);
  });

  it('propagates a local delete of a previously-synced row', async () => {
    const rec = pendingTimeEntry({ server_id: 'srv-2', synced_at: 'yesterday', is_deleted: true });
    await pushAll();

    expect((mockPushBody as any).changes.time_entries.deleted).toEqual(['srv-2']);
    expect(rec.sync_status).toBe('synced');
  });

  it('leaves everything pending when the request fails (offline)', async () => {
    mockPushShouldThrow = true;
    const rec = pendingTimeEntry();
    await pushAll();

    expect(rec.sync_status).toBe('pending'); // retried next sweep, nothing lost
  });

  it('routes a Tier-2 version_conflict to the resolve inbox', async () => {
    const rec = pendingTimeEntry({ server_id: 'srv-3', version: 2, synced_at: 'yesterday' });
    mockPushResponse = {
      conflicts: [{
        table: 'time_entries', id: 'srv-3', conflict_type: 'version_conflict',
        server_record: { id: 'srv-3', version: 9, hours_worked: 10 },
      }],
    };
    await pushAll();

    expect(rec.sync_status).toBe('conflict');
    expect(mockStashed['time_entries:' + rec.id]).toMatchObject({ version: 9 });
    expect(rec.version).toBe(2); // NOT bumped — the write never landed
  });

  it('Tier-1 (daily reports) adopts the server version and asks for one retry', async () => {
    const rec = mockMakeRow('daily_reports', {
      project_id: 'p1', report_date: '2026-07-20', notes: 'mine', conditions: null,
      server_id: 'srv-4', version: 2, sync_status: 'pending', synced_at: 'yesterday', is_deleted: false,
    });
    mockPushResponse = {
      conflicts: [{
        table: 'daily_reports', id: 'srv-4', conflict_type: 'version_conflict',
        server_record: { id: 'srv-4', version: 7 },
      }],
    };
    const retry = await pushAll();

    expect(retry).toBe(true);            // caller re-pushes immediately (last-write-wins)
    expect(rec.version).toBe(7);         // re-based on the server
    expect(rec.sync_status).toBe('pending');
    expect(mockStashed['daily_reports:' + rec.id]).toBeUndefined(); // no resolve UI for Tier 1
  });

  it('parks a `forbidden` row instead of retrying it forever', async () => {
    const rec = pendingTimeEntry({ server_id: 'srv-5', synced_at: 'yesterday' });
    mockPushResponse = {
      conflicts: [{ table: 'time_entries', id: 'srv-5', conflict_type: 'forbidden' }],
    };
    await pushAll();
    expect(rec.sync_status).toBe('pending');
    expect(mockStashed['time_entries:' + rec.id]).toBeUndefined(); // nothing to resolve against

    // A second sweep must NOT re-send it — retrying an ownership refusal can't succeed.
    mockPushBody = null;
    mockPushResponse = { conflicts: [] };
    await pushAll();
    expect(mockPushBody).toBeNull(); // no request at all: nothing left to push
  });
});

describe('pullAll', () => {
  it('creates rows from the delta and advances the cursor', async () => {
    mockPullResponse = {
      changes: {
        time_entries: {
          created: [{ id: 'srv-9', project_id: 'p1', user_id: 'u1', date: '2026-07-21', hours_worked: 6, version: 1 }],
          updated: [], deleted: [],
        },
      },
      timestamp: '2026-07-27T10:00:00.000Z',
    };
    await pullAll();

    expect(mockTables.time_entries).toHaveLength(1);
    expect(mockTables.time_entries[0].server_id).toBe('srv-9');
    expect(mockStorage['sync:lastPulledAt:v2']).toBe('2026-07-27T10:00:00.000Z');
  });

  it('never clobbers a locally-dirty row', async () => {
    const rec = pendingTimeEntry({ server_id: 'srv-10', hours_worked: 8, synced_at: 'yesterday' });
    mockPullResponse = {
      changes: {
        time_entries: {
          created: [], deleted: [],
          updated: [{ id: 'srv-10', project_id: 'p1', user_id: 'u1', date: '2026-07-21', hours_worked: 99, version: 5 }],
        },
      },
      timestamp: '2026-07-27T11:00:00.000Z',
    };
    await pullAll();

    expect(rec.hours_worked).toBe(8); // the worker's unsynced edit survives
  });

  it('soft-deletes rows the server removed', async () => {
    const rec = pendingTimeEntry({ server_id: 'srv-11', sync_status: 'synced', synced_at: 'x' });
    mockPullResponse = {
      changes: { time_entries: { created: [], updated: [], deleted: ['srv-11'] } },
      timestamp: '2026-07-27T12:00:00.000Z',
    };
    await pullAll();

    expect(rec.is_deleted).toBe(true);
  });

  it('does NOT advance the cursor when a table fails to apply', async () => {
    mockStorage['sync:lastPulledAt:v2'] = 'OLD';
    mockPullResponse = {
      changes: {
        // A row that blows up while being applied (here: reading `version` throws).
        // That delta must be retried, so the cursor has to stay put — otherwise the
        // whole batch is skipped forever.
        time_entries: {
          created: [{ id: 'srv-12', get version(): number { throw new Error('boom'); } }],
          updated: [], deleted: [],
        },
      },
      timestamp: '2026-07-27T13:00:00.000Z',
    };
    await pullAll();

    expect(mockStorage['sync:lastPulledAt:v2']).toBe('OLD');
  });

  it('ignores tables the client does not register', async () => {
    mockPullResponse = {
      // `bid_packages` is a server table the mobile client deliberately doesn't register.
      // (This used to be `jsa_records` — which became a real offline table, so the test
      // was asserting nothing until it started failing. Pick a table mobile won't want.)
      changes: { bid_packages: { created: [{ id: 'x', version: 1 }], updated: [], deleted: [] } },
      timestamp: '2026-07-27T14:00:00.000Z',
    };
    await pullAll();

    expect(mockTables.bid_packages).toBeUndefined();
    expect(mockStorage['sync:lastPulledAt:v2']).toBe('2026-07-27T14:00:00.000Z');
  });
});
