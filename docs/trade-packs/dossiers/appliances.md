# Dossier — `appliances` (Appliance Installation)

> Wave: w16 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/appliances.ts` · Status: draft
> Taxonomy: category `interior` · permit_trade `null` · phase `finishes_interior` · CSI `11 31`

## Scope (2–4 sentences)
Delivers, sets, levels and connects residential appliances: ranges / cooktops / wall ovens (incl. the
anti-tip bracket), dishwashers and disposals (drain loop or air gap), refrigerators and ice-maker lines,
over-the-range microwaves and hoods, washers and dryers (incl. the dryer exhaust run). Final gas
connections and leak tests are the licensed fitter's (gas_piping, `P-GAS-APPL-CONN`); 240 V circuits and
hard-wired terminations are the electrician's (`E-EL-240V-CIRCUIT-EA`). Commercial foodservice equipment
is `kitchen_equipment` (`B-KEQ-*`).

## Existing coverage reconciled
- Hand recipe: none (not in HAND_RECIPE_KEYS) → NEW-TRADE pattern, three title_re recipes.
- Catalog codes already seeded: none for appliances; referenced neighbours P-GAS-APPL-CONN,
  E-EL-240V-CIRCUIT-EA, P-FIX-KSINK (hand-seeded from `garbage_disposal`).
- Blueprint template tasks hitting this trade: none.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| appliances-cpsc-range-tipover | CPSC Pub. 5007 Range Tipover Safety Alert | 1 | gov_open | anti-tip hazard, QA, checklist |
| appliances-usfa-dryer-fire | USFA Clothes Dryer Fire Safety flyer | 1 | gov_open | dryer vent hazard, QA |
| appliances-energy-star | ENERGY STAR product pages | 1 | gov_open | certified-model QA |
| appliances-ge-range-install | GE 30" slide-in range installation instructions | 5 | manufacturer_public | anti-tip, clearances, grounding |
| appliances-ge-anti-tip | GE anti-tip bracket page | 5 | manufacturer_public | anti-tip |
| appliances-ge-dryer-install | GE dryer installation instructions | 5 | manufacturer_public | 4" rigid duct, length table, 4-wire cord |
| appliances-ge-dryer-vent-kit | GE dryer venting kit instructions | 5 | manufacturer_public | vent outdoors, no plastic/foil, foil tape |
| appliances-ge-dishwasher-install | GE GDF610 dishwasher instructions (retailer-hosted) | 5 | manufacturer_public | air gap / 32" high loop / brackets |
| ecfr-1926-c,e,f,h,i,k,x | 29 CFR 1926 subparts | 1 | public_domain | hazards |
| icc-pa / nfpa-fa | ICC / NFPA (ref only) | 3 | proprietary_ref_only | checklist ref strings: IRC M1502, IFGC 409/411, NEC 422 |

## Work steps (draft → pack recipes)
- `range_cooktop_install`: verify rough-in → deliver/uncrate/protect → anti-tip bracket + engage test →
  licensed gas/electric connection → level, clearances, burner test.
- `dishwasher_disposal_install`: check opening + rough-in → air gap or high loop → water/power, slide in,
  anchor → test cycle + leak check.
- `laundry_refrigeration_install`: dryer exhaust route → connect/set dryer + washer → refrigerator +
  ice-maker → OTR microwave/hood → test-run + handover.
No gates, no code_refs (permit_trade null).

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| heavy_lift | lifting/moving units | 1926.21(b)(2) | 3 |
| stair_carry | stairs / thresholds | 1926.20(b)(1) | 3 |
| tipover_storage | staged units tipping | 1926.250(a)(1) | 3 |
| range_tipover | range without engaged anti-tip bracket | 1926.20(b)(1) (+CPSC) | 4 |
| electric_shock | live receptacles/boxes | 1926.416(a)(1) | 4 |
| lockout | circuit re-energized | 1926.417(b) | 4 |
| gas_leak | leaking connector | 1926.151(a)(3) | 4 |
| dryer_fire | bad dryer duct | 1926.150(a)(1) (+USFA) | 3 |
| sharp_edges | sheet metal, banding | 1926.95(a) | 2 |
| eye_debris | drilling | 1926.102(a)(1) | 2 |
| tool_grounding | power tools | 1926.302(a)(1) | 2 |
| ladder | stepladders | 1926.1053(b)(1) | 3 |
| burn_test | test run | 1926.95(a) | 2 |

## QA checklist
17 items (6 safety → ES pending): rough-in match, no damage, anti-tip engaged, gas leak test, cord ↔
receptacle, dryer vent material, dryer vent length, hood damper opens, drain loop/air gap, dishwasher
anchored, no leaks, level, clearances, OTR anchored, operation test, ENERGY STAR model, handover docs.

## Inspection / acceptance checkpoints
- rough_in_verify (NEC 422, IFGC 409, IRC M1502 refs) · connections_by_licensed_trades (IFGC 411, NEC 422)
  · anti_tip_check (CPSC Pub. 5007) · final_operation_handover.

## Cost basis (all platform-baseline estimates, 2026 national)
| Code | Item | Unit | Mat ¢ | Hr/unit | Equip ¢ | Waste % |
|---|---|---|---|---|---|---|
| G-APP-SET-EA | set/level/connect fridge, washer or dryer | EA | 2500 | 1.0 | 0 | 0 |
| G-APP-RANGE-EA | range set + anti-tip + test | EA | 3500 | 1.5 | 0 | 0 |
| G-APP-DW-EA | dishwasher install | EA | 3000 | 2.0 | 0 | 0 |
| G-APP-OTR-EA | OTR microwave / hood mount | EA | 1500 | 2.0 | 0 | 0 |
| G-APP-DRYVENT-LF | 4" rigid dryer duct | LF | 450 | 0.2 | 0 | 10 |
| G-APP-PKG-ALLOW-EA | appliance package allowance per dwelling | EA | 350000 | 0 | 0 | 0 |

## Quantity rules
- G-APP-DRYVENT-LF = fixture dryer_vent × 15 · G-APP-SET-EA = fixture dryer_vent × 2 (washer + dryer)
- G-APP-DW-EA = fixture garbage_disposal × 1
- G-APP-RANGE-EA / G-APP-OTR-EA / G-APP-PKG-ALLOW-EA = const 1, residential_sf only

## Blueprint callouts (components)
- none this wave (fixtures `dryer_vent` and `garbage_disposal` already detected).

## Open questions → REVIEW_QUEUE
- Spanish safety text pending (13 hazards, 6 safety QA, 8 checklist items).
- All costs estimates; package allowance highly variable.
- Dishwasher instructions are a GE document hosted by a retailer; OTR microwave instructions not reviewed.
- No 16 CFR rule for range tip-over found — stability is a voluntary standard (UL 858 / ANSI Z21.1, ref only).
- Equipment vocab has no appliance dolly / stair-climber type.
