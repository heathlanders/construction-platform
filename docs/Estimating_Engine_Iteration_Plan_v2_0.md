# Estimating Engine — Iteration Plan v2 (next session)
**Branch:** `feat/estimating-engine` (pushed; **NOT merged**) → **PR #7** (private repository).
**Base spec:** `docs/Estimating_Engine_v1_0.md` · **Skill:** `.claude/skills/estimating/SKILL.md` · **Locked:** T-63 · **Memory:** `estimating_engine`.
**Supersedes** `docs/Estimating_Engine_Iteration_Plan_v1_0.md` (Phases 0/1/3 there are ✅; this doc carries the remainder).

---

## State at handoff (2026-07-13)

| Phase | Status | Commit / migration |
|-------|--------|--------------------|
| 0 — live verify + PR | ✅ | PR #7 opened; 277/277 then 289/289 API tests |
| 1 — proposal PDF | ✅ | `07dbf95`, migration 0029, `lib/estimate-pdf.ts` (pdfkit), 9 tests, live-verified |
| 3 — catalog depth | ✅ | `4a61c6e`, migration 0030 (+26 → 60 system rows), building seeder, 3 tests |
| **2a — attribution link** | ✅ | migration 0031 (`assembly_code` on `budget_line_items` + `takeoff_items`), stamped by `/award` + `/to-bid-package`, 11 route tests green |
| **2b — suggestions endpoint** | ✅ | `GET /v1/estimate-assemblies/suggestions?trade=` — `getAssemblySuggestions()` in `services/estimates.ts`; 2 route tests (synthetic seed: material AVG + labor hr/unit + empty degrade) |
| **2c — web apply-to-catalog** | ✅ | catalog editor shows "📊 your actuals suggest …" per row + "Apply to my catalog" (tenant PATCH / system→create override); i18n EN+ES |
| **4 — richer auto-takeoff** | ⬜ TODO | — |
| **5 — mobile + polish** | ⬜ TODO (likely v1.1) | — |
| **6 — close out / merge** | ⬜ TODO | — |

**Migrations 0029 + 0030 are already applied to the dev DB** (`platform_dev`). All work is on-disk +
pushed. `git log main..feat/estimating-engine` = 7 commits (4 base + proposal + catalog-depth + this doc).

### Verified guardrails (keep holding — T-63)
cents/FLOOR (T-02) · optimistic lock (T-12) · RLS+FORCE+WITH CHECK (A-03) · **burdened labor snapshot on
the estimate, NOT `user_payroll_settings`** · **no tier gate** · engine pure/no-AI · every generated line
keeps `assumptions[]`.

### Session recipes (reuse for live smoke)
- **DB:** container `platform_postgres`, db `platform_dev`, user `postgres` (`docker exec platform_postgres psql -U postgres -d platform_dev`).
- **Example Builders tenant** (only real data): tenant, project and owner user IDs omitted (`owner@example-builders.test`), professional tier.
- **Forged-JWT smoke:** run a node script **inside `platform_api`** with `NODE_PATH=/app/api/node_modules` (jsonwebtoken lives there); sign with `process.env.JWT_SECRET`, payload `{jti,user_id,tenant_id,role:'OWNER',email,preferred_language:'en'}`. ⚠️ Only set `Content-Type: application/json` when there IS a body (empty-body POST + JSON CT → Fastify 400). Clean up smoke rows after (est/lines/bid_pkg/budget/audit) — dev DB holds real Example Builders data.
- **Deploy to live stack:** `docker compose build api web && docker compose up -d api web` (containers run prod builds — source changes need a rebuild). `docker compose up -d` with a bare `&` gets reaped — use a real background run.
- **Example Builders blueprint facts are thin** (its OCR has no window/door/room counts) → assembly-mode building/plumbing/mechanical seeders return `[]` there. Live-exercising seeders needs a tenant with real extracted facts (or synthetic seed).

---

## Phase 2 — Learn-from-actuals (the moat) — DEFERRED, needs groundwork

**Why deferred:** (a) **no FK** ties historical actuals to `estimate_assemblies`; (b) Example Builders has **0 costed
`time_entries`, 0 `vendor_bid_line_items`, 0 `cost_codes`** → nothing to learn from or verify against.

**Attribution reality (what CAN join):**
- **Labor** → `time_entries.hourly_rate_cents` × `hours_worked`, grouped by `cost_code_id`. Bridge to an
  assembly is only via convention: `cost_codes.code` ↔ assembly `csi_division` (loose).
- **Material** → awarded `vendor_bid_line_items.unit_cost_cents` → `takeoff_item_id` → `takeoff_items`
  (created by `/to-bid-package` from estimate lines, which carry `assembly_code`) → the source assembly.
  This chain is real but description-based and only exists after a bid is awarded.

**Recommended sequence (do 2a before 2b):**
- **2a — clean attribution link (migration). ✅ DONE (migration 0031).** `assembly_code TEXT` (nullable,
  backfill-safe) added to `budget_line_items` + `takeoff_items`, each with a partial index
  `(tenant_id, assembly_code) WHERE assembly_code IS NOT NULL`. `/estimates/:id/award` stamps
  `budget_line_items.assembly_code = estimate_line_items.assembly_code` (labor actuals →
  `actual_cents` via field-cost-worker → assembly). `/estimates/:id/to-bid-package` stamps
  `takeoff_items.assembly_code` (material chain: awarded `vendor_bid_line_items.unit_cost_cents` →
  `takeoff_item_id` → takeoff → assembly — no new column on vendor bid lines needed). RLS unchanged
  (existing enabled+forced covers the new cols). `budget_line_items` already had `cost_code_id` (0007).
  Tests: `estimates-routes.test.ts` asserts ≥4 stamped rows after both routes (11 pass).
- **2b — `GET /v1/estimate-assemblies/suggestions?trade=` ✅ DONE.** Read-only, deterministic (no AI):
  per `(trade, code)` returns `{ current_material_cents, current_labor_hours_per_unit,
  suggested_material_cents?, suggested_labor_hours_per_unit?, material_sample_size, labor_sample_size,
  source:'tenant_actuals' }`. Material = `AVG(awarded vendor_bid_line_items.unit_cost_cents)` keyed via
  `takeoff_items.assembly_code`; labor = `SUM(costed time_entries.hours_worked) / SUM(takeoff quantity)`
  keyed via `budget_line_items.assembly_code`. Only emits codes that resolve to a catalog assembly.
  **Degrades silently to `[]`** when no history (the state for every real tenant today). Read = any authed.
- **2c — web ✅ DONE** (catalog editor `settings/estimating`): each row shows "📊 your actuals suggest
  $X (n samples) · Y hr/unit (m samples)" + one-click **"Apply to my catalog"** (tenant row → PATCH;
  system row → create a tenant override). i18n EN+ES.
- **Verified:** `estimate-suggestions.test.ts` seeds a synthetic tenant with an awarded bid + costed
  time entries → asserts material AVG (1200¢), labor 0.8 hr/unit, sample sizes, and empty degrade.
- **Guards held:** advisory only (never auto-overwrites); cents/FLOOR; no tier gate; tenant-scoped
  (RLS — never cross-tenant actuals).

## Phase 4 — Richer auto-takeoff

Goal: make assembly-mode seeding fuller by improving the **blueprint facts** the seeders read
(`window_count`/`door_count`/`rooms[].area_sf`/`fixtures[].count`/`components[]`).
- [ ] Improve fixture/room/opening **counts** in the text + OCR extraction path (`api/src/lib/blueprint-pdf/parse-sheets.ts`) so `buildBlueprintFacts` (`lib/task-buildout/facts.ts`) yields non-null counts. This is the real lever — the seeders (`quantities.ts`) already consume these facts; they just get `[]`/thin because extraction rarely fills them (esp. OCR). **Coordinate with Blueprint Intelligence** (`blueprint_gap_remediation`, `madison_blueprint_ocr` memories) — this is cross-cutting into that subsystem, value bounded by OCR quality.
- [ ] Optional: seed quantities directly from `blueprint_proposed_tasks` where a task maps to an assembly (a second source besides facts).
- [ ] Extend `quantities.ts` plumbing fixture map (`PLUMB_FIXTURE_CODE`) + mechanical seeder to more tokens once the fixture-token vocabulary from `parse-sheets.ts` is confirmed (don't guess tokens — verify against `FIXTURE_TOKENS`). Unit-test each addition.
- Note: this phase's ceiling is extraction accuracy, not estimating code. Scope it against the blueprint roadmap, not just the engine.

## Phase 5 — Mobile (light) + polish  (recommend v1.1)

- [ ] **Confirm with user first** — Estimator is a **web-first** role (Mobile Enterprise Plan). Options: (a) mobile **read-only** estimate view; (b) skip to v1.1. Recommendation: defer to v1.1.
- [ ] ES translation of **catalog item names + `assumptions[]`** — this is DATA (like blueprint task titles), a v1.1 data task; chrome is already EN+ES. (Follow the i18n skill: data rows render as stored; safety strings need human translation.)
- [ ] Optional: estimate ↔ GC/sub bid bridge (cross-tenant, v1.1 — P-02 gated).

## Phase 6 — Close out

- [ ] Final pass on `Estimating_Engine_v1_0.md` + skill (already updated through Phase 3 — reconcile any Phase 2/4 additions).
- [ ] `estimating_engine` memory already exists — update it with anything new.
- [ ] **Merge PR #7 → main** (user decision). `main` auto-ships mobile OTA only if `mobile/` changed — this branch has **no mobile changes**, so merge is web/api/docs only. Confirm the full API suite is green on the final HEAD before merge.

---

### Key files (all present on branch)
```
api/src/lib/estimating/{types,math,quantities,index}.ts   — pure engine (quantities.ts has seedBuilding)
api/src/lib/estimate-pdf.ts                               — proposal PDF (pdfkit)
api/src/services/estimates.ts                             — loadCatalog / generate / recompute
api/src/routes/v1/{estimates,estimate-assemblies}.ts      — routes (estimates incl. /proposal)
api/src/test/{estimating-engine,estimates-routes,estimate-proposal}.test.ts
api/src/lib/storage.ts                                    — generateDownloadUrl(path, ttl=900)
prisma/migrations/0028_estimating_engine/                 — 3 tables + 34 seeded rows
prisma/migrations/0029_estimate_proposal/                 — estimates.proposal_path/_generated_at
prisma/migrations/0030_estimate_catalog_expansion/        — +26 depth assemblies (→60)
web/src/app/(dashboard)/projects/[id]/estimates/**        — list + detail (proposal controls)
web/src/app/(dashboard)/settings/estimating/page.tsx      — catalog editor (Phase 2c target)
web/locales/{en,es}/projects.json                         — projects.estimates.*
```
