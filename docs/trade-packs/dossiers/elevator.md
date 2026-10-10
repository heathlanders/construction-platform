# Dossier — `elevator` (Elevator / Escalator / Conveying)

> Wave: w14 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/elevator.ts` · Status: draft
> Taxonomy: category `mechanical_systems` · permit_trade `building` · phase `rough_in` · CSI `14 20`

## Scope (2–4 sentences)
Elevators and other conveyances: hydraulic and MRL traction passenger elevators, LULA and residential
elevators, vertical/inclined platform lifts, stairway chairlifts and dumbwaiters. The pack covers the GC's
preparation work (pit, sump, waterproofing, plumb rated hoistway, rail-bracket blocking, controller/machine
space, power, lighting, phone line, fire-alarm recall and sprinkler shunt-trip coordination), guarding open
hoistways during construction, installation by a licensed elevator mechanic, the state acceptance
inspection and permit to operate, and owner turnover. Escalators are named in the taxonomy label but get no
recipe here (rare in the target market). Fire-alarm, electrical and sprinkler scopes stay with those trades.

## Existing coverage reconciled
- Hand recipe: none (`elevator` not in `HAND_RECIPE_KEYS`) → NEW-TRADE pattern, 3 recipes.
- Catalog codes already seeded: none with `B-ELV-` (only `B-PT-ELEV-SF`, unrelated).
- Blueprint template tasks hitting this trade: none.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| elevator-wi-sps318 | Wis. Admin. Code ch. SPS 318 — Elevators, Escalators and Lift Devices | 1 | gov_open | approval (318.1007), permit to operate (318.1011), acceptance (318.170810), platform lifts (318.1810), registration (318.1009), adopted standards (318.1005) |
| elevator-wi-dsps-conveyance | WI DSPS Elevators and Conveyances program page | 1 | gov_open | process outline |
| ecfr-1926-m | 29 CFR 1926 Subpart M — Fall Protection | 1 | public_domain | 501(b)(3), 501(b)(14), 501(c), 502(d) |
| ecfr-1926-n | Subpart N — Hoists, Elevators, Conveyors | 1 | public_domain | 552(a)(1), 554(a)(1) |
| ecfr-1926-h | Subpart H — Materials Handling | 1 | public_domain | 251(a)(1) rigging |
| ecfr-1926-k | Subpart K — Electrical | 1 | public_domain | 416(a)(1), 417(b) |
| ecfr-1926-aa | Subpart AA — Confined Spaces | 1 | public_domain | 1203(a) pit evaluation |
| ecfr-1926-j | Subpart J — Welding and Cutting | 1 | public_domain | 352(a) |
| ecfr-1926-c | Subpart C — General | 1 | public_domain | 20(b)(1) |
| icc-pa | ICC public access — IBC ch. 30, IRC R321 | 3 | proprietary_ref_only | section numbers + paraphrase |
| platform-baseline | Platform cost baseline | — | platform_estimate | all assembly costs |

ASME A17.1 / A18.1 are adopted by SPS 318.1005 — proprietary, named only, nothing quoted.

## Work steps (draft → pack recipes)
`hoistway_pit_prep` (priority 10, "Elevator pit and hoistway prep"):
1. **Confirm the approved conveyance layout** — WI SPS 318.1007(1).
2. **Build and waterproof the pit** — IBC 3001. Gate: foundation.
3. **Build the hoistway plumb, to size and rated** — IBC 3002, IRC R321. Gate: framing.
4. **Rough in power, lighting, phone and fire recall** — IBC 3003, 3005.

`elevator_install` ("Install hydraulic passenger elevator"):
1. Hand the hoistway over to the elevator mechanic · 2. Set rails, machine or jack, and the car ·
3. Install doors, fixtures and controls · 4. Test, pass the state acceptance inspection and post the
permit (WI SPS 318.170810, 318.1011; gate final) · 5. Turn over to the owner.

`platform_lift` (priority 5, "Install vertical wheelchair platform lift"):
1. Check the approval and landing conditions (318.1007(1)) · 2. Prepare base, wall and power (IRC R321;
gate framing) · 3. Install lift, gates and controls · 4. Test, inspect and train (318.1810; gate final).

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| shaft_fall | Fall into hoistway through landing opening | 1926.501(b)(14) | 4 |
| hoist_area | Fall while landing material at an opening | 1926.501(b)(3) | 4 |
| falling_objects | Struck by objects dropped down the shaft | 1926.501(c) | 4 |
| scaffold_shaft | Fall from hoistway platform / car top | 1926.502(d) | 4 |
| pit_confined | Bad air / water in pit | 1926.1203(a) | 3 |
| rigging | Dropped components from failed rigging | 1926.251(a)(1) | 4 |
| overhead_hoist | Chain hoist / beam overloaded | 1926.554(a)(1) | 4 |
| construction_hoist | Riding/overloading construction-use elevator or hoist | 1926.552(a)(1) | 4 |
| lockout | Car moves while someone is in pit / car top | 1926.417(b) | 4 |
| shock | Shock at controller / disconnect | 1926.416(a)(1) | 4 |
| moving_car | Caught by moving car or counterweight | 1926.20(b)(1) | 4 |
| hot_work | Fire from welding in shaft | 1926.352(a) | 3 |

## QA checklist
17 items — layout/approval, pit depth & dryness, hoistway plumb/clear/rated, disconnect, rails plumb,
running clearances, turnover, permit posted (non-safety, translated); landing guards, door interlocks,
recall interface, recall tested, emergency comm, acceptance passed (safety, ES pending).

## Inspection / acceptance checkpoints
- foundation: pit per layout, pit edges barricaded.
- framing: rated hoistway enclosure, bracket blocking, no foreign piping.
- final: permit to operate before occupancy relies on it; recall/shunt verified.
- state_conveyance_acceptance (NOT a building gate): approval on file, licensed-inspector acceptance tests,
  not in service until authorized, registration + permit to operate (dwelling-unit exemption).

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| B-ELV-HYD-2STOP-EA | 2-stop hydraulic passenger elevator | EA | 5,500,000 | 240 | 150,000 | 0 | estimate |
| B-ELV-MRL-STOP-EA | MRL traction elevator, per stop | EA | 3,000,000 | 110 | 60,000 | 0 | estimate |
| B-ELV-RES-EA | Residential elevator, 2-stop | EA | 2,800,000 | 80 | 40,000 | 0 | estimate |
| B-ELV-VPL-EA | Vertical platform lift | EA | 1,600,000 | 32 | 15,000 | 0 | estimate |
| B-ELV-PIT-EA | GC pit prep (sump, ladder, waterproofing, light) | EA | 250,000 | 18 | 0 | 5 | estimate |

## Quantity rules
- `B-ELV-HYD-2STOP-EA` = const 1 (commercial / residential_mf / industrial)
- `B-ELV-RES-EA` = const 1 (residential_sf)
- `B-ELV-PIT-EA` = const 1 (all four building types)
Rules only fire when the elevator trade is on the project schedule.

## Blueprint callouts (components)
- none this wave.

## Open questions → REVIEW_QUEUE
- IBC ch. 30 section numbers (3001/3002/3003/3005) cited from knowledge — ICC site 403 to curl; verify edition numbering.
- All costs are platform estimates; elevator equipment is quote-driven.
- Safety ES pending: 12 hazards + 6 QA items + 12 inspection checklist items.
- `state_conveyance_acceptance` is a non-family checklist key by design (trade note).
