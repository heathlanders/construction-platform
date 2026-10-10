# Change Log & Session Summaries

> Historical record of all document changes and decisions. Load this file for history/context or when onboarding to a new session after a gap.

---

## Change Log

## Session — Design Studio (client visualizer) — 2026-10-06
**Branch:** `feat/client-visualizer` · **PR:** #69 (draft) · **Pickup plan:** `docs/Design_Studio_Session_Wrapup.md`

### Summary
Built the Design Studio end to end: contractor-invited clients describe a job through an AI-guided per-trade wizard
(EN/ES), add photos, get concept pictures + a budget range, and accept the contractor's proposal in the portal; the
contractor reviews, verifies, estimates and converts to a project. v1 trade `concrete_flatwork`; the framework
(`api/src/lib/intake/`) serves any taxonomy trade. Proposed T-65 (not locked). Migrations 0045–0047.

### Bugs fixed (pre-existing, found along the way)
- Presigned upload/download URLs signed for Docker-internal `minio:9000` → no browser upload worked on the local stack
  (`STORAGE_PUBLIC_ENDPOINT`).
- Web `I18nProvider` read `data.user.language_preference` but `/v1/users/me` is flat → saved language never applied.

### Open
Image provider spike (keys + photos), tier pricing, tunnel route for remote uploads, platform-wide T-11 gap on public
auth routes, T-65 sign-off.

## Session 45 — Blueprint Intelligence — full gap review + remediation
**Date:** 2026-07-02

### Summary
Full gap & feature analysis of Blueprint Intelligence (3 parallel code audits, spot-verified),
then remediated everything in one pass across three merged branches (`fix/blueprint-hardening`,
`feat/blueprint-analysis-history`, `feat/blueprint-ocr-progress`). All shipped to production
(thejobsite.app) the same day.

### Bugs fixed (4)
1. **Stuck `processing`** — `handleBlueprintAnalyze` had no top-level try/catch; any unexpected
   throw left the analysis in `processing` forever (infinite review-page spinner). Now →
   `markAnalysisFailed()` + rethrow (DLQ preserved).
2. **T-55 not enforced** — permit milestone injection ignored tier; Starter got the Professional
   feature free. Now soft-gated in the worker with `import_metadata.tier_note`.
3. **Re-import duplicated schedule_tasks** — accepted-task query lacked
   `schedule_task_id IS NULL` (doc claimed idempotency). Fixed.
4. **Review page clipped at 100 tasks** — fetched one page, never followed `next_cursor`. Fixed.

### Features added
- `GET /v1/blueprints?project_id=` — analysis history; hub "Previous analyses" section
  (status/source/task count/date, Open review, Delete).
- `DELETE /v1/blueprints/:id` — soft delete non-imported analyses (imported → 409) +
  "Delete & start over" on failed runs.
- Hub **document picker** (plans first) replaces the raw-UUID paste field.
- **OCR progress indicators** — `ocrPdfToText(buffer, onProgress)` per-page callback; worker
  writes transient `import_metadata.progress`; review spinner shows "OCR sheet N of M" + bar.
- **Full i18n** — `projects.blueprints.*` EN+ES (~60 keys; chrome was 100% hardcoded English —
  P-09 violation). `RoleGate` layout (owner/PM/foreman) on blueprint pages.

### Tests
`blueprint-routes.test.ts` (14) + `blueprint-worker.test.ts` (4) — first route/worker coverage
for the module (was extraction-lib-only). OCR fixture test asserts the progress callback.

### Docs updated
`Blueprint_Intelligence_v1_0.md` (permit section rewritten trade-neutral — all 4 trades via
`PERMIT_TRADES`; new endpoints; tier-gate wording now matches code), blueprint-intelligence
skill, `api`/`web` `CLAUDE.md`. Deferred: builder profiles → DB table (v1.1), mobile blueprint
surface (web-first by plan), sheet-image previews.

### Ops
Server root disk hit 100% mid-session (silent git-commit failure, all tool calls ENOSPC).
Freed ~10G (npm cache + docker prune); still ~90% — needs a cleanup pass. Memory
`server_disk_pressure` records the recovery drill.

---

## Session 40 — Time Tracking & Payroll — e2e review + documentation backfill
**Date:** 2026-06-24

### Summary
Reviewed timecard/time-entry functionality end-to-end (API + web + mobile) for enterprise readiness.
Feature was **built but undocumented** (shipped piecemeal Sessions 7, 22–26). Backfilled canonical docs,
reconciled `.docx` MVP drift, and locked the implicit decisions. **No code changed — docs only.**

### Review findings (what exists)
- **API:** `time-entries.ts`, `timecards.ts` (approval FSM), `time-punches.ts` (clock in/out),
  `payroll.ts` (CSV export), `payroll-settings.ts`. Workers: `field-cost-worker.ts`,
  `payroll-worker.ts`, `time-punch-worker.ts`. All `withTenantContext()`, optimistic-locked, audited.
- **Web:** `/timecards` (hub/board/my/clock), `/settings/payroll`, project time-entries + 11 proxies.
  i18n `field` namespace EN+ES complete (false alarm: keys are nested under `field.*`, not missing).
- **Mobile:** `TimeEntryScreen` offline-first (WatermelonDB), per-record sweep sync.
- **Schema:** 6 tables across migrations 0001/0002/0005/0007/0011.

### Gaps logged (not fixed this session)
- Mobile Tier-2 conflict UI for time entries absent (T-14 debt → Mobile_Enterprise_Plan §B3).
- Mobile no cost-code/budget picker; no clock/timecard screen; per-record (not batch) sync.
- Web timecard pages lack client-side role gating (API enforces).
- No automated tests on the money path (API + mobile).
- GPS geofence + crew bulk clock-in marked "v1.0 SHIP" in `.docx` but unbuilt → **OQ-17 (defer v1.1)**.

### Docs created / changed
- **New:** `docs/Time_Tracking_Payroll_v1_0.md` (Doc 17), `.claude/skills/time-tracking/SKILL.md`.
- **Edited:** `LOCKED_DECISIONS.md` (+T-60 timecard FSM, +T-61 mode toggle/clock-out upsert,
  +T-62 token encryption/export gate/no-tier-gate), `Schema_Reference.md` (+Domain 17: 5 tables +
  index rows), `PROJECT_MASTER_REFERENCE.md` (Doc 17 registry, 5 routing rows, OQ-17),
  root + `api`/`web`/`mobile` `CLAUDE.md` (spec table, skill, module sections).

---

## Session 30 — Company Asset Management (EAM) — Full Implementation
**Date:** 2026-03-29

### Summary
Implemented all code for the EAM module designed in Session 29. 27 files added/modified.
TypeScript check passes clean.

### Files created (25 new)
**API routes (12):** `assets.ts`, `asset-groups.ts`, `asset-assignments.ts`,
`asset-service.ts`, `asset-inspections.ts`, `asset-warranties.ts`, `asset-insurance.ts`,
`asset-compliance.ts`, `asset-fuel.ts`, `asset-depreciation.ts`, `asset-damage.ts`,
`asset-documents.ts`

**Worker:** `api/src/workers/asset-worker.ts` — daily expiry check, monthly depreciation,
QB sync stub, overdue checkout alert

**Web pages:** `assets/page.tsx`, `assets/[id]/page.tsx`, `assets/insurance/page.tsx`,
`assets/inspection-templates/page.tsx`

**Web API proxies:** `api/assets/route.ts`, `api/assets/[id]/route.ts`,
`api/assets/[id]/[sub]/route.ts`, `api/asset-insurance-policies/route.ts`,
`api/asset-inspection-templates/route.ts`

**i18n:** `web/locales/en/assets.json`, `web/locales/es/assets.json`

**Migration:** `prisma/migrations/0010_asset_management/migration.sql`

### Files modified (2)
- `api/src/workers/stripe-worker.ts` — 4 new case statements + import
- `api/src/index.ts` — 12 new route registrations

### Key implementation details
- All routes use `async (req: any, reply: FastifyReply)` pattern (Fastify TS variance fix)
- Audit category is `'data'` (not `'operational'`) — matches AuditCategory union type
- `/assets/fuel-summary` static route registered before `/:id` parameterized routes
- Depreciation entries + meter readings: GET+POST only — no PATCH/DELETE routes exist
- System inspection templates: `is_system_template = TRUE` RLS exception for cross-tenant read

---

## Session 29 — Company Asset Management (EAM)
**Date:** 2026-03-29

### Summary
Designed and documented a full Enterprise Asset Management (EAM) module covering vehicles,
heavy equipment, power tools, hand tools, trailers, attachments, technology, and safety
equipment. Covers the complete asset lifecycle: service records, warranties, insurance
policies, registrations/compliance, fuel tracking, depreciation, pre-use inspections,
damage incidents, recalls, and calibration. Business+ tier gate.

### New decisions locked
- **T-56:** Asset Management module is Business+ only — all `/v1/assets*` endpoints gate at Business
- **T-57:** Operator cert blocking — assignment and checkout blocked if `requires_operator_cert = true` and operator lacks active cert in `safety_certifications`
- **T-58:** Asset project assignments are chain-of-custody records, written to `audit_log` category `operational`

### New documents / files created
- `docs/Asset_Management_v1_0.md` — full feature spec (25 tables, ~60 API endpoints, 4 jobs, 9 notification types)
- `.claude/skills/asset-management/SKILL.md` — implementation skill

### Documents updated
- `docs/Schema_Reference.md` — added Domain 14 (Company Asset Management) + indexes
- `docs/LOCKED_DECISIONS.md` — added T-56, T-57, T-58
- `docs/Pricing_Tier_Enforcement_Matrix.md` — added Business+ gate for all asset endpoints
- `docs/PROJECT_MASTER_REFERENCE.md` — added doc 14 to registry and context routing
- `docs/CHANGE_LOG.md` — this entry
- `CLAUDE.md` — added asset management to spec docs table and module list
- `api/CLAUDE.md` — added asset route files
- `web/CLAUDE.md` — added asset pages

### Architecture notes
- 25 new tenant-scoped RLS tables in migration `0010_asset_management`
- `asset_meter_readings` and `asset_depreciation_entries` are append-only
- Failed inspection auto-sets `company_assets.status = 'out_of_service'` in same transaction
- Cert check reads `safety_certifications` (existing Domain 8) — no new cert storage
- QuickBooks sync for depreciation journal entries uses existing QB integration pattern (T-21, T-22)
- 4 background jobs: `asset.daily_expiry_check`, `asset.monthly_depreciation`, `asset.sync_depreciation_to_qb`, `asset.overdue_checkout_alert`
- Mobile: pre-use inspection form, QR checkout, fuel log, damage report — all offline-first
- Future integrations documented (telematics, fuel cards, NHTSA VIN lookup, ELD/HOS)

---

## Sessions 27–28 — Jurisdiction-Aware Electrical Permits & Inspection Milestones
**Date:** 2026-03-25

### Summary
Added a complete electrical permit tracking system with jurisdiction-aware NEC code library (all 50 states + DC), AHJ permit lifecycle management, auto-generated inspection milestone sequences, and Blueprint Intelligence integration so milestones surface as proposed schedule tasks.

### Changes

**New: static electrical codes library (`api/src/lib/electrical-codes/`)**
- `types.ts` — `NecEdition`, `ElectricalInspectionType`, `BuildingType`, `JurisdictionInfo`, `InspectionStep` types
- `nec-editions.ts` — all 51 jurisdictions; WI=2020, CA/OR/NY/IL include amendment notes; outliers on 2017 noted
- `inspection-sequences.ts` — 5-step AHJ milestone sequence: temporary_power → rough_in → service → cover → final; residential temporary_power is "(Optional)"
- `index.ts` — `getJurisdiction()`, `getInspectionSequence()`, `isValidStateCode()`, `ALL_JURISDICTIONS`

**New: migration `prisma/migrations/0009_electrical_permits/migration.sql`**
- New `permits` table: full lifecycle (draft→submitted→approved→active→closed/voided), AHJ info, denormalized NEC jurisdiction, RLS enforced
- `ALTER TABLE inspections` — 7 new nullable columns: permit_id, trade_type, inspection_type, sequence_order, inspector_name, correction_notice, result (synced to status)

**New: API routes**
- `api/src/routes/v1/permits.ts` — 6 endpoints: POST (create + auto-gen milestones), GET list, GET :id (with linked inspections), PATCH (status transitions enforced), DELETE (cascade to untouched milestones), POST :id/generate-milestones (hard 402 for Starter)
- `api/src/routes/v1/electrical-codes.ts` — 3 read-only endpoints: all jurisdictions, single state lookup, inspection sequence by building type
- `api/src/routes/v1/inspections.ts` — extended: permit_id/trade_type/inspection_type filters; result field with auto status-sync; sequence_order sort

**New: Next.js API proxies**
- `web/src/app/api/permits/route.ts` — GET/POST
- `web/src/app/api/permits/[id]/route.ts` — GET/PATCH/DELETE
- `web/src/app/api/permits/[id]/generate-milestones/route.ts` — POST
- `web/src/app/api/electrical-codes/jurisdiction/[state]/route.ts` — GET

**New: Web UI**
- `web/src/app/(dashboard)/projects/[id]/permits/page.tsx` — permit list + NewPermitSlideOver; jurisdiction info box shows NEC edition + state + amendment notes
- `web/src/app/(dashboard)/projects/[id]/permits/[permitId]/page.tsx` — permit detail card + visual inspection milestone timeline (colored dots, inline edit for date/inspector/result/correction notice) + re-generate button

**Modified: existing pages**
- `trade/page.tsx` — added "Electrical Permits" summary card (count, latest permit status, link)
- `inspections/page.tsx` — added trade type filter pills: All / Electrical Milestones / General

**Blueprint Intelligence hook (`api/src/workers/blueprint-worker.ts`)**
- `injectPermitInspectionMilestones()` — queries for active electrical permit; if found, injects 5 AHJ inspection milestones as `blueprint_proposed_tasks` with `phase='inspections'`, `sort_order=1000+sequence_order`
- Called in both `runTemplatePath` and `handleBlueprintAggregateTasks`; milestone count included in `extracted_task_count` and `import_metadata`

**i18n**
- `web/locales/en/trade-electrical.json` — added `electrical.permits.*` (28 keys) and `electrical.inspection_milestones.*` (7 keys)
- `web/locales/es/trade-electrical.json` — full Spanish translations of all new keys

---

## Sessions 25–26 — Full Frontend Detail/Edit Layer
**Date:** 2026-03-25

### Summary
Every list row across the dashboard is now click-to-edit. Completed 5 waves + a post-wave audit covering every hoverable table row. No more dead `hover:bg-gray-50` rows anywhere in the app.

### Changes

**New Next.js proxy routes (`web/src/app/api/`):**
- `punch-list-items/[id]/` — GET+PATCH+DELETE
- `safety-incidents/[id]/` — GET+PATCH
- `inspections/[id]/` — GET+PATCH
- `daily-reports/[id]/` — GET+PATCH
- `rfis/[id]/` — GET+PATCH
- `submittals/[id]/` — GET+PATCH
- `contracts/[id]/` — GET+PATCH
- `vendors/[id]/` — GET+PATCH (also added PATCH to `people/[id]/`)
- `time-entries/[id]/` — GET+PATCH+DELETE
- `invoices/[id]/` — GET+PATCH
- `budget-line-items/[id]/` — GET+PATCH+DELETE
- `takeoff-items/[id]/` — GET+PATCH+DELETE
- `schedule-tasks/[id]/` — GET+PATCH
- `electrical-panels/[id]/` — GET+PATCH
- `plumbing-systems/[id]/` — GET+PATCH

**Wave 1 — Field operations slide-overs:**
- `punch-list/page.tsx` — edit title/description/status/assignee/due_date + delete
- `safety/page.tsx` — edit description/severity/status/incident_date
- `inspections/page.tsx` — edit title/status/date/notes
- `milestones/page.tsx` — edit title/due_date + Mark Complete + delete
- `daily-reports/page.tsx` — view full weather + edit notes

**Wave 2 — Document workflow slide-overs:**
- `rfis/page.tsx` — edit subject/status/due_date/assignee + quick transitions (Mark Open / Mark Answered / Close RFI)
- `submittals/page.tsx` — edit title/spec_section/status + workflow buttons (Submit / Start Review / Approve / Reject / Resubmit)
- `contracts/page.tsx` — vendor name resolved from UUID, edit status/retainage_pct + quick transitions, financial read-only summary

**Wave 3 — Vendor and People detail pages:**
- `vendors/[id]/page.tsx` — new full detail page with inline edit (name/type/trade/contact/preferred/prequalified/performance_notes)
- `vendors/page.tsx` — rows now link to detail page
- `people/[id]/page.tsx` — added inline edit for role/status

**Wave 4 — Time entry edit slide-over:**
- `projects/[id]/time-entries/page.tsx` — edit date/hours/notes/cost_code_id + delete

**Wave 5 — Settings account edit:**
- `settings/page.tsx` — edit first_name, last_name, language_preference via PATCH /api/users/me

**Post-wave audit — remaining dead rows:**
- `projects/[id]/budget/page.tsx` — InvoiceSlideOver (amount, status, due_date, quick transitions) + LineItemSlideOver (description, budget, read-only actuals, delete)
- `estimating/[bid_package_id]/page.tsx` — TakeoffItemSlideOver (description, qty, unit select, unit_cost, line total preview, delete)
- `projects/[id]/schedule/page.tsx` — TaskSlideOver (title, description, status, % complete, planned/actual dates, quick transitions: Start/Complete/Hold/Resume)
- `projects/[id]/trade/page.tsx` — PanelSlideOver (name, amperage, voltage, location, notes) + PlumbingSystemSlideOver (name, system_type, notes)

**Also fixed:**
- Kanban board drag-and-drop directional bug (columns now use `useDroppable`)
- `schedule-tasks` list limit raised to 200
- Rich seed data: schedule tasks + milestones added to demo-seed

---

## Sessions 22–24 — Payroll Integration + Infrastructure
**Date:** 2026-03-24

### Summary
Added payroll provider integrations (Gusto, ADP) with CSV export. Fixed a Next.js route group conflict that broke the dev server.

### Changes

**Payroll API (`api/src/routes/v1/payroll.ts`):**
- Time entries → formatted CSV export per pay period
- QuickBooks payroll sync fix
- Gusto OAuth connect + webhook receiver stub
- ADP OAuth connect + webhook receiver stub
- Registered in `api/src/index.ts`

**Payroll settings UI:**
- `web/src/app/(dashboard)/settings/payroll/page.tsx` — payroll provider hub with Gusto/ADP connect buttons, current integration status, i18n wired

**Fixed: Next.js route group conflict** (`89dc9ac`) — dev server was broken due to ambiguous route group resolution between `(dashboard)` routes; resolved by restructuring conflicting route group nesting.

---

## Sessions 19–20 — GC Module + Monitoring + Workstreams
**Date:** 2026-03-23 – 2026-03-24

### Summary
Completed residential GC feature set, added Sentry/pino monitoring, and executed Workstreams B/C/D/E/G. Critical RLS enforcement regression discovered and fixed.

### Changes

**Residential GC feature completion:**
- Change order workflow: approve/reject/void + contract linkage (`contract_id` FK, `direction` field)
- Bid package → contract award flow: vendor bid award → auto-creates contract row
- Client portal read-only view: `show_in_client_portal` schedule tasks + project summary visible to `client_portal` role
- Owner-to-GC / GC-to-sub change order direction tracking
- Demo seed updated: schedule tasks, timecards, trade modules, client portal entries

**Monitoring — Workstream F (`b7be0e4`):**
- Sentry error tracking integrated (api + web)
- `pino` structured JSON logging replaces `console.log` throughout API
- Request ID propagated through Fastify middleware → Sentry context → pino log fields

**Workstreams B/C/D/E/G (`0affb82`):**
- **B:** Enhanced milestone tracking — schedule task linkage, milestone completion events
- **C:** Superadmin UI — `web/src/app/(dashboard)/admin/` pages for tenant management, DLQ inspection, portal migration approval
- **D:** Mobile i18n remaining strings — crew assignments, notifications, trade screens wired to `t()`
- **E:** Enterprise API keys — `api_keys` table, `POST /v1/api-keys`, key hash (bcrypt), Enterprise-tier gate enforced
- **G:** Additional workstream items (see commit `0affb82` for full detail)

**Critical fix — RLS enforcement restore (`7d0d1a5`):**
- Discovered `platform_user` DB role had `BYPASSRLS` — all RLS policies were silently bypassed at runtime
- Fix: `ALTER ROLE platform_user NOBYPASSRLS` + verified `FORCE ROW LEVEL SECURITY` on all 30+ tenant-scoped tables
- All 52 integration tests green after fix
- Severity: would have been a launch-blocking security regression; no data exposed (single-tenant dev environment)

---

## Session 18 — Design Partner Readiness
**Date:** 2026-03-23

### Summary
Completed P-09 (Spanish required) on mobile, added comprehensive design partner demo seed, fixed post-session-17 regressions, and built the in-app onboarding checklist.

### Changes

**Mobile P-09 completion:**
- `fix(mobile/i18n)` (`f5fd262`) — wired remaining hardcoded strings across all mobile screens
- `feat(mobile)` (`4ff49ac`) — RFI list + safety alert strings wired to `t()`
- P-09 (Spanish required at v1.0) now fully satisfied on web and mobile

**Demo seed (`d371aa5`) — `prisma/demo-seed.ts`:**
- Tenant "Sunrise Builders" with realistic data across all modules
- Users covering all 7 roles, 3 active projects, contracts, invoices, change orders, daily reports, punch list items, safety incidents, inspections, schedule tasks, milestones, bid packages, vendor bids

**Post-Session-17 cleanup (`493e35a`):**
- Role case-insensitivity fix: JWT `role` field now lowercased before comparison (fixes `FOREMAN` vs `foreman` mismatch)
- i18n init dedup: `I18nProvider` was initializing twice on hot reload, causing flicker
- Added missing proxy GET routes for resources that had no web list endpoints

**In-app onboarding checklist (`8f82eea`):**
- `web/src/app/(dashboard)/onboarding/page.tsx` — step-by-step checklist for design partners
- Steps: create project, add team member, upload first document, create first invoice, run Blueprint Intelligence
- Completion state persisted per tenant; auto-dismisses when all steps done; shown in sidebar for new tenants

---

## Session 21 — Blueprint Intelligence
**Date:** 2026-03-25

### Summary
Added Blueprint Intelligence — automatic pre-generation of every construction schedule task organized by trade and phase. A PM selects a building type and receives a complete draft schedule in under 30 seconds with zero manual task entry. Supports template-only mode (immediate, no blueprint required) and AI vision analysis mode (requires `ANTHROPIC_API_KEY`, stubbed for testing).

### Changes

**New database tables (migration 0008):**
- `blueprint_analyses` — tracks each analysis job (template or PDF). RLS enforced.
- `blueprint_sheets` — one row per PDF page rendered. RLS enforced.
- `blueprint_proposed_tasks` — AI/template-generated tasks pending user review → imported to `schedule_tasks`. RLS enforced.

**New files:**
- `api/src/lib/blueprint-templates/` — 4 building type task templates (residential SF, residential MF, commercial, industrial). Task-level granularity with CSI MasterFormat division codes.
- `api/src/routes/v1/blueprints.ts` — 6 endpoints: `POST /analyze`, `GET /templates/:bt`, `GET /:id`, `GET /:id/tasks`, `PATCH /:id/tasks/:tid`, `POST /:id/import`
- `api/src/workers/blueprint-worker.ts` — 3 job handlers: `blueprint.analyze`, `blueprint.analyze_sheet`, `blueprint.aggregate_tasks`
- `web/src/app/(dashboard)/projects/[id]/blueprints/page.tsx` — hub UI (building type picker + optional PDF document ID)
- `web/src/app/(dashboard)/projects/[id]/blueprints/[analysisId]/review/page.tsx` — task review UI (filter by trade/phase, bulk accept/reject, inline edit, import CTA)
- `docs/Blueprint_Intelligence_v1_0.md` — full feature spec
- `.claude/skills/blueprint-intelligence/SKILL.md` — developer skill reference

**Modified files:**
- `api/src/workers/stripe-worker.ts` — registered 3 new blueprint job types in dispatcher
- `api/src/workers/file-scan-worker.ts` — auto-enqueues `blueprint.analyze` when a `plan`-type document scans clean
- `api/src/index.ts` — registered `/v1/blueprints` route
- `web/src/app/(dashboard)/projects/[id]/page.tsx` — added Blueprints tab to project detail module grid
- `CLAUDE.md` — added Blueprint Intelligence to spec docs table and module CLAUDE.md list
- `docs/Schema_Reference.md` — added Domain 13 (3 new tables + indexes)

### Decisions
- Template mode ships fully functional with no API key or blueprint PDF required
- AI vision analysis (`stubAnalyzeSheet()` in `blueprint-worker.ts`) is stubbed — single function swap when `ANTHROPIC_API_KEY` is set
- Task granularity: task-level (not line-item level) — ~45–60 tasks per building type, fast to review
- Sheet images stored in `/{tenant_id}/live/blueprints/{analysis_id}/sheets/` (A-06 compliant)

---

## Session 17 — Post-launch gap closure: html lang, T-09 compliance, integration tests
**Date:** 2026-03-23

### Summary
Closed the three remaining code gaps identified by the post-Session 16 audit. Platform is now fully ready for design partner onboarding.

### Changes

**Gap 1 — `<html lang>` dynamic update (SEO + a11y)**
- `web/src/components/i18n-provider.tsx` — added `languageChanged` listener that updates `document.documentElement.lang` when user switches language. Root layout stays as a server component (required to preserve `metadata` export); lang attribute updates client-side via the existing `I18nProvider` client component.

**Gap 2 — T-09 JWT-first locale resolution**
- `web/src/components/i18n-provider.tsx` — locale resolution now follows the correct T-09 order: `GET /api/users/me` (JWT `preferred_language`) → `localStorage` → browser locale → `'en'`. Ensures users who changed language preference on another device see the correct language on fresh session without manual toggle.
- `web/src/app/api/users/me/route.ts` — new Next.js proxy route (GET + PATCH) so the client-side `I18nProvider` can fetch the authenticated user's `language_preference` from the backend.

**Gap 3 — Integration test coverage**
Four new test files in `api/src/test/`:
- `users.test.ts` — User CRUD, role guards (403 for FIELD_TECH), Starter 5-user tier limit (402 + upgrade hint), soft-delete, self-deactivate guard
- `projects.test.ts` — Project CRUD, RLS cross-tenant isolation (GET foreign project → 404), cursor pagination, member add/remove, Starter 5-project tier limit (402)
- `financial.test.ts` — Invoice create (cents-only T-02, float → 422), optimistic locking 409 conflict, CO approve/reject status transitions
- `webhooks.test.ts` — Stripe signature validation (T-18), replay protection (stale timestamp), immediate 200 (T-19), Redis dedup prevents double-processing (T-20)

All tests registered `registerErrorHandler` so `TierEnforcementError` maps to 402 correctly.

### Decisions
- Did not convert `layout.tsx` to a client component — `metadata` export requires a Server Component in Next.js App Router. The `document.documentElement.lang` update happens in `I18nProvider` (already client) instead, achieving identical behavior.

---

## Session 16 — Web i18n Wiring (EN + ES)
**Date:** 2026-03-22

### Summary
Wired full react-i18next EN + ES support across the web frontend, satisfying locked decision P-09 (Spanish required at v1.0).

### Changes
- **i18n infrastructure:** Updated `web/src/lib/i18n.ts` to register 7 namespaces (common, projects, financial, safety, field, trade-electrical, trade-plumbing) for both EN and ES
- **I18nProvider:** Created `web/src/components/i18n-provider.tsx` — client component applying T-09 locale resolution order (localStorage → browser locale → 'en') on mount
- **Root layout:** Wrapped `<body>` with `<I18nProvider>` in `web/src/app/layout.tsx`
- **Locale files:** Created 10 new locale files (5 EN + 5 ES for financial, safety, field, trade-electrical, trade-plumbing); extended common.json and projects.json with ~80 new keys each
- **Language switcher:** Added EN/ES toggle to sidebar bottom — persists to localStorage and fires PATCH /api/users/me fire-and-forget
- **Page wiring:** Replaced all hardcoded English strings with t() calls across ~50 pages and components spanning auth, projects, financial, field, safety, estimating, trade modules, settings, notifications

### Decisions
- Safety.json contains interface labels only (not user-entered hazard/incident content) — complies with T-08 professional translation requirement
- locale resolution: localStorage key 'lang' → browser locale (if 'en' or 'es') → 'en'

---

### [2026-03-22] — Session 15 — Password Reset + Invite Flow + Billing Settings

**Type:** Critical bug fix + missing feature — blocks all real users from using the product

**Problem solved:**
- Users who forgot their password had no recovery path (permanently locked out)
- Invited users (created via `POST /v1/users`) received a random temp hash password with no email — could never log in
- Trial banner linked to `/settings/billing` which returned 404

**API — password reset infrastructure (`api/src/lib/password-reset.ts`):**
- `generateResetToken(userId, tenantId)` — generates 64-char hex token (32 random bytes), stored in Redis with 1hr TTL; invalidates any previous token for same user (one active token per user)
- `consumeResetToken(token)` — validates + deletes token atomically (single-use)
- `sendPasswordResetEmail()` + `sendInviteEmail()` — SendGrid v3 Mail Send API; same pattern as export-worker.ts; gracefully no-ops when SENDGRID_API_KEY not set

**API — new auth endpoints (added to `api/src/routes/v1/auth.ts`):**
- `POST /v1/auth/forgot-password` — body: `{ email, tenant_slug }`; always returns 200 (anti-enumeration); fires invite email if user found; fire-and-forget on email delivery
- `POST /v1/auth/reset-password` — body: `{ token, password }`; consumes Redis token; updates password_hash; activates `invited` users to `active` in same UPDATE; writes `user.password_reset` audit entry

**API — invite email on user create (`api/src/routes/v1/users.ts`):**
- After `POST /v1/users` creates an invited user: generates reset token, sends invite email with one-time set-password link (`/reset-password?token=...`); fire-and-forget

**Web — forgot-password flow:**
- `web/src/app/(auth)/forgot-password/page.tsx` — client form (Company ID + email); success shows confirmation message without leaking account existence
- `web/src/app/api/auth/forgot-password/route.ts` — POST proxy

**Web — reset-password flow:**
- `web/src/app/(auth)/reset-password/page.tsx` — reads `?token=` from URL; shows new password + confirm fields; on success redirects to login; handles expired/invalid tokens gracefully
- `web/src/app/api/auth/reset-password/route.ts` — POST proxy

**Web — login page:**
- `web/src/app/(auth)/login/page.tsx` — added "Forgot password?" link below password field; pre-populates Company ID in the forgot-password URL when known

**Web — billing settings page (fixes 404 from trial banner):**
- `web/src/app/(dashboard)/settings/billing/page.tsx` — server component; fetches subscription via `serverApi`; shows tier, status badge, trial countdown, add-ons, renewal date; upgrade section visible for trial/starter users
- `web/src/app/(dashboard)/settings/billing/billing-actions.tsx` — client component; "Upgrade to Professional" button calls `/api/billing/checkout`; same checkout flow as upgrade-prompt.tsx

**Files created:** `api/src/lib/password-reset.ts`, `web/src/app/(auth)/forgot-password/page.tsx`, `web/src/app/api/auth/forgot-password/route.ts`, `web/src/app/(auth)/reset-password/page.tsx`, `web/src/app/api/auth/reset-password/route.ts`, `web/src/app/(dashboard)/settings/billing/page.tsx`, `web/src/app/(dashboard)/settings/billing/billing-actions.tsx`

**Files modified:** `api/src/routes/v1/auth.ts` (2 new endpoints + imports), `api/src/routes/v1/users.ts` (invite email on create), `web/src/app/(auth)/login/page.tsx` (Forgot password? link)

**New env vars required:** `APP_URL` (e.g. `https://app.constructionplatform.com`) — used to build reset/invite URLs in emails

---

### [2026-03-22] — Session 14 — Self-Serve Signup + Trial Flow

**Type:** New feature — user acquisition / onboarding
**Triggered by:** Design partner demo blocker — no way to create a tenant without manual DB insert. Resolves P-05, P-06, PR-01/PR-02.

**API (`POST /v1/auth/signup`):**
- New endpoint in `api/src/routes/v1/auth.ts` — creates tenant + owner user + Professional trial subscription in a single `withTenantContext` call
- Validates slug uniqueness (409 `SLUG_TAKEN`) and body schema (422 `VALIDATION_ERROR`)
- Inserts: `tenants` (tier=professional, status=trial, trial_ends_at=NOW()+14d), `users` (role=owner), `tenant_subscriptions` (status=trial), `tenant_storage_usage` (bytes_used=0)
- Audit log entry: `tenant.created` for the new tenant
- Returns 201 `{ token, user }` — same shape as login; session starts immediately

**Web signup flow:**
- `web/src/app/(auth)/signup/page.tsx` — signup form with company name → slug auto-population (lowercase/hyphen normalization), all required fields, handles `SLUG_TAKEN` and validation errors
- `web/src/app/api/auth/signup/route.ts` — proxy route; sets `platform_token` httpOnly cookie on success, redirects to `/projects`
- `web/src/app/(auth)/login/page.tsx` — added "No account? Start a free trial" link to `/signup`

**Trial UX:**
- `web/src/components/layout/top-nav.tsx` — added amber trial banner showing days remaining; fetches `GET /api/billing/subscription` on mount; links to `/settings/billing`; hidden once tenant converts to paid

**Files created:** `web/src/app/(auth)/signup/page.tsx`, `web/src/app/api/auth/signup/route.ts`

**Files modified:** `api/src/routes/v1/auth.ts`, `web/src/app/(auth)/login/page.tsx`, `web/src/components/layout/top-nav.tsx`

---

### [2026-03-22] — Session 12 — Billing Checkout, Bid Award UI, Audit Log Export Worker

**Type:** Billing integration + web UI + background worker
**Triggered by:** Continued v1.0 build — completing billing flow, bid-to-contract UI, and audit log export.

**Billing checkout (Stripe):**
- `POST /v1/billing/checkout` — creates a Stripe Checkout Session for trial-to-paid conversion; returns `{ url }` for client redirect
- Stripe webhook handler updated to handle `checkout.session.completed` → activates subscription, updates `tenant_subscriptions`
- `/api/billing/checkout` — Next.js proxy route for the checkout POST

**Bid award UI:**
- `BidAwardActions` client component — award/decline buttons on vendor bid detail page; calls `/api/vendor-bids/[id]/award`
- `/api/vendor-bids/[id]/award` — Next.js proxy route (POST → API `POST /v1/vendor-bids/:id/award`)
- Award action auto-creates a contract record linked to the bid package (contract CRUD via existing `contracts.ts` route)

**Audit log export worker:**
- `api/src/workers/export-worker.ts` — processes `audit_log.export` jobs: queries full audit log for tenant, streams CSV to DigitalOcean Spaces (T-35/T-36/T-37), generates 7-day pre-signed URL, sends email via SendGrid + creates in-app notification
- `GET /v1/audit-log/export` — replaced 202 stub with real job dispatch via pg-boss; enforces one active export per tenant (T-36)
- Export job envelope carries `tenant_id`; worker calls `withTenantContext` before any DB query (T-10)

**Files created:** `api/src/workers/export-worker.ts`, `web/src/app/api/billing/checkout/route.ts`, `web/src/app/api/vendor-bids/[id]/award/route.ts`, `web/src/components/bid-award-actions.tsx`

**Files modified:** `api/src/routes/v1/billing.ts`, `api/src/routes/v1/audit-log.ts`, `api/src/routes/v1/webhooks/stripe.ts`, `api/src/workers/stripe-worker.ts`

---

### [2026-03-19] — Session 7 — Reconciliation Layer

**Type:** Schema + API additions — cross-domain data flow
**Triggered by:** Construction PM gap analysis — 5 operational gaps identified where v1.0 spec had strong data capture but missing automated data flow (cost, risk, schedule, contracts, payments).

**Summary:** Added the foundational reconciliation layer connecting financial, schedule, and vendor management domains. No v1.1/v2.0 features included — foundational plumbing only.

**New database tables:**
| Table | Purpose |
|-------|---------|
| `vendors` | Subcontractors, suppliers, equipment vendors |
| `contracts` | CRITICAL — governing document tying invoices, COs, payments |
| `vendor_bids` | Sub's bid response to a bid package |
| `vendor_bid_line_items` | Per-line vendor pricing |
| `schedule_tasks` | Basic project schedule (FK target for bid packages) |
| `milestones` | Billing/schedule milestones |
| `crew_assignments` | Light-touch (routes deferred to v1.1, table exists for FKs) |

**New columns on existing tables:**
| Table | New columns |
|-------|------------|
| `budget_line_items` | `committed_amount_cents`, `projected_final_cents`, `vendor_bid_id`, `contract_id` |
| `time_entries` | `budget_line_item_id`, `hourly_rate_cents` |
| `invoices` | `contract_id`, `retainage_held_cents`, `retainage_released_cents`, `stripe_payment_intent_id`, `quickbooks_invoice_id` |
| `change_orders` | `contract_id`, `schedule_impact_days`, `direction`, `vendor_id`, `reason_code` |
| `bid_packages` | `schedule_task_id` |

**New API routes:**
- `POST/GET/GET/:id/PATCH/DELETE /v1/contracts` — Contract CRUD
- `POST/GET/GET/:id/PATCH/DELETE /v1/vendors` — Vendor CRUD
- `POST/GET /v1/bid-packages/:id/bids` — Invite/list vendor bids
- `GET/PATCH/DELETE /v1/vendor-bids/:id` — Single bid operations
- `POST /v1/vendor-bids/:id/submit` — Mark bid submitted
- `POST /v1/vendor-bids/:id/award` — Award bid (declines all others for same package)
- `POST /v1/vendor-bids/:id/line-items` — Add line item to bid
- `POST/GET/GET/:id/PATCH/DELETE /v1/schedule-tasks` — Schedule task CRUD

**New change order actions:**
- `POST /v1/change-orders/:id/approve` — Approve CO; dispatches `reconciliation.budget_co_adjustment` job if contract_id set
- `POST /v1/change-orders/:id/reject` — Reject CO

**New background reconciliation jobs (4 types):**
| Job type | Trigger | Effect |
|----------|---------|--------|
| `reconciliation.field_cost_rollup` | POST/PATCH time_entry with budget_line_item_id | Re-sums `actual_cents` on budget line item from all linked time entries |
| `reconciliation.schedule_cost_projection` | PATCH schedule_task with percent_complete > 0 | Projects `projected_final_cents` = actual / (pct/100) |
| `reconciliation.budget_co_adjustment` | Approve change order with contract_id | Updates `contracts.approved_co_value_cents` = sum of approved COs |
| `reconciliation.budget_variance_alert` | Nightly at 6am UTC per tenant | Notifies PMs of projects projected 10%+ over budget |

**Files created:** `prisma/migrations/0002_reconciliation_layer/migration.sql`, `api/src/routes/v1/contracts.ts`, `api/src/routes/v1/vendors.ts`, `api/src/routes/v1/vendor-bids.ts`, `api/src/routes/v1/schedule-tasks.ts`, `api/src/workers/field-cost-worker.ts`

**Files modified:** `prisma/schema.prisma`, `api/src/index.ts`, `api/src/workers/stripe-worker.ts`, `api/src/routes/v1/change-orders.ts`, `api/src/routes/v1/invoices.ts`, `api/src/routes/v1/budget-line-items.ts`, `api/src/routes/v1/time-entries.ts`, `api/src/routes/v1/bid-packages.ts`, `docs/Schema_Reference.md`

---

### [2026-03-19] — Session 8 — Web Forms, Webhooks, Admin Routes, Mobile Foundation

**Type:** API + web frontend + mobile implementation
**Triggered by:** Continued platform build — filling v1.0 gaps identified in post-session-7 review.

**API additions:**
- `POST/GET /v1/webhooks/stripe` — Stripe webhook receiver (HMAC-SHA256 signature validation, Redis dedup, async job dispatch)
- `POST /v1/webhooks/quickbooks` — QuickBooks webhook receiver (per-entity Redis dedup with `realmId:entityName:id:operation:lastUpdated` key)
- `POST /v1/webhooks/docusign` — DocuSign webhook receiver (extracts `tenant_id` from `customFields.textCustomFields`)
- `GET/POST/DELETE /v1/admin/jobs/failed` + `POST /v1/admin/jobs/failed/:id/replay` — Super admin DLQ management
- `GET /v1/admin/tenants` + `PATCH /v1/admin/tenants/:id` — Super admin tenant list/status update
- `GET/DELETE/POST /v1/integrations/quickbooks/connect|callback|disconnect|status` — QuickBooks OAuth 2.0 flow

**Worker additions (stripe-worker.ts):**
- `handleQuickBooksEntityChanged` — resolves QB `realmId → tenant_id` via `tenant_subscriptions.quickbooks_realm_id`
- `handleDocuSignEnvelope` — updates `contracts.status` on `envelope_completed/voided/declined`

**Mobile foundation:**
- WatermelonDB schema (4 tables: projects, time_entries, daily_reports, punch_list_items) with offline-first columns
- Auth module (T-07: SecureStore only), API client, i18n (EN+ES), database initialization
- AppNavigator with auth state detection, all screen routes
- Screens: Login, Projects, ProjectDetail, TimeEntry, DailyReport

**Web forms:**
- RFI create form + `/api/rfis/route.ts` proxy
- Submittal create form + `/api/submittals/route.ts` proxy
- Bid package detail page (`/projects/[id]/estimating/[bid_package_id]/page.tsx`)

**TypeScript fixes:**
- Admin routes: `jwt.role as string` cast to resolve union-type comparison error with `'SUPER_ADMIN'`
- DocuSign/QB audit writes: `'document'` category changed to `'data'` (not in AuditCategory enum)
- Route handlers: `FastifyRequest` with `req.params as { ... }` cast instead of generic params

**Files created:** `api/src/routes/v1/webhooks/quickbooks.ts`, `api/src/routes/v1/webhooks/docusign.ts`, `api/src/routes/v1/admin.ts`, `api/src/routes/v1/integrations/quickbooks.ts`, `mobile/App.tsx`, `mobile/app.json`, `mobile/tsconfig.json`, `mobile/babel.config.js`, `mobile/src/lib/schema.ts`, `mobile/src/lib/database.ts`, `mobile/src/lib/auth.ts`, `mobile/src/lib/api.ts`, `mobile/src/lib/i18n.ts`, `mobile/src/models/*`, `mobile/src/navigation/AppNavigator.tsx`, `mobile/src/screens/*`

---

### [2026-03-19] — Session 9 — Workers, Notifications, Cross-Tenant, Mobile Sync

**Type:** Worker layer completion + notification delivery chain + cross-tenant lifecycle + mobile sweep

**Worker additions:**
- `api/src/workers/file-scan-worker.ts` — triple validation (extension allowlist + content-type category + malware scan stub), quarantine → live promotion, storage usage tracking (T-27/T-28/T-29/T-30)
- `api/src/workers/push-worker.ts` — APNs/FCM delivery stubs, per-user preference check (T-40: safety cannot be disabled), immediate token invalidation on error response (T-39)
- All new job types wired into `stripe-worker.ts` switch: `file.scan`, `file.delete`, `push.notification`, `connection.invite_sent`

**Notification delivery chain:**
- `api/src/lib/notify.ts` — `createNotification()` helper: DB insert + Redis unread increment + push job dispatch
- `field-cost-worker.ts` updated to use `createNotification()` for budget variance alerts

**Cross-tenant connection lifecycle (`api/src/routes/v1/connections.ts`):**
- `POST /v1/connections` — GC invites sub (enqueues `connection.invite_sent` job to notify sub users)
- `POST /v1/connections/:id/accept` — Sub accepts; status → 'active'
- `POST /v1/connections/:id/revoke` — Either party revokes; status → 'revoked'
- `GET /v1/connections` — List connections (both sides), cursor paginated
- `GET /v1/connections/:id/events` — Read shared_project_events for a connection (T-45 membership validation)
- `POST /v1/connections/:id/events` — Publish cross-tenant event
- `validateConnectionMembership()` helper enforces T-45 on every cross-tenant access
- No RLS on `tenant_connections` / `shared_project_events` — raw pgPool (T-44)

**Mobile additions:**
- `mobile/src/lib/sync.ts` — `runSyncSweep()` pushes pending WatermelonDB records; `pullProjects()` with T-12 version guard
- `mobile/src/screens/PunchListScreen.tsx` — offline-first list + inline add form, status badge colors, sync indicator
- AppNavigator updated with PunchList route

**Files created:** `api/src/workers/file-scan-worker.ts`, `api/src/workers/push-worker.ts`, `api/src/routes/v1/connections.ts`, `api/src/lib/notify.ts`, `mobile/src/lib/sync.ts`, `mobile/src/screens/PunchListScreen.tsx`

**Files modified:** `api/src/workers/stripe-worker.ts`, `api/src/workers/field-cost-worker.ts`, `api/src/index.ts`, `mobile/src/navigation/AppNavigator.tsx`

---

### [2026-03-20] — Session 10 — Safety, Files, Budget UI, Notifications

**Type:** Mobile screens + critical schema gap fix + web feature pages
**Triggered by:** Continued platform build from Session 9 — completing v1.0 field screens and fixing file upload flow.

**Critical gap fixed — `files` table missing:**
- `file-scan-worker.ts` (Session 9) queried `SELECT id FROM files WHERE id = $1` but the `files` table never existed
- Added `prisma/migrations/0003_files_table/migration.sql` — `file_status` enum + `files` table with quarantine_path, storage_path, status, RLS policy
- Added `File` model to `prisma/schema.prisma`
- Updated `api/src/routes/v1/files.ts` to INSERT file record + enqueue `file.scan` job before returning pre-signed URL

**Mobile additions:**
- `mobile/src/models/SafetyIncident.ts` — WatermelonDB model with offline sync fields
- `mobile/src/lib/schema.ts` — bumped version 1→2, added `safety_incidents` table
- `mobile/src/lib/sync.ts` — fixed model default→named imports; fixed `body: JSON.stringify(body)` (was raw object); added `sweepSafetyIncidents()` to sync sweep
- `mobile/src/screens/SafetyIncidentScreen.tsx` — emergency procedures always visible (T-40), severity chips with colors, offline-first write→push pattern, T-13 Tier 3 comment
- `mobile/src/screens/NotificationsScreen.tsx` — server-only (T-41 append-only), category colors, safety highlighted, mark-all-read with optimistic update
- `mobile/src/navigation/AppNavigator.tsx` — added Safety + Notifications routes, 🔔 bell icon in Projects header

**Web additions:**
- `web/src/app/(dashboard)/projects/[id]/files/page.tsx` — upload form + file browser, status badges (scanning/ready/rejected), pre-signed URL upload flow (T-27)
- `web/src/app/(dashboard)/projects/[id]/safety/new/page.tsx` — incident create form with emergency procedures reminder, severity selector
- `web/src/app/(dashboard)/projects/[id]/budget/page.tsx` — added 4-metric summary (Budget/Actual/Committed/Invoiced), line items breakdown table with variance (red when over-budget), approve/reject CO buttons
- `web/src/app/(dashboard)/projects/[id]/budget/new-line-item/page.tsx` — create form for budget line items
- `web/src/components/change-order-actions.tsx` — client component for approve/reject CO buttons
- `web/src/components/mark-all-read.tsx` — client component for mark-all-read (POST → router.refresh)
- `web/src/app/(dashboard)/notifications/page.tsx` — added MarkAllRead component

**Web API proxies created:**
`/api/files/upload-url`, `/api/files`, `/api/files/complete-upload`, `/api/safety-incidents`, `/api/budget-line-items`, `/api/change-orders/[id]/approve`, `/api/change-orders/[id]/reject`

**Files created:** `prisma/migrations/0003_files_table/migration.sql`, `mobile/src/models/SafetyIncident.ts`, `mobile/src/screens/SafetyIncidentScreen.tsx`, `mobile/src/screens/NotificationsScreen.tsx`, `web/src/app/(dashboard)/projects/[id]/files/page.tsx`, `web/src/app/(dashboard)/projects/[id]/safety/new/page.tsx`, `web/src/app/(dashboard)/projects/[id]/budget/new-line-item/page.tsx`, `web/src/components/change-order-actions.tsx`, `web/src/components/mark-all-read.tsx`

**Files modified:** `prisma/schema.prisma`, `api/src/routes/v1/files.ts`, `mobile/src/lib/schema.ts`, `mobile/src/lib/sync.ts`, `mobile/src/lib/database.ts`, `mobile/src/lib/i18n.ts`, `mobile/src/navigation/AppNavigator.tsx`, `mobile/src/screens/ProjectDetailScreen.tsx`, `web/src/app/(dashboard)/projects/[id]/budget/page.tsx`, `web/src/app/(dashboard)/projects/[id]/safety/page.tsx`, `web/src/app/(dashboard)/notifications/page.tsx`

---

### [2026-03-20] — Session 11 — Notification Preferences, Safety UI, Certifications, UX Polish

**Type:** Web UI additions + notification system completion + UX polish
**Triggered by:** Continued v1.0 build — completing remaining feature gaps after Session 10.

**Notification system completion (T-40, T-41):**
- `GET /v1/notifications/preferences` — returns per-user per-category per-channel preferences
- `PUT /v1/notifications/preferences` — upserts preference; safety category cannot be disabled (T-40 enforced)
- `/settings/notifications` — preference toggle matrix (category × channel) with safety lock UI
- `/api/notifications/preferences` — GET/PUT proxy route
- `/api/notifications/unread-count` — proxy for Redis-backed fast badge count (T-41)
- `/api/notifications/[id]/read` — PATCH proxy for individual notification mark-read
- Notification bell in TopNav now shows red unread count badge (fetched on mount)

**JSA records web UI:**
- `/projects/[id]/safety/jsa` — JSA list with hazards table (severity badges, controls, attendees with signature status)
- `/projects/[id]/safety/jsa/new` — create form with hazard builder (add/remove hazards, severity select) and attendee picker (checkbox grid)
- `/api/jsa-records` — GET/POST proxy route
- Safety page updated to show "JSA Records" button alongside "Report Incident"

**Safety certifications UI:**
- `/safety/certifications` — workforce-wide cert tracker with expiry alerts (expired banner + 30-day warning)
- `/safety/certifications/new` — add cert form with worker dropdown, OSHA/CPR cert type select, issue/expiry date picker, no-expiry checkbox
- `/api/safety-certifications` — GET/POST proxy route
- Company-wide safety dashboard now links to certifications

**UX improvements:**
- Project detail page now resolves member names (fetches users list, builds lookup map)
- Settings page adds "Notification Preferences" card linking to /settings/notifications

**Files created:** `api/src/routes/v1/notifications.ts` (preference endpoints added), `web/src/app/api/notifications/preferences/route.ts`, `web/src/app/api/notifications/unread-count/route.ts`, `web/src/app/api/notifications/[id]/read/route.ts`, `web/src/app/api/jsa-records/route.ts`, `web/src/app/api/safety-certifications/route.ts`, `web/src/app/(dashboard)/settings/notifications/page.tsx`, `web/src/app/(dashboard)/projects/[id]/safety/jsa/page.tsx`, `web/src/app/(dashboard)/projects/[id]/safety/jsa/new/page.tsx`, `web/src/app/(dashboard)/safety/certifications/page.tsx`, `web/src/app/(dashboard)/safety/certifications/new/page.tsx`

**Files modified:** `web/src/app/(dashboard)/projects/[id]/safety/page.tsx`, `web/src/app/(dashboard)/safety/page.tsx`, `web/src/app/(dashboard)/settings/page.tsx`, `web/src/app/(dashboard)/projects/[id]/page.tsx`, `web/src/components/layout/top-nav.tsx`

---

All document-level changes, product decisions, and resolutions. Most recent first.

---

### [2026-03-14] — Architecture Gap Review — Doc 03 Updated (v1.1)

**Type:** Architecture review — 14 gaps identified and resolved
**Triggered by:** Systematic review of Platform_Architecture_v1_0.docx against production readiness standards.
**Sessions:** Session 6 — full gap review and resolution

**Summary of gaps resolved:**

| # | Gap | Decision | Locked As |
|---|---|---|---|
| 1 | Background Job Tenant Context | SQS message envelope carries tenant_id. Workers apply withTenantContext(). Superadmin bypass prohibited. | T-10 |
| 2 | API Versioning Strategy | URL path /v1/ prefix. Breaking changes introduce new version. 6-month deprecation window. User-Agent required. | T-11 |
| 3 | Offline Conflict Resolution | Optimistic locking with version integer. Tiered field policy. Side-by-side resolution UI. | T-12, T-13, T-14 |
| 4 | WebSocket Tenant Isolation | One private channel per tenant. Authorization endpoint validates JWT. Server fan-out for cross-tenant events. | T-15, T-16, T-17 |
| 5 | Inbound Webhook Architecture | One endpoint per provider. Async processing. Event ID deduplication. Signature validation first. | T-18, T-19, T-20 |
| 6 | External Integration Resilience | Exponential backoff with jitter. Per-integration circuit breaker. Proactive tenant communication. | T-21, T-22, T-23 |
| 7 | File Upload Security | Quarantine model. Triple validation. Per-type size limits. Per-tier storage quotas. | T-27, T-28, T-29, T-30 |
| 8 | Audit Log Specification | Six-category comprehensive log. Hash-chained tamper evidence. Tenant admin read-only access. 7-year retention. | T-31, T-32, T-33, T-34 |
| 9 | Data Export Specification | Async ZIP archive. CSV per domain plus files. 7-day pre-signed URL delivery. CCPA compliant. | T-35, T-36, T-37 |
| 10 | Notification Infrastructure | APNs/FCM push. Token lifecycle management. Per-user preferences. Read/unread state. | T-38, T-39, T-40, T-41 |
| 11 | Prisma + RLS Compatibility | Dual client pattern. Raw pg for SET LOCAL. Prisma for migrations and non-tenant queries. | T-42, T-43 |
| 12 | shared_project_events RLS Atomicity | Exempt from standard RLS. Application-layer connection membership validation. | T-44, T-45 |
| 13 | Portal User → Full Tenant Migration | Copy with new UUIDs. Soft-delete originals. Super admin approval required. | T-46, T-47 |
| 14 | withTenantContext Exception Safety | SET LOCAL mandatory. SET SESSION prohibited. DISCARD ALL backstop. Staging validation checklist. | T-48, T-49 |

**Additional decisions made during session:**
- Staged infrastructure plan added (T-24, T-25, T-26): Platform launches on DigitalOcean (~$200-350/mo), migrates to AWS at 300+ tenants. DigitalOcean Spaces is S3-compatible — migration is configuration, not code rewrite.
- A-12 updated from "AWS recommended" to "DigitalOcean at launch, AWS at 300+ tenants"
- T-06 revised from "last-write-wins" to "optimistic locking with tiered conflict policy"

**Documents updated:** Doc 03 — Architecture (primary). Master Reference updated to v1.1.
**New locked decisions:** T-10 through T-49 (40 new decisions)
**New open questions:** OQ-13, OQ-14, OQ-15

---

### [2026-03-14] — i18n Update — All Relevant Documents

**Type:** Feature addition — language/localization support
**Triggered by:** Product decision that Spanish support is mandatory at v1.0.
**Research basis:** BLS/CPWR data — 31% of US construction workforce is Hispanic/Latino; 86% of foreign-born construction workers speak Spanish at home. National Safety Council: multilingual safety training reduces jobsite incidents by 25%.

**Documents updated:** Doc 01 (PRD), Doc 02 (MVP Scope), Doc 03 (Architecture), Doc 04 (Data Model), Doc 05 (API Spec), Doc 06 (Mobile Spec), Doc 07 (UX Brief), Doc 08 (Competitive Analysis), Doc 09 (GTM Strategy)

**Locked decisions added:** P-09, T-08, T-09
**Open questions added:** OQ-06, OQ-12

---

### [2026-03-13] — Initial Document Set — Complete (v1.0)

**Type:** Initial creation — all 13 documents
**Session:** Multi-session planning engagement — product, architecture, business documents

| # | Doc | Summary |
|---|---|---|
| 01 | PRD | Full product requirements — features, personas, integrations, non-functional requirements |
| 02 | MVP Scope | v1.0/v1.1/v2.0 feature bucketing, timeline, Definition of Done |
| 03 | Architecture | Multi-tenant design, RLS, auth, storage, cross-tenant bridge, infrastructure |
| 04 | Data Model | Full PostgreSQL schema — 10 domains, all tables, 27 indexes, migration strategy |
| 05 | API Spec | All endpoints, auth, integrations (QuickBooks bi-directional, DocuSign, Stripe, Twilio, Maps, Weather) |
| 06 | Roles & Permissions | 9 roles, full permission matrix, Sub Portal access list |
| 07 | Cross-Tenant Spec | Connection model, data governance (golden rule), shared event bridge, security, edge cases |
| 08 | UX Wireframe Brief | Design system, navigation, screen wireframes for all major views |
| 09 | Mobile Spec | React Native decision, offline-first architecture, all field screens, tech stack, app store |
| 10 | Competitive Analysis | Procore/Buildertrend/eSUB/Fieldwire/Jonas profiles, feature matrix, SWOT, battle cards |
| 11 | Pricing & Billing | 4 tiers, 9 add-ons, unit economics, 5-year ARR projection, trial conversion strategy |
| 12 | GTM Strategy | ICP, 9 channels, content/SEO, design partner program, launch plan, Series A roadmap |
| 13 | Investor Overview | Problem/solution, TAM/SAM/SOM, moat, $2.5M raise, use of funds, risks, comparables |

---

## Session Summaries

---

### Session 6 — [2026-03-14] — Architecture Gap Review

**Topic:** Systematic architecture review — 14 gaps identified, all resolved
**Initiated by:** Full review of Platform_Architecture_v1_0.docx against production readiness standards.

**Process:** Gaps reviewed one by one in order of severity (Critical → Medium → Implementation Risks). For each gap: problem explained, options presented with recommendation, decision made, spec written and locked.

**Critical gaps resolved (4):**
- Background job tenant context — SQS envelope pattern
- API versioning — /v1/ prefix + 6-month deprecation
- Offline conflict resolution — optimistic locking + tiered policy + side-by-side UI
- WebSocket tenant isolation — per-tenant channels + server fan-out

**Medium priority gaps resolved (6):**
- Inbound webhook architecture — async processing + event ID dedup
- External integration resilience — exponential backoff + circuit breaker + proactive comms
- File upload security — quarantine model + triple validation + tiered quotas
- Audit log specification — 6-category comprehensive log + hash chaining + tenant access
- Data export specification — async ZIP + CCPA compliance
- Notification infrastructure — APNs/FCM + token lifecycle + preferences + read state

**Implementation risks resolved (4):**
- Prisma + RLS compatibility — dual client pattern documented
- shared_project_events RLS atomicity — exempt from RLS, application-layer guard
- Portal user migration — copy-not-restamp + super admin approval
- withTenantContext exception safety — SET LOCAL + DISCARD ALL backstop

**Additional decisions:**
- Staged infrastructure plan (DigitalOcean → AWS migration path)
- Infrastructure cost analysis: ~$200-350/mo at launch, ~$1,000-1,200/mo at 300+ tenants
- T-06 revised: offline sync upgraded from last-write-wins to full optimistic locking

**Output:** Doc 03 Architecture regenerated as v1.1 incorporating all 14 gap resolutions. Master Reference updated to v1.1. 40 new locked decisions (T-10 through T-49).

---

### Session 5 — [2026-03-14] — Language Support

**Topic:** Internationalization and multilingual support
**Key decisions:** Spanish is v1.0 launch gate. react-i18next on web and mobile. Locale resolution order locked. Professional translators for safety content.
**Documents updated:** 9 documents — see Change Log entry [2026-03-14]

---

### Sessions 1–4 — [2026-03-13] — Full Platform Build

**Session 1 — Product Planning:** Platform concept, three-tier model, trade modules, cross-tenant architecture, pricing, MVP scope.
**Session 2 — Engineering Documents:** Architecture decisions locked, full PostgreSQL schema, tech stack finalized.
**Session 3 — Product & API Documents:** All API endpoints, roles/permissions matrix, cross-tenant spec, UX wireframe brief, mobile spec.
**Session 4 — Business Documents:** Competitive analysis, pricing & billing model, GTM strategy, investor overview.

---

*Last updated: July 8, 2026*
