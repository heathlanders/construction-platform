# Dossier — `tree_service` (Tree Service / Land Clearing)

> Wave: w06 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/tree_service.ts` · Status: draft
> Taxonomy: category `sitework` · permit_trade `null` · phase `site_prep` · CSI `31 13`

## Scope (2–4 sentences)
Removes, fells and chips trees, grinds stumps, and clears or grubs brush and timber so the excavator can
start. On construction sites it also lays out and fences the root zones of trees that stay. It does not do
mass excavation or grading (excavation), line-clearance work on energized utility lines (utility's
qualified line-clearance crew under 29 CFR 1910.269), or new planting (landscaping).

## Existing coverage reconciled
- Hand recipe: none → NEW-TRADE pattern, 3 recipes with `example_title`.
- Catalog codes already seeded: none for tree work (`G-LSC-TREE-EA` in landscaping = tree *planting*; `G-SITE-DEMO-SF` = paving removal).
- Blueprint template tasks hitting this trade: none.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| tree_service-osha-topic | OSHA Tree Care Industry topic | 1 | gov_open | context: no tree-care standard |
| tree_service-osha-hb3731 | OSHA Hazard Bulletin HB-3731 (falls / falling objects) | 1 | gov_open | drop zones, signals, 10 ft line clearance, aerial lift use |
| tree_service-ecfr-1910-269 | 29 CFR 1910.269 (general industry) | 1 | public_domain | line-clearance context only |
| ecfr-1926-k / -l / -cc / -i / -e / -g / -p / -c | 29 CFR 1926 subparts | 1 | public_domain | hazard osha_refs |
| tree_service-ansi-z133 | ANSI Z133 | 3 | proprietary_ref_only | concepts only (qualified arborist, chipper feeding, felling) |
| tree_service-purdue-fnr463 | Purdue FNR-463-W Construction and Trees | 4 (edu) | gov_open | protection zone size, fence, signs, no storage, root cuts |
| tree_service-wi-dnr-oakwilt | WI DNR Oak wilt | 1 | gov_open | April–July no-cut window, wound sealer, oak wood |
| tree_service-wi-dnr-eab | WI DNR Emerald ash borer | 1 | gov_open | EAB deregulated 2021, use firewood locally |
| tree_service-wi-dnr-firewood | WI DNR Firewood | 1 | gov_open | 10-mile state-land rule, spongy moth quarantine |

## Work steps (draft → pack recipes)
- `tree_removal_felling` (title_re `remov|fell|cut down|take down|clear|grub`, priority 2): survey trees + lines → drop zone + traffic control → fell or piece down → buck, chip, haul → cut stumps low, clear.
- `stump_grinding` (title_re `stump`, priority 1): locates + debris zone → grind to depth → remove grindings, backfill.
- `tree_protection_zone` (title_re `tree protect|protection fenc|root zone|TPZ|preserv|save trees`, priority 3): mark zones with arborist → fence + bilingual signs → keep zones clean.
No gates or code refs (null permit).

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| power_line_contact | contact with energized lines | 1926.416(a)(1) | 4 |
| crane_power_line | crane boom near lines | 1926.1408(a) | 4 |
| struck_by_falling | falling trees/limbs | 1926.100(a) | 4 |
| chainsaw_cut | kickback, refuel fire | 1926.300(b)(1) (derived; + .302(c)(1), .95(a)) | 4 |
| chipper_entanglement | pulled into chipper | 1926.300(b)(2) (derived) | 4 |
| aerial_lift_fall | fall from lift / tip-over | 1926.453(b)(2)(v) | 4 |
| climbing_fall | fall while climbing | 1926.21(b)(2) (derived) | 4 |
| stump_grinder_debris | thrown debris | 1926.102(a)(1) | 3 |
| utility_strike_grinding | buried line strike | 1926.651(b)(1) (derived) | 4 |
| traffic_struck_by | traffic / wood on road | 1926.201(a) | 3 |
| noise | saws, chippers, grinders | 1926.101(a) | 2 |

OSHA has no tree-care standard; 1910.269 governs line-clearance tree trimming (general industry) and is
cited as context only. 1926 Subpart V (power line construction) does not cover tree work.

## QA checklist
16 items: 7 safety (hazard assessment, lines identified, drop zone, felling plan, saw PPE, chipper side-feed,
locates before grinding) + oak-wilt window, stump depth, grindings removed, debris disposal (WI DNR), TPZ
size (dripline or 1.5 ft/in DBH), fence + signs every ~20 ft, no storage/grade change in TPZ, clean root
cuts backfilled within 1 h, site left clean.

## Inspection / acceptance checkpoints
- `pre_work_hazard_assessment`: arborist tree check, lines/utility, 811, drop zones + traffic, trees to save confirmed.
- `tree_protection_fence_check`: fence at root-zone line before equipment, bilingual signs, nothing inside, chip haul paths.
- `final_walkthrough`: removals done, saved trees undamaged, stumps/grindings, disposal per WI DNR, cleanup.

## Cost basis (all platform-baseline estimates)
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % |
|---|---|---|---|---|---|---|
| G-TREE-REMOVE-SM-EA | Tree removal ≤12 in DBH | EA | 2000 | 2.5 | 15000 | 0 |
| G-TREE-REMOVE-MD-EA | Tree removal 12–24 in DBH | EA | 6000 | 6 | 40000 | 0 |
| G-TREE-REMOVE-LG-EA | Tree removal >24 in DBH | EA | 15000 | 14 | 90000 | 0 |
| G-TREE-STUMP-EA | Stump grinding, avg 18 in | EA | 0 | 0.75 | 6000 | 0 |
| G-TREE-CLEAR-AC | Clearing + grubbing, light–medium woods | AC | 100000 | 40 | 350000 | 0 |
| G-TREE-PROTECT-LF | Tree protection fence + signs | LF | 150 | 0.04 | 0 | 5 |

Chipping and haul are included in the removal/clearing rows (disposal in material, chipper + trucks in
equipment) — a separate per-load row would exceed the 6-assembly cap and double-count.

## Quantity rules
None — blueprint facts carry no tree counts, DBH or wooded acreage.

## Blueprint callouts (components)
None this wave.

## Open questions → REVIEW_QUEUE
- Equipment vocab lacks `wood_chipper` and `stump_grinder` (used every job).
- No UW–Madison Extension tree-protection-on-construction-sites page found; used Purdue FNR-463-W (regional extension).
- TCIA site blocks scripts (403) and has no stable public Z133 page; cited ANSI Z133 via the ISA store page only.
- All costs are platform estimates.
