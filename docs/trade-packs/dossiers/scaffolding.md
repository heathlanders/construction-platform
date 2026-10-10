# Dossier — `scaffolding` (Scaffolding)

> Wave: w18 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/scaffolding.ts` · Status: draft
> Taxonomy: category `specialty` · permit_trade `null` · phase `framing` · CSI `01 54`

## Scope (2–4 sentences)
Erects, inspects/tags, maintains and dismantles work scaffolds for other trades: supported frame/system
scaffolds (base plates, mudsills, ties, planked levels, guardrails, toeboards, netting), rolling towers, and
two-point suspended stages. Also furnishes sidewalk sheds and mast-climber allowances. Does NOT do the facade work
itself (masonry, stucco, glazing…), and aerial lifts belong to the using trade. No AHJ permit path → no gates or
code refs; competent-person hold points live in `inspection_checklists`.

## Existing coverage reconciled
- Hand recipe: none (not in building.ts / nopermit.ts) → NEW-TRADE pattern, 3 recipes.
- Catalog codes already seeded: none `G-SCAF-*` (only unrelated `G-SCT-NETPOST-EA`).
- Blueprint template tasks hitting this trade: none (0).

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| ecfr-1926-l | 29 CFR 1926 Subpart L — Scaffolds (shared) | 1 | public_domain | hazards, QA |
| scaffolding-ecfr-1926-451 | 1926.451 General requirements | 1 | public_domain | 4:1 ties, footing, planking, guardrails, access, power lines, inspection, falling objects, suspension |
| scaffolding-ecfr-1926-452 | 1926.452 Specific types — (c) frame, (w) mobile | 1 | public_domain | frame erection sequence, pins/braces |
| scaffolding-ecfr-1926-454 | 1926.454 Training | 1 | public_domain | user / erector training QA |
| scaffolding-ecfr-1926-l-appendices | Subpart L Appendices A, C, D, E (non-mandatory) | 1 | public_domain | grade-stamped plank, erector training topics (no tables copied) |
| scaffolding-osha-etool | OSHA Scaffolding eTool (403 to scripts) | 1 | public_domain | tagging practice framing |
| ecfr-1926-m, ecfr-1926-c | Subparts M, C | 1 | public_domain | PFAS lifelines; manual handling general duty |
| platform-baseline | The Jobsite cost baseline | — | platform_estimate | all costs |

SAIA / ANSI A10.8 were NOT used for any value (proprietary/association reference only).

## Work steps (draft → pack recipes)
- `frame_scaffold_erect` (title_re `\bscaffold`, priority 0): plan with competent person → base plates/mudsills/screw jacks → frames & braces lift by lift → ties at 4:1 (20/26 ft vertical, ≤30 ft horizontal) → plank/guard/protect → inspect, tag, hand over.
- `scaffold_dismantle` (priority 10): clear/tag out/barricade → strip top-down, ties last → sort/inspect/stage.
- `suspended_scaffold_rig` (swing stage, priority 20): verify roof anchorage/outriggers/counterweights/tiebacks → rope + hoist inspection, assemble, test lift → independent lifelines, sway ties, barricade.

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| erector_fall | Fall during erect/dismantle | 1926.451(g)(2) | 4 |
| user_fall | Fall from platform >10 ft | 1926.451(g)(1) | 4 |
| collapse_overload | Overload / damaged parts | 1926.451(f)(1) | 4 |
| foundation_settle | Soft footing, no mudsill | 1926.451(c)(2) | 4 |
| tip_over | No ties above 4:1 | 1926.451(c)(1) | 4 |
| power_line | Electrocution | 1926.451(f)(6) | 4 |
| falling_objects | Struck by falling items | 1926.451(h)(1) | 3 |
| plank_failure | Plank break/slide/tip | 1926.451(b)(4) | 3 |
| access_climbing | Climbing braces | 1926.451(e)(1) | 3 |
| weather | Ice / high wind | 1926.451(f)(8) | 3 |
| suspension_failure | Stage drop | 1926.451(d)(10) | 4 |
| manual_handling | Strain/pinch | 1926.20(b)(1) | 2 |

## QA checklist
15 items — design/rating + power-line plan, footing, plumb/braced, access, ties, full planking + overlap, guardrails,
falling-object protection, tagging (practice), training (users + erectors), daily inspection, suspension anchorage,
ropes + lifelines, dismantle sequence, damaged parts removed.

## Inspection / acceptance checkpoints
- `post_erection`: footing, plumb/braced, ties, planking/guardrails/toeboards, access, power lines, tag posted.
- `competent_person_daily`: settlement, missing parts, debris/snow/ice/overload, no ladders or boxes on platforms, tag updated.
- `suspension_rigging_check`: roof supports, ropes/hoists, independent lifelines.
- `pre_dismantle`: trades cleared, tagged out, drop zone barricaded.

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| G-SCAF-FRAME-SF | Frame scaffold erect + dismantle | SF face | 10 | 0.03 | 15 | 0 | platform estimate |
| G-SCAF-RENT-SFMO | Frame scaffold rental | SF face-mo | 0 | 0 | 45 | 0 | platform estimate |
| G-SCAF-NET-SF | Debris netting | SF | 30 | 0.005 | 0 | 10 | platform estimate |
| G-SCAF-ROLL-WK | Rolling tower rental | WK | 0 | 1 | 12000 | 0 | platform estimate |
| G-SCAF-MAST-WK | Mast climber allowance | WK | 0 | 4 | 350000 | 0 | platform estimate |
| G-SCAF-SHED-LF | Sidewalk shed, first month | LF | 4000 | 0.8 | 6000 | 5 | platform estimate |

## Quantity rules
- `G-SCAF-FRAME-SF` = area_sf_sum × 0.5 (masonry_veneer|stucco_finish; commercial/mf/industrial) — rough wall face.
- `G-SCAF-RENT-SFMO` = area_sf_sum × 1.0 (same scope) — ~2 months on that face.
- `G-SCAF-NET-SF` = area_sf_sum × 0.5 (same facts; commercial/mf).

## Blueprint callouts (components)
- none this wave.

## Open questions → REVIEW_QUEUE
- All 6 costs are platform estimates — need supplier quotes/regional tuning.
- Wall-face ≈ 0.5 × floor area heuristic is crude; a perimeter/height fact would help.
- Mast climbers (ANSI A92.9) have no OSHA-specific section; recipe not written.
- 12 hazard ES + 12 safety QA ES pending human translation.
