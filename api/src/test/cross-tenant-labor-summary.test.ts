// cross-tenant-labor-summary.test.ts — Doc 07 §5 labor_visibility family (nightly cron handler).
//   handleCrossTenantLaborSummary aggregates the sub's time_entries on mirror projects and
//   publishes labor.summary field-filtered by the flags. FAIL-CLOSED (defaults false);
//   costs NEVER cross — entries are seeded WITH hourly_rate_cents to prove no leak.
// Locked decisions: T-44, T-45, T-02 (cents never in payload), T-10.

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';

vi.mock('../lib/queue.js', () => ({
  sendJob: vi.fn().mockResolvedValue(undefined),
  getQueue: vi.fn(),
  stopQueue: vi.fn().mockResolvedValue(undefined),
}));

import { testPool } from './setup.js';
import { sendJob } from '../lib/queue.js';
import { handleCrossTenantLaborSummary } from '../workers/cross-tenant-labor-worker.js';

const gcTenant = randomUUID();
const subTenant = randomUUID();
const gcOwner = randomUUID();
const subOwner = randomUUID();
const worker1 = randomUUID();
const worker2 = randomUUID();
const mirrorProject = randomUUID();
const conn = randomUUID();
const DATE = '2026-07-17';

const notifyCalls = () => vi.mocked(sendJob).mock.calls.filter((c) => c[0] === 'cross_tenant.notify');

async function laborEvents(): Promise<Record<string, unknown>[]> {
  const { rows } = await testPool.query(
    `SELECT payload FROM shared_project_events WHERE connection_id=$1 AND event_type='labor.summary' ORDER BY created_at`,
    [conn],
  );
  return rows.map((r) => r.payload);
}

async function setLabor(showHours: boolean, showNames: boolean): Promise<void> {
  await testPool.query(
    `UPDATE tenant_connections SET permissions = jsonb_set(jsonb_set(permissions,
       '{labor_visibility,show_total_hours}', $2::jsonb),
       '{labor_visibility,show_crew_names}', $3::jsonb)
     WHERE id=$1`,
    [conn, JSON.stringify(showHours), JSON.stringify(showNames)],
  );
}

async function clearLaborEvents(): Promise<void> {
  await testPool.query(`DELETE FROM shared_project_events WHERE connection_id=$1 AND event_type='labor.summary'`, [conn]);
}

beforeAll(async () => {
  await testPool.query(
    `INSERT INTO tenants (id,name,slug,tier,status) VALUES
       ($1,'GC LS',$3,'professional','active'),
       ($2,'Sub LS',$4,'professional','active')`,
    [gcTenant, subTenant, `gls-${gcTenant.slice(0, 8)}`, `sls-${subTenant.slice(0, 8)}`],
  );
  const pw = await bcrypt.hash('x', 10);
  await testPool.query(
    `INSERT INTO users (id,tenant_id,email,password_hash,first_name,last_name,role,status) VALUES
       ($1,$2,'gc@ls.test',$7,'G','C','owner','active'),
       ($3,$4,'sub@ls.test',$7,'S','B','owner','active'),
       ($5,$4,'ana@ls.test',$7,'Ana','Lopez','field_tech','active'),
       ($6,$4,'bo@ls.test',$7,'Bo','Reyes','field_tech','active')`,
    [gcOwner, gcTenant, subOwner, subTenant, worker1, worker2, pw],
  );
  await testPool.query(
    `INSERT INTO tenant_connections (id,gc_tenant_id,sub_tenant_id,status,invited_by) VALUES ($1,$2,$3,'active',$4)`,
    [conn, gcTenant, subTenant, gcOwner],
  );
  await testPool.query(
    `INSERT INTO projects (id,tenant_id,name,status,state,connection_id) VALUES ($1,$2,'Mirror LS','active','WI',$3)`,
    [mirrorProject, subTenant, conn],
  );
  // Rates set ON PURPOSE — the leak-floor case proves cents never reach a payload.
  await testPool.query(
    `INSERT INTO time_entries (tenant_id,project_id,user_id,date,hours_worked,hourly_rate_cents,created_by) VALUES
       ($1,$2,$3,$5,4.0,4500,$3),
       ($1,$2,$4,$5,3.5,5200,$4)`,
    [subTenant, mirrorProject, worker1, worker2, DATE],
  );
});

afterAll(async () => {
  await testPool.query(`DELETE FROM shared_project_events WHERE connection_id=$1`, [conn]);
  await testPool.query(`DELETE FROM time_entries WHERE tenant_id=$1`, [subTenant]);
  await testPool.query(`UPDATE projects SET connection_id=NULL WHERE tenant_id=$1`, [subTenant]);
  await testPool.query(`DELETE FROM tenant_connections WHERE id=$1`, [conn]);
  await testPool.query(`DELETE FROM audit_log WHERE tenant_id = ANY($1)`, [[gcTenant, subTenant]]);
  await testPool.query(`DELETE FROM projects WHERE tenant_id=$1`, [subTenant]);
  await testPool.query(`DELETE FROM users WHERE tenant_id = ANY($1)`, [[gcTenant, subTenant]]);
  await testPool.query(`DELETE FROM tenants WHERE id = ANY($1)`, [[gcTenant, subTenant]]);
});

describe('handleCrossTenantLaborSummary', () => {
  it('both flags off (the §5 default) → NO event, no notify', async () => {
    vi.mocked(sendJob).mockClear();
    await handleCrossTenantLaborSummary(subTenant, { connection_id: conn, date: DATE });
    expect(await laborEvents()).toHaveLength(0);
    expect(notifyCalls()).toHaveLength(0);
  });

  it('show_total_hours only → totals, NO crew, no cents', async () => {
    await setLabor(true, false);
    vi.mocked(sendJob).mockClear();
    await handleCrossTenantLaborSummary(subTenant, { connection_id: conn, date: DATE });
    const evs = await laborEvents();
    expect(evs).toHaveLength(1);
    expect(Object.keys(evs[0]).sort()).toEqual(['date', 'total_hours', 'worker_count']);
    expect(evs[0].total_hours).toBe(7.5);
    expect(evs[0].worker_count).toBe(2);
    expect(notifyCalls()).toHaveLength(1);
    expect(notifyCalls()[0][1]).toBe(gcTenant);
    await clearLaborEvents();
  });

  it('show_crew_names only → names only (no hours anywhere)', async () => {
    await setLabor(false, true);
    await handleCrossTenantLaborSummary(subTenant, { connection_id: conn, date: DATE });
    const evs = await laborEvents();
    expect(evs).toHaveLength(1);
    expect(Object.keys(evs[0]).sort()).toEqual(['crew', 'date']);
    const crew = evs[0].crew as Record<string, unknown>[];
    expect(crew.map((c) => c.name)).toEqual(['Ana Lopez', 'Bo Reyes']);
    expect(crew.every((c) => !('hours' in c))).toBe(true);
    await clearLaborEvents();
  });

  it('both flags on → crew with per-worker hours + totals', async () => {
    await setLabor(true, true);
    await handleCrossTenantLaborSummary(subTenant, { connection_id: conn, date: DATE });
    const evs = await laborEvents();
    expect(evs).toHaveLength(1);
    expect(evs[0].crew).toEqual([
      { name: 'Ana Lopez', hours: 4 },
      { name: 'Bo Reyes', hours: 3.5 },
    ]);
    expect(evs[0].total_hours).toBe(7.5);
    // keep this event for the dedupe case below
  });

  it('dedupe: re-run for the same date stays at 1 event', async () => {
    vi.mocked(sendJob).mockClear();
    await handleCrossTenantLaborSummary(subTenant, { connection_id: conn, date: DATE });
    expect(await laborEvents()).toHaveLength(1);
    expect(notifyCalls()).toHaveLength(0);
  });

  it('zero entries on a different date → no event', async () => {
    await handleCrossTenantLaborSummary(subTenant, { connection_id: conn, date: '2026-07-10' });
    expect(await laborEvents()).toHaveLength(1); // still only the DATE event
  });

  it('revoked connection → no publish', async () => {
    await clearLaborEvents();
    await testPool.query(`UPDATE tenant_connections SET status='revoked' WHERE id=$1`, [conn]);
    vi.mocked(sendJob).mockClear();
    await handleCrossTenantLaborSummary(subTenant, { connection_id: conn, date: DATE });
    expect(await laborEvents()).toHaveLength(0);
    expect(notifyCalls()).toHaveLength(0);
    await testPool.query(`UPDATE tenant_connections SET status='active' WHERE id=$1`, [conn]);
  });

  it('leak floor: no payload published in this suite ever contained a cents field', async () => {
    const { rows } = await testPool.query(
      `SELECT payload FROM shared_project_events WHERE connection_id=$1`,
      [conn],
    );
    for (const r of rows) {
      expect(JSON.stringify(r.payload)).not.toMatch(/cents/i);
    }
  });
});
