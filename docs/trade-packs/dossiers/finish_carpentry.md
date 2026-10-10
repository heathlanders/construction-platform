# Dossier — `finish_carpentry` (Finish Carpentry / Trim)

> Wave: w03 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/finish_carpentry.ts` · Status: draft
> Taxonomy: category `interior` · permit_trade `null` · phase `finishes_interior` · CSI `06 20`

## Scope (2–4 sentences)
Interior trim carpentry: door and window casing, stool and apron, baseboard and shoe, crown, hanging
prehung interior doors, site-built closet shelf-and-rod, and light stair parts (wall handrails). Not in
scope: casework/cabinets (`cabinetry`), architectural millwork packages (`millwork`), closet *systems*
such as wire/laminate kits (`closets_storage`), full stair building and code guards (`stairs_railings`,
permit family building), exterior trim (`siding` / `windows`).

## Existing coverage reconciled
- Hand recipe: `task-buildout/nopermit.ts` case `finish_carpentry` (shared with doors_hardware,
  window_treatments) — one generic step. Pack **complements** (`recipes: []`): adds glossary, hazards,
  QA, owner hold-point checklists, equipment hint, assemblies, quantity rules.
- Catalog codes already seeded: `B-DOOR-INT` (slab + jamb + hardware, hand-seeded from door_count),
  `B-DOOR-EXT`, `B-WIN-TRIM-EA` (exterior window trim, w01). Not redeclared — pack prices only the
  casing around doors and the interior window trim.
- Blueprint template tasks: "Interior trim, doors & hardware" (residential-sf), "Interior trim, doors &
  hardware — all units" (residential-mf).

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| finish_carpentry-ufgs-06-20-00 | UFGS 06 20 00 Finish Carpentry (Aug 2024) | 1 | public_domain | QA (storage, moisture, joints, door frames, stool/apron, base, stair work, shelving, rods) |
| finish_carpentry-awi-aws | ANSI/AWI 0620 / Architectural Woodwork Standards | 4 | proprietary_ref_only | QA reference (crown, caulk) |
| finish_carpentry-jeldwen-jii109 | JELD-WEN JII109 interior prehung door instructions | 5 | manufacturer_public | two-person handling, acclimation, opening square/plumb |
| finish_carpentry-masonite-prehung | Masonite interior prehung door instructions | 5 | manufacturer_public | plumb hinge side, shim behind nails, even gap |
| icc-pa | ICC public access (IRC R311.7.8, R312.1) | 3 | proprietary_ref_only | handrail/guard QA reference only — no code_refs (null permit) |
| ecfr-1926-c/d/e/i/k/x | 29 CFR 1926 subparts | 1 | public_domain | hazards |

## Work steps
None in the pack — the hand recipe's single step stands. A future multi-step recipe (rough-in check →
hang doors → case → base/shoe → crown → closets → punch) would need `supersedes_hand` + snapshots.

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| miter_saw | Miter/table saw blade contact | 1926.300(b)(1) | 3 |
| circular_saw | Portable saw cuts | 1926.304(d) | 3 |
| woodworking_machines | Machine setup | 1926.304(f) | 3 |
| nailer | Pneumatic nailer punctures | 1926.302(b)(3) | 3 |
| air_hose | Hose whip / blow-off cleaning | 1926.302(b)(4) | 2 |
| stepladder | Top-step use | 1926.1053(b)(13) | 3 |
| open_stair | Unprotected stair before rails | 1926.1052(c)(1) | 4 |
| wood_dust | Wood/MDF dust | 1926.55(a) | 2 |
| eye_injury | Flying chips/nails | 1926.102(a)(1) | 2 |
| noise | Saws/compressor | 1926.101(a) | 2 |
| door_lifting | Carrying doors | 1926.21(b)(2) | 2 |
| cord_shock | Temporary power | 1926.404(b)(1) | 3 |
All sections read on law.cornell.edu (eCFR mirror) 2026-10-08.

## QA checklist
14 items (pre-trim readiness, acclimation, blocking, door plumb/gaps/latch, reveal, miter/cope, nails
set & filled, base scribed + shoe after floor, stool & apron, crown, caulk paint-grade only, closet
shelf/rod, handrail/guards — the last is `safety: true`, IRC R311.7.8 / R312.1 cited as reference).

## Inspection / acceptance checkpoints
- `pre_trim_check` — drywall primed, HVAC on, grade decided, acclimated, blocking, flooring sequence, temp stair rails.
- `stair_rail_check` — handrail height/continuity/returns, guards, newels (ES pending — safety).
- `final_walkthrough` — doors, joints, base/shoe, caulk, closets, cleanup.

## Cost basis (all platform-baseline estimate, national 2026)
| Code | Unit | Material ¢ | Labor hr | Equip ¢ | Waste % |
|---|---|---|---|---|---|
| G-FC-CASING-EA | EA (one side) | 1800 | 0.5 | 0 | 10 |
| G-FC-WIN-INT-EA | EA | 3500 | 1.25 | 0 | 10 |
| G-FC-BASE-LF | LF | 180 | 0.05 | 0 | 10 |
| G-FC-CROWN-LF | LF | 250 | 0.09 | 0 | 15 |
| G-FC-CLOSET-SHELF-LF | LF | 900 | 0.15 | 0 | 8 |
| G-FC-HANDRAIL-LF | LF | 1200 | 0.2 | 0 | 10 |

## Quantity rules (residential_sf / residential_mf only)
- `G-FC-CASING-EA` = doors × 1.75 (ceil)
- `G-FC-WIN-INT-EA` = windows × 1
- `G-FC-BASE-LF` = rooms × 40 (ceil)
Crown, closet shelving and handrail have no reliable blueprint fact — estimator adds manually.

## Blueprint callouts (components)
None this wave.

## Open questions → REVIEW_QUEUE
- All six assemblies are platform-baseline estimates.
- Scope overlap: site-built closet shelf vs `closets_storage`; wall handrail vs `stairs_railings` (w16).
- 12 hazards + handrail QA + stair_rail_check items pending ES human translation.
