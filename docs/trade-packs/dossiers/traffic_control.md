# Dossier — `traffic_control` (Traffic Control)

> Wave: w18 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/traffic_control.ts` · Status: draft
> Taxonomy: category `specialty` · permit_trade `null` · phase `site_prep` · CSI `01 55`

## Scope (2–4 sentences)
Work-zone temporary traffic control (TTC): getting the municipal right-of-way / street-use permit and an
approved traffic control plan (TCP), then setting, reviewing, maintaining and removing signs, channelizing
devices, arrow boards and flaggers per MUTCD Part 6. Does NOT include permanent or long-life pavement
striping (`pavement_marking`, G-STRIPE-*), permanent signage (`signage`), signals (`traffic_signals_lighting`)
or temporary barrier wall design (highway/guardrail trades).

## Existing coverage reconciled
- Hand recipe: none → NEW-TRADE pattern, 2 recipes.
- Catalog codes already seeded: none with G-TC-; G-STRIPE-STALL (pavement_marking) left alone.
- Blueprint template tasks hitting this trade: none (0).
- Shared source reused: `asphalt_paving-mutcd-part6` (same MUTCD 11th ed. Part 6 PDF), `excavation-wisdot-aup`.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| asphalt_paving-mutcd-part6 | FHWA MUTCD 11th Ed. (Dec 2023) Part 6 | 1 | public_domain | steps, QA, checklists (6B.01, 6B.06, 6B.08, 6C.05, 6D.01–6D.06, 6F.03, 6H.02, 6J.02, 6K.01/.03/.06, 6L.06, Table 6B-1/6B-3/6B-4) |
| traffic_control-wisdot-ss-643 | WisDOT Std Spec 2025 §643 Traffic Control | 1 | gov_open | after-setup review, device quality (ATSSA marginal), 2-h restore, 14-day removal, arrow board night dimming |
| traffic_control-wisdot-wmutcd | Wisconsin MUTCD | 1 | gov_open | WI adoption of MUTCD Part 6 |
| traffic_control-madison-row-permits | City of Madison Engineering permits | 1 | gov_open | right-of-way permit + contractor prequalification hold point |
| excavation-wisdot-aup | WisDOT Average Unit Price List FY2023–25 | 2 | gov_open | device-day floor prices (643.0300, .0800, .0900, .1070) |
| ecfr-1926-g / -o / -c / -d | 29 CFR 1926 Subparts G, O, C, D | 1 | gov_open | hazards (1926.200(g)(1)/(2), 1926.201(a), 1926.601(b)(4), 1926.602(a)(9)(ii), 1926.600(a)(1), 1926.21(b)(2), 1926.56(a), 1926.51(a)(1)) |

ANSI/ISEA 107 (apparel classes) and ATSSA quality guide are referenced only by name via MUTCD / WisDOT.

## Work steps (draft → pack recipes)
**lane_closure** (example "Set up lane closure and work-zone traffic control"): confirm permit + TCP →
load and check devices → advance warning signs (ROAD WORK AHEAD first) → taper/buffer/tangent + arrow board
(L = WS²/60 ≤40 mph, L = WS ≥45 mph; spacing ≤1×/2× speed) → drive-through review + per-shift checks → remove
in reverse.
**flagging_operation** (priority 10, example "Flagging operation — one-lane two-way traffic"): brief +
stations → flagger signs + 50–100 ft one-lane taper → paddle signals, Class 3 at night → relief + shutdown.
No gates, no code_refs (null permit family).

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| passing_traffic | struck by traffic in the zone | 1926.200(g)(2) | 4 |
| setup_in_live_lane | struck during setup/teardown | 1926.200(g)(1) | 4 |
| flagger_struck | flagger hit | 1926.201(a) | 4 |
| work_truck_backing | backing TC truck | 1926.601(b)(4) | 4 |
| equipment_reverse | reversing earthmoving equipment | 1926.602(a)(9)(ii) | 3 |
| night_visibility | night/low visibility | 1926.56(a) | 3 |
| unattended_equipment | unlit trailers/arrow boards | 1926.600(a)(1) | 3 |
| untrained_crew | untrained setup/supervision | 1926.21(b)(2) | 3 |
| heat_stress | heat illness | 1926.51(a)(1) | 3 |
| manual_lifting | lifting stands/drums | 1926.21(b)(2) | 2 |

## QA checklist
15 items — permit/TCP on site, ped route, sign sequence/spacing (Table 6B-1), taper length, device spacing,
buffer clear, cone/drum specs, device condition, arrow board use, daily log (after setup + each shift + night,
2-h restore), flagger training/station/apparel/paddle, teardown (14-day rules).

## Inspection / acceptance checkpoints
- `row_street_use_permit`, `tcp_approval`, `daily_device_inspection`, `teardown_restoration`.

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| G-TC-FLAGGER-HR | flagger | HR | 0 | 1 | 100 | 0 | estimate |
| G-TC-SIGN-PKG-DAY | 3-sign package | DAY | 0 | 0 | 2400 | 0 | estimate; WisDOT 643.0900 $0.35–0.46/sign-day floor |
| G-TC-ARROW-DAY | arrow board | DAY | 0 | 0 | 7500 | 0 | estimate; WisDOT 643.0800 ≈$10/day floor |
| G-TC-DEVICE-DAY | drum/cone/barricade | DAY | 0 | 0 | 125 | 2 | estimate; WisDOT 643.0300/1070 $0.16–0.24 floor |
| G-TC-LANE-CLOSE-EA | set/remove closure | EA | 0 | 4 | 8000 | 0 | estimate |
| G-TC-TCP-EA | TCP drawing/submittal | EA | 45000 | 1 | 0 | 0 | estimate |

WisDOT bid prices are long-duration state-contract averages — far below short-term rental; used only as a floor.

## Quantity rules
All `const`, scoped to residential_mf/commercial/industrial (only seeded when the project schedule has a
traffic_control task): TCP ×1, lane closures ×2, sign package ×5 days, devices ×100 device-days, flagger ×16 h
(commercial/industrial).

## Blueprint callouts (components)
None this wave.

## Open questions → REVIEW_QUEUE
- Trade note cited "6C tapers, flagger 6E" — in MUTCD 11th ed. tapers are 6B.08 and flaggers are Chapter 6D
  (6E = one-lane two-way methods). Pack uses 11th-ed. numbering.
- Equipment vocab lacks arrow_board / truck_mounted_attenuator / traffic control truck.
- All six costs are estimates.
