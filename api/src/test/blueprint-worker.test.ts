// blueprint-worker.test.ts — worker hardening tests:
//   1. An unexpected throw mid-pipeline marks the analysis 'failed' (not stuck 'processing')
//      and rethrows so pg-boss keeps its retry/DLQ semantics. (Gap G1)
//   2. T-55 soft gate — Starter tenants do NOT get permit inspection milestones injected;
//      import_metadata carries a tier_note instead. Professional+ gets the milestones. (Gap G2)

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { randomUUID } from 'node:crypto';

vi.mock('../lib/queue.js', () => ({
  sendJob: vi.fn().mockResolvedValue(undefined),
  getQueue: vi.fn(),
  stopQueue: vi.fn().mockResolvedValue(undefined),
}));
// Wrap the template lib so a single test can force a mid-pipeline throw.
vi.mock('../lib/blueprint-templates/index.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/blueprint-templates/index.js')>();
  return { ...actual, getTemplate: vi.fn(actual.getTemplate) };
});

import { testPool } from './setup.js';
import { handleBlueprintAnalyze } from '../workers/blueprint-worker.js';
import { getTemplate } from '../lib/blueprint-templates/index.js';
import { loadReferenceCache } from '../lib/jurisdictions/reference-store.js';

const getTemplateMock = getTemplate as unknown as ReturnType<typeof vi.fn>;

// Two tenants — the subscription tier is resolved (and Redis-cached) per tenant.
const starterTenant = randomUUID();
const proTenant = randomUUID();
const starterProject = randomUUID();
const proProject = randomUUID();
const starterOwner = randomUUID();
const proOwner = randomUUID();

async function seedTenant(tenantId: string, projectId: string, ownerId: string, tier: string, tag: string) {
  await testPool.query(
    `INSERT INTO tenants (id, name, slug, tier, status) VALUES ($1,$2,$3,$4,'active')`,
    [tenantId, `BPW ${tag}`, `bpw-${tag}-${tenantId.slice(0, 8)}`, tier],
  );
  await testPool.query(
    `INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, status)
     VALUES ($1,$2,$3,'x','Olive','Owner','owner','active')`,
    [ownerId, tenantId, `owner-${tenantId.slice(0, 8)}@bpw.test`],
  );
  await testPool.query(
    `INSERT INTO projects (id, tenant_id, name, status, state) VALUES ($1,$2,$3,'active','WI')`,
    [projectId, tenantId, `BPW ${tag} Project`],
  );
  // Active electrical permit — the injection trigger.
  await testPool.query(
    `INSERT INTO permits (tenant_id, project_id, permit_type, building_type, state_code, status)
     VALUES ($1,$2,'electrical','residential_sf','WI','active')`,
    [tenantId, projectId],
  );
}

async function createAnalysis(tenantId: string, projectId: string, ownerId: string): Promise<string> {
  const id = randomUUID();
  await testPool.query(
    `INSERT INTO blueprint_analyses (id, tenant_id, project_id, building_type, status, created_by)
     VALUES ($1,$2,$3,'residential_sf','pending',$4)`,
    [id, tenantId, projectId, ownerId],
  );
  return id;
}

async function cleanupTenant(tenantId: string, projectId: string) {
  await testPool.query(`DELETE FROM blueprint_proposed_tasks WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM blueprint_analyses WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM notifications WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM permits WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM audit_log WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM projects WHERE id = $1`, [projectId]);
  await testPool.query(`DELETE FROM users WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM tenants WHERE id = $1`, [tenantId]);
}

beforeAll(async () => {
  await loadReferenceCache(testPool); // milestone injection resolves the jurisdiction engine
  await seedTenant(starterTenant, starterProject, starterOwner, 'starter', 'starter');
  await seedTenant(proTenant, proProject, proOwner, 'professional', 'pro');
});

afterAll(async () => {
  await cleanupTenant(starterTenant, starterProject);
  await cleanupTenant(proTenant, proProject);
});

describe('handleBlueprintAnalyze — failure hardening (G1)', () => {
  it('marks the analysis failed and rethrows when the pipeline throws unexpectedly', async () => {
    const analysisId = await createAnalysis(proTenant, proProject, proOwner);
    getTemplateMock.mockImplementationOnce(() => { throw new Error('boom: simulated pipeline failure'); });

    await expect(
      handleBlueprintAnalyze(proTenant, {
        analysis_id: analysisId, project_id: proProject, building_type: 'residential_sf', user_id: proOwner,
      }),
    ).rejects.toThrow('boom');

    const { rows } = await testPool.query(`SELECT status FROM blueprint_analyses WHERE id = $1`, [analysisId]);
    expect(rows[0].status).toBe('failed'); // NOT stuck in 'processing'
  });

  it('marks the analysis failed on an unknown building_type (no throw)', async () => {
    const analysisId = await createAnalysis(proTenant, proProject, proOwner);
    await handleBlueprintAnalyze(proTenant, {
      analysis_id: analysisId, project_id: proProject, building_type: 'castle', user_id: proOwner,
    });
    const { rows } = await testPool.query(`SELECT status FROM blueprint_analyses WHERE id = $1`, [analysisId]);
    expect(rows[0].status).toBe('failed');
  });
});

describe('permit milestone injection — T-55 tier soft gate (G2)', () => {
  it('PROFESSIONAL: injects AHJ inspection milestones (sort_order ≥ 1000, phase=inspections)', async () => {
    const analysisId = await createAnalysis(proTenant, proProject, proOwner);
    await handleBlueprintAnalyze(proTenant, {
      analysis_id: analysisId, project_id: proProject, building_type: 'residential_sf', user_id: proOwner,
    });

    const { rows: milestones } = await testPool.query(
      `SELECT id FROM blueprint_proposed_tasks
       WHERE analysis_id = $1 AND phase = 'inspections' AND sort_order >= 1000`,
      [analysisId],
    );
    expect(milestones.length).toBeGreaterThan(0);

    const { rows: [a] } = await testPool.query(
      `SELECT status, import_metadata FROM blueprint_analyses WHERE id = $1`, [analysisId],
    );
    expect(a.status).toBe('review_ready');
    expect(a.import_metadata.tier_note).toBeUndefined();
  });

  it('STARTER: skips injection and records a tier_note in import_metadata', async () => {
    const analysisId = await createAnalysis(starterTenant, starterProject, starterOwner);
    await handleBlueprintAnalyze(starterTenant, {
      analysis_id: analysisId, project_id: starterProject, building_type: 'residential_sf', user_id: starterOwner,
    });

    const { rows: milestones } = await testPool.query(
      `SELECT id FROM blueprint_proposed_tasks
       WHERE analysis_id = $1 AND phase = 'inspections' AND sort_order >= 1000`,
      [analysisId],
    );
    expect(milestones.length).toBe(0);

    const { rows: [a] } = await testPool.query(
      `SELECT status, import_metadata FROM blueprint_analyses WHERE id = $1`, [analysisId],
    );
    expect(a.status).toBe('review_ready');
    expect(a.import_metadata.tier_note).toMatch(/Upgrade to Professional/);
  });
});
