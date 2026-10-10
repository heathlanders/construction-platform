// blueprint-vision-worker.test.ts — worker wiring for the local vision augmentation.
//
// Runs the REAL text-extraction path (real DB, real mupdf render on the sd-adu fixture) with
// storage mocked to serve the fixture and the two Ollama-touching functions mocked. Asserts:
//   1. Gate off (default) → import_metadata has NO `vision` key (byte-compatible with today).
//   2. Gate on + Ollama unreachable → analysis still reaches review_ready; vision.augmented=false.
//   3. Gate on + model returns data → merged into import_metadata (components/flags), provenance
//      stats recorded, per-sheet analysis_result.vision flags set.

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

vi.mock('../lib/queue.js', () => ({
  sendJob: vi.fn().mockResolvedValue(undefined),
  getQueue: vi.fn(),
  stopQueue: vi.fn().mockResolvedValue(undefined),
}));
// Serve the vector fixture instead of hitting object storage.
vi.mock('../lib/storage.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/storage.js')>();
  return { ...actual, downloadLiveObject: vi.fn() };
});
// Mock ONLY the two Ollama-touching functions — the render + merge + selection stay real.
vi.mock('../lib/blueprint-pdf/vision.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/blueprint-pdf/vision.js')>();
  return { ...actual, checkOllamaHealth: vi.fn(), analyzeSheetPng: vi.fn() };
});

import { testPool } from './setup.js';
import { handleBlueprintAnalyze } from '../workers/blueprint-worker.js';
import { downloadLiveObject } from '../lib/storage.js';
import { checkOllamaHealth, analyzeSheetPng, type VisionResult } from '../lib/blueprint-pdf/vision.js';
import { loadReferenceCache } from '../lib/jurisdictions/reference-store.js';

const downloadMock = downloadLiveObject as unknown as ReturnType<typeof vi.fn>;
const healthMock = checkOllamaHealth as unknown as ReturnType<typeof vi.fn>;
const analyzeMock = analyzeSheetPng as unknown as ReturnType<typeof vi.fn>;

const FIXTURE = readFileSync(resolve(__dirname, '../../test/fixtures/sd-adu.pdf'));

const tenantId = randomUUID();
const projectId = randomUUID();
const ownerId = randomUUID();
const fileId = randomUUID();

async function createAnalysis(): Promise<string> {
  const id = randomUUID();
  await testPool.query(
    `INSERT INTO blueprint_analyses (id, tenant_id, project_id, document_id, building_type, status, created_by)
     VALUES ($1,$2,$3,$4,'residential_sf','pending',$5)`,
    [id, tenantId, projectId, fileId, ownerId],
  );
  return id;
}

async function runAnalysis(): Promise<{ status: string; import_metadata: Record<string, any>; analysisId: string }> {
  const analysisId = await createAnalysis();
  await handleBlueprintAnalyze(tenantId, {
    analysis_id: analysisId, document_id: fileId, project_id: projectId,
    building_type: 'residential_sf', user_id: ownerId,
  });
  const { rows: [a] } = await testPool.query(
    `SELECT status, import_metadata FROM blueprint_analyses WHERE id = $1`, [analysisId],
  );
  return { status: a.status, import_metadata: a.import_metadata, analysisId };
}

const visionResult = (overrides: Partial<VisionResult['data']> = {}): VisionResult => ({
  data: { schedules: {}, flags: {}, components: [], title_block: {}, ...overrides },
  model: 'qwen2.5vl:7b', duration_ms: 42, tokens_stripped: 0,
});

beforeAll(async () => {
  await loadReferenceCache(testPool);
  await testPool.query(
    `INSERT INTO tenants (id, name, slug, tier, status) VALUES ($1,'BPV Test',$2,'professional','active')`,
    [tenantId, `bpv-${tenantId.slice(0, 8)}`],
  );
  await testPool.query(
    `INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, status)
     VALUES ($1,$2,$3,'x','Vera','Vision','owner','active')`,
    [ownerId, tenantId, `owner-${tenantId.slice(0, 8)}@bpv.test`],
  );
  await testPool.query(
    `INSERT INTO projects (id, tenant_id, name, status, state) VALUES ($1,$2,'BPV Project','active','CA')`,
    [projectId, tenantId],
  );
  await testPool.query(
    `INSERT INTO files (id, tenant_id, project_id, filename, content_type, file_size_bytes,
                        category, quarantine_path, storage_path, status, created_by)
     VALUES ($1,$2,$3,'sd-adu.pdf','application/pdf',$4,'plan','q/x','live/x','ready',$5)`,
    [fileId, tenantId, projectId, FIXTURE.length, ownerId],
  );
});

afterAll(async () => {
  delete process.env.BLUEPRINT_VISION_ENABLED;
  await testPool.query(`DELETE FROM blueprint_sheets WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM blueprint_proposed_tasks WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM blueprint_analyses WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM notifications WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM audit_log WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM files WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM projects WHERE id = $1`, [projectId]);
  await testPool.query(`DELETE FROM users WHERE tenant_id = $1`, [tenantId]);
  await testPool.query(`DELETE FROM tenants WHERE id = $1`, [tenantId]);
});

beforeEach(() => {
  downloadMock.mockResolvedValue(FIXTURE);
  healthMock.mockReset();
  analyzeMock.mockReset();
});

describe('blueprint worker — vision augmentation wiring', () => {
  it('gate off (default): no vision key in import_metadata, health never checked', async () => {
    delete process.env.BLUEPRINT_VISION_ENABLED;
    const { status, import_metadata } = await runAnalysis();
    expect(status).toBe('review_ready');
    expect(import_metadata.source).toBe('text_extraction');
    expect(import_metadata.vision).toBeUndefined();
    expect(healthMock).not.toHaveBeenCalled();
  });

  it('gate on + ollama unreachable: analysis completes, vision.augmented=false, skipped=unreachable', async () => {
    process.env.BLUEPRINT_VISION_ENABLED = '1';
    healthMock.mockResolvedValue(false);
    const { status, import_metadata } = await runAnalysis();
    expect(status).toBe('review_ready');
    expect(import_metadata.source).toBe('text_extraction');   // source unchanged
    expect(import_metadata.vision).toEqual({ augmented: false, skipped: 'unreachable' });
    expect(analyzeMock).not.toHaveBeenCalled();
  });

  it('gate on + model returns data: merged into metadata with provenance; sheet rows flagged', async () => {
    process.env.BLUEPRINT_VISION_ENABLED = '1';
    healthMock.mockResolvedValue(true);
    analyzeMock.mockResolvedValue(visionResult({
      components: ['wall_girts'],
      flags: { has_natural_gas: true },
      schedules: { panels: [{ amperage: 400 }] },
    }));

    const { status, import_metadata, analysisId } = await runAnalysis();
    expect(status).toBe('review_ready');
    expect(import_metadata.source).toBe('text_extraction');

    // Vision provenance
    const v = import_metadata.vision;
    expect(v.augmented).toBe(true);
    expect(v.model).toBe('qwen2.5vl:7b');
    expect(v.pages_selected).toBeGreaterThan(0);
    expect(v.pages_analyzed).toBe(v.pages_selected);
    expect(v.pages_failed).toBe(0);
    expect(v.added.components_added).toContain('wall_girts');
    expect(v.added.flags_set).toEqual([]);   // vision flags are ignored — parser owns flags

    // Merged into the aggregate the pipeline persists (flags come from the parser, not vision —
    // covered by flags_set===[] above, so no flag-value assertion here).
    expect(import_metadata.components).toContain('wall_girts');
    expect(import_metadata.panels.map((p: { amperage: number }) => p.amperage)).toContain(400);

    // Per-sheet vision flag persisted
    const { rows: sheets } = await testPool.query(
      `SELECT analysis_result FROM blueprint_sheets WHERE analysis_id = $1`, [analysisId],
    );
    expect(sheets.length).toBeGreaterThan(0);
    expect(sheets.some((s) => s.analysis_result.vision === true)).toBe(true);
    expect(sheets.every((s) => typeof s.analysis_result.vision === 'boolean')).toBe(true);
  });

  it('gate on + every sheet fails: vision.augmented=false, parser result untouched', async () => {
    process.env.BLUEPRINT_VISION_ENABLED = '1';
    healthMock.mockResolvedValue(true);
    analyzeMock.mockResolvedValue(null);   // analyzeSheetPng contract: null on any failure

    const { status, import_metadata } = await runAnalysis();
    expect(status).toBe('review_ready');
    const v = import_metadata.vision;
    expect(v.augmented).toBe(false);
    expect(v.pages_failed).toBe(v.pages_selected);
    expect(import_metadata.components).not.toContain('wall_girts');
  });
});
