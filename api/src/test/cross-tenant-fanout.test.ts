// cross-tenant-fanout.test.ts — T-17 server fan-out: a shared event is pushed to BOTH parties'
//   private channels (scoped, whitelisted payload). Pusher client is mocked (no network / creds).

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { randomUUID } from 'node:crypto';

vi.mock('../lib/queue.js', () => ({
  sendJob: vi.fn().mockResolvedValue(undefined),
  getQueue: vi.fn(),
  stopQueue: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../lib/pusher.js', () => ({
  triggerToTenant: vi.fn().mockResolvedValue(undefined),
  tenantChannel: (t: string) => `private-tenant-${t}`,
  pusherEnabled: vi.fn().mockReturnValue(true),
  authorizeTenantChannel: vi.fn(),
}));

import { testPool } from './setup.js';
import { fanOutSharedEvent, publishSharedEvent } from '../lib/cross-tenant/bridge.js';
import { triggerToTenant } from '../lib/pusher.js';

const gcTenant = randomUUID();
const subTenant = randomUUID();
const connId = randomUUID();

beforeAll(async () => {
  await testPool.query(
    `INSERT INTO tenants (id,name,slug,tier,status) VALUES ($1,'GC',$3,'professional','active'),($2,'Sub',$4,'professional','active')`,
    [gcTenant, subTenant, `fo-gc-${gcTenant.slice(0, 8)}`, `fo-sub-${subTenant.slice(0, 8)}`],
  );
  await testPool.query(
    `INSERT INTO tenant_connections (id,gc_tenant_id,sub_tenant_id,status) VALUES ($1,$2,$3,'active')`,
    [connId, gcTenant, subTenant],
  );
});

afterAll(async () => {
  await testPool.query(`DELETE FROM shared_project_events WHERE connection_id = $1`, [connId]);
  await testPool.query(`DELETE FROM tenant_connections WHERE id = $1`, [connId]);
  await testPool.query(`DELETE FROM tenants WHERE id = ANY($1)`, [[gcTenant, subTenant]]);
});

describe('T-17 fan-out', () => {
  it('fanOutSharedEvent triggers BOTH parties\' channels with the whitelisted payload', async () => {
    vi.mocked(triggerToTenant).mockClear();
    await fanOutSharedEvent(connId, 'rfi.created', { rfi_id: 'r1', subject: 'Q' }, gcTenant);

    expect(triggerToTenant).toHaveBeenCalledTimes(2);
    const targets = vi.mocked(triggerToTenant).mock.calls.map((c) => c[0]);
    expect(new Set(targets)).toEqual(new Set([gcTenant, subTenant]));
    for (const call of vi.mocked(triggerToTenant).mock.calls) {
      expect(call[1]).toBe('shared.event');
      expect(call[2]).toMatchObject({
        event_type: 'rfi.created',
        payload: { rfi_id: 'r1', subject: 'Q' },
        source_tenant_id: gcTenant, // lets clients skip toasting self-authored events
      });
    }
  });

  it('publishSharedEvent writes the row AND fans out (the one choke point)', async () => {
    vi.mocked(triggerToTenant).mockClear();
    const ev = await publishSharedEvent(connId, gcTenant, 'submittal.created', { submittal_id: 's1' });
    expect(ev.event_type).toBe('submittal.created');
    // fan-out is fire-and-forget (void) inside publishSharedEvent — let the microtask flush.
    await new Promise((r) => setTimeout(r, 20));
    expect(triggerToTenant).toHaveBeenCalledTimes(2);
  });

  it('unknown connection → no fan-out (best-effort, never throws)', async () => {
    vi.mocked(triggerToTenant).mockClear();
    await expect(fanOutSharedEvent(randomUUID(), 'rfi.created', {})).resolves.toBeUndefined();
    expect(triggerToTenant).not.toHaveBeenCalled();
  });
});
