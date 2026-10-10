# Dossier — `boilers_hydronic` (Boilers / Hydronic)

> Wave: w14 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/boilers_hydronic.ts` · Status: draft
> Taxonomy: category `mechanical_systems` · permit_trade `mechanical` · phase `rough_in` · CSI `23 52`

## Scope
Hot-water heating: sets and vents residential/light-commercial boilers (condensing gas, wall-hung or floor),
near-boiler piping and safety trim (relief valve, expansion tank, air separator, backflow-protected fill,
low-water cutoff), distribution by radiant floor tubing + manifolds or fin-tube baseboard/panel radiators,
indirect water heaters on a boiler zone, pressure tests, gas connection test, fill/purge, startup and
combustion analysis. NOT: steam/power boilers and B31.1 power piping (WI SPS 341.16(2)), chillers,
ground loops (`geothermal`), pipe insulation (`mechanical_insulation`), gas piping runs (`gas_piping`),
balancing reports (`test_balance`), slab pour (`concrete`).

## Existing coverage reconciled
- Hand recipe: none (not in HAND_RECIPE_KEYS); only the generic mechanical phase recipe → NEW-TRADE pattern.
- Catalog codes already seeded: none for hydronics (M-FURNACE etc. are forced-air). New prefix `M-HYD-`.
- Blueprint template tasks hitting this trade: none. Recipes match titles with boiler / hydronic / indirect
  water heater; radiant floor / in-floor heat / heated slab; baseboard heat / fin-tube / panel radiator.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| boilers_hydronic-ufgs-23-52-00 | UFGS 23 52 00 Heating Boilers | 1 | public_domain | piping, venting, radiant 3.6, hydro test 3.10 |
| boilers_hydronic-ufgs-23-52-43 | UFGS 23 52 43.00 20 Low Pressure Water Heating Boilers | 1 | public_domain | install, cleaning, startup/operational tests |
| boilers_hydronic-wi-sps341 | Wis. Admin. Code ch. SPS 341 | 1 | gov_open | WI installation inspection, registration, controls, LWCO |
| hvac-basc-combustion | ENERGY STAR New Homes — Combustion Appliances (BASC) | 1 | gov_open | CO / sealed combustion |
| icc-pa | ICC public access (IMC, IRC, IFGC) | 3 | proprietary_ref_only | section refs only |
| ecfr-1926-c/d/e/h/j/k/m/x/z | 29 CFR 1926 | 1 | public_domain | hazards |
| platform-baseline | The Jobsite cost baseline | — | platform_estimate | all costs |

## Work steps
- `boiler_install` (title boiler/hydronic/indirect): room & vent route check → set boiler [equipment_set] →
  vent, intake, condensate [equipment_set] → near-boiler loop + relief/expansion/air separator/fill [rough_in]
  → hydrostatic test before cover [rough_in] → gas connect + test [gas_refrigerant_test] → fill, purge,
  startup, combustion analysis, limit/LWCO tests, WI registration note [final].
- `radiant_floor` (priority 10): base check → lay/fasten loops [rough_in] → manifold + test, pressurized
  through pour [rough_in] → pour watch, purge, balance, slow warm-up [final].
- `hydronic_baseboard` (priority 5): layout → hang + pipe on slides, vents [rough_in] → test, purge, cover [final].

## Hazards
rigging_lift 1926.251(a)(1) · torch_fire 1926.352(d) · cylinder 1926.350(a)(9) · carbon_monoxide 1926.55(a) ·
gas_leak 1926.21(b)(2) · lockout 1926.417(b) · scald_pressure 1926.95(a) · silica_core 1926.1153(c)(1) ·
fall_exterior 1926.501(b)(13) · ladder 1926.1053(b)(1) · trip_tubing 1926.25(a). All sections read on eCFR 2026-10-08.

## QA checklist (15)
clearances, vent_listed*, relief_discharge*, no_valve_relief*, expansion_tank, backflow_fill, hydro_test,
no_buried_joints, radiant_test, gas_tested*, purged, combustion_test*, safety_controls*, co_check*,
wi_registration (* = safety, ES pending).

## Inspection / acceptance checkpoints
- rough_in: relief + discharge, expansion/air/fill trim, piping and embedded tubing under test before concealment.
- equipment_set: boiler secured with clearances, combustion air, vent per listing.
- gas_refrigerant_test: gas piping test at the boiler.
- final: operating test (limit, LWCO, flame safeguard), combustion + CO readings, WI DSPS registration +
  certified-inspector installation inspection (not 1–2 family — those are done by the municipal/UDC inspector,
  SPS 341.16(1)(b)2; dwelling boilers exempt from registration via 341.18(1)(b),(o) + 341.41(1)(b)1).

## Cost basis (all `estimate`, platform-baseline, national 2026)
| Code | Item | Unit | Material ¢ | Labor hr | Equip ¢ | Waste % |
|---|---|---|---|---|---|---|
| M-HYD-BOILER-RES-EA | condensing boiler + vent kit + near-boiler trim + startup | EA | 550000 | 16 | 0 | 0 |
| M-HYD-RADIANT-SF | O2-barrier PEX ≈9 in o.c. | SF | 120 | 0.02 | 0 | 5 |
| M-HYD-MANIFOLD-EA | manifold ≤6 loops | EA | 45000 | 4 | 0 | 0 |
| M-HYD-BASEBOARD-LF | fin-tube baseboard | LF | 1800 | 0.35 | 0 | 5 |
| M-HYD-ZONE-EA | zone circulator/valve + wiring | EA | 30000 | 3 | 0 | 0 |
| M-HYD-INDIRECT-WH-EA | indirect water heater 40–50 gal | EA | 140000 | 6 | 0 | 0 |

## Quantity rules (residential_sf only; pack is applied only when the project schedules this trade)
- M-HYD-BOILER-RES-EA = const 1 · M-HYD-BASEBOARD-LF = rooms × 10 · M-HYD-ZONE-EA = const 2.
  Radiant/manifold/indirect are catalog-only (no blueprint fact distinguishes radiant from baseboard).

## Blueprint callouts
None this wave (no BOILER/RADIANT component token exists yet — candidate for a later wave).

## Open questions → REVIEW_QUEUE
- IMC/IRC/IFGC section numbers (1004–1011, 1206, 1208, 1209, M2001–M2003, M2101, M2103, IFGC 304/406/503)
  from TOC knowledge; codes.iccsafe.org is JS-rendered so not machine-verified.
- No manufacturer manual cited (Lochinvar/Navien/Uponor URLs not verified) — steps defer to "the manual".
- ASME CSD-1 product page URL 404s; CSD-1 cited only through SPS 341.16(1)(a)3.
- All costs are estimates.
