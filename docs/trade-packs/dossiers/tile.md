# Dossier — `tile` (Tile (Floor / Wall / Shower))

> Wave: w03 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/tile.ts` · Status: draft
> Taxonomy: category `interior` · permit_trade `null` · phase `finishes_interior` · CSI `09 30`

## Scope (2–4 sentences)
Sets ceramic, porcelain, glass and stone tile on floors, walls, kitchen backsplashes and showers:
substrate check, backer board, shower pre-slope + bonded waterproofing + flood test, layout, thinset
setting with full coverage, movement joints, grout, sealer, cleaning and protection. Does NOT run the
shower waste line or valve (plumbing), frame the shower/blocking (framing), or hang drywall (drywall).
No AHJ permit path — the plumbing inspector may witness a shower-pan test under the plumbing permit;
in this pack that is an owner/GC hold point, not a gate.

## Existing coverage reconciled
- Hand recipe: `task-buildout/nopermit.ts` case `tile` (2 steps: prep/waterproof; set & grout) → pack **complements** (`recipes: []`).
- Catalog codes already seeded: `G-TILE-FLOOR-SF`, `G-TILE-SHOWER-SF` (0037). Not redeclared. Hand seed `seedGeneral` emits `G-TILE-FLOOR-SF` = 15% of floor area on a `ceramic_tile` callout.
- Blueprint template tasks hitting this trade: `Common-area tile & flooring` (residential-mf) — served by the hand recipe.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| tile-ufgs-09-30-10 | UFGS 09 30 10 Ceramic, Quarry, and Glass Tiling (Aug 2020) | 1 | public_domain | QA (sequencing, flatness, movement joints, cleaning, protection, 72 h traffic) |
| tile-schluter-shower-hb | Schluter Shower System Installation Handbook (04/2026) | 5 | manufacturer_public | membrane continuity, flood test, slope, coverage %, movement joints at changes of plane |
| tile-laticrete-preslope-pan | LATICRETE HYDRO BAN Pre-Sloped Shower Pans DS-31-0925 | 5 | manufacturer_public | flood test after cure (24 h) |
| tile-schluter-ditra | Schluter DITRA product page / docs | 5 | manufacturer_public | uncoupling membrane concept (assembly) |
| tile-tcna-handbook | TCNA Handbook 2026 | 3/4 | proprietary_ref_only | deflection + method concepts (no values) |
| tile-ansi-a108 | ANSI A108/A118/A136.1 (Jul 2026) | 3 | proprietary_ref_only | coverage / lippage concepts (no values) |
| ecfr-1926-c/d/e/h/i/k/x/z | 29 CFR 1926 | 1 | public_domain | hazards |

## Work steps
Hand recipe kept (complement). No pack recipes.

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| silica_cutting | silica when cutting/grinding tile, stone, backer | 1926.1153(c)(1) (Table 1) | 3 |
| silica_cleanup | dry sweeping / compressed air on silica dust | 1926.1153(f)(1) | 2 |
| cement_skin_burn | wet thinset/grout alkaline burns | 1926.95(a) | 2 |
| chemical_products | epoxy grout, primers, sealers, acid cleaners | 1926.59 | 2 |
| knee_ergonomics | kneeling, bending, troweling | 1926.20(b)(1) | 2 |
| wet_saw_shock | wet saw / mixer shock | 1926.404(b)(1)(ii) | 3 |
| grinder_guard | grinder/saw without guards | 1926.303(b)(1) | 3 |
| material_stacks | tile boxes, slabs, board tip-over | 1926.250(a)(1) | 3 |
| eye_debris | chips, spray, splash | 1926.102(a)(1) | 2 |
| noise | saws/grinders in small rooms | 1926.101(a) | 2 |
| ladder | stepladder top step | 1926.1053(b)(13) | 3 |
| slip_trip | slurry, buckets, cords | 1926.25(a) | 2 |

## QA checklist
15 items — rough-in tested before tile (UFGS 3.2), deflection (TCNA concept), flatness (UFGS 3.1), backer
fastening, membrane continuity (safety), flood test 24 h (safety; Schluter + Laticrete), slope to drain,
layout, mortar coverage ~80/95 % (Schluter citing A108.5), lippage (concept), movement joints, grout,
grout cure before sealer, tap test, floor protection 72 h.

## Inspection / acceptance checkpoints (descriptive keys — no permit family)
- `substrate_check`: rough-in tested, substrate flat/clean, backer type + fastening.
- `waterproofing_flood_test`: membrane cured, drain plugged + level marked + commonly 24 h hold, no drop/leak, photo + sign-off.
- `final_walkthrough`: pattern/colors, movement joints, shower runs to drain, clean + defects replaced.

## Cost basis (all `platform-baseline`, confidence `estimate`, 2026 national)
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % |
|---|---|---|---|---|---|---|
| G-TL-PAN-WP-SF | Shower floor pre-slope + bonded membrane | SF | 450 | 0.15 | 0 | 10 |
| G-TL-LINDRAIN-EA | Linear drain set + waterproofed | EA | 32000 | 3.0 | 0 | 0 |
| G-TL-BKSPL-SF | Kitchen backsplash tile | SF | 650 | 0.11 | 0 | 12 |
| G-TL-UNCPL-SF | Uncoupling membrane adder | SF | 180 | 0.025 | 0 | 10 |
| G-TL-LFT-SF | Large-format surcharge | SF | 60 | 0.03 | 0 | 5 |
| G-TL-TRIM-LF | Metal edge/transition trim | LF | 450 | 0.05 | 0 | 10 |

## Quantity rules
- `G-TL-UNCPL-SF` = area_sf_sum × 0.15 (ceil) on `ceramic_tile` — matches the hand seed's tiled-floor share.
- `G-TL-BKSPL-SF` = const 30 on `ceramic_tile` + residential_sf.
- `G-TL-PAN-WP-SF` = const 15 on `ceramic_tile` + residential_sf.

## Blueprint callouts (components)
None this wave (core `ceramic_tile` already exists).

## Open questions → REVIEW_QUEUE
- Brief named UFGS 09 30 13; UFGS publishes tile as 09 30 10 — cited that.
- Mapei handbook URLs 403 to scripts (non-gov) — not cited.
- All 6 assembly costs are estimates.
- Equipment vocab has no wet saw / mixer — propose `tile_wet_saw` if equipment recs are wanted.
- 12 hazards + 2 safety QA + 3 flood-test checklist items pending human ES.
