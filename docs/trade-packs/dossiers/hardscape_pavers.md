# Dossier — `hardscape_pavers` (Hardscape / Pavers (Patios / Walks / Outdoor Kitchens))

> Wave: w04 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/hardscape_pavers.ts` · Status: draft
> Taxonomy: category `sitework` · permit_trade `null` · phase `sitework` · CSI `32 14`

## Scope (2–4 sentences)
Segmental concrete, clay or stone pavers for patios, walks and driveways — standard (sand-set) and
permeable (PICP) — plus the paved base for outdoor kitchens and low segmental seat walls. Covers locate,
excavation, subgrade/base compaction, edge restraint, bedding, laying/cutting, seating and joint fill.
Does NOT cover: engineered retaining walls (`retaining_walls`), poured concrete flatwork
(`concrete_flatwork`), outdoor-kitchen gas/electric/plumbing (permit trades), irrigation/lighting sleeves
(their trades). No permit path → no gates/code refs; owner/GC hold points are inspection checklists.

## Existing coverage reconciled
- Hand recipe: none → pack is the NEW-TRADE pattern (2 recipes).
- Catalog codes already seeded: `G-SITE-DEMO-SF` (hardscape removal incl. pavers), `B-FLAT-EXCAV-SF`
  (excavate + grade 6"), `B-AGG-BASE-SY` (6" compacted aggregate base) → referenced from quantity_rules,
  not redeclared. New: `G-HSP-*` (5).
- Blueprint template tasks hitting this trade: none.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| hardscape_pavers-ufgs-32-14-13-13 | UFGS 32 14 13.13 Interlocking Precast Concrete Unit Paving (Nov 2019) | 1 | public_domain | edge restraint first, 1 in. bedding ±1/4, joints 1/16–3/16, ≥3 seating passes, 5 ft rule, tolerances 3/8 in/10 ft, +1/4 at edges, ±1/2 grade, cleanup |
| hardscape_pavers-icpi-ts18-picp | ICPI Tech Spec 18 — PICP construction (hosted by Cambridge Pavers) | 4 | association_public | PICP layers, joint stone, unit thickness, geotextile on sides, keep downslope of foundations |
| hardscape_pavers-rcp-install-guide | Rochester Concrete Products paver install guide (2025) | 5 | manufacturer_public | base depth by use, lifts ≤4 in., 1 in. bedding, slope ≈1 in./8 ft, fabric on wet soil, 811, polymeric sand |
| hardscape_pavers-unilock-base-prep | Unilock — base preparation do's and don'ts | 5 | manufacturer_public | corroborates 4–6 in. walks / 8–12 in. driveways |
| hardscape_pavers-belgard-trg | Belgard Technical Resource Guide p. 18 (cutting) | 5 | manufacturer_public | one-third cut rule, slurry wash-off |
| ecfr-1926-c/d/e/i/o/p/z | 29 CFR 1926 subparts | 1 | public_domain | hazards |
| platform-baseline | The Jobsite national baseline | — | platform_estimate | all assembly costs |

NCMA TEK / CMHA SRW Best Practices Guide: landing pages reachable but content not extractable in this
session — not cited; seat-wall assembly is a cost line only (no seat-wall recipe).

## Work steps (draft → pack recipes)
**paver_patio_walk** (`\bpavers?\b|hardscape|brick (patio|walk)|interlocking pav|outdoor kitchen`):
1. Locate utilities, lay out and excavate — QA locate_ticket, excavation_depth_by_use, slope_drainage.
2. Compact subgrade and build the base in lifts — QA geotextile_where_needed, base_lifts_compacted, base_smoothness.
3. Set edge restraint and screed bedding sand — QA edge_restraint, bedding_sand.
4. Lay and cut pavers — QA wet_cutting, laying_joints_cuts.
5. Compact, fill joints and final pass — QA seating_passes, joint_fill, finished_tolerances.

**permeable_pavers** (priority 10; `permeable|PICP|pervious pav`): excavate reservoir → geotextile +
No. 2/No. 57 stone in lifts → edge restraint + 2 in. No. 8 bedding → lay, stone-fill joints, compact.

## Hazards (draft → pack hazards)
| id | Hazard | Controls | OSHA ref | Sev |
|---|---|---|---|---|
| silica_cutting | silica from saw-cutting pavers/block | integrated water feed per Table 1; respirator >4 h | 1926.1153(c)(1) | 3 |
| utility_strike | buried utility strike | 811 locate, hand-dig near marks | 1926.651(b)(1) | 4 |
| compactor_noise | hearing loss | hearing protection, rotate | 1926.52(d)(1) | 2 |
| compactor_crush | feet/hands under plate | safety-toe boots, work slopes across | 1926.96 | 2 |
| skid_steer_struck | struck/pinned, raised bucket | bucket down, spotter | 1926.600(a)(3)(i) | 4 |
| dump_truck_backing | backing truck | reverse alarm or spotter | 1926.601(b)(4) | 4 |
| manual_lifting | repetitive lifting | stage pallets, clamps, team lift | 1926.20(b)(1) | 2 |
| heat_illness | heat on hot paving | training, water/shade/rest | 1926.21(b)(2) | 3 |
| flying_chips | eye injury splitting/cutting | safety glasses | 1926.102(a)(1) | 2 |
| saw_kickback | cut-off saw kickback | guard on, stable support | 1926.300(b)(1) | 3 |

Note: 1926.602(a)(1) reserves specific rules for compactors and skid steers — controls cite general equipment (1926.600) instead.

## QA checklist
15 items — locate (safety), base depth by use, geotextile, base lifts, base smoothness, slope (~1% min /
2% target), edge restraint, bedding sand, wet cutting (safety), joints + one-third cuts, seating passes,
joint fill (sand/polymeric), finished tolerances, PICP layers, PICP units + joint stone.

## Inspection / acceptance checkpoints
- `base_compaction_check` (owner/GC hold before bedding): depth by use, geotextile, lifts/smoothness/slope, edge restraint.
- `permeable_reservoir_check`: location downslope, geotextile, stone sizes/thickness, underdrain.
- `final_walkthrough`: tolerances, joints full/no haze, no slivers, drainage away, cleanup.

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| G-HSP-PAVER-SF | 60 mm paver on 1 in. sand, laid + seated | SF | 450 | 0.10 | 20 | 7 | platform estimate |
| G-HSP-PERM-SF | PICP system (80 mm, No. 8/57, geotextile) | SF | 950 | 0.16 | 60 | 6 | platform estimate |
| G-HSP-EDGE-LF | plastic/aluminum edge restraint | LF | 250 | 0.04 | 0 | 5 | platform estimate |
| G-HSP-POLY-SF | polymeric joint sand | SF | 50 | 0.01 | 0 | 10 | platform estimate |
| G-HSP-SEATWALL-LF | segmental seat wall 18–24 in. w/ caps | LF | 4500 | 0.75 | 50 | 5 | platform estimate |

## Quantity rules
- `G-HSP-PAVER-SF` = component `paver_patio` × 250 — ≈16×16 patio until measured
- `B-FLAT-EXCAV-SF` = `paver_patio` × 250 (existing code)
- `B-AGG-BASE-SY` = `paver_patio` × 28 (existing code, 6 in. base)
- `G-HSP-EDGE-LF` = `paver_patio` × 64
- `G-HSP-POLY-SF` = `paver_patio` × 250

## Blueprint callouts (components)
- token `paver_patio` — `PAVER(S) PATIO|WALK|DRIVE|APRON|TERRACE` · `BRICK|CONCRETE|PERMEABLE|INTERLOCKING|CLAY|STONE PAVER(S)` · bare `PAVERS` — example "NEW BRICK PAVER PATIO". Does not match PAVEMENT/ASPHALT PAVING. No current fixture contains "PAVER".

## Open questions → REVIEW_QUEUE
- All 5 assembly costs are platform estimates.
- `paver_patio` also fires on "EXISTING PAVERS TO REMAIN" (no negation) → possible false quantity.
- NCMA TEK / CMHA SRW guide content not verified; seat-wall recipe deferred.
- 10 hazards + 2 safety QA pending human Spanish.
