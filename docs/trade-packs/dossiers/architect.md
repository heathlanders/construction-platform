# Dossier — `architect` (Architect)

> Wave: w22 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/architect.ts` · Status: draft
> Taxonomy: category `services` · permit_trade `null` · phase `site_prep` · CSI `01`

## Scope (2–4 sentences)
Licensed architect: programs and designs the building through schematic design, design development and
sealed construction documents (code analysis, egress/accessibility plans, specifications), files for plan
review, then administers the construction contract — submittals, RFIs, site observation reports, pay
certification, punch list, substantial completion, record drawings. Structural/civil/MEP design is
`engineering`; interior-only design is `interior_design`; owner's-rep management is `construction_management`.
The architect observes — never directs the contractor's means and methods or site safety.

## Existing coverage reconciled
- Hand recipe: none → services pattern (no recipes, no gates, no code_refs).
- Catalog codes already seeded: none (no assemblies — services wave).
- Blueprint template tasks hitting this trade: none.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| architect-wi-stat443 | Wis. Stat. ch. 443 | 1 | gov_open | practice definition 443.01(5), registration 443.02, exempt buildings 443.15, seal 443.17 |
| architect-wi-ae2 | Wis. Admin. Code A-E 2 | 1 | gov_open | seal specs + sign/seal/date every sheet, bound volumes, revisions (A-E 2.02) |
| architect-wi-sps361-31 | Wis. Admin. Code SPS 361.31 | 1 | gov_open | commercial plan submittal content, eSLA, conditional approval |
| architect-aia-b101 | AIA B101 public summary | 3 | association_public | five basic-service phases (concepts only) |
| architect-aia-a201 | AIA A201 public summary | 3 | association_public | architect's construction-phase role (concepts only) |
| architect-aia-g704 | AIA G704 public page | 3 | association_public | certificate of substantial completion (concept) |
| architect-ncarb | NCARB Get Licensed | 3 | association_public | licensure path (reference) |
| icc-pa | ICC codes | ref | proprietary_ref_only | IBC Ch. 3/5/6/10/11 section numbers only |
| ecfr-1926-c/e/m/x/p | 29 CFR 1926 | 1 | public_domain | site-visit hazards |

Verification notes: the brief's "443.10 practice" is wrong — 443.10 is applications/licenses/roster; practice
is 443.01(5) + 443.02. A-E 3 = architect registration (education/experience/exam), not seals; seals are A-E 2.02.
SPS 361.31 confirmed (signing/sealing per ch. 443 + A-E 2.02); which buildings need state plan review sits in
SPS 361.30 (page did not render — not cited).

## Work steps
None — services pattern (permit_trade null, no template tasks).

## Hazards (draft → pack hazards)
| id | Hazard | Controls | OSHA ref | Sev |
|---|---|---|---|---|
| site_orientation | Walking an active site without the hazard briefing | check in with super, escort | 1926.21(b)(2) | 2 |
| falling_objects | Struck by falling objects | hard hat, avoid overhead work | 1926.100(a) | 3 |
| open_edges | Fall from edges/openings ≥ 6 ft | stay back, never move guardrails | 1926.501(b)(1) | 4 |
| floor_holes | Fall through holes/covers | watch covers, avoid loose sheet goods | 1926.501(b)(4)(i) | 4 |
| ladder_access | Fall from ladder to roof/ceiling | 3 ft extension, 3 points of contact | 1926.1053(b)(1) | 3 |
| excavation_entry | Cave-in entering trench | observe from top; egress ladder ≥ 4 ft | 1926.651(c)(2) | 4 |

## QA checklist (deliverables)
- [ ] Phase sign-off with cost update — B101
- [ ] Code analysis complete and consistent with plans — IBC (ref), SPS 361.31(2)(d)
- [ ] Every sheet signed/sealed/dated; revisions re-sealed — A-E 2.02, 443.17
- [ ] Permit set to scale, specs + calcs, eSLA — SPS 361.31
- [ ] Plan-approval conditions tracked — SPS 361.31(3)(c)
- [ ] Submittal log with actions + turnaround — A201
- [ ] RFIs answered in writing; cost/time → change order — A201
- [ ] Field report after each visit — A201
- [ ] Substantial completion certificate with punch list — G704/A201
- [ ] Record drawings at closeout — A201

## Inspection / acceptance checkpoints
- permit_submittal: exemption check (443.15), seals, code analysis/egress/accessibility, calcs + specs
- construction_administration_visit: check-in, observe vs documents/submittals, report nonconformance, issue report
- closeout: punch walk, G704 signatures, final pay certification, record set/warranties/O&M

## Cost basis
None — services wave (no assemblies).

## Quantity rules
None.

## Blueprint callouts (components)
None.

## Open questions → REVIEW_QUEUE
- SPS 361.30 plan-review thresholds not fetched (page render) — confirm which WI commercial buildings require state vs. municipal review and the architect/engineer seal threshold beyond 443.15.
- AIA concepts used from public summaries only — owner review that no form language crept in.
