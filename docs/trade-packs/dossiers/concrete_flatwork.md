# Dossier — `concrete_flatwork` (Concrete Flatwork — Drives / Walks / Curb & Gutter)

> Wave: w04 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/concrete_flatwork.ts` · Status: draft
> Taxonomy: category `sitework` · permit_trade `building` · phase `sitework` · CSI `32 13`

## Scope (2–4 sentences)
Exterior slabs on grade: driveways and street aprons, sidewalks and front walks, patios, landings and
steps, and curb & gutter. Covers subgrade prep, aggregate base, forms, reinforcement, placement, broom
finish, control/isolation joints and curing. Hands off structural slabs and footings to `concrete`,
pavers to `hardscape_pavers`, asphalt to `asphalt_paving`, bulk earthwork to `excavation`.

## Existing coverage reconciled
- Hand recipe: `task-buildout/building.ts` asphalt/flatwork branch (Prep subgrade & base → Form, pour &
  finish flatwork) → pack **complements** (`recipes: []`): adds glossary, hazards, QA, owner/GC + ROW
  checklists, equipment hints, assemblies, quantity rules. No gating inspection — flatwork normally has
  no building-inspection gate; no `code_refs`.
- Design Studio intake `intake/trades/concrete_flatwork.ts` → `intake_hook.module_id = 'concrete_flatwork'`.
- Catalog codes already seeded (referenced, not redeclared): `B-FLATWORK-SF`, `B-AGG-BASE-SY`,
  `B-CONCRETE-CY`, `B-REBAR-LF`, `G-SITE-DEMO-SF`, `B-FLAT-EXCAV-SF`, `B-FLAT-THICK-SF-IN`,
  `B-FLAT-FIBER-SF`, `B-FLAT-MESH-SF`, `B-FLAT-TROWEL-SF`, `B-FLAT-STAMP-SF`, `B-FLAT-EXPOSED-SF`,
  `B-FLAT-COLOR-SF`, `B-FLAT-BORDER-LF`, `B-FLAT-SAWCUT-LF`, `B-FLAT-SEAL-SF`, `B-FLAT-STEP-EA`,
  `B-FLAT-DRAIN-LF` (0028/0037/0045).
- Blueprint template tasks hitting this trade: none.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| concrete_flatwork-nrmca-cip2 | NRMCA CIP 2 Scaling | 4 | association_public | air entrainment, deicers, broom, sealer |
| concrete_flatwork-nrmca-cip6 | NRMCA CIP 6 Joints in Slabs on Grade | 4 | association_public | joint spacing/depth/timing, isolation joints |
| concrete_flatwork-nrmca-cip11 | NRMCA CIP 11 Curing | 4 | association_public | curing start + 3–7 days |
| concrete_flatwork-nrmca-cip14 | NRMCA CIP 14 Finishing Flatwork | 4 | association_public | bull float timing, bleed water |
| concrete_flatwork-ufgs-32-13-13-06 | UFGS 32 13 13.06 PCC Pavement for Roads & Site | 1 | public_domain | mix/air, broom texture, curing |
| concrete_flatwork-wisdot-ss-602 | WisDOT SS 602 Sidewalks, Driveways, Steps | 1 | gov_open | foundation, forms, straightedge, joints, opening strength, detectable warnings |
| concrete_flatwork-wisdot-ss-601 | WisDOT SS 601 Curb & Gutter | 1 | gov_open | curb joints, expansion joints |
| ecfr-1926-e/g/k/o/p/q/z | 29 CFR 1926 subparts | 1 | public_domain | hazards (`ecfr-1926-g` newly added to the shared OSHA block) |
| platform-baseline | Platform cost baseline | — | platform_estimate | all new assembly costs |

ACI 330/302 and PCA driveway guidance were considered; not cited (ACI ref-only adds nothing beyond CIP;
no stable public PCA driveway URL found — cement.org deep links 404).

## Work steps
Hand recipe kept (2 steps). Pack adds equipment hints: skid_steer (optional), compactor, concrete_pump
(optional), dump_truck on removal/replace tasks (optional).

## Hazards
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| truck_backing | backing ready-mix/dump truck | 1926.601(b)(4) | 4 |
| equipment_reverse | skid steer/roller in reverse | 1926.602(a)(9)(ii) | 4 |
| rebar_impalement | stakes / dowels | 1926.701(b) | 3 |
| utility_strike | buried lines at subgrade / stakes | 1926.651(b)(1) | 4 |
| traffic_row | traffic at apron / curb / public walk | 1926.200(g)(1) | 4 |
| cement_burns | wet concrete | 1926.95(a) | 2 |
| silica_sawcut | saw-cutting joints / removal | 1926.1153(c)(1) (Table 1 walk-behind/handheld saws) | 3 |
| power_trowel | dead-man switch | 1926.702(c) | 3 |
| pump_line | pump line support | 1926.702(e)(1) | 3 |
| tool_shock | GFCI | 1926.404(b)(1) | 3 |

## QA checklist (15)
Utility locate (safety); subgrade firm; base compacted; forms to grade + slope away; thickness check;
isolation joints at structures; air-entrained exterior mix / no added water; no finishing with bleed
water; broom texture; joint spacing ≈2–3× thickness in ft (≤10 ft for 4 in., panels ≤1.5:1); joint depth
≥1/4 slab + saw timing; 10 ft straightedge; curing 3–7 days + frost protection; opening strength
(WisDOT 2,000/3,000 psi); owner note — no deicers first winter + breathable sealer.

## Inspection / acceptance checkpoints (descriptive keys — no AHJ building gate)
- `pre_pour_check` (owner/GC, 7 items) · `final_walkthrough` (6) · `row_permit_check` (7 — municipal
  driveway/ROW permit, traffic control, apron standard, public walk crossing, detectable warnings, curb joints).

## Cost basis
| Code | Item | Unit | Mat ¢ | Labor hr | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| B-CFW-CURB-GUTTER-LF | 30 in. curb & gutter, hand-formed | LF | 1500 | 0.25 | 100 | 5 | estimate — 0.08 CY/LF × B-CONCRETE-CY baseline |
| B-CFW-CURBCUT-LF | remove curb for drive opening | LF | 0 | 0.35 | 400 | 0 | estimate |
| B-CFW-ISOJOINT-LF | 1/2 in. isolation filler | LF | 75 | 0.02 | 0 | 10 | estimate |
| B-CFW-JOINTSEAL-LF | backer rod + SL sealant | LF | 120 | 0.03 | 0 | 10 | estimate (note WisDOT 602 says do not seal sidewalk joints — owner/commercial option) |
| B-CFW-DETWARN-EA | detectable warning 2×4 ft | EA | 16000 | 1.0 | 0 | 0 | estimate |

## Quantity rules (residential_sf only; fire only when the trade is on the schedule)
- `B-FLATWORK-SF` = 640 (2-car drive ≈480 + front walk ≈160)
- `B-AGG-BASE-SY` = ceil(640/9) = 72
- `B-FLAT-SAWCUT-LF` = 128 (area ÷ 5, matches intake)
- `B-FLAT-THICK-SF-IN` = 240 (apron 120 SF × 2 in.)
- `B-CFW-ISOJOINT-LF` = 40

## Blueprint callouts (components)
None this wave.

## Open questions → REVIEW_QUEUE
- All 5 new assembly costs are platform estimates.
- Apron thickness/width vary by municipality — the 6 in. / 120 SF default is a guess.
- No AHJ gate inspection type exists for flatwork; ROW/municipal approach inspection lives in a descriptive checklist key.
