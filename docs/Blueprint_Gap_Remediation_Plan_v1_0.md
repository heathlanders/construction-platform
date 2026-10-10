# Blueprint Intelligence — Gap Remediation Plan v1.0
**Status: PLANNED — not started. Created 2026-07-11 (gap-analysis session).**

> Persistent check-off tracker (same pattern as Mobile_Design_Parity_Plan). Work happens on a new
> branch `feat/blueprint-gap-hardening` off fresh `main`. Check items off as sessions complete
> them. Full evidence (file:line) for every gap: see Appendix.

## Why

Blueprint Intelligence is the on-ramp for every project's schedule (PDF → proposed tasks → import →
schedule + DAG + work steps + permit milestones). Gap analysis (2026-07-11, 3-agent deep read +
verification) found 30+ issues; the four P0s mean the PDF path is unreachable from the normal UI,
imported schedules lose durations, races can duplicate the schedule, and extraction duplicates
template scope.

---

## Phase 1 — B1: Unbreak user path + stop corruption (P0)

- [x] **B1.1 Unify upload→analyze on-ramp.** Blueprint picker + analyze route + worker accept a
      **`files`** row (`category='plans'`, `status='ready'`) instead of the orphaned `documents`
      table (no UI ever creates `documents` rows). Fixes the scan-worker `document_id`=files-id
      inconsistency. Add hub upload affordance (inline upload or link to Files pre-set to plans);
      picker filters `status='ready'` and shows scanning state.
- [x] **B1.2 Carry duration into schedule.** Import computes
      `planned_end = planned_start + estimated_duration_days` (both present); today duration is
      silently discarded → zero-length Gantt tasks.
- [x] **B1.3 Concurrency guards.** Import: `SELECT … FOR UPDATE` on the analysis row, status gate
      under the lock, drop `'imported'` from allowed import states. Worker: claim job via
      `UPDATE … SET status='processing' WHERE id=$1 AND status='pending' RETURNING id` (skip if 0).
      Migration: UNIQUE on `blueprint_sheets (analysis_id, page_number)`; make proposed-task
      inserts genuinely idempotent (the existing `ON CONFLICT DO NOTHING` is dead code — no
      unique constraint exists).
- [x] **B1.4 Fix augment-vs-baseline dedup.** Exact-title dedup misses truss/footing/siding/
      insulation/anchor-bolt overlap → duplicate scope on nearly every extracted project. Add
      per-trade+phase supersede mapping (augment key → baseline patterns it replaces) + regression
      test on SD-ADU and Madison fixtures asserting no double-emit.
- [x] **B1.5 Tests + live e2e.** New tests: double-import race, duplicate-delivery no-op,
      duration→planned_end, dedup regression, files-picker flow. Live e2e on Docker stack:
      upload Madison lot25 via **web Files page** → picker → analyze (OCR) → review → import →
      verify durations + no duplicates + steps/DAG built.

## Phase 2 — B2: Hardening (P1)

- [x] **B2.1** Analyze validation: document belongs to project + scan `status='ready'` (worker
      currently downloads possibly-quarantined files).
- [x] **B2.2** Migration: add `WITH CHECK` to blueprint-table RLS policies (currently USING-only —
      cross-tenant INSERT unconstrained at DB layer).
- [x] **B2.3** `buildStepsForProjectTasks`: take building_type from the importing analysis (today:
      latest analysis, wrong when types differ); add `pole_barn` to its BUILDING_TYPES list
      (today silently → residential_sf).
- [x] **B2.4** Audit entries: task-review PATCH + worker status transitions (currently none).
- [x] **B2.5** Persist `components` + panel amperage into `import_metadata`; `facts.ts` reads them
      directly (title-regex reconstruction stays as manual-task fallback); one shared component
      vocabulary (today: divergent 8-vs-21 token sets; `asphalt_shingle`/`spray_foam` engine
      branches are dead — never produced).
- [x] **B2.6** Resource bounds: page cap env (~100) + per-page OCR timeout + oversize 422 at
      analyze; `markAnalysisFailed` records a reason into `import_metadata.failure`; review page
      renders it.

## Phase 3 — B3: UX round-out (P2)

- [x] **B3.1** Review page: read-only banner + locked controls when `imported`; wire task
      title/description edit (API PATCH exists, UI never sends it); bulk accept/reject via one
      server endpoint (today accept-all = N parallel PATCHes, errors swallowed; no reject-all).
- [x] **B3.2** Render extraction summary on review (flags, counts, title block — computed, typed,
      never shown) so PM can sanity-check; `aria-pressed` on toggles, `aria-live` on spinner.
- [x] **B3.3** Post-import: schedule page reads `?imported=` → toast with task/dep/step counts
      (currently dead param); import notification for owner/PM (review-ready notifies, import
      doesn't); warn when importing a 2nd analysis into a project with imported blueprint tasks.
- [x] **B3.4** Re-analyze affordance from history (re-run same doc, same/changed building type).
- [x] **B3.5** Files page i18n EN+ES (currently 100% hardcoded English — violates i18n rule, sits
      on the blueprint on-ramp).
- [x] **B3.6** Soft-delete consistency: `GET /:id/tasks` joins parent analysis liveness (deleted
      analyses currently leave tasks fully listable).

## Phase 4 — B4: Extraction quality + cleanup (P3)

- [x] **B4.1** Region-gate CA flag tasks (Title-24/CalGreen wording only when project state=CA;
      generic otherwise); tighten over-broad component regexes (`\bFOOTING\b`, `\bSLAB\b`,
      `\bEGRESS\b` fires on "egress lighting").
- [x] **B4.2** Routing heuristics: dotted sheet-number RE (`A.1`), discipline map gaps (`G`,
      `FP/FA`, multi-letter), per-page OCR yield stats; document `is_vector` 60% + yield≥200
      limits.
- [x] **B4.3** Dead-code/data cleanup: `disciplines_present`, `PanelInfo.location`,
      `RoomInfo.ceiling_height`, stale template header counts (fixed in all 5 files),
      contradictory 2000-vs-1000 sort comment, legacy `analyze_sheet`/`aggregate_tasks` stub jobs
      (removed — handlers, stub tables, dispatcher cases, dead local `disciplineFromSheetNumber`,
      unused `sendJob` import); consolidated building-type enum to a single `BUILDING_TYPES` const
      (route Zod + task-steps derive from it). **NOTE:** `raw_callouts`/`callouts` was NOT removed —
      it's persisted to `import_metadata.callouts` (a WI-jurisdiction signal) and asserted by
      `blueprint-ocr.test.ts`, so it is live, not dead (plan gap-analysis was imprecise here).
- [x] **B4.4** Composite indexes: `(analysis_id, sort_order, id)`,
      `(analysis_id, review_status, schedule_task_id)` — migration 0027.
- [x] **B4.5** Docs sync: updated Blueprint_Intelligence_v1_0.md (Gap Remediation Phases 1–4
      section + job table + AI-Vision notes) + the blueprint-intelligence skill; noted mobile
      blueprint absence in Mobile_Enterprise_Plan_v1_0.md §6 backlog.

## Verification (every phase)

`cd api && npx vitest run src/test/blueprint-*.test.ts src/test/task-buildout.test.ts
src/test/schedule-task-detail.test.ts` green + phase-specific new tests + web
`npx tsc --noEmit` + live Docker e2e for user-facing phases.

## Known/accepted (NOT in scope)

AI Vision = deliberate no-AI stub; task-title ES = v1.1 data task; mobile blueprint surface =
Mobile Enterprise Plan backlog; regional detectors grow per-onboarded region by design.

---

## Appendix — Gap evidence (file:line)

### P0
- **PDF path unreachable:** picker reads `documents` (hub `page.tsx:71`); upload UI writes `files`
  (`files.ts:130`); nothing POSTs `/v1/documents`; scan-worker auto-trigger needs
  `doc_type='plan'+building_type` (`file-scan-worker.ts:213`) which upload schema never accepts
  (`files.ts:57-63`) and passes a files-id as `document_id`.
- **Duration dropped:** import INSERT `blueprints.ts:388-406` — `planned_start` only, no
  `planned_end`, `estimated_duration_days` never read.
- **Races:** import `blueprints.ts:359-497` no lock; worker `blueprint-worker.ts:156` unguarded
  processing write; dead `ON CONFLICT` at `:231,:856`; migration 0008 has zero UNIQUEs.
- **Augment duplication:** `build-tasks.ts:353-363` exact-title dedup; e.g. augment
  `build-tasks.ts:319` vs baseline `residential-sf.ts:24`.

### P1
- Unvalidated doc: `blueprints.ts:111-121` (no project/scan check), worker download `:490`.
- RLS USING-only: migration 0008 `:33,:60,:92`.
- Wrong building type for steps: `task-steps.ts:48-52`; `pole_barn` missing `task-steps.ts:12`.
- No audits: PATCH `blueprints.ts:313-346`; worker `:158,:318,:908`.
- Facts disconnect: worker metadata `blueprint-worker.ts:597-615` (no components/amperage);
  `facts.ts:11-20` divergent vocabulary; dead branches `building.ts:96,123`.
- No bounds: `extract.ts:174` unbounded loop; `ocr.ts` no page cap/timeout; `markAnalysisFailed`
  `blueprint-worker.ts:906` no reason.

### P2
- Post-import mutation: import allows `'imported'` `blueprints.ts:367`; PATCH no status guard
  `:313`; review UI live controls on imported runs.
- No edit UI: review `page.tsx:174-193` sends only `review_status`.
- Accept-all N-parallel + swallowed errors: review `:190-193`, `:180`.
- Dead `?imported=` param: review push `:214`, schedule page never reads it;
  `dependency_count`/`step_count` discarded `:213`.
- Unrendered metadata: review types `:38-41` vs render; worker writes `:558,609-612`.
- Files i18n: `files/page.tsx:69,103,139,171`.
- Orphaned children on delete: DELETE `blueprints.ts:230-269`; tasks listable `:285`.
- Mobile absent: `grep -ril blueprint mobile/src` → empty.

### P3
- CA flags: `parse-sheets.ts:311-324`; CA-worded tasks `build-tasks.ts:224-278`.
- 2-builder WI profile allow-list: `title-block.ts:239-252`.
- `is_vector` heuristic: `extract.ts:225`; OCR yield gate `blueprint-worker.ts:511`.
- Over-broad regexes: `parse-sheets.ts:267-293`; rigid schedule rows `:166`.
- Sheet-number RE: `extract.ts:65`; discipline map `:40-51`; `'specs'` ∉ TradeType `types.ts:3-16`.
- Title-block crop hardcode: `ocr.ts:38-39`.
- Stale counts: all 5 `blueprint-templates/*.ts` headers; sort comment `build-tasks.ts:136-137`.
- Cursor silent empty page: `blueprints.ts:184,:289`. Enum duplicate: `blueprints.ts:35`.

### Test holes
No coverage: concurrency, worker text/OCR persistence e2e, duration survival, dedup regression,
facts round-trip, low-yield OCR fallback, PATCH-after-import, unscanned doc, blueprint-table RLS,
non-CA/WI fixtures.

---

## Phase kickoff prompts

**Phase 1:**
> Start Phase 1 (B1.1–B1.5) of docs/Blueprint_Gap_Remediation_Plan_v1_0.md on branch
> feat/blueprint-gap-hardening: unify the blueprint upload→analyze on-ramp onto the `files` table,
> carry estimated_duration_days into planned_end on import, add the import/worker concurrency
> guards + unique constraints, fix augment-vs-baseline dedup, and add the listed tests. Check off
> items in the plan doc as completed, commit per item.

**Phase 2:** same shape for B2.1–B2.6. **Phase 3:** B3.1–B3.6. **Phase 4:** B4.1–B4.5.
