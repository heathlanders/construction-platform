# Dossier — `marine_dredging` (Marine Construction / Dredging (Commercial))

> Wave: w20 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/marine_dredging.ts` · Status: draft
> Taxonomy: category `heavy_civil` · permit_trade `null` · phase `site_prep` · CSI `35`

## Scope
Commercial work on the water from barges and floating plant: mechanical (clamshell / excavator) and hydraulic
(cutterhead) dredging of channels, berths and basins with placement in approved sites, and marine structures —
steel sheet pile bulkheads and pile-supported piers / dolphins. Does NOT cover residential piers, lifts and shoreline
riprap (`docks_marine_residential`, G-DOCK-*), land deep foundations (`deep_foundations`), or upland earthwork.
No AHJ permit path — Corps of Engineers (RHA Sec. 10 / CWA Sec. 404) and state 401 conditions are the hold points.

## Existing coverage reconciled
- Hand recipe: none → pack is the only recipe source (new-trade pattern, 3 recipes).
- Catalog codes already seeded: none HC-MAR-*. G-DOCK-RIPRAP-CY / G-DOCK-FILTER-SY exist (residential) — not duplicated; no riprap assembly added.
- Blueprint template tasks hitting this trade: none.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| marine_dredging-ufgs-35-20-23 | UFGS 35 20 23 Dredging (2020) | 1 | public_domain | dredging steps, surveys, placement, measurement QA |
| marine_dredging-ufgs-31-41-16 | UFGS 31 41 16 Metal Sheet Piling (2020) | 1 | public_domain | bulkhead steps, tolerances, driving records |
| marine_dredging-usace-em-1110-2-5025 | USACE EM 1110-2-5025 Dredging and Dredged Material Management | 1 | public_domain | general reference only (403 to scripts, not re-read) |
| marine_dredging-ecfr-33-320 / -323 / -325 | 33 CFR 320, 323, 325 | 1 | public_domain | Sec. 10 / 404 authority, discharge definition, permit special conditions (401, turbidity) |
| ecfr-1926-c, -e, -o, -cc | 29 CFR 1926 C, E, O (1926.603, 1926.605), CC (1926.1437) | 1 | public_domain | hazards (all sections read on eCFR) |
| platform-baseline | expert baseline | — | platform_estimate | all costs |

## Work steps
- **mechanical_dredging** (priority 5, generic `dredg`): permit + pre-dredge survey → plant/lights/turbidity → dig cut to grade, load scows → place only at approved site → progress/after-dredge surveys.
- **hydraulic_dredging** (priority 10): permit/survey/placement site → lay & mark pipeline → dredge, watch pipeline & weir → survey cut and fill, demobilize.
- **marine_structures** (bulkheads, sheet pile, piers, dolphins): permit/drawings/marking → barge + templates → pitch & drive in steps → cut off, inspect, as-driven survey → wales, tie-backs, cap, backfill.
No gates, no code refs (permit_trade null).

## Hazards
drowning 1926.106(a) · barge_deck 1926.605(d)(3) · barge_access 1926.605(b)(2) · floating_crane 1926.1437(c)(2) ·
pile_driving 1926.603(c)(2) · hammer_hoses 1926.603(a)(10) · line_handling 1926.21(b)(2) (derived) ·
pipeline_pressure 1926.21(b)(2) (derived) · diving 1926.605(e) · submerged_utility 1926.21(b)(2) (derived) · noise 1926.101(a).

## QA checklist
15 items — permit on board, pre-survey, ranges/gages, plant inspected (safety), depth/overdepth, turbidity, placement,
structure setbacks, pipeline marked, post-survey, pile marking, templates, plumb/interlock tolerances, driving records,
as-driven survey.

## Inspection / acceptance checkpoints
usace_permit_conditions · pre_dredge_survey · turbidity_monitoring · post_dredge_survey (pay quantities) ·
placement_site_compliance · pile_installation_records.

## Cost basis (all `estimate`, platform-baseline)
| Code | Unit | Mat ¢ | Labor hr | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|
| HC-MAR-DREDGE-MECH-CY | CY | 0 | 0.075 | 1900 | 0 | crane barge+scows+tug $15k/day ÷ 800 CY |
| HC-MAR-DREDGE-HYD-CY | CY | 0 | 0.025 | 750 | 0 | cutterhead spread $30k/day ÷ 4,000 CY |
| HC-MAR-HYDRO-SURVEY-EA | EA | 0 | 20 | 250000 | 0 | 2-person day + processing |
| HC-MAR-SHEETPILE-SF | SF | 3000 | 0.12 | 1200 | 3 | ~27 psf @ $1.10/lb; 420 SF/day |
| HC-MAR-PILE-TIMBER-EA | EA | 90000 | 3 | 45000 | 2 | 50 ft @ $18/LF; 12 piles/day |
| HC-MAR-TURB-CURTAIN-LF | LF | 1800 | 0.05 | 200 | 5 | 500 LF/day with work boat |
USACE bid abstracts / Dredging Information System (ndc.ops.usace.army.mil/dis) are a JS app — no verifiable unit prices pulled; costs stay estimates.

## Quantity rules
None (blueprint facts don't describe marine work).

## Blueprint callouts
None.

## Open questions → REVIEW_QUEUE
- EM 1110-2-5025 URL 403 to scripts; not re-read.
- All 6 costs are estimates — candidates for USACE bid abstract derivation.
- Vocab: no `dredge`, `barge`, `tug`, `survey_boat`, `pile_hammer` equipment types — crane/excavator used as proxies.
