// warranty-expiry-scan.test.ts — the scan→per-tenant fan-out that revives the dead
// warranty.daily_expiry_check cron (scheduled queues need their own consumer; the old
// schedule fed a queue nobody consumed, with no tenant_id).
// Locked decisions: T-10 (envelope tenant_id).

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { randomUUID } from 'node:crypto';

vi.mock('../lib/queue.js', () => ({
  sendJob: vi.fn().mockResolvedValue(undefined),
  getQueue: vi.fn(),
  stopQueue: vi.fn().mockResolvedValue(undefined),
}));

import { testPool } from './setup.js';
import { sendJob } from '../lib/queue.js';
import { handleWarrantyExpiryScan } from '../workers/warranty-worker.js';

const activeA = randomUUID();
const activeB = randomUUID();
const deletedT = randomUUID();
const suspendedT = randomUUID();

beforeAll(async () => {
  await testPool.query(
    `INSERT INTO tenants (id,name,slug,tier,status,deleted_at) VALUES
       ($1,'WES Active A',$5,'business','active',NULL),
       ($2,'WES Trial B',$6,'business','trial',NULL),
       ($3,'WES Deleted',$7,'business','active',NOW()),
       ($4,'WES Suspended',$8,'business','suspended',NULL)`,
    [activeA, activeB, deletedT, suspendedT,
     `wesa-${activeA.slice(0, 8)}`, `wesb-${activeB.slice(0, 8)}`, `wesd-${deletedT.slice(0, 8)}`, `wess-${suspendedT.slice(0, 8)}`],
  );
});

afterAll(async () => {
  await testPool.query(`DELETE FROM tenants WHERE id = ANY($1)`, [[activeA, activeB, deletedT, suspendedT]]);
});

describe('handleWarrantyExpiryScan', () => {
  it('enqueues one warranty.daily_expiry_check per live tenant — never for deleted/suspended', async () => {
    vi.mocked(sendJob).mockClear();
    await handleWarrantyExpiryScan();
    const calls = vi.mocked(sendJob).mock.calls.filter((c) => c[0] === 'warranty.daily_expiry_check');
    const tenants = calls.map((c) => c[1]);
    expect(tenants).toContain(activeA);
    expect(tenants).toContain(activeB); // trial counts
    expect(tenants).not.toContain(deletedT);
    expect(tenants).not.toContain(suspendedT);
  });

  it('every enqueued job carries a tenant_id envelope arg (T-10)', async () => {
    vi.mocked(sendJob).mockClear();
    await handleWarrantyExpiryScan();
    const calls = vi.mocked(sendJob).mock.calls.filter((c) => c[0] === 'warranty.daily_expiry_check');
    expect(calls.length).toBeGreaterThan(0);
    for (const c of calls) {
      expect(typeof c[1]).toBe('string');
      expect(c[1]).toMatch(/^[0-9a-f-]{36}$/);
    }
  });
});
