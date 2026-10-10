# Estimating Engine Skill
**Feature added: Session 46 (2026-07-13)**
**See full spec: @docs/Estimating_Engine_v1_0.md**
**Locked decisions: T-02, T-12, A-03, T-63**
**Builds on: blueprint-intelligence (facts), jurisdictions/trade-map (tradeToPermitTrade), task-buildout pattern**

## What this feature does

Deterministic sub-level job estimating. Prices a job as
`quantities → assembly (material + labor_hrs×burdened_rate + equipment) × (1+waste%) → markups → bid`.
No AI, reproducible, auditable — every generated line carries `assumptions[]`. Quantities come from
blueprint facts (assembly mode) or `building_sf × trade $/SF` (parametric mode), or existing
`takeoff_items`. **No tier gate.**

## Key invariants

1. **3 tables tenant-scoped, RLS enabled + forced with WITH CHECK** (`estimate_assemblies`,
   `estimates`, `estimate_line_items`). Migration 0028.
2. **Catalog cascade**: `estimate_assemblies` has **system rows** (sentinel tenant
   `00000000-0000-0000-0000-000000000000`, `is_system=TRUE`, readable by all via RLS
   `USING(own OR is_system)`) + **tenant rows**. A tenant row with the same `(trade, code)` OVERRIDES
   the system row (`loadCatalog` orders `is_system DESC` so tenant overwrites the map by code).
   **WITH CHECK(own)** blocks writing system rows; routes also pre-check `is_system` → 403.
3. **Money in cents, always FLOOR** (T-02). `computeAmounts`/`computeTotals` in `lib/estimating/math.ts`.
4. **Burdened labor** (T-63): `labor_cents = FLOOR(labor_hours × estimate.labor_rate_cents)`. Rate is
   a burdened $/hr snapshot ON THE ESTIMATE — NOT read live from `user_payroll_settings`.
5. **Markup order**: overhead on subtotal; profit on (subtotal+overhead); tax on **material only**;
   contingency on subtotal. Wires the previously-dormant markup concept (estimate-local, not the
   project `markups` table).
6. **Engine is pure** (`lib/estimating/`, mirrors task-buildout/jurisdictions). `buildEstimateLines`
   never throws on a missing catalog code — emits a zero-cost line + an explicit assumption.
7. **Generate replaces `source='rule_engine'` lines, preserves `manual`** (like task_steps rebuild).
   `recomputeEstimateTotals` recomputes line amounts at the CURRENT rate + rolls up header — WITHOUT
   bumping line `version` (internal reconcile, never a client 409).
8. **Optimistic locking** (T-12): `version` on estimates + line items; 409 `VERSION_CONFLICT`.
9. **Awarded is locked**: PATCH/generate/line-edit on an `awarded` estimate → 409 `ESTIMATE_AWARDED`.
   Award seeds `budget_line_items` (closes the loop with `field-cost-worker`).
10. **Roles**: read = any authed; write = OWNER / PROJECT_MANAGER / ESTIMATOR.
11. **Proposal PDF** (Phase 1, migration 0029): `POST /estimates/:id/proposal` renders a branded
    customer proposal with **pdfkit** (`api/src/lib/estimate-pdf.ts` — pure/deterministic; caller passes
    `generatedOn` so no clock in the renderer) → uploads **direct to live** (system-generated file skips
    quarantine, mirrors `payroll-worker`) → `estimates.proposal_path`. `send=true` emails a **7-day** link
    (`generateDownloadUrl(path, 604800)` — T-35 precedent; default stays 15-min/T-05) via inline SendGrid
    (graceful skip when unset) + advances draft/final→`sent` (never downgrades awarded/lost). Presentation
    only — no money math beyond display; renders every line's `assumptions[]`.
12. **Quantity seeding is best-effort** — text-path facts are thin (fixture counts often null). Seeds
    a head-start, estimator confirms/edits. `seedQuantities` only emits codes present in the
    (tenant-merged) catalog for that trade.
14. **Equipment cost** (migration 0044): 17 `EQUIP-{TYPE}` system rows (trade `general`, unit `DAY`,
    cost entirely in `equipment_cost_cents` → rolls into `equipment_cents`/subtotal, no material/labor).
    `POST /estimates/:id/generate {include_equipment:true}` aggregates the project's `task_steps.equipment`
    (days ≈ COUNT DISTINCT tasks needing each type) → `seedEquipmentQuantities()` → EQUIP DAY lines
    (source rule_engine, preserve manual). `equipmentCode(type)` = `EQUIP-{TYPE.toUpperCase()}`. `type`
    matches the task-buildout equipment vocab + `company_assets.asset_type`. Web: "Include equipment"
    checkbox on the generate control.
13. **Learn-from-actuals suggestions** (Phase 2b, migration 0031): `getAssemblySuggestions()` in
    `services/estimates.ts` aggregates the tenant's OWN history via the `assembly_code` attribution link
    — material = `AVG(awarded vendor_bid_line_items.unit_cost_cents)` via `takeoff_items.assembly_code`;
    labor = `SUM(costed time_entries.hours_worked)/SUM(takeoff quantity)` via `budget_line_items.assembly_code`
    (stamped by `/to-bid-package` + `/award`). Deterministic, advisory, tenant-scoped (RLS), **degrades to
    `[]`** with no history. Web catalog editor shows the hint + "Apply to my catalog" (tenant PATCH /
    system→override). Never auto-overwrites.

## Table quick reference

| Table | Purpose |
|-------|---------|
| `estimate_assemblies` | Cost catalog. `material_cost_cents`, `labor_hours_per_unit`, `equipment_cost_cents`, `waste_pct`. `is_system` + tenant override by `(trade, code)`. |
| `estimates` | Header + `labor_rate_cents` + `overhead/profit/tax/contingency_pct` + totals. FSM `draft→final→sent→awarded/lost`. |
| `estimate_line_items` | Cost basis snapshot + computed amounts + `assumptions[]` + `source`. Per-line version. |

## API quick reference

```
POST   /v1/estimates                              create
GET    /v1/estimates?project_id=&status=          list (cursor)
GET    /v1/estimates/:id                           header + line_items
PATCH  /v1/estimates/:id                            params/status (optimistic; recompute; awarded→409)
DELETE /v1/estimates/:id                            soft delete
POST   /v1/estimates/:id/generate                   {building_sf?, from_takeoff?} → rule_engine lines
POST   /v1/estimates/:id/line-items                 add manual line
PATCH  /v1/estimates/:id/line-items/:lid            edit (optimistic + recompute)
DELETE /v1/estimates/:id/line-items/:lid            soft delete + recompute
POST   /v1/estimates/:id/to-bid-package             → bid_packages + takeoff_items
POST   /v1/estimates/:id/award                      → seed budget_line_items + lock
POST   /v1/estimates/:id/proposal                   render+store proposal PDF; {send,recipient_email,include_cost_breakdown}; send→7-day link + draft/final→sent
GET    /v1/estimates/:id/proposal                   fresh 15-min URL (404 PROPOSAL_NOT_GENERATED before first render)
GET    /v1/estimate-assemblies?trade=               merged catalog
GET    /v1/estimate-assemblies/suggestions?trade=   learn-from-actuals hints per (trade,code); [] if no history (Phase 2b)
POST   /v1/estimate-assemblies                      tenant assembly (409 DUPLICATE_CODE)
PATCH/DELETE /v1/estimate-assemblies/:id            tenant-owned only (system → 403)
```

## Adding / extending catalog

- **Seed new system assemblies**: add INSERT rows in a new migration (or 0028 if not yet applied),
  `tenant_id` sentinel, `is_system=TRUE`, `source='platform-seed'`. Codes referenced by the
  `quantities.ts` seeders must exist or they're silently skipped.
- **Extend a quantity seeder**: edit `lib/estimating/quantities.ts` per-trade function — push a
  `{assembly_code, trade, quantity, assumptions}` guarded by `available.has(code)`; always attach an
  assumption string. Unit-test in `estimating-engine.test.ts`.

## Gotchas

- **Trade set**: catalog `trade` ∈ electrical|plumbing|mechanical|building|**general**. The engine's
  parametric codes are `PARAM-{TRADE}` (uppercased). `estimate.trade` null → generate seeds all
  non-general trades.
- **`recomputeEstimateTotals` must run after any line or param change** — the routes already call it
  on generate / line add-edit-delete / header PATCH. If you add a mutation path, call it too.
- **to-bid-package / award require `estimate.project_id`** → 422 `PROJECT_REQUIRED` otherwise.
- Web calls the API through the **`/api/v1/[...path]` catch-all** proxy (no per-resource proxy).

## File locations

```
docs/Estimating_Engine_v1_0.md                           — full spec
prisma/migrations/0028_estimating_engine/migration.sql   — schema + seeded system catalog (34 rows)
prisma/migrations/0030_estimate_catalog_expansion/migration.sql — +26 depth assemblies (Phase 3; building seeder enabled in quantities.ts)
api/src/lib/estimating/{types,math,quantities,index}.ts  — pure engine
api/src/lib/estimate-pdf.ts                              — pure proposal-PDF renderer (pdfkit; Phase 1, migration 0029)
api/src/services/estimates.ts                            — loadCatalog / generate / recompute
api/src/routes/v1/{estimates,estimate-assemblies}.ts     — routes (estimates incl. /proposal)
api/src/test/{estimating-engine,estimates-routes,estimate-proposal,estimate-suggestions}.test.ts
web/src/app/(dashboard)/projects/[id]/estimates/**       — list + detail
web/src/app/(dashboard)/settings/estimating/page.tsx     — catalog editor
web/locales/{en,es}/projects.json                        — projects.estimates.*
```
