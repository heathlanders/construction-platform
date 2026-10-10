# Dossier — `pipeline` (Pipeline (Oil / Gas Transmission))

> Wave: w20 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/pipeline.ts` · Status: draft
> Taxonomy: category `heavy_civil` · permit_trade `null` · phase `site_prep` · CSI `33 52`

## Scope (2–4 sentences)
Builds cross-country steel transmission and gathering lines for gas (49 CFR 192) and hazardous liquids
(49 CFR 195): ROW clearing/grading, ditching, stringing/bending/welding, NDT, field joint coating,
lowering-in, backfill, hydrostatic testing, tie-ins and as-builts. Does NOT do HDD crossings
(`directional_drilling`), local gas distribution mains/services (`gas_piping` / `site_utilities`),
cathodic protection design, or pipe manufacture (line pipe is usually owner-furnished).

## Existing coverage reconciled
- Hand recipe: none → pack is the only source (NEW-TRADE pattern).
- Catalog codes already seeded: none with `HC-PIPE-`.
- Blueprint template tasks hitting this trade: none (0).
- Permit null → no gates, no code_refs; operator / PHMSA hold points in `inspection_checklists`.
- No quantity_rules: building blueprints carry no pipeline facts (a const would leak pipeline lines onto building estimates).

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| pipeline-ecfr-49-192-e | 49 CFR 192 Subpart E — Welding of Steel in Pipelines | 1 | public_domain | WPS, welder qualification, visual/NDT %, repairs |
| pipeline-ecfr-49-192-g | 49 CFR 192 Subpart G — General Construction Requirements | 1 | public_domain | pipe inspection/repair, bends, ditch fit + backfill (192.319), cover (192.327) |
| pipeline-ecfr-49-192-i | 49 CFR 192 Subpart I — Corrosion Control | 1 | public_domain | coating inspection before lowering-in (192.461(c)) |
| pipeline-ecfr-49-192-j | 49 CFR 192 Subpart J — Test Requirements | 1 | public_domain | strength test 8 h / 1 h, tie-in exception, records |
| pipeline-ecfr-49-195-d | 49 CFR 195 Subpart D — Construction | 1 | public_domain | liquids welding, NDT 10%/100%, ditch, cover, backfill |
| pipeline-ecfr-49-195-e | 49 CFR 195 Subpart E — Pressure Testing | 1 | public_domain | 125% MOP 4 h, water medium, records |
| pipeline-ecfr-49-195-h | 49 CFR 195 Subpart H — Corrosion Control | 1 | public_domain | 195.561 coating inspection before lowering-in |
| pipeline-phmsa-construction | PHMSA — Pipeline Construction | 1 | gov_open | context (403 to curl; located via search) |
| pipeline-ecfr-1926-1440 | 29 CFR 1926.1440 Sideboom cranes | 1 | public_domain | sideboom hazard |
| ecfr-1926-c/d/h/j/o/p/cc | 29 CFR 1926 subparts (shared) | 1 | public_domain | hazards |
| platform-baseline | The Jobsite baseline | — | platform_estimate | all costs |

API 1104, ASME IX and NACE SP0502 are incorporated by reference — cited by name only, no numbers.

## Work steps (draft → pack recipes)
Recipe `mainline_spread` (example: "Mainline pipeline construction — ROW, ditch, weld, coat, lower-in and backfill"):
1. Clear and grade the right-of-way and install erosion controls.
2. Dig the ditch to depth and protect the crew — cover per 192.327 / 195.248.
3. String, bend and line up the pipe — 192.307, 192.309, 192.313, 192.235.
4. Weld the girth welds and X-ray them — 192.225–.245, 195.214–.234.
5. Coat the field joints and holiday-test the string — 192.461, 195.561.
6. Lower in, pad and backfill to cover — 192.319, 195.246, 195.252.

Recipe `hydrotest_tie_in` (priority 1; example: "Pipeline hydrostatic test and tie-in"):
1. Prepare the test section and the test plan — 192.505/.507, 195.304/.306.
2. Fill, pressurize and hold the test — 192.517, 195.310.
3. Dewater, dry and make the tie-ins — 192.503(d), 192.243(d)(4), 195.234(g).

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| trench_cave_in | ditch / bell-hole cave-in | 1926.652(a)(1) | 4 |
| trench_spoil_edge | spoil/equipment falling in, no egress | 1926.651(j)(2) | 3 |
| sideboom_load | sideboom load / tip-over | 1926.1440(a) | 4 |
| pipe_rolling | joints rolling off skids/stacks | 1926.250(a)(1) | 3 |
| equipment_struck_by | machines on narrow ROW | 1926.602(a)(9)(ii) | 4 |
| overhead_power_lines | boom/load contact with lines | 1926.1408(a) | 4 |
| welding_fire | hot work fire | 1926.352(d) | 3 |
| welding_fumes | weld + coating fumes | 1926.354(c)(2) | 2 |
| radiation_exposure | radiography | 1926.53(b) | 4 |
| test_stored_energy | hydrotest failure | 1926.21(b)(2) | 4 |
| tie_in_atmosphere | gas/H2S/O2 at tie-ins | 1926.651(g)(1)(i) | 4 |

## QA checklist
15 items: WPS/welder qualification, pipe inspected at site, field bends, weld visual, NDT %, weld repairs,
field joint coating, holiday test before lowering-in, ditch depth/cover, lowering-in fit (incl. clean bottom),
backfill/padding, test pressure & duration (safety), test record, tie-in NDT, as-built.

## Inspection / acceptance checkpoints
- `welding_qualification`, `weld_ndt_radiography`, `coating_holiday_test`, `lowering_in_inspection`,
  `hydrostatic_pressure_test`, `tie_in_and_as_built`.

## Cost basis
All `platform-baseline` / `estimate` — no public unit-price source for transmission pipeline found
(state DOT bid tabs do not carry it). Line pipe excluded (usually owner-furnished).
| Code | Unit | Mat ¢ | Lab h | Equip ¢ | Waste % |
|---|---|---|---|---|---|
| HC-PIPE-ROW-CLEAR-AC | AC | 60000 | 30 | 550000 | 0 |
| HC-PIPE-DITCH-LF | LF | 0 | 0.06 | 700 | 0 |
| HC-PIPE-STRING-WELD-24-LF | LF | 300 | 0.3 | 1500 | 2 |
| HC-PIPE-FJC-24-EA | EA | 15000 | 1.5 | 4000 | 5 |
| HC-PIPE-XRAY-WELD-EA | EA | 2000 | 1 | 9000 | 0 |
| HC-PIPE-HYDROTEST-LF | LF | 50 | 0.02 | 250 | 0 |
| HC-PIPE-PAD-BACKFILL-LF | LF | 0 | 0.05 | 600 | 0 |

## Quantity rules
None (no blueprint facts for pipelines).

## Blueprint callouts (components)
None this wave.

## Open questions → REVIEW_QUEUE
- Costs all estimates — tune against a contractor's spread costs.
- Equipment vocab lacks `sideboom` / `dozer` / `padding_machine`; mapped sidebooms to `crane`.
- INGAA Foundation construction guidance not cited (ingaa.org rate-limited 429; unverified).
- PHMSA construction page 403 to curl — located via search only.
- 1926.21(b)(2) used for hydrotest stored energy (no specific 1926 pressure-test section).
