// timecards-payroll.test.ts — money-path integration tests
// Covers the time-entry → weekly timecard FSM → payroll export chain:
//   POST /v1/time-entries           (create + role gate)
//   POST /v1/timecards              (open week, sum hours, overtime)
//   POST /v1/timecards/:id/submit   (re-sum, draft→submitted)
//   POST /v1/timecards/:id/approve  (OWNER/PM, optimistic lock, enqueue push)
//   POST /v1/timecards/:id/reject   (OWNER/PM, note required)
//   POST /v1/payroll/export         (Monday gate, approved-timecard gate, enqueue)
// Locked decisions: T-02, T-10, T-12, T-60, T-62
//
// The pg-boss queue is mocked so no real queue is booted; sendJob is a spy so we
// can assert enqueue behavior (payroll push on approve, export job on export).
//
// DB invariant: timecards have a partial-unique (tenant,user,week_start) over
// non-rejected active cards — so each scenario below uses its OWN Monday week and
// opens its card exactly once.

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
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
import { timeEntryRoutes } from '../routes/v1/time-entries.js';
import { timecardRoutes } from '../routes/v1/timecards.js';
import { payrollRoutes } from '../routes/v1/payroll.js';
import { registerErrorHandler } from '../plugins/error-handler.js';
import type { JWTPayload } from '../middleware/auth.js';

const sendJobMock = sendJob as unknown as ReturnType<typeof vi.fn>;

// ─── Fixtures ───────────────────────────────────────────────────────────────
const tenantId = randomUUID();
const ownerId = randomUUID();
const workerId = randomUUID();
const projectId = randomUUID();
const tenantSlug = `tcpay-${tenantId.slice(0, 8)}`;
const ownerEmail = `tcpay-owner-${ownerId.slice(0, 8)}@example.com`;
const workerEmail = `tcpay-worker-${workerId.slice(0, 8)}@example.com`;

// Distinct Mondays (2026-06-24 is a Wednesday). One week per scenario.
const WEEK_SUM = '2026-06-22';      // overtime summation
const WEEK_HAPPY = '2026-06-01';    // open→submit→approve (no integration)
const WEEK_BADSTATUS = '2026-06-08';// approve while draft
const WEEK_FT = '2026-06-15';       // field-tech approve → 403
const WEEK_CONFLICT = '2026-05-25'; // stale-version approve → 409 then 200
const WEEK_REJECT = '2026-05-18';   // submit→reject
const WEEK_INTEG = '2026-05-11';    // approve enqueues provider push

const app = Fastify({ logger: false });

function makeToken(overrides: Partial<JWTPayload> = {}): string {
  return jwt.sign(
    {
      jti: randomUUID(),
      user_id: ownerId,
      tenant_id: tenantId,
      role: 'OWNER' as const,
      email: ownerEmail,
      preferred_language: 'en' as const,
      ...overrides,
    },
    process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
    { expiresIn: 86400 }
  );
}

const ftToken = () => makeToken({ role: 'FIELD_TECH', user_id: workerId, email: workerEmail });

const H = (token: string) => ({
  'user-agent': 'test-runner/1.0',
  authorization: `Bearer ${token}`,
  'content-type': 'application/json',
});

async function addEntry(date: string, hours: number) {
  return app.inject({
    method: 'POST',
    url: '/v1/time-entries',
    headers: H(makeToken()),
    body: JSON.stringify({ project_id: projectId, user_id: workerId, date, hours_worked: hours }),
  });
}

/** Open a timecard for the worker; returns the timecard row. */
async function openCard(week_start: string) {
  const res = await app.inject({
    method: 'POST',
    url: '/v1/timecards',
    headers: H(makeToken()),
    body: JSON.stringify({ week_start, user_id: workerId }),
  });
  expect(res.statusCode).toBe(201);
  return JSON.parse(res.body).timecard;
}

/** Open + submit; returns the submitted timecard row. */
async function openAndSubmit(week_start: string) {
  const card = await openCard(week_start);
  const res = await app.inject({ method: 'POST', url: `/v1/timecards/${card.id}/submit`, headers: H(makeToken()), body: '{}' });
  expect(res.statusCode).toBe(200);
  return JSON.parse(res.body).timecard;
}

beforeAll(async () => {
  registerErrorHandler(app);
  await app.register(timeEntryRoutes, { prefix: '/v1' });
  await app.register(timecardRoutes, { prefix: '/v1' });
  await app.register(payrollRoutes, { prefix: '/v1' });
  await app.ready();

  await testPool.query(
    `INSERT INTO tenants (id, name, slug, tier, status)
     VALUES ($1, 'TC Payroll Tenant', $2, 'professional', 'active')`,
    [tenantId, tenantSlug]
  );
  const pw = await bcrypt.hash('test-password-123', 10);
  await testPool.query(
    `INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, status)
     VALUES ($1,$2,$3,$4,'Olive','Owner','owner','active'),
            ($5,$2,$6,$4,'Wally','Worker','field_tech','active')`,
    [ownerId, tenantId, ownerEmail, pw, workerId, workerEmail]
  );
  await testPool.query(
    `INSERT INTO projects (id, tenant_id, name, status) VALUES ($1,$2,'TC Project','active')`,
    [projectId, tenantId]
  );
});

afterAll(async () => {
  await app.close();
  await testPool.query(`DELETE FROM tenant_integrations WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM timecards WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM time_entries WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM audit_log WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM projects WHERE id = $1`, [projectId]);
  await testPool.query(`DELETE FROM users WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM tenants WHERE id = $1`, [tenantId]);
});

beforeEach(() => {
  sendJobMock.mockClear();
});

// ─── Time entries ─────────────────────────────────────────────────────────────
describe('POST /v1/time-entries', () => {
  it('creates a time entry (201)', async () => {
    const res = await addEntry(WEEK_SUM, 24);
    expect(res.statusCode).toBe(201);
    const { time_entry } = JSON.parse(res.body);
    expect(time_entry.tenant_id).toBe(tenantId);
    expect(Number(time_entry.hours_worked)).toBe(24);
    expect(time_entry.user_id).toBe(workerId);
  });

  it('rejects an invalid hours value (422)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/time-entries',
      headers: H(makeToken()),
      body: JSON.stringify({ project_id: projectId, user_id: workerId, date: WEEK_SUM, hours_worked: 30 }),
    });
    expect(res.statusCode).toBe(422);
  });

  it('lets a FIELD_TECH log their OWN time, but not another user\'s', async () => {
    // Neutral date (different week) so this does not affect the WEEK_SUM overtime total below.
    const own = await app.inject({
      method: 'POST',
      url: '/v1/time-entries',
      headers: H(ftToken()), // ftToken user_id === workerId
      body: JSON.stringify({ project_id: projectId, user_id: workerId, date: '2026-07-06', hours_worked: 8 }),
    });
    expect(own.statusCode).toBe(201);

    // Logging for a DIFFERENT user (the owner) as a field tech → 403 (self-only).
    const other = await app.inject({
      method: 'POST',
      url: '/v1/time-entries',
      headers: H(ftToken()),
      body: JSON.stringify({ project_id: projectId, user_id: ownerId, date: '2026-07-06', hours_worked: 8 }),
    });
    expect(other.statusCode).toBe(403);
  });

  // T-13/T-14: a stale-version PATCH returns 409 WITH the current server row so the
  // mobile client can render a side-by-side conflict resolver.
  it('returns 409 + server_record on a stale-version PATCH', async () => {
    const created = JSON.parse((await addEntry('2026-06-20', 6)).body).time_entry; // version 1
    // Bump to version 2 with a successful edit (version must be >= 1, so 0 isn't a valid "stale").
    const ok = await app.inject({
      method: 'PATCH',
      url: `/v1/time-entries/${created.id}`,
      headers: H(makeToken()),
      body: JSON.stringify({ hours_worked: 6.5, version: created.version }),
    });
    expect(ok.statusCode).toBe(200);

    // Re-submit at the now-stale version 1 → conflict, with the current server row attached.
    const res = await app.inject({
      method: 'PATCH',
      url: `/v1/time-entries/${created.id}`,
      headers: H(makeToken()),
      body: JSON.stringify({ hours_worked: 7, version: created.version }),
    });
    expect(res.statusCode).toBe(409);
    const body = JSON.parse(res.body);
    expect(body.error.code).toBe('VERSION_CONFLICT');
    expect(body.server_record).toBeTruthy();
    expect(body.server_record.id).toBe(created.id);
    expect(body.server_record.version).toBe(created.version + 1); // 2
    expect(Number(body.server_record.hours_worked)).toBe(6.5);
  });
});

// ─── Timecard FSM ───────────────────────────────────────────────────────────────
describe('Timecard FSM (T-60)', () => {
  it('opens a card summing the week and computes overtime', async () => {
    // 24h (created above) + 21h = 45h → 5h overtime.
    expect((await addEntry('2026-06-23', 21)).statusCode).toBe(201);
    const card = await openCard(WEEK_SUM);
    expect(card.status).toBe('draft');
    expect(Number(card.total_hours)).toBe(45);
    expect(Number(card.overtime_hours)).toBe(5);
    expect(card.version).toBe(1);
  });

  it('runs submit → approve and enqueues nothing without integrations', async () => {
    const submitted = await openAndSubmit(WEEK_HAPPY);
    expect(submitted.status).toBe('submitted');
    expect(submitted.version).toBe(2);

    const res = await app.inject({
      method: 'POST',
      url: `/v1/timecards/${submitted.id}/approve`,
      headers: H(makeToken()),
      body: JSON.stringify({ version: submitted.version }),
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).timecard.status).toBe('approved');
    expect(sendJobMock).not.toHaveBeenCalled();
  });

  it('blocks approving a draft card (422 INVALID_STATUS)', async () => {
    const card = await openCard(WEEK_BADSTATUS);
    const res = await app.inject({
      method: 'POST',
      url: `/v1/timecards/${card.id}/approve`,
      headers: H(makeToken()),
      body: JSON.stringify({ version: card.version }),
    });
    expect(res.statusCode).toBe(422);
    expect(JSON.parse(res.body).error.code).toBe('INVALID_STATUS');
  });

  it('returns 403 when a FIELD_TECH tries to approve', async () => {
    const submitted = await openAndSubmit(WEEK_FT);
    const res = await app.inject({
      method: 'POST',
      url: `/v1/timecards/${submitted.id}/approve`,
      headers: H(ftToken()),
      body: JSON.stringify({ version: submitted.version }),
    });
    expect(res.statusCode).toBe(403);
  });

  it('returns 409 on stale version, then 200 on the right version (T-12)', async () => {
    const submitted = await openAndSubmit(WEEK_CONFLICT);

    const conflict = await app.inject({
      method: 'POST',
      url: `/v1/timecards/${submitted.id}/approve`,
      headers: H(makeToken()),
      body: JSON.stringify({ version: submitted.version - 1 }),
    });
    expect(conflict.statusCode).toBe(409);
    expect(JSON.parse(conflict.body).error.code).toBe('VERSION_CONFLICT');

    const ok = await app.inject({
      method: 'POST',
      url: `/v1/timecards/${submitted.id}/approve`,
      headers: H(makeToken()),
      body: JSON.stringify({ version: submitted.version }),
    });
    expect(ok.statusCode).toBe(200);
    expect(JSON.parse(ok.body).timecard.status).toBe('approved');
  });
});

// ─── Reject path ────────────────────────────────────────────────────────────────
describe('POST /v1/timecards/:id/reject (T-60)', () => {
  it('requires a rejection note (422) then rejects (200)', async () => {
    const submitted = await openAndSubmit(WEEK_REJECT);

    const noNote = await app.inject({
      method: 'POST',
      url: `/v1/timecards/${submitted.id}/reject`,
      headers: H(makeToken()),
      body: JSON.stringify({ version: submitted.version }),
    });
    expect(noNote.statusCode).toBe(422);

    const rejected = await app.inject({
      method: 'POST',
      url: `/v1/timecards/${submitted.id}/reject`,
      headers: H(makeToken()),
      body: JSON.stringify({ version: submitted.version, rejection_note: 'Missing Tuesday hours' }),
    });
    expect(rejected.statusCode).toBe(200);
    const body = JSON.parse(rejected.body).timecard;
    expect(body.status).toBe('rejected');
    expect(body.rejection_note).toBe('Missing Tuesday hours');
  });
});

// ─── Payroll export (T-62) ──────────────────────────────────────────────────────
describe('POST /v1/payroll/export (T-62)', () => {
  it('rejects a non-Monday week_start (422 INVALID_WEEK_START)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/payroll/export',
      headers: H(makeToken()),
      body: JSON.stringify({ week_start: '2026-06-24' }), // Wednesday
    });
    expect(res.statusCode).toBe(422);
    expect(JSON.parse(res.body).error.code).toBe('INVALID_WEEK_START');
  });

  it('rejects a week with no approved timecards (422 NO_APPROVED_TIMECARDS)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/payroll/export',
      headers: H(makeToken()),
      body: JSON.stringify({ week_start: WEEK_REJECT }), // only a rejected card exists
    });
    expect(res.statusCode).toBe(422);
    expect(JSON.parse(res.body).error.code).toBe('NO_APPROVED_TIMECARDS');
  });

  it('returns 403 for FIELD_TECH', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/payroll/export',
      headers: H(ftToken()),
      body: JSON.stringify({ week_start: WEEK_HAPPY }),
    });
    expect(res.statusCode).toBe(403);
  });

  it('enqueues an export job once an approved timecard exists (202)', async () => {
    // WEEK_HAPPY has an approved card from the FSM suite.
    const res = await app.inject({
      method: 'POST',
      url: '/v1/payroll/export',
      headers: H(makeToken()),
      body: JSON.stringify({ week_start: WEEK_HAPPY }),
    });
    expect(res.statusCode).toBe(202);
    expect(JSON.parse(res.body).job_id).toBeTruthy();
    expect(sendJobMock).toHaveBeenCalledWith(
      'payroll.export_csv',
      tenantId,
      expect.objectContaining({ week_start: WEEK_HAPPY })
    );
  });
});

// ─── Approve enqueues a provider push per active integration (T-62) ──────────────
describe('Approve enqueues payroll push per active integration (T-62)', () => {
  it('enqueues payroll.quickbooks_push when an active integration exists', async () => {
    await testPool.query(
      `INSERT INTO tenant_integrations (id, tenant_id, provider, status)
       VALUES ($1,$2,'quickbooks','active')`,
      [randomUUID(), tenantId]
    );

    const submitted = await openAndSubmit(WEEK_INTEG);

    sendJobMock.mockClear();
    const res = await app.inject({
      method: 'POST',
      url: `/v1/timecards/${submitted.id}/approve`,
      headers: H(makeToken()),
      body: JSON.stringify({ version: submitted.version }),
    });
    expect(res.statusCode).toBe(200);
    expect(sendJobMock).toHaveBeenCalledWith(
      'payroll.quickbooks_push',
      tenantId,
      expect.objectContaining({ timecard_id: submitted.id })
    );
  });
});
