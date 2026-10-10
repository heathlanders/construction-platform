# Dossier — `plumbing` (Plumbing)

> Wave: w02 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/plumbing.ts` · Status: draft
> Taxonomy: category `plumbing_systems` · permit_trade `plumbing` · phase `rough_in` · CSI `22`

## Scope (2–4 sentences)
Sanitary DWV (under-slab, rough, building drain/sewer to the street connection), hot/cold water
distribution, water heaters, backflow protection and fixture setting for residential and light
commercial work. Hands off: fuel gas (`gas_piping`), fire sprinkler, well and septic (own packs),
excavation of long site runs (`excavation`), shower tile over the pan (`tile`).

## Existing coverage reconciled
- Hand recipe: `lib/task-buildout/plumbing.ts` (phase-keyed: under-slab DWV → rough DWV & vents →
  rough supply → gas → fixtures & trim) → pack **complements** (`recipes: []`). Family code map in
  `code-refs.ts` already shows Ch. 6/7/9, 312.5, Ch. 4, 1002 — pack adds finer sections + WI SPS + ADA.
- Equipment: `equipment-rules.ts` already adds excavator/trencher (underground) and scissor lift
  (large rough-in) — pack adds optional compactor + skid steer for bedding/backfill.
- Catalog codes already seeded: P-CLEANOUT, P-DWV-PIPE-LF, P-DWV-ROUGH, P-FIX-*, P-FLOOR-DRAIN,
  P-PIPE-PEX-LF, P-SUPPLY-ROUGH, P-GAS-*, PARAM-PLUMBING. Hand seeder emits P-FIX-WH / P-FIX-KSINK
  from fixtures + DWV/supply rough per fixture + gas line — not duplicated.
- Blueprint template tasks: 14 (under-slab rough-in, supply & drain rough-in, fixture trim-out …) —
  all handled by the hand recipe's phase/title branches.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| plumbing-ufgs-22-00-00 | UFGS 22 00 00 Plumbing, General Purpose (May 2024) | 1 | public_domain | QA (water heater 3.2.x, shower pan 3.9.1.2, backflow 3.9.1.1, flushing/disinfection) |
| plumbing-wi-sps382 | Wis. Admin. Code ch. SPS 382 | 1 | gov_open | test methods 382.21(2), drain pitch 382.30(5), vents 382.31, cleanouts 382.35, hangers 382.60, cross connection 382.41 |
| icc-pa | IPC (public access) | 3 | ref only | section numbers + paraphrase |
| plumbing-ada-2010 | 2010 ADA Standards | 1 | public_domain | 604/606 accessible fixtures (commercial) |
| ecfr-1926-p/d/i/x/z, plumbing-ecfr-1926-j/aa | 29 CFR 1926 | 1 | public_domain | hazards |
| platform-baseline | — | — | estimate | all assembly costs |

## Work steps
Unchanged — hand recipe. Pack contributes code refs per gate (underground, rough_in, water_supply, final).

## Hazards
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| trench_cave_in | Trench collapse | 1926.652(a)(1) | 4 |
| trench_egress | No way out of trench ≥4 ft | 1926.651(c)(2) | 3 |
| spoil_edge | Spoil/pipe rolling in | 1926.651(j)(2) | 3 |
| sewer_gas | H2S / low O2 in trench or pit | 1926.651(g)(1)(i) | 4 |
| confined_space | Crawlspaces, pits, manholes | 1926.1203(a) | 4 |
| hot_work_fire | Soldering/brazing fire | 1926.352(d) | 3 |
| solvent_vapors | Primer/cement vapors | 1926.55(a) | 2 |
| lead_exposure | Old solder / lead pipe on remodel | 1926.62(d) | 3 |
| silica_core_drill | Core drilling concrete | 1926.1153(c)(1) | 3 |
| ladder | Ladder falls | 1926.1053(b)(1) | 2 |
| power_tools | Saws, drills, threaders | 1926.300(b)(1) | 2 |

## QA checklist
15 items: DWV slope (SPS 382.30(5)(a): ≤2 in. at 1/4 in./ft, larger 1/8 in./ft), DWV water test
10 ft head / 15 min or 5 psi air (SPS 382.21(2)(g)), sewer test 10 ft / 3 psi (382.21(2)(b)), supply
test at working pressure, cleanouts, venting, pipe support, nail plates, freeze protection, backflow
test certified, T&P discharge (safety), expansion tank, dielectric/heat traps, shower pan flood 1 in./24 h
(UFGS 3.9.1.2), flush + disinfect.

## Inspection / acceptance checkpoints
- underground: bedding/grade, 10 ft head test, trench protection + ladder, sleeves.
- rough_in: DWV test, slope/cleanouts/vents, bore/notch limits + nail plates, supports + roof flashing.
- water_supply: pressure test, backflow at hose bibs/boiler/irrigation, PRV + expansion, shutoffs.
- final: fixtures set + clearances, water heater safety, ADA restrooms, backflow reports.

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| P-PL-EXP-TANK-EA | Expansion tank 2 gal | EA | 6000 | 0.75 | 0 | 0 | platform-baseline estimate |
| P-PL-PRV-EA | PRV 3/4–1 in. | EA | 11000 | 1.5 | 0 | 0 | estimate |
| P-PL-WH-CHANGEOUT-EA | WH changeout labor + kit (heater = P-FIX-WH) | EA | 7500 | 3.5 | 3000 | 0 | estimate |
| P-PL-SUMP-PUMP-EA | Sump pump 1/3 HP in existing pit | EA | 25000 | 3 | 0 | 5 | estimate |
| P-PL-SOFTENER-LOOP-EA | Softener rough-in loop | EA | 9000 | 2.5 | 0 | 5 | estimate |
| P-PL-HOSEBIB-FF-EA | Frost-free hose bib w/ VB | EA | 4500 | 1.25 | 0 | 0 | estimate |

## Quantity rules
- `P-PL-EXP-TANK-EA` = water_heater fixtures × 1 (closed system assumed).
- `P-PL-HOSEBIB-FF-EA` = 2 (residential_sf only).
- `P-CLEANOUT` (existing) = 3 (residential_sf only).

## Blueprint callouts (components)
None this wave.

## Open questions → REVIEW_QUEUE
- IPC section numbers (305, 307, 308, 604.8, 607.3, 608, 610, 704.1, 708, 312.x, 405, 504, 606) are
  stable across 2018/2021 by our reading; specific Ch. 9 vent sections omitted (renumbered between editions).
- WI refs use `code_type: 'WI SPS'` + section `382.xx` so they render "WI SPS 382.30(5)".
- UPC jurisdictions: refs are IPC-numbered; UPC numbering differs.
