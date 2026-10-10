# Task Equipment Recommendation — Feature Plan v1.0
**"The Operating System for Construction" — Equipment factoring in blueprint/task build-out**

> **Status:** BUILT — all 3 phases. Branch `feat/task-equipment-recommendation`. Session 2026-07-15.
> Migrations 0032 (`task_steps.equipment`) + 0033 (EQUIP-{TYPE} catalog). Backend engine + persist +
> detail (+ Business+ EAM enrichment) + estimating equipment lines + web + mobile + tests all green.
> **Builds on:** Task Build-Out Engine (Doc 18, `lib/task-buildout/`), Asset Management (Doc 14, EAM),
> Estimating Engine (Doc 19, `lib/estimating/`).
> **Decisions in force:** T-02 (cents), T-12 (optimistic lock), A-03 (RLS), T-56 (EAM Business+),
> T-63 (estimate equipment_cost). No tier gate on the recommendation itself.

---

## Problem

A schedule task's build-out today lists `tools/materials/safety` but has no **structured** notion of
the heavy **equipment** (excavator, scissor/boom lift, crane, concrete pump, compactor…) a crew needs
to do the task *efficiently*. Equipment mentions leak into the freeform `tools` array
(`'excavator / skid steer'`) — not queryable, not linkable to the fleet, not costable.

## Goal (full integration — user pick 1D / 2A)

1. **Recommend** — the deterministic build-out engine emits a canonical **equipment list** per work
   step (machine + category + why + optional flag), keyed on trade/phase/title/blueprint-facts.
2. **Asset link (EAM, Business+)** — match recommended equipment against the tenant's
   `company_assets` by `asset_type`; show owned / available; offer reserve (reuse `asset_reservations`).
3. **Estimating cost** — feed equipment into estimate lines (`equipment_cost_cents` already exists) so
   rental/owned equipment cost rolls into the bid.

Signal = **deterministic trade + phase + BlueprintFacts** (no AI), mirroring the existing engine.

---

## Canonical equipment vocabulary

`type` aligns to `company_assets.asset_type`; `category` to `company_assets.asset_category`
(`heavy_equipment` | `power_tool` | `vehicle` | `trailer` | `attachment`). Examples:

| type | category | typical phase/trade |
|------|----------|---------------------|
| excavator | heavy_equipment | site_prep, foundation (dig) |
| skid_steer | heavy_equipment | site_prep, sitework, material move |
| backhoe / trencher | heavy_equipment | utilities, footings |
| compactor | heavy_equipment | site_prep, backfill |
| concrete_pump | heavy_equipment | foundation/slab pours |
| power_trowel | power_tool | slab finishing |
| scissor_lift | heavy_equipment | framing/interior, ≤ ~40 ft |
| boom_lift | heavy_equipment | framing/roofing/exterior height |
| telehandler / forklift | heavy_equipment | material hoist, trusses |
| crane | heavy_equipment | truss/heavy set |
| material_hoist | heavy_equipment | roofing material |
| generator / air_compressor / welder | power_tool | general |
| dump_truck | vehicle | haul/site |

Vocab lives in `lib/task-buildout/equipment-vocab.ts` (single source, shared with estimating catalog codes).

---

## Phase 1 — Recommendation (backend + engine)  ← BUILD FIRST

- **Migration 0032** `task_steps ADD COLUMN equipment JSONB NOT NULL DEFAULT '[]'`.
- `lib/task-buildout/types.ts` — `EquipmentNeed { type, category, reason, optional? }`;
  `WorkStep.equipment: EquipmentNeed[]`.
- `lib/task-buildout/equipment-vocab.ts` — canonical list + `EquipmentType`/category map.
- `lib/task-buildout/equipment-rules.ts` — `equipmentFor(permitTrade, phase, trade, title, facts) → EquipmentNeed[]`.
  Facts-driven sizing (multi-story → scissor→boom; trusses/`lvl_beam` → crane/telehandler; large slab → pump).
- `lib/task-buildout/index.ts` — attach `equipment` to each step at the single existing map point.
- `services/task-steps.ts` — persist `equipment` in the `task_steps` INSERT (regenerated as a set).
- `routes/v1/schedule-tasks.ts` `GET /:id/detail` — return `equipment` per step + `task_equipment`
  (union rollup).
- Blueprint `/import` + build-steps endpoints + `backfill-task-steps.ts` — unchanged (regen picks it up).
- Tests: `task-buildout.test.ts` (equipment per trade/phase + facts sizing + empty facts),
  `schedule-task-detail.test.ts` (`equipment` + `task_equipment` in payload).

## Phase 2 — Asset Management link (EAM, Business+)

- `GET /:id/detail` — when tenant tier ≥ Business, enrich `task_equipment[]` with
  `{ owned_count, available_count, asset_ids[] }` from `company_assets` (join on `asset_type`, active,
  not out_of_service). Lower tiers: recommendation only, no enrichment (graceful degrade — no 402).
- Reserve affordance reuses existing `POST /v1/assets/:id/reservations` (no new endpoint).
- Web task-detail panel: Equipment section shows owned/available badges + "Reserve" for Business+.
- Mobile TaskDetailScreen: read-only equipment list (+ owned/available when present).

## Phase 3 — Estimating cost

- **Migration 0033** — seed `EQUIP-{TYPE}` system `estimate_assemblies` rows (`equipment_cost_cents`
  = day-rate; unit `DAY`; `is_system`). Depth = common machines from the vocab.
- `lib/estimating/quantities.ts` — `seedEquipmentQuantities(projectEquipment, availableCodes)`:
  aggregate a project's task equipment → estimate equipment lines (qty = duration-days heuristic).
- `services/estimates.ts` `generateEstimateLines` — optional `include_equipment` seeds equipment lines
  (source rule_engine, preserve manual). Rolls into `equipment_cents` / totals (engine already sums it).
- Web estimate detail: equipment lines visible + editable (existing grid). Assumptions carry the source.
- Tests: `estimating-engine.test.ts` equipment seeder; `estimates-routes.test.ts` include_equipment path.

---

## Invariants / gotchas

- Engine stays **pure, deterministic, no AI** (mirrors task-buildout).
- `equipment` regenerated as a SET with the rest of `task_steps` (source rule_engine|manual; no version).
- Recommendation is **advisory** — never blocks, never auto-reserves, never auto-costs.
- Canonical `type` MUST match `company_assets.asset_type` values (Phase 2 join) AND the `EQUIP-{TYPE}`
  catalog codes (Phase 3) — one vocab file is the source of truth.
- i18n: section chrome EN+ES; equipment `type`/`reason` are English data (ES = v1.1, like step content).

## File locations

```
prisma/migrations/0043_task_step_equipment/migration.sql
prisma/migrations/0044_equipment_catalog/migration.sql        (Phase 3)
api/src/lib/task-buildout/{types,equipment-vocab,equipment-rules,index}.ts
api/src/services/task-steps.ts
api/src/routes/v1/schedule-tasks.ts                            (detail: equipment + task_equipment + EAM)
api/src/lib/estimating/quantities.ts                           (Phase 3)
api/src/services/estimates.ts                                  (Phase 3)
web/src/components/tasks/task-detail-panel.tsx                 (Equipment section)
mobile/src/screens/TaskDetailScreen.tsx
api/src/test/{task-buildout,schedule-task-detail,estimating-engine,estimates-routes}.test.ts
```

---

*Plan version: 1.0 — 2026-07-15*
