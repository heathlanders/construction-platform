# Dossier — `curtain_wall` (Curtain Wall / Storefront)

> Wave: w10 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/curtain_wall.ts` · Status: draft
> Taxonomy: category `envelope` · permit_trade `building` · phase `finishes_exterior` · CSI `08 44`

## Scope (2–4 sentences)
Aluminum-framed glass walls on commercial / multifamily buildings: stick-built curtain wall, factory unitized
curtain wall, storefront framing and aluminum entrance doors. Covers shop drawings and anchor layout, embed
verification, frame erection or unit hoisting, glazing (pressure plate or structural silicone), perimeter
transition to the wall air barrier, field water testing and final hardware adjustment. Hands off: embeds cast by
concrete / steel trades, wall air barrier (`air_barrier`), loose glass and mirrors (`glazing`), residential
windows (`windows`), door hardware beyond the entrance package (`doors_hardware`).

## Existing coverage reconciled
- Hand recipe: none (not in `HAND_RECIPE_KEYS`) → NEW-TRADE pattern, two recipes.
- Catalog codes already seeded: none `B-CW-*`. Checked `B-EXTDR-*` (exterior_doors — residential patio /
  storm / garage / sill pan / lockset) and `B-WIN-*` / `B-WINDOW` — no overlap with commercial storefront /
  curtain wall SF or aluminum entrance pairs.
- Blueprint template tasks: `commercial.ts` "Curtain wall & storefront glazing" (finishes_exterior) → matched by
  `curtain_wall_system` (`\bcurtain[ -]?walls?\b`). `storefront_entrance` handles storefront/entrance titles
  without "curtain".

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| curtain_wall-ufgs-08-44-00 | UFGS 08 44 00 Curtain Wall and Glazed Assemblies (05/2019) | 1 | public_domain | steps, tolerances, isolation, weeps, sealant window, field water test (AAMA 501.2 named) |
| curtain_wall-ufgs-08-41-13 | UFGS 08 41 13 Aluminum-Framed Entrances and Storefronts | 1 | public_domain | storefront steps, thresholds in mastic, hardware adjust |
| caulking_sealants-ufgs-07-92-00 | UFGS 07 92 00 Joint Sealants | 1 | public_domain | joint prep QA |
| air_barrier-ufgs-07-27-10 | UFGS 07 27 10 Building Air Barrier System | 1 | public_domain | perimeter tie-in QA |
| ecfr-1926-m/l/cc/h/e/z/i/j/d | 29 CFR 1926 subparts | 1 | public_domain | hazards |
| icc-pa | ICC IBC / IECC | 3 | proprietary_ref_only | code refs (section + paraphrase) |
| platform-baseline | The Jobsite baseline | — | platform_estimate | costs, two QA items |

Note: UFGS 08 44 13 is not published as a PDF on WBDG (403/404); 08 44 00 is the live curtain wall section.
FGIA/AAMA (fgiaonline.org) blocks automated fetch (403) — AAMA 501.2 is named only via UFGS, not cited as a source.

## Work steps (draft → pack recipes)
`curtain_wall_system`: 1 shop drawings + anchor layout → 2 embed survey → 3 anchors + erect / hoist units →
4 glaze → 5 perimeter tie-in + field water test (gate `sheathing`; IBC 1404.4, IECC C402.5) →
6 adjust, labels, clean (gate `final`; IBC 2406, IECC C402.4).
`storefront_entrance`: verify opening → sill flashing + frame → glaze + doors → perimeter seal (`sheathing`) →
adjust + glazing check (`final`).
Gate choice: no framing gate — anchorage is engineered/special-inspected, not part of the AHJ framing walk.
`sheathing` is the envelope/WRB milestone in our 7-step building sequence (same choice as metal_panels, w09).

## Hazards (draft → pack hazards)
slab_edge 1926.501(b)(1) · falling_objects 1926.501(c) · aerial_lift 1926.453(b)(2)(v) · scaffold_fall
1926.451(g)(1) · crane_swing 1926.1424(a) · suspended_load 1926.1425(b) · rigging 1926.251(a)(1) · glass_cut
1926.95(a) · silica_drill 1926.1153(c)(1) · pat_tool 1926.302(e) · hot_work 1926.352(a) · chem_sealant 1926.59.

## QA checklist
15 items; safety: anchors_locked, setting_blocks_bite, ssg_adhesion, safety_glazing_mark (ES pending).

## Inspection / acceptance checkpoints
- sheathing: perimeter membrane lapped to air barrier; sill receptors with end dams; water test reports.
- final: safety-glazing marks; fenestration labels vs energy docs; 1709.5 product approvals; entrance door operation.

## Cost basis (all `estimate`, platform-baseline, national 2026)
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % |
|---|---|---|---|---|---|---|
| B-CW-STOREFRONT-SF | storefront + 1 in. IGU | SF | 4500 | 0.25 | 0 | 3 |
| B-CW-STICK-SF | stick curtain wall | SF | 7000 | 0.35 | 300 | 3 |
| B-CW-UNITIZED-SF | unitized units, hoisted | SF | 11000 | 0.12 | 800 | 1 |
| B-CW-ENTR-PAIR-EA | aluminum entrance pair + hardware | EA | 750000 | 12 | 0 | 0 |
| B-CW-WATERTEST-EA | field water spray test (agency fee as equipment) | EA | 0 | 4 | 120000 | 0 |

## Quantity rules
- `B-CW-WATERTEST-EA` = const × 2 (commercial, industrial)
- `B-CW-ENTR-PAIR-EA` = const × 1 (commercial)
- No SF rule — blueprint facts carry no glazed-facade area; SF lines come from takeoff.

## Blueprint callouts (components)
- none this wave.

## Open questions → REVIEW_QUEUE
- IBC section numbering (1404.4, 1402.2, 1709.5) varies by edition — verify against the adopted IBC.
- Costs all estimates; unitized and entrance-pair prices vary widely by system.
- Gate choice `sheathing` for perimeter/air-barrier tie-in (no dedicated envelope inspection type).
