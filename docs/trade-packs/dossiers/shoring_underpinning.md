# Dossier — `shoring_underpinning` (Shoring / Underpinning)

> Wave: w11 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/shoring_underpinning.ts` · Status: draft
> Taxonomy: category `sitework` · permit_trade `building` · phase `site_prep` · CSI `31 50`

## Scope (2–4 sentences)
Earth retention for deep excavations (soldier pile & lagging, sheet piling, soil nail walls, tiebacks), trench
protective systems (trench shields, hydraulic/timber shoring) and underpinning of adjacent footings in sequenced pits,
plus movement monitoring and removal/abandonment. Not here: slab reshoring under formwork (`formwork`,
B-FORM-SHORE-SF), residential push/helical piers and wall anchors on settling homes (`foundation_repair`, B-FDR-*),
permanent piles/caissons (`deep_foundations`), mass excavation and backfill (`excavation`), shotcrete as its own
scope (`shotcrete`).

## Existing coverage reconciled
- Hand recipe: none (not in HAND_RECIPE_KEYS) → NEW-TRADE pattern, 3 recipes.
- Catalog codes already seeded: none for this trade. Related, not duplicated: B-FORM-SHORE-SF, B-FDR-*, B-EXC-*,
  B-SHOT-*. New prefix `B-SHO-` (distinct from shotcrete's `B-SHOT-`).
- Blueprint template tasks hitting this trade: none.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| ecfr-1926-p | 29 CFR 1926 Subpart P — Excavations (1926.651, .652, App. C/D/F) | 1 | gov_open | hazards, design rules, removal, shields, adjacent structures, inspections |
| ecfr-1926-o | 1926.603 pile driving equipment | 1 | gov_open | pile hammer hazard |
| ecfr-1926-q | 1926.701(c) post-tensioning | 1 | gov_open | jack / stressing exclusion zone |
| ecfr-1926-cc | 1926.1424 work area control | 1 | gov_open | swing radius |
| ecfr-1926-z | 1926.1153 silica | 1 | gov_open | shotcrete / drilling dust |
| shoring_underpinning-fhwa-gec7 | FHWA GEC 7 Soil Nail Walls (NHI-14-007) | 1 | public_domain | top-down sequence, lift height, proof ≥5% |
| shoring_underpinning-fhwa-gec4 | FHWA GEC 4 Ground Anchors (IF-99-015) | 1 | public_domain | performance/proof tests, lock-off, 0.6 m overexcavation limit, lagging, monitoring |
| shoring_underpinning-wisdot-ss-511 | WisDOT Std Spec 511 Temporary Shoring | 1 | gov_open | PE-sealed design, removal + backfill, SF-of-face measurement |
| excavation-wisdot-aup | WisDOT Average Unit Price List (reused) | 2 | gov_open | 511.1200 $36.93 / $36.24 / $99.19 per SF |
| icc-pa | ICC public access (IBC 1804.1, 1705.6, 3307.1) | 3 | proprietary_ref_only | code refs |

## Work steps (draft → pack recipes)
`earth_retention_system` (title_re shoring / soldier pile / lagging / sheet pil / soil nail / tieback / ground anchor /
earth retention / excavation support, priority 10): design + neighbor survey (IBC 3307.1, 1804.1) → monitoring
baselines → install piles/sheets → excavate in lifts and support each lift → test + lock off anchors/nails →
monitor, then remove bottom-up with backfill. No gate (shoring is not an AHJ permit inspection) — hold points in
`inspection_checklists` (`shoring_design_review`, `anchor_testing`, `movement_monitoring`).

`underpin_adjacent_footing` (title_re underpin, priority 30): design/sequence/survey → one pit at a time → pit bottom
verified (**gate: footing**, IBC 1705.6 — an underpinning pit is new footing bearing) → pour + dry-pack → backfill,
read, next pit.

`trench_protective_system` (trench box/shield/shoring, hydraulic/speed shore, priority 20): select system (App C
timber tables, App D / tabulated data, PE over 20 ft) → inspect equipment → set before entry → remove bottom-up.

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| cave_in | cave-in | 1926.652(a)(1) | 4 |
| shoring_design | system used outside design | 1926.652(c) | 4 |
| undermining | adjacent footing undermined | 1926.651(i)(2) | 4 |
| support_removal | removal collapse / struck by members | 1926.652(e)(1) | 3 |
| shield_movement | inside shield while moved | 1926.652(g)(1) | 4 |
| loose_face | soil falling from face | 1926.651(j)(1) | 3 |
| competent_inspection | missed failure signs | 1926.651(k)(1) | 3 |
| utility_strike | drilling into utilities | 1926.651(b)(1) | 4 |
| pile_hammer | hammer / leads | 1926.603(a)(5) | 4 |
| jack_tensioning | tendon/jack failure during test | 1926.701(c)(1) | 4 |
| silica | shotcrete / drilling dust | 1926.1153 | 3 |
| struck_by_equipment | rig swing radius | 1926.1424(a)(2) | 3 |

## QA checklist
15 items — design on site, locates, preconstruction survey, monitoring baseline + readings, lift height, lagging tight,
no overexcavation below unlocked rows, anchor tests, nail proof ≥5%, pit sequence, pit bearing verified, dry-pack,
equipment inspected, removal with backfill. 8 safety (ES pending), 7 translated.

## Inspection / acceptance checkpoints
- footing: underpinning pit bearing, pit order, pit safe to enter.
- shoring_design_review / anchor_testing / movement_monitoring: owner/engineer hold points (not AHJ gates).

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| B-SHO-SPL-SF | Soldier pile & lagging (temp) | SF face | 1200 | 0.15 | 1000 | 5 | derived — WisDOT 511.1200 FY23/24 ≈ $36.6/SF (FY25 $99 outlier excluded) |
| B-SHO-SNAIL-SF | Soil nail wall + temp shotcrete | SF face | 1100 | 0.2 | 900 | 10 | estimate |
| B-SHO-TIEBACK-EA | Tieback, tested + locked off | EA | 90000 | 16 | 120000 | 5 | estimate |
| B-SHO-TBOX-DAY | Trench shield rental + setting | DAY | 0 | 0.5 | 25000 | 0 | estimate |
| B-SHO-UNDERPIN-EA | Underpinning pit | EA | 45000 | 20 | 15000 | 10 | estimate |

## Quantity rules
None. Shoring and underpinning are driven by the geotechnical report and site constraints (adjacent buildings, dig
depth), not by anything the blueprint extractor reports; any `const` allowance would guess scope on every project.

## Blueprint callouts (components)
None this wave.

## Open questions → REVIEW_QUEUE
- UFGS 31 50 00 (Excavation Support and Protection) not cited — wbdg.org pages are JS-rendered and the PDF returned 403, so content could not be verified.
- Costs other than B-SHO-SPL-SF are platform estimates.
- Inspection checklist keys `shoring_design_review`, `anchor_testing`, `movement_monitoring` are descriptive (no AHJ inspection type exists).
