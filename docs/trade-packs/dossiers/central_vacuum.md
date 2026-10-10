# Dossier — `central_vacuum` (Central Vacuum)

> Wave: w17 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/central_vacuum.ts` · Status: draft
> Taxonomy: category `specialty` · permit_trade `building` · phase `rough_in` · CSI `11 24`

## Scope
Residential central vacuum: inlet layout, PVC tubing and low-voltage wire rough-in, power unit and outdoor exhaust, inlet trim, hose kit, suction test. Excludes the power circuit (electrical), drywall and paint (finish trades) and fire-rated assembly design (GC/framing).

## Existing coverage reconciled
- Hand recipe: none (family `building.ts` has no central vacuum branch) → pack is NEW-TRADE; tasks route here via title_re.
- Catalog codes already seeded: none (`B-CVAC-*` new).
- Blueprint template tasks hitting this trade: none.

## Sources used
| id | Title | Tier | License | Used for |
|---|---|---|---|---|
| central_vacuum-vacumaid | VacuMaid install overview | 5 | manufacturer_public | component vocabulary only |
| central_vacuum-hp-help | H-P Products support hub | 5 | manufacturer_public | vocabulary; manuals per model |
| icc-pa | ICC public access (IRC R302.4, R302.11, R502.8, R602.6) | 3 | proprietary_ref_only | code refs (section numbers only; not opened — site returned 403) |
| ecfr-1926-c/d/e/f/i/k/m/x/z | 29 CFR 1926 subparts | 1 | public_domain | hazards |

## Work steps
1. Lay out inlets/power unit. QA: inlet_coverage, unit_location.
2. Rough-in tubing — Gate: insulation. Code: IRC R302.11, R302.4, R602.6.
3. Low-voltage wire + power unit + exhaust.
4. Trim inlets, hose kit.
5. Test suction — Gate: final. Code: R302.4.

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| B-CVAC-INLET-EA | rough-in per inlet | EA | 6500 | 1.5 | 0 | 10 | platform-baseline, estimate |
| B-CVAC-POWER-EA | power unit + exhaust + hose kit | EA | 90000 | 3 | 0 | 0 | platform-baseline, estimate |
| B-CVAC-TRIM-EA | inlet valve + trim | EA | 3500 | 0.4 | 0 | 2 | platform-baseline, estimate |

## Quantity rules
- INLET/TRIM = rooms × 0.4 (ceil), residential_sf. POWER = 1, residential_sf.

## Open questions → REVIEW_QUEUE
- Manufacturer install PDFs (Beam, H-P, Lindsay) not retrievable; practice steps are `estimate` confidence.
- IRC section numbers unverified against ICC text (403).
