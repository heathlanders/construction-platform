# Dossier — `gym_theatrical` (Gym / Theatrical Equipment)

> Wave: w17 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/gym_theatrical.ts` · Status: draft
> Taxonomy: category `specialty` · permit_trade `null` · phase `finishes_interior` · CSI `11 66`

## Scope
Hoisted and fixed athletic equipment (ceiling-suspended and wall-mounted backstops, divider curtains, wall pads, telescoping bleachers) and theatrical rigging (battens, line sets, stage curtains). Not included: house lighting/audio, sport floors, fixed auditorium seating, scoreboard wiring.

## Existing coverage reconciled
- Hand recipe: none → pack is the NEW-TRADE pattern (two recipes)
- Catalog codes already seeded: no `G-GYM-*`; six new codes
- Blueprint template tasks hitting this trade: none

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| gym_theatrical-cpsc-330 | CPSC Pub. 330 Retrofitting Bleachers | 1 | gov_open | guardrail 30/42/4 in. checks, inspection intervals |
| gym_theatrical-esta-tsp | ESTA TSP listing (E1.4, E1.47, E1.56, E1.67, E1.46) | 4 | proprietary_ref_only | rigging design/inspection concepts only |
| ecfr-1926-l / -m / -x / -h / -e / -c / -k | 29 CFR 1926 | 1 | public_domain | hazards (1926.453, .501, .1053, .251, .100, .20, .417, .404, .25) |
| icc-pa | IBC / ICC 300 | 3 | proprietary_ref_only | checklist ref strings only |

## Work steps
Athletic: approve attachment points → layout → hang frames/tracks/winches → safety straps + limits → bleachers + guardrails → pads, test, owner training. Stage: verify support points → blocks/track → cable/battens → controls + stops → curtains, load test, training.

## Hazards
12 hazards (aerial lift fall/basket, stage-edge fall, ladder, rigging overload/inspection, falling objects, heavy lift, nesting pinch, lockout, GFCI, floor housekeeping); all OSHA refs verified on eCFR 2026-10-08.

## QA checklist
23 items; 12 flagged safety (ES pending human translation).

## Inspection / acceptance checkpoints
- structural_attachment_review, load_and_function_test, bleacher_inspection (no permit gates; owner/engineer hold points).

## Cost basis
All six assemblies `estimate` / platform-baseline: G-GYM-BACKSTOP-CS-EA, G-GYM-BACKSTOP-WM-EA, G-GYM-DIVIDER-SF, G-GYM-WALLPAD-SF, G-GYM-BLEACHER-SEAT-EA, G-GYM-RIGGING-LINESET-EA.

## Quantity rules
- `G-GYM-BACKSTOP-CS-EA` = const 2 (commercial); `G-GYM-WALLPAD-SF` = const 400 (commercial) — placeholders until schedules are measured.

## Blueprint callouts
None this wave.

## Open questions → REVIEW_QUEUE
- UFGS 11 66 23 could not be verified (WBDG pages are a SPA returning 200 for any slug); not cited.
- No manufacturer installation PDFs were reachable; steps say "per the maker".
- IBC assembly-seating section number varies by edition; checklist refs use "ICC 300 / IBC (ref)".
