# Dossier — `toilet_partitions` (Toilet Partitions & Accessories)

> Wave: w16 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/toilet_partitions.ts` · Status: draft
> Taxonomy: category `interior` · permit_trade `null` · phase `finishes_interior` · CSI `10 21`

## Scope (2–4 sentences)
Installs restroom toilet compartments and urinal screens — solid plastic (HDPE), powder-coated / baked-enamel
steel, solid phenolic and stainless — floor-anchored, overhead-braced or ceiling-hung. Lays them out to the 2010 ADA
wheelchair and ambulatory compartment sizes and sets accessible door hardware. Hand-offs: grab bars, dispensers,
mirrors and other accessories → `specialties`; ceiling support steel design/framing → others (GC / misc metals);
wall backing → framing/drywall.

## Existing coverage reconciled
- Hand recipe: none (not in HAND_RECIPE_KEYS) → NEW-TRADE pack recipe `partitions_install`.
- Catalog codes already seeded: none for partitions (`G-TP-*` new).
- Blueprint template tasks: commercial `Restroom accessories, partitions & casework` (finishes_interior, 10 21 00).
  The task bundles accessories; this pack's steps cover partitions and flag accessories to specialties.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| toilet_partitions-ufgs-10-21-13 | UFGS 10 21 13 Toilet Compartments (Aug 2020) | 1 | gov_open | steps, QA, anchors, final adjustment |
| millwork-access-board-ada / plumbing-ada-2010 | 2010 ADA Standards | 1 | public_domain | 213.3.1, 404.2.7, 604.8.1.1/.2/.4, 604.8.2, 605.3 |
| toilet_partitions-bobrick-1540 | Bobrick 1540-69 HPL partition install instructions | 5 | manufacturer_public | backing by others, ceiling anchors before ceiling, headrail seams, cam/keeper, no acid cleaners |
| ecfr-1926-c/e/h/i/k/x/z | 29 CFR 1926 subparts | 1 | gov_open | hazards (1926.1153 Table 1 handheld drills) |

## Work steps (pack recipe `partitions_install`, no gates — permit_trade null)
1. **Verify layout, fixtures and ADA compartment sizes** — 604.8.1.1 60 in. × 56/59 in.; door ≤4 in. from far wall; ambulatory 35–37 × 60 in.
2. **Confirm backing and overhead support steel** — ceiling anchors before finished ceiling.
3. **Lay out and drill anchors** — shrouded drill + vacuum (Table 1); shields ≥2 in. into slab; bracket holes in joints.
4. **Set pilasters, panels and headrail** — plumb/level/centered, ≤1/2 in. wall gap, headrail joints on pilasters, ≥2 fasteners/face.
5. **Hang doors and accessible hardware** — self-closing, pulls both sides, no-tight-grasp latch, emergency lift-off keeper.
6. **Final adjustment, privacy and cleanup** — ≈3/16 in. edge gap, sightline control, touch-up, no acid cleaners.

## Hazards
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| silica_drilling | silica dust drilling concrete/block/tile | 1926.1153(c)(1) | 3 |
| silica_cleanup | dry sweeping drill dust | 1926.1153(f)(1) | 2 |
| panel_handling | heavy panels/doors | 1926.21(b)(2) | 3 |
| panel_storage | leaning/stacked panels falling | 1926.250(a)(1) | 3 |
| ladder_misuse | stepladder top step / misuse | 1926.1053(b)(13) | 3 |
| overhead_load | ceiling-hung support failure | 1926.21(b)(2) | 3 |
| tool_shock | ungrounded tools / cords | 1926.302(a)(1) | 2 |
| eye_dust | chips/shavings | 1926.102(a)(1) | 2 |
| noise | hammer drilling | 1926.101(a) | 2 |
| pinch_points | hinges/door edges | 1926.21(b)(2) | 2 |
| trip_debris | cartons/offcuts | 1926.25(a) | 1 |

## QA checklist
15 items — field verify, ADA wheelchair/ambulatory sizes, door location, backing, ceiling support (safety), anchor rating
(safety), bracket joints, plumb/level/wall gap, headrail joints, self-closing, pulls + latch, emergency access (safety),
door clearance, finish/cleaning.

## Inspection / acceptance checkpoints (owner/GC — no AHJ permit path)
- `layout_verify`, `support_before_ceiling`, `ada_compartment_check`, `final_walkthrough`.

## Cost basis (all `platform-baseline`, confidence estimate)
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % |
|---|---|---|---|---|---|---|
| G-TP-STD-COMP-EA | standard compartment, overhead-braced | EA | 85000 | 3.0 | 0 | 0 |
| G-TP-ADA-COMP-EA | wheelchair compartment | EA | 115000 | 4.0 | 0 | 0 |
| G-TP-AMB-COMP-EA | ambulatory compartment | EA | 95000 | 3.5 | 0 | 0 |
| G-TP-URINAL-SCRN-EA | urinal screen | EA | 30000 | 1.0 | 0 | 0 |
| G-TP-CEIL-STEEL-EA | ceiling-hung support steel, per pilaster | EA | 25000 | 1.5 | 0 | 5 |

## Quantity rules
No toilet/urinal fixture token exists in `FIXTURE_TOKENS`, so commercial-only `const` placeholders:
`G-TP-ADA-COMP-EA` ×2, `G-TP-STD-COMP-EA` ×2, `G-TP-URINAL-SCRN-EA` ×1 — each assumption says to replace from restroom plans.

## Blueprint callouts (components)
None this wave.

## Open questions → REVIEW_QUEUE
- Safety Spanish pending (11 hazards, 3 QA, 3 checklist items).
- All 5 G-TP costs are estimates.
- UFGS 10 21 13.17 page exists but scope not confirmed; Scranton Products / ASI / Hadrian install guides unreachable (403/timeout).
- Add `water_closet` / `urinal` fixture tokens so partition counts can come from plans.
