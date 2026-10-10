// lib/sync-payload.ts — pure payload assembly + conflict routing for the batch
// sync protocol (`POST /v1/sync/push`). No WatermelonDB, no fetch, no AsyncStorage
// — everything here is unit-testable in plain node (Mobile Enterprise Plan §C1).
//
// Protocol notes (server: api/src/routes/v1/sync.ts):
//   • `changes[table].created[]` rows carry a CLIENT-generated `id`. The server
//     inserts with `ON CONFLICT (id) DO NOTHING`, so re-pushing an already-applied
//     create is a no-op — that idempotency is why the client mints the id up front
//     (and why the old "shared-id rework" blocker doesn't exist).
//   • `changes[table].updated[]` rows carry `id` + `version` (T-12 optimistic lock).
//   • the response is `{ conflicts: [{table, id, conflict_type, server_record?}] }`
//     — silence means applied.

export type PushConflictType = 'version_conflict' | 'safety_blocked' | 'forbidden';

export interface PushConflict {
  table: string;
  id: string;
  conflict_type: PushConflictType;
  server_record?: Record<string, unknown>;
}

export interface TableChanges {
  created: Record<string, unknown>[];
  updated: Record<string, unknown>[];
  deleted: string[];
}

export interface PushPayload {
  changes: Record<string, TableChanges>;
}

/** A local pending record, flattened to what the protocol needs. */
export interface PendingRow {
  /** WatermelonDB local id — how we map a conflict back to the local record. */
  local_id: string;
  /** Server UUID. Minted client-side before the first push. */
  server_id: string;
  version: number;
  /** True until the row has been accepted by the server at least once. */
  never_synced: boolean;
  is_deleted: boolean;
  /** Column → value. `undefined` values are dropped; `null` is a real value. */
  fields: Record<string, unknown>;
}

/** Where a pushed row ended up, so the caller can mark the local record. */
export type PushOutcome = 'created' | 'updated' | 'deleted';

export interface PushIndexEntry {
  table: string;
  local_id: string;
  outcome: PushOutcome;
}

function dropUndefined(fields: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) if (v !== undefined) out[k] = v;
  return out;
}

export function conflictKey(table: string, serverId: string): string {
  return `${table}:${serverId}`;
}

/**
 * Fold pending rows from every table into ONE push payload.
 *
 * Classification:
 *   deleted     — locally deleted AND previously synced (a never-synced local
 *                 delete has nothing on the server, so it is dropped entirely)
 *   created     — never synced
 *   updated     — everything else (carries `version` for the T-12 check)
 *
 * Returns the payload plus an index keyed `table:server_id` so the caller can map
 * the server's `conflicts[]` — and every silently-applied row — back to a local record.
 */
export function buildPushPayload(byTable: Record<string, PendingRow[]>): {
  payload: PushPayload;
  index: Map<string, PushIndexEntry>;
  count: number;
} {
  const changes: Record<string, TableChanges> = {};
  const index = new Map<string, PushIndexEntry>();
  let count = 0;

  for (const [table, rows] of Object.entries(byTable)) {
    const t: TableChanges = { created: [], updated: [], deleted: [] };

    for (const row of rows) {
      if (!row.server_id) continue; // caller must mint an id first
      let outcome: PushOutcome;

      if (row.is_deleted) {
        if (row.never_synced) continue; // never reached the server — nothing to delete
        t.deleted.push(row.server_id);
        outcome = 'deleted';
      } else if (row.never_synced) {
        t.created.push({ id: row.server_id, ...dropUndefined(row.fields) });
        outcome = 'created';
      } else {
        t.updated.push({ id: row.server_id, version: row.version, ...dropUndefined(row.fields) });
        outcome = 'updated';
      }

      index.set(conflictKey(table, row.server_id), { table, local_id: row.local_id, outcome });
      count++;
    }

    if (t.created.length || t.updated.length || t.deleted.length) changes[table] = t;
  }

  return { payload: { changes }, index, count };
}

/** Index the server's conflicts by `table:id` for O(1) lookup while applying results. */
export function indexConflicts(conflicts: PushConflict[]): Map<string, PushConflict> {
  const m = new Map<string, PushConflict>();
  for (const c of conflicts) m.set(conflictKey(c.table, c.id), c);
  return m;
}

/**
 * Local version after a push the server accepted.
 * The server does `version = version + 1` on update and inserts creates at the
 * default 1 — mirroring that here keeps the next optimistic-locked push from
 * 409ing on a stale version before the following pull heals it.
 */
export function nextLocalVersion(outcome: PushOutcome, current: number): number {
  return outcome === 'created' ? current : current + 1;
}
