# Dossier — `remodeling` (Remodeling / Renovation (Residential))

> Wave: w05 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/remodeling.ts` · Status: draft
> Taxonomy: category `specialty` · permit_trade `building` · phase `finishes_interior` · CSI `01`
> Aliases: remodel, renovation, handyman, home_improvement, kitchen_remodel, bath_remodel

## Scope (2–4 sentences)
Residential remodel GC for lived-in homes: kitchen and bath remodels, interior renovations, basement
finishes and handyman work. Owns the hazard survey before demo, occupied-home protection and dust
control, selective demolition, sequencing the rough-in trades and inspections, close-up, finishes,
punch walk and handoff. Does NOT abate asbestos (hands off to `abatement`), and the MEP rough-ins are
done by the licensed trades (electrical / plumbing / hvac packs).

## Existing coverage reconciled
- Hand recipe: none → pack = NEW-TRADE pattern (3 recipes with `example_title`).
- Catalog codes already seeded: `G-DEMO-SF` (selective interior demo + haul-off) and `G-CLEAN-SF`
  (final construction clean) cover demo, dumpster/haul and final clean — NOT redeclared. No quantity
  rule references them (remodel area isn't a blueprint fact; whole-house `area_sf_sum` would overstate).
- Blueprint template tasks hitting this trade: none (0).

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| painting-ecfr-40-745e (reused) | 40 CFR 745 Subpart E — RRP rule | 1 | gov_open | lead-safe practices, cleaning verification |
| painting-epa-rrp-steps (reused) | EPA Steps to Lead Safe RRP | 1 | gov_open | containment, no dry sanding, HEPA cleaning |
| painting-epa-renovate-right (reused) | Renovate Right pamphlet | 1 | gov_open | pre-renovation owner notice |
| remodeling-hud-lbp-guidelines | HUD Guidelines for LBP hazards in housing | 1 | gov_open | occupant protection, worksite containment |
| remodeling-epa-asbestos-home | EPA — Protect your family from asbestos | 1 | gov_open | test before remodeling disturbs suspect material |
| remodeling-epa-asbestos-pros | EPA — Asbestos professionals | 1 | gov_open | inspector vs abatement contractor split |
| ecfr-1926-c/d/h/i/k/m/t/x/z (shared) | 29 CFR 1926 subparts | 1 | public_domain | hazards |
| icc-pa (shared) | ICC public access (IRC, IEBC) | 3 | proprietary_ref_only | code refs (section + paraphrase only) |
| remodeling-nahb-remodelers | NAHB Remodelers | 4 | proprietary_ref_only | practice reference (punch/handoff, protection) |
| platform-baseline | The Jobsite cost baseline | — | platform_estimate | all assembly costs |

## Work steps (draft → pack recipes)
Recipes: `kitchen_remodel` (priority 10), `bathroom_remodel` (priority 10), `interior_renovation` (fallback).
1. **Survey hazards, pull permit, protect home** — lead/asbestos status known, Renovate Right, permit posted, floor protection, dust walls, HVAC returns sealed. QA: hazard_status_known, permit_posted, occupied_protection.
2. **Shut off, cap, selectively demolish** — 1926.850(a)/(c), 1926.416(a)(3). QA: utilities_capped, demo_scope_limits, daily_cleanup.
3. **Frame changes, blocking, rough-ins** — Gate: framing. Code: IEBC Ch. 8 (Level 2), IRC R102.7.1; bath R303.3/R307; basement R310 + IEBC Ch. 6.
4. **Insulate and close up** — Gate: insulation. Bath: R702.4.2 backer + flood test.
5. **Finishes** — cabinets level/secure; bath safety glazing R308.4.5.
6. **Final, punch, handoff** — Gate: final. R314.2.2 / R315.2.2 alarms; RRP cleaning verification; warranty docs.

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| lead_paint | Lead dust, pre-1978 paint | 1926.62 (+ 40 CFR 745) | 3 |
| asbestos | Asbestos in old materials | 1926.1101(k) | 4 |
| silica | Tile/stone/concrete dust | 1926.1153 | 3 |
| demo_survey | Hidden structural hazards | 1926.850(a) | 3 |
| utilities | Live gas/water/electric lines in demo | 1926.850(c) | 4 |
| electrical_live | Hidden live wiring | 1926.416(a)(3) | 4 |
| floor_hole | Floor openings / stair holes | 1926.501(b)(4) | 3 |
| ladder | Ladder falls | 1926.1053(b)(1) | 3 |
| debris_drop | Dropped debris | 1926.252(a) | 3 |
| power_tool | Saw / multi-tool cuts | 1926.300(b) | 3 |
| heavy_lift | Tubs, stone tops, appliances | 1926.20(b) | 2 |
| chemicals | Adhesives, foam, finishes | 1926.59 | 2 |

## QA checklist
17 items; safety (ES pending): hazard_status_known, utilities_capped, safety_glazing_wet, alarms_per_code,
egress_compliant, rrp_cleaning_verified. Non-safety translated: permit_posted, occupied_protection,
demo_scope_limits, daily_cleanup, blocking_installed, walls_open_until_passed, insulation_before_closeup,
fan_vented_outside, shower_flood_test, cabinets_level_secure, punch_walk_handoff.

## Inspection / acceptance checkpoints
- framing: framing/headers/blocking per plans (R102.7.1), rough-ins visible, bath exhaust to outdoors (R303.3), basement egress framed (R310).
- insulation: opened exterior walls insulated + air-sealed; wet-area backer type (R702.4.2).
- final: smoke (R314.2.2) and CO (R315.2.2) alarms, wet-area safety glazing (R308.4.5), egress.

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| B-RMD-DUST-EA | Dust containment per zone | EA | 15000 | 3 | 6000 | 10 | platform-baseline, estimate |
| B-RMD-FLOORPROT-SF | Floor protection | SF | 45 | 0.006 | 0 | 10 | platform-baseline, estimate |
| B-RMD-RRP-EA | Lead-safe setup + cleaning verification | EA | 9000 | 4 | 2500 | 10 | platform-baseline, estimate |
| B-RMD-PERMIT-EA | Permit/plan/admin allowance | EA | 75000 | 6 | 0 | 0 | platform-baseline, estimate (fee varies widely) |
| B-RMD-PUNCH-EA | Punch walk + handoff + binder | EA | 2500 | 6 | 0 | 0 | platform-baseline, estimate |

## Quantity rules
- `B-RMD-PERMIT-EA` = const 1, residential_sf / residential_mf — one allowance per remodel job.
- `B-RMD-DUST-EA` = const 1, residential_sf / residential_mf — one containment zone; estimator adds zones.
- Not seeded (no fact to size them): B-RMD-FLOORPROT-SF, B-RMD-RRP-EA (needs pre-1978 flag), B-RMD-PUNCH-EA, G-DEMO-SF, G-CLEAN-SF.

## Blueprint callouts (components)
- None this wave.

## Open questions → REVIEW_QUEUE
- IEBC chapter numbers (Ch. 6 classification, Ch. 8 Level 2) follow the 2018/2021 layout; older editions differ.
- R310 subsection for existing basements (R310.6 in 2018) shifts by edition — cited at section level only.
- All 5 assembly costs are platform estimates; permit allowance especially jurisdiction-dependent.
- A `pre_1978` / build-year project fact would let B-RMD-RRP-EA seed automatically.
