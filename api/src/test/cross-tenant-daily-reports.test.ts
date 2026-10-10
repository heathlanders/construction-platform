// cross-tenant-daily-reports.test.ts — Doc 07 §5 daily_reports family (auto-mirror).
//   A daily report on a bridge mirror project (projects.connection_id set) auto-publishes
//   daily_report.submitted/updated gated ONLY by optional_events.daily_reports — no
//   per-report opt-in. Also covers the labor.* fail-closed pure gate.
// Locked decisions: T-44, T-45.

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import Fastify from 'fastify';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

vi.mock('../lib/queue.js', () => ({
  sendJob: vi.fn().mockResolvedValue(undefined),
  getQueue: vi.fn(),
  stopQueue: vi.fn().mockResolvedValue(undefined),
}));

import { testPool } from './setup.js';
import { sendJob } from '../lib/queue.js';
import { dailyReportRoutes } from '../routes/v1/daily-reports.js';
import { connectionRoutes } from '../routes/v1/connections.js';
import { registerErrorHandler } from '../plugins/error-handler.js';
import { eventTypePermitted, DEFAULT_CONNECTION_PERMISSIONS, type ConnectionPermissions } from '../lib/cross-tenant/bridge.js';

const gcTenant = randomUUID();
const subTenant = randomUUID();
const gcOwner = randomUUID();
const subOwner = randomUUID();
const mirrorProject = randomUUID();
const plainProject = randomUUID();
const conn = randomUUID();

const app = Fastify({ logger: false });

function token(userId: string, tenantId: string): string {
  return jwt.sign(
    { jti: randomUUID(), user_id: userId, tenant_id: tenantId, role: 'OWNER', email: 'o@dr.test', preferred_language: 'en' },
    process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
    { expiresIn: 86400 },
  );
}
const H = (t: string) => ({ 'user-agent': 'test-runner/1.0', authorization: `Bearer ${t}`, 'content-type': 'application/json' });
const subTok = () => token(subOwner, subTenant);
const notifyCalls = () => vi.mocked(sendJob).mock.calls.filter((c) => c[0] === 'cross_tenant.notify');

async function drEvents(type: string): Promise<Record<string, unknown>[]> {
  const { rows } = await testPool.query(
    `SELECT payload FROM shared_project_events WHERE connection_id=$1 AND event_type=$2 ORDER BY created_at`,
    [conn, type],
  );
  return rows.map((r) => r.payload);
}

beforeAll(async () => {
  registerErrorHandler(app);
  await app.register(dailyReportRoutes, { prefix: '/v1' });
  await app.register(connectionRoutes, { prefix: '/v1' });
  await app.ready();

  await testPool.query(
    `INSERT INTO tenants (id,name,slug,tier,status) VALUES
       ($1,'GC DR',$3,'professional','active'),
       ($2,'Sub DR',$4,'professional','active')`,
    [gcTenant, subTenant, `gcd-${gcTenant.slice(0, 8)}`, `sbd-${subTenant.slice(0, 8)}`],
  );
  const pw = await bcrypt.hash('x', 10);
  await testPool.query(
    `INSERT INTO users (id,tenant_id,email,password_hash,first_name,last_name,role,status) VALUES
       ($1,$2,'gc@dr.test',$5,'G','C','owner','active'),
       ($3,$4,'sub@dr.test',$5,'S','B','owner','active')`,
    [gcOwner, gcTenant, subOwner, subTenant, pw],
  );
  await testPool.query(
    `INSERT INTO tenant_connections (id,gc_tenant_id,sub_tenant_id,status,invited_by) VALUES ($1,$2,$3,'active',$4)`,
    [conn, gcTenant, subTenant, gcOwner],
  );
  // Sub mirror project (connection-linked) + a plain sub project (no bridge).
  await testPool.query(
    `INSERT INTO projects (id,tenant_id,name,status,state,connection_id) VALUES ($1,$2,'Mirror','active','WI',$3)`,
    [mirrorProject, subTenant, conn],
  );
  await testPool.query(
    `INSERT INTO projects (id,tenant_id,name,status,state) VALUES ($1,$2,'Plain','active','WI')`,
    [plainProject, subTenant],
  );
});

afterAll(async () => {
  await testPool.query(`DELETE FROM shared_project_events WHERE connection_id=$1`, [conn]);
  await testPool.query(`DELETE FROM daily_reports WHERE tenant_id=$1`, [subTenant]);
  await testPool.query(`UPDATE tenant_connections SET project_id=NULL WHERE id=$1`, [conn]);
  await testPool.query(`UPDATE projects SET connection_id=NULL WHERE tenant_id=$1`, [subTenant]);
  await testPool.query(`DELETE FROM tenant_connections WHERE id=$1`, [conn]);
  await testPool.query(`DELETE FROM audit_log WHERE tenant_id = ANY($1)`, [[gcTenant, subTenant]]);
  await testPool.query(`DELETE FROM projects WHERE tenant_id=$1`, [subTenant]);
  await testPool.query(`DELETE FROM users WHERE tenant_id = ANY($1)`, [[gcTenant, subTenant]]);
  await testPool.query(`DELETE FROM tenants WHERE id = ANY($1)`, [[gcTenant, subTenant]]);
  await app.close();
});

describe('eventTypePermitted — daily_report fail-open; labor fail-CLOSED', () => {
  it('daily_report.* gates on optional_events.daily_reports', () => {
    expect(eventTypePermitted(DEFAULT_CONNECTION_PERMISSIONS, 'daily_report.submitted')).toBe(true);
    expect(eventTypePermitted(null, 'daily_report.submitted')).toBe(true); // fail-open
    const off: ConnectionPermissions = {
      ...DEFAULT_CONNECTION_PERMISSIONS,
      optional_events: { ...DEFAULT_CONNECTION_PERMISSIONS.optional_events, daily_reports: false },
    };
    expect(eventTypePermitted(off, 'daily_report.submitted')).toBe(false);
    expect(eventTypePermitted(off, 'daily_report.updated')).toBe(false);
  });

  it('labor.* fails CLOSED on §5 defaults; opens on either flag', () => {
    expect(eventTypePermitted(DEFAULT_CONNECTION_PERMISSIONS, 'labor.summary')).toBe(false); // defaults false
    expect(eventTypePermitted(null, 'labor.summary')).toBe(false);
    const hours: ConnectionPermissions = {
      ...DEFAULT_CONNECTION_PERMISSIONS,
      labor_visibility: { show_total_hours: true, show_crew_names: false, show_labor_costs: false },
    };
    const names: ConnectionPermissions = {
      ...DEFAULT_CONNECTION_PERMISSIONS,
      labor_visibility: { show_total_hours: false, show_crew_names: true, show_labor_costs: false },
    };
    expect(eventTypePermitted(hours, 'labor.summary')).toBe(true);
    expect(eventTypePermitted(names, 'labor.summary')).toBe(true);
  });
});

describe('daily report auto-mirror (route chain)', () => {
  let reportId = '';
  let version = 1;

  it('report on the mirror project → daily_report.submitted with exact whitelist + notify to GC', async () => {
    vi.mocked(sendJob).mockClear();
    const res = await app.inject({
      method: 'POST', url: '/v1/daily-reports', headers: H(subTok()),
      payload: { project_id: mirrorProject, report_date: '2026-07-17', weather: { conditions: 'sunny 85F' }, notes: 'Rough-in done east wing' },
    });
    expect(res.statusCode).toBe(201);
    reportId = res.json().daily_report.id;
    version = res.json().daily_report.version;

    const evs = await drEvents('daily_report.submitted');
    expect(evs).toHaveLength(1);
    expect(Object.keys(evs[0]).sort()).toEqual(['notes', 'report_date', 'report_id', 'weather']);
    expect(evs[0].report_id).toBe(reportId);
    expect(evs[0].report_date).toBe('2026-07-17');

    const notifies = notifyCalls();
    expect(notifies).toHaveLength(1);
    expect(notifies[0][1]).toBe(gcTenant);
  });

  it('daily_reports toggle off → 201 but NO event and NO notify', async () => {
    await testPool.query(
      `UPDATE tenant_connections SET permissions = jsonb_set(permissions,'{optional_events,daily_reports}','false') WHERE id=$1`,
      [conn],
    );
    vi.mocked(sendJob).mockClear();
    const res = await app.inject({
      method: 'POST', url: '/v1/daily-reports', headers: H(subTok()),
      payload: { project_id: mirrorProject, report_date: '2026-07-16', notes: 'blocked' },
    });
    expect(res.statusCode).toBe(201);
    expect(await drEvents('daily_report.submitted')).toHaveLength(1);
    expect(notifyCalls()).toHaveLength(0);
    await testPool.query(
      `UPDATE tenant_connections SET permissions = jsonb_set(permissions,'{optional_events,daily_reports}','true') WHERE id=$1`,
      [conn],
    );
  });

  it('PATCH notes → daily_report.updated + notify', async () => {
    vi.mocked(sendJob).mockClear();
    const res = await app.inject({
      method: 'PATCH', url: `/v1/daily-reports/${reportId}`, headers: H(subTok()),
      payload: { notes: 'Rough-in done east wing; inspector booked', version },
    });
    expect(res.statusCode).toBe(200);
    const evs = await drEvents('daily_report.updated');
    expect(evs).toHaveLength(1);
    expect(evs[0].report_id).toBe(reportId);
    expect(notifyCalls()).toHaveLength(1);
  });

  it('report on a NON-mirror project → no event', async () => {
    vi.mocked(sendJob).mockClear();
    const res = await app.inject({
      method: 'POST', url: '/v1/daily-reports', headers: H(subTok()),
      payload: { project_id: plainProject, report_date: '2026-07-17', notes: 'internal only' },
    });
    expect(res.statusCode).toBe(201);
    expect(await drEvents('daily_report.submitted')).toHaveLength(1);
    expect(notifyCalls()).toHaveLength(0);
  });

  it('revoked connection → 201 but no publish, no notify', async () => {
    await testPool.query(`UPDATE tenant_connections SET status='revoked' WHERE id=$1`, [conn]);
    vi.mocked(sendJob).mockClear();
    const res = await app.inject({
      method: 'POST', url: '/v1/daily-reports', headers: H(subTok()),
      payload: { project_id: mirrorProject, report_date: '2026-07-15', notes: 'after revoke' },
    });
    expect(res.statusCode).toBe(201);
    expect(await drEvents('daily_report.submitted')).toHaveLength(1);
    expect(notifyCalls()).toHaveLength(0);
    await testPool.query(`UPDATE tenant_connections SET status='active' WHERE id=$1`, [conn]);
  });

  it('generic events endpoint rejects daily_report.* (reserved prefix)', async () => {
    const res = await app.inject({
      method: 'POST', url: `/v1/connections/${conn}/events`, headers: H(subTok()),
      payload: { event_type: 'daily_report.submitted', payload: { report_id: randomUUID(), report_date: '2026-07-17', weather: null, notes: 'forged' } },
    });
    expect(res.statusCode).toBe(422);
    expect(res.json().error.code).toBe('EVENT_TYPE_NOT_ALLOWED');
  });
});
