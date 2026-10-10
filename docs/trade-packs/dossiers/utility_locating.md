# Dossier — `utility_locating` (Utility Locating / GPR Scanning)

> Wave: w21 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/utility_locating.ts` · Status: draft
> Taxonomy: category `services` · permit_trade `null` · phase `site_prep` · CSI `02 21`

## Scope (2–4 sentences)
Private utility locator / GPR scanning firm. Confirms the one-call (811 / Diggers Hotline) ticket, locates
private facilities the one-call members do not mark, scans concrete slabs with GPR before cutting or coring,
and delivers marks plus a written report. Does NOT dig, pothole for the excavator, or cut concrete — hands
off to excavation / concrete_cutting. Public utility marking is done by the facility owners, not this trade.

## Existing coverage reconciled
- Hand recipe: none → pack is new (one recipe, no supersede).
- Catalog codes already seeded: GPR scan priced in the concrete_cutting pack as `G-CUT-GPR-EA` — referenced, not redeclared. Services wave → no assemblies.
- Blueprint template tasks hitting this trade: none (grep of `blueprint-templates` for locat/gpr/scan/811 returned nothing). `title_re` therefore matches no template title.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| utility_locating-wi-182-0175 | Wis. Stat. § 182.0175 | 1 | gov_open | notice 3 working days, repeat notice 10-day rule, 18 in / 12 in clearance, color code, private-facility exclusion, exposed-facility inspection, tracer wire after 2006 |
| utility_locating-diggers-hotline-guide | Diggers Hotline Excavator's Guide | 4 | association_public | white lining, one ticket per contractor, relocates, "cleared only after all respond" |
| utility_locating-cga-best-practices | CGA Best Practices Guide | 4 | association_public | concepts (tolerance zone, white lining, purple reclaimed water) |
| utility_locating-asce-38 | ASCE/UESI 38 | 3 | proprietary_ref_only | quality-level names only |
| concrete_cutting-csda | CSDA resources (reused) | 4 | association_public | GPR report limits concept |
| ecfr-1926-p / g / k / z / aa | 29 CFR 1926 | 1 | public_domain | hazards |
| asphalt_paving-mutcd-part6 (reused) | MUTCD Part 6 | 1 | gov_open | roadway marking work |

## Work steps (recipe `private_locate_scan`)
1. Confirm the one-call ticket and the work area — QA ticket_valid, white_lining.
2. Review records and walk the site — QA quality_level.
3. Trace and mark the private lines — QA color_code_marks, tracer_wire.
4. Scan the slab before cutting or coring — QA gpr_report.
5. Hand over the report and protect the marks — QA private_report, tolerance_zone, ticket_renewal, exposed_inspected.
No gates (permit_trade null).

## Hazards
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| utility_strike | Strike while probing/potholing | 1926.651(b)(3) | 4 |
| roadway_struck_by | Traffic while marking in street | 1926.200(g)(2) | 4 |
| energized_concealed | Missed scan target → live conduit cut | 1926.416(a)(3) | 4 |
| silica_dust | Drilling / adjacent cutting | 1926.1153(c)(1) | 3 |
| confined_space | Manhole/vault to launch sonde | 1926.1203(a) | 4 |

## QA checklist (deliverables)
ticket_valid · white_lining · color_code_marks · private_report · gpr_report · tolerance_zone · ticket_renewal · exposed_inspected · tracer_wire · quality_level (10).

## Inspection / acceptance checkpoints
- locate_ticket_valid, pre_excavation_marks, slab_scan_before_cut.

## Cost basis
None (services wave). GPR scan = existing `G-CUT-GPR-EA`.

## Open questions → REVIEW_QUEUE
- vocab: no `gpr_unit` / `em_locator` / `vacuum_excavator` equipment type — not added.
- source_doubt: APWA uniform color code page returned 403 to scripts; color code cited from Wis. Stat. 182.0175(2m)(b) + CGA instead. Purple (reclaimed water) is CGA/APWA, not in the WI statute list.
- source_doubt: CGA printed guide is sold; online search free — kept as association_public, concepts only.
- scope: Wisconsin-anchored; other states' one-call laws (notice days, ticket life) differ — a jurisdiction layer could carry them later.
