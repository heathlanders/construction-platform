# Dossier — `metal_decking` (Metal Decking)

> Wave: w11 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/metal_decking.ts` · Status: draft
> Taxonomy: category `structural` · permit_trade `building` · phase `framing` · CSI `05 30`

## Scope (2–4 sentences)
Lands, spreads and attaches steel roof deck and composite floor deck on structural steel and steel joists,
including sidelap fastening, pour stop and closures, deck at openings and covers, and through-deck shear
stud welding with field testing. Does NOT erect the steel frame or joists (`structural_steel`), place the
concrete topping (`concrete`), or install roof insulation/membrane (`roofing`). Fireproofing of the deck
underside is `fireproofing`.

## Existing coverage reconciled
- Hand recipe: none (not in `HAND_RECIPE_KEYS`) → NEW-TRADE pattern, two recipes.
- Catalog codes already seeded: none for steel deck. `B-DECK-*` belongs to residential wood decks, so this
  pack uses prefix `B-MDK-`. `B-ROOF-SF` (roof cover) is the membrane, not the substrate — no overlap.
- Blueprint template tasks: `commercial.ts` "Metal deck & shear connections" (phase framing) — matched by
  `composite_deck_shear_studs` (`title_re` hits "metal deck" and "shear connect").

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| metal_decking-ufgs-05-30-00 | UFGS 05 30 00 Steel Decks (May 2015, Chg 2 08/18) | 1 | public_domain | steps, QA (Part 3 + 3.9 field QC) |
| ecfr-1926-r | 29 CFR 1926 Subpart R — Steel Erection | 1 | public_domain | §1926.753(d), .754(c)(e), .757(e)(4), .760(a)(c) |
| ecfr-1926-j | 29 CFR 1926 Subpart J — Welding and Cutting | 1 | public_domain | §1926.351(d), .352(a), .353(e)(2) |
| ecfr-1926-i | 29 CFR 1926 Subpart I — Tools | 1 | public_domain | §1926.302(e) powder-actuated tools |
| ecfr-1926-e | 29 CFR 1926 Subpart E — PPE | 1 | public_domain | §1926.95(a) |
| metal_decking-sdi | SDI standards (C, NC, RD, QA/QC, MOC) | 4 | proprietary_ref_only | named only (site 403 to scripts) |
| metal_decking-aws | AWS D1.1 / D1.3 | 3 | proprietary_ref_only | named only |
| icc-pa | IBC 2210, 1705.2, 1705.2.2 | 3 | proprietary_ref_only | code refs |
| platform-baseline | — | — | platform_estimate | all costs |

## Work steps (draft → pack recipes)
`composite_deck_shear_studs` (example "Metal deck & shear connections"):
1. **Check the steel and land the deck bundles** — 1926.754(e)(1), .757(e)(4). QA: bundles_landed_supported.
2. **Spread, align and safety-attach the sheets** — CDZ per 1926.760(c); ends over supports, ≥3 spans; secure end of shift. QA: ends_over_supports, three_span, secured_end_of_shift.
3. **Make the permanent deck and sidelap attachments** — attachment schedule; AWS D1.3 welders; IBC 2210. QA: attach_pattern, weld_quality, sidelaps.
4. **Set pour stop, closures and deck at openings** — 1926.754(e)(2)–(4), perimeter cables .760(a)(2). QA: pour_stop, openings_covered, perimeter_cables.
5. **Weld shear studs and bend-test them** — after deck, outside CDZ (1926.754(c)(2)); UFGS 3.9.1. QA: stud_layout, stud_flash_bend.
6. **Touch up and pass the pre-pour deck inspection** — Gate: framing. Code: IBC 1705.2, 1705.2.2. QA: touch_up, no_damage_deflection.

`roof_deck` (example "Install metal roof deck", priority 10): land + spread · attach + sidelaps (IBC 2210) ·
openings/sump pans/closures · touch-up + straightedge flatness (gate framing, IBC 1705.2.2).

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| fall_leading_edge | Fall >15 ft from deck edge | 1926.760(a)(1) | 4 |
| cdz | CDZ fall / slide | 1926.760(c)(5) | 4 |
| hole_opening | Fall through opening / column gap | 1926.754(e)(3)(i) | 4 |
| deck_displacement | Loose sheets sliding / blowing off | 1926.754(e)(5)(i) | 4 |
| bundle_landing | Overload / tipping landing bundles on joists | 1926.757(e)(4) | 4 |
| suspended_load | Struck by hoisted bundle | 1926.753(d)(1) | 4 |
| trip_studs | Trip on shear studs | 1926.754(c)(1) | 3 |
| weld_shock | Welding shock | 1926.351(d)(3) | 3 |
| arc_eye | Arc flash eyes/skin | 1926.353(e)(2) | 2 |
| weld_fire | Sparks/slag fire | 1926.352(a) | 3 |
| paf | Powder-actuated tool | 1926.302(e)(1) | 3 |
| cut_edge | Sharp deck edges | 1926.95(a) | 2 |

## QA checklist
15 items (4 safety, ES pending): bundles landed on supported framing; ends over supports; ≥3 spans; attachment
pattern; weld quality; sidelaps; secured end of shift; openings covered/marked; perimeter cables; pour stop;
stud layout; stud 360° flash + bend test; touch-up; no damage/deflection before pour; roof straightedge flatness.

## Inspection / acceptance checkpoints
- framing: deck attachment + special inspector deck report (1705.2.2); studs count/flash/bend tests (1705.2);
  pour stop/closures/opening reinforcement before pour; openings covered, perimeter cables.

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| B-MDK-ROOF-SF | 1-1/2 in. galv roof deck 20–22 ga | SF | 275 | 0.018 | 12 | 5 | platform-baseline, estimate |
| B-MDK-FLOOR-SF | 2–3 in. composite floor deck 20 ga | SF | 350 | 0.022 | 15 | 5 | platform-baseline, estimate |
| B-MDK-STUD-EA | 3/4 in. headed shear stud through deck | EA | 160 | 0.03 | 40 | 3 | platform-baseline, estimate |
| B-MDK-POURSTOP-LF | Galv bent-plate pour stop | LF | 450 | 0.06 | 0 | 5 | platform-baseline, estimate |
| B-MDK-OPENING-EA | Deck opening cut + reinforcement + cover | EA | 6500 | 1.5 | 0 | 5 | platform-baseline, estimate |

## Quantity rules
- `B-MDK-ROOF-SF` = area_sf_sum × 1.05 (industrial, single-story assumed)
- `B-MDK-ROOF-SF` = area_sf_sum × 0.525 (commercial, two stories assumed)
- `B-MDK-FLOOR-SF` = area_sf_sum × 0.5 (commercial, two stories assumed — ground floor slab-on-grade)
- `B-MDK-STUD-EA` = area_sf_sum × 0.125 (commercial — ≈1 stud / 4 SF of floor deck; replace with beam schedule)

## Blueprint callouts (components)
- None this wave.

## Open questions → REVIEW_QUEUE
- IBC 1705.2.2 (cold-formed steel deck special inspection per SDI QA/QC) and 2210 section numbers from
  IBC 2018/2021 memory — ICC site not script-readable; verify against the adopted edition.
- SDI publications: sdi.org returns 403 to scripts; couldn't confirm which manuals are free.
- All costs are platform estimates; quantity rules assume story counts the facts don't carry.
