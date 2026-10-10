# Dossier — `docks_marine_residential` (Docks / Boat Lifts / Shoreline (Residential))

> Wave: w07 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/docks_marine_residential.ts` · Status: draft
> Taxonomy: category `sitework` · permit_trade `null` · phase `sitework` · CSI `35 51`

## Scope (2–4 sentences)
Seasonal residential piers and boat lifts (put-in, leveling, load test, fall take-out and storage) and
shoreline riprap on lake and river lots. Does NOT include permanent crib/solid-fill piers, boathouses,
seawalls engineered under individual permits, dredging, or the electrical feed itself (licensed
electrician — `electrical`). Work is designed to fit the Wisconsin pier and riprap exemptions; when it
doesn't, the owner obtains DNR (and possibly USACE) permits first.

## Existing coverage reconciled
- Hand recipe: none → NEW-TRADE pattern, 3 recipes.
- Catalog codes already seeded: none for docks/riprap (no `RIPRAP` or `DOCK` code in migrations or packs).
- Blueprint template tasks hitting this trade: none.

## Regulatory note (WI)
The trade note pointed to NR 326; the current NR 300-series index lists no ch. NR 326. The 2026 DNR Pier
Planner and exemption checklists cite **Wis. Stat. 30.12(1g)** (exemptions) and **ch. NR 320**
(320.04(3),(8),(9),(12) exemption standards; 320.09 riparian zones — the Planner says 320.08). Pack cites
NR 320. Null permit_trade → no gates or code_refs; regulator checks are inspection_checklists
(`dnr_pier_exemption_check`, `riprap_exemption_check`, `usace_federal_check`) plus contractor checks
(`seasonal_install_handover`, `fall_removal_check`).

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| docks_marine_residential-wi-stat-30-12 | Wis. Stat. 30.12 | 1 | gov_open | pier/lift/riprap exemption criteria |
| docks_marine_residential-wi-stat-30-13 | Wis. Stat. 30.13 | 1 | gov_open | pierhead lines, local ordinances |
| docks_marine_residential-wi-nr320 | Wis. Adm. Code ch. NR 320 | 1 | gov_open | exemption standards, riparian zones |
| docks_marine_residential-wi-dnr-pier-faq | DNR Pier FAQ | 1 | gov_open | legacy piers, slips, permits |
| docks_marine_residential-wi-dnr-pier-planner | DNR Pier Planner (Apr 2026) | 1 | gov_open | dimensions, floats, shelters |
| docks_marine_residential-wi-dnr-pier-exempt | Piers and Wharves Exemption Checklist | 1 | gov_open | QA, checklist |
| docks_marine_residential-wi-dnr-shoreline | Shoreline erosion control permitting | 1 | gov_open | permit ladder, ASNRI/PRF |
| docks_marine_residential-wi-dnr-riprap-exempt | Riprap Exemption Checklist (3/2026) | 1 | gov_open | stone size, toe/top, filter, fish timing |
| docks_marine_residential-wi-dnr-ice | Avoid ice damage on permanent structures | 1 | gov_open | remove before freeze-up |
| docks_marine_residential-wi-dnr-disinfection | Invasive species decontamination | 1 | gov_open | equipment decon (NR 40) |
| docks_marine_residential-usace-mvp-regulatory | USACE St. Paul District Regulatory | 1 | public_domain | federal check (403 to scripts) |
| docks_marine_residential-ecfr-33-322 | 33 CFR 322 | 1 | public_domain | Section 10 structures |
| docks_marine_residential-shoremaster-dock | ShoreMaster Infinity dock instructions | 5 | manufacturer_public | install steps |
| docks_marine_residential-shoremaster-lift | ShoreMaster hydraulic lift instructions | 5 | manufacturer_public | lift leveling, safety |
| excavation-wisdot-aup | WisDOT Average Unit Price List | 2 | gov_open | riprap + geotextile costs (derived) |
| ecfr-1926-c/e/k/o/p | 29 CFR 1926 subparts | 1 | public_domain | hazards |
| nfpa-fa | NFPA free access (NFPA 303, NFPA 70 Art. 555) | 3 | proprietary_ref_only | ESD — reference only |

## Work steps (draft → pack recipes)
- `seasonal_pier_lift_install` (priority 1): exemption/permit check → sound bottom / leg lengths → decontaminate + stage → set and level sections → set and level lift → load test + handover.
- `shoreline_riprap` (priority 2): exemption/permit check (ASNRI/PRF, length, energy, fish timing) → layout, 811, sediment control → shape bank + filter layer → place stone → revegetate + restore + decon.
- `seasonal_removal` (priority 3, title must mention dock/pier/lift/wharf + remove/take-out/winterize): plan before freeze-up → lockout power, lower lift → pull lift and sections, retrieve parts → inspect + store.

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| drowning | falling in / swept off | 1926.106(a) | 4 |
| cold_water | cold shock, hypothermia | 1926.21(b)(2) (derived) | 4 |
| thin_ice | breaking through ice | 1926.106(c) | 4 |
| electric_shock_drowning | leakage current from lift/dock wiring | 1926.416(a)(1) (+NEC 555/NFPA 303 ref) | 4 |
| lift_energy | lift started during service | 1926.417(b) | 3 |
| under_raised_lift | crushed under raised boat/lift | 1926.600(a)(3)(i) | 4 |
| pinch_crush | dock frames/connectors | 1926.95(a) (derived) | 2 |
| equipment_rollover | machine into water from bank | 1926.600(a)(3)(ii) | 4 |
| struck_by_equipment | swing/backing/rolling stone | 1926.602(a)(9)(ii) | 3 |
| utility_strike | buried lines at bank | 1926.651(b)(1) | 3 |

## QA checklist
15 items — 4 safety (PFD/ring buoy, lift level, lift power, power lockout) pending human ES; others translated by author. See pack.

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| G-DOCK-SECT-LF | Seasonal aluminum sectional pier 4 ft, S&I | LF | 30000 | 0.35 | 0 | 0 | estimate |
| G-DOCK-LIFT-SET-EA | Lift assemble/set/level (lift by others) | EA | 0 | 6 | 0 | 0 | estimate |
| G-DOCK-SVC-INOUT-EA | Seasonal put-in or take-out visit | EA | 0 | 5 | 5000 | 0 | estimate |
| G-DOCK-RIPRAP-CY | Shoreline riprap placed | CY | 6500 | 0.6 | 3000 | 10 | derived from WisDOT 606.0100 Riprap Light ($83.54–$134.48/CY FY23–25); labor estimate |
| G-DOCK-FILTER-SY | Filter fabric under riprap | SY | 250 | 0.02 | 0 | 15 | derived from WisDOT 645.0130 Geotextile Type R ($2.67–$5.10/SY) |

## Quantity rules
None — blueprint facts carry no shoreline length, pier length or lift data.

## Blueprint callouts (components)
None this wave.

## Open questions → REVIEW_QUEUE
- NR 326 vs NR 320 (scope/source_doubt); NR 320.08 vs 320.09 riparian-zone citation inconsistency between DNR Planner and checklist.
- Riprap exemption slope wording ("1 ft H : 1.25 ft V") read literally from the checklist; pack only paraphrases "planned slope, ~2H:1V works well".
- Proposed vocab: `work_barge` / `work_boat` equipment type.
- USACE MVP page 403 to scripts; specific regional/nationwide permit numbers not cited.
