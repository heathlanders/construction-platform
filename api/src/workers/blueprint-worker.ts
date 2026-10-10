// workers/blueprint-worker.ts — handles the blueprint.analyze job
// Locked decisions: T-10, T-42, A-03
//
// Two analysis paths (selected in handleBlueprintAnalyze):
//   1. Template-only (no document_id)     — instant, $0
//   2. Text-layer / OCR extraction (PDF)  — fast, $0 (vector text layer or Tesseract OCR)
//
// Path selection: if document_id present, extract the text layer; a scanned PDF
// (no text layer) routes to OCR; either failing falls back to the template baseline
// with a tier_note in import_metadata. AI Vision is a deliberate no-AI stub at the
// product level — when wired, add a third path here (see Blueprint_Intelligence_v1_0.md).
// The legacy per-sheet analyze_sheet/aggregate_tasks stub jobs were removed 2026-07-11.

import { withTenantContext } from '../lib/tenant-context.js';
import { writeAuditEntry } from '../lib/audit-log.js';
import { getTemplate, isValidBuildingType, type BuildingType } from '../lib/blueprint-templates/index.js';
import { resolveJurisdiction, deriveCountyFromZip, repairOcrZip } from '../lib/jurisdictions/index.js';
import { tradeToPermitTrade } from '../lib/jurisdictions/trade-map.js';
import type { Trade, BuildingType as JurisBuildingType } from '../lib/jurisdictions/index.js';
import { downloadLiveObject } from '../lib/storage.js';
import { extractPdfText } from '../lib/blueprint-pdf/extract.js';
import { ocrPdfToText, ocrYieldChars, OCR_MIN_YIELD_CHARS } from '../lib/blueprint-pdf/ocr.js';
import { parseSheetText, type SheetExtractedData } from '../lib/blueprint-pdf/parse-sheets.js';
import { aggregateExtractions, buildTasksFromExtraction } from '../lib/blueprint-pdf/build-tasks.js';
import type { PdfExtractResult } from '../lib/blueprint-pdf/extract.js';
import {
  visionEnabled, checkOllamaHealth, analyzeSheetPng, renderPageForVision,
  VISION_MAX_PAGES, VISION_TOTAL_BUDGET_MS, OLLAMA_VISION_MODEL,
} from '../lib/blueprint-pdf/vision.js';
import {
  mergeSheetExtraction, selectVisionPages, emptyMergeStats, accumulateMergeStats,
  type VisionMergeStats,
} from '../lib/blueprint-pdf/merge-vision.js';
import { resolveBuilderProfile, type TitleBlockInfo, type BuilderProfile } from '../lib/blueprint-pdf/title-block.js';
import { composeProjectName } from '../lib/blueprint-pdf/project-name.js';
import { assertTier, TierEnforcementError } from '../services/tier-enforcement.js';
import type { PoolClient } from 'pg';

// ─── Payload types ────────────────────────────────────────────────────────────

interface BlueprintAnalyzePayload {
  analysis_id: string;
  document_id: string | null;
  project_id: string;
  building_type: string;
  user_id: string;
}

// NOTE: the legacy AI-Vision path (per-sheet `blueprint.analyze_sheet` + `blueprint.aggregate_tasks`
// stub jobs) was removed 2026-07-11 (Phase 4 cleanup) — nothing enqueued those jobs, so they were
// dead. AI Vision remains a deliberate no-AI stub at the product level; when we do wire real Claude
// Vision, add a new path in handleBlueprintAnalyze — see docs/Blueprint_Intelligence_v1_0.md for the
// exact SDK wiring. Today's live paths are template-only and text/OCR extraction.

// Audit a blueprint-analysis status transition on the same client (inside withTenantContext).
// System-driven but attributed to the analysis creator (userId). Never throws the pipeline —
// audit failures are logged, not fatal.
async function auditAnalysisStatus(
  client: PoolClient,
  tenantId: string,
  analysisId: string,
  action: string,
  actorId: string | null,
  extra?: Record<string, unknown>,
): Promise<void> {
  try {
    await writeAuditEntry(client, {
      tenantId, category: 'data', action,
      actorId: actorId ?? undefined,
      resourceType: 'blueprint_analysis', resourceId: analysisId,
      payload: extra,
    });
  } catch (err) {
    console.warn({ analysisId, action, err: (err as Error).message }, 'blueprint-worker: status audit failed');
  }
}

// ─── handleBlueprintAnalyze ───────────────────────────────────────────────────

export async function handleBlueprintAnalyze(
  tenantId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const { analysis_id, document_id, project_id, building_type, user_id } =
    payload as unknown as BlueprintAnalyzePayload;

  if (!isValidBuildingType(building_type)) {
    console.warn({ analysis_id, building_type }, 'blueprint-worker: unknown building_type — aborting');
    await markAnalysisFailed(tenantId, analysis_id, 'unknown_building_type', user_id);
    return;
  }

  // Claim the job: flip pending → processing atomically. If another worker (or a
  // duplicate delivery) already claimed it, or it's terminal, the UPDATE affects 0
  // rows and we skip — never re-run extraction over an already-processed analysis.
  const claimed = await withTenantContext(tenantId, async (client: PoolClient) => {
    const { rows } = await client.query(
      `UPDATE blueprint_analyses SET status = 'processing', updated_at = NOW()
       WHERE id = $1 AND status = 'pending' RETURNING id`,
      [analysis_id],
    );
    if (rows.length === 0) return false;
    await auditAnalysisStatus(client, tenantId, analysis_id, 'blueprint_analysis.processing', user_id,
      { has_document: !!document_id });
    return true;
  });
  if (!claimed) {
    console.warn({ analysis_id }, 'blueprint-worker: analysis not pending (already claimed or terminal) — skipping');
    return;
  }

  try {
    // ── Template-only path (no PDF) ──────────────────────────────────────────
    if (!document_id) {
      await runTemplatePath(tenantId, analysis_id, project_id, building_type as BuildingType, user_id);
      return;
    }

    // ── PDF path: text-layer extraction (Phase 1) ─────────────────────────────
    await runTextExtractionPath(
      tenantId, analysis_id, project_id, building_type as BuildingType, user_id, document_id,
    );
  } catch (err) {
    // PDF-parse/OCR failures are handled inside the paths (template fallback).
    // Anything that still throws (DB, storage, injection) must not leave the
    // analysis stuck in 'processing' — the web review page polls it forever.
    console.error({ analysis_id, err: (err as Error).message }, 'blueprint-worker: analyze failed — marking analysis failed');
    try {
      await markAnalysisFailed(tenantId, analysis_id, (err as Error).message, user_id);
    } catch (markErr) {
      console.error({ analysis_id, err: (markErr as Error).message }, 'blueprint-worker: could not mark analysis failed');
    }
    throw err; // keep pg-boss retry/DLQ semantics
  }
}

// ─── Title-block → jurisdiction suggestion ──────────────────────────────────
// pole_barn isn't a jurisdiction occupancy class — map it to residential_sf for the
// code/inspection lookup (post-frame residential outbuildings follow the same path here).
function toJurisBuildingType(bt: BuildingType): JurisBuildingType {
  return bt === 'pole_barn' ? 'residential_sf' : (bt as JurisBuildingType);
}

interface LocationSuggestion {
  source: 'blueprint_title_block';
  state: string;
  city: string | null;
  county_fips: string | null;
  county_name: string | null;
  zip: string | null;               // best ZIP — OCR-repaired when a correction was found
  zip_ocr: string | null;           // raw ZIP as OCR read it
  zip_corrected: boolean;           // true when zip !== zip_ocr (OCR digit misread repaired)
  county_source: 'builder_profile' | 'zip_lookup' | 'none';
  jurisdiction_key: string;
  matched_levels: string[];
  ahj_name: string | null;
  building_code: string;            // resolved building-trade code (IRC/IBC + edition)
  street_address: string | null;   // build street address (Title-Cased) from title block
  lot_number: string | null;        // lot designator from title block
  suggested_project_name: string | null;  // "Lot 25 - 437 Maple St, Madison" — advisory, PM confirms
  note: string;                     // PM-facing — confirm before it drives permits
}

// Best-effort jurisdiction suggestion from the title block. County is taken from the matched
// builder profile FIRST (authoritative — a known builder works a known county), because the
// OCR'd zip is unreliable (7→1 misreads, e.g. Cottage Grove 53527 → 53521). The zip is only a
// fallback county source. State comes from the title block or the profile. Returns null when
// no usable state. Never writes to the project — purely advisory metadata for the review UI.
async function buildLocationSuggestion(
  tb: TitleBlockInfo,
  buildingType: BuildingType,
  profile: BuilderProfile | null,
): Promise<LocationSuggestion | null> {
  const state = (tb.state ?? profile?.region_state ?? '').toUpperCase().slice(0, 2);
  if (!/^[A-Z]{2}$/.test(state)) return null;
  try {
    // Repair the OCR'd ZIP against the matched builder's jurisdiction (fixes 7→1-type digit
    // misreads, e.g. Cottage Grove 53527 read as 53521). No-op when nothing to correct.
    const repairedZip = await repairOcrZip(tb.zip, {
      county_fips: profile?.region_county_fips ?? null,
      city: tb.city,
      state,
    });
    // Prefer the builder profile's county; fall back to a ZIP lookup only if the profile has none.
    const zipCounty = await deriveCountyFromZip(repairedZip);
    let countyFips: string | null = null;
    let countyName: string | null = null;
    let countySource: LocationSuggestion['county_source'] = 'none';
    if (profile?.region_county_fips) {
      countyFips = profile.region_county_fips;
      countyName = profile.region_county_name ?? null;
      countySource = 'builder_profile';
    } else if (zipCounty) {
      countyFips = zipCounty.county_fips;
      countyName = zipCounty.county_name;
      countySource = 'zip_lookup';
    }

    const rj = resolveJurisdiction({
      state,
      county_fips: countyFips,
      county_name: countyName,
      city: tb.city ?? zipCounty?.primary_city ?? null,
      building_type: toJurisBuildingType(buildingType),
    });
    const b = rj.trades.building;
    return {
      source: 'blueprint_title_block',
      state,
      city: tb.city ?? zipCounty?.primary_city ?? null,
      county_fips: rj.geo.county_fips,
      county_name: rj.geo.county_name,
      zip: repairedZip,
      zip_ocr: tb.zip,
      zip_corrected: !!repairedZip && repairedZip !== tb.zip,
      county_source: countySource,
      jurisdiction_key: rj.jurisdiction_key,
      matched_levels: rj.matched_levels,
      ahj_name: rj.ahj?.ahj_name ?? null,
      building_code: [b.code_type, b.code_edition].filter(Boolean).join(' '),
      street_address: tb.street_address,
      lot_number: tb.lot_number,
      suggested_project_name: composeProjectName({
        lot_number: tb.lot_number,
        street_address: tb.street_address,
        city: tb.city ?? zipCounty?.primary_city ?? null,
      }),
      note: 'Resolved from blueprint title block — confirm project location before it drives permit milestones.',
    };
  } catch (err) {
    console.warn({ err: (err as Error).message }, 'blueprint-worker: location suggestion resolve failed');
    return null;
  }
}

// ─── Vision augmentation (local Ollama — optional, env-gated) ────────────────

interface VisionRunMeta {
  augmented: boolean;
  model?: string;
  skipped?: 'unreachable' | 'no_pages' | 'error';
  pages_selected?: number;
  pages_analyzed?: number;
  pages_failed?: number;
  duration_ms?: number;
  added?: VisionMergeStats;
}

/**
 * Optionally augment the per-sheet parser results with a local vision model (both vector
 * and scanned PDFs). Mutates perSheet in place (parser-wins merge — vision only adds).
 * Returns null when the gate is off (import_metadata stays byte-compatible with today);
 * otherwise returns run metadata + which page indices got augmented. NEVER throws —
 * any failure degrades to the parser-only result.
 */
async function runVisionAugmentation(
  tenantId: string,
  analysisId: string,
  buffer: Buffer,
  extraction: PdfExtractResult,
  perSheet: SheetExtractedData[],
  pathStartedAt: number,
  buildingType: BuildingType,
): Promise<{ meta: VisionRunMeta; augmentedPages: Set<number> } | null> {
  if (!visionEnabled()) return null;
  const augmentedPages = new Set<number>();
  try {
    if (!(await checkOllamaHealth())) {
      console.warn({ analysisId }, 'blueprint-worker: vision enabled but ollama unreachable — skipping augmentation');
      return { meta: { augmented: false, skipped: 'unreachable' }, augmentedPages };
    }
    const indices = selectVisionPages(extraction.pages, perSheet, VISION_MAX_PAGES);
    if (!indices.length) return { meta: { augmented: false, skipped: 'no_pages' }, augmentedPages };

    await updateAnalysisProgress(tenantId, analysisId, { stage: 'vision', page: 0, page_count: indices.length });
    const mupdf = await import('mupdf');
    const doc = mupdf.Document.openDocument(buffer, 'application/pdf');

    // Soft budget: stop-and-keep-partials. Cap by the job-expiry headroom too — OCR runs in
    // the same job and may already have consumed a chunk of the 3600s queue expiry.
    const remainingMs = 3_300_000 - (Date.now() - pathStartedAt);
    const deadline = Date.now() + Math.max(0, Math.min(VISION_TOTAL_BUDGET_MS, remainingMs));

    const started = Date.now();
    const added = emptyMergeStats();
    let analyzed = 0;
    let failed = 0;
    let done = 0;
    for (const idx of indices) {
      if (Date.now() > deadline) {
        console.warn({ analysisId, done, selected: indices.length }, 'blueprint-worker: vision budget exhausted — keeping partial augments');
        break;
      }
      let result = null;
      try {
        const png = renderPageForVision(mupdf, doc.loadPage(idx));
        result = await analyzeSheetPng(png, { buildingType });
      } catch (err) {
        console.warn({ analysisId, page: idx + 1, err: (err as Error).message }, 'blueprint-worker: vision page render failed — skipping');
      }
      if (result) {
        const { merged, stats } = mergeSheetExtraction(perSheet[idx], result.data);
        perSheet[idx] = merged;
        accumulateMergeStats(added, stats);
        augmentedPages.add(idx);
        analyzed++;
      } else {
        failed++;
      }
      done++;
      await updateAnalysisProgress(tenantId, analysisId, { stage: 'vision', page: done, page_count: indices.length });
    }

    console.info({ analysisId, analyzed, failed, selected: indices.length, ms: Date.now() - started }, 'blueprint-worker: vision augmentation complete');
    return {
      meta: {
        augmented: analyzed > 0,
        model: OLLAMA_VISION_MODEL,
        pages_selected: indices.length,
        pages_analyzed: analyzed,
        pages_failed: failed,
        duration_ms: Date.now() - started,
        added,
      },
      augmentedPages,
    };
  } catch (err) {
    // Vision is strictly additive — any unexpected failure proceeds parser-only.
    console.warn({ analysisId, err: (err as Error).message }, 'blueprint-worker: vision augmentation failed — continuing parser-only');
    return { meta: { augmented: false, skipped: 'error' }, augmentedPages };
  }
}

// ─── Text-layer extraction path (Phase 1 — vector PDFs) ─────────────────────

async function runTextExtractionPath(
  tenantId: string,
  analysisId: string,
  projectId: string,
  buildingType: BuildingType,
  userId: string,
  documentId: string,
): Promise<void> {
  const pathStartedAt = Date.now();   // vision budget derives job-expiry headroom from this
  // 1. Fetch the plan file's live storage_path. The blueprint on-ramp references a
  //    `files` row (upload → quarantine → scan → live). Only a scan-passed ('ready')
  //    file has a live storage_path the worker can download.
  const doc = await withTenantContext(tenantId, async (client: PoolClient) => {
    const { rows } = await client.query(
      `SELECT id, storage_path, status FROM files
       WHERE id = $1 AND deleted_at IS NULL`,
      [documentId],
    );
    return rows[0] as { id: string; storage_path: string | null; status: string } | undefined;
  });

  if (!doc || doc.status !== 'ready' || !doc.storage_path) {
    console.warn({ analysisId, documentId, status: doc?.status }, 'blueprint-worker: file not found or not scan-ready — falling back to template');
    await runTemplatePath(tenantId, analysisId, projectId, buildingType, userId, {
      tier_note: 'Plan file not accessible (still scanning or removed) — used template baseline',
      source_override: 'template_fallback',
    });
    return;
  }

  // 2. Download + extract
  let extraction;
  let buffer: Buffer;
  try {
    await updateAnalysisProgress(tenantId, analysisId, { stage: 'extracting' });
    buffer = await downloadLiveObject(doc.storage_path);
    extraction = await extractPdfText(buffer);
  } catch (err) {
    console.error({ analysisId, documentId, err: (err as Error).message }, 'blueprint-worker: PDF extraction failed — falling back to template');
    await runTemplatePath(tenantId, analysisId, projectId, buildingType, userId, {
      tier_note: 'PDF parse failed — used template baseline',
      source_override: 'template_fallback',
    });
    return;
  }

  // 3. Scanned PDF (no text layer) → OCR fallback (deterministic, no AI/network).
  //    Rasterize + Tesseract to synthesize a text layer, then run the same parse
  //    pipeline. If OCR yields too little usable text, fall back to template.
  let usedOcr = false;
  if (!extraction.metadata.is_vector) {
    console.info({ analysisId, page_count: extraction.page_count }, 'blueprint-worker: scanned PDF (no text layer) — attempting OCR');
    try {
      await updateAnalysisProgress(tenantId, analysisId, { stage: 'ocr', page: 0, page_count: extraction.page_count });
      const ocr = await ocrPdfToText(buffer, (done, total) =>
        updateAnalysisProgress(tenantId, analysisId, { stage: 'ocr', page: done, page_count: total }));
      if (ocrYieldChars(ocr) >= OCR_MIN_YIELD_CHARS) {
        extraction = ocr;
        usedOcr = true;
        console.info({ analysisId, yield: ocrYieldChars(ocr) }, 'blueprint-worker: OCR succeeded — using OCR text');
      } else {
        console.info({ analysisId, yield: ocrYieldChars(ocr) }, 'blueprint-worker: OCR yield too low — falling back to template');
        await runTemplatePath(tenantId, analysisId, projectId, buildingType, userId, {
          tier_note: 'Scanned PDF — OCR found little usable text (likely a graphic-heavy sheet). Used template baseline.',
          source_override: 'template_scanned_fallback',
        });
        return;
      }
    } catch (err) {
      console.error({ analysisId, err: (err as Error).message }, 'blueprint-worker: OCR failed — falling back to template');
      await runTemplatePath(tenantId, analysisId, projectId, buildingType, userId, {
        tier_note: 'Scanned PDF — OCR failed. Used template baseline.',
        source_override: 'template_scanned_fallback',
      });
      return;
    }
  }

  // 4. Parse each sheet
  const perSheet = extraction.pages.map((p) => parseSheetText(p.discipline, p.text, p.title_block_text));

  // 4b. Optional local vision-model augmentation (env-gated; both vector + scanned PDFs).
  //     Mutates perSheet in place — parser stays the trusted baseline, vision only adds.
  //     Any failure (server down, timeout, bad output) degrades to parser-only.
  const visionRun = await runVisionAugmentation(tenantId, analysisId, buffer, extraction, perSheet, pathStartedAt, buildingType);

  await updateAnalysisProgress(tenantId, analysisId, { stage: 'building_tasks' });
  const agg = aggregateExtractions(perSheet);

  // 5. Build merged task list (template + extraction-derived). Project state region-gates
  //    CA-specific code wording (Title-24/CalGreen) — a WI plan must not get Title-24 tasks.
  const stateCode = await withTenantContext(tenantId, async (client: PoolClient) => {
    const { rows } = await client.query(`SELECT state FROM projects WHERE id = $1`, [projectId]);
    return (rows[0]?.state as string | null) ?? null;
  });
  const tasks = buildTasksFromExtraction(buildingType, agg, stateCode);

  // 6. Persist sheets + proposed tasks
  await withTenantContext(tenantId, async (client: PoolClient) => {
    // Insert one row per page
    for (const page of extraction.pages) {
      await client.query(
        `INSERT INTO blueprint_sheets
           (tenant_id, analysis_id, sheet_number, sheet_title, discipline, page_number, status, analysis_result)
         VALUES ($1, $2, $3, $4, $5, $6, 'analyzed', $7)`,
        [
          tenantId, analysisId,
          page.sheet_number,
          page.sheet_title,
          page.discipline,
          page.page_number,
          JSON.stringify({
            text_layer_chars: page.text.length,
            content_discipline: perSheet[page.page_number - 1].detected_discipline,
            flags: perSheet[page.page_number - 1].flags,
            ...(visionRun ? { vision: visionRun.augmentedPages.has(page.page_number - 1) } : {}),
          }),
        ],
      );
    }

    // Insert proposed tasks (template + augments)
    for (const task of tasks) {
      await client.query(
        `INSERT INTO blueprint_proposed_tasks
           (tenant_id, analysis_id, sheet_id, title, description, trade_type, phase,
            csi_division, estimated_duration_days, sort_order, review_status)
         VALUES ($1, $2, NULL, $3, $4, $5, $6, $7, $8, $9, 'pending')`,
        [
          tenantId, analysisId,
          task.title, task.description ?? null,
          task.trade_type, task.phase,
          task.csi_division, task.estimated_duration_days,
          task.sort_order,
        ],
      );
    }

    // Permit milestone injection (existing logic)
    const trades = [...new Set(tasks.map((t) => t.trade_type))];
    const phases = [...new Set(tasks.map((t) => t.phase))];
    const { inserted: injected, taskTrades: injectedTrades, tier_note: injectionTierNote } = await injectPermitInspectionMilestones(client, tenantId, analysisId, projectId, trades);
    const totalTasks = tasks.length + injected;
    for (const tr of injectedTrades) { const t = tr as (typeof trades)[number]; if (!trades.includes(t)) trades.push(t); }
    if (injected > 0 && !phases.includes('inspections')) phases.push('inspections');

    // Title block → processing hints. A recognized builder/drafter attaches a profile;
    // the OCR'd location seeds a jurisdiction SUGGESTION (state-level at minimum). Neither
    // overwrites the project record — they surface in the review UI for the PM to confirm.
    const tb = agg.title_block;
    const builderProfile = resolveBuilderProfile(tb);
    const locationSuggestion = await buildLocationSuggestion(tb, buildingType, builderProfile);

    // Update analysis metadata
    const importMetadata = {
      trades_found: trades,
      phases_found: phases,
      task_count: totalTasks,
      source: usedOcr ? 'ocr_extraction' : 'text_extraction',
      pdf_metadata: extraction.metadata,
      sheet_count: extraction.page_count,
      panels_extracted: agg.panels.length,
      // Structured facts the Build-Out Engine reads directly (task-buildout/facts.ts) — no more
      // reconstructing components/amperage from proposed-task titles for extraction-derived tasks.
      components: [...agg.components],
      panels: agg.panels.map((p) => ({ amperage: p.amperage })),
      windows_extracted: agg.windows.length,
      doors_extracted: agg.doors.length,
      rooms_extracted: agg.rooms.length,
      fixture_types: [...agg.fixture_types],
      flags: agg.flags,
      callouts: agg.callouts,
      title_block: tb,
      builder_profile: builderProfile,
      location_suggestion: locationSuggestion,
      // Vision provenance — absent entirely when the gate is off (byte-compatible with today).
      ...(visionRun ? { vision: visionRun.meta } : {}),
      ...(injectionTierNote ? { tier_note: injectionTierNote } : {}),
    };

    await client.query(
      `UPDATE blueprint_analyses
       SET status = 'review_ready',
           sheet_count = $2,
           extracted_task_count = $3,
           import_metadata = $4,
           updated_at = NOW()
       WHERE id = $1`,
      [analysisId, extraction.page_count, totalTasks, JSON.stringify(importMetadata)],
    );
    await auditAnalysisStatus(client, tenantId, analysisId, 'blueprint_analysis.review_ready', userId || null,
      { task_count: totalTasks, source: importMetadata.source });

    // Notify PMs (same pattern as template path)
    const { rows: pmUsers } = await client.query(
      `SELECT id FROM users
       WHERE tenant_id = $1 AND role IN ('owner', 'project_manager') AND status = 'active' AND deleted_at IS NULL`,
      [tenantId],
    );
    for (const u of pmUsers as { id: string }[]) {
      await client.query(
        `INSERT INTO notifications (tenant_id, user_id, title, body, category, data)
         VALUES ($1, $2, $3, $4, 'project', $5)`,
        [
          tenantId, u.id,
          'Blueprint extraction ready for review',
          `${totalTasks} tasks extracted from ${extraction.page_count}-sheet blueprint. Review and import to schedule.`,
          JSON.stringify({ analysis_id: analysisId, project_id: projectId, type: 'blueprint_review_ready' }),
        ],
      );
    }
  });

  console.info(
    { analysisId, tenantId, taskCount: tasks.length, sheetCount: extraction.page_count },
    'blueprint-worker: text-extraction path complete',
  );
}

// ─── Template-only path ───────────────────────────────────────────────────────

async function runTemplatePath(
  tenantId: string,
  analysisId: string,
  projectId: string,
  buildingType: BuildingType,
  userId: string,
  override?: { tier_note?: string; source_override?: string },
): Promise<void> {
  const tasks = getTemplate(buildingType);

  await withTenantContext(tenantId, async (client: PoolClient) => {
    for (const task of tasks) {
      await client.query(
        `INSERT INTO blueprint_proposed_tasks
           (tenant_id, analysis_id, sheet_id, title, description, trade_type, phase,
            csi_division, estimated_duration_days, sort_order, review_status)
         VALUES ($1, $2, NULL, $3, $4, $5, $6, $7, $8, $9, 'pending')`,
        [
          tenantId, analysisId,
          task.title, task.description ?? null,
          task.trade_type, task.phase,
          task.csi_division, task.estimated_duration_days,
          task.sort_order,
        ],
      );
    }

    const trades = [...new Set(tasks.map((t) => t.trade_type))];
    const phases = [...new Set(tasks.map((t) => t.phase))];

    // Inject permit-linked inspection milestones if an active permit exists (T-55 soft-gated)
    const { inserted: injected, taskTrades: injectedTrades, tier_note: injectionTierNote } = await injectPermitInspectionMilestones(client, tenantId, analysisId, projectId, trades);
    const totalTaskCount = tasks.length + injected;
    for (const tr of injectedTrades) { const t = tr as (typeof trades)[number]; if (!trades.includes(t)) trades.push(t); }
    if (injected > 0 && !phases.includes('inspections')) phases.push('inspections');

    await client.query(
      `UPDATE blueprint_analyses
       SET status = 'review_ready',
           extracted_task_count = $2,
           import_metadata = $3,
           updated_at = NOW()
       WHERE id = $1`,
      [
        analysisId,
        totalTaskCount,
        JSON.stringify({
          trades_found: trades,
          phases_found: phases,
          task_count: totalTaskCount,
          source: override?.source_override ?? 'template',
          // Fallback-reason note wins over the injection tier note when both apply.
          ...((override?.tier_note ?? injectionTierNote) ? { tier_note: override?.tier_note ?? injectionTierNote } : {}),
        }),
      ],
    );
    await auditAnalysisStatus(client, tenantId, analysisId, 'blueprint_analysis.review_ready', userId || null,
      { task_count: totalTaskCount, source: override?.source_override ?? 'template' });

    // Notify PMs
    const { rows: pmUsers } = await client.query(
      `SELECT id FROM users
       WHERE tenant_id = $1 AND role IN ('owner', 'project_manager') AND status = 'active' AND deleted_at IS NULL`,
      [tenantId],
    );
    for (const user of pmUsers as { id: string }[]) {
      await client.query(
        `INSERT INTO notifications (tenant_id, user_id, title, body, category, data)
         VALUES ($1, $2, $3, $4, 'project', $5)`,
        [
          tenantId, user.id,
          'Schedule template ready for review',
          `${tasks.length} tasks pre-built from building template. Review and import to project schedule.`,
          JSON.stringify({ analysis_id: analysisId, project_id: projectId, type: 'blueprint_review_ready' }),
        ],
      );
    }
  });

  console.info({ analysisId, tenantId, taskCount: tasks.length }, 'blueprint-worker: template path complete');
}

// ─── Permit inspection milestone injection ────────────────────────────────────
// If the project has an active permit for any trade (electrical/plumbing/mechanical/
// building — see PERMIT_TRADES), inject that permit's inspection milestone sequence as
// blueprint_proposed_tasks with phase='inspections'.
// These are schedule placeholders — formal AHJ tracking lives in the inspections table.
// A trade's sequence injects only when one of its matchTrades appears in trades_found
// AND an ACTIVE permit of that permit_type exists for the project.

// Trades that have an AHJ permit + inspection-sequence library. Each entry maps one or more
// blueprint disciplines (matchTrades — checked against trades_found) to the permits.permit_type
// value (which can differ — an HVAC permit is a 'mechanical' permit; roofing/concrete/framing
// are all inspected under one 'building' permit), and resolves the inspection steps + label.
// taskTrade is stamped on the injected blueprint_proposed_tasks row. A single entry injects its
// sequence at most once, even when several of its matchTrades are present.
// Matching is TAXONOMY-DRIVEN since T-64: an entry triggers when ANY trade in trades_found
// collapses onto its permitType via tradeToPermitTrade (lib/jurisdictions/trade-map.ts) — the
// single source of truth. So fire_sprinkler → plumbing milestones, ductwork → mechanical,
// masonry/siding/excavation/… → building; no-permit trades (painting, surveying, …) trigger
// nothing. taskTrade stays the umbrella key stamped on injected rows.
const PERMIT_TRADES: Array<{
  permitType: Trade;      // permits.permit_type column value; indexes resolveJurisdiction().trades
  taskTrade: string;      // blueprint_proposed_tasks.trade_type stamped on injected rows
  label: (permit: { code_type?: string | null; code_edition?: string | null; nec_edition?: string | null }) => string;
}> = [
  {
    permitType: 'electrical', taskTrade: 'electrical',
    label: (p) => `AHJ electrical inspection milestone — NEC ${p.code_edition ?? p.nec_edition ?? ''}`.trim(),
  },
  {
    permitType: 'plumbing', taskTrade: 'plumbing',
    label: (p) => `AHJ plumbing inspection milestone — ${p.code_type ?? 'IPC'} ${p.code_edition ?? ''}`.trim(),
  },
  {
    permitType: 'mechanical', taskTrade: 'hvac',
    label: (p) => `AHJ mechanical inspection milestone — ${p.code_type ?? 'IMC'} ${p.code_edition ?? ''}`.trim(),
  },
  {
    // Roofing, concrete, framing, structural, general, masonry, siding, … are inspected under
    // ONE building permit — the building sequence injects at most once.
    permitType: 'building', taskTrade: 'general',
    label: (p) => `AHJ building inspection milestone — ${p.code_type ?? 'IBC'} ${p.code_edition ?? ''}`.trim(),
  },
];

async function injectPermitInspectionMilestones(
  client: PoolClient,
  tenantId: string,
  analysisId: string,
  projectId: string,
  tradesFound: string[],
): Promise<{ inserted: number; taskTrades: string[]; tier_note?: string }> {
  let inserted = 0;
  const taskTrades = new Set<string>();

  // T-55 soft gate — milestone auto-generation is Professional+. Starter keeps the
  // permit + blueprint tasks; the AHJ milestones are skipped with a tier note
  // (mirrors the POST /v1/permits soft gate).
  try {
    await assertTier(tenantId, 'PROFESSIONAL');
  } catch (err) {
    if (!(err instanceof TierEnforcementError)) throw err;
    const { rows: activePermits } = await client.query(
      `SELECT 1 FROM permits WHERE project_id = $1 AND status = 'active' AND deleted_at IS NULL LIMIT 1`,
      [projectId],
    );
    return {
      inserted: 0,
      taskTrades: [],
      ...(activePermits.length > 0
        ? { tier_note: 'Upgrade to Professional to auto-generate AHJ inspection milestones from your active permits.' }
        : {}),
    };
  }

  for (const { permitType, taskTrade, label } of PERMIT_TRADES) {
    if (!tradesFound.some((tr) => tradeToPermitTrade(tr) === permitType)) continue;

    // Most recent ACTIVE permit of this trade for the project. Only an active permit
    // (issued/approved by the AHJ) gates milestone injection — draft/submitted/approved/
    // failed_inspection permits must NOT inject (spec: "active permit" trigger).
    // NOTE: permits identifies trade via the permit_type column (not trade_type — that
    // column lives on inspections). Earlier code queried the wrong column.
    const { rows: permitRows } = await client.query(
      `SELECT id, building_type, state_code, county_fips, county_name, city_name,
              code_type, code_edition, nec_edition
       FROM permits
       WHERE project_id = $1
         AND permit_type = $2
         AND deleted_at IS NULL
         AND status = 'active'
       ORDER BY created_at DESC
       LIMIT 1`,
      [projectId, permitType],
    );
    if (permitRows.length === 0) continue;

    const permit = permitRows[0] as {
      id: string; building_type: string;
      state_code: string | null; county_fips: string | null; county_name: string | null; city_name: string | null;
      code_type: string | null; code_edition: string | null; nec_edition: string | null;
    };
    const description = label(permit);

    // Resolve the inspection sequence through the jurisdiction engine using the permit's STORED
    // geography snapshot — so AHJ-added/removed steps (e.g. Madison's erosion-control building
    // inspection) flow into blueprint tasks, matching what the permit's own milestones generated.
    const rj = resolveJurisdiction({
      state: permit.state_code ?? '',
      county_fips: permit.county_fips,
      county_name: permit.county_name,
      city: permit.city_name,
      building_type: (permit.building_type as JurisBuildingType),
    });
    const steps = rj.trades[permitType].steps;

    for (const step of steps) {
      await client.query(
        `INSERT INTO blueprint_proposed_tasks
           (tenant_id, analysis_id, sheet_id, title, description, trade_type, phase,
            csi_division, estimated_duration_days, sort_order, review_status)
         VALUES ($1, $2, NULL, $3, $4, $5, 'inspections', $6, $7, $8, 'pending')
         ON CONFLICT DO NOTHING`,
        [
          tenantId, analysisId,
          step.title,
          description,
          taskTrade,
          step.csi_division,
          step.estimated_duration_days,
          1000 + step.sequence_order,  // sort after trade tasks, grouped within inspections phase
        ],
      );
      inserted++;
    }
    if (steps.length > 0) taskTrades.add(taskTrade);
  }

  return { inserted, taskTrades: [...taskTrades] };
}

// ─── Internal ─────────────────────────────────────────────────────────────────

// Transient progress written into import_metadata WHILE status='processing' — the
// review page's poll renders it ("OCR sheet 5 of 12…"). The completion write
// replaces import_metadata wholesale, so no cleanup step is needed.
type AnalysisProgress =
  | { stage: 'extracting' }
  | { stage: 'ocr'; page: number; page_count: number }
  | { stage: 'vision'; page: number; page_count: number }
  | { stage: 'building_tasks' };

async function updateAnalysisProgress(
  tenantId: string,
  analysisId: string,
  progress: AnalysisProgress,
): Promise<void> {
  try {
    await withTenantContext(tenantId, async (client: PoolClient) => {
      await client.query(
        `UPDATE blueprint_analyses
         SET import_metadata = COALESCE(import_metadata, '{}'::jsonb) || jsonb_build_object('progress', $2::jsonb),
             updated_at = NOW()
         WHERE id = $1 AND status = 'processing'`,
        [analysisId, JSON.stringify(progress)],
      );
    });
  } catch (err) {
    // Progress is cosmetic — never let it fail the pipeline.
    console.warn({ analysisId, err: (err as Error).message }, 'blueprint-worker: progress update failed');
  }
}

async function markAnalysisFailed(
  tenantId: string,
  analysisId: string,
  reason?: string,
  actorId?: string,
): Promise<void> {
  await withTenantContext(tenantId, async (client: PoolClient) => {
    // Record a PM-facing failure reason into import_metadata.failure so the review page can
    // explain WHY (B2.6) instead of a bare "failed". Merge — never clobber prior progress keys.
    const failure = { reason: reason ?? 'unknown_error' };
    await client.query(
      `UPDATE blueprint_analyses
       SET status = 'failed',
           import_metadata = COALESCE(import_metadata, '{}'::jsonb) || jsonb_build_object('failure', $2::jsonb),
           updated_at = NOW()
       WHERE id = $1`,
      [analysisId, JSON.stringify(failure)],
    );
    await auditAnalysisStatus(client, tenantId, analysisId, 'blueprint_analysis.failed', actorId ?? null,
      { reason: failure.reason });
  });
}
