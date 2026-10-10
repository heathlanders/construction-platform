// blueprint-gap-hardening-phase2.test.ts — Phase 2 (B2.1–B2.6) regression tests:
//   • B2.1 analyze validates the file belongs to the project (wrong project → 404)
//   • B2.6 analyze rejects an oversize plan (422 PDF_TOO_LARGE)
//   • B2.4 task-review PATCH writes an audit row; worker status transitions audit
//     (processing + review_ready)
//   • B2.5 facts.ts reads import_metadata.components/panels directly (structured, no title scan);
//     title-scan fallback still works when they're absent
//   • B2.6 markAnalysisFailed records a failure reason into import_metadata.failure

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
import { buildBlueprintFacts } from '../lib/task-buildout/facts.js';
import { loadReferenceCache } from '../lib/jurisdictions/reference-store.js';
import { registerErrorHandler } from '../plugins/error-handler.js';
import type { JWTPayload } from '../middleware/auth.js';

const tenantId = randomUUID();
const ownerId = randomUUID();
const projectId = randomUUID();
const otherProjectId = randomUUID();
const slug = `bgh2-${tenantId.slice(0, 8)}`;

const app = Fastify({ logger: false });

function token(overrides: Partial<JWTPayload> = {}): string {
  return jwt.sign(
    { jti: randomUUID(), user_id: ownerId, tenant_id: tenantId, role: 'OWNER' as const,
      email: 'owner@bgh2.test', preferred_language: 'en' as const, ...overrides },
    process.env.JWT_SECRET ?? 'dev-secret-change-in-production', { expiresIn: 86400 },
  );
}
const H = (t: string) => ({ 'user-agent': 'test-runner/1.0', authorization: `Bearer ${t}`, 'content-type': 'application/json' });

async function insertFile(pid: string, status: string, bytes: number, filename = 'plan.pdf'): Promise<string> {
  const id = randomUUID();
  await testPool.query(
    `INSERT INTO files (id, tenant_id, project_id, filename, content_type, file_size_bytes,
       category, quarantine_path, storage_path, status, created_by)
     VALUES ($1,$2,$3,$4,'application/pdf',$5,'document',$6,$7,$8,$9)`,
    [id, tenantId, pid, filename, bytes, `${tenantId}/q/${id}`, `${tenantId}/live/${id}.pdf`, status, ownerId],
  );
  return id;
}

beforeAll(async () => {
  registerErrorHandler(app);
  await app.register(blueprintRoutes, { prefix: '/v1' });
  await app.ready();
  await loadReferenceCache(testPool);

  await testPool.query(
    `INSERT INTO tenants (id, name, slug, tier, status) VALUES ($1,'BGH2 Tenant',$2,'professional','active')`,
    [tenantId, slug],
  );
  const pw = await bcrypt.hash('x', 10);
  await testPool.query(
    `INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, status)
     VALUES ($1,$2,'owner@bgh2.test',$3,'Olive','Owner','owner','active')`,
    [ownerId, tenantId, pw],
  );
  await testPool.query(
    `INSERT INTO projects (id, tenant_id, name, status, state) VALUES ($1,$2,'BGH2 Project','active','WI')`,
    [projectId, tenantId],
  );
  await testPool.query(
    `INSERT INTO projects (id, tenant_id, name, status, state) VALUES ($1,$2,'BGH2 Other','active','WI')`,
    [otherProjectId, tenantId],
  );
});

afterAll(async () => {
  await app.close();
  await testPool.query(`UPDATE blueprint_proposed_tasks SET schedule_task_id = NULL WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`UPDATE schedule_tasks SET predecessor_task_id = NULL WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM task_steps WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM task_dependencies WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM schedule_tasks WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM blueprint_proposed_tasks WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM blueprint_sheets WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM blueprint_analyses WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM files WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM notifications WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM audit_log WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM projects WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM users WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM tenants WHERE id = $1`, [tenantId]);
});

// ─── B2.1 — analyze validates document belongs to project ───────────────────
describe('B2.1 analyze validates the file belongs to the target project', () => {
  it('rejects a ready file on a DIFFERENT project (404 DOCUMENT_NOT_FOUND)', async () => {
    const fileId = await insertFile(otherProjectId, 'ready', 1000);
    const res = await app.inject({
      method: 'POST', url: '/v1/blueprints/analyze', headers: H(token()),
      body: JSON.stringify({ project_id: projectId, building_type: 'residential_sf', document_id: fileId }),
    });
    expect(res.statusCode).toBe(404);
    expect(JSON.parse(res.body).error.code).toBe('DOCUMENT_NOT_FOUND');
  });

  it('accepts the same file on its OWN project (201)', async () => {
    const fileId = await insertFile(projectId, 'ready', 1000);
    const res = await app.inject({
      method: 'POST', url: '/v1/blueprints/analyze', headers: H(token()),
      body: JSON.stringify({ project_id: projectId, building_type: 'residential_sf', document_id: fileId }),
    });
    expect(res.statusCode).toBe(201);
    await testPool.query(`DELETE FROM blueprint_analyses WHERE document_id = $1`, [fileId]);
  });
});

// ─── B2.6 — oversize plan rejected at analyze ────────────────────────────────
describe('B2.6 analyze rejects an oversize plan', () => {
  it('422 PDF_TOO_LARGE for a file over the byte cap', async () => {
    const fileId = await insertFile(projectId, 'ready', 300 * 1024 * 1024); // > 250MB default cap
    const res = await app.inject({
      method: 'POST', url: '/v1/blueprints/analyze', headers: H(token()),
      body: JSON.stringify({ project_id: projectId, building_type: 'residential_sf', document_id: fileId }),
    });
    expect(res.statusCode).toBe(422);
    expect(JSON.parse(res.body).error.code).toBe('PDF_TOO_LARGE');
  });
});

// ─── B2.4 — audit on task review + worker status transitions ─────────────────
describe('B2.4 audit entries', () => {
  it('template analyze audits processing + review_ready; task PATCH audits reviewed', async () => {
    // Fresh analysis (template path — no document).
    const res = await app.inject({
      method: 'POST', url: '/v1/blueprints/analyze', headers: H(token()),
      body: JSON.stringify({ project_id: projectId, building_type: 'residential_sf' }),
    });
    const { analysis } = JSON.parse(res.body);
    await handleBlueprintAnalyze(tenantId, {
      analysis_id: analysis.id, project_id: projectId, building_type: 'residential_sf', user_id: ownerId,
    });

    const { rows: acts } = await testPool.query(
      `SELECT action FROM audit_log WHERE tenant_id = $1 AND resource_id = $2`,
      [tenantId, analysis.id],
    );
    const actions = acts.map((r) => r.action);
    expect(actions).toContain('blueprint_analysis.created');
    expect(actions).toContain('blueprint_analysis.processing');
    expect(actions).toContain('blueprint_analysis.review_ready');

    // Review a task → audit row.
    const { rows: tk } = await testPool.query(
      `SELECT id FROM blueprint_proposed_tasks WHERE analysis_id = $1 LIMIT 1`, [analysis.id]);
    const patch = await app.inject({
      method: 'PATCH', url: `/v1/blueprints/${analysis.id}/tasks/${tk[0].id}`, headers: H(token()),
      body: JSON.stringify({ review_status: 'accepted' }),
    });
    expect(patch.statusCode).toBe(200);
    const { rows: rev } = await testPool.query(
      `SELECT count(*)::int AS n FROM audit_log
       WHERE tenant_id = $1 AND action = 'blueprint_task.reviewed' AND resource_id = $2`,
      [tenantId, tk[0].id],
    );
    expect(rev[0].n).toBe(1);
  });
});

// ─── B2.5 — facts reads structured import_metadata, with title-scan fallback ──
describe('B2.5 facts.ts prefers persisted components/panels', () => {
  async function seedAnalysis(meta: Record<string, unknown>): Promise<string> {
    const id = randomUUID();
    await testPool.query(
      `INSERT INTO blueprint_analyses (id, tenant_id, project_id, building_type, status, import_metadata, created_by)
       VALUES ($1,$2,$3,'residential_sf','review_ready',$4,$5)`,
      [id, tenantId, projectId, JSON.stringify(meta), ownerId],
    );
    return id;
  }

  it('reads components + panel amperage straight from import_metadata (no title scan)', async () => {
    const id = await seedAnalysis({
      components: ['engineered_trusses', 'metal_roofing'],
      panels: [{ amperage: 200 }],
    });
    // No proposed tasks inserted — proves it did NOT reconstruct from titles.
    const facts = await buildBlueprintFacts(id, testPool as never);
    expect(facts.components).toEqual(['engineered_trusses', 'metal_roofing']);
    expect(facts.panels).toEqual([{ amperage: 200, location: null }]);
  });

  it('falls back to proposed-task title scan when metadata has no components/panels', async () => {
    const id = await seedAnalysis({ flags: {} });
    await testPool.query(
      `INSERT INTO blueprint_proposed_tasks (tenant_id, analysis_id, title, description, trade_type, phase, review_status)
       VALUES ($1,$2,'Roof truss set & brace','200A service panel install','framing','roofing','pending')`,
      [tenantId, id],
    );
    const facts = await buildBlueprintFacts(id, testPool as never);
    expect(facts.components).toContain('engineered_trusses');
    expect(facts.panels[0]?.amperage).toBe(200);
  });
});

// ─── B2.6 — failure reason recorded ──────────────────────────────────────────
describe('B2.6 markAnalysisFailed records a reason', () => {
  it('unknown building_type → status failed + import_metadata.failure.reason', async () => {
    const res = await app.inject({
      method: 'POST', url: '/v1/blueprints/analyze', headers: H(token()),
      body: JSON.stringify({ project_id: projectId, building_type: 'residential_sf' }),
    });
    const { analysis } = JSON.parse(res.body);
    // Worker invoked with a bogus building_type → fails before claim.
    await handleBlueprintAnalyze(tenantId, {
      analysis_id: analysis.id, project_id: projectId, building_type: 'bogus_type', user_id: ownerId,
    });
    const { rows } = await testPool.query(
      `SELECT status, import_metadata->'failure'->>'reason' AS reason
       FROM blueprint_analyses WHERE id = $1`, [analysis.id]);
    expect(rows[0].status).toBe('failed');
    expect(rows[0].reason).toBe('unknown_building_type');
    const { rows: a } = await testPool.query(
      `SELECT count(*)::int AS n FROM audit_log
       WHERE tenant_id = $1 AND action = 'blueprint_analysis.failed' AND resource_id = $2`,
      [tenantId, analysis.id]);
    expect(a[0].n).toBe(1);
  });
});
