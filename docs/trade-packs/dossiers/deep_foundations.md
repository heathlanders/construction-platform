# Dossier — `deep_foundations` (Deep Foundations — Piles / Caissons / Helical)

> Wave: w11 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/deep_foundations.ts` · Status: draft
> Taxonomy: category `sitework` · permit_trade `building` · phase `foundation` · CSI `31 60`

## Scope (2–4 sentences)
Installs deep foundation elements for new construction — drilled shafts / caissons (incl. auger-cast / CFA
by title), driven steel H, pipe and precast piles, and helical piles — to the engineer's installation
criteria, with test piles, load / integrity testing, special inspection records, cut-off and as-builts.
Does NOT form or pour pile caps / grade beams (concrete), excavate the cap areas (excavation), stake the
layout (surveying), or retrofit-underpin existing houses (foundation_repair). Shoring / soldier piles and
micropile underpinning sit with shoring_underpinning.

## Existing coverage reconciled
- Hand recipe: none (not in HAND_RECIPE_KEYS) → NEW-TRADE pattern, 3 recipes.
- Catalog codes already seeded: none with B-DF-. `B-FDR-HELICAL-EA` (foundation_repair) is the residential
  retrofit pier — the new `B-DF-HELICAL-EA` is new-construction (commercial shaft + new-construction cap).
- Blueprint template tasks: `Deep foundations (piers, piles or caissons)` (industrial.ts, phase foundation) →
  matched by the `drilled_shaft` recipe (title_re includes `deep foundations?|caissons?`; it is the
  `example_title`). `driven_pile` needs driven/H-pile/pile-driving wording; `helical_pile` (priority 20) needs
  helical/screw.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| deep_foundations-fhwa-gec10 | FHWA-NHI-18-024 GEC 10 Drilled Shafts | 1 | public_domain | slurry head ≥5 ft over piezometric, base cleaning/inspection, spacers + access tubes, tremie ≥10 ft embed, slump ~9 in., integrity testing |
| deep_foundations-fhwa-gec12 | FHWA-NHI-16-009 GEC 12 Vol II Driven Piles | 1 | public_domain | drivability / dynamic + static testing concepts, driving logs |
| deep_foundations-wisdot-ss-550 | WisDOT SS §550 Driven Piles | 1 | gov_open | tolerances (1/4 in./ft, 6 in.), continuous driving, center-out groups, redrive heave ≥0.25 in., approved system, test piles first, restrike, cut-off |
| excavation-wisdot-aup (reused) | WisDOT Average Unit Price List 10/21/2025 | 2 | gov_open | 550.1120 HP12×53 $59.32/$53.79/$45.00 LF; 531.2024 $65.06/$70.79/$66.63; 531.2036 $210.48/$201.48/$340.00; 531.1100 concrete $801.70/$754.61/$807.73 CY; 531.1140 rebar |
| foundation_repair-icces-esr2794 (reused) | ICC-ES ESR-2794 helical | 4 | association_public | helical torque logging / calibration / depth + torque termination |
| ecfr-1926-o / p / m / cc / q / h / i / e / z | 29 CFR 1926 | 1 | public_domain | hazards (1926.603 pile driving verified on LII) |
| icc-pa | IBC 1803.5.5, 1705.7/1705.8/1705.9, 1810.3.3.1.2, 1810.3.11, 1810.4.1/.3/.6/.9/.11 | 3 | ref only | code refs (titles confirmed on UpCodes WI IBC 2015 TOC) |
| platform-baseline | — | — | estimate | helical, load test, mobilization; material splits |

## Work steps (draft → pack recipes)
- `drilled_shaft` (template): design/geotech/special inspection → rig + casing + drill (slurry head, covers)
  → clean + inspect base [footing] → cage + spacers + access tubes → tremie pour [footing] → integrity test,
  cut-off, as-builts [footing].
- `driven_pile`: approve driving system + layout → test piles + restrike → production driving (logs, center-out,
  redrive) [footing] → splice / cut-off / fill [footing] → as-builts.
- `helical_pile`: design + calibrated torque → install to depth AND torque [footing] → load test → cut + caps
  [footing] → records.

## Hazards (draft → pack hazards)
| id | OSHA ref | Sev |
|---|---|---|
| leads_hammer | 1926.603(a)(5) | 4 |
| pile_hoisting | 1926.603(c)(2) | 4 |
| cutoff_near_driver | 1926.603(c)(5) | 3 |
| open_shaft_fall | 1926.501(b)(4)(i) | 4 |
| shaft_entry | 1926.651(g)(1)(i) | 4 |
| utility_strike | 1926.651(b)(1) | 4 |
| crane_ground | 1926.1402(b) | 4 |
| rigging_overload | 1926.251(a)(1) | 3 |
| rebar_impalement | 1926.701(b) | 3 |
| hydraulic_torque | 1926.302(d)(2) | 3 |
| noise | 1926.101(a) | 2 |
| silica | 1926.1153(c)(1) | 3 |

## QA checklist
16 items: design_on_site, special_inspector, rig_approved, test_piles_first, location_plumb, driving_log,
heave_redrive, slurry_head, base_clean, cage_spacers, tremie_embed, integrity_tested, helical_torque,
cutoff_plane, shaft_covered (safety), as_built_records.

## Inspection / acceptance checkpoints
- `footing`: logs + special inspection reports reviewed, cut-off + embedment, engineer acceptance of repairs.
- `special_inspection`: per IBC 1705.7 / 1705.8 / 1705.9.
- `load_test`: approved test plan, calibrated jack/gauges, report + written production criteria.

## Cost basis
| Code | Item | Unit | Mat ¢ | Labor hr | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| B-DF-HPILE-LF | HP12×53 driven | LF | 3200 | 0.08 | 1300 | 5 | derived from WisDOT 550.1120 avg ≈$52.70/LF; steel $0.60/lb estimate |
| B-DF-SHAFT24-LF | 24 in. drilled shaft | LF | 4200 | 0.6 | 10000 | 10 | derived (531.2024 + 531.1100 + 531.1140 ≈ $220/LF bid) |
| B-DF-SHAFT36-LF | 36 in. drilled shaft | LF | 9000 | 1.2 | 25000 | 10 | derived (531.2036 FY23–24 + concrete + rebar ≈ $540/LF bid; FY25 $340 outlier dropped) |
| B-DF-HELICAL-EA | helical, new construction | EA | 110000 | 3 | 15000 | 0 | estimate |
| B-DF-LOADTEST-EA | static load test | EA | 1500000 | 32 | 400000 | 0 | estimate |
| B-DF-MOBIL-EA | rig mob/demob | EA | 0 | 16 | 1500000 | 0 | estimate |

## Quantity rules
- `B-DF-MOBIL-EA` = const 1 (commercial / industrial).
- `B-DF-LOADTEST-EA` = const 1 (commercial / industrial).
No blueprint fact gives pile count/length — LF items are added by the estimator.

## Blueprint callouts (components)
- none this wave (rule).

## Open questions → REVIEW_QUEUE
- vocab: `pile_driver` / `drill_rig` not in equipment vocab — crane used as the service-crane proxy.
- source_doubt: IBC section numbers confirmed on the 2015 TOC (WI); renumbering in 2021/2024 not re-checked.
- cost_estimate: helical, load test, mobilization are platform estimates; LF splits derived from DOT bid prices (include contractor markup).
