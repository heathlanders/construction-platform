# Dossier — `fencing` (Fencing & Gates)

> Wave: w04 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/fencing.ts` · Status: draft
> Taxonomy: category `sitework` · permit_trade `building` · phase `sitework` · CSI `32 31`

## Scope (2–4 sentences)
Residential and light-commercial fences and gates: wood and vinyl privacy, chain link, ornamental
aluminum/steel, and pool barriers with self-closing, self-latching gates. Covers property-line and utility
checks, layout, posts in concrete, rails / fabric / panels and gate hardware. Does NOT cover gate operators
(`gate_operators`), the pool itself or house-door alarms (`pools_spas` / `low_voltage`), retaining walls, or
surveying the line (`surveying` — the fence crew verifies, it doesn't establish the line).

## Existing coverage reconciled
- Hand recipe: none → NEW-TRADE pattern (3 recipes with `example_title`).
- Catalog codes already seeded: `B-FENCE-LF` (0037, wood privacy baseline) → referenced from `quantity_rules`, not redeclared.
- Blueprint template tasks hitting this trade: none (0).
- Permit path: most fences below the local height limit need zoning sign-off at most, no AHJ inspection →
  only the pool-barrier recipe gates (`final`). Other checkpoints are descriptive
  `inspection_checklists` keys (`layout_property_line_check`, `final_walkthrough`).

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| fencing-ufgs-323113 | UFGS 32 31 13 — Chain Link Fences and Gates | 1 | public_domain | chain link steps, post spacing/depth, bracing, tolerances, cure, ties, gates |
| fencing-cpsc-362 | CPSC Pub. 362 Safety Barrier Guidelines for Residential Pools | 1 | public_domain | pool barrier height, gaps, gates, latch, house wall |
| fencing-mh-postmaster | Manufacturer wood-fence install guidelines (vertical board) | 5 | manufacturer_public | property line, permits, utilities, layout, concrete pour, ground gap |
| fencing-afa | American Fence Association | 4 | association_public | reference (finish-side convention) |
| icc-pa | ICC public access — IRC R326.1, AG105; ISPSC 305.2/305.3/305.4 | 3 | proprietary_ref_only | code refs (paraphrase only) |
| ecfr-1926-c/e/i/k/o/p | 29 CFR 1926 | 1 | public_domain | hazards |

## Work steps (draft → pack recipes)
- `privacy_fence` (default, `\bfence|fences|fencing\b`): verify line/approvals/utilities → stake & string →
  dig & set posts in concrete → rails & pickets/panels → hang gates & walk the job.
- `chain_link_fence` (priority 10, `chain link|cyclone`): verify → terminal posts in concrete → line posts,
  top rail, bracing → stretch/tie fabric, hang gates.
- `pool_barrier_fence` (priority 20, pool + fence/barrier/gate): plan barrier & verify → posts & barrier
  (ISPSC 305.2) → self-closing/self-latching gate (ISPSC 305.3) → house side + final (ISPSC 305.4, IRC R326.1; gate `final`).

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| utility_strike | buried utility strike digging post holes | 1926.651(b)(1) | 4 |
| overhead_lines | long posts / rails contacting overhead lines | 1926.416(a)(1) | 4 |
| equipment_lines | skid steer / auger mast near power lines | 1926.600(a)(6) | 4 |
| auger_torque | power auger kickback / torque | 1926.20(b)(4) | 3 |
| concrete_burn | wet concrete / cement burns | 1926.21(b)(3) | 2 |
| power_tool | saw cuts | 1926.300(b)(1) | 3 |
| nailer | pneumatic nailer punctures | 1926.302(b) | 3 |
| hand_tool_strike | digging bar / post driver | 1926.301(a) | 2 |
| heavy_lift | posts, bags, panels, gates | 1926.20(b) | 2 |
| wire_cut | chain link fabric / tie wire | 1926.95(a) | 2 |
| eye_flying | chips, soil, wire ends | 1926.102(a)(1) | 2 |
| cord_shock | cords outdoors, GFCI | 1926.404(b)(1) | 3 |

## QA checklist
15 items: property line from survey/pins, locate ticket (safety), zoning/HOA, post depth/frost, domed &
cured footings, plumb ¼ in. / line ½ in. (UFGS), chain link spacing ≤10 ft + bracing, fabric taut + safe tie
ends, ground gap + coated fasteners, finish side, gate swing/latch, and 4 pool-barrier safety items (height/gaps,
no climb aids, self-closing/latching gate + latch release, house wall).

## Inspection / acceptance checkpoints
- `layout_property_line_check`: pins/survey, locate ticket, permit/HOA.
- `final` (pool barriers only): enclosure, gates, house wall, climbables — ISPSC 305.2–305.4.
- `final_walkthrough`: plumb/line, gates, cleanup.

## Cost basis
All `platform-baseline` / estimate, national 2026, no public unit-price source used.
| Code | Unit | Material ¢ | Labor hr | Equip ¢ | Waste % |
|---|---|---|---|---|---|
| B-FNC-GATE-WALK-EA | EA | 22000 | 2.5 | 0 | 0 |
| B-FNC-GATE-DBL-EA | EA | 65000 | 5 | 0 | 0 |
| B-FNC-POOLGATE-HW-EA | EA | 15000 | 1 | 0 | 0 |
| B-FNC-CHAINLINK-LF | LF | 1500 | 0.12 | 50 | 5 |
| B-FNC-ALUM-LF | LF | 4000 | 0.2 | 50 | 3 |
| B-FNC-REMOVE-LF | LF | 0 | 0.1 | 200 | 0 |

## Quantity rules
- `B-FENCE-LF` (existing) = component `fence_callout` × 150 — assumed backyard run until measured.
- `B-FNC-GATE-WALK-EA` = component `fence_callout` × 1.

## Blueprint callouts (components)
- token `fence_callout` — NEW/PROPOSED/PRIVACY/POOL or a height (6', 48") + up to 3 material words + FENCE;
  excludes SILT / construction fence and EXISTING fences. Example: `NEW 6' WOOD PRIVACY FENCE`. vision_hint set.

## Open questions → REVIEW_QUEUE
- ISPSC section numbers (305.2/.3/.4) confirmed via jurisdiction handouts, not the ICC text (403 to scripts).
- All 6 assembly costs are estimates.
- Equipment vocab lacks a post-hole auger (handheld/towable) — skid_steer used as the closest.
