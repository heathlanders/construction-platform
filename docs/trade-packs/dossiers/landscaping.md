# Dossier — `landscaping` (Landscaping)

> Wave: w04 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/landscaping.ts` · Status: draft
> Taxonomy: category `sitework` · permit_trade `null` · phase `sitework` · CSI `32 90`

## Scope (2–4 sentences)
Final grading and the planted site around a building: topsoil, fine grading for drainage, seed or sod,
trees, shrubs and beds, mulch and edging, plus erosion control on bare soil until the new cover is
established. Landscape lighting (alias) is in scope as a fixture count but the wiring/transformer is
low-voltage electrical work. Hand-offs: mass/rough grading → `excavation`; erosion-control plan and
silt fence → `erosion_control`; sprinklers → `irrigation`; patios/walls → `hardscape_pavers`.

## Existing coverage reconciled
- Hand recipe: `task-buildout/nopermit.ts` `case 'landscaping'` (one generic step) → pack **complements**
  (`recipes: []`; `landscaping` is in `HAND_RECIPE_KEYS`). Pack adds glossary, hazards, QA, checklists,
  equipment (skid steer, dump truck on larger sites, trencher for lighting) and assemblies.
- Catalog codes already seeded: none for landscaping (`G-SITE-DEMO-SF` is demolition, not reused).
- Blueprint template tasks hitting this trade: "Final grading, seeding & landscaping…" in
  residential-sf / residential-mf / commercial / industrial, and "Final grading, aprons & site…" in
  pole-barn. Hand recipe handles them; pack equipment `title_re: grad|topsoil|landscap|site restor` hits all five.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| landscaping-ufgs-32-92-19 | UFGS 32 92 19 Seeding (2017) | 1 | public_domain | topsoil depth, seedbed, two-pass sowing, cover depth |
| landscaping-ufgs-32-92-23 | UFGS 32 92 23 Sodding (2006/2021) | 1 | public_domain | grade at paving, sod within 36 h, slopes, rolling, watering depth |
| landscaping-ufgs-32-93-00 | UFGS 32 93 00 Exterior Plants (2017) | 1 | public_domain | layout, utilities, setting, burlap/wire, saucer, mulch 3 in. off trunk, watering |
| landscaping-uwex-a3434 | UW–Madison Extension A3434 Lawn Establishment & Renovation | 1 (edu ext.) | gov_open | 1–2% lawn slope, 3–4 in. topsoil, seeding window/rates, straw rate, sod handling, care |
| landscaping-uwex-plant-tree | UW–Madison Extension 5 Steps to Plant a Tree | 1 (edu ext.) | gov_open | 811, root flare, hole size, wire/burlap, mulch ≤3 in., staking 1 yr |
| landscaping-wi-dnr-1059 | WDNR Tech Std 1059 Seeding for Construction Site Erosion Control | 1 | gov_open | 53 °F soil, ¼ in. depth, inspection weekly + after 0.5 in. rain, "dense" = 70% |
| landscaping-wi-dnr-1058 | WDNR Tech Std 1058 Mulching for Construction Sites | 1 | gov_open | 80% cover, straw rate, crimping |
| landscaping-diggers-hotline | Diggers Hotline (WI 811) | 1 | gov_open | locate before digging |
| ecfr-1926-c/d/e/i/o/p | 29 CFR 1926 subparts (shared) | 1 | public_domain | hazards |
| ecfr-1926-w (NEW, shared) | 29 CFR 1926 Subpart W — ROPS | 1 | public_domain | rollover hazard (1926.1000(a)) |
| icc-pa | ICC public access (IRC R401.3) | 3 | proprietary_ref_only | drainage QA — section only |
| platform-baseline | The Jobsite cost baseline | — | platform_estimate | all costs |

## Work steps (draft → pack recipes)
None — COMPLEMENT pattern. The nopermit.ts step ("finish-grade to drain away from structures, install
plantings/hardscape per the plan schedule") stays. A future pack recipe could split grade/topsoil →
seed or sod → plant → mulch → handoff with `supersedes_hand` (see open questions).

## Hazards (draft → pack hazards)
| id | Hazard | Controls | OSHA ref | Sev |
|---|---|---|---|---|
| utility_strike | Striking buried utilities | 811, hand dig near marks, private lines | 1926.651(b)(1) | 4 |
| equipment_rollover | Skid steer/tractor rollover | ROPS + belt, up/down slopes | 1926.1000(a) | 4 |
| struck_by_equipment | Reversing machines | backup alarm/spotter, hi-vis | 1926.602(a)(9)(ii) | 4 |
| overhead_lines | Raised bucket/bed contacts lines | look up, distance, spotter | 1926.600(a)(6) | 4 |
| heat_stress | Heat illness | water/shade/rest, training | 1926.21(b)(2) (derived) | 3 |
| chemical_exposure | Fertilizer/pesticide/lime | label + SDS, licensed applicator | 1926.59 | 3 |
| flying_debris | Trimmer/blower debris | side-shield glasses | 1926.102(a)(1) | 2 |
| noise | Engines/tools | hearing protection | 1926.101(a) | 2 |
| manual_lifting | Sod, root balls, bags | carts, two-person lifts | 1926.21(b)(2) (derived) | 2 |
| sharp_tools | Spades, pruners, wire | sharp/good tools, cut gloves | 1926.301(a) | 2 |

## QA checklist
- [ ] Locates marked/current (safety) — 1926.651, 811
- [ ] Grade falls away from foundation (IRC R401.3 ref), lawn 1–2% — ICC ref + UW A3434
- [ ] Grade below siding/sill, within 1 in. at paving — UFGS 32 92 23
- [ ] Topsoil ≥ 4 in., stones > ¾ in. out — UFGS 32 92 19, UW A3434
- [ ] Seed two passes, ≤ ¼ in. cover, roll, straw ~half cover — UFGS, WDNR 1059, UW
- [ ] Seed window (soil > 53 °F; mid-Aug–mid-Sep) — WDNR 1059, UW
- [ ] Sod fresh, staggered, tight — UW, UFGS
- [ ] Sod rolled, watered 6 in., staked on slopes — UFGS, UW
- [ ] Tree flare at/1–2 in. above grade, hole 3–5× ball — UW Extension (ANSI A300 concept)
- [ ] Basket/burlap removed or folded top ⅓ — UFGS 32 93 00, UW
- [ ] Mulch 2–3 in., 2–3 in. off trunks/siding — UFGS 32 93 00, UW
- [ ] New plants watered deep same day, saucer — UFGS, UW
- [ ] Erosion control until dense, inspect weekly + after 0.5 in. rain — WDNR 1058/1059
- [ ] Owner care instructions handed over — UW, WDNR
- [ ] Plant warranty terms written — platform estimate (practice)

## Inspection / acceptance checkpoints
- `final_grade_check`: locates, slope away + downspouts (IRC R401.3), topsoil, grade at siding/paving.
- `establishment_check`: germination/bare spots, sod rooted, erosion controls until dense (WDNR), plant health/stakes.
- `final_walkthrough`: plant list match, mulch, cleanup/inlets, owner handoff.

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| G-LSC-TOPSOIL-CY | Topsoil spread + fine grade | CY | 3500 | 0.2 | 400 | 10 | estimate |
| G-LSC-SEED-SF | Seed + starter fert + straw | SF | 5 | 0.002 | 0 | 10 | estimate (UW rates) |
| G-LSC-SOD-SF | Sod lay/roll/water | SF | 45 | 0.008 | 1 | 5 | estimate |
| G-LSC-TREE-EA | 2 in. cal. B&B tree | EA | 25000 | 2 | 3000 | 0 | estimate |
| G-LSC-SHRUB-EA | 3 gal shrub | EA | 3500 | 0.4 | 0 | 0 | estimate |
| G-LSC-MULCH-SF | Hardwood mulch 3 in. | SF | 30 | 0.006 | 0 | 10 | estimate ($35/CY ÷ 108 SF) |

## Quantity rules
None. Blueprint facts carry no lawn/bed area or planting schedule; `area_sf_sum` is building floor area
and must not be used as lawn area. Revisit if a site-plan/planting-schedule extractor is added.

## Blueprint callouts (components)
None this wave (per brief).

## Open questions → REVIEW_QUEUE
- All 6 assembly costs are platform estimates.
- ANSI A300 (Part 6 planting) not cited as a source — no stable public URL verified; root-flare rule sourced to UW Extension.
- USDA NRCS CPS 342 (Critical Area Planting) — nrcs.usda.gov timed out from this host; not cited.
- IRC R401.3 slope numbers kept out of text (proprietary reference-only); QA cites the section.
- Landscape lighting fixture assembly deferred (low-voltage electrical scope; would exceed 6 new assemblies).
- Consider a pack recipe (grade → seed/sod → plant → mulch → handoff) with `supersedes_hand` in a later wave.
