// lib/conflicts.ts — stash of server snapshots for unresolved sync conflicts (T-13/T-14).
//
// When a push comes back with a conflict, the record is flagged `sync_status='conflict'`
// and the server's row is stashed here so the resolve screen can render a side-by-side,
// field-level diff. Keyed by TABLE + the LOCAL WatermelonDB record id; resolving clears it.
//
// Storage keys are `conflict:{table}:{localId}` — unchanged from the three hand-rolled
// per-table stores this replaced, so snapshots already on a device still resolve.

import AsyncStorage from '@react-native-async-storage/async-storage';

/** A stashed server row. Shape varies per table; `id` + `version` are always present. */
export interface ServerSnapshot {
  id: string;
  version: number;
  [field: string]: unknown;
}

function keyFor(table: string, localId: string): string {
  return `conflict:${table}:${localId}`;
}

export async function saveConflictFor(table: string, localId: string, server: ServerSnapshot): Promise<void> {
  await AsyncStorage.setItem(keyFor(table, localId), JSON.stringify(server));
}

export async function getConflictFor(table: string, localId: string): Promise<ServerSnapshot | null> {
  const raw = await AsyncStorage.getItem(keyFor(table, localId));
  return raw ? (JSON.parse(raw) as ServerSnapshot) : null;
}

export async function clearConflictFor(table: string, localId: string): Promise<void> {
  await AsyncStorage.removeItem(keyFor(table, localId));
}
