# Dossier — `septic` (Septic Systems)

> Wave: w02 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/septic.ts` · Status: draft
> Taxonomy: category `sitework` · permit_trade `plumbing` · phase `sitework` · CSI `33 34`

## Scope (2–4 sentences)
Installs, replaces and abandons private onsite wastewater treatment systems (POWTS): layout to the
approved plan and setbacks, the septic tank (baffles, effluent filter, risers), the building sewer from
the house stub to the tank, effluent lines, and the dispersal cell (trench, bed, chamber or mound). It
does NOT do the soil and site evaluation (certified soil tester), the system design/plan approval
(designer), the in-house drain/waste/vent piping (`plumbing`), or septage hauling (licensed hauler).
In Wisconsin the governing rule is Wis. Admin. Code SPS 383, enforced by the county under a sanitary
permit; refs carry `code_type: 'WI SPS'`, sections `383.xx`.

## Existing coverage reconciled
- Hand recipe: none (falls to the plumbing family recipe today) → pack is the NEW-TRADE pattern (2 recipes with `example_title`).
- Catalog codes already seeded: none for septic (checked `/tmp/w02-codes.txt`; no `P-SEP-`).
- Blueprint template tasks hitting this trade: none (`trade_type: 'septic'` not in any template).
- Blueprint facts: no septic fixture or component token exists → quantity rules use `const` scoped to `residential_sf`.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| septic-wi-sps383 | Wis. Admin. Code ch. SPS 383 (POWTS) | 1 | gov_open | permit, setbacks, install, inspection, abandonment, management, reporting |
| septic-wi-sps385 | Wis. Admin. Code ch. SPS 385 (soil and site evaluations) | 1 | gov_open | soil report QA |
| septic-wi-dsps-powts | DSPS POWTS program page | 1 | gov_open | context (not cited in pack data) |
| septic-epa-owts-manual | EPA Onsite Wastewater Treatment Systems Manual (2002) | 1 | public_domain | compaction/smearing, distribution, tank construction, risers |
| septic-epa-septicsmart | EPA SepticSmart — How to Care for Your Septic System | 1 | gov_open | owner care (no driving on drainfield, pumping) — context |
| ecfr-1926-p / -m / -cc / -o / -d, plumbing-ecfr-1926-aa | 29 CFR 1926 | 1 | public_domain | hazards |
| icc-pa | IPC 701.2, 704.1 | 3 | proprietary_ref_only | section + paraphrase only |
| platform-baseline | The Jobsite baseline | — | platform_estimate | all costs |

## Work steps (draft → pack recipes)
**new_system_install** (title_re: septic|powts|drainfield|leach field|mound system|soil absorption|onsite wastewater)
1. **Confirm permit, soil report and layout** — post permit, soil report on site, 811, stake to setbacks. Code: SPS 383.21, 383.43(8)(i). QA: permit_posted, soil_report_on_file, setbacks_verified.
2. **Check the soil, then excavate** — not frozen, snow removed, 1/4-inch wire roll test; keep wheels off cell; protect excavations. Code: SPS 383.45. QA: soil_condition_ok, no_compaction.
3. **Bed and set the septic tank** — level bedding, inlet above outlet, rated rigging, sealed joints, baffles + effluent filter, anchor in high groundwater; never enter. Code: SPS 383.45. QA: tank_level, watertight, baffles_filter.
4. **Run the building sewer and effluent lines** — continuous slope, bedded, cleanouts, leave uncovered. Code: IPC 704.1, SPS 383.26. Gate: underground. QA: pipe_slope, cover_depth.
5. **Build the dispersal cell** — elevations, level laterals (laser), observation pipes, no trucks on cell. Code: SPS 383.44. Gate: underground. QA: distribution_level, no_compaction.
6. **Risers, lids, backfill and paperwork** — secured lids, backfill, erosion, as-built + management plan. Code: SPS 383.52, 383.54. Gate: final. QA: risers_lids_secured, asbuilt_maintenance_filed.

**tank_replace_abandon** (priority 10; abandon|replace|decommission|pump-out near septic|tank|powts|cesspool|seepage pit)
1. Permit, locate and pump the old tank (SPS 383.21) · 2. Disconnect, seal and abandon (SPS 383.33) ·
3. Set and connect the replacement tank (SPS 383.26, gate underground) · 4. Risers, lids and report (SPS 383.55, gate final).

## Hazards (draft → pack hazards)
| id | Hazard | Controls | OSHA ref | Sev |
|---|---|---|---|---|
| cave_in | Cave-in of tank hole / trench | protective system ≥5 ft; daily competent-person inspection | 1926.652(a)(1) | 4 |
| spoil_edge | Spoil/equipment into excavation | 2 ft setback or retaining devices | 1926.651(j)(2) | 3 |
| trench_egress | No way out | ladder/ramp ≥4 ft deep within 25 ft | 1926.651(c)(2) | 3 |
| utility_strike | Buried utility strike | 811, hand-expose | 1926.651(b)(1) | 4 |
| water_accumulation | Water in excavation | dewater/protect, re-inspect after rain | 1926.651(h)(1) | 3 |
| adjacent_structure | Undermining foundation/well | shore/brace/underpin, keep setbacks | 1926.651(i)(1) | 3 |
| confined_space | Tank entry — H2S/methane/O2 deficiency | permit space, work from outside, no rescue entry | 1926.1203(a) | 4 |
| fall_into_opening | Fall into open tank/pit | cover/barricade ≥6 ft, secure lids | 1926.501(b)(7)(ii) | 4 |
| crane_load | Swinging/dropped precast tank | barricade swing radius, rated rigging, no one under load | 1926.1424(a)(2) | 4 |
| equipment_struck | Backing equipment | reverse alarm/spotter | 1926.602(a)(9)(ii) | 3 |
| biological | Sewage contact | gloves/eye protection, washing facilities | 1926.51(f)(1) | 2 |

All verified against eCFR text on 2026-10-08.

## QA checklist
- [ ] Sanitary permit posted, approved plan on site — SPS 383.21(8)
- [ ] Soil/site evaluation by certified soil tester on file; cell staked at test pits — SPS 383.22 / SPS 385
- [ ] Setbacks measured before digging — SPS 383.43(8)(i), Table 383.43-1
- [ ] Not frozen, snow removed, fails 1/4-inch wire roll — SPS 383.45(2)–(4)
- [ ] No wheeled traffic on cell; smeared surfaces scarified — EPA manual ch. 4
- [ ] Tank level, inlet above outlet — SPS 383.45(5) + EPA manual
- [ ] Watertight joints / test if required — EPA manual
- [ ] Baffles + effluent filter — SPS 383.44(2)(c) + EPA manual
- [ ] Sewer slope continuous, bedded — IPC 704.1
- [ ] ≥12 in. cover on effluent lines/forcemains — SPS 383.45(7)
- [ ] Laterals level (laser) — EPA manual
- [ ] Risers to grade, lids secured (safety) — SPS 383.52(1)(a)2
- [ ] Abandonment: pumped, disconnected, sealed, removed or filled (safety) — SPS 383.33
- [ ] As-built + management plan (pump at 1/3 sludge+scum) filed — SPS 383.54(3)(b), 383.55

## Inspection / acceptance checkpoints
- underground: permit posted + plan on site; everything uncovered (SPS 383.26(2)); setbacks; tank level/sealed/baffles/filter; slope + lateral level + elevations.
- final: secured lids; backfill/crown/drainage/erosion; abandonment of replaced tank; as-built + management plan delivered.

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| P-SEP-TANK-1000 | Precast 1,000 gal tank set | EA | 160000 | 8 | 60000 | 0 | platform-baseline, estimate |
| P-SEP-TRENCH-LF | Drainfield trench, gravel/chamber | LF | 1800 | 0.2 | 400 | 5 | platform-baseline, estimate |
| P-SEP-MOUND-SF | Mound cell per SF basal area | SF | 900 | 0.05 | 300 | 10 | platform-baseline, estimate |
| P-SEP-RISER-EA | 24 in. riser + secured lid | EA | 22000 | 1 | 0 | 0 | platform-baseline, estimate |
| P-SEP-FILTER-EA | Effluent filter + housing | EA | 9000 | 0.5 | 0 | 0 | platform-baseline, estimate |
| P-SEP-ABANDON-EA | Abandon tank (pump, disconnect, fill) | EA | 8000 | 4 | 55000 | 0 | platform-baseline, estimate |

No public unit-price source found for residential POWTS work; all costs are platform estimates.

## Quantity rules
- `P-SEP-TANK-1000` = const × 1 (residential_sf) — one tank; confirm against design.
- `P-SEP-RISER-EA` = const × 2 (residential_sf) — inlet + outlet risers.
- `P-SEP-FILTER-EA` = const × 1 (residential_sf).
- Trench/mound quantities deliberately NOT seeded: size depends on the soil report and design flow (SPS 383.43(3): 100 gal × bedrooms × 150%), and blueprint facts carry no bedroom count or soil data.

## Blueprint callouts (components)
- none this wave (per brief).

## Open questions → REVIEW_QUEUE
- 11 hazards + 2 safety QA + 9 inspection checklist items pending human Spanish.
- All 6 assembly costs are `estimate`.
- IPC 701.2 / 704.1 cited from memory of the ICC section layout — confirm against the adopted IPC edition.
- National (non-WI) refs: IPSDC (ICC private sewage code) sections not cited — no verified section numbers.
- Quantity rule scope: const tank/riser/filter seeds only when the septic trade is on a residential_sf schedule; consider a bedroom-count fact for drainfield sizing.
