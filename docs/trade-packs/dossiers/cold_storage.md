# Dossier — `cold_storage` (Cold Storage / Walk-Ins)

> Wave: w14 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/cold_storage.ts` · Status: draft
> Taxonomy: category `specialty` · permit_trade `mechanical` · phase `finishes_interior` · CSI `11 41` (catalog rows use `13 21 26`, the UFGS cold-storage-room section)

## Scope (2–4 sentences)
Builds walk-in coolers, walk-in freezers and prefabricated cold-storage rooms: slab check, floor panels or screed,
the heated/vented insulated freezer floor (insulation + heat cable or vent tubes; concrete by the concrete trade),
cam-locked panel erection, door section with closer / heater wire / strip curtain / inside release, sealing,
evaporator hanging and condensate drain, and pulldown + 24 h run. Does NOT do condensing units, line sets,
brazing, evacuation, charging or EPA 608 handling — that is the `refrigeration` pack. Electrician lands power.

## Existing coverage reconciled
- Hand recipe: none (not in `HAND_RECIPE_KEYS`) → NEW-TRADE pattern, 2 recipes.
- Catalog codes already seeded: none for walk-ins (`M-REFRIG-LINE-LF`, `M-CONDENSER` belong to refrigeration/HVAC — not repeated).
- Blueprint template tasks hitting this trade: none.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| cold_storage-ufgs-13-21-26 | UFGS 13 21 26 Cold-Storage Rooms (Prefab Panel) | 1 | public_domain | evaporator/drain/heat cable, alarm, thermometer, strip curtain, 24 h start-up test |
| cold_storage-ecfr-10cfr431-306 | 10 CFR 431.306 DOE walk-in standards | 1 | public_domain | door closers, infiltration control, R-25/R-32/R-28, ECM fans, lighting |
| cold_storage-doe-wicf | DOE BTO walk-in program page | 1 | gov_open | context (component certification) |
| cold_storage-norlake-install | Nor-Lake/Master-Bilt walk-in installation manual | 5 | manufacturer_public | slab ±1/2 in., vapor barrier, screed in NSF sealant, cam latches, ceiling handling, door self-close test, heater/relief port, final checklist |
| cold_storage-naks-wic-manual | NAKS walk-in cooler & freezer manual | 5 | manufacturer_public | clearances, inside release, condensate routing outside the box, sealed penetrations |
| icc-pa | ICC public access | 3 | ref only | IMC 307.2, Ch. 11, 1108; IBC 2603; IECC C403.11.2 |
| ecfr-1926-{c,d,e,h,k,m,x} | 29 CFR 1926 | 1 | public_domain | hazards |

## Work steps (draft → pack recipes)
`walk_in_box` (title_re walk-in / cooler box / freezer box / cold storage / cold room):
1. Check slab, layout, clearances. 2. Set floor panels or screed (NSF sealant). 3. Erect walls/ceilings, cam-lock.
4. Door, closer, strip curtain, inside release (10 CFR 431.306(a)). 5. Seal penetrations and wire — gate rough_in (IBC 2603).
6. Evaporator + condensate drain — gate equipment_set (IMC 307.2). 7. Refrigeration hookup/leak test by refrigeration trade —
gate gas_refrigerant_test (IMC 1108). 8. Pulldown, 24 h run, turnover — gate final (10 CFR 431.306(a), IECC C403.11.2).

`freezer_floor` (priority 10; freezer floor/slab, underfloor heat/vent, frost heave): design check → heat cable or vent
tubes (gate rough_in) → insulation + vapor barrier → retest after pour, control set (gate final).

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| panel_stack | panels tipping in storage/handling | 1926.250(a)(1) | 3 |
| top_of_box_fall | fall from box top | 1926.501(b)(1) | 4 |
| ladder | ladder fall | 1926.1053(b)(1) | 3 |
| electric_shock | wiring heaters/lights/floor heat | 1926.417(b) | 4 |
| cord_gfci | tools on wet floors | 1926.404(b)(1) | 3 |
| drill_debris | chips/foam in eyes | 1926.102(a)(1) | 2 |
| sealant_chem | sealants/foam in closed box | 1926.59(h) | 2 |
| sheet_cut | panel skin edges | 1926.95(a) | 2 |
| lock_in | entrapment inside box | 1926.21(b)(2) (general training) | 4 |
| cold_stress | work in running freezer | 1926.28(a) (PPE duty) | 3 |
| refrigerant_asphyx | refrigerant / low O2 in closed box | 1926.55(a) | 3 |
| slip_trip | wet/frosted floor, scraps | 1926.25(a) | 2 |

## QA checklist
15 items: slab level, layout/clearances, vapor barrier, screed sealed, latches + plumb/level, door self-close + infiltration
control, inside release (safety), penetrations + base sealed, junction boxes sealed (safety), drain slope/trap/heat trace,
24 h pulldown, alarm tested (safety), energy compliance, freezer floor insulation, floor heat tested (safety).

## Inspection / acceptance checkpoints
- rough_in: foam protection, sealed penetrations, floor heat before cover
- equipment_set: evaporator access, condensate drain
- gas_refrigerant_test: refrigeration trade pressure test (reference)
- final: door/release, strip curtain/lights/R labels, 24 h log + O&M

## Cost basis (all `estimate`, platform-baseline, national 2026)
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % |
|---|---|---|---|---|---|---|
| M-CS-COOLER-SF | cooler box panels per SF floor (no door) | SF | 6500 | 0.30 | 0 | 0 |
| M-CS-FREEZER-SF | freezer box panels per SF floor (no door) | SF | 8000 | 0.35 | 0 | 0 |
| M-CS-FLRHEAT-SF | freezer floor heat/vent + insulation + poly | SF | 900 | 0.08 | 0 | 8 |
| M-CS-DOOR-EA | door section w/ heater, closer, release, curtain, light | EA | 180000 | 4 | 0 | 0 |
| M-CS-EVAP-EA | evaporator hung + drain (no line set/charge) | EA | 160000 | 6 | 0 | 5 |

Math: 8×10×7.5 ft cooler ≈ 430 SF panel ≈ $5.2k ÷ 80 SF floor ≈ $65/SF; two installers ~1.5 days.

## Quantity rules
Commercial only (and only when the project schedule carries cold_storage tasks): cooler 80 SF, freezer 64 SF,
freezer floor 64 SF, doors 2, evaporators 2 — placeholders to replace with the box schedule.

## Blueprint callouts (components)
None this wave (no walk-in token exists; proposed for a later wave: `walk_in_cooler` / `walk_in_freezer`).

## Open questions → REVIEW_QUEUE
- IECC walk-in section number varies by edition (C403.11.2 in 2021) — confirm against the adopted edition.
- Inside-release requirement: sourced from manufacturer manuals only; no public code/OSHA rule found.
- Freezer frost-heave protection: no public numeric source; steps are general practice.
- Manufacturer manuals are hosted by distributors (Labrepco, HoodMart), not the makers.
