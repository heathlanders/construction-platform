# Dossier — `fireplaces` (Fireplaces / Hearth)

> Wave: w17 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/fireplaces.ts` · Status: draft
> Taxonomy: category `specialty` · permit_trade `building` · phase `finishes_interior` · CSI `10 30`

## Scope
Factory-built gas/wood fireplaces, gas inserts, EPA-certified wood stoves, and coordination of site-built masonry fireplaces: chase/clearance framing, listed vent and termination, gas connection (licensed fitter) and leak test, hearth extension, CO alarm, burn-in and owner handover. Liners, sweeps and masonry chimney repair stay with `chimney` (B-CHM-*); gas piping rough-in stays with `gas_piping`.

## Existing coverage reconciled
- Hand recipe: none → pack is the NEW-TRADE pattern (4 recipes, priorities insert 30 > masonry 20 > wood stove 10 > factory 0).
- Catalog codes already seeded: none for fireplaces; chimney codes B-CHM-* not duplicated.
- Blueprint template tasks hitting this trade: none (no component detectors this wave).

## Sources used
| id | Title | Tier | License | Used for |
|---|---|---|---|---|
| fireplaces-epa-cert-stoves | EPA Certified Wood Stoves | 1 | gov_open | 2015 NSPS certified-stove 4.5 g/hr; label/manual QA |
| fireplaces-ecfr-40-60-aaa | 40 CFR 60 Subpart AAA | 1 | gov_open | 60.532 limit; 60.536 label + owner's manual |
| fireplaces-epa-burnwise | EPA Burn Wise business resources | 1 | gov_open | dry seasoned wood / moisture meter handover |
| fireplaces-nfi | National Fireplace Institute | 4 | association_public | installer certification (reference) |
| chimney-nfpa-211, chimney-csia-co, chimney-lifetime-liner-kit | existing | — | — | connector/insert-liner/CO |
| icc-pa | IRC R1004.1/.2, R1005.1, R1006.1, R1001.1/.9, R1003.18/.19, R302.11, R315.2, G2417 | 3 | proprietary_ref_only | section numbers only |
| ecfr-1926-{m,x,f,d,z,e,h,i} | OSHA Part 1926 | 1 | gov_open | hazards |

## Work steps
Factory fireplace: confirm listing/clearances -> frame chase + fireblock [framing] -> set unit + listed vent -> gas connect + leak test -> insulate/air-seal [insulation] -> hearth extension -> burn-in, CO alarm, handover [final].
Wood stove: label/clearances -> frame + floor protection [framing] -> chimney/thimble/connector -> set, burn-in, handover [final].
Gas insert: confirm opening/liner -> damper + liner -> gas + set -> burn-in [final].
Masonry: coordinate footing/firebox -> frame with air space [framing] -> hearth -> draft test [final].

## Hazards
14 hazards: roof fall, ladder, power lines, gas ignition (1926.151(a)(3)), LP-gas (1926.153(a)(1)), CO (1926.55(a)), silica (1926.1153(c)(1)), eye (1926.102(a)(1)), sharp metal, heavy unit (1926.250(a)(1)), nailer (1926.300(b)(1)), hot surface (1926.95(a)), fire watch (1926.150(a)(1)), creosote (1926.103). All OSHA text verified on eCFR 2026-10-08.

## QA checklist
24 items; safety items flagged (clearances, fireblock, vent, termination, gas, hearth, CO, glass, connector, chimney height).

## Inspection / acceptance checkpoints
framing, insulation, final (building family) + stove_final_walkthrough.

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| B-FPL-DV-GAS-EA | DV gas fireplace set | EA | 280000 | 8 | 0 | 0 | platform-baseline estimate |
| B-FPL-VENT-KIT-EA | vent + termination kit | EA | 45000 | 4 | 0 | 3 | estimate |
| B-FPL-CHASE-EA | framed chase | EA | 45000 | 12 | 0 | 10 | estimate |
| B-FPL-HEARTH-EA | hearth extension | EA | 30000 | 4 | 1000 | 10 | estimate |
| B-FPL-WOODSTOVE-EA | certified stove + pad | EA | 250000 | 8 | 0 | 0 | estimate |

## Quantity rules
None — no blueprint fact token exists for fireplaces (no components this wave).

## Blueprint callouts
None this wave.

## Open questions -> REVIEW_QUEUE
- CPSC/HPBA pages return 403 to curl and could not be verified, so not cited.
- IRC section numbers (R1004.1/.2, R1005.1, R1006.1, R1001.1/.9, R302.11, G2417) from memory; ICC site blocked to curl.
- Vented gas fireplace appliance sections (IRC G2432-G2435 range) not cited, unverified.
