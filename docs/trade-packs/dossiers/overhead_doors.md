# Dossier — `overhead_doors` (Overhead / Garage Doors)

> Wave: w10 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/overhead_doors.ts` · Status: draft
> Taxonomy: category `envelope` · permit_trade `building` · phase `finishes_exterior` · CSI `08 36`

## Scope (2–4 sentences)
Supplies and installs residential sectional garage doors, commercial sectional and rolling steel doors
(incl. dock doors), pole-barn sliding doors, and the electric operators with their entrapment protection.
Covers opening/jamb checks, tracks or guides, spring counterbalance, operator, weatherseal, testing and
owner hand-over. Does NOT include dock levelers / restraints (`loading_dock_equipment`), the operator power
circuit (`electrical`), opening framing (`framing` / `post_frame`) or man-doors (`exterior_doors`).

## Existing coverage reconciled
- Hand recipe: none (not in `HAND_RECIPE_KEYS`) → NEW-TRADE pattern, 3 recipes.
- Catalog codes already seeded: none for overhead doors (`B-EXTDR-GARAGE-EA` is the garage-to-house man-door — not duplicated).
- Blueprint template tasks: `Install overhead / sliding doors` (pole-barn.ts) → `pole_barn_sliding_overhead`;
  `Overhead dock doors, man-doors & loading bumpers` (industrial.ts) → `commercial_dock_rolling_door`;
  generic "garage door" / "door opener" → `sectional_overhead_door` (its title_re also matches both template titles).

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| overhead_doors-dasma-tds151 | DASMA TDS #151 code inspection guidelines, sectional doors | 4 | association_public | steps, QA, final checklist |
| overhead_doors-dasma-tds167 | DASMA TDS #167 residential door + operator checklist | 4 | association_public | balance/reverse tests, photo eye ≤6 in., control ≥5 ft, release ≤6 ft |
| overhead_doors-dasma-tds181 | DASMA TDS #181 wind-load inspection guidelines | 4 | association_public | wind drawing/label QA |
| overhead_doors-dasma-tds1502 | DASMA TDS #1502 IRC wind load labels | 4 | association_public | R609.4 / R609.4.1 + IBC parity |
| overhead_doors-dasma-tds260 | DASMA TDS #260 rolling steel door install problems | 4 | association_public | rolling door steps + QA |
| overhead_doors-dasma-tds284 | DASMA TDS #284 rolling door winding bars | 4 | association_public | winding bar hazard |
| overhead_doors-dasma-tds182 | DASMA TDS #182 dock doors | 4 | association_public | dock coordination (bollards, bumpers, leveler hand-off) |
| overhead_doors-cpsc-16cfr1211 | 16 CFR 1211 garage door operators | 1 | public_domain | entrapment protection QA, labels |
| overhead_doors-ul325 | UL 325 | 3 | proprietary_ref_only | reference only |
| icc-pa | IRC R309.4, R609.4, R609.4.1; IBC 1709.5.2 | 3 | proprietary_ref_only | code refs |
| ecfr-1926-c/e/h/i/j/k/l/x/z | 29 CFR 1926 subparts | 1 | public_domain | hazards |
| platform-baseline | expert cost baseline | — | platform_estimate | all assembly costs |

## Work steps
- `sectional_overhead_door`: opening/headroom check → stack sections + vertical tracks → horizontal tracks + back-hangs → springs (trained tech, fitted winding bars) → operator + photo eyes/wall control (IRC R309.4) → seal, balance, reverse tests, labels, hand-over. Gate: final (IRC R609.4/R609.4.1, IBC 1709.5.2).
- `commercial_dock_rolling_door` (priority 10): opening/jamb verification → guides/wall angles/tracks → barrel or sections + pre-tension → operator + sensors/constant-pressure → seals, bumpers, test. Gate: final (IBC 1709.5.2).
- `pole_barn_sliding_overhead` (priority 20, pole_barn only): headers/track board → track + hangers → hang leaves, guides, latches → any overhead door per sectional sequence → trim, seal, test. Gate: final.

## Hazards
spring_energy (1926.20(b)(1) — no door-spring-specific 1926 section, controls from DASMA), winding_bar (1926.301(a)),
pinch_points (1926.95(a)), material_storage (1926.250(a)(1)), ladder (1926.1053(b)(1)), lift_platform (1926.452(w)),
operator_lockout (1926.417(a)), cord_shock (1926.404(b)(1)), power_tool (1926.300(b)), silica (1926.1153),
housekeeping (1926.25(a)), hot_work (1926.352(d)).

## QA checklist (15; 9 safety → ES pending)
opening_check, wind_drawing_match, track_fastened, spring_anchor*, spring_containment*, balance_test*, barrel_level,
photo_eye*, contact_reverse*, wall_control*, manual_release*, warning_labels*, wind_label, weatherseal, slider_track.

## Inspection / acceptance checkpoints
- final: install docs/wind drawing on site; wind label; spring pads + tracks to structure; listed operator + reverse tests; release + control placement; warning labels.

## Cost basis (all `estimate`, platform-baseline, 2026)
| Code | Item | Unit | Material ¢ | Labor hr | Equip ¢ | Waste % |
|---|---|---|---|---|---|---|
| B-OHD-RES-16X7-EA | Residential sectional 16x7 insulated steel | EA | 160000 | 6 | 0 | 0 |
| B-OHD-OPENER-EA | Residential opener + eyes + wall control | EA | 40000 | 3 | 0 | 0 |
| B-OHD-COMM-SECT-EA | Commercial sectional 12x14 | EA | 450000 | 12 | 12000 | 0 |
| B-OHD-ROLL-EA | Rolling steel service door 12x12, chain hoist | EA | 550000 | 16 | 15000 | 0 |
| B-OHD-COMM-OPER-EA | Commercial operator + eyes + control station | EA | 220000 | 6 | 6000 | 0 |
| B-OHD-SLIDE-EA | Pole-barn sliding door pair 12x12 | EA | 180000 | 8 | 8000 | 3 |

## Quantity rules
- residential_sf: B-OHD-RES-16X7-EA ×1, B-OHD-OPENER-EA ×1
- pole_barn: B-OHD-SLIDE-EA ×1
- industrial: B-OHD-COMM-SECT-EA ×2, B-OHD-COMM-OPER-EA ×2
- B-OHD-ROLL-EA left manual (no reliable plan fact).

## Blueprint callouts (components)
None this wave.

## Open questions → REVIEW_QUEUE
- IBC 1709.5.2 section number inferred (DASMA TDS 1502 confirms the IBC carries the label requirement but not the number).
- IRC R309.4 (opener listing to UL 325) from memory of 2015+ IRC — verify against adopted edition.
- No public manufacturer install manual verified (Clopay/Wayne Dalton/LiftMaster pages 404/403 to scripts).
- slider_track QA has no public source (platform estimate).
