// lib/sync.ts — sweep orchestration: the batch sync engine + the offline upload queues.
//
// The engine itself lives in `sync-core.ts` (testable in node — no React Native in its
// import graph). This module wires it to the six AsyncStorage capture queues, which are
// exported from screens, and owns the sweep entry point called by AppNavigator.

import { getUser } from './auth';
import { pushAll, pullAll } from './sync-core';
import { flushFuelLogQueue } from '../screens/assets/FuelLog';
import { flushInspectionQueue } from '../screens/assets/InspectionForm';
import { flushDocumentUploadQueue } from '../screens/DocumentsScreen';
import { flushStatusQueue } from './status-queue';
import { flushTaskPhotoQueue } from './photo-queue';
import { flushDamageReportQueue } from '../screens/assets/DamageReport';

// Screens import pullAll from here (pull-to-refresh); keep the entry point stable.
export { pullAll } from './sync-core';

// ─── Main sweep entry point ───────────────────────────────────────────────────

/**
 * Full sync sweep: push every pending local change (one batched request), then
 * pull the server delta (one batched request). Called on AppState → active and
 * on a 3-minute foreground interval (AppNavigator).
 */
export async function runSyncSweep(): Promise<void> {
  const user = await getUser();
  if (!user) return; // Not logged in — skip

  // WatermelonDB tables go over the batch protocol. The AsyncStorage queues
  // (asset fuel logs / inspections / documents / status / task photos / damage
  // reports) are separate per-record drains written by their screens when offline.
  const [pushed] = await Promise.allSettled([
    pushAll(),
    flushFuelLogQueue(),
    flushInspectionQueue(),
    flushDocumentUploadQueue(),
    flushStatusQueue(),
    flushTaskPhotoQueue(),
    flushDamageReportQueue(),
  ]);

  // Tier-1 (last-write-wins) rows were re-versioned from a conflict — re-apply
  // them at the server's version straight away rather than waiting a sweep.
  if (pushed.status === 'fulfilled' && pushed.value === true) {
    try { await pushAll(); } catch { /* retried next sweep */ }
  }

  await pullAll();
}
