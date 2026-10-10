// blueprint-gap-hardening-phase3.test.ts — Phase 3 (B3.1, B3.3, B3.6) API tests:
//   • B3.1 bulk-review endpoint (accept-all / reject-all in one call); imported analysis locks
//     both bulk-review and single PATCH (409)
//   • B3.3 import emits a blueprint_imported notification for owner/PM
//   • B3.6 GET /:id/tasks on a soft-deleted analysis → 404 (no orphaned task listing)

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
import { blueprintRoutes } from '../routes/v1/blueprints.js';
import { handleBlueprintAnalyze } from '../workers/blueprint-worker.js';
import { loadReferenceCache } from '../lib/jurisdictions/reference-store.js';
import { registerErrorHandler } from '../plugins/error-handler.js';
import type { JWTPayload } from '../middleware/auth.js';

const tenantId = randomUUID();
const ownerId = randomUUID();
const projectId = randomUUID();
const slug = `bgh3-${tenantId.slice(0, 8)}`;

const app = Fastify({ logger: false });

function token(): string {
  return jwt.sign(
    { jti: randomUUID(), user_id: ownerId, tenant_id: tenantId, role: 'OWNER' as const,
      email: 'owner@bgh3.test', preferred_language: 'en' as const },
    process.env.JWT_SECRET ?? 'dev-secret-change-in-production', { expiresIn: 86400 },
  );
}
const H = (t: string) => ({ 'user-agent': 'test-runner/1.0', authorization: `Bearer ${t}`, 'content-type': 'application/json' });

async function analyzeToReviewReady(): Promise<string> {
  const res = await app.inject({
    method: 'POST', url: '/v1/blueprints/analyze', headers: H(token()),
    body: JSON.stringify({ project_id: projectId, building_type: 'residential_sf' }),
  });
  const { analysis } = JSON.parse(res.body);
  await handleBlueprintAnalyze(tenantId, {
    analysis_id: analysis.id, project_id: projectId, building_type: 'residential_sf', user_id: ownerId,
  });
  return analysis.id as string;
}

async function cleanupSchedule(): Promise<void> {
  await testPool.query(`UPDATE blueprint_proposed_tasks SET schedule_task_id = NULL WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`UPDATE schedule_tasks SET predecessor_task_id = NULL WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM task_steps WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM task_dependencies WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM schedule_tasks WHERE tenant_id = $1`, [tenantId]);
}

beforeAll(async () => {
  registerErrorHandler(app);
  await app.register(blueprintRoutes, { prefix: '/v1' });
  await app.ready();
  await loadReferenceCache(testPool);

  await testPool.query(
    `INSERT INTO tenants (id, name, slug, tier, status) VALUES ($1,'BGH3 Tenant',$2,'professional','active')`,
    [tenantId, slug],
  );
  const pw = await bcrypt.hash('x', 10);
  await testPool.query(
    `INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, status)
     VALUES ($1,$2,'owner@bgh3.test',$3,'Olive','Owner','owner','active')`,
    [ownerId, tenantId, pw],
  );
  await testPool.query(
    `INSERT INTO projects (id, tenant_id, name, status, state) VALUES ($1,$2,'BGH3 Project','active','WI')`,
    [projectId, tenantId],
  );
});

afterAll(async () => {
  await app.close();
  await cleanupSchedule();
  await testPool.query(`DELETE FROM blueprint_proposed_tasks WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM blueprint_sheets WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM blueprint_analyses WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM notifications WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM audit_log WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM projects WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM users WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM tenants WHERE id = $1`, [tenantId]);
});

// ─── B3.1 — bulk review + imported lock ──────────────────────────────────────
describe('B3.1 bulk-review + imported lock', () => {
  it('accept-all (no task_ids) flips every pending task to accepted', async () => {
    const analysisId = await analyzeToReviewReady();
    const res = await app.inject({
      method: 'POST', url: `/v1/blueprints/${analysisId}/tasks/bulk-review`, headers: H(token()),
      body: JSON.stringify({ review_status: 'accepted' }),
    });
    expect(res.statusCode).toBe(200);
    const { updated_count } = JSON.parse(res.body);
    expect(updated_count).toBeGreaterThan(0);
    const { rows } = await testPool.query(
      `SELECT count(*)::int AS n FROM blueprint_proposed_tasks WHERE analysis_id = $1 AND review_status = 'pending'`,
      [analysisId]);
    expect(rows[0].n).toBe(0);
    await testPool.query(`DELETE FROM blueprint_proposed_tasks WHERE analysis_id = $1`, [analysisId]);
    await testPool.query(`DELETE FROM blueprint_analyses WHERE id = $1`, [analysisId]);
  });

  it('imported analysis locks bulk-review (409) and single PATCH (409)', async () => {
    const analysisId = await analyzeToReviewReady();
    // Accept 2 + import.
    await testPool.query(
      `UPDATE blueprint_proposed_tasks SET review_status = 'accepted'
       WHERE id IN (SELECT id FROM blueprint_proposed_tasks WHERE analysis_id = $1 LIMIT 2)`, [analysisId]);
    const imp = await app.inject({
      method: 'POST', url: `/v1/blueprints/${analysisId}/import`, headers: H(token()), body: '{}',
    });
    expect(imp.statusCode).toBe(200);

    const bulk = await app.inject({
      method: 'POST', url: `/v1/blueprints/${analysisId}/tasks/bulk-review`, headers: H(token()),
      body: JSON.stringify({ review_status: 'rejected' }),
    });
    expect(bulk.statusCode).toBe(409);
    expect(JSON.parse(bulk.body).error.code).toBe('ANALYSIS_IMPORTED');

    const { rows: tk } = await testPool.query(
      `SELECT id FROM blueprint_proposed_tasks WHERE analysis_id = $1 LIMIT 1`, [analysisId]);
    const patch = await app.inject({
      method: 'PATCH', url: `/v1/blueprints/${analysisId}/tasks/${tk[0].id}`, headers: H(token()),
      body: JSON.stringify({ review_status: 'rejected' }),
    });
    expect(patch.statusCode).toBe(409);
    expect(JSON.parse(patch.body).error.code).toBe('ANALYSIS_IMPORTED');

    await cleanupSchedule();
  });
});

// ─── B3.3 — import notification ──────────────────────────────────────────────
describe('B3.3 import notifies owner/PM', () => {
  it('a blueprint_imported notification is created on import', async () => {
    const analysisId = await analyzeToReviewReady();
    await testPool.query(
      `UPDATE blueprint_proposed_tasks SET review_status = 'accepted'
       WHERE id IN (SELECT id FROM blueprint_proposed_tasks WHERE analysis_id = $1 LIMIT 1)`, [analysisId]);
    const imp = await app.inject({
      method: 'POST', url: `/v1/blueprints/${analysisId}/import`, headers: H(token()), body: '{}',
    });
    expect(imp.statusCode).toBe(200);
    const { rows } = await testPool.query(
      `SELECT count(*)::int AS n FROM notifications
       WHERE tenant_id = $1 AND user_id = $2 AND data->>'type' = 'blueprint_imported' AND data->>'analysis_id' = $3`,
      [tenantId, ownerId, analysisId]);
    expect(rows[0].n).toBe(1);
    await cleanupSchedule();
  });
});

// ─── B3.6 — soft-deleted analysis hides its tasks ────────────────────────────
describe('B3.6 GET tasks on a deleted analysis → 404', () => {
  it('returns 404 once the parent analysis is soft-deleted', async () => {
    const analysisId = await analyzeToReviewReady();
    // Listable while live.
    const ok = await app.inject({
      method: 'GET', url: `/v1/blueprints/${analysisId}/tasks`, headers: H(token()),
    });
    expect(ok.statusCode).toBe(200);
    expect(JSON.parse(ok.body).tasks.length).toBeGreaterThan(0);

    await testPool.query(`UPDATE blueprint_analyses SET deleted_at = NOW() WHERE id = $1`, [analysisId]);
    const gone = await app.inject({
      method: 'GET', url: `/v1/blueprints/${analysisId}/tasks`, headers: H(token()),
    });
    expect(gone.statusCode).toBe(404);
    await testPool.query(`DELETE FROM blueprint_proposed_tasks WHERE analysis_id = $1`, [analysisId]);
    await testPool.query(`DELETE FROM blueprint_analyses WHERE id = $1`, [analysisId]);
  });
});
