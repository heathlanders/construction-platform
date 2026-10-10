# Dossier — `material_handling` (Material Handling — Conveyors / Cranes / Hoists / Racking)

> Wave: w18 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/material_handling.ts` · Status: draft
> Taxonomy: category `specialty` · permit_trade `building` · phase `rough_in` · CSI `41`

## Scope
Installs permanent material-handling equipment: steel pallet/storage racking (frames, beams, decks, anchors,
guards, load plaques), overhead bridge / jib / monorail cranes and hoists on runways through no-load and load
tests, and powered/gravity conveyors with guards, emergency stops, start-up warning and lockout. Hand-offs:
runway support steel → structural_steel; final power connections → electrical; sprinklers/high-piled storage
fire protection → fire_sprinkler; crane rental for erection → crane_service.

## Existing coverage reconciled
- Hand recipe: none → NEW-TRADE pattern (3 recipes).
- Catalog codes already seeded: none with `B-MH-`.
- Blueprint template tasks hitting this trade: none.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| material_handling-ufgs-41-22-13-14 | UFGS 41 22 13.14 Bridge Cranes, Top Running | 1 | public_domain | crane steps, tests, QA |
| material_handling-ufgs-41-22-13-15 | UFGS 41 22 13.15 Bridge Cranes, Under Running | 1 | public_domain | crane QA |
| material_handling-ecfr-1910-179 | 29 CFR 1910.179 overhead cranes | 1 | public_domain | rated load test (≤125% unless maker recommends), marking |
| ecfr-1926-{c,h,j,k,l,m,n,o,z,cc} | 29 CFR 1926 subparts | 1 | public_domain | hazards; 1926.554/.555 hoists & conveyors |
| icc-pa | IBC 2209.1 / 1613.1 / 1705.2, IFC 3201.1 | 3 | ref only | code refs |
| material_handling-mhi-rmi | RMI / ANSI MH16.1 | 4 | ref only | rack practice (no values) |
| material_handling-mhi-cmaa | CMAA 70/74 | 4 | ref only | runway tolerances by name only |
| platform-baseline | — | — | estimate | all costs |

## Work steps
- **pallet_rack** (example "Install selective pallet racking"): layout/slab/design check → stand frames + set beams (locks) → plumb, shim, anchor (IBC 2209.1, 1613.1) → decks, guards, plaques → final walk (gate final; IBC 2209.1, IFC 3201.1).
- **crane_hoist** (example "Install overhead bridge crane and runway"): verify runway steel/clearances → set & align runway (gate framing; IBC 1705.2) → set bridge/trolley/hoist + electrification → no-load test → load test, tram, mark, turnover (gate final).
- **conveyor** (example "Install belt conveyor system"): layout + supports → set/level/track → drives, guards, e-stops, warning horn → LOTO test run + turnover (gate final).

## Hazards
fall_elevated 1926.501(b)(1) · aerial_lift 1926.453(b)(2)(v) · struck_by_stack 1926.250(a)(1) · suspended_load 1926.1425(a) ·
rigging 1926.251(a)(1) · hoist_clear 1926.554(a)(4) · conveyor_caught 1926.555(a)(1) · loto 1926.417(a) · forklift 1926.602(d) ·
silica_drill 1926.1153(c)(1) · electrical 1926.416(a)(1) · hot_work 1926.352(d). All verified on law.cornell.edu.

## QA checklist
16 items (8 safety, ES pending): design on site, beam locks, plumb, anchors per design, guards, load plaques, field dims,
runway alignment record, no-load test, hook tram, load test report, capacity marked, conveyor level/tracking, guards,
e-stop reset, turnover docs.

## Inspection / acceptance checkpoints
- framing: runway beams/rails per drawings, alignment record, special inspection of bolting/welding.
- final: racks per design + plaques, high-piled storage approval, crane load-test report + capacity marking, conveyor guards/stops.

## Cost basis (all platform-baseline estimate, 2026 national)
| Code | Item | Unit | Mat ¢ | Hr/unit | Equip ¢ | Waste % |
|---|---|---|---|---|---|---|
| B-MH-RACK-BAY | selective rack bay, 3 levels + decks | EA | 80000 | 1.5 | 3000 | 0 |
| B-MH-RACK-ANCHOR-EA | base-plate anchor | EA | 600 | 0.15 | 100 | 5 |
| B-MH-COLGUARD-EA | column guard | EA | 9000 | 0.5 | 0 | 0 |
| B-MH-MONORAIL-HOIST-EA | monorail + 2 t hoist allowance | EA | 900000 | 24 | 80000 | 0 |
| B-MH-BRIDGE-CRANE-EA | ~5 t single-girder crane allowance | EA | 6000000 | 120 | 500000 | 0 |
| B-MH-CONV-LF | powered conveyor | LF | 35000 | 1 | 1000 | 0 |
| B-MH-LOADTEST-EA | crane/hoist load test | EA | 0 | 8 | 250000 | 0 |

## Quantity rules
- `B-MH-RACK-BAY` = const × 20 (industrial only); `B-MH-RACK-ANCHOR-EA` = const × 44 (industrial); `B-MH-COLGUARD-EA` = const × 10 (industrial).
- Crane/conveyor/load test: no rule — too project-specific without a plan callout.

## Blueprint callouts
None this wave.

## Open questions → REVIEW_QUEUE
- IBC 2209.1 and IFC 3201.1 section numbers from memory of the 2021 editions (ICC site blocked to curl) — verify.
- Crane-load section in IBC ch. 16 (1607.x) omitted — numbering differs across editions.
- All costs are estimates; crane/hoist rows are allowances with very wide spread.
- Industrial const quantity rules (rack bays/anchors/guards) are placeholders until a rack-layout fact exists.
