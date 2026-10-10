# Task Detail, Codes Integration & Build-Out Engine Skill
**Feature added: Session 41 (2026-06-24)**
**Builds on: blueprint-intelligence (task generation), jurisdictions (codes engine), file-upload-security (photos)**
**Schema: `docs/Schema_Reference.md` §Domain 9b (`schedule_tasks` cols, `schedule_task_photos`, `task_steps`)**

## What this feature does

Turns a bare schedule task into a full work surface for the whole org:
- **Rich task detail/editor** — `GET /v1/schedule-tasks/:id/detail` aggregates the task + resolved
  codes + live AHJ inspection status + dependencies + QA photos + **work steps**. Editable: status,
  %, description, assignee, planned/actual dates, trade/phase (web slide-over + full page; mobile).
- **Codes integration, task-scoped** — codes resolved live for the project's jurisdiction; the
  Codes & Compliance panel shows ONLY the inspection(s) + code sections THIS task's steps gate
  (not the whole trade sequence).
- **Task Build-Out Engine** — deterministic per-trade engine expands each task into ordered
  **work steps** (instruction + code refs + gating inspection + tools/materials/safety + QA check)
  for the laborer, referencing the blueprint analysis + codes engine. No AI.
- **QA/proof photos** — field roles capture+upload (mobile online-only / web), reviewer (OWNER/PM)
  views; reuses the `/v1/files/upload` quarantine→scan→live pipeline.

## Key invariants

1. **`schedule_tasks` carries native `trade_type`/`phase`/`csi_division`** (migration 0021; backfilled
   from `blueprint_proposed_tasks`, stamped on blueprint import, settable on manual tasks). Detail
   `COALESCE`s native ← blueprint snapshot for pre-0021 rows.
2. **Trade→permit-trade is one source of truth**: `api/src/lib/jurisdictions/trade-map.ts`
   `tradeToPermitTrade()` (electrical→electrical, plumbing→plumbing, hvac→mechanical, everything
   else→building). Mirrors `PERMIT_TRADES` in blueprint-worker — keep in sync.
3. **Engine is pure/deterministic** (`api/src/lib/task-buildout/`, mirrors task-dependencies/rules.ts
   + jurisdictions). `buildTaskSteps(ctx)` dispatches by permit trade; drops any
   `gating_inspection_type` not present in the resolved (AHJ-merged) inspection sequence; returns `[]`
   for no-trade tasks.
4. **`task_steps` regenerated as a SET** (migration 0022): rebuild soft-deletes prior
   `source='rule_engine'` rows, preserves `source='manual'`. No `version`.
5. **Compliance scoping**: detail's `codes.compliance` is filtered to the `inspection_type`s the task's
   steps gate (`codes.task_scoped=true`); falls back to the full sequence only when the task has no
   steps yet. `codes.task_code_refs` = union of step code refs.
6. **Photos**: `schedule_task_photos.storage_path` is the LIVE path of an already scan-passed `files`
   row; the attach endpoint 409s `FILE_NOT_READY` until the scan worker promotes it.
7. **Roles**: detail + steps readable by ALL authed org users (laborers). Edit task + build/rebuild
   steps = OWNER/PM. Upload photo = OWNER/PM/FOREMAN/FIELD_TECH/SAFETY_OFFICER; delete = OWNER/PM or uploader.
8. **i18n**: chrome EN+ES; step CONTENT + task titles are English data (ES = v1.1, like blueprint task titles).
9. **Equipment (migration 0043)**: each `WorkStep`/`task_steps` row carries `equipment: [{type, category,
   reason, optional?}]` — heavy equipment/power tools to work efficiently. Deterministic
   (`equipment-rules.ts` `equipmentFor(permitTrade, ctx, stepTitle)`), attached centrally in `index.ts`
   (one point, no per-recipe edits), keyed on trade/phase/title/facts + **scale** (`buildingType`
   commercial/mf/industrial ⇒ larger machines). `type` is CANONICAL — one vocab (`equipment-vocab.ts`)
   shared 3 ways: `task_steps.equipment[].type` = `company_assets.asset_type` (EAM join) = `EQUIP-{TYPE}`
   estimating catalog code. `GET /:id/detail` returns per-step `equipment` + a `task_equipment` union;
   **Business+** tenants also get `owned_count`/`available_count`/`asset_ids` from the fleet (assertTier
   in a try/catch → recommend-only on lower tiers). Estimating cost path: `POST /estimates/:id/generate
   {include_equipment:true}` (see estimating skill).

## API quick reference

```
GET    /v1/schedule-tasks/:id/detail                       — task + codes(scoped) + steps + deps + photos (any authed)
POST   /v1/schedule-tasks/:id/build-steps                  — (re)build one task's steps        (OWNER/PM)
POST   /v1/schedule-tasks/project/:projectId/build-steps   — rebuild all project tasks (backfill) (OWNER/PM)
POST   /v1/schedule-tasks/:id/photos                       — attach a scan-passed file as QA photo (field roles)
GET    /v1/schedule-tasks/:id/photos                       — list (presigned download_url)     (any authed)
DELETE /v1/schedule-tasks/:id/photos/:photoId              — soft delete (OWNER/PM or uploader)
# blueprint /import also builds steps for accepted tasks → returns step_count
```

## Engine structure (`api/src/lib/task-buildout/`)

| File | Role |
|------|------|
| `types.ts` | `WorkStep`, `BuildContext`, `BlueprintFacts`, `CodeRef`, `EMPTY_FACTS` |
| `index.ts` | `buildTaskSteps(ctx)` dispatcher + gating-validity guard + step renumber |
| `code-refs.ts` | `codeRefsFor(trade, inspection_type, codeType)` — per-(trade,inspection) section map |
| `facts.ts` | `buildBlueprintFacts(analysisId, client)` — import_metadata flags/fixtures + title scan for components/amperage |
| `electrical.ts` `plumbing.ts` `mechanical.ts` `building.ts` | per-trade recipes keyed by phase (+ title/components); building branches roofing/concrete/framing/structural |

`api/src/services/task-steps.ts` `buildStepsForProjectTasks()` — resolves jurisdiction once + facts,
builds + persists (replacing prior rule_engine steps). Used by import + both build-steps endpoints +
the backfill script.

## Adding / extending a trade recipe

1. Edit the trade module (`electrical.ts` etc.) — add/adjust a phase branch returning `WorkStep[]`.
   Set `gating_inspection_type` to a real `inspection_type` from that trade's
   `*-codes/inspection-sequences.ts` (engine drops invalid ones).
2. Add code sections in `code-refs.ts` under that trade + inspection_type.
3. Parameterize with `ctx.facts` (panel amperage, fixture counts, components, flags) — fall back to
   generic wording when facts absent (manual tasks).
4. Unit-test in `api/src/test/task-buildout.test.ts` (with + without facts).

## Backfill existing projects

```
# all projects, or one:
npx tsx --require dotenv/config src/scripts/backfill-task-steps.ts [projectId]
```
Loads the jurisdiction reference cache, iterates tenants (projects are RLS), rebuilds steps.
The sample project = 246 steps. Or per-task: PM clicks "Rebuild steps" (OWNER/PM).

## Gotchas

- **Title drives inspection mapping**: a task titled "…panel"/"service" → engine's electrical
  *service* branch (gates `service`); "rough-in" → `rough_in`. Titles matter for which inspection a
  task maps to.
- **Manual API smoke**: suppress the dotenv banner when capturing a token
  (`require('dotenv').config({quiet:true})`) — the banner pollutes `$TOKEN`, corrupts the
  `Authorization` header, and Node returns a pre-Fastify `clientError` 400. Tests use `app.inject`
  (no socket) so they're unaffected; the web cookie→Bearer path works.
- **Detail test** must `loadReferenceCache(testPool)` in `beforeAll` (the resolver needs the
  in-memory cache that the server loads at boot).

## File locations

```
prisma/migrations/0021_schedule_task_meta_photos/   — schedule_tasks cols + schedule_task_photos
prisma/migrations/0022_task_steps/                  — task_steps
api/src/lib/task-buildout/                          — the engine (pure)
api/src/lib/jurisdictions/trade-map.ts              — tradeToPermitTrade()
api/src/services/task-steps.ts                      — build + persist
api/src/routes/v1/schedule-tasks.ts                 — detail, build-steps, photos endpoints
api/src/routes/v1/blueprints.ts                     — /import builds steps
api/src/scripts/backfill-task-steps.ts              — backfill ops script
api/src/test/{task-buildout,schedule-task-detail,trade-map}.test.ts
web/src/components/tasks/task-detail-panel.tsx      — shared panel (slide-over + page)
web/src/app/(dashboard)/projects/[id]/tasks/[taskId]/page.tsx
web/src/app/(dashboard)/projects/[id]/overview/page.tsx   — slide-over uses the panel
web/src/app/api/projects/[id]/schedule-tasks/[taskId]/{detail,photos,build-steps}/route.ts (+ photos/[photoId])
web/src/app/api/auth/me/route.ts                    — client role for edit gating
mobile/src/screens/{TaskListScreen,TaskDetailScreen}.tsx
mobile/src/lib/api.ts                               — uploadFile() (presigned PUT, online-only)
web/locales/{en,es}/projects.json · mobile/src/lib/i18n.ts  — task_detail / tasks i18n
```
