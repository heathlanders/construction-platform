# Dossier — `skylights` (Skylights)

> Wave: w09 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/skylights.ts` · Status: draft
> Taxonomy: category `envelope` · permit_trade `building` · phase `roofing` · CSI `08 62`

## Scope (2–4 sentences)
Frames roof openings and installs residential deck-mounted and curb-mounted skylights / roof windows,
tubular daylighting devices (TDDs), and commercial unit skylights and smoke vents on curbs, including the
flashing kit or curb flashing, underlayment wrap, light shaft insulation and finish, fall screens, and
smoke-vent release tests. Hand-offs: the roof covering and membrane are the roofer's (the pack only covers
the skylight's own flashing kit / curb counterflashing); smoke-vent wiring to the fire alarm is the
fire-alarm trade's; structural framing of large commercial openings follows the structural drawings.

## Existing coverage reconciled
- Hand recipe: none (`skylights` is not in `HAND_RECIPE_KEYS`) → NEW-TRADE pattern, 3 recipes.
- Catalog codes already seeded: none for skylights (B-ROOF-*, B-ROOF-SHINGLE-SQ, B-SIP-ROOF-SF are roofing).
- Blueprint template tasks hitting this trade: none.
- Roofing pack already carries a `holes_skylights` hazard + `openings_covered` QA; this pack deepens the
  skylight-specific side (covers spec, existing skylights on low-slope roofs, TDD sunlight fire, attic falls).

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| ecfr-1926-m | 29 CFR 1926 Subpart M — Fall Protection | 1 | public_domain | 1926.501(b)(4), (b)(13), (c); 1926.502(i) covers |
| ecfr-1926-c/e/f/i/o/x | 29 CFR 1926 Subparts C, E, F, I, O, X | 1 | public_domain | training, PPE, fire program, tools, lifts, ladders |
| skylights-niosh-2004-156 | NIOSH Alert 2004-156 (archived; withdrawn Aug 2025) | 1 | gov_open | fatal-fall pattern only |
| skylights-wa-lni-face-71-188 | WA L&I FACE 71-188-2019 roofer through skylight | 1 | gov_open | warning line/monitor not adequate near skylights |
| skylights-velux-fs-install | VELUX FS deck-mounted install instructions | 5 | manufacturer_public | pitch range, RO, underlayment wrap, flashing order, cladding/gasket, vapor barrier tie-in, glass type |
| skylights-solatube-300ds | Solatube 300 DS install instructions | 5 | manufacturer_public | TDD location, curb counterflashing, tube joints, sunlight focusing, attic/drywall, not walkable |
| energy-star-windows | ENERGY STAR windows, doors & skylights | 1 | gov_open | label / U-factor-SHGC check |
| icc-pa | ICC codes (IRC R308.6, R308.6.8, R802.9, R903.2.1; IBC 2405, 910; IECC R402.3, C402.4) | 3 | proprietary_ref_only | section refs, paraphrase only |

## Work steps (draft → pack recipes)
- `unit_skylight_residential` (`skylight|roof window`): frame opening (gate framing, IRC R802.9) → curb/set unit (R308.6.8) → underlayment + flashing kit (gate roof_dry_in, R903.2.1) → shaft insulation (gate insulation, IECC R402.3) → finish + glazing check (gate final, R308.6).
- `tubular_daylighting` (priority 10; `tubular daylight|sun tunnel|solar tube|daylighting device`): locate → cut + flash (gate roof_dry_in) → tube + diffuser (gate final).
- `commercial_unit_skylight` (priority 5; commercial/industrial/MF; `smoke vent|unit/dome/commercial skylight`): protect openings → curbs (gate roof_dry_in, IBC 2405) → set units + screens → smoke-vent test (gate final, IBC 910, IECC C402.4).

## Hazards (draft → pack hazards)
12: fall_through_opening (1926.501(b)(4)(i), sev 4), existing_skylight (4), cover_failure (1926.502(i), 4), fall_roof_edge (1926.501(b)(13), 4), falling_objects (1926.501(c)), ladder (1926.1053(b)(1)), attic_fall_ceiling (1926.501(b)(4)(ii)), attic_heat (1926.21(b)(2)), focused_sunlight (1926.150(a)(1)), glass_cut (1926.95(a)), hoisting (1926.602(c)), power_tool (1926.300(b)).

## QA checklist
15 items — 6 safety (opening_guarded, cover_marked_secured, screens_installed, glazing_type, reflective_scrap_cleared, smoke_vent_test) pending human ES; 9 non-safety with author ES.

## Inspection / acceptance checkpoints
- framing: headers/trimmers, no unapproved truss cuts.
- roof_dry_in: underlayment wrap, flashing kit/curb counterflashing, openings guarded.
- insulation: shaft insulated + air-sealed, barrier tied in.
- final: glazing type/screens, energy labels, smoke-vent test.

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| B-SKY-DECK-EA | Deck-mount fixed skylight ≈2x4 + kit | EA | 60000 | 6 | 0 | 0 | platform-baseline, estimate |
| B-SKY-CURB-EA | Curb-mount skylight on site curb | EA | 70000 | 7 | 0 | 5 | estimate |
| B-SKY-TDD-EA | TDD 10–14 in, ≤10 ft tube | EA | 45000 | 3 | 0 | 0 | estimate |
| B-SKY-SHAFT-EA | Opening framing + finished light shaft | EA | 20000 | 10 | 0 | 15 | estimate |
| B-SKY-UNIT-COMM-EA | Commercial unit skylight ≈4x4 dome | EA | 120000 | 3 | 10000 | 0 | estimate |
| B-SKY-SCREEN-EA | Skylight fall screen ≈4x4 | EA | 25000 | 0.75 | 0 | 0 | estimate |

## Quantity rules
None — there is no `skylight` blueprint component token yet (components are out of scope this wave).

## Blueprint callouts (components)
None this wave; proposed token `skylight` (e.g. "NEW 2'x4' SKYLIGHT", "SOLAR TUBE") → REVIEW_QUEUE.

## Open questions → REVIEW_QUEUE
- NIOSH 2004-156 withdrawn Aug 2025 (archived copy cited for case pattern only).
- IECC commercial fenestration section is C402.4 in the 2021 edition (renumbered in 2024) — confirm per adopted edition.
- R308.6.8 curb section numbering per IRC edition.
- Add `skylight` component token so B-SKY-* lines can be seeded from plans.
