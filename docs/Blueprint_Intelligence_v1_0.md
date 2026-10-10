# Blueprint Intelligence — Feature Specification v1.0
**"The Operating System for Construction" — Pre-built Task Generation**

---

## Overview

Blueprint Intelligence automatically pre-builds every task required for a construction project — organized by **trade** and **construction phase** — so PMs never have to create schedule tasks manually. A complete project schedule can be generated in under 30 seconds.

Three modes (selected automatically in `POST /v1/blueprints/analyze` by whether `document_id` is supplied):
1. **Template mode** (`analysis_mode: 'template'`) — No `document_id`. User selects a building type and receives a full task list instantly, no blueprint upload required.
2. **PDF text-layer extraction** (`analysis_mode: 'text_extraction'`) — `document_id` references an uploaded vector/CAD PDF. The worker downloads the PDF, extracts the **text layer** (no AI, no `ANTHROPIC_API_KEY`, free + fast), parses per-sheet schedules/flags, and merges those augments onto the template baseline. **This is the default path when a PDF is uploaded today.** See "PDF Text-Layer Extraction" below.
3. **Local vision augmentation** (`import_metadata.vision`, 2026-07-13) — an optional, env-gated layer ON TOP of modes 2's text/OCR paths (not a separate mode): a locally-hosted vision LLM (Ollama + Qwen2.5-VL 7B on the host GPU — **zero API cost, no data egress**) reads selected sheet images for what regex can't (schedule tables on scans, flags, components, title-block fills). Parser output stays the trusted baseline; vision only ADDS. See "Vision Augmentation" below. (Cloud Claude Vision remains a possible future path — SDK sketch retained at the end of that section.)

**Fallback chain:** `text_extraction` degrades on: document missing/no `storage_path` (`source: template_fallback`), PDF parse error (`template_fallback`). A scanned PDF with no text layer (`is_vector=false`) is routed to the **OCR path** (`source: ocr_extraction`) — `blueprint-pdf/ocr.ts` rasterizes each page with `mupdf` and runs `tesseract.js` (both pure-WASM, **no system deps, no AI, no network** — `eng.traineddata` vendored at `api/assets/tessdata/`), synthesizing a text layer that feeds the same parse/build pipeline. Only if OCR yields too little usable text (e.g. a graphic-heavy rendering sheet) does it fall to `template_scanned_fallback`. The `import_metadata.source` field records which path actually ran: `text_extraction` | `ocr_extraction` | `template` | `template_fallback` | `template_scanned_fallback`.

**High-DPI OCR (accurate data):** the OCR path renders the full sheet at `OCR_PAGE_DPI` (default 300) via **adaptive tiling** (`ocrPageTiled` — clipped `mupdf` `DrawDevice` tiles capped at `OCR_TILE_MAX_PX` px/side, default 3000, 4% overlap, OCR each, concat; small sheet = 1 tile, large sheet auto-splits so no single giant bitmap). A **second pass** renders the bottom-right **title-block corner** at 450dpi / PSM-6 (`renderTitleBlockPng`, crop fractions `TB_FRAC_X/Y`) into `ExtractedPage.title_block_text`, so small legend glyphs read correctly (e.g. ZIP `53527` vs the full-page misread `53521`).

**Project name from build address** (Session 34): the title block also mines **street address** + **lot number** (`TitleBlockInfo.street_address`/`lot_number`, voted cross-sheet). `composeProjectName()` (`blueprint-pdf/project-name.ts`) builds `"Lot 25 - 437 Maple St, Madison"` (lot + street + city; partial fallback drops missing parts; all-null → null) onto `import_metadata.location_suggestion.suggested_project_name`. The review UI shows it as an editable, checkbox-gated "Rename project to match blueprint address" field; on import, `POST /v1/blueprints/:id/import` accepts optional `project_name` and renames the project (`version+1`, audit `project.renamed`) — PM-confirmed, advisory, never auto-overwrites. **Fixes same-named projects** (e.g. Example Builders's lots all named identically). Existing projects repaired by `api/src/scripts/backfill-project-names.ts` (`npm run backfill:project-names` dry-run → `-- --apply`): re-extracts the title block from each project's latest blueprint doc (old metadata predates street/lot) and renames where the suggestion differs.

**Title-block extraction → processing hints** (`blueprint-pdf/title-block.ts`): `extractTitleBlock()` mines drafter/architect firm, builder/owner, build location (city/state/zip + street/lot), phone, email; `voteTitleBlock()` picks the cross-sheet frequency winner per field; `mergeTitleBlock()` prefers the hi-DPI crop over full-page text. Drives (a) `BUILDER_PROFILES`/`resolveBuilderProfile()` — a recognized firm (Example Drafting / Example Properties → Dane County WI residential) attaches a **hint-only** profile (`region_state`, authoritative `region_county_fips`, `building_type_hint`, `code_family`) that never overrides user input; and (b) `location_suggestion` in `import_metadata` (`buildLocationSuggestion()` in `blueprint-worker.ts`) — resolves the location through the jurisdiction engine for permit-milestone defaults, **advisory, never overwrites the project**. County is taken from the builder profile first (OCR zip unreliable); `repairOcrZip()` (jurisdictions lib) snaps confusable-digit misreads (`53521`→`53527`) to a seeded ZIP in the matched jurisdiction. `import_metadata` carries `title_block`, `builder_profile`, `location_suggestion` (`zip`/`zip_ocr`/`zip_corrected`/`county_source`).

> OCR is noisy on dense drawings — reliable for sheet/discipline detection, **room labels** (`BEDROOM #2`, `2 CAR GARAGE`), and **component callouts** (trusses, TJI/LVL, footings, anchor bolts, R-values, vinyl siding), not clean schedule tables. The keyword/component detectors in `parse-sheets.ts` (bare rooms, `COMPONENT_PATTERNS`, WI `SPS` code refs) and the component→task branches in `build-tasks.ts` are tuned for OCR-grade text and are building-type-agnostic. Proven on real Madison WI builder scans (`api/test/fixtures/madison-lot25.pdf` etc. → 62 tasks incl. 15 extraction augments). The `pole_barn` (post-frame) building type was added for the same builder set.

---

## Building Types Supported

| Type | Phases | Approx. Tasks |
|------|--------|---------------|
| Residential — Single Family | 11 | ~47 |
| Residential — Multi-Family | 13 | ~52 |
| Commercial | 14 | ~58 |
| Industrial | 15 | ~60 |
| Pole Barn (Post-Frame) | 9 | ~30 |

---

## Standard Construction Phases (all building types)

| Phase Key | Label |
|-----------|-------|
| `site_prep` | Site Preparation |
| `foundation` | Foundation & Concrete |
| `framing` | Framing |
| `roofing` | Roofing |
| `rough_in` | Rough MEP |
| `inspections` | Inspections |
| `insulation` | Insulation |
| `drywall` | Drywall & Plaster |
| `finishes_interior` | Interior Finishes |
| `finishes_exterior` | Exterior Finishes |
| `sitework` | Site Work |
| `commissioning` | Commissioning & Closeout |
| `punch` | Punch List |

---

## Trade Types

Since the **blueprint trade reclassification** (T-64, Doc 21 Phase 6 — Session 48), template and
extraction tasks carry **canonical taxonomy trade keys** (`api/src/lib/trades/taxonomy.ts`), not
just the 13 legacy umbrellas. The `TradeType` union in `blueprint-templates/types.ts` is the
allowed subset (~70 keys — legacy 13 + taxonomy keys the templates/extractors emit; guard test
`blueprint-template-trades.test.ts` enforces union ⊆ taxonomy). Legacy umbrella keys remain for
core scopes (electrical/plumbing/hvac rough-in + trim, core concrete/framing/roofing, `general`
inspections/punch — these anchor permit-milestone injection). Finer keys (painting, cabinetry,
fire_sprinkler, structural_steel, excavation, landscaping, post_frame, …) drive per-trade
build-out recipes, vendor matching, and parallel DAG lanes. MEP inspection convergence and the
permit-injection trigger match by **permit family via `tradeToPermitTrade()`**.

All tasks include a **CSI MasterFormat division code** for integration with cost coding and specification references.

---

## User Flow

```
1. Navigate to Project → Blueprints tab
2. Select building type
3. (Optional) Paste document UUID of an uploaded blueprint PDF
4. Click "Generate Task List"
   ↓ background job runs (template path: instant, AI path: ~30s)
5. Review screen: accept / reject / edit individual tasks
6. Click "Import X Tasks to Schedule"
   ↓ accepted tasks → schedule_tasks table
   ↓ PM/Owner notified via in-app notification
7. Full project schedule is now populated
```

---

## API Endpoints

All endpoints require JWT auth and `/v1/` prefix.

| Method | Path | Role | Purpose |
|--------|------|------|---------|
| `GET` | `/v1/blueprints/templates/:building_type` | OWNER, PM | Preview template (no DB write) |
| `POST` | `/v1/blueprints/analyze` | OWNER, PM | Start analysis |
| `GET` | `/v1/blueprints?project_id=` | OWNER, PM, FOREMAN | List a project's analyses (history — newest first, cursor-paginated) |
| `GET` | `/v1/blueprints/:id` | OWNER, PM, FOREMAN | Poll status |
| `GET` | `/v1/blueprints/:id/tasks` | OWNER, PM, FOREMAN | List proposed tasks |
| `PATCH` | `/v1/blueprints/:id/tasks/:tid` | OWNER, PM | Review a task |
| `POST` | `/v1/blueprints/:id/import` | OWNER, PM | Import accepted tasks (idempotent — only tasks with `schedule_task_id IS NULL`) |
| `DELETE` | `/v1/blueprints/:id` | OWNER, PM | Soft-delete a non-imported analysis (failed-run cleanup / start over; imported → 409) |

### Analysis status lifecycle
`pending` → `processing` → `review_ready` → `imported` (or `failed`)

---

## Database Tables

### `blueprint_analyses`
Tracks each analysis job. `document_id` is NULL for template-only runs.
Status: `pending`, `processing`, `review_ready`, `imported`, `failed`.

### `blueprint_sheets`
One row per PDF page extracted. `discipline` inferred from sheet number prefix
(E=electrical, P=plumbing, M=mechanical, S=structural, A=architectural, C=civil).

### `blueprint_proposed_tasks`
Proposed tasks awaiting user review. `review_status`: `pending`, `accepted`, `rejected`, `modified`.
On import, `schedule_task_id` is populated to link back to the created `schedule_tasks` row.

All three tables: RLS enforced, tenant-scoped, standard indexes.

---

## Background Jobs

| Job Type | Trigger | Action |
|----------|---------|--------|
| `blueprint.analyze` | POST /blueprints/analyze (or file-scan auto-trigger) | Runs the whole pipeline synchronously in the handler: template-only OR text-layer/OCR extraction → parse → build tasks → permit-milestone injection → `review_ready` |

The single job carries `tenant_id` (T-10). Registered in `stripe-worker.ts` dispatcher.

> **Removed 2026-07-11 (Gap Remediation Phase 4):** the legacy per-sheet `blueprint.analyze_sheet`
> and `blueprint.aggregate_tasks` stub jobs. Nothing ever enqueued them — the live text/OCR path in
> `handleBlueprintAnalyze` does the whole run itself. Local vision augmentation (2026-07-13) also
> runs inside this single job — see "Vision Augmentation" below.

---

## PDF Text-Layer Extraction (Phase 1 — no AI cost)

When `POST /v1/blueprints/analyze` is called **with** a `document_id`, the worker runs the
text-layer path instead of the template-only path. No Vision API, no `ANTHROPIC_API_KEY`,
no per-page cost — it reads the PDF's embedded text layer (vector/CAD PDFs only).

### Pipeline (`blueprint-worker.ts` `handleBlueprintAnalyze`, text-extraction branch)
1. Load the `documents` row; if missing/no `storage_path` → template fallback.
2. `downloadLiveObject(storage_path)` → `extractPdfText(buffer)` (`blueprint-pdf/extract.ts`,
   lazy-loads `pdfjs-dist/legacy`). Returns `{ page_count, pages[], metadata{creator,title,is_vector} }`.
   Discipline inferred per page from sheet-number prefix (A/E/P/M/S/C/L/F/T).
3. **Scanned-PDF guard:** if `metadata.is_vector === false` (no text layer) → the OCR path;
   only if OCR yields too little text → template fallback (`source: template_scanned_fallback`).
4. `parseSheetText()` per page (`blueprint-pdf/parse-sheets.ts`) → typed schedules
   (windows, doors, rooms+area, electrical panels), fixture summaries, and flags
   (CA-centric: solar-ready, HERS, Title-24, CalGreen, wildfire zone, seismic category, ESS,
   propane/natural gas; **commercial:** `exit_signage`, `accessibility`).
5. `aggregateExtractions()` merges per-sheet parses (OR over flags, concat schedules).
6. `buildTasksFromExtraction(buildingType, agg)` (`blueprint-pdf/build-tasks.ts`) — starts from
   the building-type **template baseline** and augments with extraction-derived task detail.
7. Persist: one `blueprint_sheets` row per page (`status='analyzed'`, `analysis_result` JSON =
   `{text_layer_chars, content_discipline, flags}`; `storage_path` left empty — text path does
   not render page images), proposed tasks, then permit-milestone injection (same as template path).
8. `import_metadata` records `source: 'text_extraction'`, `pdf_metadata`, `sheet_count`, and
   extraction counts (`panels_extracted`, `windows_extracted`, `doors_extracted`,
   `rooms_extracted`, `fixture_types`, `flags`, `callouts`).

### Status
Phase 1 is **live and exercised end-to-end** — the seeded e2e project
*"CJPIA Commercial — Blueprint E2E Test"* (Apex Construction tenant) ran a real 10-page
vector commercial PDF (`cjpia-commercial.pdf`, CJPIA La Palma set) through upload → analyze →
import, producing 60 proposed tasks with `source: text_extraction`, disciplines
`architectural`/`civil`, and commercial flags `exit_signage` + `accessibility`.
Test coverage: `api/src/test/blueprint-pdf.test.ts` (ADU residential fixture) and
`api/src/test/blueprint-pdf-commercial.test.ts` (CJPIA commercial fixture).

> Pattern coverage note: `parse-sheets.ts` regexes were built against the San Diego County
> PDS-670 ADU template and extended for the CJPIA commercial set — they will need extension
> as new AHJ sheet formats are encountered.

---

## Vision Augmentation (local Ollama — BUILT 2026-07-13)

An env-gated augmentation layer over BOTH extraction paths (vector text-layer AND scanned OCR).
A locally-hosted vision LLM reads selected sheet images and its output is merged INTO the
per-sheet parser results before `aggregateExtractions()` — the downstream aggregate/build
pipeline is unchanged. Zero API cost: Ollama runs on the host GPU; the PNG never leaves the box.

**Trust model:** the deterministic parser is the baseline; vision only ADDS (flags OR'd,
schedule rows union-deduped by mark with **parser winning collisions**, title-block fields
filled only where the parser left null). Model output is constrained to the pipeline's fixed
enum vocabularies (`FIXTURE_TOKENS`/`COMPONENT_TOKENS` — prompt and zod validator are built
from the same exported consts, so they cannot drift); unknown tokens are stripped. Any failure
(server down, timeout, malformed JSON) degrades to parser-only — an analysis can never fail or
hang because of vision. Everything still lands in the human review UI before import.

**Where:** `api/src/lib/blueprint-pdf/vision.ts` (Ollama client + zod validation + page render),
`merge-vision.ts` (pure parser-wins merge + `selectVisionPages` prioritization),
`runVisionAugmentation()` in `blueprint-worker.ts` (health probe once per job, per-sheet
skip-and-continue, soft total budget capped by job-expiry headroom, partial results kept).

**Page selection** (slow GPU — can't afford every sheet): score = discipline weight
(arch/elec/plumb/struct 3, mech 2, other 1) + low-parser-yield bonus +2 + first-page bonus +1;
top `VISION_MAX_PAGES` analyzed in page order.

**Provenance:** `import_metadata.source` is UNCHANGED (`text_extraction`/`ocr_extraction`);
`import_metadata.vision = { augmented, model, pages_selected, pages_analyzed, pages_failed,
duration_ms, added: {flags_set, components_added, fixtures_added, *_rows_added,
title_block_fields_filled} }` — absent entirely when the gate is off. Each `blueprint_sheets`
row's `analysis_result` gains `vision: boolean`. Review UI shows a violet "Vision-assisted"
chip + a `{stage:'vision', page, page_count}` progress bar while processing.

### Env vars

| Var | Default | Purpose |
|-----|---------|---------|
| `BLUEPRINT_VISION_ENABLED` | unset (off) | Master gate — `1`/`true` enables |
| `OLLAMA_BASE_URL` | `http://127.0.0.1:11434` | Compose overrides to `http://host.docker.internal:11434` |
| `OLLAMA_VISION_MODEL` | `qwen2.5vl:7b` | ~6GB Q4 — fits an 8GB card |
| `VISION_PAGE_TIMEOUT_MS` | `240000` | Per-sheet abort (older GPU: 1–3+ min/sheet) |
| `VISION_MAX_PAGES` | `12` | Page-selection cap |
| `VISION_TOTAL_BUDGET_MS` | `1500000` (25 min) | Soft budget — stop, keep partials; also capped by job-expiry headroom |
| `VISION_MAX_PX` | `1408` | Longest-side render px (drop to 1024 if the host CPU-offloads) |
| `OLLAMA_KEEP_ALIVE` | `10m` | Model stays warm between sheets |

### Host setup (runbook)

1. Install Ollama. Root/systemd: `curl -fsSL https://ollama.com/install.sh | sh`. User-space
   (as deployed 2026-07-13): download `ollama-linux-amd64.tar.zst` from GitHub releases into
   `~/.local/ollama/`, run `OLLAMA_HOST=0.0.0.0:11434 OLLAMA_KEEP_ALIVE=10m OLLAMA_MAX_LOADED_MODELS=1
   OLLAMA_NUM_PARALLEL=1 ~/.local/ollama/bin/ollama serve`.
2. `ollama pull qwen2.5vl:7b` (~6GB).
3. Bind so containers reach it (`OLLAMA_HOST=0.0.0.0:11434`) — firewall 11434 off WAN/LAN if exposed.
4. GPU check: `nvidia-smi` / `ollama ps` during a generation. ⚠️ NVIDIA driver < 550 → Ollama's
   CUDA runtime won't load and it falls back to the **Vulkan** backend — still GPU-accelerated,
   just slower (this host: driver 535 + GTX 1070 → Vulkan). Upgrading the driver enables CUDA.
5. Smoke: `npx tsx --require dotenv/config src/scripts/smoke-vision.ts test/fixtures/madison-lot25.pdf 1`
   (bypasses the env gate; renders + calls the real server, prints validated JSON + timing).
6. Container reachability: `docker compose exec api node -e "fetch('http://host.docker.internal:11434/api/tags').then(r=>r.json()).then(console.log)"`.
7. Enable: `BLUEPRINT_VISION_ENABLED=1` in `.env` → `docker compose up -d api`.
8. Durable server: install `scripts/ollama.service` as a `--user` unit so Ollama survives reboot
   (`cp scripts/ollama.service ~/.config/systemd/user/ && systemctl --user daemon-reload &&
   systemctl --user enable --now ollama`; needs `loginctl enable-linger $USER`). Replaces the
   hand-started `ollama serve` that died on reboot.

**Budget note:** the `blueprint.analyze` queue expires jobs at 3600s (`lib/queue.ts`); OCR and
vision share that window. Raising `VISION_MAX_PAGES` may require raising `expireInSeconds`.

Tests: `api/src/test/blueprint-vision.test.ts` (21 unit — validation/merge/selection, mocked
fetch) + `blueprint-vision-worker.test.ts` (4 integration over the sd-adu fixture — gate off,
unreachable, merged success, all-fail).

### Measured accuracy — prove-out (2026-07-21)

Harness `api/src/scripts/eval-extraction.ts` runs the real pipeline parser-only vs +vision over
all 5 fixtures and reports the per-field-group delta + per-sheet latency (precision/recall/F1
too, when a `test/fixtures/golden/<name>.json` exists — none authored yet):

```
npx tsx --require dotenv/config src/scripts/eval-extraction.ts            # gate + Ollama drive it
npx tsx --require dotenv/config src/scripts/eval-extraction.ts --no-vision  # parser-only baseline
```

First run (Ollama `qwen2.5vl:7b`, Vulkan, ~27–37s/sheet, 26/27 sheets OK, 1 graceful skip):

- **Recall ↑↑ on scanned/OCR plans** — where the regex parser gets ~nothing because schedules
  live inside the image: cjpia windows **0→20**, doors **0→24**, fixtures **0→9**; madison
  fixtures **0→8**; polebarn components **0→21**, rooms **0→6**, title-block fields filled.
- **Precision ↓ (over-eager)** — `has_seismic_design` wrongly set true on all 3 WI plans; a
  post-frame pole barn got stick-frame components (`i_joists`/`lvl_beam`); junk rooms
  (`VALENTINE CEILING`). Contained by enum-strip + parser-wins + **mandatory human review**.

**Decision:** keep the off-the-shelf model; do **NOT** train a custom one. Off-the-shelf Qwen
already recovers what the parser misses; the residual issue is *precision/hallucination* (false
flags/components) — a **prompt + validator** fix (hours), not a model-capability gap (months of
training). Custom training would also need a labeled corpus + a data flywheel that don't exist
(only 5 blueprints; extraction JSON isn't persisted; review corrects tasks, not extraction).

**Precision pass (shipped 2026-07-21).** Acting on the measurement: **the parser now owns flags**
— vision no longer contributes any flag (`mergeSheetExtraction` drops them; `toVisionSheetData`
returns `flags: {}`), because every vision-set flag in the run was false and a wrong flag injects
bad downstream tasks. A conservative **room stoplist** (`vision.ts` `isRealRoom`) drops
drawing-element / orientation "rooms" (CEILING/ELEVATION/ENDWALL/SIDEWALL/FRONT/…), and the prompt
no longer asks for flags + instructs "do not infer a framing system." Re-verified on
madison-lot437 + polebarn: `has_seismic_design` false-positive eliminated (flags 0→0), junk rooms
gone, component/fixture/real-room recall preserved.

**Building-type steering (shipped 2026-07-21).** The one remaining miss — post-frame/pole-barn
plans returning stick-frame components (`i_joists`/`lvl_beam`/`trusses`) — is now fixed by feeding
the model the `building_type` the worker already has (threaded `runVisionAugmentation` →
`analyzeSheetPng`; `promptFor(buildingType)` + `INCOMPATIBLE_COMPONENTS` gate in `vision.ts`; the
eval harness maps each fixture to its type). A POSITIVE per-type cue ("post-frame: expect
posts/girts/purlins/metal; NO trusses/I-joists/LVL") plus a deterministic strip of the clearly
incompatible engineered-lumber tokens. Re-verified on polebarn: components `0→5` now return the
**correct** post-frame set (`post_frame_columns, wall_girts, roof_purlins, metal_roofing,
metal_siding`) — every stick-frame token gone. The positive prompt did the heavy lifting (the model
followed it, unlike the earlier generic negative); the gate is the backstop. Adding steering for a
new type = one `BUILDING_TYPE_HINT` / `INCOMPATIBLE_COMPONENTS` entry, no training.

### Future: cloud Claude Vision (not built)

A higher-accuracy paid path would slot in the same seam. SDK sketch:

```typescript
import Anthropic from '@anthropic-ai/sdk';
const client = new Anthropic();
const response = await client.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 2048,
  messages: [{
    role: 'user',
    content: [
      { type: 'image', source: { type: 'url', url: presignedPageUrl } },
      { type: 'text', text: BLUEPRINT_ANALYSIS_PROMPT },
    ],
  }],
});
return JSON.parse(response.content[0].text) as SheetAnalysisResult;
```

Expected AI response shape:
```json
{
  "sheet_number": "E1.0",
  "discipline": "electrical",
  "tasks": [
    {
      "title": "Install 200A Main Panel",
      "description": "Per electrical schedule sheet E0.1",
      "trade_type": "electrical",
      "phase": "rough_in",
      "csi_division": "26 24 16",
      "estimated_duration_days": 2
    }
  ]
}
```

---

## Permit Integration (Session 27 — electrical; trade-neutral since T-59)

When a project has an **active permit**, Blueprint Intelligence automatically injects that trade's
AHJ inspection milestone tasks into proposed tasks — on the template, text-extraction, and OCR paths.
All four permit trades participate via the `PERMIT_TRADES` map in `blueprint-worker.ts`
(`matchTrades[]` blueprint disciplines → `permitType` → `taskTrade`):

| Blueprint disciplines matched | Permit type | Task trade | Code libs |
|-------------------------------|-------------|-----------|-----------|
| electrical | `electrical` | electrical | `electrical-codes/` (NEC) |
| plumbing | `plumbing` | plumbing | `plumbing-codes/` (IPC/UPC) |
| hvac | `mechanical` | hvac | `mechanical-codes/` (IMC/UMC) |
| roofing, concrete, framing, structural, general | `building` (injected once) | general | `building-codes/` (IRC/IBC) |

### Trigger conditions
Both must be true per trade:
1. A matched trade is in the analysis's `trades_found` list
2. The project has at least one permit of that `permit_type` with `status = 'active'`

### Injected milestones

`injectPermitInspectionMilestones()` in `blueprint-worker.ts` resolves the inspection sequence
**through the jurisdiction engine** using the permit's stored geo snapshot (so AHJ-added/removed
steps flow in), then appends one proposed task per inspection step with `phase = 'inspections'`
and `sort_order = 1000 + sequence_order` — milestones group after trade tasks in the review UI.
(Electrical example: Temporary Power → Rough-In → Service → Cover → Final, sort 1001–1005.)

### Tier behavior (T-55)
- **Starter:** Milestones NOT injected (soft gate — enforced in the worker via `assertTier`).
  When the project has an active permit, `import_metadata.tier_note` records
  "Upgrade to Professional to auto-generate AHJ inspection milestones…" and the review UI
  shows it in the amber banner. Tested in `blueprint-worker.test.ts`.
- **Professional+:** Milestones injected automatically on all paths.

### Import behavior
On import, injected milestones become `schedule_tasks` with the mapped task trade
and `phase = 'inspections'`. The `schedule_task_id` on the `blueprint_proposed_tasks` row is
populated to link back to the created task; re-import only picks up accepted tasks whose
`schedule_task_id` is still NULL (idempotent).

---

## File Locations

| File | Purpose |
|------|---------|
| `prisma/migrations/0008_blueprint_intelligence/migration.sql` | DB schema |
| `api/src/lib/blueprint-templates/` | Building type task templates |
| `api/src/lib/blueprint-pdf/extract.ts` | PDF text-layer extraction (pdfjs-dist legacy) — Phase 1; `ExtractedPage.title_block_text` |
| `api/src/lib/blueprint-pdf/ocr.ts` | Scanned-PDF OCR (mupdf + tesseract.js); `ocrPageTiled` hi-DPI tiling + `renderTitleBlockPng` title-block pass |
| `api/src/lib/blueprint-pdf/title-block.ts` | Title-block mining: `extractTitleBlock`/`voteTitleBlock`/`mergeTitleBlock`, `BUILDER_PROFILES`/`resolveBuilderProfile`; street/lot extraction |
| `api/src/lib/blueprint-pdf/project-name.ts` | `composeProjectName()` — lot + street + city → project name (partial fallback) |
| `api/src/lib/blueprint-pdf/title-block-from-pdf.ts` | `titleBlockFromPdf(buffer)` — voted title block from a PDF (used by backfill) |
| `api/src/scripts/backfill-project-names.ts` | Backfill existing projects' names from blueprint address (dry-run / `--apply`) |
| `api/src/test/project-name.test.ts` | `composeProjectName` + street/lot extraction tests |
| `api/src/lib/blueprint-pdf/parse-sheets.ts` | Per-sheet schedule/flag/title-block parsing from extracted text; exports `COMPONENT_TOKENS`/`FIXTURE_TOKENS` vocabularies |
| `api/src/lib/blueprint-pdf/vision.ts` | Local Ollama vision client — env-gated, zod strip-don't-reject, enum-constrained prompt |
| `api/src/lib/blueprint-pdf/merge-vision.ts` | Parser-wins merge + provenance stats + `selectVisionPages` prioritization |
| `api/src/scripts/smoke-vision.ts` | Manual vision smoke against the real Ollama server |
| `api/src/test/blueprint-vision.test.ts` · `blueprint-vision-worker.test.ts` | Vision unit (21) + worker integration (4) tests |
| `api/src/lib/blueprint-pdf/build-tasks.ts` | Merge template baseline with PDF extraction → tasks; voted `title_block` on aggregate |
| `api/src/lib/jurisdictions/zip-county.ts` | ZIP→county + `repairOcrZip()` confusable-digit ZIP repair |
| `api/src/test/blueprint-pdf.test.ts` | Text-extraction test (San Diego ADU residential fixture) |
| `api/src/test/blueprint-pdf-commercial.test.ts` | Text-extraction test (CJPIA commercial fixture) |
| `api/src/test/blueprint-ocr.test.ts` | OCR path + title-block (`53527`) + ZIP-repair tests (private Madison WI fixtures, not included) |
| `api/test/fixtures/sd-adu.pdf` | Public County of San Diego standard ADU plans (vector/CAD). `cjpia-commercial.pdf` is not in the public repo; its tests skip. |
| `api/test/fixtures/madison-*.pdf` | Real scanned Madison WI fixtures (private, not in the public repo) — OCR path |
| `api/src/lib/{electrical,plumbing,mechanical,building}-codes/` | Per-trade code libraries (permit injection — NEC / IPC-UPC / IMC-UMC / IRC-IBC) |
| `api/src/routes/v1/blueprints.ts` | API endpoints (incl. `DELETE /:id`) |
| `api/src/routes/v1/permits.ts` | Permit CRUD (feeds permit injection) |
| `api/src/workers/blueprint-worker.ts` | Background job handlers + `injectPermitInspectionMilestones()` (T-55 soft gate; top-level failure → `markAnalysisFailed`) |
| `api/src/test/blueprint-routes.test.ts` | Route-chain integration tests (analyze → review → import, pagination, delete, role gates) |
| `api/src/test/blueprint-worker.test.ts` | Worker hardening tests (failed-status on throw; T-55 tier gate) |
| `web/src/app/(dashboard)/projects/[id]/blueprints/page.tsx` | Blueprint hub UI (document picker; i18n `projects.blueprints.*` EN+ES) |
| `web/src/app/(dashboard)/projects/[id]/blueprints/[analysisId]/review/page.tsx` | Task review UI (cursor-follow fetch, delete/start-over on failed; i18n) |
| `web/src/app/(dashboard)/projects/[id]/blueprints/layout.tsx` | Server `RoleGate` (owner/PM/foreman) |
| `api/src/lib/task-dependencies/{types,rules}.ts` | Prerequisite rule engine (runs on import) |
| `api/src/routes/v1/task-dependencies.ts` | Dependency edge CRUD (`/v1/task-dependencies`) |
| `web/src/app/(dashboard)/projects/[id]/overview/page.tsx` | Project Overview dependency DAG (reactflow) |

---

## Task dependency generation (Session 33; migration 0018)

On import, accepted tasks become `schedule_tasks`, then a **deterministic rule engine**
(`api/src/lib/task-dependencies/rules.ts`) generates prerequisite edges into the
`task_dependencies` table — keyed on the same `phase`/`trade_type`/`csi_division`/`sort_order`
the proposed tasks carry. Edges are acyclic by construction (forward in PHASE_ORDER × sort_order).
The engine also backfills `schedule_tasks.predecessor_task_id` (primary predecessor) for the Gantt.
Edges drive the **Project Overview DAG** (`/projects/[id]/overview`). Richer phase/trade metadata
on the proposed tasks → a richer graph. Full detail: `api/CLAUDE.md` §Schedule dependencies.

---

## Gap Remediation (Phases 1–4 — 2026-07-11)

Full tracker: `docs/Blueprint_Gap_Remediation_Plan_v1_0.md`. Migrations 0025–0027. Branch
`feat/blueprint-gap-hardening`. Summary of what changed vs the original build:

- **Phase 1 (P0):** upload→analyze on-ramp unified onto the **`files`** table (the picker + analyze
  + worker read a scan-passed `files` row — the orphaned `documents` path is gone). Import now carries
  `estimated_duration_days` → `planned_end` (no more zero-length Gantt tasks). Concurrency guards:
  import takes `SELECT … FOR UPDATE` + status gate (drops `'imported'`); worker claims the job via
  `UPDATE … status='processing' WHERE status='pending' RETURNING id`. Migration 0025 adds UNIQUE
  `blueprint_sheets (analysis_id, page_number)` + a proposed-task dedup unique. Augment↔baseline
  **supersede** dedup (`COMPONENT_SUPERSEDES`) stops duplicate truss/footing/siding/insulation scope.
- **Phase 2 (P1):** analyze validates the doc belongs to the project + is scan-`ready`; migration 0026
  adds `WITH CHECK` to blueprint-table RLS; steps take building_type from **the importing analysis**;
  task-review PATCH + worker status transitions are audited; `components` + panel amperage persist into
  `import_metadata` and `facts.ts` reads them directly; page cap + per-page OCR timeout + oversize 422
  + `import_metadata.failure` reason rendered on review.
- **Phase 3 (P2):** review page locks when `imported`; task title/description edit + bulk accept/reject;
  extraction summary rendered; post-import `?imported=` toast + owner/PM notification; re-analyze from
  history; Files page i18n EN+ES; `GET /:id/tasks` joins parent-analysis liveness.
- **Phase 4 (P3):** CA code wording (Title-24/CalGreen) region-gated on project state (or a real CA
  flag) — a WI plan no longer gets Title-24 tasks. Tightened over-broad component regexes
  (`FOOTING`/`SLAB` need structural context; `egress_window` no longer fires on "EGRESS LIGHTING").
  Routing heuristics: dotted sheet numbers (`A.1`), multi-letter discipline rules (`FA`→electrical,
  `FP/FS`→plumbing, `G`→general, `SP`→civil, `CS`→specs); named `IS_VECTOR_TEXT_RATIO` (0.6) +
  `OCR_MIN_YIELD_CHARS` (200) + per-page text stats (`pages_with_text`/`text_ratio`) in metadata.
  Dead-code cleanup: removed `disciplines_present`, `PanelInfo.location`, `RoomInfo.ceiling_height`,
  the unreachable `analyze_sheet`/`aggregate_tasks` stub jobs; fixed all 5 stale template header
  counts; consolidated building-type to a single `BUILDING_TYPES` const. Migration 0027 adds
  composite indexes on `blueprint_proposed_tasks`. Mobile blueprint surface remains **absent** —
  tracked in `Mobile_Enterprise_Plan_v1_0.md` backlog.

---

## v1.0 vs Future Phases

| Capability | v1.0 |
|-----------|------|
| Template-based task generation | ✅ |
| Task review UI | ✅ |
| Import to schedule_tasks | ✅ |
| Task dependency generation on import | ✅ (rule engine — Session 33) |
| Project Overview dependency DAG | ✅ (reactflow — Session 33) |
| PDF text-layer extraction (vector PDFs, no AI) | ✅ (Phase 1 — live; merges onto template baseline) |
| ↳ Residential (CA SFR) extractors — panels, window/door schedules, rooms, Title-24/HERS/Solar/Wildfire | ✅ (fixture `api/test/fixtures/sd-adu.pdf`) |
| ↳ Commercial extractors — exit-signage/egress, ADA accessibility, room+area build-out | ✅ 2026-06-18 (fixture `api/test/fixtures/cjpia-commercial.pdf`) |
| Scanned-PDF / fallback handling | ✅ (degrades to template baseline with `source` note) |
| Local vision augmentation (Ollama, env-gated, $0) | ✅ 2026-07-13 (qwen2.5vl:7b on host GPU; parser-wins merge; see "Vision Augmentation") |
| Real Claude Vision analysis (cloud, paid) | Not built — SDK sketch retained; would slot in the same seam |
| PDF page rendering to PNG | ✅ (`renderRegionPng`/`renderPageForVision` — used by OCR tiling + vision) |
| Trade-module auto-population (panels, fixtures) | v1.1 |
| i18n (ES) for task titles | v1.1 (chrome is EN+ES; task titles render as stored DB data) |

> **Extractor design:** detectors in `parse-sheets.ts`→`build-tasks.ts` are additive and
> building-type-agnostic (no `building_type` threaded in) — residential vs commercial sets
> trip different keyword detectors; augment tasks get `sort_order >= 2000` merged onto the
> baseline. **pdfjs caveat:** CAD text is emitted in stream order, not geometric order, so
> positioned labels like a `<area> SF <name>` room schedule can be split across runs — the
> commercial room extractor is opportunistic/`area_sf`-gated; the exit-signage + accessibility
> flags are the reliably-verified commercial augments.
