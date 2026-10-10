# Dossier — `pavement_marking` (Pavement Marking / Striping)

> Wave: w19 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/pavement_marking.ts` · Status: draft
> Taxonomy: category `sitework` · permit_trade `null` · phase `sitework` · CSI `32 17 23`

## Scope (2–4 sentences)
Layout and striping of parking lots, drive aisles and streets: stall and lane lines, accessible (ADA)
stalls with access aisles and ISA symbols, arrows, words, crosswalks, curb and fire-lane markings in
paint, epoxy or thermoplastic with glass beads, and removal of old lines. Hands off paving to
`asphalt_paving`, curb ramps / detectable warning fields and walks to `concrete_flatwork`, sign posts to
`signage`, and work-zone setups on public roads to `traffic_control`.

## Existing coverage reconciled
- Hand recipe: `task-buildout/nopermit.ts` case `pavement_marking` ("Lay out & stripe", ADA layout QA)
  → pack **complements** (`recipes: []`). No AHJ permit → no gates, no `code_refs`; owner/GC hold points
  live in `inspection_checklists` (`layout_approval`, `material_submittal`, `final_acceptance`).
- Catalog codes already seeded: `G-STRIPE-STALL` (0037, per-stall rate — not seeded by any quantity
  seeder; not redeclared). Related but other trades: `G-SCT-STRIPE-EA` (court lines), WisDOT 602
  detectable warning fields (concrete scope).
- Blueprint template tasks: "Site signage, striping & ADA compliance" (commercial), "Site markings,
  safety striping & ADA ramps" (industrial), "Site signage & pavement markings" (res-mf) — all served by
  the hand recipe.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| pavement_marking-mutcd-part3 | FHWA MUTCD 11th ed. Part 3 Markings | 1 | public_domain | colors, line widths, retroreflectivity, legends, ISA, crosswalks |
| pavement_marking-wisdot-ss-646 | WisDOT SS 646 Pavement Marking (2025) | 1 | gov_open | surface prep, mils/beads, temperature limits, removal, acceptance |
| pavement_marking-odot-644 | Ohio DOT Item 644 Thermoplastic (2013 CMS) | 1 | gov_open | thermo temperature 400–440 °F, 125 mil, kettle thermostat |
| pavement_marking-access-board-ch5 | U.S. Access Board guide Ch. 5 Parking | 1 | public_domain | 208.2 counts, van ratio, aisle marking, 1:48, 98 in. |
| plumbing-ada-2010 | 2010 ADA Standards (DOJ) | 1 | public_domain | 502.2/502.3/502.4/502.6 dimensions, sign height |
| asphalt_paving-wisdot-aup | WisDOT Average Unit Price List FY2023–25 | 2 | gov_open | derived costs (646.x items) |
| asphalt_paving-mutcd-part6 | MUTCD 11th ed. Part 6 | 1 | public_domain | work zones, flaggers |
| ecfr-1926-d/e/f/g/o/z | 29 CFR 1926 subparts | 1 | public_domain | hazards |

## Work steps
Hand recipe kept (single "Lay out & stripe" step). No pack recipe.

## Hazards
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| traffic_struck_by | Struck by traffic in open lot/street | 1926.200(g)(2) | 4 |
| flagger_exposure | Flagger struck | 1926.201(a) | 4 |
| striper_backing | Backing striper/truck | 1926.601(b)(4) | 4 |
| thermo_burns | Molten thermoplastic ~400–440 °F | 1926.95(a) | 3 |
| propane_kettle | Propane kettle/burner fire | 1926.153 | 3 |
| flammable_storage | Paint/solvent/fuel fire | 1926.152(a)(1) | 3 |
| solvent_vapors | Paint/epoxy vapors | 1926.55(a) | 2 |
| hazcom | Chemical contact, SDS/labels | 1926.59 | 2 |
| silica_removal | Grinding/blasting old lines | 1926.1153(c)(1) | 3 |
| flying_particles | Beads, grit, chips | 1926.102(a)(1) | 2 |
| noise | Grinders, blasters, compressors | 1926.101(a) | 2 |
| heat_stress | Hot pavement + kettle | 1926.51(a)(1) | 3 |

## QA checklist
14 items — traffic control/wet-line cones (safety), layout vs plan, surface ready, temperature limits
(646.3.1.3, ODOT 644.04), thickness/bead rate (646.3.1.2), thermoplastic temp/thickness, sharp edges,
MUTCD colors, ADA count + van ratio (208.2), ADA dimensions (502.2/502.3), aisle marking/level (502.3.3/502.4),
ISA symbol + sign height (MUTCD 3B.22, ADA 502.6), crosswalks (3C.03), removal (646.3.1.4).

## Inspection / acceptance checkpoints
- layout_approval: layout vs site plan, ADA 208.2 count, 208.3 location, traffic control
- material_submittal: product data/certs, temperature log
- final_acceptance: line quality, retroreflectivity (roadway), aisles/ISA/signs, device pickup

## Cost basis
| Code | Unit | Mat ¢ | Labor hr | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|
| G-PM-LINE-PAINT-LF | LF | 8 | 0.0015 | 4 | 5 | WisDOT 646.1005 avg ≈$0.31/LF (derived) + estimate |
| G-PM-THERMO-LF | LF | 55 | 0.006 | 15 | 8 | estimate; 0.44 lb/LF from ODOT 644 rate table × ~$1.10/lb |
| G-PM-LEGEND-EA | EA | 2500 | 1.5 | 1500 | 5 | WisDOT 646.5005/5105 $125–$200 (derived) |
| G-PM-ADA-SYMBOL-EA | EA | 3000 | 1.25 | 1000 | 5 | WisDOT 646.5205 $148 (derived) + aisle hatching |
| G-PM-CROSSWALK-LF | LF | 90 | 0.03 | 25 | 5 | WisDOT 646.7505 $3.75/LF (derived) |
| G-PM-REMOVE-LF | LF | 0 | 0.005 | 15 | 0 | WisDOT 646.9000/9010 $0.26–$0.76 (derived) |

## Quantity rules
- `G-PM-ADA-SYMBOL-EA` = const 2 when `has_accessibility` flag on a commercial plan (ADA 208.2 minimum
  for 26–50 stalls) — placeholder until the stall count is read.

## Blueprint callouts (components)
None this wave.

## Open questions → REVIEW_QUEUE
- Safety ES pending: 12 hazards + 1 QA + 2 checklist items.
- Thermoplastic cost is platform estimate (no WisDOT thermo bid item).
- ODOT 644 cited is the 2013 CMS edition; current ODOT edition may differ.
- Vocab: striping machine / thermoplastic kettle / line remover not in equipment vocab.
- No blueprint fact gives stall count or LF of striping → no line/legend quantity rules.
