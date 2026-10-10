// blueprint-routes.test.ts — integration tests for the Blueprint Intelligence route chain:
//   POST   /v1/blueprints/analyze         (create + role gate + job enqueue)
//   GET    /v1/blueprints/:id             (status poll)
//   GET    /v1/blueprints/:id/tasks       (cursor pagination — no silent clip)
//   PATCH  /v1/blueprints/:id/tasks/:tid  (review + role gate)
//   POST   /v1/blueprints/:id/import      (schedule_tasks + deps + steps; idempotent re-import)
//   DELETE /v1/blueprints/:id             (soft delete; imported → 409)
// The worker's template path runs inline (queue is mocked) so the chain is exercised
// end-to-end: analyze → review_ready → review → import.

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
import { blueprintRoutes } from '../routes/v1/blueprints.js';
import { handleBlueprintAnalyze } from '../workers/blueprint-worker.js';
import { loadReferenceCache } from '../lib/jurisdictions/reference-store.js';
import { registerErrorHandler } from '../plugins/error-handler.js';
import type { JWTPayload } from '../middleware/auth.js';

const sendJobMock = sendJob as unknown as ReturnType<typeof vi.fn>;

const tenantId = randomUUID();
const ownerId = randomUUID();
const foremanId = randomUUID();
const projectId = randomUUID();
const slug = `bpr-${tenantId.slice(0, 8)}`;

const app = Fastify({ logger: false });

function token(overrides: Partial<JWTPayload> = {}): string {
  return jwt.sign(
    {
      jti: randomUUID(), user_id: ownerId, tenant_id: tenantId,
      role: 'OWNER' as const, email: 'owner@bpr.test', preferred_language: 'en' as const,
      ...overrides,
    },
    process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
    { expiresIn: 86400 },
  );
}
const foremanToken = () => token({ role: 'FOREMAN', user_id: foremanId, email: 'foreman@bpr.test' });
const H = (t: string) => ({ 'user-agent': 'test-runner/1.0', authorization: `Bearer ${t}`, 'content-type': 'application/json' });

/** POST /analyze then run the worker inline → review_ready analysis id. */
async function analyzeToReviewReady(): Promise<string> {
  const res = await app.inject({
    method: 'POST', url: '/v1/blueprints/analyze', headers: H(token()),
    body: JSON.stringify({ project_id: projectId, building_type: 'residential_sf' }),
  });
  expect(res.statusCode).toBe(201);
  const { analysis } = JSON.parse(res.body);
  await handleBlueprintAnalyze(tenantId, {
    analysis_id: analysis.id, project_id: projectId, building_type: 'residential_sf', user_id: ownerId,
  });
  return analysis.id as string;
}

beforeAll(async () => {
  registerErrorHandler(app);
  await app.register(blueprintRoutes, { prefix: '/v1' });
  await app.ready();
  await loadReferenceCache(testPool); // task-steps build on import resolves the jurisdiction engine

  await testPool.query(
    `INSERT INTO tenants (id, name, slug, tier, status) VALUES ($1,'BP Routes Tenant',$2,'professional','active')`,
    [tenantId, slug],
  );
  const pw = await bcrypt.hash('x', 10);
  await testPool.query(
    `INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, status)
     VALUES ($1,$2,'owner@bpr.test',$3,'Olive','Owner','owner','active'),
            ($4,$2,'foreman@bpr.test',$3,'Frank','Foreman','foreman','active')`,
    [ownerId, tenantId, pw, foremanId],
  );
  await testPool.query(
    `INSERT INTO projects (id, tenant_id, name, status, state) VALUES ($1,$2,'BP Routes Project','active','WI')`,
    [projectId, tenantId],
  );
});

afterAll(async () => {
  await app.close();
  await testPool.query(`DELETE FROM task_steps WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM task_dependencies WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM blueprint_proposed_tasks WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM blueprint_sheets WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM blueprint_analyses WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`UPDATE schedule_tasks SET predecessor_task_id = NULL WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM schedule_tasks WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM notifications WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM audit_log WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM projects WHERE id = $1`, [projectId]);
  await testPool.query(`DELETE FROM users WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM tenants WHERE id = $1`, [tenantId]);
});

describe('POST /v1/blueprints/analyze', () => {
  it('creates a pending analysis and enqueues blueprint.analyze (201)', async () => {
    sendJobMock.mockClear();
    const res = await app.inject({
      method: 'POST', url: '/v1/blueprints/analyze', headers: H(token()),
      body: JSON.stringify({ project_id: projectId, building_type: 'residential_sf' }),
    });
    expect(res.statusCode).toBe(201);
    const { analysis } = JSON.parse(res.body);
    expect(analysis.status).toBe('pending');
    expect(sendJobMock).toHaveBeenCalledWith('blueprint.analyze', tenantId, expect.objectContaining({ analysis_id: analysis.id }));
    // Clean this orphan up-front so later counts stay per-analysis scoped.
    await testPool.query(`DELETE FROM blueprint_analyses WHERE id = $1`, [analysis.id]);
  });

  it('rejects a FOREMAN (403 — write is OWNER/PM)', async () => {
    const res = await app.inject({
      method: 'POST', url: '/v1/blueprints/analyze', headers: H(foremanToken()),
      body: JSON.stringify({ project_id: projectId, building_type: 'residential_sf' }),
    });
    expect(res.statusCode).toBe(403);
  });

  it('rejects an unknown building_type (422)', async () => {
    const res = await app.inject({
      method: 'POST', url: '/v1/blueprints/analyze', headers: H(token()),
      body: JSON.stringify({ project_id: projectId, building_type: 'castle' }),
    });
    expect(res.statusCode).toBe(422);
  });
});

describe('analyze → review → import chain (template path)', () => {
  let analysisId: string;
  let totalTasks = 0;

  it('worker template path lands the analysis in review_ready', async () => {
    analysisId = await analyzeToReviewReady();
    const res = await app.inject({ method: 'GET', url: `/v1/blueprints/${analysisId}`, headers: H(foremanToken()) });
    expect(res.statusCode).toBe(200);
    const { analysis } = JSON.parse(res.body);
    expect(analysis.status).toBe('review_ready');
    expect(analysis.extracted_task_count).toBeGreaterThan(20);
    totalTasks = analysis.extracted_task_count;
  });

  it('GET /:id/tasks cursor pagination returns every task (no clip)', async () => {
    const all: { id: string }[] = [];
    let cursor: string | null = null;
    do {
      const url: string = `/v1/blueprints/${analysisId}/tasks?limit=10${cursor ? `&cursor=${cursor}` : ''}`;
      const res = await app.inject({ method: 'GET', url, headers: H(token()) });
      expect(res.statusCode).toBe(200);
      const data = JSON.parse(res.body) as { tasks: { id: string }[]; pagination: { has_more: boolean; next_cursor: string | null } };
      expect(data.tasks.length).toBeLessThanOrEqual(10);
      all.push(...data.tasks);
      cursor = data.pagination.has_more ? data.pagination.next_cursor : null;
    } while (cursor);
    expect(all.length).toBe(totalTasks);
    expect(new Set(all.map((t) => t.id)).size).toBe(totalTasks); // no dupes across pages
  });

  it('PATCH review accepts a task; FOREMAN gets 403', async () => {
    const list = await app.inject({ method: 'GET', url: `/v1/blueprints/${analysisId}/tasks?limit=3`, headers: H(token()) });
    const { tasks } = JSON.parse(list.body) as { tasks: { id: string }[] };

    const ok = await app.inject({
      method: 'PATCH', url: `/v1/blueprints/${analysisId}/tasks/${tasks[0].id}`, headers: H(token()),
      body: JSON.stringify({ review_status: 'accepted' }),
    });
    expect(ok.statusCode).toBe(200);
    expect(JSON.parse(ok.body).task.review_status).toBe('accepted');

    const denied = await app.inject({
      method: 'PATCH', url: `/v1/blueprints/${analysisId}/tasks/${tasks[1].id}`, headers: H(foremanToken()),
      body: JSON.stringify({ review_status: 'accepted' }),
    });
    expect(denied.statusCode).toBe(403);

    // Accept a second one so the import below has two tasks.
    await app.inject({
      method: 'PATCH', url: `/v1/blueprints/${analysisId}/tasks/${tasks[1].id}`, headers: H(token()),
      body: JSON.stringify({ review_status: 'accepted' }),
    });
  });

  it('POST /:id/import creates schedule_tasks + steps and renames the project', async () => {
    const res = await app.inject({
      method: 'POST', url: `/v1/blueprints/${analysisId}/import`, headers: H(token()),
      body: JSON.stringify({ project_name: 'Lot 9 - 100 Test St, Madison' }),
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.imported_count).toBe(2);
    expect(body.project_name).toBe('Lot 9 - 100 Test St, Madison');

    const { rows: st } = await testPool.query(
      `SELECT id FROM schedule_tasks WHERE tenant_id = $1 AND project_id = $2 AND deleted_at IS NULL`,
      [tenantId, projectId],
    );
    expect(st.length).toBe(2);
    const { rows: proj } = await testPool.query(`SELECT name FROM projects WHERE id = $1`, [projectId]);
    expect(proj[0].name).toBe('Lot 9 - 100 Test St, Madison');
  });

  it('re-import of an already-imported analysis is refused (409) — no duplicate schedule_tasks', async () => {
    // 'imported' is terminal (dropped from the allow list) — the FOR UPDATE + status
    // gate turns a second import into a hard 409 instead of silently re-running.
    const res = await app.inject({
      method: 'POST', url: `/v1/blueprints/${analysisId}/import`, headers: H(token()), body: '{}',
    });
    expect(res.statusCode).toBe(409);
    expect(JSON.parse(res.body).error.code).toBe('ANALYSIS_NOT_READY');

    const { rows: st } = await testPool.query(
      `SELECT id FROM schedule_tasks WHERE tenant_id = $1 AND project_id = $2 AND deleted_at IS NULL`,
      [tenantId, projectId],
    );
    expect(st.length).toBe(2);
  });

  it('DELETE on an imported analysis is refused (409)', async () => {
    const res = await app.inject({ method: 'DELETE', url: `/v1/blueprints/${analysisId}`, headers: H(token()) });
    expect(res.statusCode).toBe(409);
    expect(JSON.parse(res.body).error.code).toBe('ANALYSIS_IMPORTED');
  });
});

describe('GET /v1/blueprints (analysis history)', () => {
  it('lists the project analyses newest-first with status/source/task_count', async () => {
    const res = await app.inject({
      method: 'GET', url: `/v1/blueprints?project_id=${projectId}`, headers: H(foremanToken()),
    });
    expect(res.statusCode).toBe(200);
    const { analyses } = JSON.parse(res.body) as { analyses: { id: string; status: string; source: string | null; created_at: string }[] };
    expect(analyses.length).toBeGreaterThan(0);
    expect(analyses[0]).toHaveProperty('building_type');
    expect(analyses.some((a) => a.status === 'imported')).toBe(true);
    expect(analyses.every((a) => a.source === 'template')).toBe(true);
    const times = analyses.map((a) => new Date(a.created_at).getTime());
    expect([...times].sort((x, y) => y - x)).toEqual(times); // newest first
  });

  it('paginates with a cursor', async () => {
    await analyzeToReviewReady(); // ensure a second analysis exists
    const first = await app.inject({
      method: 'GET', url: `/v1/blueprints?project_id=${projectId}&limit=1`, headers: H(token()),
    });
    const p1 = JSON.parse(first.body) as { analyses: { id: string }[]; pagination: { has_more: boolean; next_cursor: string | null } };
    expect(p1.analyses.length).toBe(1);
    expect(p1.pagination.has_more).toBe(true);
    const second = await app.inject({
      method: 'GET', url: `/v1/blueprints?project_id=${projectId}&limit=1&cursor=${p1.pagination.next_cursor}`, headers: H(token()),
    });
    const p2 = JSON.parse(second.body) as { analyses: { id: string }[] };
    expect(p2.analyses[0].id).not.toBe(p1.analyses[0].id);
  });

  it('requires project_id (422)', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/blueprints', headers: H(token()) });
    expect(res.statusCode).toBe(422);
  });
});

describe('DELETE /v1/blueprints/:id', () => {
  it('soft-deletes a non-imported analysis; subsequent GET is 404', async () => {
    const analysisId = await analyzeToReviewReady();

    const del = await app.inject({ method: 'DELETE', url: `/v1/blueprints/${analysisId}`, headers: H(token()) });
    expect(del.statusCode).toBe(200);

    const gone = await app.inject({ method: 'GET', url: `/v1/blueprints/${analysisId}`, headers: H(token()) });
    expect(gone.statusCode).toBe(404);

    const again = await app.inject({ method: 'DELETE', url: `/v1/blueprints/${analysisId}`, headers: H(token()) });
    expect(again.statusCode).toBe(404);
  });

  it('rejects a FOREMAN (403)', async () => {
    const analysisId = await analyzeToReviewReady();
    const res = await app.inject({ method: 'DELETE', url: `/v1/blueprints/${analysisId}`, headers: H(foremanToken()) });
    expect(res.statusCode).toBe(403);
    await testPool.query(`DELETE FROM blueprint_proposed_tasks WHERE analysis_id = $1`, [analysisId]);
    await testPool.query(`DELETE FROM blueprint_analyses WHERE id = $1`, [analysisId]);
  });
});
