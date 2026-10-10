# Dossier — `highway_bridge` (Highway / Street / Bridge Construction)

> Wave: w19 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/highway_bridge.ts` · Status: draft
> Taxonomy: category `heavy_civil` · permit_trade `null` · phase `sitework` · CSI `34 71`

## Scope
Public-works road and bridge prime contractor work: subgrade preparation and proof roll, dense-graded
aggregate base, concrete (and asphalt) pavement, and bridge superstructures — bearings, girder setting,
deck forming/falsework, deck reinforcement, deck pour/finish/cure, and railings. Hand-offs: mass grading
(`excavation`), utilities (`site_utilities`), piles/shafts (`deep_foundations`), asphalt paving detail and
HMA pricing (`asphalt_paving`), guardrail (`guardrail_barriers`), signals (`traffic_signals_lighting`),
striping (`pavement_marking`), work-zone devices (`traffic_control`).

## Existing coverage reconciled
- Hand recipe: none → NEW-TRADE pattern, permit null → no gates, no code_refs.
- Catalog codes already seeded/declared: `B-ASP-HMA-TON`, `B-ASP-TACK-SY`, `B-AGG-BASE-SY` (asphalt_paving,
  building bucket) — HMA not redeclared. No `HC-` codes existed before this pack.
- Blueprint template tasks hitting this trade: none.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| asphalt_paving-wisdot-ss-211 | WisDOT SS 211 Preparing the Foundation | 1 | gov_open | subgrade/base prep, frozen/soft areas |
| excavation-wisdot-ss-207 | WisDOT SS 207 Embankment | 1 | gov_open | 95% density top 6 ft / near abutments |
| highway_bridge-wisdot-ss-301 | WisDOT SS 301 Base and Subbase | 1 | gov_open | standard/special compaction, EBS |
| asphalt_paving-wisdot-ss-305 | WisDOT SS 305 Dense-Graded Base | 1 | gov_open | layer limits, 1 1/4-in. top 4 in. |
| highway_bridge-wisdot-ss-415 | WisDOT SS 415 Concrete Pavement | 1 | gov_open | placing, dowels, straightedge, curing, joints |
| highway_bridge-wisdot-ss-740 | WisDOT SS 740 QMP Ride | 1 | gov_open | IRI / profiler |
| highway_bridge-wisdot-ss-502 | WisDOT SS 502 Concrete Bridges | 1 | gov_open | falsework, deck finish, deck/parapet cure |
| highway_bridge-wisdot-ss-503 | WisDOT SS 503 Prestressed Members | 1 | gov_open | girder handling/erection |
| highway_bridge-wisdot-ss-505 | WisDOT SS 505 Steel Reinforcement | 1 | gov_open | chairs, ties, approval |
| highway_bridge-wisdot-ss-506 | WisDOT SS 506 Steel Bridges | 1 | gov_open | bearings, girder picks, falsework clearance |
| highway_bridge-wisdot-ss-513 | WisDOT SS 513 Railings | 1 | gov_open | anchor bolts / alignment |
| excavation-wisdot-aup | WisDOT Average Unit Price List FY23–25 | 2 | gov_open | all 6 assembly costs (derived) |
| asphalt_paving-mutcd-part6 | MUTCD Part 6 | 1 | public_domain | work-zone hazard |
| formwork-ecfr-1926-703 | 29 CFR 1926.703 | 1 | public_domain | falsework hazard/QA |
| ecfr-1926-e/g/m/o/p/q/r/z, -cc | 29 CFR 1926 subparts | 1 | public_domain | hazards |

## Work steps
**roadway_reconstruction** (example "Roadway reconstruction — subgrade, base and pavement"):
1. Set traffic control, locate utilities and stake grades.
2. Shape, compact and proof-roll the subgrade (207/211; EBS). QA subgrade_density, subgrade_no_soft_spots.
3. Place and compact the dense-graded base (301/305). QA base_density_grade.
4. Pave — asphalt or concrete per plan (415; asphalt via asphalt_paving). QA dowel_alignment, pavement_straightedge.
5. Texture, cure, saw joints and check ride (415.3.7–.12, 740). QA ride_quality.

**bridge_superstructure** (example "Bridge superstructure — set girders, pour and cure deck"):
1. Check bearing seats and set the bearings (506.3.30).
2. Lift and set the girders, then brace them (503.3.4, 506.3.27/.29; 1926.704/.753/.756).
3. Build overhang brackets, deck forms and falsework (502.3.2, 506.3.26).
4. Place and tie the deck reinforcement (505.3).
5. Pour and finish the deck with the finishing machine (502.3.7.8).
6. Wet-cure, strip falsework, set railing (502.3.8.2.3–.4, 502.3.4.2, 513).

## Hazards
| id | OSHA ref | Sev |
|---|---|---|
| work_zone_traffic | 1926.200(g)(2) | 4 |
| equipment_backing | 1926.602(a)(9)(ii) | 4 |
| truck_backing | 1926.601(b)(4) | 4 |
| trench_cave_in | 1926.652(a)(1) | 4 |
| deck_edge_fall | 1926.501(b)(1) | 4 |
| suspended_girder | 1926.753(d)(1) | 4 |
| girder_rollover | 1926.704(a) (steel: 1926.756(a)(1) in controls) | 4 |
| falsework_collapse | 1926.703(a)(1) | 4 |
| rebar_impalement | 1926.701(b) | 3 |
| silica_dust | 1926.1153(c)(1) | 3 |
| drowning | 1926.106(a) | 4 |

## QA checklist
15 items (3 safety → ES pending): subgrade density/soft spots, base compaction, dowels, straightedge, ride,
bearings, girder condition, girder bracing (safety), falsework (safety), deck rebar, deck finish, deck cure,
falsework release (safety), railing alignment.

## Inspection / acceptance checkpoints (descriptive keys — no AHJ gates)
- subgrade_proof_roll, base_density_test, concrete_pavement_pre_pour, bearing_girder_set,
  deck_reinforcement_pre_pour, deck_pour_inspection, ride_smoothness.

## Cost basis (WisDOT AUP FY23/24/25 installed bid prices → split, confidence `derived`)
| Code | Unit | Mat ¢ | Labor h | Equip ¢ | Waste % | AUP item |
|---|---|---|---|---|---|---|
| HC-HWY-BASE-AGG-TON | TON | 850 | 0.03 | 200 | 3 | 305.0120 $12.11/$11.85/$12.07 |
| HC-HWY-CONC-PAVE-8-SY | SY | 3800 | 0.12 | 1000 | 3 | 415.0080 $57.99/$58.15/$59.83 |
| HC-HWY-DECK-CONC-CY | CY | 22000 | 7.5 | 9000 | 4 | 502.0100 $762/$775/$830 |
| HC-HWY-REBAR-COATED-LB | LB | 85 | 0.006 | 5 | 2 | 505.0600 $1.56/$1.40/$1.34 |
| HC-HWY-GIRDER-PS-54W-LF | LF | 24000 | 0.25 | 3000 | 0 | 503.0155 $285/$292/$275 |
| HC-HWY-RAIL-TUBULAR-LF | LF | 20000 | 0.6 | 2000 | 0 | 513.4061 $310/$295/$262 |
Split assumes $60–65/h burdened labor; waste_pct is a platform estimate.

## Quantity rules
None — blueprint facts (building plans) carry no road/bridge quantities; a const rule scoped to a
building type would invent a bridge on every commercial job.

## Blueprint callouts (components)
None this wave.

## Open questions → REVIEW_QUEUE
- 11 hazards + 3 safety QA + 3 checklist items pending human ES.
- AUP bid prices are installed totals; the material/labor/equipment split is our derivation.
- Proof rolling is not a WisDOT 2025 standard-spec item by name (engineer-directed); checklist wording is practice.
