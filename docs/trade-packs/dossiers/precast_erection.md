# Dossier — `precast_erection` (Precast Concrete Erection)

> Wave: w11 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/precast_erection.ts` · Status: draft
> Taxonomy: category `concrete_masonry` · permit_trade `building` · phase `framing` · CSI `03 41` (tilt-up `03 47`)

## Scope (2–4 sentences)
Erects plant-made precast (hollowcore plank, double tees, beams, columns, wall panels) and site-cast
tilt-up wall panels: bearing pads/shims, crane lift planning, setting to tolerance, temporary bracing,
welded/bolted/grouted connections, keyway and base grouting, patching lift points. Does NOT fabricate
plant precast (precaster), place the casting slab / footings (concrete), place panel rebar beyond the
tilt-up crew's own work (rebar), or the roof deck that ends tilt-up bracing (metal_decking).

## Existing coverage reconciled
- Hand recipe: none → NEW-TRADE pattern (2 recipes).
- Catalog codes already seeded: none for precast/tilt-up (checked `prisma/migrations/*`). New `B-PCE-*`.
- Blueprint template tasks hitting this trade: none. `formwork` pack mentions tilt in an equipment rule only.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| precast_erection-ecfr-1926-704 | 29 CFR 1926.704 Requirements for precast concrete | 1 | public_domain | overturn, inserts 2×/4×, hardware 5×, no one under lifts |
| ecfr-1926-q | 1926 Subpart Q (1926.701(a),(b)) | 1 | public_domain | construction loads, impalement |
| ecfr-1926-m | 1926.501(b)(12) precast erection fall protection (6 ft) | 1 | public_domain | fall hazard |
| ecfr-1926-cc | 1926.1402(b), 1926.1408(a), 1926.1424(a)(2) | 1 | public_domain | crane ground, power lines, swing radius |
| ecfr-1926-h | 1926.251(a)(1) rigging inspection | 1 | public_domain | rigging |
| ecfr-1926-j | 1926.352(a) welding fire prevention | 1 | public_domain | weld fire |
| ecfr-1926-z | 1926.1153(c)(1) silica Table 1 | 1 | public_domain | cutting/coring dust |
| precast_erection-ufgs-03-41-33 | UFGS 03 41 33 Precast Structural Pretensioned Concrete (Aug 2026) Part 3 | 1 | public_domain | steps + QA (bearing pads, ≥3 in. end bearing, tolerances, grout damp 24 h, no cut strands, shims left in) |
| precast_erection-ufgs-03-47-13 | UFGS 03 47 13 Tilt-Up Concrete (Aug 2016) Part 3 | 1 | public_domain | tilt-up steps + QA (bond breaker, chairs, cylinder strength before lift, braces until secured, dry-pack) |
| precast_erection-pci / precast_erection-tca | PCI / Tilt-Up Concrete Association | 4 | proprietary_ref_only | terminology only, no numbers |
| icc-pa | IBC 1705.2, 1705.3, 1901.2 | 3 | proprietary_ref_only | code refs (framing gate) |

Note: UFGS 03 41 13 (hollowcore) has no PDF on WBDG (403/404) — hollowcore steps drawn from 03 41 33 §3.2.6–3.2.9, which covers hollow-cored flat slabs.

## Work steps (draft → pack recipes)
`precast_erection` (title_re precast|hollowcore|double tee|wall panel erect):
1. **Verify bearings, embeds and piece strength** — QA bearing_survey, piece_strength, construction_loads.
2. **Plan the picks and set up the crane** — QA lift_plan, rigging_rated.
3. **Set bearing pads, shims and pieces** — QA bearing_pads, end_bearing, tolerances.
4. **Brace, connect and weld** — Gate: framing. IBC 1705.3 / 1705.2 / 1901.2.
5. **Grout keyways and joints, touch up** — Gate: final. QA keyway_grout, field_cuts, touch_up.

`tilt_up` (title_re tilt-up, priority 10):
1. Prepare the casting slab · 2. Apply bond breaker, set rebar and inserts · 3. Cast and cure the panels ·
4. **Lift, set and brace panels** (Gate: framing) · 5. **Connect, grout and remove braces** (Gate: final).

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| overturn | Panel/column tips before permanent connections | 1926.704(a) | 4 |
| lifting_inserts | Insert pullout | 1926.704(b) | 4 |
| lifting_hardware | Hardware failure | 1926.704(d) | 4 |
| under_load | Under lifted/tilting member | 1926.704(e) | 4 |
| fall_6ft | Fall ≥6 ft during erection/grouting | 1926.501(b)(12) | 4 |
| swing_radius | Crane swing area | 1926.1424(a)(2) | 4 |
| power_line | Power-line contact | 1926.1408(a) | 4 |
| crane_ground | Outriggers on soft ground | 1926.1402(b) | 4 |
| rigging | Defective rigging | 1926.251(a)(1) | 4 |
| impalement | Protruding rebar | 1926.701(b) | 3 |
| weld_fire | Welding sparks | 1926.352(a) | 3 |
| silica | Cutting/coring dust | 1926.1153(c)(1) | 3 |

## QA checklist
15 items (5 safety: construction_loads, lift_plan, rigging_rated, temp_bracing, brace_removal). See pack.

## Inspection / acceptance checkpoints
- framing: erection drawings + lift plan on site; special inspection of bearing/connections (IBC 1705.3); braces in place.
- final: grouting complete, lift holes patched; braces removed only after diaphragm; special-inspection final report.

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| B-PCE-WALL-SF | Erect precast wall panel (install only) | SF | 60 | 0.02 | 150 | 0 | platform-baseline estimate |
| B-PCE-HOLLOWCORE-SF | 8 in. hollowcore, furnished + erected | SF | 1100 | 0.012 | 90 | 0 | estimate, plant pricing varies |
| B-PCE-KEYWAY-LF | Grout plank keyway | LF | 120 | 0.025 | 10 | 10 | estimate |
| B-PCE-BRACE-EA | Tilt-up pipe brace, rented, in/out | EA | 1500 | 0.75 | 6000 | 0 | estimate |
| B-PCE-WELD-EA | Connection field weld | EA | 1800 | 1.0 | 600 | 0 | estimate |

## Quantity rules
- `B-PCE-HOLLOWCORE-SF` = area_sf_sum (commercial, residential_mf) — remove slab-on-grade floors.
- `B-PCE-KEYWAY-LF` = area_sf_sum × 0.25 (one joint per 4 ft plank width).

## Blueprint callouts (components)
- none this wave.

## Open questions → REVIEW_QUEUE
- All 5 B-PCE costs are platform estimates.
- UFGS 03 41 13 hollowcore spec not retrievable on WBDG; used 03 41 33.
- Hollowcore quantity rule uses total floor area — overcounts slab-on-grade levels.
- No inspection type for tilt-up panel pre-pour rebar/insert inspection (special inspection) in building family.
