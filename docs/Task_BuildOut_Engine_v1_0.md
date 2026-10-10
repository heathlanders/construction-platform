# Task Build-Out Engine & Task Detail — Feature Specification v1.0
**"The Operating System for Construction" — Per-Trade Work Steps, Codes Integration & QA Photos**

> **Status:** BUILT — Session 41 (2026-06-24). Migrations 0021 (`schedule_tasks` meta + `schedule_task_photos`)
> and 0022 (`task_steps`).
> **Builds on:** Blueprint Intelligence (Doc 16 — task generation), the Jurisdiction/Codes Engine
> (Doc 16 Codes Engine + `LOCKED_DECISIONS` T-59), File Upload Security (T-27/28).
> **Decisions in force:** T-02 (cents N/A), T-03 (UUIDs), T-12 (optimistic locking), A-03 (RLS),
> T-59 (one trade-aware permit/codes path). No tier gate.
> **Skill:** `.claude/skills/task-buildout/SKILL.md`. **Schema:** `Schema_Reference.md` §Domain 9b.

---

## Overview

A schedule task used to be a title + status + dates with no field guidance and no link to codes.
This feature turns every task into a work surface that aids **all** roles in an org:

- **Laborer** gets ordered **work steps** — how to do the task, with the governing code sections, the
  tools/materials/safety, the QA check, and which AHJ inspection signs it off.
- **PM / Owner** gets a **task-scoped Codes & Compliance** view (live inspection pass/fail for exactly
  this task's work) plus editing, photo review, and a "rebuild steps" control.
- **Field** captures **QA / proof photos** against the task.

The **Task Build-Out Engine** is a deterministic, per-trade engine (no AI — mirrors the
`task-dependencies` rule engine and the `jurisdictions` cascade) that references the **blueprint
analysis** (extracted panels/fixtures/rooms/flags/components) and the **codes engine** (resolved code
edition + inspection sequence) to expand each task into `task_steps`.

```
 blueprint analysis facts ─┐
                           ├─► Build-Out Engine (per-trade) ─► task_steps (ordered work steps)
 codes engine (resolved) ──┘                                     │
                                                                 └─► task detail: steps + task-scoped
                                                                     codes + live inspections + photos + deps
```

---

## Data model (migrations 0021 + 0022)

Full column specs in `Schema_Reference.md` §Domain 9b. Summary:

| Table / columns | Migration | Purpose |
|-----------------|-----------|---------|
| `schedule_tasks.trade_type` / `phase` / `csi_division` | 0021 | Native trade/phase/csi (backfilled from `blueprint_proposed_tasks`, stamped on import, settable on manual tasks). Drives codes resolution + the Overview phase columns. |
| `schedule_task_photos` | 0021 | QA/proof photos. `storage_path` = the LIVE path of a scan-passed `files` row. RLS. |
| `task_steps` | 0022 | Engine output — ordered work steps per task. RLS. Regenerated as a SET (`source` rule_engine\|manual; no `version`). |

`task_steps` columns: `step_order`, `title`, `instruction`, `detail?`, `code_refs JSONB`
(`[{code_type, section, note?}]`), `tools/materials/safety JSONB` (string[]), `gating_inspection_type`
(matches `inspections.inspection_type`), `qa_check?`, `source`.

---

## The engine (`api/src/lib/task-buildout/` — pure, no I/O, no AI)

| File | Role |
|------|------|
| `types.ts` | `WorkStep`, `BuildContext`, `BlueprintFacts`, `CodeRef`, `EMPTY_FACTS` |
| `index.ts` | `buildTaskSteps(ctx)` — dispatch by `tradeToPermitTrade()`, renumber, drop a `gating_inspection_type` not present in the resolved (AHJ-merged) sequence, `[]` for no-trade tasks |
| `code-refs.ts` | `codeRefsFor(trade, inspection_type, codeType)` — per-(trade, inspection) model-code section map (NEC/IPC/IMC/IRC…) |
| `facts.ts` | `buildBlueprintFacts(analysisId, client)` — aggregate from `import_metadata` (flags, fixture_types, counts) + a keyword scan of proposed-task titles (components, panel amperage) |
| `electrical.ts` `plumbing.ts` `mechanical.ts` `building.ts` | per-trade recipes keyed by phase (+ title keywords + components). `building.ts` branches roofing/concrete/framing/structural/general. |

**Trade collapse** (`api/src/lib/jurisdictions/trade-map.ts` `tradeToPermitTrade`): electrical→electrical,
plumbing→plumbing, hvac→mechanical, everything else→building. Single source of truth, mirrors
`PERMIT_TRADES` in `blueprint-worker.ts`.

**Parameterization:** steps use `BlueprintFacts` to get concrete (e.g. "Set the 200A main panel…",
trusses vs I-joists from `components`, gas test only when a gas flag is set); fall back to generic
wording when facts are absent (manual tasks).

**Persistence** (`api/src/services/task-steps.ts` `buildStepsForProjectTasks`): resolves the project's
jurisdiction once, loads facts once, then builds + inserts steps for a task set — soft-deleting prior
`source='rule_engine'` rows first (idempotent rebuild; preserves `manual`).

---

## API

All require JWT + `/v1/` + `User-Agent` + `withTenantContext`. No tier gate.

| Method | Path | Roles | Notes |
|--------|------|-------|-------|
| GET | `/v1/schedule-tasks/:id/detail` | any authed | task + **task-scoped** codes + live inspection status + deps + photos + work steps |
| POST | `/v1/schedule-tasks/:id/build-steps` | OWNER, PM | (re)build one task's steps |
| POST | `/v1/schedule-tasks/project/:projectId/build-steps` | OWNER, PM | rebuild all of a project's tasks (backfill) |
| POST | `/v1/schedule-tasks/:id/photos` | OWNER, PM, FOREMAN, FIELD_TECH, SAFETY_OFFICER | attach a scan-passed `file_id` |
| GET | `/v1/schedule-tasks/:id/photos` | any authed | presigned `download_url` |
| DELETE | `/v1/schedule-tasks/:id/photos/:photoId` | OWNER, PM, or uploader | soft delete |
| PATCH | `/v1/schedule-tasks/:id` | OWNER, PM | now also accepts `trade_type`/`phase`/`csi_division`/`sort_order` (optimistic lock) |

Blueprint `POST /v1/blueprints/:id/import` now also builds steps for accepted tasks → returns `step_count`.

**Photo flow:** reuses the existing quarantine pipeline — `POST /v1/files/upload` (presigned PUT →
`file.scan` worker → `promoteToLive`); the attach endpoint verifies `files.status='ready'` and 409s
`FILE_NOT_READY` until the scan completes (caller retries).

**Codes scoping:** `detail.codes.compliance` is filtered to the `inspection_type`s the task's steps
gate (`codes.task_scoped=true`); `codes.task_code_refs` = union of step code refs; falls back to the
full trade sequence only when the task has no steps yet.

---

## Web (`web/src/components/tasks/task-detail-panel.tsx` — shared)

One client component used by **both** the Project Overview slide-over (click a node) and the dedicated
page `projects/[id]/tasks/[taskId]/page.tsx`. Sections:

- **Details** (editable, OWNER/PM): status, %, description, assignee, planned + actual dates,
  trade/phase, sort_order. Read-only for other roles.
- **Work Steps** (laborer-facing): ordered cards — instruction + detail, code-ref badges,
  gating-inspection, tools/materials/safety, QA check. "Rebuild steps" (OWNER/PM).
- **Codes & Compliance** (task-scoped): code badge, AHJ, jurisdiction notes, `task_code_refs`,
  live inspection status dots for this task's required inspection(s).
- **QA Photos**: upload (field roles) via `/api/files/upload-url` → attach; thumbnails via presigned URL.
- **Dependencies**: predecessors / successors.

Client role from `web/src/app/api/auth/me/route.ts`; API enforces regardless. Proxies under
`web/src/app/api/projects/[id]/schedule-tasks/[taskId]/{detail,photos,build-steps}` (+ `photos/[photoId]`).
**i18n:** `task_detail.*` in `locales/{en,es}/projects.json` (chrome EN+ES). Step content + task titles
are English data (ES = v1.1).

---

## Mobile

- `screens/TaskListScreen.tsx` — tasks grouped by phase (Tasks tile on ProjectDetailScreen).
- `screens/TaskDetailScreen.tsx` — Work Steps (read-only) + task-scoped Codes & Compliance + QA Photos
  (capture + upload, **online-only**) + dependencies; OWNER/PM set status/% (optimistic lock).
- `lib/api.ts` `uploadFile()` — presigned PUT then attach-with-retry. No offline queue (Enterprise Plan §B4).
- i18n `tasks` namespace EN+ES; `projects['actions.tasks']` flat key.

---

## Roles

| Action | Roles |
|--------|-------|
| View task detail + work steps + codes + photos | any authenticated org user (laborers included) |
| Edit task (status/%/desc/dates/assignee/trade/phase/sort_order) | OWNER, PROJECT_MANAGER |
| Build / rebuild work steps | OWNER, PROJECT_MANAGER |
| Upload QA photo | OWNER, PM, FOREMAN, FIELD_TECH, SAFETY_OFFICER |
| Delete QA photo | OWNER, PM, or the uploader |

---

## Backfill & ops

```
# all projects, or one
npx tsx --require dotenv/config api/src/scripts/backfill-task-steps.ts [projectId]
```
Loads the jurisdiction reference cache, iterates tenants (projects are RLS), rebuilds steps.
The sample project = **246 steps**. Or per-task via the web "Rebuild steps" button.

---

## Tests

- `api/src/test/trade-map.test.ts` — trade→permit-trade mapping.
- `api/src/test/task-buildout.test.ts` — per-trade `buildTaskSteps` (with/without facts, gating
  validity, building branches, plumbing gas gating, no-trade → []).
- `api/src/test/schedule-task-detail.test.ts` — detail aggregate, **task-scoped codes**, build-steps
  endpoint + role gate, photo attach. Must `loadReferenceCache(testPool)` in `beforeAll`.

---

## Gotchas

- **Title drives the inspection mapping** — a task titled "…panel"/"service" maps to the electrical
  *service* inspection; "rough-in" → rough_in. Titles matter for which inspection a task gates.
- **Manual API smoke** — capture tokens with `require('dotenv').config({quiet:true})`; the dotenv
  banner otherwise pollutes the `Authorization` header → Node pre-Fastify `clientError` 400. In-process
  `app.inject` tests are unaffected; the web cookie→Bearer path works.

---

## Deferred

| Item | Target |
|------|--------|
| ES translation of step **content** (data, like task titles) | v1.1 |
| AI enrichment of steps (engine interface leaves room) | future |
| Mobile **offline** work-steps / photo queue | Mobile Enterprise Plan §B4 |
| Send-to-inspector (email / inspector portal) | future (inspector = AHJ name/phone on the permit today) |

---

*Spec version: 1.0 — Session 41 — 2026-06-24*
