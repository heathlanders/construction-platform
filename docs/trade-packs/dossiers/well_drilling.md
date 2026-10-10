# Dossier — `well_drilling` (Well Drilling)

> Wave: w02 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/well_drilling.ts` · Status: draft
> Taxonomy: category `sitework` · permit_trade `plumbing` · phase `site_prep` · CSI `33 21`

## Scope
Drills, cases and grouts private (low-capacity) water wells; installs the pump, pitless adapter, well cap
and pressure tank; disinfects, flushes and samples; files the state well construction report; fills and
seals unused wells. Hands off to plumbing at the pressure tank / building water service, and to the
electrician for the pump circuit from the panel. High-capacity, school and municipal wells (NR 812.152,
NR 811) are out of scope for these recipes.

## Existing coverage reconciled
- Hand recipe: none (falls to the plumbing family recipe by phase today) → pack = NEW-TRADE pattern, 2 recipes.
- Catalog codes already seeded: none `P-WELL-*` (checked against /tmp/w02-codes.txt).
- Blueprint template tasks hitting this trade: none.
- Regulator: in Wisconsin private wells are regulated by the state DNR under NR 812, not the local plumbing
  AHJ — so recipe 1 (drilling) carries no gating inspection; the state requirements are surfaced as
  WI NR code refs + QA + inspection-checklist items. Recipe 2 gates `water_supply` (service line test, where a
  local inspector requires it) and `final` (disinfection/sample).

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| well_drilling-wi-nr812 | Wis. Admin. Code ch. NR 812 (Register Feb 2026 No. 842) | 1 | gov_open | steps, code refs, QA, checklists |
| well_drilling-wi-dnr-pump-install | WI DNR — well drillers and pump installers | 1 | gov_open | report filing, licensing |
| well_drilling-wi-dnr-filling-sealing | WI DNR — filling and sealing unused wells | 1 | gov_open | abandonment scope |
| well_drilling-wi-dnr-well-test | WI DNR — private well water testing | 1 | gov_open | sampling QA |
| well_drilling-epa-private-wells | EPA — Private Drinking Water Wells | 1 | gov_open | general practice |
| well_drilling-ngwa-planning / -testing | NGWA wellowner.org | 4 | association_public | practice (tank precharge, testing) |
| ecfr-1926-c/d/e/h/i/k/m/o/p/z | 29 CFR 1926 subparts | 1 | public_domain | hazards |
| icc-pa | IPC 602.3, 610 | 3 | proprietary_ref_only | family code refs |
| platform-baseline | expert baseline | — | platform_estimate | all costs |

Verified NR 812 sections (read from the Feb 2026 PDF): 812.08 location/Table A separation distances,
812.09 approvals, 812.10 driller duties incl. (11) well construction report within 30 days to DNR + owner,
812.12 drilled-well construction / special casing-depth areas, 812.19 plumbness/alignment, 812.20 grouting
(tremie to bottom, bottom-to-surface, one operation, equal density return), 812.26 filling and sealing,
812.28 lead-free pump installation materials, 812.29 casing ≥12 in. above grade, 812.30 vermin-proof cap +
screened downward vent, 812.31 pitless adapters, 812.32 pumps (food-grade lubricant, no control box in the
casing), 812.33 pressure tanks, 812.41 disinfection (plain hypochlorite)/flushing/sampling, 812.46 samples
(coliform + nitrate after new construction; + arsenic for pump work entering an existing well).
OSHA sections verified on law.cornell.edu mirror. Note 1926.1400(c)(11) excludes dedicated drilling rigs
from Subpart CC, so the power-line hazard cites Subpart O 1926.600(a)(6).

## Work steps
**drill_case_grout_well** (`Drill and case private water well`): locate + setbacks (812.08/812.09) →
rig setup + upper hole (812.10) → casing to depth (812.12/812.19) → grout bottom-to-top (812.20) →
develop, casing height, construction report (812.10/812.29). No gates (state-regulated).
**pump_tank_sample** (`Install well pump and pressure tank`, priority 10): pitless adapter (812.31) →
pump/drop pipe/wire (812.28/812.32) → cap + pressure tank (812.30/812.33) → service-line test
[gate water_supply, IPC 602.3] → disinfect/flush/sample [gate final, 812.41/812.46, IPC 610].

## Hazards
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| power_line_mast | mast/hoist line contact with overhead lines | 1926.600(a)(6) | 4 |
| rotating_entangle | rotating drill string / cathead | 1926.300(b)(2) | 4 |
| pipe_handling | hoisting casing/drill pipe | 1926.251(a)(1) | 3 |
| open_hole_fall | open drillhole / mud pit | 1926.501(b)(7)(ii) | 3 |
| trench_cavein | pitless trench | 1926.652(a)(1) | 4 |
| trench_spoil | spoil at trench edge | 1926.651(j)(2) | 3 |
| noise | rig/compressor/hammer | 1926.52(a) | 2 |
| silica_dust | rock drilling, cement grout | 1926.1153(c)(1) | 3 |
| air_hose | compressor hose whip | 1926.302(b)(7) | 3 |
| pump_shock | pump circuit | 1926.416(a)(1) | 4 |
| chlorine | well disinfection | 1926.59 | 2 |
| eye_flying | cutting/welding casing | 1926.102(a)(1) | 2 |

## QA checklist
16 items: setbacks (safety), casing not in building, upper hole protected, casing depth, plumbness, grout
full length, casing height, report filed, pitless watertight, lead-free parts, wire in raceway (safety), cap
vented, tank precharge, pump cycle, disinfected/flushed (safety), sample results (safety).

## Inspection / acceptance checkpoints
- water_supply: pitless watertight below frost; service line test; tank with switch/gauge/relief.
- final: casing height + cap/vent; setbacks documented; DNR well construction report; lab results; old wells sealed.

## Cost basis (all `platform-baseline`, confidence `estimate`)
| Code | Unit | Material ¢ | Labor hr | Equip ¢ | Waste % |
|---|---|---|---|---|---|
| P-WELL-DRILL-LF | LF | 300 | 0.12 | 1500 | 0 |
| P-WELL-CASE-LF | LF | 2400 | 0.06 | 300 | 5 |
| P-WELL-PUMP-EA | EA | 160000 | 8 | 30000 | 0 |
| P-WELL-TANK-EA | EA | 65000 | 3 | 0 | 0 |
| P-WELL-SAMPLE-EA | EA | 9000 | 2 | 0 | 0 |
| P-WELL-SEAL-EA | EA | 60000 | 6 | 20000 | 10 |

## Quantity rules
None. No blueprint fact today signals a private well (no fixture or component token), and a `const` scoped
only by building type would seed a well on every house — most are on municipal water. Proposed: a
`private_well` component token (plan callouts like "PRIVATE WELL", "PROPOSED WELL") in a later wave.

## Blueprint callouts
None this wave (rule).

## Open questions → REVIEW_QUEUE
- vocab: equipment types `well_drilling_rig` and `pump_hoist` don't exist; pack uses air_compressor /
  dump_truck / excavator only.
- vocab: component token `private_well` to enable quantity rules.
- cost_estimate: all six P-WELL-* assemblies are platform-baseline estimates; drilling $/LF varies strongly
  by geology/region.
- scope: no gating inspection for the drilling recipe — WI DNR (not the local plumbing AHJ) regulates;
  consider a state-regulated checkpoint type if other states' packs need it.
- es_safety: 12 hazards + 4 safety QA + 8 checklist items pending human translation.
