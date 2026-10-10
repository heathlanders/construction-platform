# Dossier — `electrical` (Electrical)

> Wave: w02 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/electrical.ts` · Status: draft
> Taxonomy: category `electrical_systems` · permit_trade `electrical` · phase `rough_in` · CSI `26`

## Scope (2–4 sentences)
Residential and light-commercial building wiring: temporary jobsite power, service entrance and panels,
grounding and bonding, branch circuits (boxes, NM cable / raceway), AFCI/GFCI protection, smoke/CO alarm
circuits, trim-out and testing. Hands off low-voltage/structured cabling (`low_voltage`), fire alarm
(`fire_alarm`), solar/EV/generators (own trades), and utility-side work (`power_line`).

## Existing coverage reconciled
- Hand recipe: `task-buildout/electrical.ts` (phase-keyed: temp power, service/panel, rough-in boxes →
  conductors → grounds, pre-cover, trim + AFCI/GFCI) → pack **complements** (`recipes: []`). The pack adds
  code refs per gate, hazards, QA, inspection checklists, equipment and assemblies.
- Family code refs already on every task (`code-refs.ts`): 590; 300/310/314; 230/240/250; 300.4; 210.12/210.8/210.52.
  Pack adds 590.6/590.4/590.3; 314.16, 334.30, 240.4(D), 210.11(C), 404.2(C), IRC R314.4; 110.26, 408.4,
  110.14(D), 250.50, 250.104, 230.67; 300.4(D), 314.20; 406.12, 210.70, 408.4.
- Catalog codes already seeded (not redeclared): E-AC-DISCONNECT, E-CIRCUIT-20, E-EVSE, E-GENERATOR-STANDBY,
  E-LIGHT-FIX, E-LIGHT-REC, E-PANEL-100/200, E-RECEP-DUP, E-RECEP-GFCI, E-SERVICE-200, E-SMOKE-CO,
  E-SUBPANEL-100, E-SWITCH-1P, etc. `seedElectrical` already seeds panels, service, duplexes, switches,
  lights, smoke/CO and 20 A circuits — pack rules avoid all of those.
- Blueprint template tasks: "Service entrance & main panel", "Branch circuits — kitchen & bathrooms",
  "Lighting & receptacle rough-in", "Smoke & CO detector rough-in", "Electrical device trim-out & fixtures",
  "Site lighting & parking lot poles", "Under-slab conduit & grounding", … (all handled by the hand recipe).

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| electrical-ufgs-26-20-00 | UFGS 26 20 00 Interior Distribution System (May 2025) | 1 | public_domain | QA (boxes, NM cable, plates, circuit ID, grounding, field tests) |
| ecfr-1926-k | 29 CFR 1926 Subpart K | 1 | public_domain | hazards 1926.404, .416, .417; working clearance 1926.403(i)(1)(i) |
| ecfr-1926-e / -m / -p / -x | Subparts E, M, P, X | 1 | public_domain | 1926.95(a), 1926.102(a)(1), 1926.501(b)(13), 1926.651(b)(1), 1926.1053(b)(12) |
| nfpa-fa | NFPA 70 (NEC) free access | 3 | proprietary_ref_only | code refs (section + paraphrase only) |
| electrical-nfpa-70e | NFPA 70E | 3 | proprietary_ref_only | arc-flash control referenced by name |
| icc-pa | IRC (R314.4) | 3 | proprietary_ref_only | smoke alarm interconnection |
| electrical-neca-neis | NECA NEIS | 4 | proprietary_ref_only | background (workmanship) — not cited on a fact |
| electrical-esfi | ESFi resources | 4 | association_public | background — not cited on a fact |
| platform-baseline | Platform estimate | — | platform_estimate | all assembly costs |

## Work steps
Hand recipe stays authoritative (temp power → service/panel → boxes → conductors → grounds/rough-in call →
pre-cover → trim → AFCI/GFCI test). No pack recipe.

## Hazards
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| live_contact | Contact with energized conductors | 1926.416(a)(1) | 4 |
| lockout | Circuit re-energized during work | 1926.417(b) | 4 |
| arc_flash | Arc flash at panels/service (NFPA 70E ref) | 1926.95(a) | 4 |
| temp_power_gfci | Shock on temporary power | 1926.404(b)(1)(ii) | 3 |
| damaged_cords | Worn/stapled cords | 1926.416(e)(1) | 3 |
| open_panel | Passage through open panel workspace | 1926.416(b)(1) | 3 |
| conductive_ladder | Metal ladder near energized parts | 1926.1053(b)(12) | 3 |
| fall_attic_roof | Falls from upper floors / through attic ceiling | 1926.501(b)(13) | 4 |
| underground_utilities | Striking buried utilities when trenching laterals | 1926.651(b)(1) | 4 |
| eye_injury | Drilling/overhead debris | 1926.102(a)(1) | 2 |

## QA checklist
box fill · wire vs breaker (safety) · cable support · nail plates · grounds made up (safety) · GEC/bonding (safety) ·
torque · working clearance (safety) · panel directory · AFCI/GFCI test incl. line/load reversal (safety, UFGS 3.5.4/3.5.5) ·
smoke/CO interconnection (safety) · tamper-resistant receptacles (safety) · plates tight · polarity + operation.

## Inspection checkpoints
temporary_power (3) · rough_in (6) · service (5) · cover (3) · final (5) — see pack.

## Cost basis (all `estimate`, platform-baseline, 2026 national)
| Code | Item | Unit | Material ¢ | Labor hr | Equip ¢ | Waste % |
|---|---|---|---|---|---|---|
| E-EL-AFCI-BRKR-EA | AFCI/dual-function breaker upgrade (incremental) | EA | 4500 | 0.1 | 0 | 0 |
| E-EL-GFCI-BRKR-EA | GFCI breaker, dedicated circuit (incremental) | EA | 4000 | 0.1 | 0 | 0 |
| E-EL-SPD-EA | Whole-house Type 2 SPD + 2-pole breaker | EA | 12000 | 0.75 | 0 | 0 |
| E-EL-240V-CIRCUIT-EA | 240 V 30–50 A appliance circuit, 40 ft avg | EA | 18500 | 2.5 | 0 | 5 |
| E-EL-TEMP-POLE-EA | Temporary power pole, set/inspect/remove | EA | 40000 | 4 | 0 | 0 |

## Quantity rules
- `E-EL-AFCI-BRKR-EA` = rooms × 1.5 (dwellings) — mirrors E-CIRCUIT-20 count
- `E-RECEP-GFCI` = gfci_outlet legend × 6 (dwellings)
- `E-EL-GFCI-BRKR-EA` = garbage_disposal × 1 (dwellings) — dishwasher circuit
- `E-EL-SPD-EA` = const 1 (residential_sf) — 2020+ NEC 230.67
- `E-EL-240V-CIRCUIT-EA` = const 2 (residential_sf) — range + dryer, delete if gas
- `E-EL-TEMP-POLE-EA` = const 1 (residential_sf)

## Blueprint callouts (components)
None this wave.

## Open questions → REVIEW_QUEUE
- 10 hazards + 7 safety QA + 22 inspection checklist items pending human ES translation.
- All 5 assembly costs are `estimate`.
- NECA NEIS and ESFi sit behind Cloudflare bot shields (scripted 403) — confirm URLs in a browser.
- 230.67 SPD and 110.14(D) torque depend on NEC edition (2020+/2017+); SPD/240 V const rules may over-seed.
- Pack:smoke passes no building type, so quantity rules (all building-type scoped) show 0 there; verified
  separately with `residential_sf` → 6 lines.
