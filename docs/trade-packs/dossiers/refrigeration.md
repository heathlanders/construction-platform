# Dossier — `refrigeration` (Commercial Refrigeration)

> Wave: w14 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/refrigeration.ts` · Status: draft
> Taxonomy: category `mechanical_systems` · permit_trade `mechanical` · phase `rough_in` · CSI `23 60`

## Scope (2–4 sentences)
Remote condensing units and compressor racks, reach-in and display (merchandiser) cases, ice machines:
setting equipment, field refrigerant piping (brazed under nitrogen purge), nitrogen pressure test,
evacuation, weighed-in charge, startup and EPA Section 608 records. Walk-in boxes belong to
`cold_storage`; final sanitary/indirect-waste connections to `plumbing`; power to `electrical`;
comfort-cooling split systems to `hvac`.

## Existing coverage reconciled
- Hand recipe: none (only the generic mechanical phase recipe) → NEW-TRADE pattern, 3 recipes
  (`remote_case_system`, `ice_machine` p10, `refrigeration_test_charge` p20).
- Catalog codes already seeded: `M-REFRIG-LINE-LF` (referenced by a quantity rule), `M-CONDENSER`
  (residential AC condenser — not reused). New: `M-REF-*` ×5.
- Blueprint template tasks hitting this trade: none.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| hvac-ufgs-23-23-00 | UFGS 23 23 00 Refrigerant Piping (Aug 2021) | 1 | public_domain | brazing w/ N2 purge, suction slope, pneumatic test, evacuation (300/500 µm 1 h example), charging, leak check |
| refrigeration-ecfr-40-82f | 40 CFR 82 Subpart F | 1 | public_domain | 82.154 venting ban, 82.156 evacuation, 82.161 technician cert |
| refrigeration-ecfr-40-82-157 | 40 CFR 82.157 leak repair | 1 | public_domain | ≥50 lb ODS, 20% commercial refrigeration trigger, 30-day repair, verification tests |
| refrigeration-ecfr-40-84c | 40 CFR 84 Subpart C (AIM Act) | 1 | public_domain | 84.106 ≥15 lb HFC (GWP>53) from 2026-01-01; 84.108 ALD for ≥1,500 lb |
| refrigeration-epa-608-leak-repair / -tech-cert | EPA Section 608 pages | 1 | gov_open | record keeping, certification |
| refrigeration-epa-snap-safety | EPA SNAP Refrigerant Safety | 1 | gov_open | toxicity / flammability / asphyxiation |
| refrigeration-ashrae-15 | ASHRAE 15 (read-only) | 3 | proprietary_ref_only | ref only |
| icc-pa / nfpa-fa | IMC Ch. 11, 3; IPC 802; NEC 440 | 3 | proprietary_ref_only | section refs only |
| ecfr-1926-c/d/e/j/k/l/m/cc | 29 CFR 1926 | 1 | public_domain | hazards |

## Work steps (draft → pack recipes)
1. Check schedule, refrigerant, charge size (IMC 1103/1104/1105).
2. Set condensing unit / rack — gate equipment_set (IMC 304, 306).
3. Set, level, join cases; trapped drains to indirect waste — gate rough_in (IMC 307, IPC 802).
4. Braze line sets under nitrogen purge, slope suction, support, insulate — gate rough_in (IMC 1107).
5. Dry-nitrogen pressure test — gate gas_refrigerant_test (IMC 1108, ASHRAE 15).
6. Evacuate + decay test — gate gas_refrigerant_test.
7. Charge, leak-check, startup, locking caps — gate final (IMC 1101.10, NEC 440).
8. EPA 608 service records to owner — gate final.
Ice machine: set head/bin (equipment_set) → water + air-gap drains (rough_in) → remote lines (gas_refrigerant_test) → sanitize/start (final).

## Hazards (draft → pack hazards)
| id | OSHA ref | Sev |
|---|---|---|
| brazing_fire | 1926.352(e) | 4 |
| cylinders | 1926.350(a)(9) | 4 |
| braze_fumes | 1926.353(a)(3) | 3 |
| pressure_test | 1926.21(b)(2) | 4 |
| asphyxiation | 1926.55(a) (+1926.1203(a)) | 4 |
| frostbite | 1926.102(a)(1) | 3 |
| flammable_refrigerant | 1926.21(b)(5) | 4 |
| shock_lockout | 1926.417(b) | 4 |
| struck_by_load | 1926.1425(b) | 4 |
| roof_edge | 1926.501(b)(10) | 4 |
| aerial_lift | 1926.453(b)(2)(v) | 3 |
| case_tipping | 1926.21(b)(2) | 3 |

## QA checklist
15 items (pack `qa_checklist`); safety: pressure_test_held, leak_check_charged, locking_caps.

## Inspection / acceptance checkpoints
rough_in, equipment_set, gas_refrigerant_test, final — see pack `inspection_checklists`.

## Cost basis
| Code | Unit | Material ¢ | Labor hr | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|
| M-REF-COND-UNIT-EA | EA | 650000 | 10 | 60000 | 0 | platform-baseline estimate |
| M-REF-CASE-EA | EA | 950000 | 8 | 2500 | 0 | platform-baseline estimate |
| M-REF-LEAK-TEST-EA | EA | 6000 | 3 | 1500 | 0 | platform-baseline estimate |
| M-REF-EVAC-CHARGE-EA | EA | 40000 | 6 | 3000 | 0 | platform-baseline estimate (~20 lb refrigerant allowance) |
| M-REF-ICE-MACHINE-EA | EA | 700000 | 6 | 0 | 0 | platform-baseline estimate |

## Quantity rules
Commercial only, `const`: 1 condensing unit, 2 cases, 50 LF `M-REFRIG-LINE-LF`, 1 leak test, 1 evac/charge.
Ice machine has no blueprint fact → no rule.

## Blueprint callouts (components)
None this wave.

## Open questions → REVIEW_QUEUE
- IMC section numbers 1101.10 / 1103–1108 cited from Ch. 11 structure — confirm against adopted edition.
- All costs `estimate`; refrigerant price volatile under the AIM Act phasedown.
- 1926.55(a) / 1926.21(b) used for refrigerant asphyxiation / flammability / pressure test — no construction-specific rule.
- Leak-repair threshold moved: 82.157 now ODS-only ≥50 lb; HFC ≥15 lb under 40 CFR 84.106 from 2026 — keep both cited.
