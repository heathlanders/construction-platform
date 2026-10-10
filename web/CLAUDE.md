# Web Frontend — Claude Code Context

## Spec docs for this module
@../docs/Platform_UX_Wireframe_Brief_v1_0.docx
@../docs/Platform_PRD_v1_0.docx
@../docs/Platform_Roles_Permissions_v1_0.docx

## Stack (locked)
- React + Next.js (App Router)
- react-i18next for EN + ES
- Server components by default
- "use client" only when required for interactivity

## Role-based UI visibility
UI elements must respect the 9-role permission matrix.
Load role from JWT claim. Never derive permissions client-side from UI state.
See: @../docs/Platform_Roles_Permissions_v1_0.docx

## i18n
All user-facing strings via react-i18next.
Same key namespace as mobile (shared translation files).
Dashboard is **fully keyed EN+ES** (F1–F7 followups, 2026-07-10) — every `t(..,{defaultValue})`
key exists in both `locales/{en,es}`; `defaultValue` args are English safety nets only. Keep it that
way (namespace-aware audit, not bare `grep`). See skill + memory `web_ui_redesign`.
See skill: @../.claude/skills/i18n/SKILL.md

## Design system
**`DESIGN.md` (repo root) is the source of truth** — in-house kit (`@/components/ui`) + semantic
tokens + dark mode; canonical status colors (`lib/status.ts`), trade colors (`lib/colors.ts`:
`TRADE_COLORS` hex is canonical, `TRADE_BADGE_CLASSES` its reconciled Tailwind-family shadow).
Redesign history: `docs/Web_UI_Redesign_{Migration,Followups}.md`, memory `web_ui_redesign`.
See UX Wireframe Brief for legacy component specs, color palette, navigation patterns.

## Detail/edit pattern (Sessions 25–26)
Every list row across the dashboard uses a **slide-over panel** for click-to-edit.
Pattern: `onClick → setSelectedItem(row) → <SlideOver open={!!selectedItem}>` with GET+PATCH via Next.js API proxy.
All edit forms submit PATCH to `web/src/app/api/{resource}/[id]/route.ts`.
Every major resource has a corresponding `[id]/route.ts` proxy (punch-list-items, safety-incidents, inspections, daily-reports, rfis, submittals, contracts, vendors, time-entries, invoices, budget-line-items, takeoff-items, schedule-tasks, electrical-panels, plumbing-systems).

**Proxy auth pattern + `/api/v1` catch-all:** each proxy reads the `platform_token` cookie and forwards to `${API_URL}/v1/...` with `Authorization: Bearer` + `User-Agent`. Pages that call `/api/v1/<path>` **directly** (rather than a per-resource `/api/{resource}` proxy) — notably the Blueprint review page's `/api/v1/blueprints/:id[/tasks[/:tid]|/import]` — are served by the catch-all `web/src/app/api/v1/[...path]/route.ts` (forwards any method + query + body, returns 401 with no cookie). Before that catch-all existed those calls 404'd at the Next layer. The web container runs a **production build** (`node server.js`, no source mount) → new routes need `docker compose build web && docker compose up -d web` to take effect.

## Asset management pages (Session 29) — Business+ only
- `assets/page.tsx` — dashboard: summary cards, alert panel (expiring items, OOS count, checked-out tools), asset list with filters
- `assets/[id]/page.tsx` — 9-tab detail: Overview | Service | Inspections | Warranties | Insurance | Registration | Fuel | Depreciation | Documents
- `assets/insurance/page.tsx` — fleet-level insurance policy management
- `assets/inspection-templates/page.tsx` — OSHA/DOT checklist template management
- API proxies: `web/src/app/api/assets/`, `web/src/app/api/asset-groups/`, `web/src/app/api/asset-insurance-policies/`, `web/src/app/api/asset-inspection-templates/`
- Slide-over pattern (Sessions 25–26 standard) used on all list views within asset detail tabs

## Blueprint hub + review (Session 45 — 2026-07-02)
- `projects/[id]/blueprints/page.tsx` — hub: building-type grid, **document picker** (fetches `/api/v1/documents?project_id=`, plans sorted first — replaced the raw-UUID paste field), and a **Previous analyses** history section (`GET /api/v1/blueprints?project_id=` — status chip, source, task count, timestamp, Open review link, Delete for owner/PM via `/api/auth/me`; imported runs not deletable).
- `projects/[id]/blueprints/[analysisId]/review/page.tsx` — review: **cursor-follow** task fetch (>100 proposed tasks no longer clip), live **progress spinner** while processing (reads `import_metadata.progress` — "OCR sheet N of M" + progress bar for scanned PDFs), **Delete & start over** on failed analyses, source chip incl. `ocr_extraction`.
- `projects/[id]/blueprints/layout.tsx` — server `RoleGate` allow owner/project_manager/foreman → redirect to the project page.
- **i18n:** everything under `projects.blueprints.*` (EN+ES, ~60 keys); phase labels reuse `overview.phase_labels`. Both pages call the API through the `/api/v1/[...path]` catch-all proxy.

## Priced Estimates + cost catalog (Session 46 — estimating engine)
- `projects/[id]/estimates/page.tsx` — list + inline create (name/mode/trade/labor-rate/markups). Distinct from `/estimating` (the older bid-package/takeoff surface). Reached via the "💲 Estimates" project tile.
- `projects/[id]/estimates/[estimateId]/page.tsx` — editable **line-item grid** (row click → inline editor for qty/material-unit/labor-hrs/waste; optimistic `version` PATCH), **Pricing & markups** panel (blur-save → header recompute), **Generate** (building_sf for parametric + include-takeoff), add manual line, totals footer (material/labor/equip/subtotal/markup/total), per-line **assumptions**, **Create bid package** + **Award** actions (awarded → locked). `Fragment` key on the row+editor pair.
- `settings/estimating/page.tsx` — cost catalog editor: trade tabs, create/edit/delete **tenant** assemblies; **system** rows show 🔒 (read-only) + a "System" tag; tenant rows tagged "Yours". **Learn-from-actuals (Phase 2c):** each row fetches `GET /api/v1/estimate-assemblies/suggestions?trade=` and shows "📊 your actuals suggest $X (n) · Y hr/unit (m)" + **Apply to my catalog** (tenant row → PATCH; system row → create tenant override). i18n `estimates.actuals_hint`/`apply_actuals`/`samples`/`hpu_short` EN+ES.
- All via the `/api/v1/[...path]` catch-all proxy (no per-resource proxy). **i18n:** `projects.estimates.*` (EN+ES chrome; catalog item names + assumptions are English data, ES v1.1). See skill `estimating`.

## Design Studio — client visualizer (2026-10-06; proposed T-65)
- Client wizard `(portal)/portal/studio/**` is **trade-agnostic**: it renders the localized steps from `GET /v1/client-portal/studio/trades/:key/intake` with one component per field type (`components/studio/`). Never add per-trade UI — add an intake module in the API. Magic-link landing `(portal-auth)/portal/studio/start` (middleware `OPEN_PATHS`) → `/api/portal/studio/exchange` sets the cookie.
- Contractor `(dashboard)/client-requests/**` (inbox, review, estimate, decline) + `settings/studio` (offerings). Project-less estimates open at `(dashboard)/estimates/[estimateId]` (re-exports the project estimate page; back link → /client-requests).
- i18n namespace `studio` (EN+ES, registered in `lib/i18n.ts`); trade content arrives bilingual from the API. Photos are re-encoded via canvas (orientation + EXIF strip) before upload. See skill `design-studio`.

## Project Overview DAG (Session 33)
- `projects/[id]/overview/page.tsx` — **reactflow** dependency graph. Nodes = schedule tasks (colored by trade via `TRADE_COLORS`, status via left-border `STATUS_COLORS`), edges = prerequisites (`origin='manual'` edges drawn blue). **Phase-column auto-layout** (x = PHASE_ORDER index × COLUMN_WIDTH, y = row) — no dagre. Summary stat cards on top; click node → slide-over edit (status/dates) via `/api/projects/[id]/schedule-tasks/[taskId]` PATCH with optimistic `version`. Proxy: `web/src/app/api/projects/[id]/overview/route.ts` → `GET /v1/projects/:id/overview`. Reached via the "🕸 Overview" highlighted tile on the project page.
- **i18n:** the `overview` block in `locales/{en,es}/projects.json` covers all chrome — stat labels, empty/edit strings, `phase_labels`, `status_labels` (phase column headers + status legend + status dropdown all run through `t()`). **Task titles + trade names render in English by design** — they're DB data from the English-only blueprint templates; task-title i18n is a v1.1 item (see Blueprint_Intelligence_v1_0.md). A blueprint-imported graph is therefore Spanish-chrome + English task names until then.

## Task detail + codes + QA photos + Work Steps (Session 41)
- `components/tasks/task-detail-panel.tsx` — **shared** client component used by BOTH the Overview slide-over (click a node) AND the full page `projects/[id]/tasks/[taskId]/page.tsx`. Fetches `/api/projects/[id]/schedule-tasks/[taskId]/detail`. Sections: editable **Details** (status/%/description/assignee/planned+actual dates/trade/phase — OWNER/PM only, others read-only), **Work Steps** (laborer-facing: instruction + code-ref badges + gating-inspection + tools/materials/safety/qa; "Rebuild steps" → `POST …/build-steps`, OWNER/PM), **Codes & Compliance** (task-scoped — only the inspections this task's steps gate, with live status dots + `task_code_refs`), **QA Photos** (upload via existing `/api/files/upload-url` → poll → `POST …/photos`; thumbnails via presigned `download_url`; delete OWNER/PM or uploader), **Dependencies**.
- Client role gating via `web/src/app/api/auth/me/route.ts` (reads `getSession()` → `{role}`); API still enforces.
- Proxies: `web/src/app/api/projects/[id]/schedule-tasks/[taskId]/{detail,photos,build-steps}/route.ts` + `photos/[photoId]/route.ts`. The full task page is a server component that passes `session.role` to the panel.
- **i18n:** `task_detail.*` block in `locales/{en,es}/projects.json` (chrome EN+ES). Step CONTENT + task titles are English data (ES = v1.1).
- See skill: @../.claude/skills/task-buildout/SKILL.md

## Time tracking & payroll pages (Sessions 22–26)
- `timecards/page.tsx` — timecard hub / review (approve-reject).
- `timecards/board/page.tsx` — live on-the-clock board, punch-correction slide-over, 60s refresh.
- `timecards/my/page.tsx` — worker's own week (open/submit).
- `timecards/clock/page.tsx` — clock in/out with project + cost-code selectors, today + week summary.
- `settings/payroll/page.tsx` — per-user rates + provider integration hub.
- `projects/[id]/time-entries/page.tsx` — per-project entries + slide-over edit + cost totals.
- Proxies: `web/src/app/api/{time-entries,timecards,time-punches,payroll,payroll-settings}/`.
- **i18n:** `field` namespace (`field.{timecards,time_entries,time_punches,board}.*`) — EN+ES complete.
- **Role gating (server-side):** `RoleGate` (`web/src/components/auth/role-gate.tsx`) reads JWT role via `getSession()` and redirects disallowed roles. `/timecards` (review) + `/timecards/board` → owner/project_manager; `/timecards/clock` → owner/project_manager/foreman/field_tech; `/timecards/my` → open. Subroutes gate via folder `layout.tsx`; the index review page is a server gate wrapping `review-client.tsx`. Defense-in-depth — API still enforces. Disallowed → redirect `/timecards/my`.

## Notable pages (Sessions 25–28)
- `vendors/[id]/page.tsx` — full vendor detail with edit form
- `projects/[id]/concrete/page.tsx` — concrete pours with **expandable per-pour test records** (ACI 318 cylinder/slump/air/temp, pass/fail vs specified). Proxies: `api/concrete-test-records/`.
- `projects/[id]/roofing/page.tsx` — roofing systems with **expandable per-system QA records** (deck/dry-in/flashing/seam-weld/fastener-pull/water test). Proxies: `api/roofing-qa-records/`.
- `projects/[id]/framing/page.tsx` — framing inspections with **expandable per-inspection correction items** (open→in_progress→resolved, inline status set). Proxies: `api/framing-correction-items/`.
- `projects/[id]/permits/page.tsx` — **trade-aware** permit list + NewPermitSlideOver. Trade selector (electrical/plumbing/mechanical); jurisdiction info box re-fetches per trade from the matching codes proxy; trade filter chips; generic `code_type code_edition` badge (legacy `NEC nec_edition` fallback). Reached via the "📋 Permits" module tile on the project page.
- `projects/[id]/permits/[permitId]/page.tsx` — permit detail + visual AHJ inspection timeline (colored dots, inline date/inspector/result editing). Trade-neutral: permit_type badge, generic code badge, inspection labels from the stored `title` (trade-correct).
- Permit-create slide-over (`permits/page.tsx` NewPermitSlideOver) shows a green **matched-AHJ box** (sub-state Authority Having Jurisdiction) and auto-fills the AHJ name/phone/address/contact fields from the jurisdiction engine via `/api/jurisdictions/ahj?state=&city=&county_fips=` (only fills blanks / its own prior autofill). Project create form (`projects/new/page.tsx`) has optional County FIPS / county name override fields (drive the engine; blank → derived from ZIP). Jurisdiction proxies: `web/src/app/api/jurisdictions/{resolve,ahj}/route.ts` + `.../jurisdictions/route.ts` (list).
- Codes proxies: `web/src/app/api/{electrical,plumbing,mechanical,building}-codes/jurisdiction/[state]/route.ts` — read-only jurisdiction lookups per trade. Permit trades: Electrical, Plumbing, Mechanical (HVAC), Building (roofing/concrete/framing — `permit_type='building'`, ICC family shown since IRC/IBC is occupancy-derived).
