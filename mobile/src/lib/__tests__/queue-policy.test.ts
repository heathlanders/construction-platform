// queue-policy.test.ts — retry policy for the shared offline upload queue (§B4).
// Pure logic; no AsyncStorage, no fetch.

import {
  backoffMs, isNetworkError, decideRetry, normalizeQueue, partitionDue, MAX_ATTEMPTS,
  type QueueEnvelope,
} from '../queue-policy';

describe('isNetworkError', () => {
  it('treats an ApiError (server replied) as NOT a network error', () => {
    // A server verdict must not be retried forever — this is the distinction the
    // old per-screen queues got wrong by string-matching messages.
    expect(isNetworkError({ status: 404, message: 'Not found' })).toBe(false);
    expect(isNetworkError({ status: 413, message: 'Payload too large' })).toBe(false);
    expect(isNetworkError({ status: 500, message: 'Server error' })).toBe(false);
  });

  it('recognises connectivity failures', () => {
    expect(isNetworkError(new Error('Network request failed'))).toBe(true);
    expect(isNetworkError(new TypeError('Failed to fetch'))).toBe(true);
    expect(isNetworkError(new Error('connection reset'))).toBe(true);
    expect(isNetworkError(new Error('The operation timed out'))).toBe(true);
    expect(isNetworkError(new Error('Aborted'))).toBe(true);
  });

  it('does not treat an unrelated error as retryable', () => {
    expect(isNetworkError(new Error('Cannot read property x of undefined'))).toBe(false);
    expect(isNetworkError(undefined)).toBe(false);
  });
});

describe('decideRetry', () => {
  it('retries connectivity failures until the attempt cap, then drops', () => {
    const net = new Error('Network request failed');
    expect(decideRetry(net, 1)).toBe('retry');
    expect(decideRetry(net, MAX_ATTEMPTS - 1)).toBe('retry');
    expect(decideRetry(net, MAX_ATTEMPTS)).toBe('drop'); // no infinite poison item
  });

  it('drops a server verdict immediately by default', () => {
    expect(decideRetry({ status: 404 }, 1)).toBe('drop');
  });

  it('retries a server error when the processor opts in (FILE_NOT_READY scan wait)', () => {
    expect(decideRetry({ status: 409 }, 1, { retryServerErrors: true })).toBe('retry');
    // ...but the cap still applies
    expect(decideRetry({ status: 409 }, MAX_ATTEMPTS, { retryServerErrors: true })).toBe('drop');
  });
});

describe('backoffMs', () => {
  it('grows exponentially and caps at 5 minutes', () => {
    const noJitter = () => 0.5; // → zero jitter
    expect(backoffMs(1, noJitter)).toBe(30_000);
    expect(backoffMs(2, noJitter)).toBe(60_000);
    expect(backoffMs(3, noJitter)).toBe(120_000);
    expect(backoffMs(10, noJitter)).toBe(300_000);
  });

  it('applies ±20% jitter and never goes negative', () => {
    expect(backoffMs(1, () => 0)).toBe(24_000);   // -20%
    expect(backoffMs(1, () => 1)).toBe(36_000);   // +20%
    for (let a = 0; a < 8; a++) expect(backoffMs(a, Math.random)).toBeGreaterThanOrEqual(0);
  });
});

describe('normalizeQueue', () => {
  it('wraps LEGACY plain items instead of dropping them', () => {
    // Live installs hold un-enveloped items written by the old per-screen queues —
    // discarding them would lose a field worker's captured photos.
    const legacy = [{ taskId: 't1', localUri: 'file://a.jpg' }];
    expect(normalizeQueue(legacy)).toEqual([
      { item: { taskId: 't1', localUri: 'file://a.jpg' }, attempts: 0, next_at: 0 },
    ]);
  });

  it('preserves an existing envelope', () => {
    const env = [{ item: { a: 1 }, attempts: 3, next_at: 1234 }];
    expect(normalizeQueue(env)).toEqual([{ item: { a: 1 }, attempts: 3, next_at: 1234 }]);
  });

  it('coerces junk bookkeeping and non-array input', () => {
    expect(normalizeQueue([{ item: { a: 1 }, attempts: 'x', next_at: null }])[0])
      .toEqual({ item: { a: 1 }, attempts: 0, next_at: 0 });
    expect(normalizeQueue(null)).toEqual([]);
    expect(normalizeQueue({ nope: true })).toEqual([]);
  });
});

describe('partitionDue', () => {
  it('holds back items still in backoff', () => {
    const q: QueueEnvelope<string>[] = [
      { item: 'ready', attempts: 1, next_at: 500 },
      { item: 'waiting', attempts: 2, next_at: 5_000 },
      { item: 'fresh', attempts: 0, next_at: 0 },
    ];
    const { due, waiting } = partitionDue(q, 1_000);
    expect(due.map((e) => e.item)).toEqual(['ready', 'fresh']);
    expect(waiting.map((e) => e.item)).toEqual(['waiting']);
  });
});
