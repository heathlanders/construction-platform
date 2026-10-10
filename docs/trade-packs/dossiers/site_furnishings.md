# Dossier — `site_furnishings` (Site Furnishings)

> Wave: w19 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/site_furnishings.ts` · Status: draft
> Taxonomy: category `sitework` · permit_trade `null` · phase `sitework` · CSI `32 33`

## Scope (2–4 sentences)
Installs exterior benches, bike racks, trash/recycling receptacles, picnic tables, small prefab shelters and
bollards — surface-anchored to finished paving or set in concrete footings/sleeves/receivers. Does NOT pour the
paving (concrete_flatwork / asphalt_paving / hardscape_pavers), install play equipment (playground_equipment),
signage (signage) or site lighting (electrical). No AHJ permit path → no gating inspections and no code_refs;
owner hold points live in `inspection_checklists` (`layout_ada_clearance`, `anchorage_footing`, `final_acceptance`).

## Existing coverage reconciled
- Hand recipe: none → NEW-TRADE pattern (2 recipes).
- Catalog codes already seeded: `B-MISC-BOLLARD-EA` (misc_metals — fixed 6 in. steel pipe bollard in footing). Not
  redeclared; the new removable-bollard line points to it in its description.
- Blueprint template tasks hitting this trade: none.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| site_furnishings-ufgs-12-93-00 | UFGS 12 93 00 Site Furnishings (2017, Chg 1) | 1 | public_domain | steps, QA (Part 3 3.1–3.10) |
| millwork-access-board-ada (existing) | 2010 ADA Standards text (Access Board) | 1 | public_domain | 226.1, 302, 305.3, 307, 403, 902.3, 903 |
| site_furnishings-ab-protruding | Access Board guide — Protruding Objects | 1 | public_domain | 307 QA |
| site_furnishings-ab-routes | Access Board guide — Accessible Routes | 1 | public_domain | 403 QA |
| site_furnishings-rf-bollard-brochure | Reliance Foundry — Forgot the Bollards? | 5 | manufacturer_public | bollard mount types, frost, utilities |
| site_furnishings-rf-r1009 | Reliance Foundry R-1009-12 crash-rated install | 5 | manufacturer_public | bollard brace/lift/concrete steps |
| site_furnishings-boston-bike-racks | City of Boston bike-rack guidelines | 1 | gov_open | rack placement + clearances (example local rule) |
| site_furnishings-umich-bench | UMich AEC detail SD-SITE-BENCH | 1 | gov_open | bench anchored to pavement, lawn setback |
| ecfr-1926-c/d/e/h/i/k/o/p/z (shared) | 29 CFR 1926 | 1 | public_domain | hazards |

## Work steps (draft → pack recipes)
Recipe `site_furnishings_install` (title_re bench/bike rack/trash/litter/recycl/picnic/shelter/planter/site furnish):
1. **Check grades and lay out locations and clearances** — 36 in. route, 30×48 clear space, play zones, bike-rack clearances.
2. **Locate utilities and mark anchor holes**.
3. **Drill and set anchors** — shrouded drill + HEPA, clean holes, anchor type by substrate, no wood plugs.
4. **Assemble, level and secure each item** — maker parts, plumb/true, isolate dissimilar metals, shelter clip angles.
5. **Test anchorage, clean and hand over** — push/pull test, measure + written report, touch up, restore.

Recipe `bollard_install` (title_re bollard, priority 10):
1. **Lay out bollards and locate utilities** — impact vs decorative decides mount.
2. **Core or excavate the footing** — wet coring, below frost for impact bollards, barricade holes.
3. **Set the post, sleeve or receiver and pour** — brace/plumb, concrete, non-shrink grout, receivers flush.
4. **Finish, test and protect** — cap/cover, prove removable bollards lock, hand over keys.

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| utility_strike | buried line strike | 1926.651(b)(1) | 4 |
| silica_drilling | silica coring/drilling | 1926.1153(c)(1) | 3 |
| open_hole | open footing holes | 1926.651(j)(2) | 2 |
| heavy_lift | lifting furnishings/bollards | 1926.20(b) | 3 |
| material_storage | stacks sliding/rolling | 1926.250(a)(1) | 2 |
| adhesive_chem | epoxy/grout contact | 1926.59 | 2 |
| cement_burn | wet concrete | 1926.28(a) | 2 |
| power_tool | drill/saw kickback | 1926.300(b) | 3 |
| eye_flying | chips/filings | 1926.102(a)(1) | 2 |
| noise | saws/core drills | 1926.101(a) | 2 |
| traffic_struck | drives/parking work | 1926.601(b)(4) | 4 |
| cord_shock | temp power wet | 1926.404(b)(1) | 3 |

## QA checklist
15 items — route width, clear floor space, protruding objects (safety), 903 bench dims, 226/902 dining, play
zones (safety), bike-rack placement/contact, anchors by substrate, plumb/true, dissimilar metals, bollard footing
(safety), sleeve grout, receiver flush (safety), anchorage test (safety), cleanup.

## Inspection / acceptance checkpoints
- `layout_ada_clearance`, `anchorage_footing`, `final_acceptance` (owner hold points; no AHJ inspection).

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| G-SFN-BENCH-SM-EA | 6 ft metal bench, surface mount, F+I | EA | 140000 | 2.5 | 0 | 0 | platform-baseline estimate |
| G-SFN-BIKERACK-EA | inverted-U rack, surface mount | EA | 30000 | 1.25 | 0 | 0 | estimate |
| G-SFN-TRASH-EA | 32 gal steel receptacle | EA | 110000 | 1.5 | 0 | 0 | estimate |
| G-SFN-PICNIC-EA | 6 ft coated-steel picnic table, accessible end | EA | 180000 | 3 | 0 | 0 | estimate |
| G-SFN-BOLLARD-RMV-EA | removable bollard + receiver cored into slab | EA | 75000 | 3 | 4000 | 3 | estimate |

## Quantity rules
- `G-SFN-BENCH-SM-EA` = const 2 (commercial/industrial)
- `G-SFN-BIKERACK-EA` = const 2 (commercial/industrial/residential_mf)
- `G-SFN-TRASH-EA` = const 2 (commercial/industrial)
- `G-SFN-PICNIC-EA` = const 1 (residential_mf)

## Blueprint callouts (components)
- none this wave.

## Open questions → REVIEW_QUEUE
- ADA 903 benches are scoped to locker/dressing rooms; outdoor benches/picnic tables on federal sites follow ABA
  1011 (outdoor developed areas). Pack phrases 903/902 as "where designated accessible" — confirm wording.
- All 5 assembly costs are platform-baseline estimates.
- Bike-rack clearances come from one city (Boston) as an example — owner/AHJ standard governs.
- Vocab: a `core_drill` equipment type would fit better than `generator` for coring steps.
