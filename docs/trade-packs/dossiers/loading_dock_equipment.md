# Dossier — `loading_dock_equipment` (Loading Dock Equipment)

> Wave: w17 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/loading_dock_equipment.ts` · Status: draft
> Taxonomy: category `specialty` · permit_trade `building` · CSI 41 22 00 (pit curb angles 05 50 00)

## Scope
Pit and edge-of-dock levelers, vehicle restraints, dock seals/shelters, bumpers, dock lights and interlocks:
pit forms and curb-angle embeds (coordinated with concrete), set and weld/anchor, hydraulic/electrical hookup,
interlocks, test and training. Overhead dock DOORS belong to `overhead_doors`; power feed to electrical; pit concrete to concrete.

## Existing coverage reconciled
- Hand recipe: none (building.ts generic) → pack is NEW-TRADE.
- Catalog codes already seeded: none for `B-LDE-`; `G-DOCK-` is residential docks (wave 7).
- Blueprint template tasks: industrial.ts 'Overhead dock doors, man-doors & loading bumpers' is `overhead_doors` — not matched here.

## Sources used
| id | Title | Tier | License | Used for |
|---|---|---|---|---|
| ecfr-1926-c/e/f/h/j/k/m/x/z/l | 29 CFR 1926 subparts | 1 | public_domain | hazards (refs verified on eCFR) |
| loading_dock_equipment-ecfr-1926-417 | 1926.417 tagging of circuits | 1 | public_domain | stored-energy hazard / QA |
| loading_dock_equipment-ecfr-1926-351 | 1926.351 arc welding | 1 | public_domain | weld step reference |
| loading_dock_equipment-lema/ritehite/bluegiant | association + maker sites | 4/5 | association/manufacturer_public | general sequence; manuals NOT read line by line |
| icc-pa | IBC 1705.3 | 3 | proprietary_ref_only | foundation gate ref |

## Work steps
Recipe `dock_pit_embeds`: verify layout; form pit + curb angles (gate foundation); strip/recheck.
Recipe `dock_equipment_install`: set + weld/anchor leveler; hydraulic/air + electrical; restraint/lights/bumpers; seals/shelters; test + train (gate final).

## Hazards
14 hazards: pit fall (501(b)(4)), crush under deck (20(b)), stored energy (417), fluid injection (95), weld fire (352), shock (404), rigging (251), silica (1153), aerial lift (453), ladder (1053), trailer creep (20(b)), eye, concrete burn, housekeeping (25(a)).

## Cost basis
All platform-baseline `estimate`: LEVELER-EA 650000¢/24h, RESTRAINT-EA 420000¢/8h, SEAL-EA 180000¢/6h, BUMPER-EA 18000¢/1.5h, CURB-LF 3500¢/0.2h.

## Quantity rules
Industrial const placeholders: 2 levelers/restraints/seals/bumper pairs, 48 LF curb angle.

## Blueprint callouts
None this wave.
