# Dossier — `traffic_signals_lighting` (Traffic Signals / Street Lighting / ITS)

> Wave: w19 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/traffic_signals_lighting.ts` · Status: draft
> Taxonomy: category `heavy_civil` · permit_trade `null` · phase `sitework` · CSI `34 41`

## Scope (2–4 sentences)
Builds traffic signals, roadway/street/site lighting and roadside ITS hardware: drilled-shaft pole bases,
conduit and pull boxes, signal poles and mast arms, vehicle and pedestrian heads, push buttons, light
poles/luminaires, cabinet wiring, grounding, testing, turn-on and burn-in. It does NOT design signal
timing or photometrics (agency / engineer of record), set the utility service lateral (utility), or run
the work-zone traffic control program (`traffic_control`). Electrical work, but DOT/municipally
inspected — `permit_trade` null, so no gating inspections or code_refs; hold points live in
`inspection_checklists`.

## Existing coverage reconciled
- Hand recipe: none → pack is NEW-TRADE pattern (2 recipes).
- Catalog codes already seeded: none with `HC-SIG-` (no HC- rows in any migration yet).
- Blueprint template tasks hitting this trade: none.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| traffic_signals_lighting-mutcd-part4 | FHWA MUTCD 11th ed. Part 4 | 1 | public_domain | covered faces (4D.01), mounting height (4D.09), clearance timing (4F.17), flash→steady (4G.04) |
| traffic_signals_lighting-wisdot-ss-651 | WisDOT SS 651 General Electrical | 1 | gov_open | backfill layers, megger >500 MΩ, inspection request, 72-h / 20-night runs, as-builts |
| traffic_signals_lighting-wisdot-ss-652 | WisDOT SS 652 Conduit | 1 | gov_open | conduit runs, tracer wire, inspect before backfill |
| traffic_signals_lighting-wisdot-ss-653 | WisDOT SS 653 Pull/Junction Boxes | 1 | gov_open | pull boxes on drain rock, lids |
| traffic_signals_lighting-wisdot-ss-654 | WisDOT SS 654 Bases | 1 | gov_open | bases → 531 |
| traffic_signals_lighting-wisdot-ss-531 | WisDOT SS 531 Ancillary Structure Foundations | 1 | gov_open | shaft plumb 1/8 in/ft, anchor rods, cure before erection |
| traffic_signals_lighting-wisdot-ss-655 | WisDOT SS 655 Wiring | 1 | gov_open | no pull-box splices, slack lengths |
| traffic_signals_lighting-wisdot-ss-656 | WisDOT SS 656 Electrical Service | 1 | gov_open | electrodes, exothermic welds, separate lighting breaker |
| traffic_signals_lighting-wisdot-ss-657 | WisDOT SS 657 Poles, Arms, Standards, Bases | 1 | gov_open | plumb, HS bolts, heads within 5 days, +3° rake |
| traffic_signals_lighting-wisdot-ss-658 | WisDOT SS 658 Traffic Signals | 1 | gov_open | heads hooded until accepted, fixed mounting |
| traffic_signals_lighting-wisdot-ss-659 | WisDOT SS 659 Lighting | 1 | gov_open | luminaire handling, 5 A fusing, EGC to pole lug |
| traffic_signals_lighting-fhwa-lighting-handbook | FHWA Lighting Handbook 2012 | 1 | public_domain | terminology (site 403s to scripts) |
| excavation-wisdot-aup | WisDOT Average Unit Price List FY23–25 | 2 | gov_open | all costs (derived) |
| ecfr-1926-g/k/l/m/o/p/cc, asphalt_paving-mutcd-part6 | 29 CFR 1926; MUTCD Part 6 | 1 | public_domain | hazards |

## Work steps (draft → pack recipes)
`signalized_intersection` (title_re traffic signal / signalized / mast arm / ped signal / ITS / ramp meter):
1. Set traffic control, locate utilities and stake bases
2. Drill and pour the signal pole bases (531.3)
3. Trench or bore conduit and set pull boxes (652/653)
4. Erect poles and mast arms, then hang the heads covered (657/658, MUTCD 4D.01)
5. Pull cable, wire the cabinet and ground the system (655/656, megger 651.3.3)
6. Signal inspection, turn-on and burn-in (651.3.3, MUTCD 4G.04)

`street_lighting` (title_re street/roadway/site/parking lighting, light pole, luminaire …):
1. Locate, stake and plan the circuit · 2. Build the light pole bases · 3. Run conduit or cable-in-duct
and pull wire · 4. Set poles, arms and luminaires (659) · 5. Test, energize and burn in.
No gates (permit_trade null).

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| work_zone_traffic | struck by traffic | 1926.201(a) | 4 |
| energized_circuits | shock | 1926.416(a)(1) | 4 |
| lockout | re-energization | 1926.417 | 4 |
| overhead_lines | crane/lift contact with power line | 1926.1408(a) | 4 |
| suspended_load | pole/arm being set | 1926.1425(b) | 4 |
| aerial_lift_fall | bucket truck fall | 1926.453(b)(2)(v) | 3 |
| utility_strike | buried lines | 1926.651(b)(1) | 4 |
| trench_cave_in | conduit trench | 1926.652(a)(1) | 4 |
| open_shaft | fall into drilled hole | 1926.501(b)(7)(ii) | 3 |
| backing_vehicles | drill rig / trucks | 1926.601(b)(4) | 3 |

## QA checklist
15 items — locates, anchor rods true, base cured, conduit inspected before backfill, pull box grade,
pole plumb/HS bolts, heads covered (safety), head height/aim, no pull-box splices, megger, grounding
(safety), luminaire level/fused, timing from agency (safety), turn-on sequence (safety), burn-in + as-builts.

## Inspection / acceptance checkpoints
- `pole_base_anchor_bolt` — shaft, cage, template, cure (531.3)
- `conduit_pull_box` — open-trench inspection, tracer wire, pull boxes (652/653)
- `signal_turn_on_acceptance` — inspection request, megger, head clearance, timing, continuous run
- `lighting_ground_burn_in` — EGC bonds, fusing, IR test, night burn-in

## Cost basis
Labor split assumes ≈$95/hr burdened crew.
| Code | Item | Unit | Mat ¢ | Lab hr | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| HC-SIG-MAST-POLE-EA | signal pole + 30 ft arm | EA | 1,500,000 | 16 | 60,000 | 0 | 657.0350 + 657.0530 ≈ $17,600 (derived) |
| HC-SIG-DRILLED-BASE-EA | drilled-shaft base | EA | 300,000 | 20 | 220,000 | 5 | 654.0110 avg ≈ $7,560 (derived) |
| HC-SIG-HEAD-3S-EA | 3-section 12 in. head | EA | 68,000 | 1.5 | 5,000 | 0 | 658.0173 ≈ $871 (derived) |
| HC-SIG-LIGHT-UNIT-EA | complete light unit | EA | 400,000 | 8 | 35,000 | 0 | sum of 657/659/654 items ≈ $5,140 (derived) |
| HC-SIG-CONDUIT-2IN-LF | 2 in. PVC trenched | LF | 280 | 0.06 | 200 | 5 | 652.0225 ≈ $10.91 (derived) |
| HC-SIG-PULLBOX-EA | 24×36 non-conductive pull box | EA | 145,000 | 4 | 15,000 | 0 | 653.0154 ≈ $2,034 (derived) |

## Quantity rules
- `HC-SIG-LIGHT-UNIT-EA` = 4 (const) when `asphalt_paving` on commercial/industrial — parking-lot allowance.
- `HC-SIG-CONDUIT-2IN-LF` = 300 (const), same scope.

## Blueprint callouts (components)
- none this wave.

## Open questions → REVIEW_QUEUE
- Spanish safety text pending (10 hazards, 5 QA, 2 checklist items).
- Material/labor/equipment split of WisDOT averages is our own (derived); WisDOT pole/base "type" ↔ size mapping assumed (Type 10 ≈ mast-arm signal pole, Type 2 ≈ light pole base) — verify against WisDOT SDDs.
- Vocab: no `drill_rig` / `bucket_truck` equipment types (used backhoe / boom_lift as proxies).
- Parking-lot lighting allowance (4 poles / 300 LF) is a placeholder for a photometric plan.
