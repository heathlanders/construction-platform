# Dossier — `chimney` (Chimney — Masonry / Liners / Sweep)

> Wave: w05 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/chimney.ts` · Status: draft
> Taxonomy: category `concrete_masonry` · permit_trade `building` · phase `finishes_exterior` · CSI `04 57`

## Scope (2–4 sentences)
Inspects and sweeps existing chimneys (Level 1, Level 2 video scans), installs listed stainless-steel
liners sized to the appliance, and repairs masonry chimneys — crowns, caps, tuckpointing, and rebuilds
above the roofline with flashing and a cricket. Does NOT set or service the appliance itself (HVAC /
`fireplaces` trade), build new fireplaces/fireboxes (masonry/fireplaces), or reroof (roofing — coordinate
flashing).

## Existing coverage reconciled
- Hand recipe: none → NEW-TRADE pattern, 3 recipes with `example_title`.
- Catalog codes already seeded: none for chimneys (`B-RF-STEP-FLASH-LF` exists under roofing; not reused here).
- Blueprint template tasks hitting this trade: none. No fireplace/chimney blueprint components exist → no quantity rules.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| ecfr-1926-m / -l / -x / -h / -d / -e / -i / -z | 29 CFR 1926 Subparts M, L, X, H, D, E, I, Z | 1 | public_domain | hazards (all osha_ref verified on law.cornell.edu mirror) |
| chimney-csia-homeowner | CSIA Homeowner Resources / FAQ | 4 | association_public | annual inspection concept, sweep threshold, Level 1 scope, liner insulation for solid fuel |
| chimney-csia-fires | CSIA Preventing Chimney Fires | 4 | association_public | creosote, chimney-fire damage signs |
| chimney-csia-co | CSIA Avoiding Carbon Monoxide Hazards | 4 | association_public | CO / blocked-flue occupant risk |
| chimney-bia-tn19b | BIA Technical Note 19B | 4 | association_public | flue tile ahead of brick, flashing/counterflashing, cricket, cap/crown bond break |
| chimney-olympia-foreverflex | Forever Flex / ArmorFlex install manual | 5 | manufacturer_public | relining sequence, UL 1777 listing, sizing, insulation, cap, sharp edges, power lines |
| chimney-lifetime-liner-kit | Lifetime Lining System direct-connect kit instructions | 5 | manufacturer_public | sound chimney before relining, creosote removal, rain cap, sealed top plate |
| chimney-nfpa-211 | NFPA 211 | 3 | proprietary_ref_only | inspection levels (Ch. 15, 15.2 / 15.4) — section + paraphrase only |
| chimney-ul-1777 | UL 1777 Chimney Liners | 3 | proprietary_ref_only | listing reference only |
| icc-pa | IRC R1003.9, .9.1, .11, .18, .19, .20 | 3 | proprietary_ref_only | code refs (section + paraphrase) |
| platform-baseline | The Jobsite cost baseline | — | platform_estimate | all assembly costs |

## Work steps (draft → pack recipes)
1. **inspect_sweep** (`Chimney sweep and Level 1 inspection`): containment → sweep flue + smoke chamber → Level 1 (NFPA 211 15.2 ref) → Level 2 camera scan on trigger (15.4 ref) → draft test + report. No gate (service work) — checklists `nfpa211_level2_inspection`, `final_walkthrough`.
2. **stainless_liner** (`Install stainless steel chimney liner`, priority 20): clean/inspect/sound → size + cut → insulate + drop → connect bottom, seal top, cap (R1003.11, R1003.9.1) → draft test, label, final. Gate: final.
3. **rebuild_above_roof** (`Rebuild chimney above roofline with new crown and cap`, priority 10): anchors + debris path → teardown → rebuild stack + flue tile (R1003.9, R1003.18) → flashing + cricket (R1003.20) → crown + cap (R1003.9.1) → clean-up, draft test, final. Gate: final.

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| roof_fall | Roof edge fall | 1926.501(b)(13) | 4 |
| fall_anchor | Anchoring to chimney/weak points | 1926.502(d)(15) | 4 |
| ladder | Ladder access | 1926.1053(b)(1) | 3 |
| power_lines | Ladders/rods/liner vs service drop | 1926.1053(b)(12) | 4 |
| scaffold_fall | Scaffold/roof brackets | 1926.451(g)(1) | 4 |
| creosote_soot | Soot/creosote (PAH) inhalation + skin | 1926.103 | 3 |
| silica_cutting | Cutting brick / grinding mortar | 1926.1153(c)(1) | 3 |
| falling_debris | Debris from roof teardown | 1926.252(a) | 3 |
| roof_stacking | Material sliding off / overloading roof | 1926.250(a)(1) | 3 |
| flue_gas_co | CO / flue gas spillage | 1926.55(a) | 4 |
| sharp_metal | Liner/cap/flashing edges | 1926.95(a) | 2 |
| grinder | Grinder/saw kickback | 1926.300(b)(1) | 3 |

## QA checklist
15 items — swept full flue, Level 1 scope, Level 2 triggers, chimney sound before relining, liner listed + sized,
solid-fuel liner insulated, mortar matched, clearance to combustibles (safety, "per IRC R1003.18"), termination
height (safety), counterflashing, cricket, crown drip edge + bond break, cap with spark arrestor (safety), draft
test (safety), CO alarm (safety).

## Inspection / acceptance checkpoints
- `final` (building family): height, spark arrestor, listed liner, clearances/fireblocking, cricket.
- `nfpa211_level2_inspection`: camera scan, defects, clearances, exterior, trigger recorded.
- `final_walkthrough`: clean, damper, draft + CO, report handed over.

## Cost basis (all `platform-baseline`, confidence `estimate`)
| Code | Item | Unit | Material ¢ | Labor hr | Equip ¢ | Waste % |
|---|---|---|---|---|---|---|
| B-CHM-SWEEP-L1-EA | Sweep + Level 1 | EA | 1500 | 2.0 | 1500 | 0 |
| B-CHM-INSP-L2-EA | Level 2 video inspection | EA | 0 | 2.5 | 4000 | 0 |
| B-CHM-LINER-SS-LF | Insulated SS flex liner | LF | 5500 | 0.35 | 0 | 5 |
| B-CHM-CAP-EA | SS cap with spark arrestor | EA | 15000 | 1.0 | 0 | 0 |
| B-CHM-CROWN-EA | Crown rebuild | EA | 9000 | 6.0 | 2500 | 10 |
| B-CHM-REBUILD-VLF | Rebuild above roof per vertical ft | VLF | 5500 | 2.5 | 2000 | 8 |

## Quantity rules
None — no fireplace/chimney blueprint facts exist.

## Blueprint callouts (components)
None this wave.

## Open questions → REVIEW_QUEUE
- NFPA 211 section numbers 15.2 / 15.4 confirmed only via secondary sources (no direct free-access read).
- HPBA site returns 403 to scripted fetch — not cited. HomeSaver's own install sheet not found; used Lifetime Lining System + Olympia Forever Flex instructions.
- Tuckpointing (per SF) and cricket (EA) assemblies omitted to stay within 6 — candidates for a later wave.
- `scaffold` / `inspection_camera` not in equipment vocab.
