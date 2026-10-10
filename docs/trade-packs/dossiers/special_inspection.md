# Dossier — `special_inspection` (Special Inspection)

> Wave: w21 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/special_inspection.ts` · Status: draft
> Taxonomy: category `services` · permit_trade `null` · phase `inspections` · CSI `01 45`

## Scope (2–4 sentences)
Third-party special inspection required by IBC Chapter 17 (1704 general, 1705 required categories). The
inspector is hired by the owner/design professional, works from the Statement of Special Inspections (SSI),
observes concrete/rebar, structural steel bolting and welding, masonry, soils and deep foundations, and
sprayed fireproofing continuously or periodically, reports discrepancies, and closes with a final report.
NOT this trade: lab testing of samples (cylinders, densities, cores → `materials_testing`), structural
observation by the engineer of record (`engineering`), the municipal building inspection.

## Existing coverage reconciled
- Hand recipe: none → services pattern, `recipes: []` (special inspections attach to other trades' work).
- Catalog codes already seeded: none. No assemblies added (services wave rule).
- Blueprint template tasks hitting this trade: none.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| special_inspection-ufgs-01-45-35 | UFGS 01 45 35 Special Inspections (May 2024) | 1 | public_domain | deliverables, qualifications, reports, NCR flow |
| special_inspection-wi-sps361 | Wis. Admin. Code ch. SPS 361 | 1 | gov_open | WI adopts IBC 2021 (361.05); 361.03(15) global deletion of submittal/approval duties |
| special_inspection-icc-cert | ICC Certification programs | 3 | association_public | special-inspector certificate categories |
| icc-pa | ICC codes (IBC Ch. 17) | ref | proprietary_ref_only | section numbers only |
| ecfr-1926-e/m/p/q/r/cc | 29 CFR 1926 subparts | 1 | public_domain | hazards |

## Work steps
None — no permit path, no recipes. Hold points live in `inspection_checklists` (`statement_of_special_inspections`, `pre_pour_hold`, `final_report`).

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| deck_edge | Steel/deck leading edge > 15 ft | 1926.760(a)(1) | 4 |
| open_sides | Unprotected slab edges/shafts ≥ 6 ft | 1926.501(b)(1) | 4 |
| deck_holes | Uncovered holes/skylights | 1926.501(b)(4)(i) | 4 |
| rebar_impalement | Protruding rebar | 1926.701(b) | 3 |
| suspended_load | Crane fall zone | 1926.1425(b) | 4 |
| trench_cave_in | Entering footing excavations ≥ 5 ft | 1926.652(a)(1) | 4 |
| falling_objects | Overhead work | 1926.100(a) | 3 |

## QA checklist (deliverables)
SSI on site · inspector qualifications on file · preconstruction meeting · inspect before cover · daily
reports · discrepancy notice + NCR log · NCR closeout by reinspection/EOR acceptance · interim reports ·
fabricator certificates of compliance · final report before CO.

## Inspection / acceptance checkpoints
- statement_of_special_inspections: SSI accepted, categories + frequency, agencies/qualifications, structural observations, WI local-official reporting check.
- pre_pour_hold: rebar, anchors/embeds, bearing soil, continuous presence.
- final_report: all items complete, zero open NCRs, fabricator certs, signed/sealed before occupancy.

## Cost basis / Quantity rules / Components
None (services wave).

## Open questions → REVIEW_QUEUE
- IBC 2021 Ch. 17 section numbering (1704.2.1/.2.3/.2.4/.2.5, 1704.6, 1705.2–1705.6) cited from memory of the edition — verify against the adopted edition.
- WI SPS 361.03(15) note cites SPS 362.1700 (applies IBC 1711–1716), but 362.1700 is absent from the current SPS 362 TOC — confirm whether WI still applies any ch. 17 special-inspection reporting.
- Hazard 1926.760(a)(1) is written for employees engaged in steel erection; applied to the inspector walking erection areas — confirm framing.
