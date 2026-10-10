# Dossier — `test_balance` (Test & Balance (TAB))

> Wave: w14 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/test_balance.ts` · Status: draft
> Taxonomy: category `mechanical_systems` · permit_trade `mechanical` · phase `commissioning` · CSI `23 05 93`

## Scope (2–4 sentences)
Independent testing, adjusting and balancing of HVAC air and hydronic systems at commissioning: pre-TAB
readiness check, duct air leakage testing (DALT) of selected sections, proportional air and hydronic
balancing, outdoor-air / building-pressure verification, marking settings and issuing a certified TAB
report. Does NOT install or seal duct (ductwork), change sheaves or fix equipment (hvac), or program
sequences (controls_bms) — it finds and reports deficiencies for those trades to correct.

## Existing coverage reconciled
- Hand recipe: none for this key (not in HAND_RECIPE_KEYS). The mechanical family recipe's final branch
  catches "air balance" titles generically; the pack's recipes run first for this trade (NEW-TRADE pattern).
- Catalog codes already seeded: `M-DU-BAL-DAMPER`, `M-DU-LEAK-TEST` (ductwork pack, residential) — not
  redeclared; pack adds commercial/industrial `M-TAB-*` rows.
- Blueprint template tasks: commercial "HVAC test, adjust & balance (TAB)", industrial "HVAC & ventilation
  test, adjust & balance" (both phase commissioning) — matched by `tab_hvac_systems.title_re`.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| test_balance-ufgs-23-05-93 | UFGS 23 05 93 TAB for HVAC (May 2025) | 1 | public_domain | steps, QA, tolerances, prerequisites, marking, report |
| test_balance-pnnl-retuning | PNNL Building Re-Tuning | 1 | gov_open | outdoor-air / economizer verification concept |
| test_balance-tabb | TABB certifying body | 4 | proprietary_ref_only | certification reference (AABC/NEBB sites 403) |
| icc-pa | IECC C408.2, C408.2.2(.1/.2), C403.12.2.3; IMC 403.3, 603.9 | 3 | proprietary_ref_only | code refs (paraphrase) |
| ecfr-1926-{d,e,i,k,l,m,x,aa} | 29 CFR 1926 | 1 | public_domain | hazards |

## Work steps (draft → pack recipes)
`tab_hvac_systems` (template titles): 1 review + pre-TAB readiness (gate equipment_set, IECC C408.2) ·
2 DALT witness (gate duct_leakage, IECC C403.12.2.3, IMC 603.9) · 3 air balance (IECC C408.2.2.1) ·
4 hydronic balance (IECC C408.2.2.2) · 5 outdoor air + building pressure (IMC 403.3) · 6 mark settings,
report, deficiency punch (gate final, IECC C408.2.2).
`tab_duct_leakage` (DALT titles, priority 10): ready check · cap/pressurize/measure (duct_leakage) · seal/retest/report.
`tab_hydronic` (hydronic balancing titles, priority 10): readiness (equipment_set) · read/set valves · lock settings (final).

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| ladder | ladder fall at ceiling outlets | 1926.1053(b)(1) | 3 |
| aerial_lift | lift fall/caught | 1926.453(b)(2)(v) | 4 |
| roof_edge | fall at rooftop units | 1926.501(b)(1) | 4 |
| rotating_parts | belts/sheaves/fan wheel | 1926.300(b)(2) | 4 |
| lockout | unexpected restart | 1926.417(b) | 4 |
| energized_readings | live amp/volt readings | 1926.416(a)(1) | 4 |
| hot_surfaces | hot water/steam ports | 1926.95(a) | 3 |
| noise | mechanical room noise | 1926.52(d)(1) | 2 |
| confined_space | plenums/tunnels | 1926.1203(a) | 4 |
| cut_hands | drilling ports, duct edges | 1926.95(a) | 2 |

## QA checklist
13 items — instruments NIST-calibrated ≤1 yr, pre-TAB checklist, DALT before cover, air/water within
tolerance, one open path, motor limits (safety), memory stops, outdoor air (safety), building pressure,
settings marked, deficiencies logged, certified report — all UFGS 23 05 93.

## Inspection / acceptance checkpoints
- duct_leakage: DALT report on selected high-pressure sections before concealment.
- equipment_set: equipment started and controls running before balancing.
- final: balancing report with design/measured flows; OA meets design; devices marked.

## Cost basis
| Code | Item | Unit | Mat ¢ | Labor hr | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| M-TAB-OUTLET-EA | air balance per outlet | EA | 0 | 0.3 | 200 | 0 | platform-baseline estimate |
| M-TAB-AHU-EA | AHU/RTU balance | EA | 0 | 6 | 2500 | 0 | estimate |
| M-TAB-TRAVERSE-EA | duct pitot traverse | EA | 300 | 1.5 | 500 | 0 | estimate |
| M-TAB-HYD-TERM-EA | hydronic balance per terminal | EA | 0 | 0.75 | 300 | 0 | estimate |
| M-TAB-REPORT-EA | certified report + acceptance re-test | EA | 0 | 24 | 0 | 0 | estimate |

## Quantity rules
- `M-TAB-OUTLET-EA` = area_sf_sum × 0.006 (ceil) — commercial/industrial/residential_mf
- `M-TAB-AHU-EA` = area_sf_sum × 0.0001 (ceil) — commercial/industrial
- `M-TAB-TRAVERSE-EA` = area_sf_sum × 0.0003 (ceil) — commercial/industrial
- `M-TAB-REPORT-EA` = const 1 — commercial/industrial
- `M-TAB-HYD-TERM-EA` — no reliable blueprint basis; estimator adds manually.

## Blueprint callouts (components)
- none this wave.

## Open questions → REVIEW_QUEUE
- IECC numbering: C403.12.2.3 is 2021 (C403.11.2.3 in 2018); C408.2.2.x confirmed from secondary sources only.
- All M-TAB costs are platform estimates.
- No vocab for flow hood / test instruments (tools only, not equipment) — fine.
