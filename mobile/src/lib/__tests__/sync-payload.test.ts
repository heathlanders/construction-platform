// sync-payload.test.ts — batch sync push payload assembly + conflict routing.
// Mobile Enterprise Plan §B2/§C1. Pure logic — no WatermelonDB, no network.

import {
  buildPushPayload, indexConflicts, conflictKey, nextLocalVersion,
  type PendingRow, type PushConflict,
} from '../sync-payload';
import { uuidv4 } from '../uuid';

function row(over: Partial<PendingRow> = {}): PendingRow {
  return {
    local_id: 'local-1',
    server_id: 'srv-1',
    version: 3,
    never_synced: false,
    is_deleted: false,
    fields: { hours_worked: 8 },
    ...over,
  };
}

describe('buildPushPayload', () => {
  it('classifies a never-synced row as created and carries the client id', () => {
    const { payload, index, count } = buildPushPayload({
      time_entries: [row({ never_synced: true, version: 1 })],
    });
    expect(count).toBe(1);
    expect(payload.changes.time_entries.created).toEqual([{ id: 'srv-1', hours_worked: 8 }]);
    expect(payload.changes.time_entries.updated).toEqual([]);
    // No `version` on a create — the server inserts at the default.
    expect(payload.changes.time_entries.created[0].version).toBeUndefined();
    expect(index.get(conflictKey('time_entries', 'srv-1'))).toEqual({
      table: 'time_entries', local_id: 'local-1', outcome: 'created',
    });
  });

  it('classifies a synced row as updated and sends the version (T-12)', () => {
    const { payload, index } = buildPushPayload({ time_entries: [row()] });
    expect(payload.changes.time_entries.updated).toEqual([{ id: 'srv-1', version: 3, hours_worked: 8 }]);
    expect(index.get(conflictKey('time_entries', 'srv-1'))!.outcome).toBe('updated');
  });

  it('sends a locally-deleted synced row as a delete', () => {
    const { payload, index } = buildPushPayload({ time_entries: [row({ is_deleted: true })] });
    expect(payload.changes.time_entries.deleted).toEqual(['srv-1']);
    expect(payload.changes.time_entries.created).toEqual([]);
    expect(index.get(conflictKey('time_entries', 'srv-1'))!.outcome).toBe('deleted');
  });

  it('drops a never-synced local delete entirely (nothing on the server)', () => {
    const { payload, count } = buildPushPayload({
      time_entries: [row({ is_deleted: true, never_synced: true })],
    });
    expect(count).toBe(0);
    expect(payload.changes.time_entries).toBeUndefined();
  });

  it('skips a row with no server_id instead of pushing a bad create', () => {
    const { count, payload } = buildPushPayload({ time_entries: [row({ server_id: '' })] });
    expect(count).toBe(0);
    expect(payload.changes).toEqual({});
  });

  it('drops undefined fields but keeps explicit nulls (clearing a value)', () => {
    const { payload } = buildPushPayload({
      time_entries: [row({ fields: { notes: null, cost_code_id: undefined, hours_worked: 4 } })],
    });
    expect(payload.changes.time_entries.updated[0]).toEqual({
      id: 'srv-1', version: 3, notes: null, hours_worked: 4,
    });
  });

  it('folds every table into one payload and omits tables with no changes', () => {
    const { payload, count } = buildPushPayload({
      time_entries: [row()],
      daily_reports: [row({ local_id: 'local-2', server_id: 'srv-2', never_synced: true })],
      punch_list_items: [],
    });
    expect(count).toBe(2);
    expect(Object.keys(payload.changes).sort()).toEqual(['daily_reports', 'time_entries']);
  });

  it('keys the index per table so same-id rows in different tables do not collide', () => {
    const { index } = buildPushPayload({
      time_entries: [row({ local_id: 'a', server_id: 'same' })],
      punch_list_items: [row({ local_id: 'b', server_id: 'same' })],
    });
    expect(index.get(conflictKey('time_entries', 'same'))!.local_id).toBe('a');
    expect(index.get(conflictKey('punch_list_items', 'same'))!.local_id).toBe('b');
  });
});

describe('indexConflicts', () => {
  it('maps conflicts back by table:id and leaves applied rows unmatched', () => {
    const conflicts: PushConflict[] = [
      { table: 'time_entries', id: 'srv-1', conflict_type: 'version_conflict', server_record: { id: 'srv-1', version: 9 } },
      { table: 'safety_incidents', id: 'srv-2', conflict_type: 'safety_blocked', server_record: { id: 'srv-2', version: 2 } },
      { table: 'time_entries', id: 'srv-3', conflict_type: 'forbidden' },
    ];
    const m = indexConflicts(conflicts);
    expect(m.get(conflictKey('time_entries', 'srv-1'))!.conflict_type).toBe('version_conflict');
    expect(m.get(conflictKey('safety_incidents', 'srv-2'))!.conflict_type).toBe('safety_blocked');
    expect(m.get(conflictKey('time_entries', 'srv-3'))!.server_record).toBeUndefined();
    expect(m.get(conflictKey('time_entries', 'srv-9'))).toBeUndefined();
  });
});

describe('nextLocalVersion', () => {
  it('mirrors the server: update bumps, create stays at the inserted version', () => {
    expect(nextLocalVersion('updated', 3)).toBe(4);
    expect(nextLocalVersion('deleted', 3)).toBe(4);
    expect(nextLocalVersion('created', 1)).toBe(1);
  });
});

describe('uuidv4', () => {
  it('emits RFC-4122 v4 shape', () => {
    for (let i = 0; i < 50; i++) {
      expect(uuidv4()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    }
  });

  it('does not repeat', () => {
    const seen = new Set(Array.from({ length: 2000 }, () => uuidv4()));
    expect(seen.size).toBe(2000);
  });
});
