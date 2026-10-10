# Dossier — `permit_expediting` (Permit Expediting)

> Wave: w22 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/permit_expediting.ts` · Status: draft
> Taxonomy: category `services` · permit_trade `null` · phase `site_prep` · CSI `01 41`

## Scope (2–4 sentences)
Gets a project permitted and closed out: identifies every permit/approval (permit matrix), assembles complete
application packages, answers plan review comments, tracks fees and expirations, schedules inspections, and drives
finals to the certificate of occupancy. Does not design (architect/engineering), does not perform inspections
(special_inspection / AHJ), does not do the work. In the platform the `permits` records, AHJ milestones and the
jurisdiction engine are the expediter's working file.

## Existing coverage reconciled
- Hand recipe: none (permit_trade null → no recipe, no gates, no code_refs — services pattern).
- Catalog codes already seeded: none; services wave adds no assemblies.
- Blueprint template tasks hitting this trade: none.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| special_inspection-wi-sps361 (reused) | Wis. Admin. Code ch. SPS 361 | 1 | gov_open | 361.295, 361.30 (+Table 361.30-1), 361.31, 361.33, 361.36, 361.40(4) |
| erosion_control-wi-sps320 (reused) | Wis. Admin. Code ch. SPS 320 | 1 | gov_open | 320.08, 320.09(4)–(11) |
| permit_expediting-dsps-commercial | DSPS Commercial Buildings program | 1 | gov_open | eSLA plan review context |
| permit_expediting-dsps-udc | DSPS UDC program | 1 | gov_open | dwelling permit context |
| permit_expediting-madison-new-house | Madison DSC — New House | 2 | gov_open | zoning-first, package, withholding letter, posting, CO |
| permit_expediting-madison-nonres-new | Madison DSC — Non-residential new construction | 2 | gov_open | sealed plans >50k cu ft, fees at submittal, holds, plumbing >16 fixtures, fire submittals |
| permit_expediting-madison-co | Madison DSC — Certificates of Occupancy | 2 | gov_open | CO prerequisites, compliance statement, staged CO |
| permit_expediting-madison-inspections | Madison DSC — Scheduling Inspections | 2 | gov_open | inspection request content |
| permit_expediting-dane-zoning-permit | Dane County — Zoning Permit | 2 | gov_open | county vs. city zoning |
| ecfr-1926-c / -e / -m (shared) | 29 CFR 1926 Subparts C, E, M | 1 | gov_open | hazards |

Corrections vs. brief: the WI UDC permit sections are **SPS 320.08 (where required) and 320.09 (procedure)** —
320.07 is the definitions section. SPS 361.30/.31 verified (plan review and approval / plans).

## Key facts (WI example — other states differ)
- Commercial: plans for public buildings/places of employment need state (or authorized municipal) approval before
  construction (361.30); small A-2/A-3/B/F/M/S/U buildings under 25,000 cu ft are exempt; HVAC, fire protection and
  pre-engineered structural components have their own plan approvals; local permit can't issue until state approval
  (361.295). Plans signed/sealed per ch. 443, to scale, with calcs, via eSLA, 15-business-day review (361.31).
  Footing/foundation permission to start at owner's risk (361.32). Approved plans kept on site (361.33). Approval
  expires 2 yr (shell) / 3 yr (occupancy) (361.36). Compliance statement before occupancy (361.40(4)).
- Dwellings: uniform building permit before any on-site work incl. excavation (320.08); 2 plan sets with site plan
  (erosion control), floor plans, elevations, energy data (320.09(4)–(6)); permit expires 24 months if exterior not
  complete; posted conspicuously with seal (320.09(9)); 10-business-day decision (320.09(11)).
- Madison: zoning site-plan review first; withholding letter; permit in a street-facing window; CO after finals;
  commercial CO needs fire inspection + supervising-professional compliance statement.

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| site_orientation | Unfamiliar active-site hazards | 1926.21(b)(2) | 2 |
| struck_by_head | Falling objects | 1926.100(a) | 3 |
| ppe_required | Missing site PPE | 1926.28(a) | 2 |
| slip_trip | Debris in walkways | 1926.25(a) | 2 |
| open_edges | Excavation / floor edge | 1926.501(b)(1) | 4 |

## QA checklist (deliverables)
permit_matrix, jurisdiction_confirmed, zoning_first, complete_package, comment_responses, fee_log,
expiration_tracking, permit_posted, inspection_log, closeout_co.

## Inspection / acceptance checkpoints
- permit_matrix_review, permit_issuance, occupancy_closeout (descriptive keys — no gates).

## Cost basis / Quantity rules / Blueprint callouts
None (services wave).

## Open questions → REVIEW_QUEUE
- es_safety: 5 hazards pending human Spanish translation.
- scope: pack prose is Wisconsin-anchored; other states' plan-review thresholds and expirations differ — consider
  per-state notes driven by the jurisdiction engine later.
- source_doubt: SPS 361.30 Table 361.30-1 exemption rows parsed from PDF text; confirm the 25,000 cu ft row applies to
  all listed groups.
