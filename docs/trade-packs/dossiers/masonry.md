# Dossier — `masonry` (Masonry (Brick / Block / Stone))

> Wave: w08 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/masonry.ts` · Status: draft
> Taxonomy: category `concrete_masonry` · permit_trade `building` · phase `framing` · CSI `04 20`

## Scope (2–4 sentences)
Lays brick, concrete block (CMU) and stone: structural and foundation block walls (with joint
reinforcement, rebar and grout), anchored brick/stone veneer over framed or block backing, adhered
manufactured stone, lintels over openings, through-wall flashing and weeps, cold-weather protection
and final cleaning. Hand-offs: footings/slabs to `concrete`, rebar fabrication to `rebar`, scaffold
erection to `scaffolding`, WRB/windows to `air_barrier`/`windows`, sealant joints to `caulking_sealants`,
chimneys to `chimney`.

## Existing coverage reconciled
- Hand recipe: `lib/task-buildout/building.ts` masonry branch (Lay masonry units — R606; Flash, anchor &
  weep veneer — R703.8) → pack **complements** (`recipes: []`, masonry is in `HAND_RECIPE_KEYS`).
- Catalog codes already seeded: `B-CMU-SF`, `B-BRICK-VENEER-SF` (0037); `quantities.ts` already seeds
  `B-BRICK-VENEER-SF` at ≈0.4 SF/SF floor on the `masonry_veneer` component — not duplicated.
- Blueprint template tasks: commercial `Exterior masonry or cladding system` (finishes_exterior, 04 21 13).
- Blueprint component: `masonry_veneer` (parse-sheets.ts) — used to scope the quantity rules.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| masonry-ufgs-04-20-00 | UFGS 04 20 00 Masonry (May 2025) | 1 | public_domain | QA: loads, grout time, cleanouts, lintel bearing, wall-top covering |
| masonry-bia-tn1 | BIA TN 1 Cold and Hot Weather Construction | 4 | association_public | cold-weather QA |
| masonry-bia-tn7b | BIA TN 7B Water Penetration — Construction & Workmanship | 4 | association_public | joints, flashing laps/end dams, weeps 24 in o.c., anchor mortar cover |
| masonry-bia-tn28 | BIA TN 28 Brick Veneer / Wood Stud Walls | 4 | association_public | 1 in air space, ties, 4 in lintel bearing |
| masonry-bia-tn20 | BIA TN 20 Cleaning Brickwork | 4 | association_public | cleaning QA |
| masonry-bia-tn31b | BIA TN 31B Structural Steel Lintels | 4 | association_public | lintel QA |
| masonry-tms-402-602 | TMS 402/602 | 3 | proprietary_ref_only | tolerances (ref only) |
| icc-pa | ICC public access | 3 | proprietary_ref_only | IRC R404.1, R606, R703.8.x, R703.12; IBC 2104, 1705.4 |
| ecfr-1926-q/l/z/e/i/o | 29 CFR 1926 subparts | 1 | public_domain | hazards |

## Work steps
Hand recipe kept (2 steps). No pack recipe.

## Hazards
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| wall_collapse_laz | Wall collapse — limited access zone | 1926.706(a) | 4 |
| wall_bracing | Walls over 8 ft unbraced | 1926.706(b) | 4 |
| rebar_impalement | Protruding dowels | 1926.701(b) | 4 |
| scaffold_fall | Fall from scaffold >10 ft | 1926.451(g)(1) | 4 |
| scaffold_overload | Overloaded scaffold | 1926.451(f)(1) | 4 |
| scaffold_inspect | Uninspected scaffold | 1926.451(f)(3) | 3 |
| falling_objects | Falling units/tools | 1926.451(h)(1) | 3 |
| silica_cutting | Silica when cutting | 1926.1153(c)(1) | 3 |
| cement_burns | Wet mortar burns | 1926.95(a) | 2 |
| mixer_guard | Mortar mixer | 1926.300(b)(1) | 3 |
| forklift | Forklift/telehandler | 1926.602(d) | 4 |
| eye_chips | Flying chips | 1926.102(a)(1) | 2 |

## QA checklist
15 items (1 safety: wall bracing / LAZ / early loading). See pack.

## Inspection / acceptance checkpoints
- framing: pre-grout rebar, cleanouts, bond beams/lintels, special inspection reports (IBC 1705.4)
- sheathing: WRB, flashing + end dams, ties + weeps, lintels (R703.8.x)
- final: weeps open, sealant joints, cleaning

## Cost basis
| Code | Item | Unit | Mat ¢ | Lab hr | Eq ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| B-MAS-STONE-ADH-SF | Adhered manufactured stone | SF | 950 | 0.12 | 0 | 10 | platform-baseline estimate |
| B-MAS-FLASH-WEEP-LF | Through-wall flashing + weeps | LF | 450 | 0.06 | 0 | 10 | estimate |
| B-MAS-LINTEL-EA | Steel angle lintel ≤6 ft | EA | 9000 | 0.75 | 0 | 0 | estimate (steel volatile) |
| B-MAS-COLD-WX-SF | Cold-weather protection | SF | 60 | 0.01 | 40 | 0 | estimate |
| B-MAS-CLEAN-SF | Final cleaning | SF | 15 | 0.012 | 5 | 0 | estimate |

## Quantity rules
- `B-MAS-LINTEL-EA` = windows × 1 (masonry_veneer)
- `B-MAS-FLASH-WEEP-LF` = const × 160 (masonry_veneer)
- `B-MAS-CLEAN-SF` = area_sf_sum × 0.4 (masonry_veneer; matches the veneer seed)

## Blueprint callouts (components)
None new (existing `masonry_veneer` reused).

## Open questions → REVIEW_QUEUE
- All 5 costs are estimates.
- NCMA TEK URLs (ncma.org/resource/…) now redirect to the CMHA home page — TEK notes not cited.
- No `mast_climber` / masonry-saw equipment vocab; used telehandler/forklift/material_hoist.
- Pack code refs only surface on steps that gate an inspection; the hand recipe's steps gate none.
