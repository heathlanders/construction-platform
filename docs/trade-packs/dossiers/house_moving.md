# Dossier — `house_moving` (Building Moving / House Raising)

> Wave: w07 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/house_moving.ts` · Status: draft
> Taxonomy: category `structural` · permit_trade `building` · phase `site_prep` · CSI `02 41`

## Scope (2–4 sentences)
Structural movers lift a house off its foundation on two layers of steel beams with a unified hydraulic
jacking system, holding the load on hardwood cribbing at every stage. Two job shapes: **raise in place**
(flood elevation, or a new/deeper foundation built under the raised house) and **relocation** (route survey,
oversize building permit, load on dollies, haul, set on a new foundation, restore the old site). The mover
does NOT do the utility disconnect/reconnect itself (utilities + licensed electrical/plumbing/HVAC trades),
nor the new foundation design (engineer) — the foundation is often built by a concrete/masonry sub while the
house sits on cribbing.

## Existing coverage reconciled
- Hand recipe: none → NEW-TRADE pack (2 recipes).
- Catalog codes already seeded: none with `B-HMV-`. New foundation concrete is priced by existing concrete/
  foundation assemblies (not duplicated).
- Blueprint template tasks hitting this trade: none. `title_re` written for manual task titles
  ("Raise house for flood elevation", "House moving to new lot", "Structure relocation", "Lift the house").
- Overlap note: `foundation_repair` also matches "lift (the) house" titles — packs are per-trade, so no conflict.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| house_moving-fema-p312 | FEMA P-312 Homeowner’s Guide to Retrofitting, 3rd ed. (LA County mirror) | 1 | gov_open | Lift method (§5.2.1), slab caution, freeboard (§3.1.4), service equipment (§5.1.6, ch. 9), relocation process (§6.1.2), flood openings, elevation certificate |
| house_moving-iasm-hiring | IASM — Things to Consider When Hiring a Structural Mover | 4 | association_public | Insurance (liability/WC/cargo), license, contract + schedule QA |
| house_moving-wisdot-osow-sb | WisDOT single trip building (SB) permit | 1 | gov_open | Building definition (>12 ft W / 14 ft 3 in H / 100 ft L), 5-day one-trip route permit, escorts |
| house_moving-wi-stat-348-27 | Wis. Stat. § 348.27 | 1 | gov_open | Statutory basis for oversize permits (reference) |
| ecfr-1926-t | 29 CFR 1926 Subpart T | 1 | public_domain | 1926.850(a) condition survey, 1926.850(c) utilities shut off/capped outside building line |
| ecfr-1926-i | Subpart I | 1 | public_domain | 1926.305 jacks: rated capacity, blocked base, crib at once after raising |
| ecfr-1926-o | Subpart O | 1 | public_domain | 1926.600(a)(3)(i) block/crib before working under; (ii) chock/brakes |
| ecfr-1926-k / p / g / m / z | Subparts K, P, G, M, Z | 1 | public_domain | overhead lines, excavation, flaggers, fall edges, silica |
| icc-pa | IRC R105.1, R322.1.6, R322.1.10, R322.2.1, R322.2.2, R403.1, R403.1.6, R404.1; IEBC 1402.1–1402.7 | 3 | proprietary_ref_only | code refs (section + paraphrase only) |
| platform-baseline | The Jobsite baseline | — | platform_estimate | all costs |

Not used: FEMA P-259 (Engineering Principles and Practices for Retrofitting) — fema.gov blocks scripted fetch
and no stable mirror verified; P-312 covers the field method. IEBC Ch. 14 numbering confirmed via the
California Existing Building Code mirror (same section numbers as IEBC 2021/2024).

## Work steps (draft → pack recipes)
**raise_in_place** (`example_title`: "Raise house for flood elevation")
1. **Confirm the lift plan, target height and permits** — BFE + freeboard target, pre-lift survey. Code: IRC R105.1, R322.2.1. QA: plan_on_site, target_elevation, mover_insured.
2. **Disconnect and cap every utility** — QA: utilities_disconnected.
3. **Open the foundation and set the steel and cribbing** — QA: cribbing_built.
4. **Lift with unified jacks, cribbing as you go** — QA: lift_monitored, cribbing_built.
5. **Build the new foundation under the raised house** — Gate: foundation. Code: R403.1, R404.1, R322.2.2. QA: footing_inspected, flood_openings.
6. **Set down, anchor and reconnect** — Gate: final. Code: R403.1.6, R322.1.6, R322.1.10. QA: anchored, equipment_raised, access_rebuilt.

**relocation** (priority 10; `example_title`: "House moving to new lot")
1. **Survey the route and get every move permit** — Code: R105.1, IEBC 1402.1. QA: route_surveyed, move_permits, mover_insured.
2. **Prepare the new site and start the foundation** — Gate: footing. Code: IEBC 1402.2.
3. **Disconnect, separate and load the house** — QA: utilities_disconnected, cribbing_built, load_secured.
4. **Move the house over the permitted route** — QA: load_secured, move_permits.
5. **Set the house on its new foundation** — Gate: foundation. Code: IEBC 1402.2.1, IRC R403.1.6.
6. **Reconnect, inspect for damage and restore the old site** — Gate: final. Code: IEBC 1402.7. QA: post_move_inspection, access_rebuilt.

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| structure_collapse | Unplanned collapse/racking during lift or move | 1926.850(a) | 4 |
| crush_under_load | Crushed under a house held on jacks | 1926.600(a)(3)(i) | 4 |
| cribbing_failure | Crib tower shift/tip | 1926.305(d)(1)(i) | 4 |
| jack_overload | Jack overload/kick-out | 1926.305(a)(1) | 4 |
| live_utilities | Live service lines at separation | 1926.850(c) | 4 |
| overhead_lines | Contact with overhead power lines | 1926.416(a)(3) | 4 |
| buried_utilities | Buried line strike | 1926.651(b)(1) | 4 |
| cave_in | Trench / pit / footing excavation cave-in | 1926.652(a)(1) | 4 |
| traffic | Struck by traffic on the move | 1926.201(a) | 4 |
| runaway_load | House on dollies rolling | 1926.600(a)(3)(ii) | 3 |
| fall_raised_floor | Fall from raised doorways/edges | 1926.501(b)(1) | 3 |
| silica | Cutting beam openings in foundation | 1926.1153(c)(1) | 3 |

## QA checklist
15 items (6 safety → `pending_human_translation`): plan_on_site, mover_insured, target_elevation,
utilities_disconnected, cribbing_built, lift_monitored, footing_inspected, flood_openings, anchored,
equipment_raised, access_rebuilt, route_surveyed, move_permits, load_secured, post_move_inspection.

## Inspection / acceptance checkpoints
- move_permit: state SB permit, local road permits, utility line lifts + escorts.
- footing: size/depth/reinforcing (IRC R403.1).
- foundation: walls/piers, flood openings, anchors (R404.1, R322.2.2, IEBC 1402.2.1).
- elevation_certificate: post-construction certificate (R322.1.10).
- final: anchored, utilities, equipment height, stairs/guards, post-move damage repaired (IEBC 1402.7).

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| B-HMV-RAISE-SF | Raise in place, lift only | SF | 250 | 0.10 | 500 | 0 | estimate — ≈150 crew-hr / 1,500 SF; foundation separate |
| B-HMV-CRIB-EA | Hardwood crib tower | EA | 15000 | 2 | 0 | 5 | estimate — timbers amortized |
| B-HMV-RELOC-MOB-EA | Relocation (≤5 mi) separate/load/haul/set | EA | 60000 | 90 | 650000 | 0 | estimate |
| B-HMV-ROUTE-EA | Route survey, permits, escorts, line lifts allowance | EA | 500000 | 16 | 60000 | 0 | estimate — varies widely by route |
| B-HMV-UTIL-EA | Utility disconnect/cap/reconnect coordination | EA | 120000 | 10 | 0 | 0 | estimate |

## Quantity rules
- `B-HMV-RAISE-SF` = area_sf_sum × 1 (residential_sf) — room area ≈ one-story footprint.
- `B-HMV-CRIB-EA` = area_sf_sum ÷ 150, ceil (residential_sf).
- `B-HMV-UTIL-EA` = const 1 (residential_sf).
Relocation/route assemblies are NOT auto-seeded (a raise job is more common; estimator adds them).

## Blueprint callouts (components)
- none this wave (per brief).

## Open questions → REVIEW_QUEUE
- Safety ES: 12 hazards + 6 safety QA pending human translation.
- All 5 B-HMV costs are platform estimates.
- Equipment vocab: no `unified_jacking_system`, `dolly_wheel_set` or `truck_tractor` types.
- IEBC Ch. 14 section numbers verified only via CEBC mirror; FEMA P-312 cited from county mirror.
- `area_sf_sum` overcounts the lift on two-story plans (room area > footprint).
