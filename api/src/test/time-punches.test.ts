// time-punches.test.ts — enterprise clock in/out: multiple timestamps, missed
// punches, self-service edits/deletes, and the edit-safe day rollup.
//   POST   /v1/time-punches/clock-in   (project optional)
//   POST   /v1/time-punches/clock-out  (project optional; recompute day entry)
//   POST   /v1/time-punches            (add a completed "missed" punch; self-only for field tech)
//   PATCH  /v1/time-punches/:id         (correct times; recompute)
//   DELETE /v1/time-punches/:id         (remove; recompute — entry drops / soft-deletes)
//
// The day's clock time_entry is always SUM(closed punches) for that user+date+project.

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
import { timePunchRoutes } from '../routes/v1/time-punches.js';
import { registerErrorHandler } from '../plugins/error-handler.js';
import type { JWTPayload } from '../middleware/auth.js';

const tenantId = randomUUID();
const ownerId = randomUUID();
const workerId = randomUUID();
const slug = `tp-${tenantId.slice(0, 8)}`;
const ownerEmail = `tp-owner-${ownerId.slice(0, 8)}@example.com`;
const workerEmail = `tp-worker-${workerId.slice(0, 8)}@example.com`;

const app = Fastify({ logger: false });

function tok(overrides: Partial<JWTPayload> = {}): string {
  return jwt.sign(
    { jti: randomUUID(), user_id: ownerId, tenant_id: tenantId, role: 'OWNER' as const,
      email: ownerEmail, preferred_language: 'en' as const, ...overrides },
    process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
    { expiresIn: 86400 }
  );
}
const ft = () => tok({ role: 'FIELD_TECH', user_id: workerId, email: workerEmail });
const H = (t: string) => ({ 'user-agent': 'test/1.0', authorization: `Bearer ${t}`, 'content-type': 'application/json' });

/** Sum of active clock time_entry hours for a user + date. */
async function dayHours(userId: string, date: string): Promise<number> {
  const { rows } = await testPool.query(
    `SELECT COALESCE(SUM(hours_worked),0)::float AS h FROM time_entries
      WHERE tenant_id=$1 AND user_id=$2 AND date=$3 AND notes='Via clock in/out' AND deleted_at IS NULL`,
    [tenantId, userId, date]
  );
  return rows[0].h;
}
/** Add a completed punch (owner acting) for a user with explicit UTC times. */
async function missed(userId: string, inIso: string, outIso: string) {
  return app.inject({ method: 'POST', url: '/v1/time-punches', headers: H(tok()),
    body: JSON.stringify({ user_id: userId, clock_in_at: inIso, clock_out_at: outIso }) });
}

beforeAll(async () => {
  registerErrorHandler(app);
  await app.register(timePunchRoutes, { prefix: '/v1' });
  await app.ready();

  await testPool.query(
    `INSERT INTO tenants (id, name, slug, tier, status) VALUES ($1,'TP Tenant',$2,'professional','active')`,
    [tenantId, slug]);
  const pw = await bcrypt.hash('x', 10);
  await testPool.query(
    `INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, status)
     VALUES ($1,$2,$3,$4,'O','O','owner','active'),($5,$2,$6,$4,'W','W','field_tech','active')`,
    [ownerId, tenantId, ownerEmail, pw, workerId, workerEmail]);
  // Enterprise clock mode ON for this tenant.
  await testPool.query(
    `INSERT INTO tenant_settings (tenant_id, time_tracking_mode) VALUES ($1,'clock_in_out')`, [tenantId]);
});

afterAll(async () => {
  await app.close();
  // time_punches.time_entry_id FK → delete punches before entries.
  await testPool.query(`DELETE FROM time_punches WHERE tenant_id=$1`, [tenantId]);
  await testPool.query(`DELETE FROM time_entries WHERE tenant_id=$1`, [tenantId]);
  await testPool.query(`DELETE FROM tenant_settings WHERE tenant_id=$1`, [tenantId]);
  await testPool.query(`DELETE FROM audit_log WHERE tenant_id=$1`, [tenantId]);
  await testPool.query(`DELETE FROM users WHERE tenant_id=$1`, [tenantId]);
  await testPool.query(`DELETE FROM tenants WHERE id=$1`, [tenantId]);
});

describe('clock in/out (project optional)', () => {
  it('clocks in and out with no project and creates a day entry', async () => {
    const ci = await app.inject({ method: 'POST', url: '/v1/time-punches/clock-in', headers: H(tok()), body: '{}' });
    expect(ci.statusCode).toBe(201);
    const punch = JSON.parse(ci.body).punch;
    const co = await app.inject({ method: 'POST', url: '/v1/time-punches/clock-out', headers: H(tok()),
      body: JSON.stringify({ version: punch.version }) });
    expect(co.statusCode).toBe(200);
    const today = new Date().toISOString().slice(0, 10);
    expect(await dayHours(ownerId, today)).toBeGreaterThanOrEqual(0.25);
  });

  it('stores device GPS at clock-in when provided (Phase 6a / OQ-17 additive)', async () => {
    const ci = await app.inject({ method: 'POST', url: '/v1/time-punches/clock-in', headers: H(tok()),
      body: JSON.stringify({ clock_in_lat: 43.0731, clock_in_lng: -89.4012 }) });
    expect(ci.statusCode).toBe(201);
    const punch = JSON.parse(ci.body).punch;
    expect(Number(punch.clock_in_lat)).toBeCloseTo(43.0731, 4);
    expect(Number(punch.clock_in_lng)).toBeCloseTo(-89.4012, 4);
    // lat without lng → 422 (both-or-neither)
    const co = await app.inject({ method: 'POST', url: '/v1/time-punches/clock-out', headers: H(tok()),
      body: JSON.stringify({ version: punch.version }) });
    expect(co.statusCode).toBe(200);
    const bad = await app.inject({ method: 'POST', url: '/v1/time-punches/clock-in', headers: H(tok()),
      body: JSON.stringify({ clock_in_lat: 43.0 }) });
    expect(bad.statusCode).toBe(422);
  });
});

describe('missed punches — multiple timestamps sum, edit-safe rollup', () => {
  const DAY = '2026-06-10';
  let p1: { id: string; version: number };
  let p2: { id: string; version: number };

  it('adds two punches on one day and the day entry sums them', async () => {
    const r1 = await missed(workerId, `${DAY}T09:00:00.000Z`, `${DAY}T11:00:00.000Z`); // 2.00
    expect(r1.statusCode).toBe(201);
    p1 = JSON.parse(r1.body).time_punch;
    expect(await dayHours(workerId, DAY)).toBeCloseTo(2.0, 2);

    const r2 = await missed(workerId, `${DAY}T12:00:00.000Z`, `${DAY}T14:30:00.000Z`); // 2.50
    expect(r2.statusCode).toBe(201);
    p2 = JSON.parse(r2.body).time_punch;
    expect(await dayHours(workerId, DAY)).toBeCloseTo(4.5, 2);
  });

  it('editing a punch recomputes the day total', async () => {
    // shorten p1 from 2h → 1h (clock out at 10:00 instead of 11:00)
    const res = await app.inject({ method: 'PATCH', url: `/v1/time-punches/${p1.id}`, headers: H(tok()),
      body: JSON.stringify({ clock_out_at: `${DAY}T10:00:00.000Z`, version: p1.version }) });
    expect(res.statusCode).toBe(200);
    expect(await dayHours(workerId, DAY)).toBeCloseTo(3.5, 2); // 1.0 + 2.5
  });

  it('deleting punches recomputes down and soft-deletes the entry at zero', async () => {
    const d2 = await app.inject({ method: 'DELETE', url: `/v1/time-punches/${p2.id}`, headers: H(tok()) });
    expect(d2.statusCode).toBe(204);
    expect(await dayHours(workerId, DAY)).toBeCloseTo(1.0, 2);

    const d1 = await app.inject({ method: 'DELETE', url: `/v1/time-punches/${p1.id}`, headers: H(tok()) });
    expect(d1.statusCode).toBe(204);
    expect(await dayHours(workerId, DAY)).toBe(0); // entry soft-deleted, no active hours
  });
});

describe('self-service guardrails', () => {
  it('field tech can add their OWN missed punch but not another user\'s', async () => {
    const own = await app.inject({ method: 'POST', url: '/v1/time-punches', headers: H(ft()),
      body: JSON.stringify({ clock_in_at: '2026-06-11T08:00:00.000Z', clock_out_at: '2026-06-11T16:00:00.000Z' }) });
    expect(own.statusCode).toBe(201);

    const other = await app.inject({ method: 'POST', url: '/v1/time-punches', headers: H(ft()),
      body: JSON.stringify({ user_id: ownerId, clock_in_at: '2026-06-11T08:00:00.000Z', clock_out_at: '2026-06-11T16:00:00.000Z' }) });
    expect(other.statusCode).toBe(403);
  });

  it('rejects a clock-out that is before clock-in', async () => {
    const bad = await app.inject({ method: 'POST', url: '/v1/time-punches', headers: H(tok()),
      body: JSON.stringify({ user_id: workerId, clock_in_at: '2026-06-12T16:00:00.000Z', clock_out_at: '2026-06-12T08:00:00.000Z' }) });
    expect(bad.statusCode).toBe(422);
  });
});
