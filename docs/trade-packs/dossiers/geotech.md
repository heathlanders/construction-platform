# Dossier — `geotech` (Geotechnical Engineering / Soils)

> Wave: w21 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/geotech.ts` · Status: draft
> Taxonomy: category `services` · permit_trade `null` · phase `site_prep` · CSI `02 32`

## Scope
A professional service. It runs the subsurface exploration before design (borings with SPT sampling, test
pits, groundwater readings, lab tests), then issues a sealed geotechnical report with bearing capacity,
settlement, frost depth, groundwater, seismic site class and earthwork/foundation recommendations. During
construction it observes subgrade (proof rolls) and footing excavations and issues bearing verification
letters. It does not design the structure, build foundations, do compaction QA testing (materials_testing),
or do special inspection under IBC Ch. 17 (special_inspection).

## Existing coverage reconciled
- Hand recipe: none → pack recipe `geotech_investigation` (new-trade pattern).
- Catalog codes: none (services wave — no assemblies).
- Blueprint template tasks: none tagged `geotech`. The `Survey, ... & geotechnical investigation` template
  tasks are `trade_type: 'surveying'`; packs dispatch by trade key, and the recipe `title_re` also refuses
  any title containing "survey" as a second guard.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| geotech-fhwa-gec5 | FHWA GEC 5 Geotechnical Site Characterization (NHI-16-072) | 1 | public_domain | steps, QA (logs, groundwater timing, N60, lab sample quality) |
| geotech-astm-d1586 | ASTM D1586 SPT | ref | proprietary_ref_only | named by number only |
| geotech-astm-d2487 | ASTM D2487 USCS | ref | proprietary_ref_only | named by number only |
| icc-pa | IBC 1803 / 1809.5 | ref | proprietary_ref_only | prose only (no code_refs — null permit) |
| patio_covers_awnings-wi-sps321 (reused) | WI UDC SPS 321 | 1 | gov_open | frost depth 48 in. (321.16) |
| ecfr-1926-o / -i / -p / -e / -g | 29 CFR 1926 | 1 | public_domain | hazards |

## Work steps
1. Desk study and exploration plan — QA qa_boring_layout.
2. Locate utilities and stake boring locations.
3. Drill borings and take SPT samples — QA qa_boring_logs, qa_spt_n60.
4. Dig and log test pits (optional backhoe) — QA qa_test_pit_logs.
5. Read groundwater and close the boreholes — QA qa_groundwater.
6. Lab testing and soil classification — QA qa_lab_results.
7. Issue the geotechnical report — QA qa_report_recommendations, qa_bearing_frost.

## Hazards
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| drill_rig_power_line | Mast near overhead lines (10 ft ≤50 kV) | 1926.600(a)(6) — dedicated drill rigs are excluded from Subpart CC by 1926.1400(c)(11) | 4 |
| rotating_auger | Entanglement | 1926.300(b)(2) | 4 |
| buried_utility_strike | Utility strike | 1926.651(b)(1) | 4 |
| test_pit_cave_in | Test pit cave-in | 1926.652(a)(1) | 4 |
| rig_noise | Noise | 1926.101(a) | 2 |
| roadway_traffic | Traffic | 1926.201(a) | 3 |

## QA checklist (deliverables)
Boring layout, final boring logs, N60 correction, test-pit logs, groundwater reporting, lab tabulation,
sealed report recommendations, bearing + frost statement, footing bearing verification letter, proof roll.

## Inspection / acceptance checkpoints
- `footing_bearing_verification` (owner/AHJ hold point, non-gating): undisturbed soil, matches logs and
  bearing pressure, frost depth, soft-area correction documented.

## Cost basis
None (services wave).

## Open questions → REVIEW_QUEUE
- vocab: no `drill_rig` equipment type; boring step carries no equipment.
- scope: proof roll / footing observation overlaps materials_testing and special_inspection packs.
