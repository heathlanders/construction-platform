# Dossier — `excavation` (Excavation / Earthwork / Grading)

> Wave: w06 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/excavation.ts` · Status: draft
> Taxonomy: category `sitework` · permit_trade `building` · phase `site_prep` · CSI `31 23`
> Aliases: earthwork, grading, trenching, rock_excavation, hydro_excavation

## Scope (2–4 sentences)
Clearing/grubbing and topsoil stripping, basement and footing excavation to bearing, utility trenching,
backfill and fill placed and compacted in lifts, and rough + finish grading for drainage. Does NOT
include the pipe/conduit in a trench (site_utilities / plumbing / electrical), erosion-control devices
beyond installing them first (erosion_control), haul-off and disposal pricing (hauling), shoring design
or dewatering systems (shoring_underpinning / dewatering), or seeding/sod (landscaping).

## Existing coverage reconciled
- Hand recipe: none in `HAND_RECIPE_KEYS`. `task-buildout/building.ts` has a generic site-prep branch
  (one step = task title, no code refs) — the pack recipes replace it for this trade (new-trade pattern).
- Catalog codes already seeded: `B-FLAT-EXCAV-SF` (0045, flatwork excavate 6"), `B-AGG-BASE-SY` (0037) —
  referenced from quantity_rules, not redeclared. `G-SITE-DEMO-SF` belongs to demolition.
- Blueprint template tasks (trade_type excavation): "Mass excavation, shoring & dewatering" (commercial),
  "Mass excavation & haul-off" (MF), "Mass grading, excavation & compaction testing" (industrial),
  "Excavation, cut/fill & rough grading" (pole barn), "Site clearing & grubbing" and "Excavation & rough
  grading" (SF). Routing verified: the two "Mass excavation" + SF "Excavation & rough grading" →
  `foundation_excavation_backfill`; the three grading/clearing titles → `site_grading`.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| ecfr-1926-p | 29 CFR 1926 Subpart P — Excavations (+ App. A–F) | 1 | public_domain | hazards, QA, inspection safety item (text read via law.cornell.edu mirror) |
| ecfr-1926-o | 29 CFR 1926 Subpart O — Motor Vehicles, Mechanized Equipment | 1 | public_domain | 1926.600(a)(6), 1926.601(b)(4), 1926.602(a)(9)(ii) |
| excavation-osha-2226 | Trenching and Excavation Safety (OSHA 2226) | 1 | public_domain | competent person, protective systems (context) |
| excavation-osha-trench-pubs | OSHA trenching publications incl. Trench Safety QuickCard (OSHA 3243) | 1 | public_domain | field rules of thumb (5 ft / 4 ft / 25 ft / 2 ft) |
| excavation-ufgs-31-23-00 | UFGS 31 23 00 — Excavation and Fill (Aug 2023) | 1 | public_domain | lifts, moisture, density testing vs max density, bedding, unsuitable material |
| excavation-wisdot-ss-205 | WisDOT SS 205 Roadway and Drainage Excavation | 1 | gov_open | topsoil salvage, remove frozen/unstable material, common vs rock |
| excavation-wisdot-ss-207 | WisDOT SS 207 Embankment | 1 | gov_open | layers ≤ 8 in., no perishable material, don't compact when too wet |
| excavation-wisdot-ss-208 | WisDOT SS 208 Borrow | 1 | gov_open | imported fill approved before placement |
| excavation-wisdot-aup | WisDOT Average Unit Price List (10/21/2025) | 2 | gov_open | 205.0100, 205.0200, 209.2100 unit prices |
| excavation-diggers-hotline | Wisconsin Digger's Hotline (811) | 4 | association_public | locate before digging |
| icc-pa | ICC public access (IRC) | 3 | proprietary_ref_only | R401.3, R403.1, R403.1.4, R404.1.7, R405.1, R406.1 |
| platform-baseline | Platform cost baseline | — | platform_estimate | costs without a public basis |

## Work steps (draft → pack recipes)
**foundation_excavation_backfill** (`\bexcavat|basement|dig|over-dig|backfill`, priority 5)
1. Locate utilities and check the soils data — 811, hand-expose, soils report, survey stakes, erosion first.
2. Strip topsoil and dig to bearing — over-dig, protective system ≥ 5 ft, spoil 2 ft, egress at 4 ft.
3. Ready the bottom for the footing inspection — undisturbed soil/engineered fill, frost depth. Gate: `footing`. Code: R403.1, R403.1.4.
4. Backfill in lifts after walls are inspected and braced — Code: R404.1.7 (foundation-inspection dependency is a QA item + foundation checklist, not a gate).
5. Rough grade away from the foundation.

**site_grading** (`cut/fill|clearing|grubbing|mass grading|finish/fine/final grad|topsoil|strip sod/topsoil`, priority 8)
1. Locate, stake and set controls · 2. Clear, grub and strip topsoil · 3. Cut and fill in compacted lifts ·
4. Finish grade, spread topsoil and stabilize — Gate: `final`. Code: R401.3.

**utility_trench** (`trench|utility line/excavat/trench|lateral|service line`, priority 20)
1. Locate lines and plan the trench · 2. Dig the trench to line and grade · 3. Bed, backfill and compact.

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| utility_strike | Striking buried lines | 1926.651(b)(1) | 4 |
| cave_in | Cave-in | 1926.652(a)(1) | 4 |
| trench_egress | No way out of trench ≥ 4 ft | 1926.651(c)(2) | 3 |
| spoil_edge | Spoil/equipment falling in | 1926.651(j)(2) | 3 |
| competent_inspection | Missed signs of failure | 1926.651(k)(1) | 4 |
| haz_atmosphere | Low O2 / toxic / flammable gas | 1926.651(g)(1)(i) | 4 |
| water_accum | Water accumulation | 1926.651(h)(1) | 3 |
| undermining | Undercutting adjacent footing/wall | 1926.651(i)(2) | 4 |
| struck_by_load | Falling loads / loading spillage | 1926.651(e) | 3 |
| earthmoving_backing | Earthmoving/compacting equipment reversing | 1926.602(a)(9)(ii) | 4 |
| truck_backing | Dump truck backing | 1926.601(b)(4) | 4 |
| overhead_lines | Boom/body contacts overhead lines | 1926.600(a)(6) | 4 |
All section texts read 2026-10-08 (LII mirror of eCFR).

## QA checklist
15 items: locates_marked (safety), soil_report_bearing, benchmarks_staked, erosion_first, topsoil_stockpiled,
unsuitable_removed, overdig_not_loose, fill_material_ok, compaction_lifts, backfill_after_inspection,
backfill_clean, trench_bedding, positive_drainage, protective_system (safety), spoil_setback (safety).

## Inspection / acceptance checkpoints
- footing: depth/frost, undisturbed soil or engineered fill, no water/frost, location to stakes, safe entry.
- foundation: dampproofing + drain inspected before backfill (R406.1), walls braced (R404.1.7), clean backfill.
- final: grade away from foundation (R401.3), disturbed areas stabilized.

## Cost basis
WisDOT Average Unit Price List (10/21/2025): 205.0100 Excavation Common $14.47 / $8.65 / $11.74 per CY
(FY23/24/25, avg ≈ $11.62); 205.0200 Excavation Rock $21.83 / $9.84 / $20.71 (avg ≈ $17.46);
209.2100 Backfill Granular Grade 2 $21.27 / $17.36 / $14.50 per CY (avg ≈ $17.71). Highway-scale bids.

| Code | Item | Unit | Mat ¢ | Labor hr | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| B-EXC-BULK-CY | Bulk excavation, common | CY | 0 | 0.05 | 700 | 0 | derived — WisDOT 205.0100 3-yr avg split labor/equip |
| B-EXC-ROCK-CY | Rock excavation, hydraulic hammer | CY | 0 | 0.35 | 5500 | 0 | estimate — WisDOT 205.0200 is a highway floor only |
| B-EXC-TRENCH-LF | Utility trench ≤ 4 ft, bed/backfill/compact | LF | 300 | 0.15 | 400 | 10 | estimate |
| B-EXC-STRUCT-BACKFILL-CY | Granular structural backfill | CY | 1200 | 0.06 | 250 | 15 | derived — WisDOT 209.2100 3-yr avg |
| B-EXC-FINE-GRADE-SF | Finish grading | SF | 0 | 0.003 | 4 | 0 | estimate |
| B-EXC-COMPACT-TEST-EA | Field density test | EA | 0 | 0 | 6500 | 0 | estimate (agency fee in equipment column) |

## Quantity rules
- `B-EXC-BULK-CY` = 550 when `foundation_wall` on residential_sf (basement allowance).
- `B-EXC-STRUCT-BACKFILL-CY` = 140 when `foundation_wall` on residential_sf.
- `B-EXC-FINE-GRADE-SF` = 5,000 const when foundation component on residential_sf.
- `B-EXC-COMPACT-TEST-EA` = 8 const on commercial/industrial.
- `B-FLAT-EXCAV-SF` (existing) = plan floor area when `slab_on_grade`.
- `B-AGG-BASE-SY` (existing) = plan floor area ÷ 9 when `slab_on_grade`.

## Blueprint callouts (components)
None this wave (uses existing `foundation_wall`, `concrete_footing`, `slab_on_grade`).

## Open questions → REVIEW_QUEUE
- IRC section numbers render under IBC on commercial projects (no IBC 1804/1805 refs added).
- slab_on_grade rules use summed room area (same as the hand B-CONCRETE-CY line) — overstates on multi-story plans; and a basement slab overlaps the bulk dig.
- Haul-off left to the `hauling` pack (no B-EXC haul code).
- Equipment vocab lacks `dozer`, `grader`, `roller` (smooth-drum/padfoot), `trench_box`, `vacuum_excavator`.
