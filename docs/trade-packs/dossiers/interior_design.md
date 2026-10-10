# Dossier — `interior_design` (Interior Design)

> Wave: w22 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/interior_design.ts` · Status: draft
> Taxonomy: category `services` · permit_trade `null` · phase `finishes_interior` · CSI `01`

## Scope (2–4 sentences)
Designs interior spaces for interior alterations and fit-outs: programming, space plan, finish schedule and
material boards, FF&E specification and procurement tracking, reflected-ceiling/lighting coordination, finish
fire-rating documentation, accessible furniture layouts, and the punch walk. Does NOT install FF&E
(`furniture_ffe`), and does not design structure, MEP or the building envelope (architect / engineering —
excluded from interior design practice by Wis. Stat. 443.01(5m)).

## Existing coverage reconciled
- Hand recipe: none → services pattern (no recipes, no gates, no code_refs).
- Catalog codes already seeded: none; services wave adds no assemblies.
- Blueprint template tasks hitting this trade: none.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| interior_design-wi-ch443 | Wis. Stat. ch. 443 | 1 | gov_open | scope boundary, title law, sealing (443.01(5m), 443.02, 443.075, 443.175) |
| interior_design-cidq-exams | CIDQ NCIDQ exam | 3 | association_public | deliverable/competency areas (programming, codes, coordination) |
| millwork-access-board-ada / plumbing-ada-2010 | 2010 ADA Standards (reused) | 1 | public_domain | 226.1, 304.3, 305.3, 306, 403.5.1, 902.3 |
| icc-pa | ICC codes (reused) | ref | proprietary_ref_only | IBC Ch. 8 — 803, 804, 806 (section numbers only) |
| interior_design-astm-e84 | ASTM E84 | ref | proprietary_ref_only | test name only |
| furniture_ffe-ufgs-12-59-00 | UFGS 12 59 00 (reused) | 1 | public_domain | FF&E hand-off / punch |
| ecfr-1926-c, -e, -m, -x | 29 CFR 1926 | 1 | gov_open | hazards |
| platform-baseline | platform default | — | platform_estimate | procurement update cadence |

**Wisconsin finding:** Wisconsin DOES regulate interior designers — but as a **title law**, now in Wis. Stat.
ch. 443 (formerly ch. 440 subch. IX). 443.02: only the title "Wisconsin registered interior designer" is
protected; practicing interior design does not require registration. 443.075: registration requires an approved
exam. 443.175: a registered interior designer may seal interior technical submissions and local governments must
accept them.

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| housekeeping_trip | trips on debris walking the fit-out | 1926.25(a) | 2 |
| floor_openings | uncovered openings/shafts | 1926.501(b)(4)(i) | 4 |
| overhead_work | struck by dropped tools overhead | 1926.100(a) | 3 |
| stepladder_misuse | top step of stepladder | 1926.1053(b)(13) | 3 |

## QA checklist (10 — deliverables)
program_signed, space_plan_ada, accessible_surfaces, finish_schedule_complete, finish_rating_backup (safety),
ffe_spec_tagged, procurement_tracked, rcp_coordinated, sealed_submissions, punch_walk.

## Inspection / acceptance checkpoints
- owner_design_approval, ffe_handoff, final_punch (owner checkpoints, no AHJ gates).

## Cost basis / Quantity rules / Blueprint callouts
None (services wave).

## Open questions → REVIEW_QUEUE
- Safety ES for 4 hazards + finish_rating_backup QA.
- procurement_tracked cadence is a platform estimate.
- cidq.org 403s to scripts; confirmed by web search only. ncidq.org is a parked domain.
