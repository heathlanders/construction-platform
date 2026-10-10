# Dossier — `gas_piping` (Gas Piping)

> Wave: w02 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/gas_piping.ts` · Status: draft
> Taxonomy: category `plumbing_systems` · permit_trade `plumbing` · phase `rough_in` · CSI `23 11`

## Scope (2–4 sentences)
Fuel-gas piping from the utility meter (natural gas) or the propane tank to every gas appliance: sizing,
black steel or CSST distribution, protection and CSST bonding, pressure test, appliance shutoffs /
sediment traps / connectors, purge and leak check, and (propane) the tank set and underground service
line. Hands off: the meter set to the gas utility, tank fill and supplier leak check to the propane
supplier, appliance venting to `hvac`, bonding conductor termination at the panel to `electrical`.

## Existing coverage reconciled
- Hand recipe: none of its own. `task-buildout/plumbing.ts` adds one generic "Rough fuel-gas piping"
  step (gate `gas_test`) to plumbing tasks when a gas flag is set → pack complements it; `gas_piping` is
  not in `HAND_RECIPE_KEYS`, so its own tasks use the pack recipes.
- Family code refs (`code-refs.ts` plumbing): `gas_test` → "Fuel Gas" generic ref. The pack adds specific
  IFGC section refs with `code_type: 'IFGC'` (and `NFPA 58` for propane container location).
- Catalog codes already seeded: `P-GAS-LINE` (EA, hand-seeded by `seedPlumbing` on gas flags) and
  `P-GAS-PIPE-LF` (LF, migration 0037). Neither is redeclared or re-seeded.
- Blueprint template tasks: none (0).

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| gas_piping-ufgs-23-11-23 | UFGS 23 11 23 — Facility Natural-Gas Piping | 1 | public_domain | execution/QA (supports, capping, protection, test) |
| ecfr-1926-d / -e / -i / -p / -x | 29 CFR 1926 D, E, I, P, X | 1 | public_domain | hazards |
| gas_piping-ecfr-1926-f | 29 CFR 1926 Subpart F — Fire Protection and Prevention (1926.151, 1926.153) | 1 | public_domain | ignition + LP-gas container hazards |
| gas_piping-ecfr-1926-j | 29 CFR 1926 Subpart J — Welding and Cutting (1926.352) | 1 | public_domain | hot work |
| gas_piping-ecfr-1926-aa | 29 CFR 1926 Subpart AA — Confined Spaces (1926.1203) | 1 | public_domain | crawlspaces |
| icc-pa | IFGC (ICC public access) | 3 | proprietary_ref_only | section refs 310, 402, 404, 406, 408, 409, 411 |
| gas_piping-nfpa-54 | NFPA 54 National Fuel Gas Code | 3 | proprietary_ref_only | parallel reference |
| gas_piping-nfpa-58 | NFPA 58 LP-Gas Code | 3 | proprietary_ref_only | propane container location (Ch. 6) |
| gas_piping-gastite-di | Gastite / FlashShield+ CSST Design & Installation Guide (2019) | 5 | manufacturer_public | striker plates, bonding, test isolation, leak-check solution, drip leg at regulator |
| platform-baseline | The Jobsite baseline | — | platform_estimate | all costs |

## Work steps (draft → pack recipes)
`gas_branch_piping` (example "Rough-in natural gas piping"):
1. **Size the system and lay out the runs** — IFGC 402. QA sized_from_tables, listed_materials.
2. **Run and support the piping** — IFGC 404. QA supports_spacing, outlets_capped, drip_leg_regulator.
3. **Protect, shield and bond** — IFGC 404, 310. Gate `rough_in`. QA striker_plates, physical_protection, csst_bonded.
4. **Pressure-test the piping** — IFGC 406. Gate `gas_test`. QA test_held, regulators_isolated.

`appliance_connection_final` (priority 1; example "Gas appliance connections and final"):
1. **Install shutoff, sediment trap and connector** — IFGC 409, 408, 411.
2. **Turn on gas, purge and leak-check** — IFGC 406.
3. **Light off and hand over for final** — Gate `final`.

`propane_tank_service` (priority 2; example "Set propane tank and service line"):
1. **Locate the tank and dig the service trench** — NFPA 58 Ch. 6.
2. **Lay the service line and set regulators** — IFGC 404. Gate `underground`.
3. **Test, backfill and hand off to the supplier** — IFGC 406. Gate `gas_test`.

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| gas_ignition | Fire/explosion from released gas near ignition | 1926.151(a)(3) | 4 |
| purge_release | Gas build-up while purging | 1926.55(a) | 4 |
| hot_work | Brazing/cutting/welding fire | 1926.352(a) | 3 |
| test_pressure | Cap/fitting blow-off under test | 1926.102(a)(1) | 3 |
| lpg_container | Propane container leak/fire | 1926.153(j) | 4 |
| trench_cavein | Service trench cave-in | 1926.652(a)(1) | 4 |
| struck_utility | Hitting buried utilities | 1926.651(b)(1) | 4 |
| confined_space | Crawlspace air / entrapment | 1926.1203(a) | 3 |
| power_threader | Caught in power threader | 1926.300(b)(1) | 3 |
| cutting_oil | Threading oil / compound irritation | 1926.59 | 2 |
| eye_injury | Chips and burrs | 1926.102(a)(1) | 2 |
| ladder | Ladder fall running pipe overhead | 1926.1053(b)(1) | 3 |
All OSHA paragraphs checked against law.cornell.edu (eCFR mirror) 2026-10-08.

## QA checklist
16 items — sizing, listed materials, supports, striker plates, physical protection, CSST bonding, capped
outlets, regulators isolated for test, test held + recorded, appliance shutoff location (IFGC 409),
sediment trap, regulator drip leg/vent, listed connectors, safe purging, post-connection leak check,
propane tank clearances (NFPA 58). 12 are `safety: true`.

## Inspection / acceptance checkpoints
- underground: cover depth, tracer wire, riser; trench bedding.
- rough_in: sizes vs plan; supports/striker plates/protection; CSST bond.
- gas_test: gauge holding at required pressure/time; regulators/appliances isolated, outlets capped.
- final: shutoff + sediment trap per appliance; connectors + leak check; caps, exterior protection.

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| P-GAS-APPL-CONN | Appliance connection (valve, trap, connector) | EA | 7000 | 1.0 | 0 | 5 | estimate |
| P-GAS-TEST-SYS | Pressure test + inspection per system | EA | 1500 | 2.0 | 1000 | 0 | estimate |
| P-GAS-CSST-BOND | CSST bond clamp + conductor | EA | 4000 | 1.0 | 0 | 10 | estimate |
| P-GAS-REG-LINE | Line / second-stage regulator w/ shutoff + drip leg | EA | 9000 | 1.5 | 0 | 5 | estimate |
| P-GAS-PROPANE-TANK | ~500 gal aboveground propane tank set | EA | 250000 | 4.0 | 15000 | 0 | estimate (often supplier-leased) |

## Quantity rules
- `P-GAS-TEST-SYS` = const 1 when has_natural_gas | has_propane_gas.
- `P-GAS-CSST-BOND` = const 1 when gas flag (assumes CSST).
- `P-GAS-APPL-CONN` = fixture `water_heater` count, and fixture `fau` count, when gas flag.
- `P-GAS-PROPANE-TANK` = const 1 when has_propane_gas on residential_sf.
- Not seeded: `P-GAS-LINE` (already hand-seeded) and `P-GAS-PIPE-LF` (no length fact; would overlap the drop).

## Blueprint callouts (components)
- None this wave (per brief).

## Open questions → REVIEW_QUEUE
- 12 hazards + 12 safety QA + all inspection-checklist items need professional ES translation.
- All 5 assembly costs are estimates; propane tank is commonly leased — consider making it optional.
- IFGC 409 appliance-valve distance and the test pressure/duration are left to the code (not stored as numbers).
- NFPA 58 cited by chapter only (Ch. 6) — confirm section for container location in the adopted edition.
- CSST bonding: arc-resistant jackets may carry no maker bond requirement; AHJ practice varies.
