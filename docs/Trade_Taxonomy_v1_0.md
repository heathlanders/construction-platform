# Trade Taxonomy — Feature Specification v1.0
**"The Operating System for Construction" — Canonical Subcontractor Trade List**

> **Status:** Phases 1–4 BUILT — Session 47 (2026-07-17). Canonical taxonomy module,
> data-driven `tradeToPermitTrade()`, `GET /v1/trades`, vendor integration (picker +
> normalization + filter), build-out recipes for taxonomy trades, catalog seed (migration 0037).
> Phase 5 (ES labels) = v1.1. **Phase 7 (2026-10-08): expanded 127 → 183 keys + `heavy_civil` category**
> after a completeness review against CSLB / NAICS / SOC / CSI — see `docs/Trade_Knowledge_Packs_v1_0.md` §2.
> **Builds on:** Blueprint Intelligence (Doc 16), Task Build-Out Engine (Doc 18),
> Estimating Engine (Doc 19), jurisdiction/codes engine (T-59).
> **Locked decision:** T-64 (canonical taxonomy = single source of truth; permit layer stays 4 trades).
> **No tier gate.** No migration — no DB schema change in Phase 1 (all trade_type columns are free text).

---

## Problem

The platform enumerated trades in four divergent vocabularies, none complete:

| Surface | Vocabulary | Count |
|---|---|---|
| Blueprint `TradeType` (`lib/blueprint-templates/types.ts`) | general, civil, structural, concrete, framing, roofing, architectural, electrical, plumbing, hvac, insulation, drywall, finishes | 13 |
| Permit/codes engine (`lib/jurisdictions/types.ts`, T-59) | electrical, plumbing, mechanical, building | 4 |
| Estimating `EstTrade` (`lib/estimating/types.ts`) | + general | 5 |
| `vendors.trade_type` | free text, unconstrained | ∞ |

The real US subcontractor market is ~100 distinct trades (asphalt paving, cabinet
installation, pavement striping, fire sprinkler, low voltage, terrazzo, …). GCs live in that
vocabulary; 13 keys can't classify their vendor directory, bid packages, or manual tasks.

## Solution — one canonical taxonomy, permit layer unchanged

`api/src/lib/trades/taxonomy.ts` defines **`TRADE_TAXONOMY`**: ~100 `TradeDef` entries.
Every other trade surface derives from it or must stay consistent with it (**T-64**).

```typescript
interface TradeDef {
  key: string;             // stable snake_case — NEVER renamed (free-text columns store it)
  label: string;           // EN display label (ES = v1.1 data task, like task titles)
  category: TradeCategory; // sitework | concrete_masonry | structural | envelope |
                           // electrical_systems | plumbing_systems | mechanical_systems |
                           // interior | specialty | services
  csi_division: string;    // primary CSI MasterFormat division/section
  default_phase: PhaseType;// scheduling hint (blueprint PhaseType)
  permit_trade: Trade | null; // collapse onto the 4-trade codes engine (T-59); null = no permit path
  legacy?: boolean;        // one of the original 13 blueprint TradeType keys
  umbrella?: boolean;      // roll-up key (general, finishes, civil, structural, architectural)
  aliases?: string[];      // lookup synonyms ('mechanical'→hvac, 'striping'→pavement_marking)
}
```

**The permit layer does NOT widen.** AHJs issue ~4 permit types; asphalt, cabinets, and
striping all inspect under the `building` permit or none at all. T-59 stands. What changes is
*classification granularity* above the permit layer, and the collapse becomes **data-driven**:

- `tradeToPermitTrade()` (`lib/jurisdictions/trade-map.ts`) now looks up `permit_trade` from
  the taxonomy. Legacy behavior preserved exactly for the 13 legacy keys; **unknown free-text
  → `building`** (safe default — the build-out engine drops gating inspections not in the AHJ
  sequence); **`permit_trade: null`** service/cosmetic trades (surveying, painting, cabinetry,
  final clean, striping …) → no permit path, `buildTaskSteps()` yields no code-gated steps.

## The taxonomy (~100 trades, 10 categories)

| Category | Trades (**bold** = legacy 13) |
|---|---|
| **Sitework** (Div 31–33) | **civil**ᵁ, demolition, excavation, erosion_control, shoring_underpinning, deep_foundations, dewatering, site_utilities→P, septic→P, well_drilling→P, asphalt_paving, concrete_flatwork, pavement_marking∅, fencing, landscaping∅, irrigation→P, retaining_walls, site_furnishings∅ |
| **Concrete/Masonry** (3–4) | **concrete**, concrete_pumping∅, rebar, post_tensioning, shotcrete, concrete_cutting∅, concrete_polishing∅, masonry, precast_erection |
| **Structural** (5–6) | **structural**ᵁ, **framing**, structural_steel, metal_decking, misc_metals, welding, truss_setting, panelized_sips, post_frame, heavy_timber |
| **Envelope** (7–8) | **roofing**, sheet_metal_flashing, gutters∅, waterproofing, air_barrier, **insulation**, spray_foam, fireproofing, firestopping, siding, stucco_eifs, curtain_wall, glazing, windows, exterior_doors, overhead_doors, skylights, caulking_sealants∅ |
| **Electrical systems** (26–28) | **electrical**→E, low_voltage→E, fire_alarm→E, security_access→E, av_automation→E, solar_pv→E, ev_charging→E, generators→E |
| **Plumbing systems** (21–22) | **plumbing**→P, fire_sprinkler→P, gas_piping→P, medical_gas→P, process_piping→P, water_treatment→P |
| **Mechanical systems** (23/25) | **hvac**→M (alias `mechanical`), ductwork→M, refrigeration→M, boilers_hydronic→M, geothermal→M, mechanical_insulation→M, test_balance→M, controls_bms→M, elevator |
| **Interior** (9–12) | **drywall**, metal_stud_framing, plaster, acoustical_ceilings, painting∅, wallcovering∅, flooring_carpet∅, flooring_wood∅, flooring_resilient∅, flooring_epoxy∅, terrazzo∅, tile∅, countertops∅, cabinetry∅, millwork∅, finish_carpentry∅, doors_hardware∅, stairs_railings, toilet_partitions∅, window_treatments∅, appliances∅, **finishes**ᵁ, **architectural**ᵁ |
| **Specialty** (10–14, 41+) | **general**ᵁ, pools_spas, fireplaces, central_vacuum, signage, scaffolding∅, crane_service∅, abatement, radon_mitigation, pest_control∅, final_clean∅, hauling∅, traffic_control∅, loading_dock_equipment, kitchen_equipment, cold_storage→M, lab_casework∅, gym_theatrical∅, sport_courts_turf∅, playground_equipment |
| **Services** (professional) | surveying∅, geotech∅, special_inspection∅, materials_testing∅, commissioning_agent∅, energy_rating∅ |

Legend: →E/P/M = permit_trade electrical/plumbing/mechanical; ∅ = `permit_trade: null` (no
AHJ permit path); unmarked = `building`; ᵁ = umbrella key. Full detail (labels, CSI, phase,
aliases) is the source itself — `api/src/lib/trades/taxonomy.ts`.

Notable permit routings: `site_utilities`/`septic`/`well_drilling`/`irrigation` → plumbing
(sanitary/backflow inspection); `cold_storage` → mechanical (refrigeration); `elevator` →
building (state conveyance permits are outside the 4-trade engine).

## API

| Method | Path | Roles | Notes |
|---|---|---|---|
| GET | `/v1/trades` | any authed | full taxonomy; filters `?category=`, `?permit_trade=`. Static reference — no DB, no tenant context. |
| GET | `/v1/trades/:key` | any authed | resolve by key OR alias (`/trades/striping` → pavement_marking); 404 unknown |

## Phase plan

| Phase | Scope | Status |
|---|---|---|
| **1** | Taxonomy module + data-driven `tradeToPermitTrade()` + `GET /v1/trades` + tests | **BUILT** (Session 47) |
| **2** | Vendor integration: web `TradeSelect` picker (category optgroups + custom free-text escape) on vendor create/edit; `normalizeTradeKey()` on `vendors.trade_type` POST/PATCH (aliases collapse; unknown preserved as typed, never rejected); `GET /v1/vendors?trade_type=` matches canonical key + aliases (legacy rows); vendor-list trade filter + wired the previously-dead `?type=` tabs; fixed the missing `GET /api/vendors` web proxy (list always rendered empty). Tests: `vendor-trades.test.ts` (7). | **BUILT** (Session 47) |
| **3** | Build-out recipe depth: trade-specific branches in `building.ts` ahead of the phase branches (masonry R606/R703.8, asphalt/flatwork, siding/stucco WRB→cladding, drywall R702) + new `nopermit.ts` recipes for `permit_trade: null` trades (painting, tile, flooring_*, cabinetry/millwork/countertops, finish carpentry, striping w/ ADA layout, final clean, landscaping + generic fallback) dispatched when the taxonomy knows the trade. Tests: `task-buildout-trades.test.ts` (13). | **BUILT** (Session 47) |
| **4** | Estimating catalog depth: migration **0037** seeds 30 system assemblies for taxonomy trades across the 5 `EstTrade` buckets (fire alarm/security/solar/generator → electrical; sprinkler/gas → plumbing; masonry/asphalt/flatwork/siding/stucco/fence/gutter/drywall → building; paint/tile/flooring/cabinets/countertop/striping/demo/clean → general). Code prefix + `csi_division` carry the taxonomy trade. | **BUILT** (Session 47) |
| **6** | **Blueprint trade reclassification** — the 5 building-type templates retag ~95 of 247 tasks onto taxonomy keys (painting, cabinetry, fire_sprinkler, structural_steel, excavation, landscaping, post_frame, …; titles UNCHANGED — supersede regexes are title-matched); blueprint `TradeType` union widened 19→~70 (guard test: union ⊆ taxonomy); dependency-engine MEP convergence + worker permit-milestone trigger both match by **permit family via `tradeToPermitTrade()`** (finer MEP keys converge/trigger correctly); task-detail trade dropdown now taxonomy-driven via `GET /v1/trades` (fixes silent trade-clobber on edit); TRADE_COLORS extended; backfill `api/src/scripts/backfill-task-trades.ts` (title-match retag + step/DAG rebuild, dry-run/`--apply`). | **BUILT** (Session 48) |
| **4b** | Extraction + seeding wiring: 6 new `COMPONENT_PATTERNS` detectors (`masonry_veneer`, `stucco_finish`, `cabinetry`, `ceramic_tile`, `asphalt_paving`, `gutters_downspouts` — context-guarded so "masonry contractor" / "panelboard cabinet" don't fire) → `build-tasks.ts` augment tasks carrying taxonomy trade keys (blueprint `TradeType` union widened by those 6 keys); `quantities.ts` component-gated building quantities (shingle SQ unless metal-roof callout, slab CY, siding/veneer/stucco SF) + new `seedGeneral` (paint/clean always, tile/cabinets on callout); multi-trade assembly generate now includes the `general` bucket. Tests: `trade-taxonomy-extraction.test.ts` (9). | **BUILT** (Session 47) |
| **5** | ES trade labels: `TradeDef.label_es` on all 127 entries (trade names are not safety content — T-08 professional-translation rule does not apply); `GET /v1/trades` returns `label_es`; web pickers/labels render via `tradeDisplayLabel(trade, i18n.language)` (`use-trade-taxonomy.ts`) — vendor picker + list, task-detail dropdown + badge. Guard test: every entry has a non-empty `label_es`. Mobile still renders raw keys (no taxonomy fetch there); blueprint task-title ES remains the separate v1.1 data task. | **BUILT** (Session 48) |
| **7** | **Completeness expansion** — +56 keys (residential outdoor/remodel, commercial specialties, new `heavy_civil` category, professional services), ~30 aliases, `hardscape` alias moved retaining_walls → hardscape_pavers (no stored rows affected). heavy_civil + services = `permit_trade: null`. Web `TRADE_CATEGORY_ORDER` + `heavy_civil` labels EN+ES. Tests: `trade-taxonomy.test.ts` +6. Knowledge depth for every trade follows via Trade Knowledge Packs (Doc 23). | **BUILT** (2026-10-08, Wave 0a) |

## Invariants

1. **Keys are permanent.** `TradeDef.key` values are stored in free-text `trade_type` columns
   (`schedule_tasks`, `blueprint_proposed_tasks`, `vendors`) — never rename; add aliases instead.
2. **Permit layer stays 4 trades** (T-59). Adding a taxonomy trade NEVER means a new permits
   table/route/code library — set `permit_trade` and done.
3. **The 13 legacy blueprint `TradeType` keys are a strict subset** (`legacy: true`), mapping
   exactly as before: electrical→electrical, plumbing→plumbing, hvac→mechanical, other 10→building.
4. **Unknown free text still collapses to `building`** — no behavior change for existing data.
   `permit_trade: null` applies only to taxonomy keys explicitly marked as no-permit trades
   (new keys — nothing stored before Phase 1 used them).
5. **Aliases never collide** with keys or each other (tested).
6. Blueprint `TradeType` union may widen toward taxonomy keys over time; it must never contain
   a key absent from the taxonomy (test guards the current 13).

## Tests

`api/src/test/trade-taxonomy.test.ts` (15) — key uniqueness/format, alias collision, legacy-13
presence, permit_trade validity + coverage, `tradeDef`/`normalizeTradeKey` (keys, aliases,
case/whitespace, unknown), permit-collapse per family incl. null-service trades and aliases.
`api/src/test/trade-map.test.ts` (6) — legacy mapping preserved, unknown→building, service→null.

## File locations

```
docs/Trade_Taxonomy_v1_0.md                — this spec (Doc 21)
api/src/lib/trades/taxonomy.ts             — TRADE_TAXONOMY + tradeDef()/normalizeTradeKey()
api/src/lib/jurisdictions/trade-map.ts     — tradeToPermitTrade() (now taxonomy-driven)
api/src/routes/v1/trades.ts                — GET /v1/trades[, /:key]
api/src/test/{trade-taxonomy,trade-map}.test.ts
```

---

*Spec version: 1.0 — Session 47 — 2026-07-17*
