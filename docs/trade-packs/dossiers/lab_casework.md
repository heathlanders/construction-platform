# Dossier — `lab_casework` (Laboratory Casework / Equipment)

> Wave: w16 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/lab_casework.ts` · Status: draft
> Taxonomy: category `specialty` · permit_trade `null` · phase `finishes_interior` · CSI `11 53`

## Scope
The trade supplies and installs lab casework in steel or wood, epoxy-resin and phenolic worksurfaces,
reagent shelving and bench fume hoods. It also supports the hood performance test and coordinates
emergency eyewash and shower locations. Other trades own the adjacent work:
- the exhaust duct and fan (ductwork / hvac)
- air balancing (test_balance)
- piping and connections to fittings (plumbing / process_piping / medical_gas)
- power (electrical)
- general millwork (`G-MW-*`, millwork) and residential cabinets (`G-CB-*`, cabinetry)

There is no AHJ permit path, so the pack has no gates or code_refs. The owner and EHS hold points
are in `inspection_checklists`.

## Existing coverage reconciled
- Hand recipe: none. The pack uses the NEW-TRADE pattern with 3 recipes.
- Catalog codes already seeded: none with the `G-LAB-` prefix.
- Blueprint template tasks: none.

## Sources used
| id | Title | Tier | License | Used for |
|---|---|---|---|---|
| lab_casework-ufgs-11-53-13 | UFGS 11 53 13 Lab Fume Hoods & BSCs (Aug 2026) | 1 | public_domain | Hood install, make-up air and interlocks, posted instructions, field test, low-flow alarm, acid-resistant materials |
| lab_casework-wi-dfdm-115313 | WI DFDM Master Spec 11 53 13 | 1 | gov_open | Posted operating-instruction content, monitor alarm |
| lab_casework-ufgs-12-35-53 | UFGS 12 35 53 Laboratory Casework | 1 | public_domain | Scope only; the PDF returned 403 and was not read |
| lab_casework-sefa | SEFA 1 / 2 / 8 | 3–4 | proprietary_ref_only | Cited by name in the checklist |
| lab_casework-ashrae-110 | ANSI/ASHRAE 110 | 3 | proprietary_ref_only | Hood test method named; no values stored |
| lab_casework-ansi-z358-1 | ANSI/ISEA Z358.1 | 3 | proprietary_ref_only | Eyewash and shower location and flush concepts; no values stored |
| lab_casework-ecfr-1910-1450 | 29 CFR 1910.1450 | 1 | public_domain | Context only (general industry) |
| ecfr-1926-c/d/e/f/h/i/k/x | 29 CFR 1926 subparts | 1 | public_domain | Hazards |
| platform-baseline | The Jobsite baseline | — | platform_estimate | All costs |

## Work steps

`lab_casework_install`:
1. Verify rough-ins and backing.
2. Receive, stage and protect.
3. Set, level and anchor.
4. Set the epoxy or phenolic worksurfaces (2+ person lift, seams, wall seal).
5. Install shelving, uprights and fittings.

`fume_hood_install`:
1. Set and anchor the hood.
2. Coordinate the duct, monitor and interlocks.
3. Licensed trades connect the services.
4. Post the instructions, then run the face-velocity and containment test.

`eyewash_shower_coord`:
1. Check the location and the path to it.
2. Witness the flush test.

## Hazards
There are 13 hazards: heavy_lift, pinch_crush, storage_stack, sharp_edge, eye_flying, power_tool,
dust_cutting, chem_adhesive, flammable_solvent, ladder, electric_live, lockout_tag and test_exposure.

The OSHA refs are 1926.20(b)(1), .95(a), .250(a)(1), .102(a)(1), .300(b)(1), .55(a), .59,
.152(a)(1), .1053(b)(1), .416(a)(1) and .417(b). All of them are already in use in reviewed sibling
packs.

1926.152 (flammable liquids) is used instead of 1926.151 (ignition sources) for solvent cleaners.

## QA checklist
There are 15 items, 7 of them safety items (Spanish pending human translation): seismic anchorage,
shelf lip, monitor alarm, make-up air balance, hood test, eyewash path and eyewash flush.

## Inspection / acceptance checkpoints
- `utility_rough_in_check`
- `casework_set_check`
- `fume_hood_certification` (ASHRAE 110 / SEFA 1 / UFGS 11 53 13 3.1–3.3)
- `eyewash_shower_check` (ANSI Z358.1)

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| G-LAB-BASE-LF | Lab base cabinet | LF | 45000 | 0.75 | 0 | 0 | estimate |
| G-LAB-EPOXY-TOP-LF | Epoxy resin top 1 in. | LF | 9500 | 0.5 | 0 | 3 | estimate |
| G-LAB-HOOD-EA | 6 ft bench hood + base, set | EA | 1200000 | 12 | 0 | 0 | estimate |
| G-LAB-HOOD-CERT-EA | Hood performance test | EA | 0 | 4 | 0 | 0 | estimate |
| G-LAB-SHELF-LF | Reagent shelving | LF | 7500 | 0.3 | 0 | 0 | estimate |

## Quantity rules
All rules apply to commercial buildings only and are fixed placeholder quantities:
- BASE: 40 LF
- EPOXY-TOP: 40 LF
- HOOD: 2
- HOOD-CERT: 2
- SHELF: 30 LF

Blueprint facts do not yet include lab casework, so these stay placeholders.

## Blueprint callouts
None this wave.

## Open questions → REVIEW_QUEUE
- Read the UFGS 12 35 53 PDF (blocked by a 403) and add casework installation tolerances if they
  are public.
- Face-velocity acceptance values sit in proprietary standards. The owner or EHS sets the target.
- All `G-LAB-*` costs are estimates and need distributor quotes.
