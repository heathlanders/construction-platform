# Dossier — `directional_drilling` (Horizontal Directional Drilling / Boring)

> Wave: w20 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/directional_drilling.ts` · Status: draft
> Taxonomy: category `heavy_civil` · permit_trade `null` · phase `site_prep` · CSI `33 05 07`

## Scope
Installs pipe, conduit and casing under roads, rail, waterways and developed ground without an open trench:
steered HDD (pilot → back ream → pullback) and auger jack-and-bore of steel casing. Includes utility potholing,
entry/exit/jacking pits, drilling-fluid management and frac-out response, tracking and the bore log / as-built.
Does NOT cover gravity sewer rehab (CIPP, pipe bursting → `trenchless_sewer`), microtunneling / TBM
(`tunneling`), or the carrier pipeline itself (`pipeline`, `site_utilities`, `telecom_outside_plant`).

## Existing coverage reconciled
- Hand recipe: none (not in building.ts / nopermit.ts). Pack is the only recipe source.
- Catalog codes already seeded: none for HDD. `trenchless_sewer` owns `P-TS-*` (CCTV, jet, CIPP, burst, pit) — no
  overlap; `HC-HDD-PIT-EA` is a bore pit with fluid containment, distinct from the sewer-lateral `P-TS-PIT-EA`.
- Blueprint template tasks: none (0).

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| directional_drilling-fdot-ss-555-556 | FDOT Std Specs FY2025-26 §555 Directional Bore, §556 Jack and Bore | 1 | gov_open | steps, QA, checklists (tracking, reamer size, fluids, bore report, auger boring controls) |
| directional_drilling-ferc-hdd-2019 | FERC HDD Monitoring / IR Response / Contingency guidance (2019) | 1 | public_domain | frac-out monitoring, fluid properties, response |
| directional_drilling-ohioepa-hdd-2023 | Ohio EPA HDD Contingency Plan Guidance (2023) | 1 | gov_open | IR definition, containment, shift logs |
| directional_drilling-wisdot-ss-671 | WisDOT Std Spec 671 Conduit HDPE (Directional Bore) | 1 | gov_open | gas-main exposure, pull tape, pay basis |
| excavation-wisdot-aup | WisDOT Average Unit Price List (10/21/2025) | 2 | gov_open | 671.0212 directional bore 1-duct 2-in. $22.00/$24.35/$32.13 per LF |
| ecfr-1926-c/e/h/i/k/o/p | 29 CFR 1926 Subparts | 1 | public_domain | hazards (1926.28(a), .101(a), .251(a)(2), .300(b)(2), .302(d)(2), .416(a)(3), .600(a)(6), .602(a)(9)(ii), .651(b)(3), .651(c)(2), .652(a)(1)) |

Not used as data: HDD Consortium "HDD Good Practices Guidelines" and NASTT good-practices courses (proprietary;
no verifiable public URL found). USACE ERDC/GSL TR-02-9 (HDD beneath levees) exists but DTIC blocked download.

## Work steps
Recipe `hdd_bore` — example "Directional bore 2 in. HDPE conduit under highway":
1. Locate and pothole every utility on the bore path — QA locates_potholes, bore_plan_approved.
2. Set up the rig, pits and fluid containment (ground mats + strike alert, frac-out kit) — contingency_plan_on_site, fluid_properties.
3. Drill and track the pilot bore (readings at every correction, ≤100 ft) — tracking_readings, returns_monitored.
4. Back ream and watch for frac-out (Table 555-1 reamer limit) — reamer_size, frac_out_response.
5. Pull back the product and record the pull (same day) — pullback_log, tracer_continuity.
6. Clean up, test and turn in the bore log (48 h cleanup, 7-day report, 30-day as-built) — product_test, bore_report.

Recipe `jack_and_bore` — example "Jack and bore 24 in. steel casing under railroad":
1. Locate utilities and build the bore pit. 2. Set the track at line and grade. 3. Bore and jack the casing
(head lead ≤1/3 dia / ≤8 in., spoil log, bentonite lube, AWS D1.1 joints). 4. Install the carrier and close out.

No gates (permit_trade null).

## Hazards
utility_strike 1926.651(b)(3) · electric_strike 1926.416(a)(3) · power_line_overhead 1926.600(a)(6) ·
pit_cave_in 1926.652(a)(1) · pit_egress 1926.651(c)(2) · rotating_string 1926.300(b)(2) ·
high_pressure_fluid 1926.302(d)(2) · frac_out 1926.28(a) · pullback_load 1926.251(a)(2) ·
backing_equipment 1926.602(a)(9)(ii) · noise 1926.101(a). All ES pending human translation.

## Inspection / acceptance checkpoints
utility_potholing_and_locates · bore_plan_and_profile_approval · drilling_fluid_and_frac_out_contingency ·
pullback_tension_log · as_built_bore_log.

## Cost basis
| Code | Unit | Mat ¢ | Labor hr | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|
| HC-HDD-SM-2IN-LF | LF | 150 | 0.07 | 1700 | 5 | derived — WisDOT 671.0212 avg ≈ $26/LF; 350 LF/day crew |
| HC-HDD-MD-6IN-LF | LF | 950 | 0.25 | 4500 | 5 | estimate |
| HC-HDD-JB-24IN-LF | LF | 9500 | 0.9 | 12000 | 3 | estimate (no WisDOT jack-and-bore item) |
| HC-HDD-POTHOLE-EA | EA | 4000 | 2.5 | 25000 | 0 | estimate |
| HC-HDD-PIT-EA | EA | 15000 | 6 | 60000 | 0 | estimate |
| HC-HDD-FLUID-DISP-CY | CY | 3500 | 0.3 | 4500 | 0 | estimate |

## Quantity rules
None — blueprint facts do not describe bores.

## Blueprint callouts
None this wave.

## Open questions → REVIEW_QUEUE
- Equipment vocab lacks `hdd_rig`, `vacuum_excavator`, `auger_boring_machine`.
- Safe pullback load is from the pipe manufacturer (pullback_log QA cites platform-baseline).
- 5 of 6 assemblies are estimates.
