# Dossier — `ev_charging` (EV Charging)

> Wave: w12 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/ev_charging.ts` · Status: draft
> Taxonomy: category `electrical_systems` · permit_trade `electrical` · phase `sitework` · CSI `26 27`

## Scope (2–4 sentences)
Installs EV charging: residential Level 2 wall units, commercial networked Level 2 pedestals, DC fast
chargers (incl. NEVI-funded sites) and make-ready conduit/circuits for future spaces. Covers load and
service capacity, circuits/feeders, trench and conduit, bases/pads, impact protection, GFCI/commissioning,
network activation, signs and accessible charging spaces. Service upgrades, transformers and switchgear
are coordinated with the electrical trade and utility; paving/striping of the wider lot is sitework.

## Existing coverage reconciled
- Hand recipe: none (not in `HAND_RECIPE_KEYS`) → NEW-TRADE pattern. Without the pack the electrical
  family recipes (building wiring) would render.
- Catalog codes already seeded: `E-EVSE` (40 A L2 circuit, 0030), `E-EL-240V-CIRCUIT-EA` (0050),
  `B-MISC-BOLLARD-EA` (0059) — referenced from quantity_rules, not redeclared. `E-EVSE` is not
  hand-seeded by `quantities.ts`, so the residential rule does not duplicate a line.
- Blueprint template tasks hitting this trade: none. No fixture token for EVSE exists (proposed in REVIEW_QUEUE).

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| ev_charging-afdc-install | AFDC Procurement and Installation for EV Charging Infrastructure | 1/2 | gov_open | planning checklist, networking/OCPP, permits, costs per connector |
| ev_charging-afdc-cost-2015 | DOE Costs Associated With Non-Residential EVSE (2015) | 2 | gov_open | cost drivers (trenching, service upgrades) |
| ev_charging-23cfr680 | 23 CFR 680 (NEVI) | 1 | public_domain | 680.106 ports, connectors, power, certification, EVITP |
| ev_charging-access-board-ev | U.S. Access Board EV charging TA | 1 | public_domain | accessible space, aisle, reach range, clear floor space |
| plumbing-ada-2010 | 2010 ADA Standards | 1 | public_domain | §502/§309 refs |
| nfpa-fa | NFPA 70 (NEC) free access | 3 | proprietary_ref_only | 220.57, 220.87, 625.22/.40/.41/.42/.43/.54, 300.5, 230, 250, 110.3(B) |
| ecfr-1926-c/e/h/k/p/z | 29 CFR 1926 | 1 | public_domain | hazards |

Note: `afdc.energy.gov` did not resolve on the local resolver; both AFDC URLs returned 200 when
resolved via public DNS (8.8.8.8).

## Work steps (draft → pack recipes)
- `evse_level2` (default; `\bEV\b|EVSE|electric vehicle|car charger|charging station…`): load/service
  capacity (220.57, 220.87, 625.42) → locate/trench/conduit [rough_in] (300.5, 625.40) → backfill, bases,
  bollards [cover] → mount/wire/disconnect (625.41, 625.43, 110.3(B)) → energize/GFCI/session/network
  [final] (625.54, 625.22) → signs, accessible space, handover [final] (ADA 2010 502/309).
- `evse_dc_fast` (priority 10; DCFC/fast charg/level 3/NEVI): utility + layout [service] (230, 220.57,
  23 CFR 680.106) → duct bank + pads [rough_in] → backfill + set cabinets [cover] → pull/terminate/bond →
  manufacturer commissioning [final].
- `ev_make_ready` (priority 5; EV-ready/make-ready/future EV): capacity plan → conduit/circuits to
  future spaces [rough_in] → close out [final].

## Hazards (draft → pack hazards)
| id | OSHA ref | Sev |
|---|---|---|
| electrical_contact | 1926.416(a)(1) | 4 |
| energized_unknown | 1926.416(a)(3) | 4 |
| lockout | 1926.417(a) | 4 |
| gfci_tools | 1926.404(b)(1) | 3 |
| utility_strike | 1926.651(b)(1) | 4 |
| trench_spoil | 1926.651(j)(2) | 3 |
| trench_cave_in | 1926.652(a)(1) | 4 |
| traffic | 1926.651(d) | 4 |
| silica | 1926.1153 | 3 |
| rigging | 1926.251(a)(1) | 4 |
| struck_by_load | 1926.21(b)(2) | 4 |
| concrete_skin | 1926.95(a) | 2 |

## QA checklist
15 items: load_calc, listed_equipment*, continuous_sizing*, burial_depth, spare_conduit,
impact_protection*, torque_terminations*, disconnect*, gfci_tested*, session_test, network_online,
accessible_space, reach_range, nevi_ports, handover (* = safety, ES pending).

## Inspection / acceptance checkpoints
- service: load calc + utility approval; service equipment rating.
- rough_in: locate ticket; cover depth, power/data separate; individual circuit or EVEMS.
- cover: backfill/tape; bases poured with stubs.
- final: listed + torqued; OCPD/disconnect; GFCI; impact protection, signs, accessible space.

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| E-EV-L2-WALL-EA | Residential L2 unit, mounted/connected | EA | 53,500 | 1.5 | 0 | 0 | material derived: AFDC $380–690 midpoint; labor estimate |
| E-EV-L2-PEDESTAL-EA | Commercial networked dual-port L2 pedestal | EA | 720,000 | 8 | 0 | 0 | material derived: AFDC ≈$3,500/connector × 2 + $200 base; labor estimate |
| E-EV-DCFC-EA | DCFC ~150 kW per connector allowance | EA | 6,400,000 | 40 | 150,000 | 0 | material derived: AFDC $38–90k midpoint; labor/equip estimate |
| E-EV-TRENCH-LF | Charger conduit trench, power + data | LF | 1,200 | 0.2 | 200 | 5 | estimate |
| E-EV-LOADMGMT-EA | EV load-management controller | EA | 60,000 | 2.5 | 0 | 0 | estimate |
| E-EV-SPACE-SIGN-EA | EV space sign + marking | EA | 15,000 | 1 | 0 | 5 | estimate |

## Quantity rules
- residential_sf: `E-EVSE` × 1, `E-EV-L2-WALL-EA` × 1.
- commercial / residential_mf / industrial: `E-EV-L2-PEDESTAL-EA` × 2, `E-EV-TRENCH-LF` × 150,
  `B-MISC-BOLLARD-EA` × 4, `E-EV-SPACE-SIGN-EA` × 4; residential_mf also `E-EV-LOADMGMT-EA` × 1.
- DCFC has no rule (no blueprint fact identifies it) — estimator adds it manually.

## Blueprint callouts (components)
- none this wave (brief). Candidate: an `evse` fixture token (`EV CHARGER|EVSE|EV OUTLET`) — REVIEW_QUEUE.

## Open questions → REVIEW_QUEUE
- ES safety translations pending (12 hazards, 6 QA, all inspection checklist items).
- All labor hours + trench/load-mgmt/sign costs are estimates.
- NEC section numbers per 2023 edition (625.22/.40/.41/.42/.43/.54, 220.57, 220.87) — confirmed against
  secondary summaries, NFPA free-access reader not fetched (login wall).
- Proposed fixture token `evse` for blueprint extraction.
