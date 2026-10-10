# Dossier — `misc_metals` (Miscellaneous / Ornamental Metals (Rails / Stairs))

> Wave: w11 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/misc_metals.ts` · Status: draft
> Taxonomy: category `structural` · permit_trade `building` · phase `finishes_interior` · CSI `05 50`

## Scope (2–4 sentences)
Fabricates and installs non-frame steel: steel pan / grating stairs, pipe handrails and guardrails,
fixed and ship ladders, bollards, loose lintels, bearing plates and cast-in embeds. Covers shop-drawing
field verification, anchoring (cast-in and post-installed), field welding and touch-up of shop coatings.
Does NOT do the structural frame (`structural_steel`), deck/wood rails (`decks`, `finish_carpentry`),
glass guards (`glazing`), or concrete fill of pans when the contract assigns it to `concrete`.

## Existing coverage reconciled
- Hand recipe: none (not in HAND_RECIPE_KEYS) → NEW-TRADE pattern, 4 recipes.
- Catalog codes already seeded nearby (NOT duplicated): `B-DECK-RAIL-LF`, `B-GLZ-RAIL-LF`,
  `G-FC-HANDRAIL-LF`, `B-MAS-LINTEL-EA`, `B-DECK-STAIR-RISER`.
- Blueprint template tasks hitting this trade: none.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| misc_metals-ufgs-05-50-13 | UFGS 05 50 13 Misc Metal Fabrications (Aug 2024) | 1 | public_domain | steps, QA (verify dims, welds, galv, built-in work, cover plates) |
| misc_metals-ufgs-05-51-00 | UFGS 05 51 00 Metal Stairs (Aug 2023) | 1 | public_domain | stair steps, nosings, touch-up 2 mil |
| misc_metals-ufgs-05-52-00 | UFGS 05 52 00 Metal Railings (Aug 2023) | 1 | public_domain | posts plumb, sleeves + nonshrink grout, brackets |
| misc_metals-ufgs-05-51-33 | UFGS 05 51 33 Metal Ladders (Aug 2024) | 1 | public_domain | clip angles ≤48 in, ends off finished roof |
| plumbing-ada-2010 (reused) | 2010 ADA Standards §505 | 1 | public_domain | handrail height 34–38 in, 1-1/2 in clearance, 12 in top extension |
| ecfr-1926-x / m / j / h / cc / i / z (shared) | 29 CFR 1926 | 1 | public_domain | hazards |
| misc_metals-naamm-stairs, misc_metals-naamm-pipe-rail | NAAMM AMP 510 / AMP 521 | 4 | proprietary_ref_only | terminology only |
| misc_metals-icces-ac193 | ICC-ES AC193 | 3 | proprietary_ref_only | anchors installed per ESR |
| icc-pa | IBC 1011/1014/1015/1607.9/1901.3; IRC R311.7/R311.7.8/R312.1 | 3 | proprietary_ref_only | code refs (section + paraphrase) |
| platform-baseline | Platform cost baseline | — | platform_estimate | all assembly costs |

## Work steps (draft → pack recipes)
- **steel_stairs** (priority 7, `stair|stairway|stringer|pan tread`): field-verify shop drawings → receive/inspect/stage flights → set, plumb, anchor stringers (gate **framing**; IBC 1011, IRC R311.7, IBC 1901.3) → handrails + guards → fill pans, touch up (gate **final**; IBC 1014/1015/1607.9, IRC R311.7.8, ADA 505).
- **rails_guards** (priority 0, misc metal / handrail / guardrail / railing / ornamental / guard): verify → posts + anchors (IBC 1901.3) → fit/fasten rails → heights/openings + touch-up (gate **final**).
- **ladders** (priority 5, `ladder`): verify location/clearances → anchor with clip angles → cage/safety system, touch-up, climb test (gate **final**).
- **embeds_lintels_bollards** (priority 10): verify + deliver built-in items → set embeds in forms → set loose lintels/bearing plates (gate **framing**) → bollards → touch up (gate **final**).

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| stair_open_edge | open stair side before rails | 1926.1052(c)(1) | 4 |
| floor_edge | landing/shaft edge ≥6 ft | 1926.501(b)(1) | 4 |
| temp_rail_removal | removing temp guardrail (200 lb) | 1926.502(b)(3) | 4 |
| pan_stair_traffic | unfilled pans / skeleton stairs | 1926.1052(b)(1) | 3 |
| fixed_ladder_climb | fixed ladder fall protection | 1926.1053(a)(18) | 4 |
| rigging_load | rigging inspected each shift | 1926.251(a)(1) | 3 |
| suspended_load | fall zone of hoisted flight | 1926.1425(b) | 4 |
| weld_fire | combustibles near welding | 1926.352(a) | 3 |
| weld_fume_galv | zinc/coated steel in enclosed spaces | 1926.353(c)(1) | 3 |
| arc_flash | welding screens | 1926.351(e) | 2 |
| drill_silica | drilling concrete for anchors | 1926.1153(c)(1) | 3 |
| grinder | grinder guards | 1926.303(b)(1) | 3 |

All OSHA text verified on law.cornell.edu (2026-10-08).

## QA checklist
15 items — 6 safety (anchors per ESR, stair geometry, temp treads, pan fill/nosings, rail height/continuity, guard height/openings), 9 non-safety translated.

## Inspection / acceptance checkpoints
- framing: stair set + connections, anchors per ESR, temp rails/treads, lintels on full bearing.
- final: handrails (IBC 1014 / ADA 505), guards (IBC 1015), rigidity (1607.9), ladder cage/system, pan fill + touch-up.

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| B-MISC-PAN-STAIR-FLT | Steel pan stair flight ~10 ft rise | EA | 550000 | 16 | 35000 | 0 | estimate |
| B-MISC-PIPE-RAIL-LF | Steel pipe guard/handrail 2-line | LF | 5500 | 0.6 | 0 | 5 | estimate |
| B-MISC-BOLLARD-EA | 6 in. concrete-filled bollard | EA | 45000 | 3 | 5000 | 0 | estimate |
| B-MISC-FIXED-LADDER-EA | Fixed access ladder ~12 ft, no cage | EA | 140000 | 6 | 0 | 0 | estimate |
| B-MISC-EMBED-EA | Embed plate with headed studs | EA | 4500 | 0.5 | 0 | 0 | estimate |

## Quantity rules
- `B-MISC-PAN-STAIR-FLT` = const 2 (commercial / residential_mf / industrial) — two egress flights assumed.
- `B-MISC-PIPE-RAIL-LF` = const 60 (same types) — rail for two flights.
- `B-MISC-BOLLARD-EA` = const 4 (commercial / industrial) — service entrance / pad.

## Blueprint callouts (components)
- None this wave.

## Open questions → REVIEW_QUEUE
- IBC 1607.9 numbering (2021; was 1607.8 in 2018) — confirm against the adopted edition.
- Fixed/ship ladder IBC section (1011.15/1011.16) not cited — unsure of numbering across editions.
- All five assembly costs are platform estimates.
- Const quantity rules (2 flights, 60 LF, 4 bollards) are placeholders until stair/bollard callouts are detectable.
- Spanish safety text pending (12 hazards, 6 QA items, 9 inspection items).
