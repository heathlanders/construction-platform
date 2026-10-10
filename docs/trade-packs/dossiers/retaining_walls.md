# Dossier — `retaining_walls` (Retaining Walls)

> Wave: w06 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/retaining_walls.ts` · Status: draft
> Taxonomy: category `sitework` · permit_trade `building` · phase `sitework` · CSI `32 32`

## Scope (2–4 sentences)
Segmental concrete block retaining walls (SRW — gravity and geogrid-reinforced) and boulder / stacked-stone
landscape walls: layout, base trench, compacted leveling pad, buried first course, drainage stone + toe drain,
geogrid, compacted backfill, caps, guard at the top. Does NOT cover pavers or low patio seat walls
(`hardscape_pavers`, which owns `G-HSP-SEATWALL-LF`), cast-in-place concrete walls (`concrete`), or wall
engineering itself (`engineering` — this pack only flags when a stamped design is needed).

## Existing coverage reconciled
- Hand recipe: none (not in `HAND_RECIPE_KEYS`) → NEW-TRADE pattern, 2 recipes with `example_title`.
- Catalog codes already seeded: none for retaining walls (`B-AGG-BASE-SY`, `B-FLAT-DRAIN-LF` are flatwork;
  `G-HSP-SEATWALL-LF` is hardscape). No reuse needed — no quantity rules this wave.
- Blueprint template tasks hitting this trade: none (0 template tasks).

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| retaining_walls-ufgs-32-32-23-13 | UFGS 32 32 23.13 Segmental Concrete Block Retaining Wall (Feb 2020) | 1 | public_domain | steps, QA numbers, tolerances, inspection items |
| retaining_walls-fhwa-nhi-10-024 | FHWA-NHI-10-024 MSE Walls and RSS, Vol. I | 1 | public_domain | geogrid placement QA (with UFGS) |
| retaining_walls-cmha-srw-best-practices | CMHA (NCMA) SRW Best Practices Guide | 4 | association_public | engineered-design triggers (tiered, surcharge, global stability), embedment |
| retaining_walls-cmha-srw-design-manual | CMHA (NCMA) Design Manual for SRWs, 3rd Ed. | 4 | proprietary_ref_only | concept only |
| retaining_walls-ab-commercial-manual | Allan Block Commercial Installation Manual | 5 | manufacturer_public | trench width, pad depth, embedment rule, wall-rock zone, toe drain, lifts, 3 ft zone, shims, caps |
| icc-pa | ICC public access | 3 | proprietary_ref_only | IRC R105.2, R404.4, R312.1.1 (concept); IBC 1807.2 |
| ecfr-1926-c/d/m/o/p/z | 29 CFR 1926 | 1 | public_domain | hazards |
| platform-baseline | — | — | platform_estimate | all costs |

## Work steps (draft → pack recipes)
**srw_block_wall** (title_re: retaining wall / segmental wall / SRW / modular block wall / geogrid / brand names)
1. Confirm design, permit and locates — R105.2, R404.4, IBC 1807.2.
2. Excavate base trench and reinforced zone.
3. Build and compact leveling pad — gate **footing**.
4. Set and level the buried first course.
5. Drain pipe, wall rock, compacted backfill.
6. Stack courses, place geogrid.
7. Caps, finish grade, guard — gate **final**.

**boulder_landscape_wall** (priority 10; boulder / rock wall / stacked stone / landscape wall / armor stone)
1. Height limits, design, locates. 2. Excavate + compacted base — **footing**. 3. Set boulders + drainage stone.
4. Finish grade, guard, walk the wall — **final**.

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| excavation_cave_in | Cave-in of cut / trench | 1926.652(a)(1) | 4 |
| spoil_at_edge | Spoil/materials into trench | 1926.651(j)(2) | 3 |
| utility_strike | Buried utility strike | 1926.651(b)(1) | 4 |
| water_in_trench | Water accumulation | 1926.651(h)(1) | 3 |
| block_handling | Heavy block / stone handling (training) | 1926.21(b)(2) | 2 |
| equipment_backing | Backing equipment, no reverse alarm | 1926.602(a)(9)(ii) | 4 |
| struck_by_machine | Raised bucket / swinging boulder | 1926.600(a)(3)(i) | 4 |
| silica_cutting | Silica when cutting block/caps | 1926.1153(c)(1) | 3 |
| compactor_noise | Noise | 1926.52(d)(1) | 2 |
| fall_from_wall_top | Fall from top of tall wall / cut edge | 1926.501(b)(1) | 3 |

## QA checklist
15 items: engineered design (safety), 811 ticket (safety), trench ≥24 in., pad ≥6 in. in ≤6 in. lifts, embedment
≥6 in. or 1 in./ft, wall rock 12 in. behind, toe drain to daylight, geogrid orientation/taut/no splice/6 in. cover,
lifts ≤ one course / 95% SP, plate-only within 3 ft, setback + tolerances (3 in. line, 0.1 ft elev, 1 1/4 in./10 ft,
2° batter, shims ≤1/8 in.), joints offset ≥4 in. / gaps ≤1/8 in., caps glued, top drainage, guard at drop (safety).

## Inspection / acceptance checkpoints
- footing: design + permit on site, trench, pad compaction, drain route.
- final: alignment/setback, drain outlets flowing, caps, guard, engineer letter / compaction records.

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| B-RTW-SRW-SF | SRW gravity wall, per face SF | SF | 1600 | 0.35 | 150 | 5 | estimate |
| B-RTW-GEOGRID-SY | Geogrid placed | SY | 300 | 0.03 | 0 | 10 | estimate |
| B-RTW-DRAIN-LF | 4 in. toe drain + outlets | LF | 350 | 0.05 | 0 | 5 | estimate |
| B-RTW-CAP-LF | Caps glued | LF | 1100 | 0.08 | 20 | 7 | estimate |
| B-RTW-BOULDER-SF | Boulder wall, per face SF | SF | 1400 | 0.20 | 500 | 5 | estimate |
| B-RTW-ENGDESIGN-EA | Engineered design + stamped drawings | EA | 150000 | 1 | 0 | 0 | estimate |
WisDOT bid item SPV.0165.03 (Wall Modular Block MSE, SF) exists, but no average unit price was found in time —
candidate to move B-RTW-SRW-SF to `derived` later.

## Quantity rules
- None. There is no blueprint component token for retaining walls yet, and a `const` would guess scope.

## Blueprint callouts (components)
- Proposed (not added — wave rule "no components"): token `retaining_wall`, regex `RETAINING WALL|SEGMENTAL WALL|\bSRW\b`.
  ⚠️ The CJPIA commercial fixture contains general notes "STANDARD RETAINING WALL DETAILS… A SEPARATE RETAINING WALL
  PERMIT IS REQUIRED" — adding the token would add an augment task to that fixture and change its snapshot/count.
  Needs an `(?<!STANDARD )` / note-context guard and a snapshot update in its own PR.

## Open questions → REVIEW_QUEUE
- Spanish for 10 hazards + 3 safety QA pending human translation.
- All 6 costs are platform estimates.
- Guard-at-drop QA borrows IRC R312.1.1 concept — applicability to site walls is AHJ-dependent.
- Component token deferred (fixture collision above).
