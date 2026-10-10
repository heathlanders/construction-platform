# Dossier — `controls_bms` (Building Controls / BMS)

> Wave: w14 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/controls_bms.ts` · Status: draft
> Taxonomy: category `mechanical_systems` · permit_trade `mechanical` · phase `commissioning` · CSI `25`

## Scope (2–4 sentences)
Building automation / HVAC temperature controls: DDC/BACnet controllers and panels, low-voltage
control wiring and pathways, sensors, damper/valve actuators, duct smoke detectors (device + shutdown
wiring), programming, graphics, point-to-point checkout, functional testing with TAB/Cx, trend review
and owner training. NOT: 120 V power to panels (electrical), immersion wells in pressurized piping
(pipefitter), balancing (test_balance), fire alarm system (fire_alarm), terminal boxes themselves (hvac).

## Existing coverage reconciled
- Hand recipe: none (not in HAND_RECIPE_KEYS) → NEW-TRADE pattern; the mechanical family phase recipe remains the fallback.
- Catalog codes already seeded: `M-THERMOSTAT` (programmable thermostat), `M-VAV-BOX` (terminal box only) — not redeclared; `M-BAS-VAV-CTRL-EA` is the controller add-on to the box.
- Blueprint template tasks: `commercial.ts` sort 28 'Building automation & controls rough-in' (rough_in) → `bas_rough_in` title_re matches.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| controls_bms-ufgs-23-09-00 | UFGS 23 09 00 Instrumentation and Control for HVAC (08/24 chg 1) | 1 | public_domain | steps, QA (mounting, labels, start-up, calibration, actuator range, PVT/endurance trend) |
| controls_bms-pnnl-retuning | PNNL Building Re-Tuning | 1 | gov_open | trend review QA |
| controls_bms-doe-building-controls | DOE BTO Building Controls | 1 | gov_open | context |
| controls_bms-ashrae-g36-135 | ASHRAE Guideline 36 / Std 135 BACnet | 3 | proprietary_ref_only | named only |
| icc-pa / nfpa-fa | IMC 306, 606; IECC C403.4, C403.4.1, C408.2; NEC 300.22, 725 | 3 | proprietary_ref_only | code refs |
| ecfr-1926-c/e/k/l/m/x/z | 29 CFR 1926 | 1 | public_domain | hazards |

Note: the UFGS 23 09 23 landing page exists on WBDG but its PDF answers 403 to scripts; 23 09 00 was read in full and is the cited source.

## Work steps (draft → pack recipes)
`bas_rough_in` (template task): submittals → panels + pathways (rough_in; NEC 725/300.22) → sensors/actuators/duct smoke (rough_in; IMC 606) → terminate/network/passwords (equipment_set; IMC 306).
`bas_commissioning` (priority 10; checkout/Cx/trend/training titles): programming + graphics (IECC C403.4.1) → point-to-point checkout → functional tests with TAB/Cx (final; IECC C408.2, IMC 606) → trends + training + turnover (final; IECC C408.2).

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| ladder | ladder fall | 1926.1053(b)(1) | 3 |
| aerial_lift | lift fall | 1926.453(b)(2)(v) | 4 |
| live_panel | energized starters/VFDs | 1926.416(a)(1) | 4 |
| lockout | unexpected start during checkout | 1926.417(b) | 4 |
| silica_drill | concrete drilling | 1926.1153(c)(1) | 3 |
| overhead_debris | eye debris | 1926.102(a)(1) | 2 |
| roof_edge | rooftop sensors/RTU controllers | 1926.501(b)(1) | 4 |
| cord_shock | temp power tools | 1926.404(b)(1) | 3 |
| sheet_metal_cut | duct edges | 1926.95(a) | 2 |
| cable_pull_trip | housekeeping | 1926.25(a) | 2 |
| hot_pipe | hot water/steam wells | 1926.21(b)(2) | 3 |

## QA checklist
15 items — submittals, panel access, cable support/plenum/firestop, Class 2 separation (safety), sensor location, actuator stroke, duct smoke access (safety), labels/tags, passwords, two-point calibration, point-to-point sheet, safeties proven (safety), FPT closed, trend review, turnover docs.

## Inspection / acceptance checkpoints
- rough_in: wiring methods/plenum/separation; duct smoke detectors.
- equipment_set: controller service access.
- final: smoke shutdown; IECC C403.4 controls present; C408.2 commissioning documentation.

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| M-BAS-DDC-PANEL-EA | building controller panel | EA | 350000 | 12 | 0 | 0 | estimate |
| M-BAS-POINT-EA | hardwired I/O point avg | EA | 30000 | 3.5 | 1500 | 5 | estimate |
| M-BAS-VAV-CTRL-EA | VAV controller + actuator + space sensor | EA | 60000 | 4 | 2000 | 5 | estimate |
| M-BAS-PROG-PT | programming/graphics/checkout per point | EA | 0 | 1.2 | 0 | 0 | estimate |
| M-BAS-FPT-SYS | functional testing per system | EA | 0 | 10 | 0 | 0 | estimate |

## Quantity rules
- DDC panel = area_sf_sum × 0.00005 (≈1/20,000 SF) commercial+industrial
- points = area × 0.0025 commercial (≈1/400 SF); × 0.00067 industrial (≈1/1,500 SF)
- programming = area × 0.0025 commercial
- VAV controller = area × 0.001 commercial (delete if not VAV)
- FPT = area × 0.0000667 (≈1 system/15,000 SF) commercial+industrial

## Blueprint callouts (components)
- none this wave.

## Open questions → REVIEW_QUEUE
- IECC section numbering (C403.4 / C403.4.1 / C408.2) checked against 2021 structure — verify against the edition each AHJ adopts.
- NEC Article 725 scope moved in the 2023 edition (Class 1 → 724); "725" still Class 2/3.
- All BAS costs are platform estimates; point density rules are coarse placeholders.
- VAV controller rule fires on every commercial job with room areas — consider gating on a VAV fact once one exists.
