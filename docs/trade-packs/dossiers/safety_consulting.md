# Dossier — `safety_consulting` (Safety Consulting)

> Wave: w22 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/safety_consulting.ts` · Status: draft
> Taxonomy: category `services` · permit_trade `null` · phase `site_prep` · CSI `01 35`

## Scope (2–4 sentences)
A third-party construction safety consultant writes the site-specific safety plan and the written programs
29 CFR 1926 requires (hazard communication, fall protection plan for leading-edge/precast/residential work,
silica exposure control plan, respiratory protection), keeps the competent-person list, audits the site and
tracks corrective actions, runs toolbox talks, investigates incidents, and helps with OSHA 300 recordkeeping
and training records. Outputs map onto platform safety incidents, JSA records and safety certifications.
NOT this trade: industrial-hygiene sampling and hazmat surveys (`environmental_consulting`), asbestos/lead
abatement (`abatement`). The employer stays legally responsible for its program (1926.20(b)).

## Existing coverage reconciled
- Hand recipe: none → services pattern, `recipes: []`.
- Catalog codes already seeded: none. No assemblies (services wave rule).
- Blueprint template tasks hitting this trade: none.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| ecfr-1926-c | 29 CFR 1926 Subpart C | 1 | public_domain | 1926.20(b) programs + competent-person inspections, 1926.21(b) training, 1926.32(f) competent person |
| ecfr-1926-d / -e | Subparts D, E | 1 | public_domain | 1926.59 hazcom, 1926.103 respiratory, 1926.100/102 PPE hazards |
| ecfr-1926-m / -p / -z / -cc | Subparts M, P, Z, CC | 1 | public_domain | 1926.502(k) fall plan; hazards; 1926.1153(g) silica plan |
| safety_consulting-ecfr-1904 | 29 CFR 1904 | 1 | public_domain | 1904.1 / .29 / .32 / .39 recordkeeping + reporting |
| safety_consulting-ecfr-1910-1200 | 29 CFR 1910.1200 | 1 | public_domain | (e)(1) written hazcom program |
| safety_consulting-ecfr-1910-134 | 29 CFR 1910.134 | 1 | public_domain | (c) written respiratory program |
| safety_consulting-osha-3886 | OSHA 3886 Recommended Practices — Construction | 1 | public_domain | program structure only (403 to scripts) |
| safety_consulting-osha-outreach | OSHA Outreach Training Program | 1 | gov_open | 10/30-hour cards are voluntary (403 to scripts) |

## Work steps
None — no permit path, no recipes. Review points live in `inspection_checklists` (`program_review`, `recordkeeping_review`).

## Hazards (consultant walking an active site)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| open_sides | Unprotected edges/openings ≥ 6 ft | 1926.501(b)(1) | 4 |
| floor_holes | Uncovered holes/skylights | 1926.501(b)(4)(i) | 4 |
| trench_entry | Entering excavations ≥ 5 ft | 1926.652(a)(1) | 4 |
| suspended_load | Crane fall zone | 1926.1425(b) | 4 |
| falling_objects | Overhead work | 1926.100(a) | 3 |
| silica_dust | Other crews' silica dust | 1926.1153(g)(1)(iv) | 3 |
| eye_debris | Flying particles | 1926.102(a)(1) | 2 |

## QA checklist (deliverables)
Site-specific safety plan · written hazcom + respiratory programs (safety) · fall protection plan where
1926.502(k) applies (safety) · silica exposure control plan (safety) · competent-person list (safety) ·
audit reports with owner/due date and verified closeout · toolbox talk / JSA records · incident
investigation + 1904.39 reporting clocks · OSHA 300 / 300-A · training matrix + Outreach cards.

## Inspection / acceptance checkpoints
- program_review: SSSP, hazcom + SDS, respiratory program, silica plan, competent persons.
- recordkeeping_review: 300 Log 7-day entry, 300-A posting, 1904.39 reports, training records.

## Cost basis / Quantity rules / Components
None (services wave).

## Open questions → REVIEW_QUEUE
- OSHA 3886 URL/number and the Outreach page could not be script-verified (osha.gov 403); confirm.
- 1926.1153(g)(1)(iv) used for a visitor's exposure to other employers' dust — it is an employer plan-content
  requirement, applied here to the consultant's protection; confirm framing.
- Several states require OSHA 10/30 cards on some or all jobs (from memory, unverified: NY, NV, CT, MA, MO, NH, RI, WV) — not listed in the pack; verify before adding a state note.
