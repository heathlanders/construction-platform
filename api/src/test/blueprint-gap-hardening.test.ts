// blueprint-gap-hardening.test.ts — Phase 1 (B1.1–B1.5) regression tests:
//   • files-table on-ramp (analyze accepts a `files` row; not-ready → 409, missing → 404)
//   • duration survives import → planned_end = planned_start + estimated_duration_days
//   • double-import race → exactly one succeeds, no duplicate schedule_tasks (FOR UPDATE)
//   • duplicate worker delivery is a no-op (pending→processing claim guard)
//   • augment↔baseline supersede dedup → no double-emit of truss/footing/siding/etc.

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
import { buildTasksFromExtraction, type AggregatedExtraction } from '../lib/blueprint-pdf/build-tasks.js';
import type { JWTPayload } from '../middleware/auth.js';

const tenantId = randomUUID();
const ownerId = randomUUID();
const projectId = randomUUID();
const slug = `bgh-${tenantId.slice(0, 8)}`;

const app = Fastify({ logger: false });

function token(overrides: Partial<JWTPayload> = {}): string {
  return jwt.sign(
    { jti: randomUUID(), user_id: ownerId, tenant_id: tenantId, role: 'OWNER' as const,
      email: 'owner@bgh.test', preferred_language: 'en' as const, ...overrides },
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
  await testPool.query(`DELETE FROM task_steps WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM task_dependencies WHERE tenant_id = $1`, [tenantId]);
  // Proposed tasks link to schedule_tasks (schedule_task_id FK) — unlink before delete.
  await testPool.query(`UPDATE blueprint_proposed_tasks SET schedule_task_id = NULL WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`UPDATE schedule_tasks SET predecessor_task_id = NULL WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM schedule_tasks WHERE tenant_id = $1`, [tenantId]);
}

beforeAll(async () => {
  registerErrorHandler(app);
  await app.register(blueprintRoutes, { prefix: '/v1' });
  await app.ready();
  await loadReferenceCache(testPool);

  await testPool.query(
    `INSERT INTO tenants (id, name, slug, tier, status) VALUES ($1,'BGH Tenant',$2,'professional','active')`,
    [tenantId, slug],
  );
  const pw = await bcrypt.hash('x', 10);
  await testPool.query(
    `INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, status)
     VALUES ($1,$2,'owner@bgh.test',$3,'Olive','Owner','owner','active')`,
    [ownerId, tenantId, pw],
  );
  await testPool.query(
    `INSERT INTO projects (id, tenant_id, name, status, state) VALUES ($1,$2,'BGH Project','active','WI')`,
    [projectId, tenantId],
  );
});

afterAll(async () => {
  await app.close();
  await cleanupSchedule();
  await testPool.query(`DELETE FROM blueprint_proposed_tasks WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM blueprint_sheets WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM blueprint_analyses WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM files WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM notifications WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM audit_log WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM projects WHERE id = $1`, [projectId]);
  await testPool.query(`DELETE FROM users WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM tenants WHERE id = $1`, [tenantId]);
});

// ─── B1.1 — files-table on-ramp ──────────────────────────────────────────────
describe('B1.1 analyze accepts a files row (not documents)', () => {
  async function insertFile(status: string, filename = 'plan.pdf'): Promise<string> {
    const id = randomUUID();
    await testPool.query(
      `INSERT INTO files (id, tenant_id, project_id, filename, content_type, file_size_bytes,
         category, quarantine_path, storage_path, status, created_by)
       VALUES ($1,$2,$3,$4,'application/pdf',1000,'document',$5,$6,$7,$8)`,
      [id, tenantId, projectId, filename, `${tenantId}/q/${id}`, `${tenantId}/live/${id}.pdf`, status, ownerId],
    );
    return id;
  }

  it('accepts a ready PDF file (201, document_id = file id)', async () => {
    const fileId = await insertFile('ready');
    const res = await app.inject({
      method: 'POST', url: '/v1/blueprints/analyze', headers: H(token()),
      body: JSON.stringify({ project_id: projectId, building_type: 'residential_sf', document_id: fileId }),
    });
    expect(res.statusCode).toBe(201);
    expect(JSON.parse(res.body).analysis.document_id).toBe(fileId);
    await testPool.query(`DELETE FROM blueprint_analyses WHERE document_id = $1`, [fileId]);
  });

  it('rejects a still-scanning file (409 DOCUMENT_NOT_READY)', async () => {
    const fileId = await insertFile('scanning');
    const res = await app.inject({
      method: 'POST', url: '/v1/blueprints/analyze', headers: H(token()),
      body: JSON.stringify({ project_id: projectId, building_type: 'residential_sf', document_id: fileId }),
    });
    expect(res.statusCode).toBe(409);
    expect(JSON.parse(res.body).error.code).toBe('DOCUMENT_NOT_READY');
  });

  it('rejects a missing file (404 DOCUMENT_NOT_FOUND)', async () => {
    const res = await app.inject({
      method: 'POST', url: '/v1/blueprints/analyze', headers: H(token()),
      body: JSON.stringify({ project_id: projectId, building_type: 'residential_sf', document_id: randomUUID() }),
    });
    expect(res.statusCode).toBe(404);
    expect(JSON.parse(res.body).error.code).toBe('DOCUMENT_NOT_FOUND');
  });

  it('rejects a ready non-PDF file (422 DOCUMENT_NOT_PDF)', async () => {
    const fileId = await insertFile('ready', 'notes.txt');
    const res = await app.inject({
      method: 'POST', url: '/v1/blueprints/analyze', headers: H(token()),
      body: JSON.stringify({ project_id: projectId, building_type: 'residential_sf', document_id: fileId }),
    });
    expect(res.statusCode).toBe(422);
    expect(JSON.parse(res.body).error.code).toBe('DOCUMENT_NOT_PDF');
  });
});

// ─── B1.2 — duration survives import ─────────────────────────────────────────
describe('B1.2 import carries estimated_duration_days into planned_end', () => {
  it('planned_end = planned_start + duration days', async () => {
    const analysisId = await analyzeToReviewReady();
    // Accept one task with a known non-zero duration.
    const { rows } = await testPool.query(
      `UPDATE blueprint_proposed_tasks SET review_status = 'accepted'
       WHERE id = (SELECT id FROM blueprint_proposed_tasks
                   WHERE analysis_id = $1 AND estimated_duration_days >= 2 LIMIT 1)
       RETURNING estimated_duration_days`,
      [analysisId],
    );
    const dur = rows[0].estimated_duration_days as number;

    const res = await app.inject({
      method: 'POST', url: `/v1/blueprints/${analysisId}/import`, headers: H(token()),
      body: JSON.stringify({ planned_start: '2026-01-05' }),
    });
    expect(res.statusCode).toBe(200);

    const { rows: st } = await testPool.query(
      `SELECT planned_start, planned_end FROM schedule_tasks WHERE tenant_id = $1 AND project_id = $2 AND deleted_at IS NULL`,
      [tenantId, projectId],
    );
    expect(st.length).toBe(1);
    const start = new Date(st[0].planned_start);
    const end = new Date(st[0].planned_end);
    const days = Math.round((end.getTime() - start.getTime()) / 86400000);
    expect(days).toBe(dur);
    await cleanupSchedule();
  });
});

// ─── B1.3 — concurrency ──────────────────────────────────────────────────────
describe('B1.3 concurrency guards', () => {
  it('double-import race: one 200, one 409, no duplicate schedule_tasks', async () => {
    const analysisId = await analyzeToReviewReady();
    await testPool.query(
      `UPDATE blueprint_proposed_tasks SET review_status = 'accepted'
       WHERE id IN (SELECT id FROM blueprint_proposed_tasks WHERE analysis_id = $1 LIMIT 2)`,
      [analysisId],
    );
    const fire = () => app.inject({
      method: 'POST', url: `/v1/blueprints/${analysisId}/import`, headers: H(token()), body: '{}',
    });
    const [a, b] = await Promise.all([fire(), fire()]);
    const codes = [a.statusCode, b.statusCode].sort();
    expect(codes).toEqual([200, 409]);

    const { rows: st } = await testPool.query(
      `SELECT id FROM schedule_tasks WHERE tenant_id = $1 AND project_id = $2 AND deleted_at IS NULL`,
      [tenantId, projectId],
    );
    expect(st.length).toBe(2);  // not 4
    await cleanupSchedule();
  });

  it('duplicate worker delivery is a no-op (claim guard)', async () => {
    const res = await app.inject({
      method: 'POST', url: '/v1/blueprints/analyze', headers: H(token()),
      body: JSON.stringify({ project_id: projectId, building_type: 'residential_sf' }),
    });
    const { analysis } = JSON.parse(res.body);
    const payload = { analysis_id: analysis.id, project_id: projectId, building_type: 'residential_sf', user_id: ownerId };

    await handleBlueprintAnalyze(tenantId, payload);
    const { rows: after1 } = await testPool.query(
      `SELECT count(*)::int AS n FROM blueprint_proposed_tasks WHERE analysis_id = $1`, [analysis.id]);

    // Second delivery: status is review_ready (not pending) → claim fails → skip.
    await handleBlueprintAnalyze(tenantId, payload);
    const { rows: after2 } = await testPool.query(
      `SELECT count(*)::int AS n FROM blueprint_proposed_tasks WHERE analysis_id = $1`, [analysis.id]);

    expect(after2[0].n).toBe(after1[0].n);  // no second insert
  });
});

// ─── B1.4 — augment/baseline supersede dedup ─────────────────────────────────
describe('B1.4 augment supersedes generic baseline (no double-emit)', () => {
  function agg(components: string[]): AggregatedExtraction {
    return {
      flags: {
        has_solar_ready: false, has_hers_verification: false, has_title24: false,
        has_calgreen: false, has_wildfire_zone: false, has_seismic_design: false,
        seismic_category: null, has_ess: false, has_propane_gas: false, has_natural_gas: false,
        has_exit_signage: false, has_accessibility: false,
      },
      panels: [], windows: [], doors: [], rooms: [], fixture_types: new Set(),
      components: new Set(components), callouts: [],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      title_block: {} as any,
    };
  }

  it('residential_sf: component augments drop the generic baseline duplicates', () => {
    const merged = buildTasksFromExtraction('residential_sf',
      agg(['engineered_trusses', 'concrete_footing', 'anchor_bolts', 'batt_insulation', 'vinyl_siding']));
    const titles = merged.map((t) => t.title);

    // Generic baseline rows are gone…
    expect(titles).not.toContain('Roof truss installation');
    expect(titles).not.toContain('Form & pour footings');
    expect(titles).not.toContain('Rebar & anchor bolt placement');
    expect(titles).not.toContain('Wall & ceiling batt insulation');
    expect(titles).not.toContain('Siding & exterior cladding');
    // …replaced by the specific augments.
    expect(titles.some((x) => /Roof truss set & brace/.test(x))).toBe(true);
    expect(titles.some((x) => /Footing layout/.test(x))).toBe(true);

    // No duplicate titles overall.
    expect(new Set(titles.map((x) => x.toLowerCase())).size).toBe(titles.length);
  });

  it('pole_barn: metal panel + column augments drop pole-barn baseline duplicates', () => {
    const merged = buildTasksFromExtraction('pole_barn',
      agg(['metal_roofing', 'metal_siding', 'post_frame_columns', 'engineered_trusses']));
    const titles = merged.map((t) => t.title);
    expect(titles).not.toContain('Install metal roof panels');
    expect(titles).not.toContain('Install metal wall panels');
    expect(titles).not.toContain('Set post-frame columns / poles & plumb');
    expect(new Set(titles.map((x) => x.toLowerCase())).size).toBe(titles.length);
  });

  it('no components → baseline unchanged (augments purely additive)', () => {
    const merged = buildTasksFromExtraction('residential_sf', agg([]));
    const titles = merged.map((t) => t.title);
    expect(titles).toContain('Roof truss installation');
    expect(titles).toContain('Form & pour footings');
  });
});
