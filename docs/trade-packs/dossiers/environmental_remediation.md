# Dossier — `environmental_remediation` (Environmental Remediation (Soil / Groundwater / UST))

> Wave: w19 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/environmental_remediation.ts` · Status: draft
> Taxonomy: category `heavy_civil` · permit_trade `null` · phase `site_prep` · CSI `02 61`

## Scope
Closes and removes underground storage tanks, excavates and disposes of contaminated soil, installs groundwater
monitoring wells and supports the environmental consultant's sampling through regulator case closure. Does NOT do
the investigation/design itself (environmental consultant / `environmental_consulting`), asbestos/lead/mold work
(`abatement`), general C&D hauling (`hauling`, G-HAUL-*), or building demolition (`demolition`). Regulated by
DATCP (tanks) and DNR (cleanup) in Wisconsin, EPA 40 CFR 280 federally — no building AHJ, so no gates or code refs.

## Existing coverage reconciled
- Hand recipe: none → NEW-TRADE pattern (3 recipes).
- Catalog codes already seeded: none HC-REM-*. G-HAUL-DISP-TON is the C&D tipping fee — not reused for profiled
  petroleum soil (different facility class and price); HC-REM-SOIL-DISP-TON notes the distinction.
- Blueprint template tasks: none.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| environmental_remediation-ecfr-40-280g | 40 CFR 280 Subpart G — UST closure | 1 | public_domain | closure notice (280.71(a) 30 days), empty/clean/remove (280.71(b)), site assessment (280.72), records 3 yr (280.74) |
| environmental_remediation-ecfr-40-280f | 40 CFR 280 Subpart F — release response | 1 | public_domain | 280.61 24-hour report, mitigate vapor/fire hazards |
| environmental_remediation-ecfr-40-261-4 | 40 CFR 261.4(b)(10) | 1 | public_domain | petroleum UST media excluded from TC D018–D043 → non-haz profile |
| environmental_remediation-ecfr-40-262 | 40 CFR 262 (262.20 manifest) | 1 | public_domain | hazardous loads on the uniform manifest |
| environmental_remediation-epa-ust / -epa-manifest | EPA program pages | 1 | gov_open | context |
| environmental_remediation-wi-atcp93 + -datcp-tanks | WI ATCP 93 + DATCP tank program | 1 | gov_open | 93.560(1)(a) 5 business days TR-WM-121; (2)(a),(am),(c),(d) 21 business days,(e),(f); (3); 93.585 release reporting |
| environmental_remediation-wi-nr700 / -nr706 / -nr718 / -nr726 | WI NR 700 series | 1 | gov_open | NR 706.05(1)(a) immediate notice; NR 718.05 stockpile storage; NR 720 standards; NR 724 reports; NR 726.05 closure request |
| environmental_remediation-wi-nr141 | WI NR 141 monitoring wells | 1 | gov_open | well construction / sealing / development / abandonment (141.25) |
| environmental_remediation-wi-dnr-rr / -wi-dnr-spills | WI DNR program pages | 1 | gov_open | context |
| ecfr-1926-d / -p / -aa / -f / -h | OSHA 1926 subparts | 1 | public_domain | hazards (1926.65 HAZWOPER, 1926.651/652, 1926.1203, 1926.151, 1926.251) |
| platform-baseline | Platform estimate | — | platform_estimate | all costs |

## Work steps (→ recipes)
1. **ust_removal_closure** — notice + certified crew + HASP → empty/clean/inert (LEL, bonding, no tank entry) →
   excavate/lift with protective system, PID segregation, basin left open → closure inspection + site-assessment
   samples + TR-WM-140 → report any release, backfill after approval, file registration/report within 21 business days.
2. **contaminated_soil_excavation** — site control + HAZWOPER → excavate to limits with PID screening, contain water →
   load/manifest/haul to profiled facility → confirmation samples to certified lab → backfill + records to consultant.
3. **groundwater_monitoring_well** — locate/clear utilities → drill, log, build (tremie seal) → develop, survey, record.

## Hazards
| id | OSHA ref | Sev |
|---|---|---|
| hazwoper_training | 1926.65(e)(3)(i) — 40 h + 3 days field | 3 |
| vapor_exposure | 1926.65(h)(2) initial-entry monitoring | 3 |
| flammable_vapor_ignition | 1926.151(a)(3) | 4 |
| excavation_atmosphere | 1926.651(g)(1) — test >4 ft, <20% LEL | 4 |
| cave_in | 1926.652(a)(1) | 4 |
| spoil_edge | 1926.651(j)(2) — 2 ft | 3 |
| water_in_excavation | 1926.651(h)(1) | 3 |
| tank_entry | 1926.1203(a) | 4 |
| rigging_struck | 1926.251(a)(1) | 4 |
| utility_strike | 1926.651(b)(1) | 4 |
| equipment_edge | 1926.651(f) | 3 |
| decon_spread | 1926.65(k)(2)(iii) | 2 |

## QA checklist
15 items (3 safety → ES pending): closure notice/lead time, certified crew, HASP + zones, LEL logged, tank emptied,
soil segregated, basin open until inspection, closure samples, release reported, water contained, loads manifested,
confirmation samples, well built to rule, closure records filed, records to consultant.

## Inspection / acceptance checkpoints (descriptive keys — no permit family)
ust_closure_notification · ust_closure_inspection · closure_site_assessment · waste_manifest · confirmation_sampling ·
regulator_case_closure.

## Cost basis (all platform-baseline, estimate)
| Code | Item | Unit | Material ¢ | Labor hr | Equip ¢ | Waste % |
|---|---|---|---|---|---|---|
| HC-REM-HASP-EA | Site health & safety plan | EA | 0 | 12 | 0 | 0 |
| HC-REM-UST-SM-EA | UST ≤4,000 gal removal/closure | EA | 90000 | 24 | 150000 | 0 |
| HC-REM-UST-LG-EA | UST 6,000–12,000 gal removal/closure | EA | 250000 | 48 | 350000 | 0 |
| HC-REM-SOIL-EXC-CY | Contaminated soil excavate + load | CY | 150 | 0.12 | 650 | 0 |
| HC-REM-SOIL-DISP-TON | Petroleum soil transport + landfill (non-haz) | TON | 5500 | 0 | 2000 | 0 |
| HC-REM-SAMPLE-EA | Confirmation sample + lab | EA | 25000 | 0.75 | 1500 | 0 |
| HC-REM-MW-EA | 2-in monitoring well ~20 ft | EA | 60000 | 8 | 120000 | 5 |

No public unit-price source found (WisDOT bid tabs rarely carry remediation items) → `estimate`.

## Quantity rules
- HC-REM-HASP-EA = const 1 (commercial/industrial)
- HC-REM-SAMPLE-EA = const 5 placeholder (commercial/industrial)
- HC-REM-UST-SM-EA = const 1 heating-oil tank (residential_sf)

## Blueprint callouts
None this wave.

## Open questions → REVIEW_QUEUE
- ES safety pending (12 hazards, 3 QA).
- All 7 costs are platform estimates; disposal $/ton varies widely by region and landfill.
- ATCP 93 notice lead time is 5 business days vs federal 30 days — pack states both; confirm the state rule governs in WI (state program approval).
- Possible vocab: vacuum truck and drill rig are not in equipment-vocab (mentioned as tools only).
