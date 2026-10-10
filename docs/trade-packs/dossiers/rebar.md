# Dossier — `rebar` (Reinforcing Steel (Rebar))

> Wave: w08 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/rebar.ts` · Status: draft
> Taxonomy: category `concrete_masonry` · permit_trade `building` · phase `foundation` · CSI `03 20`

## Scope
Places and ties reinforcing bars, dowels and welded wire in footings, foundation walls, piers and slabs; sets
anchor bolts and cast-in hold-downs to template; readies each pour for the footing / foundation inspection.
Does NOT form (formwork), pour or finish (concrete), or post-tension (post_tensioning). Post-installed
(drill-and-epoxy) dowels into existing concrete are covered as a second recipe.

## Existing coverage reconciled
- Hand recipe: none — `rebar` is not in `HAND_RECIPE_KEYS`; the task previously fell to the generic
  foundation branch of `task-buildout/building.ts`. Pack = NEW-TRADE pattern.
- Catalog codes already seeded: `B-REBAR-LF` (0030, $1.20/LF, 0.02 hr/LF), `B-FLAT-MESH-SF` (flatwork mesh),
  `B-FOOTING`, `B-CONCRETE-CY`, `B-FRM-HOLDDOWN-EA` (framing — hold-down with anchor). Not redeclared;
  `B-REBAR-LF` is referenced from a quantity rule (no other pack or hand seeder emits it).
- Blueprint template tasks: residential-sf `Rebar & anchor bolt placement` (trade `rebar`, phase foundation).
  `Foundation walls — form, rebar & pour` (residential-mf) is trade `concrete` — handled by the concrete pack.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| rebar-wi-dfd-032000 | WI DOA/DFD master spec 03 20 00 Concrete Reinforcing (2024) | 1 | gov_open | execution steps, QA (supports, ties, clearance, WWR laps, no tack welds, vapor retarder, anchor-bolt tolerance, inspection) |
| rebar-crsi-field-inspection | CRSI Field Inspection of Reinforcing Bars (TOC; book is sold) | 4 | proprietary_ref_only | QA topics only |
| rebar-aci-318 | ACI 318 | 3 | proprietary_ref_only | section refs 20.5.1.3, 25.5, 26.6.2 |
| icc-pa | ICC public access | 3 | proprietary_ref_only | IRC R403.1, R403.1.3, R403.1.6, R404.1.3, R506.2.4; IBC 1705.3 |
| ecfr-1926-q/m/h/cc/e/i/p/z | 29 CFR 1926 | 1 | public_domain | hazards (701(b), 703(d)(1), 703(d)(2), 501(b)(5), 1425(b), 251(a)(1), 250(a)(1), 95(a), 102(a)(1), 300(b), 652(a)(1), 1153) |

UFGS 03 20 00 was archived (superseded by UFGS 03 30 00) — the WI DFD master spec was used for the public
execution text instead.

## Work steps
Recipe `foundation_rebar_anchor_bolts` (title_re rebar|reinforc|dowel|anchor bolt|wire mesh):
1. Review placing drawings and the bar list
2. Receive, check tags and store the steel
3. Place and tie the footing steel — gate `footing` (IRC R403.1, R403.1.3; ACI 318 20.5.1.3)
4. Place wall, pier and slab steel with dowels
5. Set anchor bolts and hold-downs; pre-pour check — gate `foundation` (IRC R403.1.6, R404.1.3, R506.2.4; ACI 318 25.5)

Recipe `drill_epoxy_dowels` (priority 10): locate existing steel → drill and clean → inject and set — gate `foundation` (IBC 1705.3).

## Hazards
12: impalement (1926.701(b), sev 4), cage collapse (703(d)(1), 4), mesh recoil (703(d)(2), 3), fall from steel face
(501(b)(5), 4), hoisted bundle (1425(b), 4), rigging (251(a)(1), 3), stack roll (250(a)(1), 3), hand cuts (95(a), 2),
eye (102(a)(1), 2), cutter/bender (300(b), 3), cave-in (652(a)(1), 4), silica drilling (1153, 3).

## QA checklist
15 items — 13 non-safety (ES translated by author), 2 safety (caps, bracing — ES pending).

## Inspection / acceptance checkpoints
- footing: cover over soil, bar count/spacing, laps + dowels, clean excavation + caps.
- foundation: wall steel cover/bracing, anchor bolts, slab chairs over vapor retarder, special-inspection report (commercial).

## Cost basis (all `estimate`, platform-baseline 2026)
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % |
|---|---|---|---|---|---|---|
| B-RBR-ANCHOR-EA | 1/2×10 in. anchor bolt + nut/washer, templated | EA | 250 | 0.08 | 0 | 3 |
| B-RBR-DOWEL-EA | bent #4 footing-to-wall dowel | EA | 300 | 0.06 | 0 | 3 |
| B-RBR-SLAB-GRID-SF | #4 @ 18 in. e.w. slab grid, chaired | SF | 120 | 0.012 | 0 | 7 |
| B-RBR-EPOXY-DOWEL-EA | drill-and-epoxy #4 dowel, 6 in. embed | EA | 600 | 0.3 | 100 | 10 |

## Quantity rules
- `B-REBAR-LF` = 352 when `concrete_footing` (residential_sf) — 160 LF × 2 bars + 10% laps.
- `B-RBR-ANCHOR-EA` = 32 when `anchor_bolts` (residential_sf) — 160 LF sill at ~6 ft + end bolts.
- `B-RBR-DOWEL-EA` = 40 when `foundation_wall` (residential_sf) — every ~4 ft on 160 LF.
- `B-RBR-SLAB-GRID-SF` = plan floor area when `slab_on_grade` (commercial / industrial).

## Blueprint callouts
None this wave (existing tokens `concrete_footing`, `anchor_bolts`, `foundation_wall`, `slab_on_grade` reused).

## Open questions → REVIEW_QUEUE
- All 4 costs are platform estimates.
- 12 hazards + 2 safety QA + 8 inspection-checklist items await human ES translation.
- IRC section numbers (R403.1.3, R404.1.3, R506.2.4) and ACI 318 section numbers checked from memory against the 2021 IRC / ACI 318-19 numbering — codes.iccsafe.org answers 403 to scripts; confirm on review.
- Dowel rule assumes dowels every ~4 ft; many prescriptive IRC walls have none — estimator should delete if absent.
