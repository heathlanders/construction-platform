# Dossier — `dewatering` (Dewatering)

> Wave: w19 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/dewatering.ts` · Status: draft
> Taxonomy: category `sitework` · permit_trade `building` · phase `site_prep` · CSI `31 23 19`

## Scope
Controls groundwater and surface water so excavations for footings, foundations and utilities stay dry:
open pumping from sumps, or wellpoint / deep-well systems that lower the water table before digging.
Includes discharge permitting and sediment treatment, pump monitoring, settlement monitoring of
adjoining structures and shutdown. Does NOT include the excavation itself (`excavation`), shoring
(`shoring_underpinning`), site erosion control (`erosion_control`), or permanent foundation drains.

## Existing coverage reconciled
- Hand recipe: none → NEW-TRADE pattern (2 recipes).
- Catalog codes: none for dewatering. `B-DW-*` is already used by drywall (`B-DW-CORNER-LF`, …), so this
  pack uses `B-DWTR-*` instead of the suggested `B-DW-*` to avoid a confusing shared prefix. Related
  existing codes not duplicated: `B-ERO-*` (erosion control), `B-EXC-*` (excavation), `P-PL-SUMP-PUMP-EA`
  (permanent building sump pump).
- Blueprint template tasks: none.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| ecfr-1926-p | 29 CFR 1926 Subpart P | 1 | public_domain | 1926.651(e),(g),(h),(i),(k) hazards + QA |
| ecfr-1926-m / -k / -aa / -f / -d | 29 CFR 1926 Subparts M, K, AA, F, D | 1 | public_domain | 1926.501(b)(7)(ii), 1926.404(b)(1), 1926.1203(a), 1926.152(g)(10), 1926.52(b) |
| dewatering-wi-dnr-gp-0049344 | WPDES GP WI-0049344-05-0 Dewatering Operations | 1 | gov_open | coverage, BMP plan, daily log, discharge limits, contaminated-site screening, 70 gpm note |
| dewatering-wi-dnr-3400-233 | Form 3400-233 Dewatering Visual Inspection Log | 1 | gov_open | log fields |
| dewatering-wi-dnr-1061 | WDNR Technical Standard 1061 (4/2020) | 1 | gov_open | treatment train, bag sizing, transparency tube 12.5 cm, floating suction, outlets |
| dewatering-wi-dnr-highcap | WDNR High capacity wells | 1 | gov_open | >100,000 gpd property capacity, NR 812.09(4) approval |
| dewatering-ufgs-31-23-19 | UFGS 31 23 19 Dewatering | 1 | public_domain | title only — not re-read (script-rendered / 403) |
| erosion_control-wi-csgp | WPDES Construction Site Storm Water GP | 1 | gov_open | (context) construction GP generally does not cover high-cap well discharge |
| icc-pa | IBC 1803.5.4, 1805.1.3, 3307.1 | 3 | proprietary_ref_only | code refs (section + paraphrase) |
| platform-baseline | expert baseline | — | platform_estimate | all costs |

## Work steps
**sump_open_pumping** (`dewater|sump pump`, example "Dewater foundation excavation"):
1. Plan the discharge and get coverage — QA permit_before_discharge, contam_screen.
2. Dig the sump and set the pump — GFCI, sump outside footing.
3. Treat and discharge the water — filter bag/tank, transparency tube.
4. Keep the footing bottom dry for inspection — Gate `footing`, IBC 1803.5.4.
5. Shut down and restore.

**wellpoint_deep_well** (`well points|deep wells|eductor`, priority 10, example "Install wellpoint dewatering system"):
1. Confirm the design and approvals — WI NR 812.09 high-cap approval.
2. Set monitoring before pumping — IBC 3307.1.
3. Install points and header.
4. Draw down and verify before digging — standby power.
5. Hold the drawdown through the foundation — Gate `foundation`, IBC 1805.1.3.

## Hazards
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| cavein_water | Cave-in / drowning in standing or rising water | 1926.651(h)(1) | 4 |
| pump_failure | Pump/power failure, water rises | 1926.651(h)(2) | 4 |
| surface_runoff | Runoff into excavation | 1926.651(h)(3) | 3 |
| adjacent_settlement | Settlement of neighboring structures | 1926.651(i)(1) | 4 |
| fall_sump | Fall into sump/well/pit ≥6 ft | 1926.501(b)(7)(ii) | 3 |
| shock_pump | Shock from submersible pumps | 1926.404(b)(1) | 4 |
| engine_exhaust | CO from engine pumps | 1926.651(g)(1)(i) | 3 |
| confined_sump | Deep sump / wet well entry | 1926.1203(a) | 4 |
| struck_load | Struck by bucket / lifted pump | 1926.651(e) | 3 |
| refuel_fire | Refueling fire | 1926.152(g)(10) | 3 |
| noise | Pump/generator noise | 1926.52(b) | 2 |

## QA checklist
15 items — permit before discharge, contaminated-site screening, high-cap approval, sump location,
bag on stable ground, transparency-tube clarity, no sheen/solids/foam, daily log, baseline readings,
water below bottom*, no boiling*, GFCI*, drawdown verified*, standby power*, settlement within limits*
(* safety, ES pending).

## Inspection / acceptance checkpoints
- footing: excavation dry, bearing firm/undisturbed, sumps outside footing lines.
- foundation: drawdown held until uplift resisted; settlement within limits.
- discharge_permit_check (state/owner): coverage + BMP plan on site, log current, clean discharge.

## Cost basis (all platform-baseline, estimate)
| Code | Unit | Material ¢ | Labor hr | Equip ¢ | Waste % |
|---|---|---|---|---|---|
| B-DWTR-SUMP-EA | EA | 45000 | 4 | 0 | 5 |
| B-DWTR-PUMP-DAY | DAY | 0 | 0.5 | 12000 | 0 |
| B-DWTR-FILTERBAG-EA | EA | 25000 | 0.75 | 0 | 0 |
| B-DWTR-TANK-DAY | DAY | 0 | 0.25 | 9000 | 0 |
| B-DWTR-WELLPOINT-LF | LF | 2500 | 0.6 | 4000 | 5 |
| B-DWTR-MONITOR-EA | EA | 15000 | 2 | 5000 | 0 |

## Quantity rules
Const, scoped by building type (rules only run when a dewatering task is on the schedule):
commercial/industrial/mf — 2 sumps, 20 pump-days, 2 filter bags, 4 monitoring points;
residential_sf — 1 sump, 7 pump-days. Wellpoint and tank are engineered/site-specific — no rule.

## Blueprint callouts
None this wave.

## Open questions → REVIEW_QUEUE
- Safety ES: 11 hazards + 6 QA pending human translation.
- All 6 costs are estimates.
- UFGS 31 23 19 not re-read (script-rendered, PDF 403).
- No `pump` / `wellpoint_pump` in the equipment vocab — proposed.
- Assembly prefix `B-DWTR-` used instead of `B-DW-` (collides with drywall).
- WI NR 812.09 cited at section level; DNR page cites NR 812.09(4)(a)&(b) — confirm the 70 gpm (GP/TS 1061) vs 100,000 gpd (DNR page) thresholds are presented consistently.
