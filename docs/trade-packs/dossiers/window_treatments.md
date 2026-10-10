# Dossier — `window_treatments` (Window Treatments)

> Wave: w10 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/window_treatments.ts` · Status: draft
> Taxonomy: category `interior` · permit_trade `null` · phase `finishes_interior` · CSI `12 20`

## Scope (2–4 sentences)
Measures, orders and installs interior window coverings once painting and finishing are done:
horizontal/vertical blinds, roller and cellular shades, motorized shades and drapery track. Line-voltage
power, low-voltage cabling and keypad boxes for motorized shades belong to the electrician / low_voltage
trade; blocking and shade pockets belong to framing/drywall; window units belong to `windows`.
No AHJ permit path — no gates and no code refs; hold points are owner/GC checkpoints.

## Existing coverage reconciled
- Hand recipe: `task-buildout/nopermit.ts` (shared `finish_carpentry`/`doors_hardware`/`window_treatments`
  case — one generic finish step) → pack **complements** (recipes: []). The hand step's wording is
  carpentry-flavoured (miters, finish nailer); a dedicated pack recipe with `supersedes_hand` would be
  strictly better — logged as `scope` in REVIEW_QUEUE.
- Catalog codes already seeded: none for window coverings (`G-FC-WIN-INT-EA` is interior trim, `B-WIN-*`
  are window units/flashing/trim).
- Blueprint template tasks hitting this trade: none.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| window_treatments-ecfr-16cfr1260 | 16 CFR 1260 — operating cords on custom window coverings | 1 | public_domain | no-accessible-cord QA, loop restraining device, scope (custom vs stock), child-risk findings |
| window_treatments-cpsc-education | CPSC Window Covering Safety Education Center | 1 | public_domain | owner cord-safety briefing |
| window_treatments-wcma-a100 | ANSI/WCMA A100.1-2018 | 3 | proprietary_ref_only | reference for stock products only |
| window_treatments-wcsc | Window Covering Safety Council | 4 | association_public | cordless message (paraphrase) |
| window_treatments-ufgs-12-21-00 | UFGS 12 21 00 Window Blinds | 1 | public_domain | field measure, after-paint, level/plumb, wand reach, jamb clearance, hold-downs, overlap, clean/adjust |
| window_treatments-ufgs-12-24-13 | UFGS 12 24 13 Roller Window Shades | 1 | public_domain | motorized (120 V vs Class 2), limits, no light gaps, pockets, NFPA 701 fabric |
| window_treatments-hd-duette-std | Hunter Douglas Duette cordlock instructions | 5 | manufacturer_public | bracket count/placement, drywall anchors, child-safety warnings |
| window_treatments-hd-duette-easyrise | Hunter Douglas Duette EasyRise instructions | 5 | manufacturer_public | cord tensioner is a safety device, fastened to wall/frame |
| ecfr-1926-c/e/i/k/l/x/z | 29 CFR 1926 subparts | 1 | public_domain | hazards |

## Work steps (draft → pack recipes)
None — COMPLEMENT pattern. The hand recipe produces the single finish step.

## Hazards (draft → pack hazards)
| id | Hazard | Controls | OSHA ref | Sev |
|---|---|---|---|---|
| stepladder | Fall from stepladder at window head | no top step; move ladder | 1926.1053(b)(13) | 3 |
| ladder_footing | Ladder slips on finished floors | stable level surface, slip-resistant feet | 1926.1053(b)(6) | 3 |
| aerial_lift | Fall from lift at tall commercial glass | stand on floor, restraint, load limit | 1926.453(b)(2)(iv) | 4 |
| hidden_utilities | Drilling into wiring/sensors in head | scan, ask, short screws | 1926.416(a)(3) | 4 |
| motor_power | Shock connecting 120 V motor | electrician makes line-voltage connections | 1926.416(a)(1) | 4 |
| silica_drilling | Silica from masonry heads | Table 1 controls, HEPA | 1926.1153 | 3 |
| falling_headrail | Headrail/rod pulls out of drywall | framing/blocking, maker anchors, full bracket count | 1926.21(b)(2) (derived) | 3 |
| drill_tool | Tool shock/wrist | double-insulated, two hands | 1926.302(a)(1) | 2 |
| cord_shock | Extension cord shock | GFCI | 1926.404(b)(1) | 3 |
| eye_debris | Dust overhead | safety glasses | 1926.102(a)(1) | 2 |
| housekeeping | Packaging/offcuts | clean as you go | 1926.25(a) | 1 |

Child strangulation is an occupant hazard, not a worker one — carried in safety QA + the `child_cord_safety` checkpoint.

## QA checklist
15 items — field measure, after finishes, placement schedule, brackets secure (safety), level/plumb,
no accessible cords (safety, 16 CFR 1260), loop tensioned (safety), warnings left (safety), owner
cord briefing (safety), controls reach, jamb overlap/pocket, clearance & hold-downs, motor commissioning,
fabric fire rating, clean & adjust.

## Inspection / acceptance checkpoints
- `pre_install_verify`: field measurements vs schedule; paint done; blocking/pockets; motorized power ready.
- `child_cord_safety`: no long cords or loose loops (16 CFR 1260.2); loops tensioned; labels + owner briefing.
- `final_walkthrough`: level/secure/full travel; motor limits and controls demonstrated; clean + handover.

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| G-WT-BLIND-EA | Cordless 2 in. faux wood blind | EA | 7500 | 0.5 | 0 | 0 | platform-baseline, estimate |
| G-WT-ROLLER-EA | Manual roller shade (cordless / tensioned chain) | EA | 20000 | 0.6 | 0 | 0 | platform-baseline, estimate |
| G-WT-MOTOR-EA | Motorized roller shade, LV/battery, programmed | EA | 75000 | 1.5 | 0 | 0 | platform-baseline, estimate; power by electrician excluded |
| G-WT-DRAPE-TRACK-LF | Drapery track / traverse rod | LF | 1800 | 0.2 | 0 | 5 | platform-baseline, estimate |

## Quantity rules
- `G-WT-BLIND-EA` = windows × 1 (residential_sf / residential_mf).
- `G-WT-ROLLER-EA` = windows × 1 (commercial / industrial).
- No overlap with `seedGeneral` (paint/clean/tile/cabinets only) or existing window packs (`B-WINDOW`, `B-WIN-*`, `G-FC-WIN-INT-EA`, `G-PNT-TRIM-EXT-LF`).

## Blueprint callouts (components)
- none this wave.

## Open questions → REVIEW_QUEUE
- Safety ES pending human translation: 11 hazards, 5 QA items, 3 `child_cord_safety` checklist items.
- All 4 assembly costs are `estimate`.
- Lutron install guides (assets.lutron.com) block scripted fetch — not cited; CPSC / WCMA / WCSC answer 403 (confirmed via search / eCFR IBR listing).
- Scope: hand recipe wording is carpentry-oriented; consider a `supersedes_hand` recipe in a later pass.
