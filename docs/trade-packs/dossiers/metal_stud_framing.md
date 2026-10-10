# Dossier — `metal_stud_framing` (Metal Stud Framing)

> Wave: w11 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/metal_stud_framing.ts` · Status: draft
> Taxonomy: category `interior` · permit_trade `building` · phase `framing` · CSI `09 22` (structural CFS 05 40)

## Scope
Cold-formed steel framing: non-load-bearing interior partitions and furring, deflection head-of-wall
track, in-wall backing (grab bars, wall-hung fixtures, casework), framed drywall ceilings and soffits,
and structural / exterior curtain-wall CFS studs built to engineer-stamped shop drawings. Hand-offs:
board and finish = `drywall`; rated head-of-wall joint = `firestopping` (B-FS-HOW-LF); acoustical grid
ceilings = `acoustical_ceilings`; sheathing/WRB = envelope trades; CFS design = the delegated engineer.

## Existing coverage reconciled
- Hand recipe: none (not in HAND_RECIPE_KEYS) → NEW-TRADE pattern, 3 recipes.
- Catalog codes already seeded: B-FRAME-SF (wood, hand-seeded on floor area), B-WALL-FRAME-LF (wood), B-DRYWALL-SF + B-DW-* adders (drywall pack), B-FS-HOW-LF (firestopping), B-MP-SUBFRAME-SF (metal_panels). None duplicated; new prefix `B-MSF-`.
- Blueprint template tasks: `Interior metal stud framing — all floors` (commercial.ts, framing) → `interior_partitions` title_re.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| metal_stud_framing-ufgs-09-22-00 | UFGS 09 22 00 Supports for Plaster and Gypsum Board (Aug 2024) | 1 | public_domain | partition/ceiling steps, gasket, backing, hanger wire, tolerances |
| metal_stud_framing-ufgs-05-40-00 | UFGS 05 40 00 Cold-Formed Metal Framing (May 2015 chg 1) | 1 | public_domain | structural steps, screws ≥3 threads, jambs/headers, bridging rows, temp bracing, slab-edge anchors, welding limits |
| metal_stud_framing-sfia-tpg | SFIA Technical Product Guide (Mar 2026) | 4 | association_public | designator, mils↔gauge (30 vs 33 mil), yield labeling, ≥1 in. end bearing |
| plumbing-ada-2010 | 2010 ADA Standards | 1 | public_domain | 609.8 grab-bar 250 lb |
| icc-pa | ICC public access | 3 | proprietary_ref_only | IBC 2211, IBC 715, IRC R603 (section + paraphrase) |
| ecfr-1926-{e,h,i,j,l,m,x,z} | 29 CFR 1926 | 1 | public_domain | hazards (sections re-read on eCFR 2026-10-08) |

CFSEI tech notes (cfsei.org/technical-notes) and AISI S200/S220/S240, ASTM C754/C1007, AWS D1.3 were not cited directly (reference-only, reached through UFGS).

## Work steps
- `interior_partitions`: layout + tracks → deflection track (IBC 715) → studs per schedule → openings → backing (ADA 609.8) → bridging + framing gate (IBC 2211).
- `structural_cfs` (priority 10): shop drawings/labels/storage → tracks + anchors → studs, clips, headers (IBC 2211) → bracing/bridging/temp bracing → framing gate (IBC 2211, IRC R603).
- `ceilings_soffits` (priority 5): hanger wires → carriers + furring → soffits/openings + framing gate.

## Hazards
pat_tool 1926.302(e)(1) · sharp_edges 1926.95(a) · eye_flying 1926.102(a)(1) · noise 1926.101(a) · ladder_top_step 1926.1053(b)(13) · lift_scaffold_fall 1926.451(g)(1) · aerial_lift 1926.453(b)(2)(v) · edge_fall 1926.501(b)(1) · falling_objects 1926.501(c) · material_stack 1926.250(a)(1) · silica_drilling 1926.1153(c)(1) · hot_work 1926.352(a).

## QA checklist
15 items (layout/track/designator/bearing/screws/deflection gap/rated track*/jambs/backing/grab-bar backing*/bridging/plumb-plane/in-line + slide clips/shop drawings/hanger wire). * = safety, ES pending.

## Inspection / acceptance checkpoints
- framing: stud size/mils/spacing; deflection track + rated listing; openings; backing; CFS bridging/clips/anchors; walls open for MEP.

## Cost basis (all platform-baseline estimates, 2026-10-08)
| Code | Item | Unit | Material ¢ | Labor hr | Equip ¢ | Waste % |
|---|---|---|---|---|---|---|
| B-MSF-PART-SF | 3-5/8 in. 30 mil studs 16 in. o.c. partition | SF wall | 80 | 0.025 | 5 | 7 |
| B-MSF-EXT-SF | 6 in. 54 mil exterior structural CFS | SF wall | 300 | 0.06 | 25 | 5 |
| B-MSF-DEFTRK-LF | deflection track adder | LF | 250 | 0.04 | 10 | 5 |
| B-MSF-BACKING-EA | in-wall backing | EA | 1500 | 0.35 | 0 | 10 |
| B-MSF-CEIL-SF | framed drywall ceiling/soffit suspension | SF | 140 | 0.04 | 10 | 7 |

## Quantity rules (commercial / industrial only)
- B-MSF-PART-SF = area_sf_sum × 1 (assumption notes dropping wood B-FRAME-SF on steel-framed jobs)
- B-MSF-DEFTRK-LF = area_sf_sum × 0.1
- B-MSF-BACKING-EA = rooms × 1.5; + const 6 when `has_accessibility`
- B-MSF-CEIL-SF = area_sf_sum × 0.15
- B-MSF-EXT-SF: no rule (no exterior-wall-area fact) — manual line.

## Blueprint callouts
None this wave.

## Open questions → REVIEW_QUEUE
- Hand seeder always adds wood B-FRAME-SF on floor area, so commercial steel-framed jobs get wood framing + B-MSF-PART-SF; consider gating B-FRAME-SF by building type (scope).
- All B-MSF costs are estimates.
- 'ADA 609.8' checklist ref shows ADA, not IBC — renders fine as free text.
