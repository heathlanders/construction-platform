# Dossier — `construction_management` (Construction Management / Owner's Rep)

> Wave: w22 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/construction_management.ts` · Status: draft
> Taxonomy: category `services` · permit_trade `null` · phase `site_prep` · CSI `01 31`

## Scope (2–4 sentences)
A construction manager (agency CM) or owner's representative manages schedule, cost, quality and scope on
the owner's behalf: master schedule and updates, budget/cost reports, change-order log, RFI and submittal
tracking, meeting minutes, monthly owner report, pay-application review with lien waivers, and closeout.
Does not perform the work; CM-at-risk self-performed work belongs to the relevant trade packs. Maps to the
platform's RFI, submittal, change-order, budget, invoice and project-overview (DAG/critical path) features.

## Existing coverage reconciled
- Hand recipe: none (permit_trade null → nopermit generic step). Services pattern: no recipes.
- Catalog codes already seeded: none. No assemblies (services wave).
- Blueprint template tasks hitting this trade: none.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| construction_management-cmaa | CMAA — What is Construction Management? | 3 | association_public | identity, cost report, minutes |
| construction_management-ufgs-01-32-01 | UFGS 01 32 01.00 10 Project Schedule | 1 | public_domain | schedule QA (≤20 workday activities, open ends, updates) |
| construction_management-ufgs-01-33-00 | UFGS 01 33 00 Submittal Procedures | 1 | public_domain | submittal register, resubmittal numbering |
| construction_management-ufgs-01-20-00 | UFGS 01 20 00 Price and Payment Procedures | 1 | public_domain | pay-app package, unbalanced breakdown, sub payment certification |
| construction_management-ufgs-01-78-00 | UFGS 01 78 00 Closeout Submittals | 1 | public_domain | as-builts, warranties, O&M, spare parts |
| construction_management-wi-779-02 | Wis. Stat. 779.02 | 1 | gov_open | lien notices (prime, 60-day), lender copy, trust fund |
| construction_management-wi-779-06 | Wis. Stat. 779.06 | 1 | gov_open | lien claim timing (6 mo, 30-day intent) |
| ecfr-1926-m/e/o/p/x | 29 CFR 1926 Subparts | 1 | public_domain | hazards |

AGC/AIA/ConsensusDocs contract forms: proprietary — not used.

## Work steps
None (services pattern).

## Hazards
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| open_edges | fall from slab edge/opening | 1926.501(b)(1) | 4 |
| floor_holes | fall through hole/skylight | 1926.501(b)(4)(i) | 4 |
| backing_equipment | struck by reversing earthmoving equipment | 1926.602(a)(9)(ii) | 4 |
| falling_objects | head injury | 1926.100(a) | 3 |
| trench_entry | cave-in | 1926.652(a)(1) | 4 |
| ladder_access | ladder fall | 1926.1053(b)(1) | 3 |

## QA checklist (deliverables)
baseline_schedule, schedule_updates, budget_report, change_order_log, rfi_submittal_logs, meeting_minutes,
pay_app_review, lien_waivers, wi_lien_notices, closeout_package.

## Inspection / acceptance checkpoints
- pay_application_review, monthly_owner_report, closeout (descriptive keys, non-gating).

## Cost basis / Quantity rules / Components
None (services wave).

## Open questions → REVIEW_QUEUE
- Wisconsin lien-waiver forms are not statutory; conditional/unconditional practice is industry convention — owner to confirm wording.
- Lien handling is WI-only; other states need their own notice rules (jurisdiction data, not this pack).
