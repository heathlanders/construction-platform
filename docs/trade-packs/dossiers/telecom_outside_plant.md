# Dossier — `telecom_outside_plant` (Telecom Outside Plant (Fiber / Cable))

> Wave: w20 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/telecom_outside_plant.ts` · Status: draft
> Taxonomy: category `heavy_civil` · permit_trade `null` · phase `site_prep` · CSI `33 81`

## Scope (2–4 sentences)
Builds communications plant outside buildings: plowed / trenched conduit with tracer wire, handholes and vaults,
fiber pulled or blown into duct, strand + lashed aerial fiber on existing poles after make-ready, fusion splicing in
closures, and OTDR + power-meter acceptance testing with as-built / GIS records. Does NOT do inside-plant cabling
(`low_voltage`, E-LV-*), long directional bores (`directional_drilling`), pole replacement / power make-ready
(`power_line`) or locating services (`utility_locating`). No AHJ permit path → no gates, no code_refs; road-owner,
pole-owner and acceptance hold points live in `inspection_checklists`.

## Existing coverage reconciled
- Hand recipe: none (not in building.ts / nopermit.ts) → pack is the only recipe source.
- Catalog codes already seeded: none for this trade; inside-plant `E-DATA-DROP`, `E-LV-*` belong to low_voltage and are not duplicated.
- Blueprint template tasks hitting this trade: none (0).

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| telecom_outside_plant-ecfr-7-1755-200 | 7 CFR 1755.200 RUS splicing standard | 1 | public_domain | splice steps, fiber safety, 50 ft slack, bonding |
| telecom_outside_plant-ecfr-7-1755-404 | 7 CFR 1755.404 RUS fiber plant measurements | 1 | public_domain | OTDR bidirectional, 0.2 dB default, end-to-end, armor continuity |
| telecom_outside_plant-ecfr-7-1755-97 | 7 CFR 1755.97 RUS bulletins list | 1 | public_domain | identifies 1753F-150/151/152/153 (bulletin PDFs 403 — not read) |
| telecom_outside_plant-ecfr-47-1-1411 | 47 CFR 1.1411 pole access timeline | 1 | public_domain | attachment permit + make-ready hold point |
| telecom_outside_plant-wisdot-ss-671 | WisDOT SS 671 ITS conduit | 1 | gov_open | conduit, tracer, pull tape, markers |
| telecom_outside_plant-wisdot-ss-673 | WisDOT SS 673 communication vaults | 1 | gov_open | vault set/seal |
| telecom_outside_plant-wisdot-ss-678 | WisDOT SS 678 communication systems | 1 | gov_open | pulling tension, fusion only, test protocol, limits, records |
| excavation-wisdot-aup | WisDOT average unit prices FY23–25 | 2 | gov_open | costs (derived) |
| telecom_outside_plant-springnet-standards | SpringNet fiber construction standards | 1/4 | gov_open (municipal utility) | dual lashing, strand splice near pole, bend radius, strand bonding |
| telecom_outside_plant-stl-aerial-placing | STL aerial placing methods | 5 | manufacturer_public | route survey, bend radius 15×/20×, reel position, vault air, figure-8 |
| ecfr-1926-c/d/e/g/k/l/o/p/aa, asphalt_paving-mutcd-part6, concrete_repair_lifting-call811 | OSHA / MUTCD / 811 | 1 | public | hazards |

## Work steps (draft → pack recipes)
- **underground_fiber_placement** (title_re UG): permit + traffic + 811 → plow/trench conduit w/ tracer → set handholes/vaults → pull/blow fiber → markers, restoration, as-built.
- **aerial_fiber_existing_poles** (title_re AERIAL): attachment permit + make-ready released → strand, guy, bond → pull through blocks + lash → slack + dead-ends → clearance check + closeout.
- **fiber_splicing_testing** (title_re SPLICE): splice station + cable prep/bond → fusion splice + trays → seal/mount closure → OTDR + power meter both ways/both wavelengths → records.

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| struck_by_traffic | traffic in ROW | 1926.201(a) | 4 |
| buried_utility_strike | plow/trench hits utility | 1926.651(b)(1) | 4 |
| trench_cave_in | trench/vault pit collapse | 1926.652(a)(1) | 4 |
| overhead_power_contact | joint-pole power contact | 1926.416(a)(1) | 4 |
| aerial_lift_fall | bucket fall | 1926.453(b)(2)(v) | 4 |
| laser_eye | live fiber / test laser | 1926.54(c) | 3 |
| fiber_shards | glass slivers | 1926.95(a) | 2 |
| vault_atmosphere | manhole air | 1926.1203(a) | 4 |
| pulling_line_snap | pull line / strand failure | 1926.21(b)(2) | 3 |
| backing_equipment | plow / trucks backing | 1926.601(b)(4) | 3 |
| splice_chemicals | cleaners / gel | 1926.59 | 2 |

1910.268 (telecom, general industry) noted in prose only. Subpart V (1926.950) scope = electric T&D, not telecom — not cited.

## QA checklist
15 items in the pack (locates, depth/offset, tracer continuity, vault sealing, pull tension, slack ≥50 ft, attachment permit, strand bonding, bend radius, clearances, armor bonding, splice loss, OTDR bidirectional, end-to-end loss, as-built/GIS).

## Inspection / acceptance checkpoints
- row_permit_and_locates · pole_attachment_make_ready · buried_plant_pre_backfill · otdr_power_meter_acceptance · as_built_gis_closeout

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| HC-TEL-CONDUIT-PLOW-LF | HDPE 1-duct 2 in. plowed/trenched | LF | 250 | 0.06 | 350 | 3 | WisDOT 671.0112 avg ≈$11.69 (derived split @ $95/hr) |
| HC-TEL-FIBER-UG-LF | fiber in existing duct | LF | 90 | 0.018 | 40 | 5 | labor/equip from WisDOT 678.0072 install-only ≈$2.12; material estimate |
| HC-TEL-FIBER-AERIAL-LF | strand + lashed aerial fiber | LF | 145 | 0.035 | 90 | 5 | estimate (no public bid tab) |
| HC-TEL-VAULT-EA | polymer concrete vault | EA | 240000 | 10 | 35000 | 0 | WisDOT 673.0105 avg ≈$3,773 (derived) |
| HC-TEL-SPLICE-EA | fusion splice | EA | 150 | 0.7 | 1200 | 0 | WisDOT 678.0300 avg ≈$81.76 (derived) |
| HC-TEL-CLOSURE-EA | splice closure ≤144 f | EA | 45000 | 11 | 25000 | 0 | labor from WisDOT 678.0200 install-only ≈$1,341; material estimate |
| HC-TEL-OTDR-FIBER-EA | OTDR + OLTS per fiber | EA | 0 | 0.3 | 600 | 0 | estimate (WisDOT 678.0501 priced per service) |

## Quantity rules
- None — no blueprint facts describe outside-plant routes.

## Blueprint callouts (components)
- None this wave.

## Open questions → REVIEW_QUEUE
- RUS 1753F-150/151/152 bulletin PDFs return 403; not read — confirm buried depth / aerial clearance tables against them.
- Clearance values (NESC, ref-only) deliberately not stored.
- Vocab: no `cable_plow`, `bucket_truck`, `splice_trailer` equipment types (mapped to trencher / boom_lift / generator).
- Estimates: aerial LF, closure material, per-fiber test, UG cable material.
