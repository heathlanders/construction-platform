# Dossier — `exterior_doors` (Exterior Doors)

> Wave: w01 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/exterior_doors.ts` · Status: draft
> Taxonomy: category `envelope` · permit_trade `building` · phase `finishes_exterior` · CSI `08 10`

## Scope (2–4 sentences)
Sets and seals exterior doors: pre-hung entry/service doors, patio doors (sliding or hinged), storm doors and
the garage-to-house door. Owns the sill pan, jamb/head flashing integrated into the WRB, shimming, fastening,
air-sealing the frame gap, entry hardware and adjustment. Does NOT frame the rough opening (framing), install
the WRB field or siding (siding), interior trim/casing (finish_carpentry), overhead/garage doors (overhead_doors)
or commercial storefront (glazing/curtain_wall).

## Existing coverage reconciled
- Hand recipe: none → pack is the new-trade recipe (decks pattern).
- Catalog codes already seeded: `B-DOOR-EXT` (EA, unit + install, migration 0030) — referenced, not redeclared.
  The hand estimating seeder already emits `B-DOOR-EXT` at ≈25% of `door_count`; pack quantity rules reuse that split.
- Blueprint template tasks hitting this trade: commercial "Exterior doors, canopies & signage" (matched by
  `prehung_entry_door`). Residential "Exterior door & window installation" and pole-barn "Install entry / man doors &
  windows" are tagged `windows`; the regex would also match them if retagged.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| doe-basc-extdr-flashed | BASC — Windows and Doors Are Fully Flashed | 1 | gov_open | flashing sequence QA |
| doe-basc-extdr-pan | BASC — Pan Flashing Doors/Windows | 1 | gov_open | sill pan QA |
| cpsc-16cfr1201-doors | 16 CFR 1201 — Architectural Glazing Materials | 1 | public_domain | safety glazing QA |
| ecfr-1926-c/d/e/i/k/m/x/z | 29 CFR 1926 subparts | 1 | public_domain | hazards |
| thermatru-prehung-install | Therma-Tru — Pre-hung Door Systems install | 5 | manufacturer_public | steps, opening size, sealant, hinge screws |
| andersen-patio-install | Andersen 200 Series Hinged Patio Door guide (0005481) | 5 | manufacturer_public | patio steps, heavy-lift, sill support |
| icc-pa | IRC R311.2/R311.3/R308.4.1/R302.5.1/R609/R703.4/N1102.4 | 3 | proprietary_ref_only | code refs (section + paraphrase only) |
| platform-baseline | Platform cost baseline | — | platform_estimate | all assembly costs |

## Work steps (draft → pack recipes)
**prehung_entry_door** (`\b(exterior|entry|front|rear|back|side|service|man|garage)\b…doors?` or "door(s) install")
1. **Check the door unit and the rough opening** — size, plumb/square/plane, subfloor level; cut WRB, head flap up. QA opening_size, opening_plumb_square, subfloor_level.
2. **Install the sill pan and jamb flashing** — R703.4. QA sill_pan, flashing_shingle.
3. **Set, shim and fasten the door** — R609. QA sealant_brickmould, hinge_screws, reveal_operation.
4. **Flash the head and air-seal around the jambs** — R703.4, N1102.4. Gate: insulation. QA flashing_shingle, foam_low_expansion.
5. **Install hardware, adjust and check life-safety items** — R311.2, R311.3, R308.4.1, R302.5.1. Gate: final.

**patio_sliding_door** (priority 10; patio|sliding|slider|gliding|french door)
1. Check the patio door unit and opening · 2. Install the sill pan and jamb flashing · 3. Set the unit, shim and fasten
· 4. Flash the head and air-seal around the jambs (gate insulation) · 5. Adjust panels, hardware and check glazing (gate final).

## Hazards (draft → pack hazards)
| id | Hazard | Controls | OSHA ref | Sev |
|---|---|---|---|---|
| heavy_lift | Strain/crush setting heavy units | enough people/cart; brace until fastened | 1926.20(b) | 2 |
| glass_cut | Glass breakage cuts | cut gloves, eye protection, carry upright | 1926.95(a) | 3 |
| power_tool | Saw/drill injuries | guards, clamp, de-energize to change | 1926.300(b) | 3 |
| nailer | Nailer punctures | safety contact working, disconnect air | 1926.302(b) | 2 |
| cord_shock | Shock from cords | GFCI, daily cord check | 1926.404(b)(1) | 3 |
| ladder | Ladder fall at head/transom | firm footing, 3 points | 1926.1053(b)(1) | 3 |
| fall_opening | Fall through upper-floor door opening | guard/block opening; fall protection ≥6 ft | 1926.501(b)(14) | 4 |
| eye | Debris/foam in eyes | safety glasses | 1926.102(a)(1) | 2 |
| chem_sealant | Foam/sealant exposure | SDS, ventilation, gloves | 1926.59(h) | 2 |
| lead_paint | Lead dust on pre-1978 tear-out | assume lead, wet/hand methods, HEPA | 1926.62(d) | 3 |
| silica | Silica cutting concrete/masonry sill | water or shrouded tool | 1926.1153 | 3 |
| housekeeping | Trips on packaging/shims | clean as you go | 1926.25(a) | 1 |

All section numbers confirmed present in the eCFR Title 29 structure (2026-09-01).

## QA checklist
- [ ] Opening ~1/2 in. taller, 1/2–3/4 in. wider than frame — Therma-Tru
- [ ] Opening plumb, square (diagonals), in plane (string test) — Therma-Tru
- [ ] Subfloor level, flat, solid — Therma-Tru
- [ ] Sill pan with back/end dams, sealed, lapped over WRB — BASC
- [ ] Flashing shingle-lapped pan → jambs → head; WRB flap over head — BASC
- [ ] Continuous sealant behind brickmould; none under sill on a pan — Therma-Tru
- [ ] Hinge jamb shimmed and long-screwed through hinges — Therma-Tru
- [ ] Patio sill continuously supported, level — Andersen
- [ ] Even reveal, free operation, weatherstrip contact — Therma-Tru/Andersen
- [ ] Low-expansion foam/backer rod; jambs not bowed — Therma-Tru/BASC
- [ ] (safety) Safety-glazing mark on every lite — 16 CFR 1201
- [ ] (safety) Egress door side-hinged, sized per adopted code — IRC R311.2
- [ ] (safety) Egress door opens from inside without key — IRC R311.2
- [ ] (safety) Landings at exterior doors — IRC R311.3
- [ ] (safety) Garage-to-house door type + self-closer per edition — IRC R302.5.1

## Inspection / acceptance checkpoints
- sheathing: pan/jamb/head flashing visible and lapped into WRB before siding.
- insulation: frame gaps air-sealed.
- final: egress door, landings, safety-glazing marks, garage-to-house door + closer.

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| B-EXTDR-SILLPAN-EA | Sill pan + flashing tape per door | EA | 6500 | 0.75 | 0 | 5 | platform-baseline, estimate |
| B-EXTDR-PATIO-EA | 6 ft vinyl slider supply + install | EA | 120000 | 6.0 | 0 | 0 | platform-baseline, estimate (2-person ~3 hr) |
| B-EXTDR-STORM-EA | Full-view storm door | EA | 30000 | 2.5 | 0 | 0 | platform-baseline, estimate |
| B-EXTDR-LOCKSET-EA | Handleset + deadbolt | EA | 15000 | 0.75 | 0 | 0 | platform-baseline, estimate |
| B-EXTDR-GARAGE-EA | Garage-to-house door + self-closing hinges | EA | 45000 | 3.0 | 0 | 0 | platform-baseline, estimate |
| B-DOOR-EXT | (existing, 0030) entry door unit + install | EA | — | — | — | — | referenced only |

## Quantity rules
- `B-EXTDR-SILLPAN-EA` = doors × 0.25 (round) — one pan per exterior door, same 25% split as B-DOOR-EXT
- `B-EXTDR-LOCKSET-EA` = doors × 0.25 (round)
- `B-EXTDR-PATIO-EA` = doors × 0.08 (round) — one slider when ≈7+ scheduled doors; estimator reduces B-DOOR-EXT by one
- Storm + garage-to-house doors: no reliable fact basis → manual lines.

## Blueprint callouts (components)
- none (door schedules already feed `door_count`).

## Open questions → REVIEW_QUEUE
- `doors` basis counts interior + exterior doors; the 0.25 / 0.08 multipliers are assumptions — an exterior-door
  count (or door-schedule type column) in facts would remove the guess.
- Patio rule double-counts against B-DOOR-EXT unless the estimator removes one entry door.
- All 5 new assemblies are `estimate`-only costs.
- pack:smoke uses a generic task title, so it only exercises the first recipe; patio recipe matching verified by hand.
- Generic equipment rules match `/fram/` in step titles — step titles avoid "frame" to dodge a spurious forklift.
- Code-edition-specific values (egress clear width, landing step-down, garage door self-closer) intentionally not
  stored as numbers (ICC is ref-only).
