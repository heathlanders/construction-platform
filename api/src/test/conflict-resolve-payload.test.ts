// conflict-resolve-payload.test.ts — the exact PATCH shape the mobile conflict
// resolver sends (T-13/T-14).
//
// `ConflictResolveScreen` merges EVERY field in the table's registry entry and PATCHes
// the lot at the server's version. Fields the record simply doesn't have go over as
// `null` — and `notes` was declared `.optional()` without `.nullable()` on both
// conflict-capable routes, so resolving any record without notes 422'd
// "Validation failed" and the conflict stayed stuck in the inbox forever, unresolvable
// by the person the whole side-by-side UI exists for.
//
// Nothing caught it because nothing had ever sent a resolve payload end to end; the
// conflict E2E did, on its first run (2026-07-27).
//
// The columns are nullable in the DB. Rule: if a resolver field can be null in the
// registry, the route's update schema must accept null.
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import Fastify from 'fastify';
import jwt from 'jsonwebtoken';

vi.mock('../lib/queue.js', () => ({ sendJob: vi.fn().mockResolvedValue(undefined) }));

import { testPool } from './setup.js';
import { inspectionRoutes } from '../routes/v1/inspections.js';
import { timeEntryRoutes } from '../routes/v1/time-entries.js';
import { registerErrorHandler } from '../plugins/error-handler.js';
import type { JWTPayload } from '../middleware/auth.js';

const tenantId = randomUUID();
const userId = randomUUID();
const projectId = randomUUID();
const slug = `crp-${tenantId.slice(0, 8)}`;

const app = Fastify({ logger: false });

const H = () => ({
  'user-agent': 'test-runner/1.0',
  'content-type': 'application/json',
  authorization: `Bearer ${jwt.sign(
    { jti: randomUUID(), user_id: userId, tenant_id: tenantId, role: 'OWNER',
      email: `${slug}@ex.com`, preferred_language: 'en' as const } satisfies Partial<JWTPayload>,
    process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
    { expiresIn: 86400 },
  )}`,
});

beforeAll(async () => {
  registerErrorHandler(app);
  await app.register(inspectionRoutes, { prefix: '/v1' });
  await app.register(timeEntryRoutes, { prefix: '/v1' });
  await app.ready();

  await testPool.query(`INSERT INTO tenants (id,name,slug,tier,status) VALUES ($1,'Conflict Payload',$2,'professional','active')`, [tenantId, slug]);
  await testPool.query(
    `INSERT INTO users (id,tenant_id,email,password_hash,first_name,last_name,role,status)
     VALUES ($1,$2,$3,'x','C','P','owner','active')`,
    [userId, tenantId, `${slug}@ex.com`],
  );
  await testPool.query(`INSERT INTO projects (id,tenant_id,name,status) VALUES ($1,$2,'Conflict Payload Project','active')`, [projectId, tenantId]);
});

afterAll(async () => {
  await app.close();
  await testPool.query(`DELETE FROM audit_log WHERE tenant_id=$1`, [tenantId]);
  await testPool.query(`DELETE FROM inspections WHERE tenant_id=$1`, [tenantId]);
  await testPool.query(`DELETE FROM time_entries WHERE tenant_id=$1`, [tenantId]);
  await testPool.query(`DELETE FROM projects WHERE id=$1`, [projectId]);
  await testPool.query(`DELETE FROM users WHERE tenant_id=$1`, [tenantId]);
  await testPool.query(`DELETE FROM tenants WHERE id=$1`, [tenantId]);
});

describe('conflict resolve PATCH payloads (every registry field, nulls included)', () => {
  it('inspections accept the merged payload with null notes/inspector/date', async () => {
    const id = randomUUID();
    await testPool.query(
      `INSERT INTO inspections (id,tenant_id,project_id,title,status,created_by) VALUES ($1,$2,$3,'Rough-in','scheduled',$4)`,
      [id, tenantId, projectId, userId],
    );

    const res = await app.inject({
      method: 'PATCH',
      url: `/v1/inspections/${id}`,
      headers: H(),
      // Mirrors conflict-registry.ts `inspections` fields exactly.
      body: JSON.stringify({
        version: 1, title: 'Rough-in', status: 'passed',
        inspection_date: null, inspector_name: null, notes: null,
      }),
    });

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).inspection.status).toBe('passed');
  });

  it('time entries accept the merged payload with null notes/cost code/budget line', async () => {
    const id = randomUUID();
    await testPool.query(
      `INSERT INTO time_entries (id,tenant_id,project_id,user_id,date,hours_worked,created_by)
       VALUES ($1,$2,$3,$4,'2026-07-27',4,$4)`,
      [id, tenantId, projectId, userId],
    );

    const res = await app.inject({
      method: 'PATCH',
      url: `/v1/time-entries/${id}`,
      headers: H(),
      // Mirrors conflict-registry.ts `time_entries` fields exactly.
      body: JSON.stringify({
        version: 1, hours_worked: 6, hourly_rate_cents: null,
        cost_code_id: null, budget_line_item_id: null, notes: null,
      }),
    });

    expect(res.statusCode).toBe(200);
    expect(Number(JSON.parse(res.body).time_entry.hours_worked)).toBe(6);
  });
});
