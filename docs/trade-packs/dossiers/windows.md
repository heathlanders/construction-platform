# Dossier — `windows` (Window Installation)

> Wave: w01 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/windows.ts` · Status: draft
> Taxonomy: category `envelope` · permit_trade `building` · phase `finishes_exterior` · CSI `08 50`

## Scope (2–4 sentences)
Sets exterior window units: new-construction flanged windows lapped into the water-resistive barrier
(sill pan, back dam, jamb/head flashing, interior air seal) and replacement (insert) windows in existing
frames. Owns the egress / safety-glazing / window-fall-protection checks at final. Hands off: rough
openings to `framing`, WRB to `siding`/`air_barrier`, foundation cuts for egress to `concrete_cutting`,
storefront/curtain wall to `glazing`/`curtain_wall`, skylights to `skylights`, interior casing to
`finish_carpentry`.

## Existing coverage reconciled
- Hand recipe: none → pack recipe produces the work steps (new-trade pattern, like `decks`).
- Catalog codes already seeded: `B-WINDOW` (EA, supply + install) — referenced in `quantity_rules`, not redeclared.
- Blueprint template tasks hitting this trade: "Exterior door & window installation" (residential-sf),
  "Exterior doors, windows & balcony railings" (residential-mf), "Install entry / man doors & windows"
  (pole-barn) — all matched by `\bwindows?\b`. Replacement titles ("Replace windows", "Window replacement")
  match `replacement_insert` (priority 10).
- Core component token `egress_window` (parse-sheets) drives the egress-well quantity rule; no new components.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| doe-basc-win-flashed | BASC — Windows and Doors are Fully Flashed | 1 | gov_open | flashing sequence, QA (4 in / 1 in laps, unsealed sill flange, modified-I cut) |
| fma-aama-wdma-500 | FMA/AAMA/WDMA 500-16 (BASC listing) | 4 | proprietary_ref_only | reference only (exterior-foam walls) |
| astm-e2112 | ASTM E2112 installation practice | 3 | proprietary_ref_only | reference only |
| cfr-16-1201 | 16 CFR 1201 — architectural glazing | 1 | public_domain | safety-glazing mark QA |
| energy-star-windows | ENERGY STAR residential windows | 1 | gov_open | label / rating QA |
| andersen-support, pella-support | Manufacturer support / installation instructions | 5 | manufacturer_public | RO check, shimming, fastening, perimeter seal |
| ecfr-1926-{m,x,l,c,e,i,d,k} | 29 CFR 1926 | 1 | public_domain | hazards |
| icc-pa | IRC R308, R310, R312.2, R612, R703.4 | 3 | proprietary_ref_only | code refs (section + paraphrase) |
| platform-baseline | Platform cost baseline | — | platform_estimate | all new assembly costs |

## Work steps (draft → pack recipes)
**new_construction_flanged** (`\bwindows?\b`)
1. **Check the rough opening and cut the WRB** — QA ro_size_square, wrb_modified_i.
2. **Install the sill pan with a back dam** — QA sill_pan_backdam.
3. **Set, shim and fasten the window** — head/jamb sealant only. QA sill_flange_unsealed, plumb_level_square, fasteners_per_mfr.
4. **Flash the jambs and head, lap the WRB over** — Code R703.4, R612. Gate: `sheathing`. QA jamb_head_lap, wrb_over_head.
5. **Air-seal inside and check egress and glazing** — Code R308, R310, R312.2. Gate: `final`. QA interior_air_seal, safety_glazing_mark, egress_opening, fall_protection_sill, labels_left.

**replacement_insert** (replace/insert/retrofit + window, priority 10)
1. **Protect the room and remove the old sashes** — lead-safe setup. QA lead_safe_setup.
2. **Check and repair the existing frame** — QA existing_frame_sound, ro_size_square.
3. **Set and fasten the insert** — QA plumb_level_square, fasteners_per_mfr.
4. **Insulate, trim and seal** — QA interior_air_seal, exterior_perimeter_seal.
5. **Verify egress, glazing and fall protection** — Gate: `final`. Code R310, R308.

## Hazards (draft → pack hazards)
| id | Hazard | Controls | OSHA ref | Sev |
|---|---|---|---|---|
| fall_opening | Fall through upper-floor opening | guard / PFAS (6 ft drop, sill < 39 in) | 1926.501(b)(14) | 4 |
| ladder | Ladder slip | 3 ft extension, footing | 1926.1053(b)(1) | 3 |
| scaffold_fall | Scaffold fall | guardrail/PFAS > 10 ft | 1926.451(g)(1) | 4 |
| aerial_lift | Ejection from lift | harness + lanyard | 1926.453(b)(2)(v) | 4 |
| heavy_lift | Strain/crush handling units | two-person / mechanical | 1926.20(b) | 3 |
| glass_cut | Glass / edge cuts | cut-resistant gloves, sleeves | 1926.95(a) | 3 |
| eye_flying | Flying chips/glass | safety glasses | 1926.102(a)(1) | 2 |
| nailer | Nailer puncture | trigger safety | 1926.302(b) | 3 |
| power_tool | Saw cuts | guards | 1926.300(b) | 3 |
| lead_paint | Lead from old painted parts | contain, wet, HEPA | 1926.62 | 3 |
| chem_sealant | Foam/sealant irritation | SDS, ventilate, gloves | 1926.59 | 2 |
| cord_shock | Shock outdoors | GFCI | 1926.404(b)(1) | 3 |

All OSHA paragraphs checked on eCFR (API) 2026-10-08.

## QA checklist
16 items (12 non-safety translated, 4 safety pending human ES): RO size/square, modified-I WRB cut, sill pan +
back dam, unsealed bottom flange, plumb/level/square + operation, fasteners per mfr, 4 in / 1 in flashing laps,
WRB over head flashing, interior air seal, replacement perimeter seal, existing frame sound, energy labels left
on; safety: safety-glazing mark, egress opening, window fall protection, lead-safe setup.

## Inspection / acceptance checkpoints
- `sheathing`: sill pans visible; jamb/head flashing + WRB lapped; fastening per instructions.
- `final`: egress openings, safety-glazing marks, fall-protection devices, energy labels.

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| B-WIN-FLASH-EA | Flashing per opening | EA | 3000 | 0.5 | 0 | 10 | platform-baseline, estimate (~25 LF tape + pan + sealant + foam) |
| B-WIN-TRIM-EA | Exterior trim + cap flashing | EA | 5000 | 1.25 | 0 | 10 | platform-baseline, estimate (~18 LF 1x4 PVC/FC) |
| B-WIN-REPL-EA | Replacement insert window ≈3x5 | EA | 45000 | 2.5 | 0 | 0 | platform-baseline, estimate |
| B-WIN-EGRESS-WELL-EA | Egress well + ladder + stone + cover | EA | 60000 | 6 | 15000 | 5 | platform-baseline, estimate (mini-excavator share) |

## Quantity rules
- `B-WINDOW` = windows × 1 (existing catalog; hand seeder usually emits it first)
- `B-WIN-FLASH-EA` = windows × 1
- `B-WIN-TRIM-EA` = windows × 1 (drop if siding trims openings)
- `B-WIN-EGRESS-WELL-EA` = component `egress_window` × 1 (until the plan count is confirmed)

## Blueprint callouts (components)
- none this wave (`egress_window` is a core token).

## Open questions → REVIEW_QUEUE
- All four new assembly costs are `estimate`-only.
- 12 hazards + 4 safety QA need professional ES.
- FGIA InstallationMasters / fgiaonline.org blocks scripted checks (403) — not cited; ASTM E2112 and FMA/AAMA/WDMA 500 cited reference-only.
- Andersen/Pella cited at their support-center pages (per-product PDFs vary); Marvin installation pages 404'd — not cited.
- Trim may double-count with the siding pack; estimator to choose.
