# Dossier — `metal_panels` (Architectural Metal Panels / ACM / Rainscreen)

> Wave: w09 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/metal_panels.ts` · Status: draft
> Taxonomy: category `envelope` · permit_trade `building` · phase `finishes_exterior` · CSI `07 42`

## Scope (2–4 sentences)
Architectural metal wall cladding on any building type: ACM/MCM rainscreen (fabricated trays on rails),
insulated metal wall panels (IMP), and exposed-fastener steel siding over girts/furring. Includes subframing
with thermal clips, WRB/air barrier tie-in behind the cladding, panel sequence + fastening, trims/flashing at
openings, sealant joints, protective-film removal. Hand-offs: metal building system roof/wall sheeting →
`pemb` (B-PEMB-*); post-frame steel skin → `post_frame`; standalone air barrier → `air_barrier`; window
units → `windows`; metal roofing → `roofing`/`pemb`.

## Existing coverage reconciled
- Hand recipe: none (not in HAND_RECIPE_KEYS) → NEW-TRADE pattern, two recipes.
- Catalog codes already seeded: none `B-MP-*`. Related: `B-SIDING-SF` (hand-seeded in quantities.ts when the
  `metal_siding` component is found) — NOT duplicated; pack only adds trim LF on the same callout.
  `B-PEMB-*` (pemb) and `B-PF-*` (post_frame) untouched.
- Blueprint template tasks: none. Blueprint component `metal_siding` creates "Metal wall panel install"
  (trade `finishes`, not this key) — recipe title_re also matches that title if a PM retags it.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| metal_panels-ufgs-07-42-13 | UFGS 07 42 13 Metal Wall Panels (Aug 2025) | 1 | public_domain | steps, QA (Part 3), film storage |
| metal_panels-ufgs-07-42-63 | UFGS 07 42 63 Fabricated Wall Panel Assemblies | 1 | public_domain | subframe QA |
| metal_panels-mca-mcm | MCA — Metal Composite Material | 4 | association_public | ACM/rainscreen QA |
| metal_panels-mca-imp | MCA — Insulated Metal Panels | 4 | association_public | IMP joint seal QA |
| metal_panels-alucobond-processing | MCM processing / install manual | 5 | manufacturer_public | film direction + removal timing |
| doe-basc, doe-basc-win-flashed | DOE BASC | 1 | gov_open | WRB lapping, CI |
| ecfr-1926-m/l/e/i/h/cc/d/x | 29 CFR 1926 | 1 | public_domain | hazards |
| icc-pa, nfpa-fa | IBC/IRC/IECC, NFPA 285 | 3 | proprietary_ref_only | section refs only |

## Work steps (draft → pack recipes)
`metal_wall_panels` (title_re: metal panel / ACM / MCM / composite panel / rainscreen / insulated metal / IMP / metal or steel siding / metal cladding):
1. Check the wall and panel layout — QA substrate_tolerance, penetrations_vs_joints.
2. WRB / air barrier + subframing — gate `sheathing`; IBC 1404.4, IECC C402.5.
3. Hang and fasten panels — fasteners_seated, dissimilar_metals, imp_joint_seal.
4. Trim and flash openings — IBC 1404.4, IRC R703.4.
5. Seal joints, pull film, close out — gate `final`; IBC 1402.5, NFPA 285.

`acm_rainscreen` (priority 10; ACM / MCM / composite / rainscreen): fire-tested assembly check (IBC 1402.5,
2603.5) → air barrier, clips, rails (gate `sheathing`) → hang trays in sequence → trims, sealant, film (gate `final`).

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| edge_fall | Fall from edge | 1926.501(b)(1) | 4 |
| scaffold_fall | Scaffold fall | 1926.451(g)(1) | 4 |
| aerial_lift | Aerial lift | 1926.453(b)(2)(v) | 4 |
| sheet_edges | Cuts from panel edges | 1926.95(a) | 3 |
| eye_flying | Chips/swarf | 1926.102(a)(1) | 2 |
| falling_objects | Falling panels/tools | 1926.501(c) | 3 |
| wind_storage | Wind on stored panels | 1926.250(a)(1) | 3 |
| suspended_load | Crane/telehandler panel lifts | 1926.1425(b) | 4 |
| power_tool | Metal saws/drills | 1926.300(b) | 3 |
| noise | Saw/screw-gun noise | 1926.52 | 2 |
| ladder | Ladder | 1926.1053(b)(1) | 3 |
| chem_sealant | Sealants/primers | 1926.59 | 2 |

## QA checklist
15 items — UFGS 07 42 13 Part 3 (tolerance, penetrations vs seams, alignment, fasteners not overdriven, no torch
cutting, dissimilar metals, flashing laps/drips/closures, sealant), MCA/manufacturer (film direction + removal,
rainscreen drainage, IMP joint seal), NFPA 285 assembly match (safety, ES pending).

## Inspection / acceptance checkpoints
- sheathing: WRB/air barrier continuous + tied in (1402.2), opening flashings (1404.4), CI + clips (C402.5).
- final: assembly matches fire-test report (1402.5), cavity fire barriers at floor lines, trims/sealant/film done.

## Cost basis (all `estimate`, platform-baseline 2026)
| Code | Item | Unit | Material ¢ | Labor hr | Equip ¢ | Waste % |
|---|---|---|---|---|---|---|
| B-MP-ACM-RS-SF | ACM rainscreen trays + extrusions | SF | 2800 | 0.30 | 150 | 8 |
| B-MP-IMP-WALL-SF | Insulated metal wall panel ~3 in. | SF | 1800 | 0.10 | 100 | 5 |
| B-MP-STEEL-EXP-SF | Exposed-fastener steel wall panel | SF | 350 | 0.04 | 25 | 8 |
| B-MP-SUBFRAME-SF | Thermal clips + Z-girts/hat channels | SF | 450 | 0.06 | 50 | 5 |
| B-MP-TRIM-LF | Formed trim / flashing | LF | 600 | 0.08 | 0 | 10 |

## Quantity rules
- `B-MP-TRIM-LF` = windows × 16 (ceil), only when the `metal_siding` component is found. Wall SF is not a
  blueprint fact (area_sf_sum is floor area) and `B-SIDING-SF` already prices the metal_siding area, so no
  panel-SF rule was added.

## Blueprint callouts (components)
- None this wave (existing core token `metal_siding` reused).

## Open questions → REVIEW_QUEUE
- IBC section numbers 1402.5 / 1404.4 / 1402.2 / 2603.5 cited per 2021 IBC numbering — confirm against adopted edition.
- MCM-specific IBC section (1406 in 2021) not cited — numbering shifts between editions.
- All costs estimate-only; wall-SF quantity basis missing (only one quantity rule).
- When `metal_siding` triggers B-SIDING-SF, the generic siding price may undercount architectural panels.
