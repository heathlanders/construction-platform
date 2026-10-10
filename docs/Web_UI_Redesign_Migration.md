# Web UI Redesign — Page Migration Tracker

> **One task = one session.** Pick the top unchecked task, migrate its pages onto the kit, verify,
> commit, check the box, stop. Branch: **`feat/web-ui-redesign`** (already exists — stay on it).
> The design system + kit are built; this file is only the page-by-page rollout of them.

## Status

Redesign foundation **done** (Slices 1–6, committed): theme/token engine + dark mode, the
`@/components/ui` kit + `@/components/charts`, Hybrid shell, home dashboard, DESIGN.md + guard.
**13 pages migrated** so far: home, projects list, project hub, punch-list, profitability,
financial, documents, cost-codes, connections, vendors, users, people, `/design` (kit preview).

## The migration recipe (apply to every page)

Replace inline patterns with the kit + tokens:

| Old | New (from `@/components/ui`) |
|-----|------|
| inline `STATUS_COLORS`/`_COLORS` map | `Badge` / `StatusPill` / `StatusDot` + `lib/status.ts` (`statusClasses`) |
| raw `bg-blue-600` button / `text-blue-600` link | `Button` / `text-brand-600` |
| `ring-blue-500` | `ring-brand-500` (kit inputs already do this) |
| hand-rolled `fixed inset-0` slide-over/modal | `SlideOver` / `Modal` (focus-trapped) |
| `alert()` / `confirm()` | `useToast()` / `useConfirm()` |
| bare `Loading…` | `Skeleton` / `SkeletonRows` |
| bare "No data" | `EmptyState` |
| `<table>` markup | `Table/THead/TBody/TR/TH/TD` |
| raw `<select>`/`<textarea>` | `Select` / `Textarea` |
| KPI/stat card markup | `KpiTile` |
| `bg-white` / `bg-gray-50` / `text-gray-900/700/500/400` / `border-gray-200` | `bg-surface` / `bg-surface-alt` / `text-ink` / `text-muted` / `border-line` |
| page `<h1 className="text-xl…">` + actions | `PageHeader` (titles are `text-2xl`) |

**Canonical color sources — never redefine per screen:** status → `web/src/lib/status.ts`;
severity → `web/src/lib/colors.ts` `SEVERITY`; trade → `web/src/lib/colors.ts` `TRADE_COLORS` /
`TRADE_BADGE_CLASSES`. Tokens live in `tailwind.config.ts` + `globals.css`. Full contract: `DESIGN.md`.

**Leave alone (don't force into status tokens):** JSA hazard scale `low/medium/high/critical` and
framing correction `minor/major/safety` are *domain* scales — you may color them via status tokens
but keep their logic. reactflow (overview) / gantt (timeline) / dnd-kit (board) **node** colors use
`TRADE_COLORS`/status hexes on purpose — tokenize the surrounding chrome, keep the graph coloring
(but pull any off-canonical status hexes through `lib/status`).

## Per-session workflow

1. `cd web` on branch `feat/web-ui-redesign`.
2. Dev server (hot reload) for eyeballing: `COOKIE_SECURE=false API_URL=http://localhost:3000 npx next dev -p 3002` → log in at localhost:3002. **Don't** run `npm run build` while it's up (shared `.next`).
3. Migrate the task's page(s) with the recipe. Add any new i18n keys to **both** `locales/en` and `locales/es` (or use `defaultValue` and note it).
4. Verify: `npx tsc --noEmit` clean; eyeball the page(s) in **light + dark** + a narrow width.
5. Commit: `feat(web): migrate <area> onto the kit (long-tail)`. Check the box below.
6. (Optional, end of a few tasks) stop the dev server (`fuser -k 3002/tcp`) and run `npm run build` once as a full gate.

## Tasks (top = highest traffic; do in order unless told otherwise)

- [x] **T1 — Timecards cluster.** `timecards/{page,board,clock,my}.tsx`. High traffic. `board` + `my` have status maps + slide-over-ish punch correction; use `SlideOver`, `StatusPill`, `KpiTile`, `Table`.
- [x] **T2 — Budget + core docs.** `projects/[id]/{budget/page, rfis/page, submittals/page, daily-reports/page}.tsx` (+ their `new*` forms). budget has `confirm()` + inline slide-over; rfis/submittals are list+slide-over.
- [x] **T3 — Field pages B.** `projects/[id]/{milestones/page, inspections/page, contracts/page, crew-assignments/page, members/page, time-entries/page}.tsx` (+ `new*`). Several have `confirm()` (milestones, crew-assignments, members, time-entries).
- [x] **T4 — Estimating.** `projects/[id]/estimating/{page,[bid_package_id]/page,new,[bid_package_id]/new-bid,[bid_package_id]/new-takeoff-item}.tsx`. `[bid_package_id]` has `confirm()`. Some are zero-`t()` (English-only — keep or add keys, note it).
- [x] **T5 — Schedule / Board / Overview / Timeline.** `projects/[id]/{schedule/page, board/page, overview/page, timeline/page}.tsx`. Tokenize chrome + pull off-canonical status hexes into `lib/status`; **keep** the reactflow/gantt/dnd node coloring. `overview` has `confirm()`.
- [x] **T6 — Trade / structural.** `projects/[id]/{concrete,framing,roofing,hvac}/page.tsx`. Expandable child-record tables with inline off-canonical `STATUS_COLORS` (the "different blue"); route through `lib/status`. framing severity `minor/major/safety` = domain scale (see note).
- [x] **T7 — Permits.** `projects/[id]/permits/{page,[permitId]/page}.tsx`. Trade-aware; lots of `bg-blue-600` + status maps + the AHJ inspection timeline.
- [x] **T8 — Blueprints.** `projects/[id]/blueprints/{page,[analysisId]/review/page}.tsx`. review uses `TRADE_BADGE_CLASSES` (already canonical-ish) + status; page has `alert()`. i18n under `projects.blueprints.*`.
- [x] **T9 — Files / project-documents / task detail.** `projects/[id]/{files/page, documents/page, tasks/[taskId]/page}.tsx`. files has off-canonical status hexes + string-interpolated chip bg (`…15`). tasks/[taskId] wraps the shared `task-detail-panel` — mostly re-skin the page shell.
- [x] **T10 — Safety (project).** `projects/[id]/safety/{page,new/page,jsa/page,jsa/new/page}.tsx`. `safety/new` SEVERITY already canonical (from `lib/colors`); JSA hazard scale = domain (keep). Tokenize + kit forms.
- [x] **T11 — Safety certifications (top-level).** `safety/{certifications/page,certifications/new/page,page}.tsx`.
- [x] **T12 — Settings cluster.** `settings/{page,org,billing,notifications,payroll,api-keys,audit-log}/page.tsx`. `settings/page` + `payroll` have lots of `bg-blue-600`; audit-log has status maps.
- [x] **T13 — List detail + forms.** `vendors/[id]/page`, `vendors/new`, `users/new`, `people/[id]/page`, `connections/[id]/page`. connections/[id] has `confirm()` + status. vendors/[id] heavy `bg-blue-600`.
- [x] **T14 — Misc top-level.** `notifications/page.tsx`, `projects/new/page.tsx`.
- [x] **T15 — Assets (Business+).** `assets/{page,[id]/page,insurance/page,inspection-templates/page}.tsx`. Large — `[id]` is a 9-tab detail (consider the kit `Tabs`). Heavy `bg-blue-600`. Lower traffic (Business+ gate).
- [x] **T16 — Warranties (Business+).** `warranties/{page,[id]/page,[id]/claims/[claimId]/page,insurance/page,templates/page}.tsx`. Large — most `bg-blue-600` + status maps of any area.

## Closeout (after all boxes checked)

- Refresh `DESIGN.md` Appendix A: move the "page-migration backlog" to done; note any leftover
  `defaultValue`-only i18n strings + the `TRADE_BADGE_CLASSES` hue-drift reconciliation (still open).
- Full `npm run build` gate + a light/dark pass across a sample of areas.
- Open a PR from `feat/web-ui-redesign` → `main` (do not merge without review).
