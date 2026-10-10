# Dossier — `fire_protection_special` (Special Fire Protection — Kitchen Hood / Clean Agent / Extinguishers)

> Wave: w13 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/fire_protection_special.ts` · Status: draft
> Taxonomy: category `plumbing_systems` · permit_trade `building` · phase `rough_in` · CSI `21 22`

## Scope
Special-hazard suppression that is not a sprinkler system: pre-engineered wet-chemical (UL 300) systems on
commercial kitchen hoods, clean-agent / inert-gas total-flooding systems for server, telecom and records rooms,
and portable extinguishers + cabinets. NOT in scope: the hood and grease duct (`kitchen_exhaust`), sprinklers
(`fire_sprinkler`), the building fire alarm itself (`fire_alarm` — this trade wires the releasing panel and the
interface), gas piping to the valve (`plumbing`/`gas_piping`), shunt-trip power wiring (`electrical`).

## Existing coverage reconciled
- Hand recipe: none (not in `HAND_RECIPE_KEYS`) → NEW-TRADE pattern, 3 recipes.
- Catalog codes already seeded: none for this trade (`M-DU-FIRE-DAMPER`, `B-WLD-FIREWATCH-HR` unrelated).
- Blueprint template tasks: none. Recipe title_re covers hood suppression / Ansul / wet chemical /
  "suppression system", clean agent / FM-200 / Novec / HFC-227 / FK-5-1-12 / IG-541 / Inergen, and
  fire extinguishers / cabinets.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| fire_protection_special-ufgs-21-23-00 | UFGS 21 23 00 Wet Chemical Fire Extinguishing Systems (May 2024) | 1 | public_domain | kitchen steps, QA, puff test |
| fire_protection_special-ufgs-21-22-00 | UFGS 21 22 00 Clean Agent Fire Extinguishing Systems (Aug 2026) | 1 | public_domain | clean-agent steps, door fan, acceptance |
| fire_protection_special-ufgs-10-44-16 | UFGS 10 44 16 Fire Extinguishers (Nov 2019) | 1 | public_domain | extinguisher steps, spacing basis |
| fire_protection_special-epa-snap-flooding | EPA SNAP — Substitutes in Total Flooding Agents | 1 | public_domain | agent acceptability QA |
| fire_protection_special-epa-co2-risks | EPA — CO2 as a Fire Suppressant: Examining the Risks | 1 | public_domain | agent-atmosphere hazard |
| fire_protection_special-ul-300 / -nfpa-17a / -nfpa-2001 / -nfpa-10 | listing + NFPA standards (doc info pages) | 3 | proprietary_ref_only | reference only |
| icc-pa | IBC / IFC / IMC | 3 | proprietary_ref_only | code refs (section + paraphrase) |
| ecfr-1926-c/d/f/j/k/l/x/z | 29 CFR 1926 subparts | 1 | public_domain | hazards |

## Work steps
**kitchen_hood_wet_chemical** (5): confirm listed design vs hood/line-up (IMC 509.1, IFC 904.5) → mount cylinder +
pipe nozzles (swab, blow out, union, caps) → detection, pull station, gas valve, shunt trip, FA (IFC 904.3.3,
904.3.5) → puff test + arm, gate `final` (IFC 904.4, 901.5) → Class K extinguisher, gate `final` (IFC 906.4).
**clean_agent_total_flooding** (6, priority 10): design/room/SNAP check (IFC 904.10, 904.3.1) → bracket cylinders,
actuators off → pipe + nitrogen flow test → releasing panel, abort, shutdowns, signs (IFC 904.3.4, 904.3.2) →
door fan integrity test → acceptance test then connect cylinders, gate `final`.
**portable_extinguishers** (3, priority 10): layout (IFC 906.1, 906.2) → cabinets/brackets → hang charged + tagged,
gate `final` (IFC 906.6, 906.9).

## Hazards
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| unplanned_discharge | accidental discharge during install/test | 1926.21(b)(2) | 4 |
| agent_atmosphere | low O2 / agent gases after discharge | 1926.55(a) | 4 |
| cylinder_handling | moving heavy cylinders | 1926.350(a)(3) | 3 |
| cylinder_rupture | valve break / projectile | 1926.350(a)(1) | 4 |
| agent_contact | alkaline wet-chemical agent | 1926.59 | 3 |
| shock | shunt trip / solenoid / panel wiring | 1926.416(a)(1) | 4 |
| ladder | ladder at hoods/ceilings | 1926.1053(b)(1) | 3 |
| lift_fall | scissor lift / rolling scaffold | 1926.451(g)(1) | 4 |
| drill_silica | drilling concrete for anchors | 1926.1153(c)(1) | 2 |
| impaired_protection | space unprotected while system disabled | 1926.150(a)(1) | 3 |

## QA checklist
15 items (6 safety → ES pending): listed design, pipe cleaned/blown, nozzles aimed/capped, pull station in egress,
fuel/power shutoff*, puff test*, Class K present*, room vs calcs + SNAP, cylinders secured*, nozzles vs iso + flow
test, abort/manual/signs*, door fan pass, acceptance test report, extinguisher location/height, charged + tagged*.

## Inspection / acceptance checkpoints
- final: hood puff test witnessed; pull station + tag + Class K; door fan report; clean-agent functional tests;
  warning signs; extinguishers charged/tagged/mounted; reports + record drawings on site.

## Cost basis (all platform-baseline estimates, 2026 national)
| Code | Item | Unit | Material ¢ | Labor hr | Equip ¢ | Waste % |
|---|---|---|---|---|---|---|
| B-FPS-HOOD-WETCHEM-EA | kitchen hood wet-chem system ≤12 ft | EA | 420000 | 16 | 0 | 3 |
| B-FPS-CLEAN-AGENT-CF | clean-agent halocarbon system | CF | 250 | 0.01 | 5 | 0 |
| B-FPS-DOOR-FAN-TEST-EA | room integrity test | EA | 3000 | 6 | 15000 | 0 |
| B-FPS-EXT-CAB-EA | 10 lb ABC + semi-recessed cabinet | EA | 26000 | 1.25 | 0 | 0 |
| B-FPS-EXT-K-EA | Class K 6 L + bracket | EA | 30000 | 0.5 | 0 | 0 |
| B-FPS-ACCEPT-TEST-EA | acceptance (puff/functional) test + reset parts | EA | 15000 | 4 | 0 | 0 |

## Quantity rules
- `B-FPS-EXT-CAB-EA` = area_sf_sum × 0.00034 (ceil), commercial/industrial/residential_mf only — one per ~3,000 sf
  (UFGS 10 44 16 light/ordinary hazard spacing). Hood/clean-agent systems are not seeded — plans rarely give a
  reliable fact (no fixture/component token exists for them).

## Blueprint callouts
None this wave.

## Open questions → REVIEW_QUEUE
- IFC/IBC 904.x and 906.x section numbers paraphrased from memory of 2018/2021 editions — ICC public access was
  403 to scripts; confirm 904.3.x, 904.10, 906.4, 906.6, 906.9 against the adopted edition. IMC 509.1 likewise.
- NFPA 10 "Ch. 6" (installation) chapter number unverified.
- All costs are estimates.
- 1926.55(a) is the closest construction cite for agent atmospheres; 29 CFR 1910.160 (fixed extinguishing systems)
  is general industry and not cited.
