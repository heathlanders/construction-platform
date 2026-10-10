# Dossier — `playground_equipment` (Playground Equipment)

> Wave: w17 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/playground_equipment.ts` · Status: draft
> Taxonomy: category `specialty` · permit_trade `building` · phase `sitework` · CSI 11 68

## Scope
Commercial and public play structures, swings and other play equipment, and the safety surfacing under them (engineered wood fiber, poured-in-place rubber, tiles). Does not cover the equipment's manufacture, sport courts or turf (sport_courts_turf), site grading/drainage (excavation, landscaping) or fencing.

## Existing coverage reconciled
- Hand recipe: none → pack is NEW-TRADE (two recipes).
- Catalog codes already seeded: none (`B-PLAY-*` new).
- Blueprint template tasks hitting this trade: none.

## Sources used
| id | Title | Tier | License | Used for |
|---|---|---|---|---|
| playground_equipment-cpsc-325 | CPSC Public Playground Safety Handbook (2015) | 1 | public_domain | use zones, surfacing, footings, entrapment, maintenance (full text read) |
| plumbing-ada-2010 | 2010 ADA Standards 240 / 1008 | 1 | public_domain | accessible route and ground surfaces (text read on access-board.gov) |
| playground_equipment-astm-f1487 / -f1292 | ASTM F1487, F1292 | 3 | proprietary_ref_only | designations only |
| playground_equipment-ipema | IPEMA | 3 | proprietary_ref_only | certification reference only (site 403s scripts) |
| ecfr-1926-p/c/d/e/i/k/o/x | 29 CFR 1926 | 1 | public_domain | hazards |
| icc-pa | IBC 1809 | 3 | proprietary_ref_only | footing reference |

## Work steps
Recipe `play_structure_install`: layout and use zones; utilities and footings (gate footing); assemble; surfacing; accessible route and sign-off (gate final). Recipe `safety_surfacing_install`: base; place surfacing; border; handoff.

## Hazards
12 hazards, all with a 29 CFR 1926 ref (651(b)(1), 651(j)(2), 20(b), 1053(b)(1), 28(a), 59, 601(b)(4), 300(b), 102(a)(1), 404(b)(1)). ES pending.

## QA checklist
18 items; 7 safety items with ES pending.

## Inspection / acceptance checkpoints
footing, final, and `cpsi_audit` (owner/insurer audit, non-gating).

## Cost basis
All five `B-PLAY-*` costs are platform-baseline estimates (no public unit-price source).

## Quantity rules
None — blueprint facts do not provide play-equipment counts.

## Open questions
- CPSC Table 2 sand/wood-mulch fall heights were garbled in text extraction; not used.
- Equipment vocab lacks an auger attachment (skid_steer used).
