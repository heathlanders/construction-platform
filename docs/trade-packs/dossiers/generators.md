# Dossier — `generators` (Generators / Backup Power)

> Wave: w12 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/generators.ts` · Status: draft
> Taxonomy: category `electrical_systems` · permit_trade `electrical` · phase `commissioning` · CSI `26 32`

## Scope (2–4 sentences)
Installs residential air-cooled standby generators with an automatic transfer switch, commercial diesel/gas
standby and emergency (NEC 700/701/702) generator sets, and portable-generator inlets with panel interlocks:
sizing, pad and clearances, transfer equipment, feeders, grounding/bonding, start-up, transfer and load bank
testing, CO safety. Does NOT run or test the fuel line (hand-off to `gas_piping`, P-GAS-* assemblies) and does
not pour structural housekeeping pads on commercial jobs (concrete).

## Existing coverage reconciled
- Hand recipe: none (not in HAND_RECIPE_KEYS) → NEW-TRADE pattern; electrical family phase recipes remain the fallback.
- Catalog codes already seeded: `E-GENERATOR-STANDBY` (residential standby + ATS, 0037) — referenced from quantity_rules, not redeclared.
- Blueprint template tasks hitting this trade: none.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| nfpa-fa | NFPA free access (NEC 445, 250.35, 700, 701, 702) | 3 | proprietary_ref_only | code refs (section + paraphrase) |
| generators-nfpa-37 | NFPA 37 doc page | 3 | proprietary_ref_only | clearance/fuel reference only |
| generators-nfpa-110 | NFPA 110 doc page | 3 | proprietary_ref_only | EPSS acceptance testing (Ch. 7) |
| generators-generac-clearance | Generac clearance article | 5 | manufacturer_public | location/clearance QA |
| generators-generac-distance | Generac run-distance article | 5 | manufacturer_public | conductor/fuel sizing for long runs |
| generators-cpsc-5123 | CPSC Portable Generator Hazards alert | 1 | public_domain | CO, backfeed, CO alarms |
| restoration-niosh-co | NIOSH CO hazards at work | 1 | gov_open | CO hazard |
| ecfr-1926-c/d/f/h/k/cc | 29 CFR 1926 subparts | 1 | public_domain | hazards (verified via eCFR API text) |

## Work steps (draft → pack recipes)
- `standby_with_ats` (title_re generator|standby power|transfer switch|ATS): load calc (702.4) → pad + clearances → ATS (service gate; 702.5, 250.35) → feeders/control + gas fitter (rough_in gate; 445.13) → start-up, transfer test, signs, CO alarms (final gate; 702.7, 445.18).
- `emergency_commercial` (priority 10; emergency/diesel/legally required/NFPA 110): system classes (700.12) → crane set → fuel/spill control → separate emergency wiring (rough_in; 700.10, 250.35) → acceptance/load bank (final; 700.3, NFPA 110 Ch. 7).
- `portable_inlet_interlock` (priority 20): inlet → listed interlock / MTS (final; 702.5) → labels + owner walk-through (702.7).

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| backfeed | Backfeed into utility lines | 1926.416(a)(1) | 4 |
| lockout | Re-energizing while landing conductors | 1926.417(b) | 4 |
| live_service | Shock/arc flash at live line side | 1926.416(a)(1) | 4 |
| co_exhaust | CO from engine exhaust | 1926.55(a) | 4 |
| diesel_fire | Diesel spill / fueling fire | 1926.152(g)(8) | 3 |
| lp_gas | LP leak/fire at tank/regulator | 1926.153(g) | 3 |
| crane_load | Struck by hoisted set | 1926.1425(b) | 4 |
| rigging | Rigging failure | 1926.251(a)(1) | 3 |
| heavy_set | Strain/crush setting the unit | 1926.20(b) | 3 |
| buried_lines | Striking buried lines when trenching | 1926.416(a)(3) | 3 |
| noise | Engine / load bank noise | 1926.52(b) | 2 |
| battery | Starting battery acid/sparks | 1926.441(a)(5) | 2 |

## QA checklist
15 items — load calc, fuel capacity, clearances*, pad, ATS rating, single bond*, conductor sizing, transfer test*,
signs, CO alarms*, emergency separation*, fuel containment*, acceptance record, inlet location*, interlock* (* safety, ES pending).

## Inspection / acceptance checkpoints
- rough_in: feeder conduit + warning tape before backfill; emergency wiring separate.
- service: load calc + ratings on site; transfer equipment prevents paralleling; bonding per design.
- final: clearances; standby sign + disconnect; transfer/acceptance test; CO alarms.

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| E-GEN-ATS-200-EA | 200A service-rated ATS | EA | 95000 | 6 | 0 | 2 | platform-baseline estimate |
| E-GEN-PAD-EA | Pad + gravel base | EA | 25000 | 2 | 3000 | 5 | estimate |
| E-GEN-INLET-EA | Inlet + interlock 30–50A | EA | 28000 | 4 | 0 | 5 | estimate |
| E-GEN-COMM-STBY-EA | ≈100 kW diesel standby allowance | EA | 6000000 | 60 | 300000 | 2 | estimate (allowance) |
| E-GEN-LOADBANK-EA | Acceptance / load bank test | EA | 0 | 6 | 150000 | 0 | estimate |

## Quantity rules
- `E-GENERATOR-STANDBY` = const 1 when residential_sf (existing code; not hand-seeded in quantities.ts).
- `E-GEN-PAD-EA` = const 1 when residential_sf.
- `E-GEN-COMM-STBY-EA` = const 1 when commercial/industrial.
- `E-GEN-LOADBANK-EA` = const 1 when commercial/industrial.

## Blueprint callouts (components)
- none this wave (no generator fact token exists yet).

## Open questions → REVIEW_QUEUE
- All costs `estimate`; commercial set is an allowance.
- NFPA 110 "Ch. 7" cited as installation/acceptance chapter — confirm chapter against the free-access edition.
- NEC section numbers chosen as stable across 2017–2023 (445.13, 445.18, 250.35, 700.3, 700.10, 700.12, 701.5, 702.4, 702.5, 702.7); 2023 also adds 230.82/230.85-area changes not cited.
- Vocab: no `load_bank` equipment type (load bank is costed in the assembly instead).
- Scope: a `generator`/`standby_generator` blueprint component token would let quantities fire from plans instead of the schedule.
