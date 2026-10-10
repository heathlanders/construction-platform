# Dossier — `estimating_services` (Estimating / Takeoff Services)

> Wave: w22 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/estimating_services.ts` · Status: draft
> Taxonomy: category `services` · permit_trade `null` · phase `site_prep` · CSI `01`

## Scope (2–4 sentences)
Independent quantity takeoff and cost estimating for owners, GCs or subs: measured quantities by CSI
division with drawing references, a basis of estimate (assumptions, exclusions, allowances, escalation,
contingency), an estimate class, separately priced alternates, and bid-day scope sheets / bid leveling.
In the platform this maps onto the estimating engine (T-63): assembly lines with `assumptions[]`.
NOT this trade: scheduling/CM services (`construction_management`), design (`architect`/`engineering`).

## Existing coverage reconciled
- Hand recipe: none → services pattern, `recipes: []`.
- Catalog codes already seeded: none. No assemblies (services wave rule).
- Blueprint template tasks hitting this trade: none.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| estimating_services-gsa-p120 | GSA PBS P120 (PBS 1000.6B, Nov 2022) | 1 | public_domain | deliverables: measured vs parametric, no lump sums, assumptions, contingency shown separately, alternates priced separately, escalation to midpoint, Basis of Estimate contents, reconciliation |
| estimating_services-aace-18r97 | AACE RP 18R-97 public sample | ref | proprietary_ref_only | estimate class (reference only) |
| estimating_services-aace-56r08 | AACE RP 56R-08 public sample | ref | proprietary_ref_only | building-industry class (reference only; ranges are risk-based — none stored) |
| estimating_services-aspe-cert | ASPE CPE/AEP certification | 3 | association_public | estimator credential context |
| ecfr-1926-e/m/o/p/x/z | 29 CFR 1926 subparts | 1 | public_domain | site-walk hazards |

## Work steps
None — no permit path, no recipes.

## Hazards (site walk)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| open_sides | Fall from unprotected edges | 1926.501(b)(1) | 4 |
| floor_holes | Uncovered holes | 1926.501(b)(4)(i) | 4 |
| ladder_access | Ladder to attic/roof | 1926.1053(b)(1) | 3 |
| backing_equipment | Backing vehicles/equipment | 1926.601(b)(4) | 4 |
| trench_entry | Trench cave-in | 1926.652(a)(1) | 4 |
| suspect_acm | Disturbing suspect ACM on renovation walk | 1926.1101(k)(2)(i) | 3 |
| head_protection | Falling objects | 1926.100(a) | 3 |

## QA checklist (deliverables)
documents_listed · quantities_by_division · measured_vs_parametric · assumptions_exclusions · estimate_class ·
productivity_basis · contingency_escalation · alternates_priced · bid_leveling · qa_review (10).

## Inspection / acceptance checkpoints
- `basis_of_estimate`: documents, pricing basis, assumptions/allowances/contingency, escalation, exclusions/risks, class + QA sign-off (P120 BoE minimum contents).

## Cost basis / Quantity rules / Components
None (services wave).

## Open questions → REVIEW_QUEUE
- source_doubt: bid leveling QA has no public standard source — carried as platform-baseline/estimate.
- source_doubt: GSA P120 canonical gsa.gov URL not found (gsa.gov paths 404); cited WBDG mirror of PBS 1000.6B.
- es_safety: 7 hazards pending human translation.
