// lib/offline-queue.ts — one AsyncStorage-backed offline queue used by every
// capture surface (task QA photos, project documents, asset inspections / fuel /
// damage reports, trade status PATCHes).
//
// Before this, each of those six hand-rolled the same read-json / push / write-json
// and flush loop, each with slightly different retry rules and NO attempt cap — a
// poison item retried on every 3-minute sweep forever. Retry policy now lives in
// the pure `queue-policy.ts` (unit-tested); this file is just the I/O.

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  normalizeQueue, partitionDue, backoffMs, decideRetry, MAX_ATTEMPTS,
  type QueueEnvelope,
} from './queue-policy';

/** Every offline queue key. Keys are UNCHANGED from the per-screen versions so
 *  items captured on an older build survive the upgrade. */
export const QUEUE_KEYS = {
  taskPhotos: 'task_photo_queue',
  documents: 'documents_upload_queue',
  assetInspections: 'asset_inspections_queue',
  assetFuelLogs: 'asset_fuel_logs_queue',
  assetDamage: 'asset_damage_reports_queue',
  statusUpdates: 'status_update_queue',
} as const;

export type QueueKey = (typeof QUEUE_KEYS)[keyof typeof QUEUE_KEYS];

/**
 * Dead letter: items the queue gave up on (attempt cap, or a server verdict like
 * "task deleted" / "file too large"). Without this a field worker's captured photo
 * just vanishes with a console.warn nobody sees — silent data loss.
 * Separate key so it can never be confused with live work.
 */
const DEAD_LETTER_KEY = 'offline_queue_dead_letter';

export interface DeadLetter {
  /** Which queue it came from — needed to retry it. */
  queue: QueueKey;
  item: unknown;
  attempts: number;
  reason: string;
  at: string;
}

/** Cap the stored list — this is a user-facing notice, not an audit log. */
const DEAD_LETTER_MAX = 50;

const ALL_KEYS: QueueKey[] = Object.values(QUEUE_KEYS);

async function readDeadLetters(): Promise<DeadLetter[]> {
  try {
    const raw = await AsyncStorage.getItem(DEAD_LETTER_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as DeadLetter[]) : [];
  } catch {
    return [];
  }
}

async function recordDeadLetter(entry: DeadLetter): Promise<void> {
  try {
    const list = await readDeadLetters();
    list.push(entry);
    await AsyncStorage.setItem(DEAD_LETTER_KEY, JSON.stringify(list.slice(-DEAD_LETTER_MAX)));
  } catch {
    // storage unavailable — the console.warn in flushQueue is all that's left
  }
}

/** Items the queue gave up on, newest last. Surfaced by PendingUploadsBadge. */
export async function listDeadLetters(): Promise<DeadLetter[]> {
  return readDeadLetters();
}

export async function clearDeadLetters(): Promise<void> {
  try { await AsyncStorage.removeItem(DEAD_LETTER_KEY); } catch { /* nothing to do */ }
}

/** Put every given-up item back on its queue with a clean slate (user-initiated). */
export async function retryDeadLetters(): Promise<number> {
  const list = await readDeadLetters();
  if (list.length === 0) return 0;
  await clearDeadLetters();
  for (const d of list) {
    // Fresh envelope: the user explicitly asked, so don't inherit the old backoff.
    await enqueue(d.queue, d.item);
  }
  return list.length;
}

async function read<T>(key: QueueKey): Promise<QueueEnvelope<T>[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return normalizeQueue<T>(raw ? JSON.parse(raw) : []);
  } catch {
    return []; // unreadable/corrupt blob — better empty than crashing the sweep
  }
}

async function write<T>(key: QueueKey, queue: QueueEnvelope<T>[]): Promise<void> {
  try {
    if (queue.length === 0) await AsyncStorage.removeItem(key);
    else await AsyncStorage.setItem(key, JSON.stringify(queue));
  } catch {
    // Storage full / unavailable — nothing useful to do; the item is lost either way.
  }
}

/**
 * Queue one item for the next sweep.
 *
 * `sameAs` collapses supersedable items — the status queue keeps only the LATEST
 * queued status per record, so a worker toggling a value offline doesn't replay
 * every intermediate state on reconnect.
 */
export async function enqueue<T>(
  key: QueueKey,
  item: T,
  opts: { sameAs?: (queued: T, incoming: T) => boolean } = {},
): Promise<void> {
  let queue = await read<T>(key);
  if (opts.sameAs) queue = queue.filter((env) => !opts.sameAs!(env.item, item));
  queue.push({ item, attempts: 0, next_at: 0 });
  await write(key, queue);
}

/** How many items are waiting in one queue. */
export async function queueDepth(key: QueueKey): Promise<number> {
  return (await read(key)).length;
}

/** Total items waiting across every queue — drives the header badge. */
export async function totalQueueDepth(): Promise<number> {
  const counts = await Promise.all(ALL_KEYS.map((k) => queueDepth(k)));
  return counts.reduce((a, b) => a + b, 0);
}

/**
 * Drain a queue. `processor` does the actual work (upload + attach, POST, PATCH…);
 * throwing means "not done".
 *
 * - connectivity failure → retried with exponential backoff (T-21-style), up to
 *   MAX_ATTEMPTS, then dropped so it can't loop forever
 * - server verdict (an `ApiError` with a status) → dropped immediately, since
 *   retrying can't change the answer — UNLESS `retryServerErrors` is set (the
 *   task-photo attach 409s with FILE_NOT_READY until the scan promotes the file)
 */
export async function flushQueue<T>(
  key: QueueKey,
  processor: (item: T) => Promise<void>,
  opts: { retryServerErrors?: boolean } = {},
): Promise<void> {
  const queue = await read<T>(key);
  if (queue.length === 0) return;

  const now = Date.now();
  const { due, waiting } = partitionDue(queue, now);
  const keep: QueueEnvelope<T>[] = [...waiting];

  for (const env of due) {
    try {
      await processor(env.item);
    } catch (err) {
      const attempts = env.attempts + 1;
      if (decideRetry(err, attempts, opts) === 'retry') {
        keep.push({ item: env.item, attempts, next_at: Date.now() + backoffMs(attempts) });
      } else {
        // Give up — but leave a trace the user can actually see and retry, instead
        // of losing their captured work to a console.warn.
        console.warn(`[queue:${key}] dropping item after ${attempts} attempt(s)`, err);
        await recordDeadLetter({
          queue: key,
          item: env.item,
          attempts,
          reason: err instanceof Error ? err.message : String(err ?? 'unknown'),
          at: new Date().toISOString(),
        });
      }
    }
  }

  await write(key, keep);
}

export { MAX_ATTEMPTS };
