// schedule-task-detail.test.ts — integration tests for the task detail aggregator + QA photos.
//   GET  /v1/schedule-tasks/:id/detail   (task + resolved codes + live inspections + deps + photos)
//   POST /v1/schedule-tasks/:id/photos   (attach a scan-passed file; role-gated)
// Codes resolve through the jurisdiction engine for the project's state (no seed layer needed —
// the national-default trade libs apply). Locked decisions: T-12, T-59, T-27.

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
// generateDownloadUrl signs against S3/MinIO — stub it so the test needs no live bucket.
vi.mock('../lib/storage.js', () => ({
  generateDownloadUrl: vi.fn().mockResolvedValue('https://example.test/signed'),
}));

import { testPool } from './setup.js';
import { scheduleTaskRoutes } from '../routes/v1/schedule-tasks.js';
import { loadReferenceCache } from '../lib/jurisdictions/reference-store.js';
import { registerErrorHandler } from '../plugins/error-handler.js';
import type { JWTPayload } from '../middleware/auth.js';

const tenantId = randomUUID();
const ownerId = randomUUID();
const ftId = randomUUID();
const estimatorId = randomUUID();
const projectId = randomUUID();
const elecTaskId = randomUUID();
const plainTaskId = randomUUID();
const framingTaskId = randomUUID();
const permitId = randomUUID();
const fileId = randomUUID();
const slug = `std-${tenantId.slice(0, 8)}`;

const app = Fastify({ logger: false });

function token(role: string, userId: string): string {
  return jwt.sign(
    { jti: randomUUID(), user_id: userId, tenant_id: tenantId, role, email: `${role}@std.test`, preferred_language: 'en' },
    process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
    { expiresIn: 86400 }
  );
}
const H = (t: string) => ({ 'user-agent': 'test-runner/1.0', authorization: `Bearer ${t}`, 'content-type': 'application/json' });

beforeAll(async () => {
  registerErrorHandler(app);
  await app.register(scheduleTaskRoutes, { prefix: '/v1' });
  await app.ready();
  // The jurisdiction engine reads an in-memory cache loaded at app boot in production.
  await loadReferenceCache(testPool);

  await testPool.query(`INSERT INTO tenants (id, name, slug, tier, status) VALUES ($1,'STD Tenant',$2,'professional','active')`, [tenantId, slug]);
  const pw = await bcrypt.hash('x', 10);
  await testPool.query(
    `INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, status)
     VALUES ($1,$2,$3,$7,'O','Owner','owner','active'),
            ($4,$2,$5,$7,'F','Tech','field_tech','active'),
            ($6,$2,$8,$7,'E','Est','estimator','active')`,
    [ownerId, tenantId, 'owner@std.test', ftId, 'ft@std.test', estimatorId, pw, 'est@std.test']
  );
  // Project in WI (jurisdiction engine resolves NEC for electrical from the national default).
  await testPool.query(
    `INSERT INTO projects (id, tenant_id, name, status, state) VALUES ($1,$2,'STD Project','active','WI')`,
    [projectId, tenantId]
  );
  // Electrical task (native trade/phase) + a no-trade task.
  await testPool.query(
    `INSERT INTO schedule_tasks (id, tenant_id, project_id, title, status, trade_type, phase, csi_division, version, created_by)
     VALUES ($1,$2,$3,'Lighting & receptacle rough-in','not_started','electrical','rough_in','26 24 16',1,$4),
            ($5,$2,$3,'Misc task','not_started',NULL,NULL,NULL,1,$4),
            ($6,$2,$3,'Frame walls & roof','not_started','framing','framing','06 10 00',1,$4)`,
    [elecTaskId, tenantId, projectId, ownerId, plainTaskId, framingTaskId]
  );
  // Active electrical permit so compliance[] reflects live inspection status.
  await testPool.query(
    `INSERT INTO permits (id, tenant_id, project_id, permit_type, building_type, state_code, status, version, created_by)
     VALUES ($1,$2,$3,'electrical','residential_sf','WI','active',1,$4)`,
    [permitId, tenantId, projectId, ownerId]
  );
  await testPool.query(
    `INSERT INTO inspections (tenant_id, project_id, permit_id, trade_type, inspection_type, sequence_order, title, status, result, version, created_by)
     VALUES ($1,$2,$3,'electrical','rough_in',2,'Rough-In','passed','pass',1,$4)`,
    [tenantId, projectId, permitId, ownerId]
  );
  // A scan-passed file to attach as a QA photo.
  await testPool.query(
    `INSERT INTO files (id, tenant_id, project_id, filename, content_type, file_size_bytes, category, quarantine_path, storage_path, status, created_by)
     VALUES ($1,$2,$3,'proof.jpg','image/jpeg',1234,'image','q/proof.jpg',$4,'ready',$5)`,
    [fileId, tenantId, projectId, `${tenantId}/live/projects/${projectId}/task-photos/proof.jpg`, ownerId]
  );
});

afterAll(async () => {
  await app.close();
  await testPool.query(`DELETE FROM task_steps WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM schedule_task_photos WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM inspections WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM permits WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM files WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM schedule_tasks WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM audit_log WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM projects WHERE id = $1`, [projectId]);
  await testPool.query(`DELETE FROM users WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM tenants WHERE id = $1`, [tenantId]);
});

describe('GET /v1/schedule-tasks/:id/detail', () => {
  it('resolves codes + live inspection status for an electrical task', async () => {
    const res = await app.inject({ method: 'GET', url: `/v1/schedule-tasks/${elecTaskId}/detail`, headers: H(token('OWNER', ownerId)) });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.task.title).toBe('Lighting & receptacle rough-in');
    expect(body.codes).not.toBeNull();
    expect(body.codes.code_type).toBe('NEC');
    expect(body.codes.permit_trade).toBe('electrical');
    expect(body.codes.has_permit).toBe(true);
    expect(Array.isArray(body.codes.compliance)).toBe(true);
    // The rough-in step should reflect the seeded passed inspection.
    const roughIn = body.codes.compliance.find((c: { inspection_type: string }) => c.inspection_type === 'rough_in');
    expect(roughIn).toBeTruthy();
    expect(roughIn.status).toBe('passed');
  });

  it('returns codes=null for a task with no trade', async () => {
    const res = await app.inject({ method: 'GET', url: `/v1/schedule-tasks/${plainTaskId}/detail`, headers: H(token('OWNER', ownerId)) });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).codes).toBeNull();
  });

  it('404 for an unknown task', async () => {
    const res = await app.inject({ method: 'GET', url: `/v1/schedule-tasks/${randomUUID()}/detail`, headers: H(token('OWNER', ownerId)) });
    expect(res.statusCode).toBe(404);
  });
});

describe('POST /v1/schedule-tasks/:id/photos', () => {
  it('field tech can attach a scan-passed file', async () => {
    const res = await app.inject({
      method: 'POST', url: `/v1/schedule-tasks/${elecTaskId}/photos`,
      headers: H(token('FIELD_TECH', ftId)),
      body: JSON.stringify({ file_id: fileId, photo_type: 'proof' }),
    });
    expect(res.statusCode).toBe(201);
    const { photo } = JSON.parse(res.body);
    expect(photo.task_id).toBe(elecTaskId);
    expect(photo.download_url).toBe('https://example.test/signed');
  });

  it('rejects a non-field role (estimator) with 403', async () => {
    const res = await app.inject({
      method: 'POST', url: `/v1/schedule-tasks/${elecTaskId}/photos`,
      headers: H(token('ESTIMATOR', estimatorId)),
      body: JSON.stringify({ file_id: fileId }),
    });
    expect(res.statusCode).toBe(403);
  });

  it('detail now lists the attached photo', async () => {
    const res = await app.inject({ method: 'GET', url: `/v1/schedule-tasks/${elecTaskId}/detail`, headers: H(token('OWNER', ownerId)) });
    expect(JSON.parse(res.body).photos.length).toBeGreaterThanOrEqual(1);
  });
});

describe('Task Build-Out Engine', () => {
  it('builds work steps for the electrical task', async () => {
    const res = await app.inject({
      method: 'POST', url: `/v1/schedule-tasks/${elecTaskId}/build-steps`, headers: H(token('OWNER', ownerId)), body: '{}',
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.step_count).toBeGreaterThan(0);
    expect(body.steps[0].instruction).toBeTruthy();
    expect(body.steps.some((s: { gating_inspection_type: string }) => s.gating_inspection_type === 'rough_in')).toBe(true);
  });

  it('field tech cannot rebuild steps (403)', async () => {
    const res = await app.inject({
      method: 'POST', url: `/v1/schedule-tasks/${elecTaskId}/build-steps`, headers: H(token('FIELD_TECH', ftId)), body: '{}',
    });
    expect(res.statusCode).toBe(403);
  });

  it('detail returns steps + codes scoped to the task (rough_in only, not the full sequence)', async () => {
    const res = await app.inject({ method: 'GET', url: `/v1/schedule-tasks/${elecTaskId}/detail`, headers: H(token('OWNER', ownerId)) });
    const body = JSON.parse(res.body);
    expect(body.steps.length).toBeGreaterThan(0);
    expect(body.codes.task_scoped).toBe(true);
    // Electrical rough-in task → compliance scoped to rough_in (the seeded passed inspection), not temp/service/cover/final.
    const types = body.codes.compliance.map((c: { inspection_type: string }) => c.inspection_type);
    expect(types).toContain('rough_in');
    expect(types).not.toContain('final');
    expect(Array.isArray(body.codes.task_code_refs)).toBe(true);
    expect(body.codes.task_code_refs.length).toBeGreaterThan(0);
  });
});

describe('Equipment recommendation on task detail', () => {
  it('a small electrical rough-in has an empty task_equipment array', async () => {
    const res = await app.inject({ method: 'GET', url: `/v1/schedule-tasks/${elecTaskId}/detail`, headers: H(token('OWNER', ownerId)) });
    const body = JSON.parse(res.body);
    expect(Array.isArray(body.task_equipment)).toBe(true);
    expect(body.task_equipment).toEqual([]);
  });

  it('a framing task recommends equipment (union across steps), canonical + with a reason', async () => {
    // Build steps first so the framing task has task_steps carrying equipment.
    await app.inject({ method: 'POST', url: `/v1/schedule-tasks/${framingTaskId}/build-steps`, headers: H(token('OWNER', ownerId)), body: '{}' });
    const res = await app.inject({ method: 'GET', url: `/v1/schedule-tasks/${framingTaskId}/detail`, headers: H(token('OWNER', ownerId)) });
    const body = JSON.parse(res.body);
    expect(body.task_equipment.length).toBeGreaterThan(0);
    for (const e of body.task_equipment) {
      expect(typeof e.type).toBe('string');
      expect(e.reason.length).toBeGreaterThan(0);
    }
    // No blueprint facts (no analysis) → no trusses → a forklift to hoist framing packages.
    expect(body.task_equipment.map((e: { type: string }) => e.type)).toContain('forklift');
  });

  it('Professional-tier tenant gets recommendation only — no EAM owned/available enrichment', async () => {
    const res = await app.inject({ method: 'GET', url: `/v1/schedule-tasks/${framingTaskId}/detail`, headers: H(token('OWNER', ownerId)) });
    const body = JSON.parse(res.body);
    expect(body.task_equipment.length).toBeGreaterThan(0);
    // Business+ gate not met → enrichment fields absent (recommend-only).
    expect(body.task_equipment.every((e: { owned_count?: number }) => e.owned_count === undefined)).toBe(true);
  });
});
