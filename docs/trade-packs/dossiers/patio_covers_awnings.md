# Dossier — `patio_covers_awnings` (Patio Covers / Pergolas / Awnings / Sunrooms)

> Wave: w04 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/patio_covers_awnings.ts` · Status: draft
> Taxonomy: category `envelope` · permit_trade `building` · phase `finishes_exterior` · CSI `10 73`

## Scope (2–4 sentences)
Open-sided roofs over outdoor living space — attached or freestanding aluminum/wood patio covers, carports,
pergolas — plus screen rooms / three-season enclosures and wall-mounted retractable awnings. Covers post
footings, ledger/header to the house, posts, beams, rafters/panels, uplift connectors, drainage and enclosure
panels. Does NOT cover: fan/light wiring (electrician, electrical permit), gutters as a separate scope
(`gutters`), the slab/deck below (`concrete_flatwork`, `decks`), or heated four-season sunrooms (a house
addition — framing/insulation/energy scope).

## Existing coverage reconciled
- Hand recipe: none → pack is the NEW-TRADE pattern (3 recipes).
- Catalog codes already seeded and reused: `B-DECK-FOOTING-EA`, `B-DECK-LEDGER-LF` (0048). New: `B-PCA-*`.
- Blueprint template tasks hitting this trade: none.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| icc-pa | IRC App. H / AH (patio covers) AH101–AH106, R301.2, R403.1.4, R507, R308, R310, R703.4 | 3 | proprietary_ref_only | code refs (section + paraphrase) |
| patio_covers_awnings-icces-esr4436 | ICC-ES ESR-4436 (Alumi-Cover patio covers / carports) | 4 | association_public | open-side rule, 10 psf min live load, 750 lbf slab-column limit, load decal, host-structure adequacy |
| patio_covers_awnings-simpson-c-c-2026 | Simpson Wood Construction Connectors catalog C-C-2026 | 5 | manufacturer_public | post bases / caps / uplift ties concept |
| simpson-deckcode | Simpson F-DECKCODE | 5 | manufacturer_public | ledger-into-framing practice |
| patio_covers_awnings-wi-sps321 | WI SPS 321 (UDC) | 1 | gov_open | 321.02 snow-load zone map, 321.16 frost protection (≥48 in.) |
| ecfr-1926-m / -x / -p / -k / -i / -c / -e | 29 CFR 1926 | 1 | public_domain | hazards |

## Work steps (draft → pack recipes)
- `attached_patio_cover` (patio/porch cover, covered patio, carport): footings [footing] → ledger + flashing →
  posts/beam/uplift [framing] → rafters/panels + drainage → electrical by electrician + final [final].
- `freestanding_pergola` (pergola/arbor/gazebo/trellis): footings [footing] → set/brace posts → beams,
  rafters, connectors [framing] → finish + final [final].
- `screen_room_enclosure` (sunroom/screen room/three-season): verify base [footing] → anchor walls/roof
  [framing] → screens/panels/glass + door → egress, drainage, final [final].

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| fall_edge | Fall from roof edge / cover | 1926.501(b)(13) | 4 |
| ladder | Ladder slip/overreach | 1926.1053 | 3 |
| struck_utility | Buried utilities at footings | 1926.651(b)(1) | 4 |
| overhead_power | Tall posts/beams contact service drop | 1926.416(a)(1) | 4 |
| power_tool | Saw kickback, auger torque | 1926.300(b) | 3 |
| cord_shock | Outdoor cords | 1926.404(b)(1) | 3 |
| heavy_lift | Beams/posts overhead | 1926.20(b) | 2 |
| sharp_edges | Panel edges | 1926.95(a) | 2 |
| eye_chips | Overhead drilling chips | 1926.102(a)(1) | 2 |
| glass_handling | Large glass/clear panels | 1926.95(a) | 3 |

## QA checklist
16 items: frost depth, footing size per plan, ledger into framing (not siding/veneer), ledger flashing, load
rating matches local snow/wind, uplift connectors, posts plumb/braced, cut ends sealed, slope, downspout
discharge, egress windows kept open, four-season = addition, safety glazing, door operates, electrical by
electrician, load decal.

## Inspection / acceptance checkpoints
- footing: depth/size before pour; post base ready.
- framing: ledger fastening + flashing; member sizes vs plan for snow/wind; all ties fastened.
- final: sides open / allowed enclosure; egress not blocked; drainage + decal.

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| B-PCA-ALUM-SF | Attached aluminum cover | SF | 1800 | 0.12 | 0 | 3 | platform-baseline estimate |
| B-PCA-INSUL-SF | Insulated-panel cover | SF | 3000 | 0.15 | 0 | 3 | estimate |
| B-PCA-PERGOLA-WOOD-SF | Wood pergola | SF | 1400 | 0.25 | 0 | 10 | estimate |
| B-PCA-SCREEN-RM-SF | Screen / three-season room | SF | 3500 | 0.4 | 0 | 3 | estimate |
| B-PCA-AWNING-EA | Retractable awning ~12 ft | EA | 220000 | 6 | 0 | 0 | estimate |

## Quantity rules
- `B-PCA-ALUM-SF` = component `patio_cover` × 240; `B-DECK-FOOTING-EA` × 3; `B-DECK-LEDGER-LF` × 20.
- `B-PCA-PERGOLA-WOOD-SF` = component `pergola` × 144; `B-DECK-FOOTING-EA` × 4 (if no patio cover/deck rule already seeded footings — seeding dedups by code).

## Blueprint callouts (components)
- `patio_cover` — `\bPATIO\s+COVER\b` — "NEW 12'x20' ALUMINUM PATIO COVER"
- `pergola` — `\bPERGOLA\b` — "CEDAR PERGOLA ABOVE PATIO"
- "COVERED PATIO" intentionally excluded: usually a room label under the main roof (would double-count roof).

## Open questions → REVIEW_QUEUE
- 2024 IRC renumbered the patio-cover appendix to BF (2021 = AH, 2018 = App. H); refs use AH10x.
- No retractable-awning recipe (target 1–3 recipes); awning tasks fall to the family generic steps.
- Alumawood / Four Seasons / Duo-Gard install guides not publicly downloadable — ICC-ES ESR-4436 used instead.
- All costs platform-baseline estimates.
