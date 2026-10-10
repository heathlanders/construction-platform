# Dossier — `hvac` (HVAC / Mechanical)

> Wave: w02 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/hvac.ts` · Status: draft
> Taxonomy: category `mechanical_systems` · permit_trade `mechanical` · phase `rough_in` · CSI `23`

## Scope (2–4 sentences)
Residential and light-commercial heating, cooling and ventilation equipment: gas furnaces, air-source
heat pumps, split AC, ductless mini-splits, rooftop units, ERV/HRV. Covers load-based selection, setting
equipment, refrigerant line sets, condensate, venting connection, charging and startup/commissioning.
Hand-offs: sheet-metal duct fabrication → `ductwork`; gas line to the appliance → `gas_piping`;
disconnect circuit → `electrical`; boilers/hydronic → `boilers_hydronic`; controls/BMS → `controls_bms`.

## Existing coverage reconciled
- Hand recipe: `task-buildout/mechanical.ts` (family, phase-keyed: rough ductwork & line sets → seal ducts
  → set equipment → pressure-test → start up & verify). Pack **complements** (`recipes: []`) — adds
  glossary, 12 hazards, 15 QA, 4 inspection checklists, 10 code refs, 2 equipment hints, 5 assemblies,
  3 quantity rules, 3 dependency hints.
- Catalog codes already seeded (not redeclared): M-FURNACE, M-CONDENSER, M-MINISPLIT, M-RTU, M-VAV-BOX,
  M-REFRIG-LINE-LF, M-THERMOSTAT, M-REGISTER, M-DUCT-*, M-BATH-FAN. Hand `seedMechanical` seeds
  M-FURNACE + M-CONDENSER from `fau` and M-REGISTER from rooms — pack rules avoid those.
- Blueprint template tasks hitting this trade: 13 (e.g. "HVAC ductwork rough-in", "Furnace & AC
  equipment set", "HVAC grille, register & thermostat install", "AHU, VAV boxes & rooftop unit
  installation") — all handled by the family hand recipe.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| hvac-ufgs-23-81-00 | UFGS 23 81 00 Decentralized Unitary HVAC | 1 | public_domain | equipment set, cleaning/filters, refrigerant tests, no venting |
| hvac-ufgs-23-23-00 | UFGS 23 23 00 Refrigerant Piping | 1 | public_domain | nitrogen-purge brazing, piping QA |
| hvac-es-design-report | ENERGY STAR National HVAC Design Report Rev 14 | 1 | gov_open | load calc / equipment selection on file |
| hvac-es-commissioning | ENERGY STAR National HVAC Commissioning Checklist Rev 14 | 1 | gov_open | charge by subcool/superheat, airflow |
| hvac-basc-hp-replace / -furnace-replace | DOE BASC Home Improvement Expert checklists | 1 | gov_open | Manual J/S, MERV 8, thermostat location, airflow, combustion |
| hvac-basc-minisplit-brief | DOE BASC mini-split code compliance brief | 1 | gov_open | condensate, line insulation, locking caps, inspection points |
| hvac-basc-combustion | ENERGY STAR SF — combustion appliances (BASC) | 1 | gov_open | CO / venting |
| hvac-epa-608, hvac-ecfr-40-82f | EPA Section 608 / 40 CFR 82 Subpart F | 1 | gov_open / public_domain | refrigerant recovery, certification |
| ecfr-1926-{c,d,e,k,m,x,cc}, hvac-ecfr-1926-j | 29 CFR 1926 | 1 | public_domain | hazards |
| icc-pa | IMC / IRC / IECC (ref only) | 3 | proprietary_ref_only | code refs |
| hvac-acca-manuals | ACCA Manual J/S/D (ref only) | 4 | proprietary_ref_only | concepts |

## Work steps
Complement pattern — no pack recipes. Family recipe steps render; pack adds code refs per gate
(rough_in: IMC 312/603/1107 · equipment_set: IMC 304/306/307, IRC M1411.3, IECC R403.7 ·
gas_refrigerant_test: IMC 1108, IRC M1411.6 · final: IMC 701/801).

## Hazards
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| refrigerant_contact | Liquid refrigerant frostbite / eyes | 1926.102(a)(1) (+ EPA 608) | 3 |
| brazing_fire | Brazing fire in framing/attics | 1926.352(d) | 4 |
| gas_cylinders | Unsecured cylinders | 1926.350(a)(9) | 3 |
| electric_shock | Live disconnects/capacitors | 1926.416(a)(1) | 4 |
| lockout | Unexpected restart | 1926.417(b) | 4 |
| roof_edge | Roof edge at RTU/condenser | 1926.501(b)(1) | 4 |
| attic_fall | Stepping through attic ceiling | 1926.501(b)(4)(ii) | 3 |
| ladder | Ladder falls | 1926.1053(b)(1) | 3 |
| crane_pick | RTU crane lift | 1926.1425(b) | 4 |
| manual_lifting | Carrying condensers/furnaces | 1926.21(b)(2) | 2 |
| carbon_monoxide | CO during startup/testing | 1926.55(a) | 4 |
| sheet_metal_cuts | Plenum/duct edges | 1926.95(a) | 2 |

## QA checklist
Load calc on file & matches equipment · clearances/access/filter reach · nitrogen-purge brazing ·
suction line insulated · pressure test + evacuation recorded · charge by subcool/superheat · airflow +
static pressure measured · condensate trap/slope/termination · overflow protection tested · vent &
combustion air (safety) · CO alarm (safety) · gas leak check (safety) · locking caps · MERV 8 filter +
thermostat location · refrigerant recovered, never vented (EPA 608).

## Inspection / acceptance checkpoints
- rough_in (4), equipment_set (5), gas_refrigerant_test (3), final (5) — see pack.

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| M-HV-HEATPUMP-SPLIT | 3-ton heat pump split system | EA | 520000 | 14 | 0 | 0 | platform-baseline estimate |
| M-HV-COND-PUMP | Condensate pump | EA | 9500 | 1 | 0 | 0 | estimate |
| M-HV-OVERFLOW-EA | Overflow switch / secondary pan | EA | 6000 | 0.75 | 0 | 0 | estimate |
| M-HV-ERV | ERV/HRV ventilator | EA | 140000 | 8 | 0 | 0 | estimate |
| M-HV-STARTUP | Startup & commissioning per system | EA | 2500 | 3 | 0 | 0 | estimate |

## Quantity rules
- `M-REFRIG-LINE-LF` = fau × 25 — assumed line-set length per forced-air system.
- `M-HV-OVERFLOW-EA` = fau × 1 — one overflow device per coil.
- `M-HV-STARTUP` = fau × 1 — one commissioning visit per system.

## Blueprint callouts (components)
None this wave (per brief).

## Open questions → REVIEW_QUEUE
- IMC/IRC/IECC section numbers (1107, 1108, R403.7) are edition-dependent — verify against adopted edition.
- No blueprint fact distinguishes heat pump vs furnace, mini-split, or ERV → those assemblies have no quantity rule.
- Manual lifting has no 1926 standard; attic-fall ref is by analogy.
- Duct leakage gate left to the `ductwork` pack (no duct_leakage refs/checklist here).
