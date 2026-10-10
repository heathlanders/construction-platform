# Dossier — `fire_alarm` (Fire Alarm)

> Wave: w12 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/fire_alarm.ts` · Status: draft
> Taxonomy: category `electrical_systems` · permit_trade `electrical` · phase `rough_in` · CSI `28 46`

## Scope (2–4 sentences)
Shop drawings, installation, programming and acceptance testing of the building fire alarm: addressable
panel, power supplies and batteries, smoke/heat/CO detection, pull stations, horns/strobes/speakers,
sprinkler waterflow + valve-tamper monitoring, building interlocks (elevator recall, door holders, HVAC
shutdown), and the multifamily smoke/CO system. Coordinates emergency lighting and exit signs. Hands off:
sprinkler piping/switches and sprinkler testing (`fire_sprinkler`), the panel's 120 V feed (`electrical`),
door hardware (`doors_hardware`), structured cabling (`low_voltage`).

## Existing coverage reconciled
- Hand recipe: none (not in `HAND_RECIPE_KEYS`) → NEW-TRADE pattern; without the pack the family
  electrical rough-in recipe (power wiring) rendered.
- Catalog codes already seeded: `E-FA-DEVICE` (0037), `E-SMOKE-CO` (0028, hand-seeded in residential when
  smoke/CO fixtures present). Not redeclared; `E-FA-DEVICE` referenced in quantity_rules (commercial/
  industrial only). `E-SMOKE-CO` left to the hand seeder.
- Blueprint template tasks (all `rough_in`): 'Fire alarm, emergency lighting & exit signs' (industrial),
  'Fire alarm, sprinkler monitoring & PA rough-in' (commercial), 'Fire alarm & smoke detector system
  rough-in' (residential-mf) — all matched by `title_re` (`fire alarm|…`).

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| fire_alarm-ufgs-28-31-70 | UFGS 28 31 70 Interior Fire Alarm System, Addressable (08/20) | 1 | public_domain | steps, QA, battery/test practice |
| nfpa-fa | NFPA 70 Art. 760 / NFPA 72 (ref only) | 3 | proprietary_ref_only | code refs (section + paraphrase) |
| icc-pa | IBC/IFC 907, IBC 915, 1008, 1013 (ref only) | 3 | proprietary_ref_only | code refs |
| ecfr-1926-c/d/e/f/i/k/l/x/z | 29 CFR 1926 | 1 | gov_open | hazards |
| platform-baseline | expert estimate | — | platform_estimate | costs |

Note: "UFGS 28 31 00" no longer exists — 28 31 00.00 10 was superseded in Aug 2020 by 28 31 60/66/70/76;
28 31 70 (addressable, no mass notification) is the closest match.

## Work steps (draft → pack recipes)
Recipe `fire_alarm_system`:
1. **Get shop drawings and battery calcs approved** — IBC 907.1.2, NFPA 72 Ch. 7.
2. **Set back boxes and lay out devices** — IBC 907.4.2. QA device_location.
3. **Pull fire alarm cable and conduit** — NEC 760.24/.154/.136, 300.21. Gate rough_in.
4. **Set panel, power supplies and batteries** — NEC 760.41/.121. Gate rough_in.
5. **Wire sprinkler monitoring and building interlocks** — IBC 907.6.6.
6. **Coordinate emergency lighting and exit signs** — IBC 1008.3, 1013.6.3.
7. **Program, pre-test and run the acceptance test** — IBC 907.7/907.7.2, NFPA 72 Ch. 14. Gate final.

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| ladder | stepladder fall | 1926.1053(b)(13) | 3 |
| aerial_lift | lift basket | 1926.453(b)(2)(v) | 4 |
| electrical_contact | live power | 1926.416(a)(1) | 4 |
| loto | re-energized panel feed | 1926.417(b) | 4 |
| battery | battery burns/arc/acid | 1926.441(a) | 3 |
| lifting | heavy batteries/cabinets | 1926.21(b)(2) | 2 |
| noise | horns during testing | 1926.101(a) | 2 |
| impairment | system bypassed / building unprotected | 1926.150(a)(1) | 4 |
| silica | drilling concrete/block | 1926.1153 | 3 |
| power_tool | drill kickback | 1926.300(b) | 2 |
| eye_cut | overhead debris, sharp metal | 1926.95(a) | 2 |
| chem | firestop / aerosols | 1926.59 | 2 |

## QA checklist
15 items — approved set, battery calc/cabinet, device location, cable listing, no mixed systems,
splice-free labeled terminals, firestop, dedicated circuit, valves supervised, sequence programmed,
100% pre-test (no magnets), audibility (15 dBA over ambient / ≤110 dBA), secondary power, egress lighting,
record of completion. 10 safety items ES pending.

## Inspection / acceptance checkpoints
- rough_in: approved drawings, box locations, cable type/support, separation, dedicated circuit, firestop.
- final: witnessed 100% acceptance test, waterflow/tamper to monitoring, audibility + sync, battery run,
  exit/emergency lights on emergency power, record of completion.

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| E-FA-FACP-ADDR | addressable FACP + batteries + communicator | EA | 450000 | 12 | 0 | 0 | estimate |
| E-FA-MON-MODULE | monitor module to waterflow/tamper | EA | 9000 | 1.25 | 0 | 3 | estimate |
| E-FA-EXIT-EMERG | LED combo exit/emergency unit | EA | 9500 | 0.75 | 0 | 0 | estimate |
| E-FA-ACCEPT-TEST | program + pre-test + AHJ acceptance | EA | 15000 | 24 | 10000 | 0 | estimate |

## Quantity rules
- `E-FA-FACP-ADDR` = const 1 (commercial/industrial/residential_mf)
- `E-FA-ACCEPT-TEST` = const 1 (same)
- `E-FA-MON-MODULE` = const 3 (1 waterflow + 2 tampers; same)
- `E-FA-DEVICE` = rooms × 2 (commercial/industrial)
- `E-FA-EXIT-EMERG` = rooms × 0.5 when `has_exit_signage` (commercial/industrial/residential_mf)

## Blueprint callouts (components)
- none this wave.

## Open questions → REVIEW_QUEUE
- All 4 costs are platform estimates.
- NFPA 72 Ch. 7/12/14 cited by chapter only (ref-only); IBC 907.1.2 / 907.6.6 / IFC 901.5 section
  numbers from 2021 editions — confirm against the adopted edition.
- No `E-LIGHT-EXIT` style catalog code existed; `E-FA-EXIT-EMERG` lives under the FA prefix though
  emergency lighting is often the electrician's scope.
