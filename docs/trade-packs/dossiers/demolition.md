# Dossier — `demolition` (Demolition)

> Wave: w06 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/demolition.ts` · Status: draft
> Taxonomy: category `sitework` · permit_trade `building` · phase `site_prep` · CSI `02 41`

## Scope (2–4 sentences)
Takes structures down: whole houses / commercial buildings with foundation removal and backfill, accessory
buildings (garages, sheds, pole barns), and selective interior strip-outs. Covers the pre-demolition survey,
asbestos inspection + DNR notice, utility disconnects, hazardous-item removal, dust control, debris sorting and
disposal records, and site restoration. Does NOT do asbestos/lead abatement (→ `abatement`), new excavation and
footings (→ `excavation`/`concrete`), or trucking as a stand-alone service (→ `hauling`).

## Existing coverage reconciled
- Hand recipe: none (not in `HAND_RECIPE_KEYS`) → NEW-TRADE pattern, 3 recipes with `example_title`.
- Catalog codes already seeded: `G-DEMO-SF` (selective interior demolition + haul-off, 0037) and `G-SITE-DEMO-SF`
  (exterior hardscape removal, 0045) — NOT redeclared. No pack quantity rule references them because no blueprint
  fact describes demolition scope; estimators add them by hand.
- Blueprint template tasks: "Demolition of existing structures" (commercial), "Site demolition, clearing &
  grubbing" (residential_mf), "Site clearing, demolition & contamination remediation" (industrial) — all hit
  `whole_building_demo`.

## Gate decision
Building family, but **no gating inspections and no code refs**. The raze permit is closed out by the city's
demolition sign-off, not by the new building's `final`; gating a site-prep demo task to the project `final` would
scope the wrong compliance. Hold points live in `inspection_checklists`: `pre_demo_survey`,
`utility_disconnect_verified`, `site_restored`.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| ecfr-1926-t | 29 CFR 1926 Subpart T — Demolition | 1 | public_domain | 850(a) survey, 850(c) utilities, 850(e) contents, 850(i) floor openings, 852 chutes, 854(b)/(d) walls + sequence, 859(a)/(g) mechanical demo |
| ecfr-1926-d / -m / -o / -p / -z | 1926 Subparts D, M, O, P, Z | 1 | public_domain | 1926.62 lead, 501(b)(7)(ii) holes, 602(a)(9)(ii) backing, 651(b) locates, 1101 asbestos, 1153 silica |
| abatement-ecfr-40-61m | 40 CFR 61 Subpart M (NESHAP) | 1 | public_domain | 61.145(a) inspect before demolition; (a)(2)+(b)(3)(i) 10-working-day notice for demolition even with no asbestos; 61.141 "facility" excludes ≤4-unit residential |
| abatement-wi-dnr-asbestos, abatement-wi-nr447 | WI DNR asbestos/ARDN; NR 447 | 1 | gov_open | WI delegation, single isolated ≤4-unit home exempt unless part of DOT/commercial/urban-renewal project |
| demolition-wi-dnr-4500-113 (new) | DNR Form 4500-113 | 1 | gov_open | notice form (ARDN online now) |
| demolition-wi-dnr-wa651 (new) | DNR WA-651 planning guide | 1 | gov_open | asbestos/CFC/lead/mercury/PCB walk-through, receipts |
| demolition-wi-dnr-structures, demolition-wi-dnr-debris (new) | DNR C&D waste pages | 1 | gov_open | no burn/bury, clean fill (NR 500.08(2)(a)), recycling streams |
| demolition-epa-residential-demo (new) | EPA Large-Scale Residential Demolition | 1 | gov_open | program demolitions are NESHAP facilities |
| demolition-ufgs-02-41-00 (new) | UFGS 02 41 00 (Aug 2022) | 1 | public_domain | protection, utilities first, top-down, slab break, dust, cleanup |
| demolition-wisdot-ss-204 (new) | WisDOT 2025 SS 204 | 1 | gov_open | 204.3.2.3 Removing Buildings (curb box, sewer plug, ≥2 ft foundation removal, 10% floor break), 204.3.1.2/203.3.6 backfill lifts |
| demolition-wisdot-aup (new) | WisDOT Average Unit Price List 10/21/2025 | 2 | gov_open | 204.0185 Removing Masonry $/CY (derived), 204.0231 Removing Building sanity |
| demolition-madison-demo (new) | City of Madison demolition process | 1 | gov_open | raze approval, accessory admin approval, recycling plan / sewer plug conditions |
| landscaping-diggers-hotline, concrete_repair_lifting-call811 | 811 | 4 | — | locates |

## Work steps
- `whole_building_demo` (default; title_re demo/raze/tear down/wreck): survey + permits → disconnect utilities →
  strip hazards & salvage → site setup & exclusion zone → top-down demolition → foundation removal, backfill, restore.
- `selective_interior_demo` (priority 10; selective/interior/gut/strip-out): mark limits → make safe & contain →
  ceilings/walls/floors → debris out safely → clean & hand over.
- `accessory_building_demo` (priority 10; garage/shed/barn/outbuilding/carport/silo): check building & contents →
  kill power & water → pull down → slab/posts/footings out & restore.

## Hazards
12: collapse 850(a) · live utilities 850(c) · hazardous contents 850(e) · struck-by 859(a) · backing 602(a)(9)(ii) ·
freestanding wall 854(b) · floor openings 850(i) · debris drop 852(a) · asbestos 1101 · lead 62 · silica 1153 ·
open hole 501(b)(7)(ii).

## QA checklist
15 items (5 safety → ES pending): engineering survey, asbestos inspection, DNR notice, permit posted, 811,
utility confirmations, harmful materials removed, protection, dust, top-down sequence, selective limits,
foundation depth, backfill lifts, disposal tickets, site restored.

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| B-DEM-HOUSE-SF | House demo above foundation | SF footprint | 0 | 0.03 | 120 | 0 | estimate; WisDOT 204.0231 $7.5k–14k/EA all-in as sanity |
| B-DEM-ACCESS-EA | Garage/shed/small barn w/ slab | EA | 0 | 12 | 70000 | 0 | estimate |
| B-DEM-FDN-CY | Foundation/footing/slab break + load | CY | 0 | 0.35 | 4500 | 0 | derived — WisDOT 204.0185 Removing Masonry ≈$68/CY (FY24 $58.76, FY25 $78.40), split ⅓ labor / ⅔ equip |
| B-DEM-UTIL-EA | Water/sewer disconnect per service | EA | 15000 | 6 | 40000 | 5 | estimate |
| B-DEM-BACKFILL-CY | Clean fill in compacted lifts | CY | 1800 | 0.1 | 600 | 15 | estimate |
| B-DEM-DISP-TON | Mixed C&D tipping fee | TON | 6500 | 0 | 0 | 0 | estimate |

## Quantity rules
None — no blueprint fact describes demolition scope. Existing `G-DEMO-SF` / `G-SITE-DEMO-SF` remain the
interior / hardscape codes for manual lines.

## Blueprint callouts (components)
None this wave.

## Open questions → REVIEW_QUEUE
- Rodent baiting before razing is required by some cities; no WI source verified — left out.
- All costs except B-DEM-FDN-CY are platform estimates.
- B-DEM-BACKFILL-CY / B-DEM-DISP-TON may overlap concepts in sibling `excavation` / `hauling` packs (different codes).
- Inspection keys `pre_demo_survey` / `utility_disconnect_verified` / `site_restored` are descriptive; a city
  "raze final" inspection type does not exist in the building sequence.
