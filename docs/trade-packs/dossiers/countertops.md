# Dossier — `countertops` (Countertops)

> Wave: w03 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/countertops.ts` · Status: draft
> Taxonomy: category `interior` · permit_trade `null` · phase `finishes_interior` · CSI `12 36`

## Scope (2–4 sentences)
Field measures/templates, fabricates (usually in a shop) and installs kitchen, bath and bar tops in plastic
laminate, solid surface, quartz/engineered stone and natural stone (granite, marble, quartzite): seams, sink
and cooktop cutouts, undermount sink attachment, backsplashes, overhang supports, and tear-out of old tops.
Does NOT set cabinets (cabinetry), connect plumbing (plumbing trim), set appliances, or install tile
backsplash (tile). No AHJ permit path — acceptance is owner/GC checkpoints.

## Existing coverage reconciled
- Hand recipe: `task-buildout/nopermit.ts` cabinetry/millwork/countertops branch (Field-verify & layout →
  Install & scribe) → pack **complements** (`recipes: []`): glossary, hazards, QA, checkpoints, assemblies.
- Catalog codes already seeded: `G-CTOP-LF` (0037, stone baseline per LF) — referenced by a quantity rule,
  not redeclared. Not seeded by `seedGeneral` (only cabinets are), so the pack rule is the first source of it.
- Blueprint template tasks hitting this trade: none (0).

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| countertops-osha-niosh-ha-silica | OSHA/NIOSH Hazard Alert — silica in countertop manufacturing, finishing, installation (NIOSH 2026-101 / OSHA HA-3768-2026; updates 2015 alert) | 1 | public_domain | silica hazard, controls (shop-first, outdoor wet field work, no dry sweep/compressed air), engineered stone up to ~95% silica |
| countertops-osha-silica-nep | OSHA CPL 03-00-023 Silica NEP (2020) | 1 | gov_open | enforcement context |
| countertops-osha-engstone-2023 | OSHA engineered-stone silica initiative (news release 2023-09-25) | 1 | gov_open | enforcement context |
| ecfr-1926-z | 29 CFR 1926 Subpart Z (1926.1153 Table 1, (f) housekeeping) | 1 | public_domain | silica controls |
| ecfr-1926-c/d/e/f/h/i/k | 29 CFR 1926 Subparts | 1 | public_domain | other hazards |
| countertops-ufgs-06-61-16 | UFGS 06 61 16 Solid Surfacing Fabrications (2020) | 1 | public_domain | install plumb/level, seam adhesive, sink attachment, splashes, silicone joints |
| countertops-caesarstone-guide-spec | Caesarstone 3-part guide spec v3.7 (2019) | 5 | manufacturer_public | substrate flatness 1/16 in./10 ft, water-cooled site tools, expansion gaps, joints |
| countertops-cambria-install-guideline | Cambria Countertop Installation Technical Guideline (2024) | 5 | manufacturer_public | support near cutouts, overhang limits, seam width, silicone attach, no fasteners |
| countertops-wilsonart-quartz-fab | Wilsonart Quartz Fabrication & Installation Guidelines (2015) | 5 | manufacturer_public | A-frame/transport, wet fabrication, template info, seam placement, cutout radius, overhang chart, no sealing quartz |
| countertops-wilsonart-ss-fab | Wilsonart Solid Surface Fabrication & Installation Guidelines (2018) | 5 | manufacturer_public | cooktop cutout heat tape, corner blocks, radius |
| countertops-nsi-dsdm | NSI Dimension Stone Design Manual — countertops chapter | 4 | proprietary_ref_only | natural-stone sealing, layout (reference only) |

## Work steps
Hand recipe stays (complement). Pack adds checkpoints: template_verify → slab_approval → install_complete → final_walkthrough.

## Hazards
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| silica_stone_dust | silica dust cutting/grinding quartz & stone | 1926.1153(c)(1) | 4 |
| silica_dry_cleanup | dry sweep / compressed air re-suspends dust | 1926.1153(f)(1) | 3 |
| slab_tipover | slab/A-frame tip-over crush | 1926.250(a)(1) | 4 |
| manual_handling | heavy carries, dropped pieces | 1926.21(b)(2) | 3 |
| grinder_wheel | grinder/polisher wheel, kickback | 1926.303(b)(1) | 3 |
| wet_tool_shock | water-fed tools | 1926.404(b)(1) | 3 |
| tool_grounding | ungrounded tools | 1926.302(a)(1) | 2 |
| adhesive_chemicals | seam adhesives, epoxy, sealers | 1926.59 | 2 |
| flammable_solvent | alcohol/acetone/sealers | 1926.152(a)(1) | 2 |
| eye_slurry | chips, slurry, adhesive | 1926.102(a)(1) | 2 |
| noise | saws/grinders | 1926.101(a) | 2 |
| tearout_debris | tear-out debris | 1926.25(a) | 2 |

Engineered stone note: the 2026 OSHA/NIOSH hazard alert (updating the 2015 alert) says engineered stone can be
up to ~95% crystalline silica (granite ~10–50%); the controls are: do cutting/edging in the shop, use templates
so no field finishing is needed, and where on-site work can't be avoided do it outdoors with water; never dry
cut, dry sweep or use compressed air. In construction (on-site install) 1926.1153 Table 1 governs: handheld
saws water-fed; handheld grinders water-fed (outdoors) or shrouded with a 25 cfm/in. dust collector; drills
shrouded with a dust collector. OSHA added a 2023 engineered-stone enforcement initiative on top of the
silica NEP (CPL 03-00-023).

## QA checklist
15 items — cabinets_level, fixtures_on_site, template_signoff, seam_location, seam_finish, overhang_support
(safety), cutout_radius, cutout_support, undermount_sink, cooktop_clearance, attach_gaps, backsplash,
stone_sealed, laminate_joints (platform estimate), no_dry_cutting (safety).

## Inspection / acceptance checkpoints (no permit)
template_verify · slab_approval · install_complete · final_walkthrough.

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| G-CT-TEMPLATE-EA | template visit | EA | 1500 | 2.0 | 0 | 0 | platform estimate |
| G-CT-SINK-CUTOUT-EA | sink cutout + polish + reinforce | EA | 800 | 1.5 | 1500 | 0 | platform estimate |
| G-CT-UMSINK-SET-EA | undermount sink attach | EA | 1800 | 1.0 | 0 | 0 | platform estimate |
| G-CT-BSPLASH-FH-SF | full-height slab backsplash | SF | 4500 | 0.25 | 100 | 15 | platform estimate |
| G-CT-TEAROUT-LF | tear-out + haul | LF | 0 | 0.2 | 300 | 0 | platform estimate |
| G-CT-BRACKET-EA | concealed overhang bracket | EA | 4500 | 0.6 | 0 | 0 | platform estimate |

## Quantity rules
- `G-CTOP-LF` = cabinetry callout × 22 LF
- `G-CT-TEMPLATE-EA` = cabinetry × 1
- `G-CT-SINK-CUTOUT-EA` = cabinetry × 1
- `G-CT-UMSINK-SET-EA` = cabinetry × 1 (assumes undermount)

## Blueprint callouts (components)
None this wave (countertop callouts on plans — "QUARTZ TOP", "GRANITE CTOP" — are a candidate for a later wave).

## Open questions → REVIEW_QUEUE
- Spanish safety text pending (12 hazards, 2 QA, 2 checklist items).
- All 6 costs are platform estimates.
- Cambria guideline footer says "confidential and proprietary" although publicly hosted — confirm OK to cite.
- No public laminate installation guide verified (Formica pages 404; Wilsonart DIY laminate guide 404) — laminate_joints QA is a platform estimate.
- Silestone/Cosentino official install guide URL not found on a first-party domain.
- `G-CTOP-LF` quantity rule may overlap a future cabinetry-pack rule — coordinate.
- Vocab: no slab-handling equipment type (vacuum lifter / slab cart / A-frame) in equipment-vocab.
