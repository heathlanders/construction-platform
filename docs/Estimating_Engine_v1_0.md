# Estimating Engine — Feature Specification v1.0
**"The Operating System for Construction" — Deterministic Sub-Level Job Estimating**

> **Status:** BUILT — Session 46 (2026-07-13). Migration 0028. Backend (engine + tables + routes +
> tests) and web (estimates + cost catalog) shipped. No tier gate.
> **Builds on:** Blueprint Intelligence (facts), the codes/trade map (`tradeToPermitTrade`), the
> deterministic-engine pattern (task-buildout / task-dependencies / jurisdictions).
> **Decisions in force:** T-02 (cents), T-03 (UUIDs), T-12 (optimistic locking), A-03 (RLS), T-63
> (markup calc + burdened labor + no tier gate). **Skill:** `.claude/skills/estimating/SKILL.md`.
> **Schema:** `Schema_Reference.md` §Domain 18.

---

## Overview

Lets a subcontractor (or GC self-perform) price a job deterministically:

```
quantities → assembly expansion → (material + labor_hrs×burdened_rate + equipment) × (1+waste%)
           → subtotal → markups (overhead / profit / tax / contingency) → total bid
```

Same quantities + same rates ⇒ same price. No AI. Reproducible + auditable — bids must be defensible,
so every generated line carries an `assumptions[]` list.

Two capture paths for quantities:
- **Assembly mode** — per-trade quantity heuristics seed from **blueprint facts** (panels+amperage,
  fixture types, rooms, components) → priced assembly lines; the estimator confirms/edits.
- **Parametric mode** — `building_sf × trade $/SF` for fast rough/conceptual bids.

Also seedable from existing project `takeoff_items` (blended unit cost → material).

## The cost catalog (cascade)

`estimate_assemblies` holds material $, **production rate** (`labor_hours_per_unit`), equipment $,
and waste % per unit. **System rows** (sentinel tenant `00000000-…`, `is_system=TRUE`) ship with the
platform and are readable by every tenant. A **tenant row with the same `(trade, code)` OVERRIDES**
the system row in the engine cascade (`loadCatalog` prefers tenant over system by code). System rows
are read-only to tenants — create an override instead (403 `SYSTEM_ASSEMBLY_READONLY`).

Seeded system catalog: **60 system rows** — electrical (14), plumbing (14), mechanical (12), building (16)
unit assemblies + 4 parametric `PARAM-{TRADE}` $/SF rows. Baseline in migration 0028 (30 unit + 4 param);
**Phase 3 depth in migration 0030** (+26: by-LF pipe/duct/refrigerant, CY concrete, SQ shingle, windows/doors,
sub-panel, EV, mini-split, RTU/VAV). Production rates are stable industry values;
material $ are rough national baselines a tenant tunes.

## The engine (`api/src/lib/estimating/` — pure, no I/O, no AI)

| File | Role |
|------|------|
| `types.ts` | `CatalogItem`, `QuantityInput`, `EstimateParams`, `LineCostBasis`, `LineAmounts`, `EstimateLineDraft`, `EstimateTotals`, `EstTrade` |
| `math.ts` | `computeAmounts(basis, rate)` (waste/FLOOR/labor); `computeTotals(lines, params)` (markup rollup) |
| `index.ts` | `buildEstimateLines(quantities, catalog, params)` — resolve each quantity vs catalog, compute, attach assumptions; missing code → zero-cost line + explicit assumption (never throws) |
| `quantities.ts` | `seedQuantities(trade, facts, availableCodes)` per-trade heuristics (electrical/plumbing/mechanical/**building** — window/door/room-area, Phase 3) + `seedParametricQuantities(sf, trades, availableCodes)` |

**Markup math** (all FLOOR, cents): `overhead = subtotal×oh%`; `profit = (subtotal+overhead)×p%`;
`tax = material×tax%` (material only); `contingency = subtotal×cont%`; `total = subtotal + markup`.

**Burdened labor** (T-63): `labor_cents = FLOOR(labor_hours × estimate.labor_rate_cents)`. The rate is
a **burdened** $/hr snapshot on the estimate (payroll taxes/insurance baked in) — it is NOT read live
from `user_payroll_settings` (an estimate prices a crew average, not a specific worker).

## Service (`api/src/services/estimates.ts`)

- `loadCatalog(client, trade?)` — merged system+tenant map (tenant wins by code) + codes-by-trade.
- `generateEstimateLines(client, tenantId, estimateId, opts)` — resolve params + catalog + latest
  blueprint facts; seed quantities (assembly OR parametric); optionally add takeoff-derived lines;
  **replace prior `source='rule_engine'` lines, preserve `manual`**; roll up header totals.
- `recomputeEstimateTotals(client, estimateId)` — recompute every live line's amounts from its stored
  cost basis + the estimate's **current** labor rate (rate/params may have changed), then persist
  header totals. Does NOT bump line `version` (internal reconcile, never a client 409).

## Data model (migration 0028 — `Schema_Reference.md` §Domain 18)

| Table | Purpose |
|-------|---------|
| `estimate_assemblies` | Cost catalog. System (read-any) + tenant (override by code). RLS USING(own OR is_system) + WITH CHECK(own). Unique `(tenant_id, trade, code)`. |
| `estimates` | Header + markup params (`overhead/profit/tax/contingency_pct`) + burdened `labor_rate_cents` + rolled-up totals. FSM `draft→final→sent→awarded/lost`. Optimistic lock. |
| `estimate_line_items` | Priced lines. Cost basis snapshot + computed amounts + `assumptions[]` + `source` (rule_engine|manual). Per-line optimistic lock. |

All tenant-scoped, **RLS enabled + forced with WITH CHECK** (A-03, mirrors 0026). Money in cents (T-02).

## API (`/v1`, `withTenantContext`, no tier gate)

Read = any authed org user; write = **OWNER / PROJECT_MANAGER / ESTIMATOR**.

| Method | Path | Notes |
|--------|------|-------|
| POST | `/v1/estimates` | create header |
| GET | `/v1/estimates?project_id=&status=` | list (cursor) |
| GET | `/v1/estimates/:id` | detail = header + line_items |
| PATCH | `/v1/estimates/:id` | params/status (optimistic; recomputes totals; `awarded` locked) |
| DELETE | `/v1/estimates/:id` | soft delete |
| POST | `/v1/estimates/:id/generate` | `{building_sf?, from_takeoff?}` → rule_engine lines |
| POST | `/v1/estimates/:id/line-items` | add manual line |
| PATCH | `/v1/estimates/:id/line-items/:lid` | edit (optimistic 409 + recompute) |
| DELETE | `/v1/estimates/:id/line-items/:lid` | soft delete + recompute |
| POST | `/v1/estimates/:id/to-bid-package` | → `bid_packages` + `takeoff_items` (blended unit cost) |
| POST | `/v1/estimates/:id/award` | status→awarded (locked) + seed `budget_line_items` (closes loop with field-cost-worker) |
| POST | `/v1/estimates/:id/proposal` | render + store proposal PDF; `{include_cost_breakdown?, send?, recipient_email?, recipient_name?}`; `send` emails a 7-day link + advances draft/final→sent; returns `{download_url (15-min), sent}` |
| GET | `/v1/estimates/:id/proposal` | fresh 15-min download URL (404 `PROPOSAL_NOT_GENERATED` before first render) |
| GET | `/v1/estimate-assemblies?trade=` | merged catalog list |
| GET | `/v1/estimate-assemblies/suggestions?trade=` | learn-from-actuals hints per `(trade,code)` from tenant history (`[]` if none) — Phase 2b |
| POST | `/v1/estimate-assemblies` | create tenant assembly (409 `DUPLICATE_CODE`) |
| PATCH/DELETE | `/v1/estimate-assemblies/:id` | tenant-owned only; system → 403 `SYSTEM_ASSEMBLY_READONLY` |

Awarded estimates are locked: PATCH/generate/line-edit → 409 `ESTIMATE_AWARDED`.

## Web

- `projects/[id]/estimates/page.tsx` — list + create (mode/trade/rate/markups).
- `projects/[id]/estimates/[estimateId]/page.tsx` — editable line grid (inline expand editor),
  pricing/markup params (blur-save), generate (building_sf for parametric + include-takeoff),
  add-line, totals footer, assumptions inline, **Create bid package** + **Award** actions.
- `settings/estimating/page.tsx` — cost catalog editor (trade tabs; system read-only 🔒; tenant
  create/edit/delete).
- All via the `/api/v1/[...path]` catch-all proxy. i18n `projects.estimates.*` (EN+ES chrome; catalog
  item names + assumptions are English data — ES v1.1). Project tile "💲 Estimates".

## Tests

- `api/src/test/estimating-engine.test.ts` (12) — pure: `computeAmounts` (waste/FLOOR/labor/clamp),
  `computeTotals` markup order, `buildEstimateLines` catalog hit/miss + assumption, `seedQuantities`
  electrical (panels+rooms) + empty + catalog-gating, `seedParametricQuantities`.
- `api/src/test/estimates-routes.test.ts` (11) — create → generate (parametric) → detail → catalog
  cascade (system read + tenant override wins on regenerate + duplicate 409 + system-readonly 403) →
  manual line → optimistic-lock 409 → regenerate preserves manual → to-bid-package → award (budget
  seed + lock). Role gate (field_tech create → 403).
- `api/src/test/estimate-proposal.test.ts` (9) — pure `renderProposalPdf` → `%PDF` buffer (with/without
  breakdown); route chain: 404 before generate → role gate (field_tech 403) → generate + persist
  `proposal_path` → GET fresh URL → `send` requires recipient (422) → `send=true` advances draft→sent
  (SendGrid unset → graceful, no throw). Storage mocked.

## Roles

| Action | Roles |
|--------|-------|
| View estimates / catalog | any authenticated org user |
| Create/edit estimate + lines, generate, to-bid, award | OWNER, PROJECT_MANAGER, ESTIMATOR |
| Manage tenant catalog assemblies | OWNER, PROJECT_MANAGER, ESTIMATOR |

## Deferred / future

| Item | Target |
|------|--------|
| Learn-from-actuals: refine unit costs from `time_entries` / awarded `vendor_bids` | **BUILT** (Iteration Phase 2a/2b/2c, migration 0031) — `assembly_code` attribution link on `budget_line_items`+`takeoff_items`; `GET /estimate-assemblies/suggestions`; catalog "Apply to my catalog". Advisory, degrades to `[]` with no history. |
| Proposal PDF (customer-facing) — branded pdfkit render, download + 7-day emailed link (SendGrid) | **BUILT** (Iteration Phase 1, migration 0029, `lib/estimate-pdf.ts`) |
| Mobile estimating surface (Estimator = web-first role) | v1.1+ |
| HVAC/mechanical + building assembly depth | **Phase 3 done** (migration 0030: +26 depth rows; building assembly-mode seeder enabled). Further depth = ongoing data-ops |
| ES translation of catalog item names + assumptions (data) | v1.1 |
| Richer blueprint auto-takeoff (text-path fixture counts often null) | tracks Blueprint extraction depth |

## File locations

```
prisma/migrations/0028_estimating_engine/migration.sql   — 3 tables + seeded system catalog
api/src/lib/estimating/{types,math,quantities,index}.ts  — pure engine
api/src/services/estimates.ts                            — catalog load + generate + recompute
api/src/routes/v1/estimates.ts                           — header/line/generate/to-bid/award/proposal
api/src/lib/estimate-pdf.ts                              — pure proposal-PDF renderer (pdfkit)
prisma/migrations/0029_estimate_proposal/migration.sql   — estimates.proposal_path/_generated_at
prisma/migrations/0030_estimate_catalog_expansion/migration.sql — +26 depth system assemblies
api/src/routes/v1/estimate-assemblies.ts                 — catalog CRUD
api/src/test/{estimating-engine,estimates-routes}.test.ts
web/src/app/(dashboard)/projects/[id]/estimates/**       — list + detail
web/src/app/(dashboard)/settings/estimating/page.tsx     — catalog editor
web/locales/{en,es}/projects.json                        — projects.estimates.*
.claude/skills/estimating/SKILL.md                       — skill
```

---

*Spec version: 1.0 — Session 46 — 2026-07-13*
