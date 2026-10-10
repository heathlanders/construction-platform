# Dossier — `rail_track` (Railroad Track Construction)

> Wave: w20 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/rail_track.ts` · Status: draft
> Taxonomy: category `heavy_civil` · permit_trade `null` · phase `sitework` · CSI `34 11`

## Scope
Builds and rebuilds railroad track — roadbed/subballast, ties, rail and track panels, turnouts, thermite field
welds and CWR destressing, ballast/tamping/surfacing — plus at-grade crossing surface replacement. Typical
contractor jobs: industry spurs and sidings that tie into a Class I/short-line railroad, and crossing renewals.
Does NOT design track (railroad/engineer), install signals or crossing warning devices (railroad signal forces),
or do road traffic control (`traffic_control`) or roadbed mass earthwork (`excavation`/`civil`).

## Existing coverage reconciled
- Hand recipe: none → NEW-TRADE pattern, 2 recipes, no gates (permit_trade null).
- Catalog codes already seeded: none with `HC-RR-`.
- Blueprint template tasks hitting this trade: none.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| rail_track-ecfr-49-213 | 49 CFR 213 Track Safety Standards | 1 | public_domain | applicability (213.3 plant railroads excluded), gage 213.53, alinement 213.55, surface 213.63, ballast 213.103, ties 213.109, CWR plan 213.118–.119, turnouts 213.133 |
| rail_track-ecfr-49-214-c | 49 CFR 214 Subpart C Roadway Worker Protection | 1 | public_domain | job briefing 214.315, working limits 214.319, adjacent tracks 214.336, training 214.343 |
| rail_track-arema-mre | AREMA Manual for Railway Engineering | 3 | proprietary_ref_only | roadbed / crossing practice — reference only, no numbers |
| ecfr-1926-c/e/g/h/i/j/o/p/z | 29 CFR 1926 subparts | 1 | public_domain | hazards |
| asphalt_paving-mutcd-part6, concrete_repair_lifting-call811 | MUTCD Part 6; 811 | 1/4 | gov/assoc | crossing traffic control, locates |
| platform-baseline | Platform estimate | — | platform_estimate | all costs |

## Work steps
Recipe `spur_siding_construction`: right-of-entry + protection + briefing → subgrade/subballast → ties, rail, gage →
turnout → field welds + neutral temperature → ballast, tamp, line, surface, railroad walk.
Recipe `crossing_surface_replacement`: closure + protection → remove old surface/track → drainage, subballast, ties,
rail → ballast/tamp/surface → panels + approaches → reopen.

## Hazards
struck_by_train (1926.21(b)(2) + 49 CFR 214), struck_by_traffic (1926.201(a)), equipment_backing (1926.602(a)(9)(ii)),
suspended_load (1926.251(a)(1)), rail_tie_handling (1926.250(a)(1)), thermite_burn (1926.102(a)(1)),
weld_fire (1926.352(a)), rail_saw_drill (1926.300(b)(1)), ballast_dust (1926.1153(d)(1)), buried_cable (1926.651(b)(1)),
pinch_switch_points (1926.21(b)(2)), noise (1926.101(a)). All section texts checked on eCFR 2026-10-08.

## QA checklist
15 items — protection briefed, subballast grade, drainage, tie spacing/condition (213.109), gage ≥ 4 ft 8 in.
(213.53), CWR joints ≥ 2 bolts (213.119(c)(1)), turnout points/flangeways (213.133), weld finish, neutral
temperature record (213.119(a),(d)), anchors (213.119(b)), ballast section, geometry, crossing subgrade, panels
flush, flangeways clear.

## Inspection / acceptance checkpoints
railroad_protection_briefing, subballast_ballast_inspection, track_geometry_acceptance,
cwr_neutral_temperature_record, turnout_inspection, crossing_acceptance.

## Cost basis
No public DOT bid tab with track items found (WisDOT AUP FY23–25 has only 204.0200 Removing Railroad Track
and 801.0117 flagging reimbursement at $1 DOL). All costs `platform-baseline` / `estimate`.
| Code | Item | Unit | Material ¢ | Labor hr | Equip ¢ | Waste % |
|---|---|---|---|---|---|---|
| HC-RR-TRACK-TF | Track on timber ties, laid + gaged | TF | 12000 | 0.25 | 2500 | 2 |
| HC-RR-BALLAST-TON | Ballast placed, tamped, regulated | TON | 3500 | 0.05 | 800 | 5 |
| HC-RR-TURNOUT-EA | No. 9–10 turnout installed | EA | 9000000 | 160 | 800000 | 0 |
| HC-RR-THERMITE-WELD-EA | Thermite field weld | EA | 45000 | 3 | 10000 | 0 |
| HC-RR-XING-PANEL-TF | Concrete crossing panels | TF | 70000 | 2 | 15000 | 0 |
| HC-RR-FLAGGER-DAY | Railroad-billed flagging | DAY | 120000 | 0 | 0 | 0 |

## Quantity rules
None (no blueprint facts for track; per wave instruction).

## Blueprint callouts
None this wave.

## Open questions → REVIEW_QUEUE
- Equipment vocab lacks hi-rail truck, tamper, ballast regulator, spiker.
- FRA 213 does not apply to plant railroads (213.3(b)); private industry track acceptance follows the serving
  railroad's industry-track standard — confirm the pack wording with an owner.
- All six costs are estimates; WisDOT/other DOT rail programs could supply derived numbers.
