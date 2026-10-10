// lib/queue-policy.ts — pure retry policy for the offline upload queues.
//
// No AsyncStorage, no fetch — unit-testable in plain node (Mobile Enterprise Plan §C1).
// The six offline queues (task photos, documents, asset inspections/fuel/damage,
// status PATCHes) all previously hand-rolled this: string-matching the error message
// to decide whether to re-queue, with NO attempt cap and NO backoff — so a poison
// item retried on every 3-minute sweep forever.

/** A queued item plus its retry bookkeeping. */
export interface QueueEnvelope<T> {
  item: T;
  /** Failed attempts so far. */
  attempts: number;
  /** Epoch ms — don't retry before this. */
  next_at: number;
}

/** Give up after this many failures (≈ 8 min of backoff) and drop the item. */
export const MAX_ATTEMPTS = 6;

/**
 * Exponential backoff with ±20% jitter, capped at 5 min — mirrors the API's
 * integration-retry policy (T-21) so field devices don't hammer a struggling server.
 * `rand` is injectable so tests stay deterministic.
 */
export function backoffMs(attempts: number, rand: () => number = Math.random): number {
  const base = Math.min(30_000 * 2 ** Math.max(0, attempts - 1), 300_000);
  const jitter = base * 0.2 * (rand() * 2 - 1);
  return Math.max(0, Math.round(base + jitter));
}

/**
 * Is this a transient connectivity failure (worth retrying) rather than a server
 * verdict? `ApiError` carries an HTTP `status`, so anything with one is a real
 * answer from the server; a bare TypeError/"Network request failed" is not.
 */
export function isNetworkError(err: unknown): boolean {
  if (err && typeof err === 'object' && 'status' in err && typeof (err as { status: unknown }).status === 'number') {
    return false; // the server replied — not a connectivity problem
  }
  const msg = err instanceof Error ? err.message : String(err ?? '');
  // `timed? ?out` covers both "timeout" and RN's "The operation timed out".
  return /network|fetch|timed? ?out|connection|offline|ECONN|abort/i.test(msg);
}

export type RetryDecision = 'retry' | 'drop';

/**
 * What to do with an item whose processor threw.
 *
 * - a server verdict (4xx/5xx `ApiError`) → drop: retrying can't change the answer
 *   and would loop forever (e.g. the task was deleted, or the file is too large)
 * - a connectivity failure → retry until MAX_ATTEMPTS, then drop
 *
 * `retryServerErrors` is for processors whose failure IS retryable server-side
 * (the task-photo attach 409s with FILE_NOT_READY until the virus scan promotes
 * the file — that one genuinely wants another sweep).
 */
export function decideRetry(
  err: unknown,
  attempts: number,
  opts: { retryServerErrors?: boolean } = {},
): RetryDecision {
  if (attempts >= MAX_ATTEMPTS) return 'drop';
  if (isNetworkError(err)) return 'retry';
  return opts.retryServerErrors ? 'retry' : 'drop';
}

/**
 * Read a persisted queue, tolerating rows written before this envelope existed.
 * Live installs have plain items in AsyncStorage — dropping them would silently
 * lose a field worker's captured photos, so legacy rows are wrapped, not discarded.
 */
export function normalizeQueue<T>(raw: unknown): QueueEnvelope<T>[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((row) => {
    if (row && typeof row === 'object' && 'item' in row && 'attempts' in row) {
      const env = row as QueueEnvelope<T>;
      return { item: env.item, attempts: Number(env.attempts) || 0, next_at: Number(env.next_at) || 0 };
    }
    return { item: row as T, attempts: 0, next_at: 0 };
  });
}

/** Items due now (a not-yet-due item is kept, untouched, for a later sweep). */
export function partitionDue<T>(
  queue: QueueEnvelope<T>[],
  now: number,
): { due: QueueEnvelope<T>[]; waiting: QueueEnvelope<T>[] } {
  const due: QueueEnvelope<T>[] = [];
  const waiting: QueueEnvelope<T>[] = [];
  for (const env of queue) (env.next_at <= now ? due : waiting).push(env);
  return { due, waiting };
}
