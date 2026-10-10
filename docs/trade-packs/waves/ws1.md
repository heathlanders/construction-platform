# Wave S1 — Surface the knowledge (web + mobile)

**Branch:** `feat/trade-packs-ws1` · **Runs after:** Wave 03 merged (≥ 26 draft packs exist)
**Exit:** field users actually see pack knowledge; all chrome EN+ES; no new tables.

Load first: skills `task-buildout`, `mobile-role-nav`, `offline-sync`, `i18n`; `DESIGN.md` (web kit + tokens).

## 1. Task detail — QA checklist (web)
- `web/src/components/tasks/task-detail-panel.tsx`: new **QA Checklist** section under Work Steps.
  Fetch `/api/v1/trades/<task.trade_type>/knowledge?lang=<i18n.language>` (catch-all proxy). Render
  `qa_checklist` grouped by phase; the items the task's own steps reference (`qa_ids`) first.
  Read-only checkbox UI for v1 (no persistence — persistence is a later wave with a migration).
- ES pending items render the EN text with an "English only — translation pending" chip; never show
  EN text as if it were ES.
- i18n: `projects.task_detail.qa_*` keys EN+ES.

## 2. JSA hazard suggestions (web + mobile)
- Web JSA create form (`web/src/app/(dashboard)/projects/[id]/safety/jsa/new/page.tsx`) and mobile
  `mobile/src/screens/JSAScreen.tsx`: button **"Suggest hazards"** → collect distinct `trade_type`s of
  the project's tasks scheduled for the JSA date (in progress or planned that day), call
  `GET /v1/trades/hazards?keys=…`, show a pick list (hazard · controls · OSHA ref · severity).
- ⚠️ The route's `HazardSchema` (`api/src/routes/v1/jsa-records.ts`) is
  `{description, controls?: string, severity?: 'low'|'medium'|'high'|'critical'}` and zod **strips
  unknown keys**. Either (a) map on the client: `description = hazard`, `controls = controls.join('; ') +
  ' (OSHA ' + osha_ref + ')'`, severity 1→low 2→medium 3→high 4→critical; or (b) widen `HazardSchema`
  with optional `osha_ref`, `hazard_id`, `pack_version`, `source` and mirror them in the batch-sync
  `jsa_records` path. Prefer (b) — provenance is the point — and add a test that the fields survive
  both POST and `/v1/sync/push`. Column stays free-form JSONB: **no migration**.
- Mobile offline: cache the last hazards response per key set in AsyncStorage (`opt:hazards:<keys>`),
  fall back offline (same pattern as the cost-code picker). JS-only → OTA.
- Severity mapping pack 1–4 → low/medium/high/critical; document it in the spec.
- Spanish: hazards with `pending_human_translation` show EN + pending chip in ES UI (T-08).

## 3. Estimate baseline badge (web)
- Estimate detail line grid: lines whose assumptions include `[pack …]` and whose source assembly
  value is `estimate` confidence get a "Platform baseline — tune to your costs" badge linking to the
  catalog editor. Needs the generator to stamp `confidence` into the assumption string (Wave 0b
  `seedFromPacks` assumption prefix `[pack <key>@<ver> · estimate]`).

## 4. Tests / verify
- Web: `tsc`; manual check on the local stack (task detail QA for a `framing` task; JSA suggest on a
  project with framing + roofing tasks today) in EN and ES.
- Mobile: `tsc`, `jest`; Maestro flow `jsa-suggest-hazards.yaml` (online) added to `mobile/.maestro/`.
- API: endpoint tests already in 0b; add one for multi-key hazards dedupe.
- `scripts/ci-local.sh --report`.
