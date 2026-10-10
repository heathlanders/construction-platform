# Dossier — `sport_courts_turf` (Sport Courts / Synthetic Turf)

> Wave: w17 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/sport_courts_turf.ts` · Status: draft
> Taxonomy: category `specialty` · permit_trade `null` · phase `sitework` · CSI 32 18

## Scope
Surfacing and finishing recreation courts (tennis, pickleball, basketball) over asphalt or post-tensioned concrete — base check, crack and birdbath repair, acrylic resurfacer, color coats, line layout, net posts — and installing synthetic turf lawns, play areas and putting greens (drained base, roll-out, seams, infill, grooming). Does NOT build the asphalt or concrete base (asphalt_paving, post_tensioning, concrete), court fencing (fencing) or PT stressing; no AHJ permit path, so no gating inspections or code refs.

## Existing coverage reconciled
- Hand recipe: none (no-permit path in `nopermit.ts` generic fallback) → pack is the NEW-TRADE pattern.
- Catalog codes already seeded: none for this trade. Read, not duplicated: `B-ASP-*` (asphalt_paving), `B-PT-*` (post_tensioning), `B-FNC-*` (fencing), `B-AGG-BASE-SY` (per-SY aggregate only; `G-SCT-TURFBASE-SF` differs — includes grading and compaction per SF), pavement_marking packs.
- Blueprint template tasks hitting this trade: none found.

## Sources used
| id | Title | Tier | License | Used for |
|---|---|---|---|---|
| sport_courts_turf-css-decocolor-asphalt | CSS DecoColor Installation Guide (asphalt) | 5 | manufacturer_public | cure, planarity, flood test, weather limits, coat sequence, line wait |
| sport_courts_turf-css-decocolor-concrete | CSS DecoColor Installation Guide (concrete) | 5 | manufacturer_public | 28-day concrete cure, vapor barrier, no curing compound, etch |
| sport_courts_turf-css-asphalt-prep | CSS Asphalt Surface Preparation | 5 | manufacturer_public | 14–21 day cure, crack handling |
| sport_courts_turf-css-base-spec | CSS Base Construction Specification | 5 | manufacturer_public | 1% fall, edge/drain concepts (metric figures not copied) |
| sport_courts_turf-css-resurfacer | CSS Acrylic Resurfacer Procedure | 5 | manufacturer_public | squeegee method, clean-up |
| sport_courts_turf-css-line-rite | CSS Line Rite Procedure | 5 | manufacturer_public | tape-edge sealing before line paint |
| sport_courts_turf-usap-court | USA Pickleball court & layout | 4 | association_public | 20x44 ft court, net heights, 7 ft NVZ |
| sport_courts_turf-fieldturf-guide | FieldTurf process overview | 5 | manufacturer_public | turf install sequence, 12–18 in. field excavation, infill weight |
| sport_courts_turf-niosh-heat | NIOSH Heat Stress | 1 | gov_open | heat hazard |
| ecfr-1926-c/d/e/f/i/k/o/p | 29 CFR 1926 subparts | 1 | public_domain | hazard refs |

Not reachable/used: ASBA (site unreachable), Synthetic Turf Council (403 to scripts), EPA tire-crumb research pages (URLs 404), ITF/USTA rules (blocked) — see REVIEW_QUEUE.

## Work steps
Recipe `court_surfacing` (5): base check (cure/planarity/flood/slope) → clean and repair → resurfacer + color coats → layout and lines → cure and turnover.
Recipe `net_posts_footings` (3): locate utilities → drill and set sleeves → cure and hang hardware.
Recipe `synthetic_turf` (5): excavate/grade with drainage → compact base and test → roll out/seam → anchor/infill → brush/close out.

## Hazards (12)
heat, chem_coating, eye_splash, dust_grind, cord_shock, trip_slip, heavy_lift, cut_knife, utilities, trench_cave, equipment_backing, flammable_cleanup — refs 1926.21(b)(2), .59, .102(a)(1), .55, .404(b)(1), .25(a), .20(b)(2), .301(a), .651(b)(1), .651(k)(1), .601(b)(4), .152(a)(1).

## QA checklist (15)
Court: base_cured, planarity_checked, flood_test_done, cracks_repaired, weather_window, coverage_checked, no_ridges, court_dims_match, cure_before_play. Posts: sleeves_plumb, net_height_spacing. Turf: base_compacted, base_flat_drains, seams_tight, infill_weight. No safety-critical QA items.

## Inspection / acceptance checkpoints
`base_planarity_flood_test`, `cure_before_coating`, `turf_base_acceptance`, `final_turnover` (owner/designer hold points; none AHJ-gated).

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| G-SCT-ACRYLIC-SY | Acrylic court surfacing | SY | 650 | 0.1 | 60 | 8 | platform-baseline, estimate |
| G-SCT-STRIPE-EA | Court striping | EA | 14000 | 8 | 0 | 10 | estimate |
| G-SCT-NETPOST-EA | Net post sleeve + footing | EA | 32000 | 3.5 | 3500 | 0 | estimate |
| G-SCT-TURFBASE-SF | Turf sub-base | SF | 120 | 0.025 | 30 | 10 | estimate |
| G-SCT-TURF-SF | Turf with infill | SF | 450 | 0.045 | 25 | 8 | estimate |
| G-SCT-CRACKFILL-LF | Crack route and fill | LF | 200 | 0.05 | 20 | 10 | estimate |

## Quantity rules
None — blueprint facts carry no court/turf area or component, so no safe `facts_any` scope exists.

## Blueprint callouts
None this wave.

## Open questions → REVIEW_QUEUE
- All six costs are estimate-only (no public price source).
- Tennis/basketball dimensions and ITF/USTA nets not cited (sources blocked); steps defer to the approved plan.
- Turf base depth/drainage for non-field (residential) turf is not publicly sourced beyond a turf-maker overview.
- ASBA guideline text and STC guidelines unreachable; re-verify when accessible.
