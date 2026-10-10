# Dossier — `power_line` (Power Line / Utility Electric / Substation)

> Wave: w20 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/power_line.ts` · Status: draft
> Taxonomy: category `heavy_civil` · permit_trade `null` · phase `site_prep` · CSI `33 71`

## Scope
Utility-side electric construction: overhead distribution on wood/steel poles (holes, setting, framing, guys and
anchors, stringing and sagging), underground primary (URD) trench/conduit/cable to padmount transformers, and
substation civil/electrical install (foundations, ground grid, fence, structures, equipment, testing). Built to the
serving utility's standards and the NESC (IEEE C2, reference only) — NOT the building NEC, so no permit gates or code
refs. Customer-side service entrance, meter base and building wiring belong to `electrical`; trenching for a joint
trench may be `excavation` / `site_utilities`; telecom on the same poles is `telecom_outside_plant`.

## Existing coverage reconciled
- Hand recipe: none → new-trade pattern (3 recipes, no gates).
- Catalog codes already seeded: none with `HC-PWR-`.
- Blueprint template tasks: none.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| ecfr-1926-v | 29 CFR 1926 Subpart V (1926.950–.968, verified on eCFR) | 1 | public_domain | hazards, clearance/grounding QA |
| power_line-ecfr-1926-v-appc | Subpart V App. C — equipotential zones | 1 | public_domain | protective grounds hazard |
| power_line-ecfr-1926-v-appd | Subpart V App. D — wood pole inspection | 1 | public_domain | pole check before climbing |
| ecfr-1926-p, ecfr-1926-h | Subparts P (excavations), H (rigging) | 1 | public_domain | trench, utility strike, load hazards |
| concrete_repair_lifting-call811 | 811 Before You Dig | 4 | association_public | utility locates |
| power_line-rus-1728f-806 | RUS Bulletin 1728F-806 Underground Distribution (2018) | 1 | public_domain | URD steps + QA (§6, 7, 17–19, 21–22, 24, 26) |
| power_line-rus-1728f-804 | RUS Bulletin 1728F-804 12.47/7.2 kV Line Construction | 1 | public_domain | overhead assembly units (full text not retrieved) |
| power_line-ecfr-7-1728-97 | 7 CFR 1728.97 IBR list | 1 | public_domain | confirms 804/806 are incorporated standards |
| power_line-pre-cns-002 | Pedernales EC PRE-CNS-002 pole setting guideline | 4 | association_public | depth rule, plumb/rake, tamping lifts, soil probe |
| power_line-ieee-nesc | IEEE C2 NESC | 3 | proprietary_ref_only | reference only |
| platform-baseline | platform estimate | — | platform_estimate | all costs |

## Work steps
1. **Overhead distribution line** — briefing/locates/clearance → dig and set poles → frame, guys and anchors → string and sag → ground, test, energize.
2. **Underground distribution** — locate/trench → conduit, pads, enclosures → pre-backfill inspection + backfill → pull cable + set padmount → terminate/ground/continuity test → energize under switching order.
3. **Substation install** — foundations + ground grid → fence, structures, equipment (bonded to grid) → control wiring, acceptance tests, energization.

## Hazards (12)
contact_energized_line 1926.960(c)(1) · pole_contacts_line 1926.964(a)(3)(ii) · equipment_contacts_line 1926.959(d)(1) ·
unexpected_reenergization 1926.961(c)(2) · missing_protective_grounds 1926.962(c) · arc_flash 1926.960(g)(1) ·
fall_from_pole 1926.954(b)(3)(iii)(B) · pole_failure_climbing 1926.964(a)(2) · stringing_contact 1926.964(b)(1) ·
trench_collapse 1926.652(a)(1) · buried_utility_strike 1926.651(b)(1) · struck_by_load 1926.251(a)(1)

## QA checklist (15)
Briefing, clearance, pole depth, plumb + tamped backfill, sag per chart, ground resistance recorded, grounds removed,
energized per order, trench depth, pre-backfill inspection, cable slack ≥24 in., two ground paths per padmount,
continuity test, substation grid inspected, fence bonded.

## Inspection / acceptance checkpoints (no permit — owner/utility hold points)
utility_pole_setting_check · sag_tension_check · pre_backfill_inspection · grounding_resistance_test ·
switching_clearance_order · energization_acceptance

## Cost basis (all platform-baseline estimates — no public unit-price source found)
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % |
|---|---|---|---|---|---|---|
| HC-PWR-POLE-WOOD-EA | 40 ft cl.4 wood pole set + framed | EA | 110000 | 6 | 40000 | 0 |
| HC-PWR-OH-COND-LF | OH primary conductor strung/sagged | LF | 60 | 0.01 | 25 | 3 |
| HC-PWR-UG-PRI-CABLE-LF | 15 kV URD cable in 2 in. conduit (no trench) | LF | 600 | 0.04 | 60 | 5 |
| HC-PWR-XFMR-PAD-1PH-EA | 50 kVA 1-ph padmount set/terminated | EA | 650000 | 10 | 50000 | 0 |
| HC-PWR-GROUND-ROD-EA | 5/8 × 8 ft ground rod | EA | 4500 | 0.75 | 0 | 0 |
| HC-PWR-GUY-ANCHOR-EA | down guy + screw anchor | EA | 25000 | 2.5 | 12000 | 2 |

## Quantity rules
None — blueprints provide no utility-line facts; a const rule by building type would pollute building estimates.

## Blueprint callouts
None this wave.

## Open questions → REVIEW_QUEUE
- RUS 1728F-804 full text unreachable (403); overhead assembly QA relies on a co-op standard + platform practice.
- Equipment vocab lacks digger_derrick, bucket_truck, wire puller/tensioner.
- All 6 costs are estimates; RUS/co-op unit-cost data or DOT bid tabs for utility relocation could replace them.
