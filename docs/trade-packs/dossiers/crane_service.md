# Dossier: `crane_service` (Crane Service)

> Wave: w18 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/crane_service.ts` · Status: draft
> Taxonomy: category `specialty` · permit_trade `null` · phase `framing` · CSI `01 54 19`

## Scope
Supplies a mobile (hydraulic truck, rough-terrain or crawler) crane with a certified operator for picks:
trusses, steel, precast, rooftop equipment, materials. Covers setup ground, power-line assessment, swing
barricade, rigging/signaling, and planning for critical and multi-crane lifts. It does NOT cover permanent
overhead/bridge cranes (`material_handling`), machinery moving/skating (`rigging_millwright`), or the
erection trade itself (framing, structural_steel, precast_erection), which hook, guide and connect.

## Existing coverage reconciled
- Hand recipe: none → NEW-TRADE pattern (2 recipes).
- Catalog codes already seeded: `EQUIP-CRANE` (crane + operator per day, migration 0044). Not redeclared;
  the hourly `G-CRANE-HYD-HR` is described as an alternative (price one or the other). Quantity rules do
  not emit `EQUIP-CRANE` to avoid double counting with `generate {include_equipment:true}`.
- Blueprint template tasks hitting this trade: none.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| ecfr-1926-cc | 29 CFR 1926 Subpart CC: Cranes and Derricks in Construction | 1 | gov_open | steps, hazards, QA, checklists (rule text read on eCFR 2026-10-08: .1402, .1404(q), .1408, .1412, .1413, .1417, .1419, .1423, .1424, .1425, .1427, .1428, .1431, .1432) |
| ecfr-1926-h | 29 CFR 1926 Subpart H: Materials Handling | 1 | gov_open | rigging inspection (1926.251(a)) |
| crane_service-osha-topic | OSHA Cranes and Derricks in Construction topic page | 1 | gov_open | index / fact sheets (osha.gov 403s to curl) |
| platform-baseline | The Jobsite cost baseline | — | platform_estimate | all assembly costs |

ASME B30.5 and NCCCO are named only (proprietary standard / certifying body). Table A minimum approach
distances are not copied; the pack points to 1926.1408.

## Work steps
Recipe `crane_setup_and_lift` (title_re `\bcranes?\b`): plan setup and access → check for power lines and
mark the work zone → set up the crane and barricade the swing radius → rig and inspect the load → make the
lift with a signal person → land the load and demobilize.

Recipe `critical_lift_planning` (critical/tandem/multi-crane/engineered lift, priority 10): decide whether
the lift is critical → write the lift plan → hold the pre-lift meeting → run the lift under the lift director.

## Hazards (12)
power_line 1926.1408(a) · ground_failure 1926.1402(b) · outrigger_set 1926.1404(q) · overload 1926.1417(o) ·
swing_radius 1926.1424(a) · struck_by_load 1926.1425(b) · rigging_failure 1926.251(a)(1) · signals
1926.1419(a) · wind 1926.1417(n) · tandem_lift 1926.1432(a) · crane_access_fall 1926.1423 ·
hoisting_personnel 1926.1431(a).

## QA checklist (15)
Load weight known; ground prepared + underground hazards shared; power-line option recorded; outriggers on
mats; swing radius barricaded; shift/annual inspection + load chart in cab; operator certified; signal person
qualified; rigging inspected; load within chart; test lift; no one under load; lift plan written; ground
bearing checked; pre-lift meeting held.

## Inspection / acceptance checkpoints (null permit, descriptive keys)
- ground_conditions_check: 1926.1402(b), (c)(2)
- power_line_assessment: 1926.1408(a)(1), (a)(2), (b)
- pre_lift_check: 1926.1412(d), .1427/.1428, .1424(a), .1417(o), .1417(n)
- critical_lift_plan_review: 1926.1432(a), (b)

## Cost basis (all `estimate`, platform-baseline, 2026 national)
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % |
|---|---|---|---|---|---|---|
| G-CRANE-HYD-HR | 40–60 t hydraulic crane with operator | HR | 0 | 0 | 22500 | 0 |
| G-CRANE-MOB-EA | Mobilization/travel/setup/teardown | EA | 0 | 1 | 90000 | 0 |
| G-CRANE-MATS-DAY | Crane mats rental + placement | DAY | 0 | 1 | 25000 | 0 |
| G-CRANE-RIGGER-DAY | Qualified rigger / signal person | DAY | 0 | 8 | 0 | 0 |
| G-CRANE-LIFTPLAN-EA | Engineered critical/tandem lift plan | EA | 0 | 2 | 150000 | 0 |

## Quantity rules
- G-CRANE-MOB-EA = const 1 when trusses / post-frame columns / purlins on plans
- G-CRANE-HYD-HR = const × 8 when engineered trusses
- G-CRANE-RIGGER-DAY = const 1 when trusses / post-frame columns
- G-CRANE-MATS-DAY = const × 2 on commercial / industrial
- G-CRANE-LIFTPLAN-EA = const 1 on commercial / industrial

## Blueprint callouts
None (wave rule).

## Open questions → REVIEW_QUEUE
- All 5 costs are estimates; regional crane rates vary widely (4-hour minimums, counterweight trucks).
- Lift-plan fee carried as equipment cost so it is not taxed as material; confirm convention.
- 12 hazards + 11 QA items + safety checklist items pending human Spanish translation.
