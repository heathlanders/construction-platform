# Blueprint Intelligence Skill
**Feature added: Session 21 (2026-03-24)**
**See full spec: @docs/Blueprint_Intelligence_v1_0.md**

## What this feature does

Pre-builds every schedule task for a construction project organized by **trade** and **phase**.
Three paths, auto-selected in `POST /v1/blueprints/analyze` (`analysis_mode` in response):
1. **template** — no `document_id`; instant, building-type baseline only.
2. **text_extraction** — `document_id` given; reads the PDF **text layer** (vector/CAD only),
   parses per-sheet schedules + flags, merges onto the template baseline. **No AI, free.**
   This is the live default when a PDF is uploaded. Code: `api/src/lib/blueprint-pdf/`
   (`extract.ts` → `parse-sheets.ts` → `build-tasks.ts`).
3. **OCR** (`source: ocr_extraction`) — scanned PDF (`is_vector=false`) → `blueprint-pdf/ocr.ts`
   rasterizes pages with `mupdf` + OCRs with `tesseract.js` (pure-WASM, **no system deps, no AI,
   no network**; `eng.traineddata` vendored at `api/assets/tessdata/`), then runs the SAME
   parse/build pipeline. Falls to `template_scanned_fallback` only if OCR yield < ~200 chars.
   - **High-DPI full page (accurate data):** `ocrPageTiled()` renders the whole sheet at
     `OCR_PAGE_DPI` (default 300) via **adaptive tiling** — clipped DrawDevice tiles capped at
     `OCR_TILE_MAX_PX` px/side (default 3000), 4% overlap, OCR each, concat. Small sheet = 1 tile;
     large 24×36" sheet auto-splits (memory-safe, never one giant bitmap).
   - **Title-block second pass:** bottom-right corner re-rendered at 450dpi / PSM-6
     (`renderTitleBlockPng`, crop `TB_FRAC_X/Y`) → `ExtractedPage.title_block_text`. Small legend
     glyphs that collapse at page DPI read correctly (ZIP `53527`, not the misread `53521`).
4. **Local vision augmentation** (2026-07-13, `import_metadata.vision`) — env-gated
   (`BLUEPRINT_VISION_ENABLED=1`) layer over BOTH extraction paths, not a separate mode: Ollama +
   `qwen2.5vl:7b` on the HOST GPU reads `selectVisionPages()`-chosen sheets ($0, no data egress).
   `blueprint-pdf/vision.ts` (client — zod strip-don't-reject, prompt + validator both built from
   the exported `FIXTURE_TOKENS`/`COMPONENT_TOKENS` so they can't drift) + `merge-vision.ts`
   (**parser-wins** merge: flags OR'd, schedule rows union-deduped by mark, title-block
   fill-only-null) + `runVisionAugmentation()` in blueprint-worker (health probe, per-sheet
   skip-and-continue, soft budget capped by job-expiry headroom). Any failure → parser-only;
   vision can never fail/hang an analysis. `import_metadata.source` unchanged; provenance in
   `import_metadata.vision.added`; per-sheet `analysis_result.vision` boolean; violet
   "Vision-assisted" chip + `{stage:'vision'}` progress in the review UI. Ollama runs
   user-space at `~/.local/ollama` (Vulkan backend — NVIDIA driver 535 < 550 blocks CUDA);
   compose reaches it via `host.docker.internal` `extra_hosts`. Runbook + env table:
   `docs/Blueprint_Intelligence_v1_0.md` §Vision Augmentation. Smoke:
   `src/scripts/smoke-vision.ts`. Cloud Claude Vision not built (sketch retained in the doc).

`import_metadata.source` records which ran: `text_extraction` | `ocr_extraction` | `template` |
`template_fallback` (doc missing / parse error) | `template_scanned_fallback` (scanned + OCR found
too little). E2E proof: CJPIA commercial vector PDF → 60 tasks (`text_extraction`); real Madison WI
**scanned** builder plans → 62 tasks incl. 15 extraction augments (`ocr_extraction`).
Tests: `api/src/test/blueprint-pdf{,-commercial}.test.ts`, `blueprint-ocr.test.ts`;
fixtures `api/test/fixtures/*.pdf` (+ `madison-lot25-ocr.txt` vendored OCR text).

OCR is noisy on dense drawings: reliable for discipline, **bare room labels**, and **component
callouts** (trusses/TJI/LVL/footings/anchor-bolts/R-values/siding), not schedule tables. The
detectors that handle OCR-grade text are building-type-agnostic — bare-room patterns +
`COMPONENT_PATTERNS` + WI `SPS` code refs in `parse-sheets.ts`, and the `comp(...)` component→task
branches in `build-tasks.ts`. Building type `pole_barn` (post-frame) added for ag/light-commercial.

## Key invariants

1. All `blueprint_analyses`, `blueprint_sheets`, `blueprint_proposed_tasks` rows are **tenant-scoped with RLS**
2. All background jobs carry `tenant_id` in envelope (T-10) and use `withTenantContext()` (T-42)
3. Proposed tasks are **never** written to `schedule_tasks` until user explicitly imports them
4. Import is idempotent — the accepted-task query filters `schedule_task_id IS NULL`, so a second
   `/import` returns `imported_count: 0` instead of duplicating schedule_tasks (fixed 2026-07-02 —
   previously re-import DID duplicate). **Worker hardening (same date):** `handleBlueprintAnalyze`
   wraps path execution in try/catch — any unexpected throw calls `markAnalysisFailed()` then
   rethrows (pg-boss retry/DLQ preserved); an analysis can no longer hang in `processing`.
   **T-55 soft gate** enforced in `injectPermitInspectionMilestones()`: Starter skips injection and
   records `import_metadata.tier_note` when an active permit exists. Tests:
   `api/src/test/blueprint-{routes,worker}.test.ts`.
5. When PDF analysis is fully implemented: PDF page images stored in `/{tenant_id}/live/blueprints/{analysis_id}/sheets/` (A-06)
6. **Permit milestone injection** (Session 27; plumbing added T-59): if the project has an active permit, `injectPermitInspectionMilestones()` appends that trade's AHJ inspection milestone tasks to `blueprint_proposed_tasks` with `phase='inspections'` and `sort_order=1000+N`. Fires in both template and AI paths, per trade present in the trades list. Permits matched by the `permit_type` column (NOT `trade_type` — that's an inspections column). **The inspection sequence is resolved through the jurisdiction engine** (`resolveJurisdiction()`, see [[jurisdiction_engine]]) using each active permit's stored geo snapshot (`state_code`/`county_fips`/`county_name`/`city_name`), so AHJ-added/removed steps (e.g. a city's extra erosion-control inspection) flow into blueprint tasks identically to the permit's own milestones — not the raw national-default `getXInspectionSequence()` libs (Phase 3, 2026-06-17).

7. **Dependency generation on import** (Session 33): after `/import` writes `schedule_tasks`, the deterministic rule engine (`api/src/lib/task-dependencies/rules.ts`) generates prerequisite edges into `task_dependencies` and backfills `schedule_tasks.predecessor_task_id`. Engine keys on the same `phase`/`trade_type`/`csi_division`/`sort_order` the proposed tasks carry — so the better the phase/trade metadata, the richer the graph. Idempotent: re-import soft-deletes prior `origin='rule_engine'` edges, preserves `manual`. Visualized at `web .../projects/[id]/overview`. See `api/CLAUDE.md` §Schedule dependencies.
8. **Task-title i18n is v1.0-deferred**: template task titles + trade names are English-only data. The Overview/review UIs translate their chrome (EN+ES) but render task titles as stored. Translating task titles = v1.1 (translate the template libs or render-time; safety-flagged strings need human translation per the i18n skill).

9b. **Project name from build address** (Session 34): title block also mines **street address** + **lot number** (`TitleBlockInfo.street_address`/`lot_number`). `composeProjectName()` (`blueprint-pdf/project-name.ts`) → `"Lot 25 - 437 Maple St, Madison"` (lot+street+city, partial fallback, all-null→null) → `import_metadata.location_suggestion.suggested_project_name`. Review UI shows a checkbox-gated editable rename field; `POST /v1/blueprints/:id/import` takes optional `project_name` → renames project (`version+1`, audit `project.renamed`), PM-confirmed, **never auto-overwrite**. Fixes same-named projects (Example Builders's lots). Backfill existing: `api/src/scripts/backfill-project-names.ts` (`npm run backfill:project-names` dry-run → `-- --apply`) re-extracts each project's latest blueprint doc via `titleBlockFromPdf()`.

9. **Title-block extraction → processing hints** (`api/src/lib/blueprint-pdf/title-block.ts`): `extractTitleBlock()` mines the legend for drafter/architect firm, builder/owner, build location (city/state/zip + street/lot), phone, email. Per-sheet noisy → `voteTitleBlock()` picks the cross-sheet frequency winner per field (title block repeats every sheet; junk doesn't). `parse-sheets.ts` prefers the hi-DPI `title_block_text` crop, `mergeTitleBlock()` falls back to full-page text. Used two ways: (a) **`BUILDER_PROFILES` + `resolveBuilderProfile()`** — recognized firm (Example Drafting / Example Properties → Dane County WI residential) attaches a processing hint (`region_state`, **authoritative `region_county_fips`**, `building_type_hint`, `code_family`); **hint only, never overrides user input**. (b) **`location_suggestion`** in `import_metadata` — `buildLocationSuggestion()` (blueprint-worker) resolves the OCR'd location through the jurisdiction engine for permit-milestone defaults. **Advisory — never overwrites the project record.** County comes from the builder profile FIRST (OCR zip unreliable); `repairOcrZip()` (jurisdictions lib) snaps confusable-digit misreads (`53521`→`53527`) to a seeded ZIP in the matched jurisdiction. `import_metadata` carries `title_block`, `builder_profile`, `location_suggestion` (with `zip`/`zip_ocr`/`zip_corrected`/`county_source`).

## Analysis status lifecycle
```
pending → processing → review_ready → imported
                     ↘ failed
```

## Adding a new building type template

1. Create `api/src/lib/blueprint-templates/{type}.ts` exporting `const {type}Tasks: TemplateTask[]`
2. Import and add to `TEMPLATES` in `api/src/lib/blueprint-templates/index.ts`
3. Add to `BuildingType` union in `types.ts`
4. Add to `BUILDING_TYPES` array in the hub UI page

## Wiring in real Claude Vision AI

Add a NEW analysis path in `handleBlueprintAnalyze` (`api/src/workers/blueprint-worker.ts`) that
renders each sheet to an image and calls Claude Vision (SDK sketch in
`docs/Blueprint_Intelligence_v1_0.md` §AI Analysis). Add `@anthropic-ai/sdk` to `api/package.json`
and set `ANTHROPIC_API_KEY`. (The legacy per-sheet stub jobs were removed 2026-07-11 — Phase 4.)

## Background job handlers (registered in stripe-worker.ts)

| Job type | Handler | File |
|----------|---------|------|
| `blueprint.analyze` | `handleBlueprintAnalyze` | `blueprint-worker.ts` |

> **`blueprint.analyze_sheet` + `blueprint.aggregate_tasks` were removed 2026-07-11 (Gap Remediation
> Phase 4)** — nothing enqueued them; the single `blueprint.analyze` handler runs the whole
> template/text/OCR pipeline itself. AI Vision stays a deliberate no-AI stub; wire a new path in
> `handleBlueprintAnalyze` when adding it.

## Template task shape

```typescript
interface TemplateTask {
  title: string;
  description?: string;
  trade_type: TradeType;    // 'electrical' | 'plumbing' | 'hvac' | ...
  phase: PhaseType;         // 'site_prep' | 'foundation' | 'framing' | ...
  csi_division: string;     // CSI MasterFormat code e.g. '26 27 26'
  estimated_duration_days: number;
  sort_order: number;
}
```

## API quick reference

```
GET  /v1/blueprints/templates/:building_type   — preview (no write)
POST /v1/blueprints/analyze                    — start analysis
GET  /v1/blueprints?project_id=                — analysis history (newest first, cursor)
GET  /v1/blueprints/:id                        — poll status
GET  /v1/blueprints/:id/tasks                  — list tasks (?trade_type=&phase=&review_status=)
PATCH /v1/blueprints/:id/tasks/:tid            — review a task
POST /v1/blueprints/:id/import                 — import accepted → schedule_tasks (idempotent)
DELETE /v1/blueprints/:id                      — soft-delete non-imported analysis (imported → 409)
```

The web review page (`web .../projects/[id]/blueprints/[analysisId]/review`) calls these
through the **`/api/v1/[...path]` catch-all proxy** (`web/src/app/api/v1/[...path]/route.ts`,
cookie `platform_token` → Bearer). Before that proxy existed every `/api/v1/blueprints/*`
fetch 404'd at the Next layer — if the review UI 404s, that proxy is missing.

**OCR progress (2026-07-02):** while `status='processing'`, the worker writes transient
`import_metadata.progress` (`{stage:'extracting'|'building_tasks'}` or
`{stage:'ocr', page, page_count}` — `ocrPdfToText(buffer, onProgress)` fires per page). The
review page's 3s poll renders "OCR sheet N of M" + a progress bar. The completion write replaces
`import_metadata` wholesale, so progress vanishes at `review_ready`. Progress writes are
try/catch-guarded (cosmetic — must never fail the pipeline) and gated `AND status='processing'`.

**Web UX (2026-07-02):** the hub has a **document picker** (`GET /v1/documents?project_id=`,
plans sorted first — replaced the raw-UUID paste field); the review page **follows the tasks
cursor** (>100 tasks no longer silently clip) and shows **Delete & start over** on a failed
analysis. Chrome is i18n'd under `projects.blueprints.*` (EN+ES; phase labels reuse
`overview.phase_labels`). Both pages are server-gated by `blueprints/layout.tsx`
(`RoleGate` allow owner/project_manager/foreman → redirect to the project page).

## Text-extraction parser coverage (`parse-sheets.ts` → `build-tasks.ts`)

`parseSheetText()` runs keyword/regex extractors → `SheetExtractedData` (schedules + flags);
`buildExtractionTasks()` turns the aggregate into augment tasks (`sort_order >= 2000`) merged
onto the building-type baseline (deduped by title). Detectors are **additive and
building-type-agnostic** — no `building_type` is threaded into the parser; each detector keys
on its own keywords, so residential vs commercial sets simply trip different ones.

- **Residential (CA SFR):** electrical panels (`NNNa PANEL`), `WINDOW/DOOR SCHEDULE` rows,
  room+ceiling callouts, fixture-symbol legend, flags Title-24/HERS/Solar-Ready/CalGreen/
  Wildfire/seismic. Fixture: `api/test/fixtures/sd-adu.pdf` (9-page ADU).
- **Commercial** (added 2026-06-18): flags `has_exit_signage` (`/EXIT SIGN/` → egress
  lighting task) and `has_accessibility` (ADA ramp / accessible route → CBC 11B task);
  `extractCommercialRooms()` (`<area> SF <NAME> <num>` → `RoomInfo.area_sf` → tenant build-out
  task). Fixture: `api/test/fixtures/cjpia-commercial.pdf` (10-page La Palma commercial slice).
- **Known limit:** pdfjs emits CAD-positioned text in stream order, **not** geometric order,
  so the `<area> SF <name>` room labels are often split across runs → `extractCommercialRooms`
  is **opportunistic** (`area_sf`-gated, never fires for residential) and is NOT asserted on
  the commercial fixture; the two commercial flags are the reliably-verified augments there.
- A commercial set therefore yields baseline + the exit/ADA augments (no residential schedule
  patterns match — expected). Add a trade/jurisdiction signal = new detector + new
  `buildExtractionTasks` branch; do not thread `building_type`.
