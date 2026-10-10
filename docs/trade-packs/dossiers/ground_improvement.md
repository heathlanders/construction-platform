# Dossier — `ground_improvement` (Ground Improvement / Soil Stabilization / Grouting)

> Wave: w19 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/ground_improvement.ts` · Status: draft
> Taxonomy: category `heavy_civil` · permit_trade `null` · phase `site_prep` · CSI `31 32`

## Scope (2–4 sentences)
Specialty geotechnical contractor that improves weak or loose ground in place: rammed aggregate piers and
vibro stone columns, lime / cement / fly-ash soil stabilization of subgrades and building pads, compaction /
permeation / jet grouting, and wick drains with surcharge. Works to a geotechnical engineer's design and is
accepted by test section, installation logs and post-treatment verification — no AHJ permit gate (heavy
civil). Hand-offs: piles, drilled shafts and helical piles → `deep_foundations`; pumping groundwater →
`dewatering`; mass earthwork and borrow → `excavation`; MSE walls → `retaining_walls`.

## Existing coverage reconciled
- Hand recipe: none → NEW-TRADE pattern (3 recipes, no gates, no code refs).
- Catalog codes already seeded: none with `HC-GI-`; WisDOT 208.0100 Borrow / 208.2110.S Fly Ash Subgrade
  Stabilization exist only as DOT pay items (no catalog rows). No duplication.
- Blueprint template tasks hitting this trade: none.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| ground_improvement-fhwa-gec13-v1 | FHWA-NHI-16-027 GEC 13 Ground Modification Methods Vol I | 1 | public_domain | aggregate piers / stone columns steps + QA, wick drain costs, aggregate column costs (Table 5-2) |
| ground_improvement-fhwa-gec13-v2 | FHWA-NHI-16-028 GEC 13 Ground Modification Methods Vol II | 1 | public_domain | grouting steps + QA, chemical stabilization mix/QA, lime/cement/grout costs |
| excavation-wisdot-aup (reused) | WisDOT Average Unit Price List 10/21/2025 | 2 | gov_open | surcharge fill (208.0100 Borrow $9.11/$9.09/$7.39 per CY) |
| ecfr-1926-d / e / m / o / p / q / z / cc (shared) | 29 CFR 1926 Subparts | 1 | public_domain | hazards (sections verified on eCFR API 2026-10-08) |

USACE EM 1110-2-3506 (Grouting Technology) / EM 1110-1-1905 were not cited: the publications.usace.army.mil
paths return 403 and no DTIC mirror was confirmed — see REVIEW_QUEUE.

## Work steps (draft → pack recipes)
**aggregate_piers** (`rammed aggregate piers|aggregate piers/columns|stone columns|vibro…|geopiers|ground improvement`)
1. Review the design and lay out every element — QA design_on_site, location_tolerance.
2. Build and test the test elements (modulus / uplift test or before-after soundings) — QA test_section.
3. Drill or penetrate and build each element in lifts (stone take ≤5 ft, amperage) — QA installation_log, stone_consumption.
4. Check each element as it is finished (BSTA, DCP) — QA bsta_dcp, location_tolerance.
5. Verify the improvement and hand over records (CPT/SPT between columns) — QA post_verification, records_delivered.

**chemical_stabilization** (`lime|cement|fly ash|chemical … stabiliz/treat/modif`, `soil stabilization/cement`, `subgrade stabilization/modification`)
1. Confirm the mix design and set up the test strip (sulfates / organics) — QA mix_design, test_section.
2. Spread the stabilizer at the design rate — QA mix_uniformity, caustic_ppe.
3. Mix to full depth at the right moisture (mellowing, phenolphthalein) — QA mix_uniformity.
4. Compact, finish and cure — QA compaction_density.

**grouting** (`compaction/permeation/jet/chemical/low-mobility grout…|void fill|grouting`)
1. Review the grouting plan and set up monitoring — QA design_on_site, heave_monitoring.
2. Drill and set the grout pipes — QA installation_log.
3. Mix and check the grout (≤1 in. slump at header) — QA grout_mix_tested.
4. Inject in stages to refusal (1–3 ft stages, 1.5–2 cf/min, perimeter inward) — QA stage_records, heave_monitoring.
5. Close holes, verify and report — QA post_verification, records_delivered.

No gates / code refs (permit_trade null).

## Hazards (draft → pack hazards)
| id | Hazard | Controls | OSHA ref | Sev |
|---|---|---|---|---|
| caustic_contact | lime / cement / grout burns | eyewash + drench, alkali gloves, wash off | 1926.50(g) | 3 |
| chemical_sds | unknown chemical hazards, quicklime heat | SDS on site, training, slake per supplier | 1926.59 | 3 |
| dust_exposure | lime / cement / fly ash dust | light wind, filtered cabs, respirator | 1926.55(a) | 2 |
| silica | drilling rock/concrete | Table 1 controls | 1926.1153(c)(1) | 3 |
| power_line | rig mast / crane boom contact | clearance, lower masts, spotter | 1926.600(a)(6) | 4 |
| rig_ground | rig / vibro crane tip-over | firm platform, mats, barricade | 1926.1402(b) | 4 |
| grout_line | hose burst / whip / plugged line | rated hoses, restraints, depressurize | 1926.702(e)(1) | 3 |
| backing_equipment | spreaders / rollers backing | reverse alarms, spotter, hi-vis | 1926.602(a)(9)(ii) | 4 |
| open_hole | fall into open holes | cover / guard | 1926.501(b)(4)(i) | 3 |
| utility_strike | drilling into utilities | locates, pothole | 1926.651(b)(1) | 4 |
| noise | vibrators / drills / plants | hearing protection | 1926.101(a) | 2 |

## QA checklist
15 items — design_on_site, test_section, location_tolerance (4 in.), installation_log, stone_consumption
(≤5 ft, +40 A, 50-column average, 90% min, 2 in./10 ft), bsta_dcp (15 blows/1.75 in., ~1 modulus test per
1,000 piers), mix_design (lime 3–8%, cement 3–10%), mix_uniformity (spread rate + phenolphthalein),
compaction_density (95% T 99 / T 134, mellowing, cure), grout_mix_tested, stage_records, heave_monitoring,
post_verification, records_delivered, caustic_ppe (safety). All GEC 13 Vol I/II except caustic_ppe (1926.50(g)).

## Inspection / acceptance checkpoints
- test_section_verification: same method, test reported, written acceptance of criteria.
- daily_qc_logs: pier/column logs, grout stage logs, stabilization records.
- post_treatment_verification: soundings between elements, same method; shortfalls re-treated.
- settlement_monitoring: plates/piezometers baselined; surcharge removal only on engineer confirmation.

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| HC-GI-RAP-LF | Rammed aggregate pier ~30 in. | LF | 900 | 0.10 | 1500 | 10 | GEC 13 Table 5-2 $20–60/LF (typ. $20–40, 2007–10) escalated ≈$45/LF; derived (material estimate) |
| HC-GI-LIMESTAB-SY | Lime stabilization 12 in., ≈5% | SY | 470 | 0.012 | 300 | 5 | 47 lb lime/SY at ≈$200/ton; GEC 13 Vol II $2–5 mix + $100–150/ton (escalated); derived |
| HC-GI-CEMSTAB-SY | Cement stabilization 12 in., ≈6% | SY | 510 | 0.010 | 250 | 5 | 57 lb cement/SY at ≈$180/ton; same GEC 13 basis; derived |
| HC-GI-COMPGROUT-CY | Compaction grouting per CY injected | CY | 13000 | 2.5 | 25000 | 5 | grout $60–120/CY (GEC 13) escalated → derived; crew/equipment production = estimate |
| HC-GI-WICK-LF | Wick drain with mandrel | LF | 25 | 0.002 | 35 | 5 | GEC 13 case bids $0.45 and $2.10/LF; material estimate; mobilization excluded |
| HC-GI-SURCHARGE-CY | Surcharge place + remove | CY | 300 | 0.05 | 450 | 0 | WisDOT 208.0100 Borrow avg ≈$8.53/CY per handling × 2; derived |

## Quantity rules
- `HC-GI-RAP-LF` = area_sf_sum × 0.15 (ceil), commercial/industrial — ≈1 pier × 15 ft per 100 SF; replace with design.
- `HC-GI-CEMSTAB-SY` = area_sf_sum × 0.1334 (ceil), commercial/industrial — 12 in. pad over floor area + 20%.
Both are placeholders the estimator replaces with the geotechnical design; remove the one not used.

## Blueprint callouts (components)
- none (none this wave).

## Open questions → REVIEW_QUEUE
- USACE grouting EMs not cited (403, URL unverifiable).
- Compaction grout labor/equipment production and pier/wick material prices are platform estimates.
- Quantity rules for both RAP and pad stabilization fire together on commercial/industrial — estimator deletes one.
