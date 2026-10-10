// offline-queue.test.ts — the AsyncStorage layer + the dead-letter path.
//
// `queue-policy.test.ts` covers the pure retry decisions; this covers what actually
// happens to a field worker's captured item: does it survive an upgrade, does it stop
// retrying forever, and — the point of the dead letter — does giving up leave
// something they can see and act on instead of a console.warn nobody reads.

import { jest } from '@jest/globals';

const mockStore: Record<string, string> = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: async (k: string) => mockStore[k] ?? null,
    setItem: async (k: string, v: string) => { mockStore[k] = v; },
    removeItem: async (k: string) => { delete mockStore[k]; },
  },
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const q = require('../offline-queue') as typeof import('../offline-queue');
const { QUEUE_KEYS, enqueue, flushQueue, queueDepth, totalQueueDepth,
        listDeadLetters, retryDeadLetters, clearDeadLetters, MAX_ATTEMPTS } = q;

beforeEach(() => { for (const k of Object.keys(mockStore)) delete mockStore[k]; });

/** An ApiError-shaped failure: the server replied, so it's a verdict. */
const verdict = (status: number) => Object.assign(new Error(`HTTP ${status}`), { status });
const offline = () => new Error('Network request failed');

describe('enqueue / depth', () => {
  it('counts across every queue', async () => {
    await enqueue(QUEUE_KEYS.taskPhotos, { a: 1 });
    await enqueue(QUEUE_KEYS.documents, { b: 2 });
    expect(await queueDepth(QUEUE_KEYS.taskPhotos)).toBe(1);
    expect(await totalQueueDepth()).toBe(2);
  });

  it('`sameAs` supersedes an earlier item instead of replaying both', async () => {
    await enqueue(QUEUE_KEYS.statusUpdates, { id: 'x', status: 'open' },
      { sameAs: (a: any, b: any) => a.id === b.id });
    await enqueue(QUEUE_KEYS.statusUpdates, { id: 'x', status: 'complete' },
      { sameAs: (a: any, b: any) => a.id === b.id });

    const seen: unknown[] = [];
    await flushQueue(QUEUE_KEYS.statusUpdates, async (item) => { seen.push(item); });
    expect(seen).toEqual([{ id: 'x', status: 'complete' }]);
  });
});

describe('flushQueue', () => {
  it('drains on success and leaves the queue empty', async () => {
    await enqueue(QUEUE_KEYS.documents, { file: 'a.pdf' });
    await flushQueue(QUEUE_KEYS.documents, async () => { /* uploaded */ });
    expect(await queueDepth(QUEUE_KEYS.documents)).toBe(0);
    expect(await listDeadLetters()).toEqual([]);
  });

  it('keeps a connectivity failure queued (with backoff) — nothing is lost offline', async () => {
    await enqueue(QUEUE_KEYS.documents, { file: 'a.pdf' });
    await flushQueue(QUEUE_KEYS.documents, async () => { throw offline(); });

    expect(await queueDepth(QUEUE_KEYS.documents)).toBe(1);
    expect(await listDeadLetters()).toEqual([]); // still trying — not a failure yet
  });

  it('dead-letters a SERVER VERDICT immediately (retrying cannot change a 413)', async () => {
    await enqueue(QUEUE_KEYS.documents, { file: 'huge.pdf' });
    await flushQueue(QUEUE_KEYS.documents, async () => { throw verdict(413); });

    expect(await queueDepth(QUEUE_KEYS.documents)).toBe(0);
    const dead = await listDeadLetters();
    expect(dead).toHaveLength(1);
    expect(dead[0]).toMatchObject({ queue: QUEUE_KEYS.documents, item: { file: 'huge.pdf' }, attempts: 1 });
    expect(dead[0].reason).toContain('413');
  });

  it('dead-letters after the attempt cap rather than retrying forever', async () => {
    await enqueue(QUEUE_KEYS.taskPhotos, { photo: 'x.jpg' });

    // Each sweep is one attempt; force every item due by clearing the backoff.
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      const raw = JSON.parse(mockStore[QUEUE_KEYS.taskPhotos] ?? '[]');
      for (const env of raw) env.next_at = 0;
      mockStore[QUEUE_KEYS.taskPhotos] = JSON.stringify(raw);
      await flushQueue(QUEUE_KEYS.taskPhotos, async () => { throw offline(); });
    }

    expect(await queueDepth(QUEUE_KEYS.taskPhotos)).toBe(0);
    const dead = await listDeadLetters();
    expect(dead).toHaveLength(1);
    expect(dead[0].attempts).toBe(MAX_ATTEMPTS);
  });

  it('`retryServerErrors` keeps a FILE_NOT_READY-style 409 in the queue', async () => {
    await enqueue(QUEUE_KEYS.taskPhotos, { photo: 'scanning.jpg' });
    await flushQueue(QUEUE_KEYS.taskPhotos, async () => { throw verdict(409); }, { retryServerErrors: true });

    expect(await queueDepth(QUEUE_KEYS.taskPhotos)).toBe(1);
    expect(await listDeadLetters()).toEqual([]);
  });

  it('holds back an item still inside its backoff window', async () => {
    await enqueue(QUEUE_KEYS.documents, { file: 'a.pdf' });
    await flushQueue(QUEUE_KEYS.documents, async () => { throw offline(); }); // → backoff

    let called = 0;
    await flushQueue(QUEUE_KEYS.documents, async () => { called++; });
    expect(called).toBe(0); // not due yet — no hammering the server every sweep
  });

  it('flushes a LEGACY un-enveloped item written by an older build', async () => {
    // Upgrade safety: dropping these would lose a worker's captured photos.
    mockStore[QUEUE_KEYS.taskPhotos] = JSON.stringify([{ taskId: 't1', localUri: 'file://a.jpg' }]);

    const seen: unknown[] = [];
    await flushQueue(QUEUE_KEYS.taskPhotos, async (item) => { seen.push(item); });
    expect(seen).toEqual([{ taskId: 't1', localUri: 'file://a.jpg' }]);
  });
});

describe('dead letters', () => {
  it('retry puts items back on their ORIGINAL queue and clears the list', async () => {
    await enqueue(QUEUE_KEYS.assetFuelLogs, { gallons: 12 });
    await flushQueue(QUEUE_KEYS.assetFuelLogs, async () => { throw verdict(500); });
    expect(await listDeadLetters()).toHaveLength(1);

    const n = await retryDeadLetters();
    expect(n).toBe(1);
    expect(await listDeadLetters()).toEqual([]);
    expect(await queueDepth(QUEUE_KEYS.assetFuelLogs)).toBe(1);

    // Retried with a clean slate — due immediately, not stuck in the old backoff.
    let seen: unknown = null;
    await flushQueue(QUEUE_KEYS.assetFuelLogs, async (item) => { seen = item; });
    expect(seen).toEqual({ gallons: 12 });
  });

  it('discard clears without re-queueing', async () => {
    await enqueue(QUEUE_KEYS.documents, { file: 'a.pdf' });
    await flushQueue(QUEUE_KEYS.documents, async () => { throw verdict(404); });

    await clearDeadLetters();
    expect(await listDeadLetters()).toEqual([]);
    expect(await totalQueueDepth()).toBe(0);
  });
});
