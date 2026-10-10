# Dossier — `geothermal` (Geothermal)

> Wave: w14 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/geothermal.ts` · Status: draft
> Taxonomy: category `mechanical_systems` · permit_trade `mechanical` · phase `rough_in` · CSI `23 21`

## Scope (2–4 sentences)
Closed-loop ground-source heat pump systems: vertical bore loops (drill, U-bend, grout), horizontal
trench / slinky and pond loops, fused HDPE headers into the building, pressure test, flush/purge and
approved-fluid fill, then the water-to-air / water-to-water heat pump, flow center and start-up.
Not covered: open-loop (pump-and-dump) wells — `well_drilling`; ductwork — `ductwork`/`hvac`;
power to the unit — `electrical`; DX copper loops (WI-allowed, rare) not detailed.

## Existing coverage reconciled
- Hand recipe: none (not in HAND_RECIPE_KEYS) → NEW-TRADE pack; generic mechanical phase recipe applied before.
- Catalog codes already seeded: none `M-GEO-*`; `M-HV-HEATPUMP-SPLIT` is air-source (not reused).
- Blueprint template tasks hitting this trade: none (0). Recipes key on titles: geothermal, ground-source,
  geo loop, GSHP, loop field, bore field, earth-coupled; vertical/horizontal/pond sub-recipes at priority 10.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| geothermal-wi-nr812-151 | WI NR 812.151 — Heat exchange drillhole location and construction | 1 | gov_open | license, notification, setbacks, pressure test, drilling fluid, 24 h grout, approved grouts, tremie method, fusion, report, fluids, abandonment |
| well_drilling-wi-nr812 (reused) | WI NR 812 full chapter | 1 | gov_open | 812.03(5) utility/wellhead contact, 812.08(5) 10 ft separations, 812.09(4)(w)–(z) approvals |
| geothermal-wi-dnr-hx | WI DNR — Heat exchange drilling (geothermal systems) | 1 | gov_open | allowed system types, license requirement |
| geothermal-wi-dnr-notification | WI DNR — Well and heat exchange notification | 1 | gov_open | notification process |
| geothermal-doe-consumer-guide | DOE Consumer Guide to Geothermal Heat Pumps | 1 | gov_open | horizontal ≥4 ft deep, pond coils ≥8 ft, loop types, ~$2,500/ton unit cost context |
| geothermal-igshpa-standards | IGSHPA Standards | 4 | proprietary_ref_only | design/flush/test topics (no values) |
| icc-pa | IMC 1210 / IRC M2105 (section titles verified via up.codes mirror) | 3 | proprietary_ref_only | code refs |
| ecfr-1926-c/d/e/k/o/p/z | 29 CFR 1926 | 1 | public_domain | hazards |

## Work steps (draft → pack recipes)
**geo_ground_loop_system** (`Install geothermal heat pump system`): design check (IMC 1210.1 / IRC M2105.1) →
notices + locates (NR 812.151(3), 812.09(4)(x), 812.03(5)) → install loops [rough_in] (1210.8) → fuse header
[rough_in] (1210.6.6.1, NR 812.151(11), IRC M2105.19) → pressure test before backfill [rough_in] (1210.10,
IRC M2105.28, NR 812.151(6)) → flush/purge/fill (NR 812.151(13), 1210.8.10) → set unit/flow center
[equipment_set] (1210.7, IRC M2105.15) → start-up [final].
**geo_vertical_bore** (priority 10, `Drill geothermal vertical bore field`): layout/setbacks (812.08(5), 812.151(1))
→ drill + protect (812.151(7)(8)) [rough_in] → insert U-bend (812.151(6)) [rough_in] → tremie grout bottom-up
(812.151(9)(10)) [rough_in] → bore log + DNR report within 30 days (812.151(12)).
**geo_horizontal_pond_loop** (priority 10, `Geothermal horizontal loop trench`): dig trenches ≥4 ft [rough_in]
→ lay pipe/slinky (1210.8) → pond coils ≥8 ft deep → test then backfill + warning tape (1210.10).

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| drill_rig | rotating drill string / rod handling | 1926.21(b)(2) | 4 |
| power_lines | mast near overhead lines | 1926.600(a)(6) | 4 |
| utility_strike | buried utilities | 1926.651(b)(1) | 4 |
| trench_cave_in | loop/header trench cave-in | 1926.652(a)(1) | 4 |
| struck_by_equipment | backing machines | 1926.602(a)(9)(ii) | 4 |
| silica | drilling rock / sand grout | 1926.1153(d)(1) | 3 |
| noise | rig, compressor, mud pump | 1926.101(a) | 2 |
| fusion_burn | heater plate | 1926.95(a) | 2 |
| pressure_release | cap/hose blow-off in test | 1926.21(b)(2) | 3 |
| antifreeze_chem | loop fluid exposure | 1926.59 | 2 |
| drowning | pond loop placement | 1926.106(a) | 4 |
| lockout | unit wiring | 1926.417(b) | 4 |

## QA checklist
15 items: loop_design_match, setbacks (safety), notification_filed, bore_depth, grout_bottom_up (safety),
grout_approved, pipe_capped, fusion_joints, trench_depth, pressure_test, purged, fluid_approved (safety),
unit_clearance, startup_readings, as_built_map.

## Inspection / acceptance checkpoints
- rough_in: bores grouted bottom-up with approved grout + notification; fusion complete + pressure test before backfill; header sleeved/sealed.
- equipment_set: unit + flow center clearance, shutoffs, flush ports; disconnect + condensate.
- final: approved fluid labeled; start-up readings + as-built map; DNR report within 30 days.
- No duct_leakage / gas_refrigerant_test content (water loop; factory-sealed refrigerant; ducts by ductwork trade).

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| M-GEO-VBORE-LF | vertical bore + U-bend + grout | LF | 350 | 0.06 | 700 | 5 | platform estimate |
| M-GEO-HTRENCH-LF | horizontal loop trench | LF | 400 | 0.05 | 300 | 5 | platform estimate |
| M-GEO-HEADER-LF | header trench + fused piping | LF | 600 | 0.15 | 300 | 5 | platform estimate |
| M-GEO-VAULT-EA | buried manifold vault | EA | 250000 | 12 | 40000 | 0 | platform estimate |
| M-GEO-FLUSH-EA | pressure test, flush/purge, fluid fill | EA | 40000 | 8 | 15000 | 5 | platform estimate |
| M-GEO-GSHP-EA | 3–5 ton water-to-air GSHP + flow center | EA | 900000 | 16 | 0 | 0 | platform estimate (DOE ~$2,500/ton unit context) |

## Quantity rules
- `M-GEO-GSHP-EA` = const × 1 (residential_sf)
- `M-GEO-VBORE-LF` = const × 600 (residential_sf) — replace with loop design
- `M-GEO-HEADER-LF` = const × 60 (residential_sf)
- `M-GEO-FLUSH-EA` = const × 1 (residential_sf)

## Blueprint callouts (components)
- none this wave.

## Open questions → REVIEW_QUEUE
- No `drill_rig` in equipment-vocab — rig recommended in text only (vocab proposal).
- All 6 assembly costs are platform estimates.
- IMC/IRC section numbers verified against 2021 editions via up.codes mirror (ICC site 403 to scripts); confirm against the adopted edition.
- WI notice timing: 812.03(2) says one work day; 812.151(3) says notification permit ≥24 h — pack states 24 h.
- 812.091 approved heat exchange fluid list not stored (DNR product approval list) — pack says "approved fluid".
