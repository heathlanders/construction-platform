# Dossier — `irrigation` (Irrigation)

> Wave: w04 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/irrigation.ts` · Status: draft
> Taxonomy: category `sitework` · permit_trade `plumbing` · phase `sitework` · CSI `32 84`

## Scope (2–4 sentences)
Lawn and landscape irrigation: the tap off the potable supply with its backflow preventer, valve manifolds,
mainline/laterals, spray/rotor heads or drip zones, controller + rain/smart sensor, flushing, pressure test,
coverage check, as-built zone map, and the fall blow-out plan in freeze climates. The AHJ concern is the
backflow preventer (plumbing permit — gates `water_supply` and `final`). Does NOT include the 120 V controller
circuit (electrician), grading/seeding/sod (landscaping), or well pumps (well_drilling).

## Existing coverage reconciled
- Hand recipe: none (plumbing family phase recipes still apply) → NEW-TRADE pattern, 2 recipes.
- Catalog codes already seeded: none for irrigation (`P-SPRINKLER-HEAD` is fire sprinkler, not used).
- Blueprint template tasks hitting this trade: none.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| irrigation-ufgs-32-84-23 | UFGS 32 84 23 Underground Sprinkler Systems | 1 | public_domain | steps, QA (trenching, valve boxes, drains, drip, backflow placement, wire, flush, tests, as-builts) |
| irrigation-epa-watersense-controllers | WaterSense labeled controllers | 1 | gov_open | smart controller QA |
| irrigation-epa-sprinkler-spruce-up | WaterSense Sprinkler Spruce-Up | 1 | gov_open | coverage audit |
| plumbing-wi-sps382 (existing) | Wis. Admin. Code SPS 382 | 1 | gov_open | 382.41 cross connection, 382.20(1)(c) registration, 382.22(8) testing |
| irrigation-wi-dsps-ccc-tester | DSPS Cross Connection Control Assembly Tester | 1 | gov_open | registered tester |
| icc-pa (existing) | IPC 608.1, 608.17.5, 312.10, 305 | 3 | proprietary_ref_only | code refs (paraphrase) |
| irrigation-ia-bmp | Irrigation Association BMPs | 4 | proprietary_ref_only | hydraulic/zone design concept |
| irrigation-rainbird-homeowner-guide | Rain Bird Homeowner Sprinkler Installation Guide | 5 | manufacturer_public | head-to-head, no mixed heads, GPM/PSI zoning, flush, wire colors, blow-out port |
| ecfr-1926-{p,i,o,d,k,c,e} | 29 CFR 1926 | 1 | public_domain | hazards |

## Work steps (draft → pack recipes)
`sprinkler_system_install` (example "Install lawn sprinkler system"):
1. **Locate utilities and lay out zones** — QA utility_locate, flow_pressure_matched, head_to_head.
2. **Tap the supply and set the backflow preventer** — Gate `water_supply`. Code: IPC 608.17.5; WI SPS 382.41, 382.20(1)(c). QA backflow_type, blowout_port, backflow_registered_tested.
3. **Trench, set valves and run pipe** — QA pipe_depth, valve_box_access, wire_splices.
4. **Flush, pressure test and set heads** — QA flush_before_heads, pressure_test.
5. **Mount and wire the controller** — QA smart_controller_sensor.
6. **Coverage check, handoff and winterization plan** — Gate `final`. Code: IPC 312.10; WI SPS 382.22(8).

`drip_zone_install` (priority 10, example "Install drip irrigation zone for planting beds"): confirm backflow + drip valve/filter/regulator (gate `water_supply`) → lay dripline and emitters → test, program, hand off (gate `final`).

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| utility_strike | Buried line strike | 1926.651(b)(1) | 4 |
| trencher_moving_parts | Caught in digging chain | 1926.300(b)(2) | 4 |
| raised_boom | Boom/blade drops during service | 1926.600(a)(3)(i) | 3 |
| equipment_struck | Backing skid steer / ride-on trencher | 1926.602(a)(9)(ii) | 3 |
| cave_in | Deep hole at meter / main tap | 1926.652(a)(1) | 4 |
| solvent_vapor | PVC primer / cement vapors | 1926.55(a) | 2 |
| controller_shock | Shock at controller outlet | 1926.404(b)(1)(ii) | 3 |
| heat_illness | Summer heat | 1926.21(b)(2) | 3 |
| blowout_air | Eye injury during air blow-out | 1926.102(a)(1) | 2 |
| noise | Trencher / compressor noise | 1926.52(a) | 2 |

## QA checklist
15 items (3 safety: utility_locate, backflow_type, backflow_registered_tested). See pack.

## Inspection / acceptance checkpoints
- water_supply: backflow type vs hazard, placement (PVB above highest head; RPZ above grade, not in pit), isolation/drain/blow-out port, DSPS registration ≤7 days (WI).
- final: performance test by registered tester, controller on GFCI + sensor, as-built + winterization handoff.

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| P-IRR-ZONE-SPRAY-EA | Spray/rotor zone | EA | 35000 | 6 | 6000 | 5 | platform-baseline, estimate |
| P-IRR-ZONE-DRIP-EA | Drip zone | EA | 22000 | 4 | 0 | 10 | platform-baseline, estimate |
| P-IRR-TAP-EA | Tap + isolation/drain/blow-out port | EA | 9000 | 2 | 0 | 0 | platform-baseline, estimate |
| P-IRR-BFP-PVB-EA | 1 in. PVB + initial test | EA | 28000 | 3 | 9000 | 0 | platform-baseline, estimate |
| P-IRR-CTRL-SMART-EA | Smart controller + sensor | EA | 25000 | 2 | 0 | 0 | platform-baseline, estimate |
| P-IRR-WINTERIZE-EA | Air blow-out service | EA | 0 | 1 | 2500 | 0 | platform-baseline, estimate |

## Quantity rules
- `P-IRR-TAP-EA`, `P-IRR-BFP-PVB-EA`, `P-IRR-CTRL-SMART-EA` = const × 1, scoped `residential_sf`. Pack rules only seed when irrigation is on the project schedule. No blueprint basis for lawn area → zones are added by the estimator from the design.

## Blueprint callouts (components)
- none this wave.

## Open questions → REVIEW_QUEUE
- IPC lawn-irrigation section is 608.17.5 in the 2021 IPC (608.16.5 in 2018) — confirmed via secondary sources; ICC site blocks scripts.
- Hunter Industries residential design guide not cited (site 403s to scripts).
- All 6 assembly costs are platform-baseline estimates.
