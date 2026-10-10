# Dossier — `wallcovering` (Wallcovering)

> Wave: w15 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/wallcovering.ts` · Status: draft
> Taxonomy: category `interior` · permit_trade `null` · phase `finishes_interior` · CSI `09 72`

## Scope (2–4 sentences)
Hangs commercial vinyl (Type I/II/III, mostly Type II), residential wallpaper and non-woven papers, wall
liners and printed murals; strips existing wallcovering and preps walls for rehang. Does NOT finish
drywall (drywall trade delivers Level 4/5), paint ceilings/trim (painting), or install FRP panels and wall
protection — corner guards, crash rails, wainscot caps (`specialties`). No AHJ permit path: hold points
are owner/GC checkpoints; interior-finish flame class (IBC 803) is a product-label check only.

## Existing coverage reconciled
- Hand recipe: none (not in `HAND_RECIPE_KEYS`) → pack = NEW-TRADE pattern, 2 recipes.
- Catalog codes already seeded: none for wallcovering (no `G-WCV-*`).
- Blueprint template tasks hitting this trade: none.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| wallcovering-ufgs-09-72-00 | UFGS 09 72 00 Wallcoverings (Aug 2026) | 1 | public_domain | steps, QA, checklists, environmental limits, exterior-wall mold note |
| ga-214 | GA-214 Levels of Finish | 4 | association_public | Level 4/5 reference (existing id) |
| icc-pa | ICC codes public access | 3 | proprietary_ref_only | IBC 803 interior finish — ref string only |
| ecfr-1926-c/d/e/k/l/x | 29 CFR 1926 subparts | 1 | public_domain | hazards (1926.25(a), .57(a), .59, .62(d)(1)(i), .95(a), .103, .416(a)(1), .451(g)(1), .453(b)(2)(v), .1053(b)(13) — text verified on eCFR) |
| platform-baseline | — | — | platform_estimate | all assembly costs |

Wallcoverings Association (wallcoverings.org) answers 403 to scripts — not cited; UFGS references WA W-101.
No public DOE BASC page on vinyl wallcovering / interior vapor retarders found at a stable URL; the mold
risk on exterior walls is sourced from the UFGS 09 72 00 note (which cites UFC 3-101-01).

## Work steps (draft → pack recipes)
`hang_wallcovering` (title_re wallcover / wall covering / wallpaper / vinyl wall / wall liner / mural):
1. **Accept the substrate** — Level 4/5, moisture meter, mold stop, exterior-wall vinyl check. QA: substrate_finish, substrate_moisture, exterior_wall_vapor.
2. **Condition the room and prime** — 60 °F 72 h, circuits off, primer dry. QA: room_conditioned, devices_off, primer_dry.
3. **Check the rolls and lay out to a plumb line** — run numbers, seam plan, plumb line. QA: single_run, plumb_start.
4. **Paste, hang and double-cut the seams**. QA: pattern_match, seams_tight.
5. **Clean, inspect and hand over attic stock**. QA: adhesive_clean, flat_tight, flame_class, attic_stock.

`remove_wallcovering` (priority 10, removal/strip + wallcovering):
1. **Test the old covering and protect the room** (lead presumption pre-1978).
2. **Strip, wash and repair the wall**.

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| stepladder | Stepladder falls / top step | 1926.1053(b)(13) | 3 |
| scaffold_fall | Scaffold falls >10 ft | 1926.451(g)(1) | 4 |
| aerial_lift | Boom-lift basket | 1926.453(b)(2)(v) | 4 |
| blade_cut | Knife/razor cuts | 1926.95(a) | 2 |
| live_devices | Trimming around energized boxes | 1926.416(a)(1) | 3 |
| adhesive_contact | Adhesive/primer skin & eye | 1926.59 | 2 |
| primer_vapor | Solvent primer/remover vapors | 1926.57(a) | 2 |
| steam_burn | Steamer scalds | 1926.95(a) | 2 |
| mold_dust | Mold spores on damp walls | 1926.103 | 2 |
| lead_paint | Lead dust under old paper | 1926.62(d)(1)(i) | 3 |
| wet_floor | Paste / scrap slips | 1926.25(a) | 2 |

## QA checklist
15 items — see pack (2 safety: devices_off, flame_class).

## Inspection / acceptance checkpoints
- substrate_acceptance, mockup_approval (commercial), final_walkthrough.

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| G-WCV-VINYL2-SY | Type II vinyl 54 in. | SY | 1600 | 0.22 | 10 | 15 | estimate |
| G-WCV-RES-SF | Residential paper / non-woven | SF | 200 | 0.03 | 0 | 15 | estimate |
| G-WCV-PRIMER-SF | Wallcovering primer | SF | 9 | 0.005 | 0 | 5 | estimate |
| G-WCV-REMOVE-SF | Removal + adhesive wash | SF | 4 | 0.025 | 2 | 0 | estimate |

## Quantity rules
- `G-WCV-VINYL2-SY` = rooms × 40 (commercial only) — head-start until finish takeoff.
- `G-WCV-PRIMER-SF` = rooms × 360 (commercial only).

## Blueprint callouts (components)
- none this wave.

## Open questions → REVIEW_QUEUE
- 13 ES safety strings pending (11 hazards, 2 QA) + 2 checklist items.
- All 4 assembly costs are platform estimates.
- Wallcoverings Association install guidance not directly cited (403 to scripts).
- Scope: FRP and wall protection routed to `specialties`.
