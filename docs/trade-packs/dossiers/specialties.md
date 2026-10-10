# Dossier — `specialties` (Div 10 Specialties (Accessories / Lockers / Extinguisher Cabinets))

> Wave: w16 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/specialties.ts` · Status: draft
> Taxonomy: category `specialty` · permit_trade `null` · phase `finishes_interior` · CSI `10`

## Scope (2–4 sentences)
Installs Division 10 items: restroom accessories (grab bars, dispensers, mirrors, hooks, shelves), corner
guards / wall guards / FRP wall panels, lockers, markerboards and tackboards, mailboxes (curbside and cluster
box units) and flagpoles. Blocking is built by framing/metal studs (this trade verifies it before drywall);
toilet partitions belong to `toilet_partitions`; fire extinguisher cabinets belong to `fire_protection_special`
(`B-FPS-EXT-CAB-EA`); CBU pads and flagpole footings may be by concrete/sitework. No AHJ permit path — no gates,
no code refs; ADA and blocking hold points are owner/GC checkpoints.

## Existing coverage reconciled
- Hand recipe: none → NEW-TRADE pattern (3 recipes).
- Catalog codes already seeded: none for Div 10 accessories/lockers/CBUs (`B-FPS-EXT-CAB-EA` is extinguisher
  cabinets — not duplicated).
- Blueprint template tasks hitting this trade: none ('Restroom accessories, partitions & casework' is owned by
  `toilet_partitions`).

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| millwork-access-board-ada / plumbing-ada-2010 | 2010 ADA Standards (Access Board text / DOJ) | 1 | public_domain | 307.2, 308, 309.4, 603.3/603.4, 604.5, 604.7, 609.2–609.8, 225.2.1/811 |
| specialties-ufgs-10-28-13 | UFGS 10 28 13 Toilet Accessories | 1 | public_domain | install to blocking/backplates, protection, sealing, cleaning |
| specialties-ufgs-10-26-00 | UFGS 10 26 00 Wall and Door Protection | 1 | public_domain | corner guards, adhesive cure, bracket spacing, panels |
| specialties-ufgs-10-51-13 | UFGS 10 51 13 Lockers | 1 | public_domain | align, bolt together, anchor, adjust, number |
| specialties-ufgs-10-11-00 | UFGS 10 11 00 Visual Display Units | 1 | public_domain | mounting height definition, reinforcing, after paint |
| specialties-usps-mailboxes | USPS — How to Install a Mailbox | 1 | gov_open | curbside height/setback/post depth, postmaster approval |
| specialties-salsbury-cbu | Salsbury CBU site prep + installation | 5 | manufacturer_public | pad, anchors, two-person lift, level |
| ecfr-1926-c/d/e/i/k/p/x/z | 29 CFR 1926 subparts | 1 | public_domain | hazards |

## Work steps (draft → pack recipes)
- `restroom_accessories` (title_re `accessor|grab bar|\bmirrors?\b`): confirm blocking before drywall → lay out at ADA
  heights → install on blocking/backplates → load-check every grab bar (250 lb, ADA 609.8) → clean and hand over.
- `wall_protection_lockers_boards` (title_re `corner guard|wall protection|\bFRP\b|locker|markerboard|tackboard|whiteboard|specialt`):
  verify backing/finishes → corner guards, wall guards, FRP → set/anchor/bolt lockers → hang boards.
- `site_specialties` (title_re `mailbox|flagpole|\bCBU\b`): postmaster approval + 811 → pad/footing → anchor/level → locks and keys.

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| ladder_top_step | stepladder fall | 1926.1053(b)(13) | 3 |
| hidden_utilities | drilling into live wiring/piping | 1926.416(a)(3) | 4 |
| silica_drilling | silica from masonry/tile/concrete drilling | 1926.1153 | 3 |
| drill_tool | power tool shock/wrist | 1926.302(a)(1) | 2 |
| cord_shock | cords in wet restrooms | 1926.404(b)(1) | 3 |
| eye_debris | chips | 1926.102(a)(1) | 2 |
| adhesive_vapor | solvent adhesive vapors | 1926.59 | 2 |
| sharp_edges | stainless/FRP edges | 1926.95(a) | 2 |
| heavy_tipping | locker bank / CBU tip-over (derived) | 1926.21(b)(2) | 3 |
| falling_items | grab bar pull-out (derived) | 1926.21(b)(2) | 3 |
| buried_utilities | digging pads/footings | 1926.651(b)(1) | 4 |
| housekeeping | trips/cuts from packaging | 1926.25(a) | 1 |

## QA checklist
15 items — blocking, ADA heights, grab bar layout/spacing/strength (safety), dispenser reach, protrusion (safety),
fastening to backing, corner guards, FRP bond, lockers anchored (safety), accessible lockers, postmaster approval,
curbside height, CBU anchoring.

## Inspection / acceptance checkpoints
- blocking_before_drywall · ada_mounting_heights · mailbox_site_approval · final_walkthrough

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| G-SPC-TOIL-ACC-SET-EA | restroom accessory set | EA | 120000 | 4 | 0 | 0 | platform-baseline estimate |
| G-SPC-GRAB-BAR-EA | stainless grab bar 36–42 in. | EA | 6500 | 0.75 | 0 | 0 | estimate |
| G-SPC-CORNER-GUARD-EA | corner guard 4 ft | EA | 4500 | 0.4 | 0 | 0 | estimate |
| G-SPC-FRP-SF | FRP panel w/ adhesive + trim | SF | 220 | 0.04 | 0 | 10 | estimate |
| G-SPC-LOCKER-EA | steel locker per opening | EA | 26000 | 0.75 | 0 | 0 | estimate |
| G-SPC-CBU-EA | cluster box unit on pedestal (pad excl.) | EA | 220000 | 4 | 0 | 0 | estimate |

## Quantity rules
- `G-SPC-TOIL-ACC-SET-EA` = const × 2 (commercial/industrial) — two restrooms
- `G-SPC-GRAB-BAR-EA` = const × 4 (commercial/industrial) — side + rear bar at one accessible WC per restroom
- `G-SPC-CBU-EA` = const × 1 (residential_mf)

## Blueprint callouts (components)
- none this wave.

## Open questions → REVIEW_QUEUE
- CBU compartment/lock height limits (15/28/48/67 in.) seen only on vendor FAQs; USPS-B-1118 / developer guide not
  publicly text-readable — omitted until a primary USPS source is found.
- Flagpole foundations/wind design: no public source; steps defer to engineered detail + maker.
- All G-SPC- costs are platform-baseline estimates.
- 12 hazards + 5 safety QA + several checklist items pending human ES translation.
