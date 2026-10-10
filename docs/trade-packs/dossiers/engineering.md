# Dossier — `engineering` (Engineering — Structural / Civil / MEP)

> Wave: w22 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/engineering.ts` · Status: draft
> Taxonomy: category `services` · permit_trade `null` · phase `site_prep` · CSI `01`

## Scope (2–4 sentences)
Licensed engineers of record design and seal structural, civil (site/grading/stormwater) and MEP
calculations and drawings, review delegated-design/deferred submittals (trusses, precast, metal
buildings), shop drawings and RFIs, make structural observation / supervision visits, and issue letters
of conformance. Hand-offs: third-party special inspection → `special_inspection`; borings, lab tests and
the geotechnical report → `geotech`; site survey → `surveying`; architecture → `architect`.

## Existing coverage reconciled
- Hand recipe: none → services pattern, `recipes: []`, no gates, no code_refs.
- Catalog codes already seeded: none (services wave adds no assemblies).
- Blueprint template tasks hitting this trade: none.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| surveying-wi-stat443 (reused) | Wis. Stat. ch. 443 | 1 | gov_open | PE definition, responsible supervision of construction (443.01(8)) — identity |
| engineering-wi-ae2 | Wis. Admin. Code A-E 2 (A-E 2.02 seals) | 1 | gov_open | sealing every sheet, bound volumes, re-sealing revisions |
| engineering-wi-ae4 | A-E 4 PE registration | 1 | gov_open | identity only |
| engineering-wi-ae8 | A-E 8 professional conduct (8.05, 8.10) | 1 | gov_open | seal only work under personal direction and control |
| special_inspection-wi-sps361 (reused) | SPS 361 | 1 | gov_open | 361.30(3) component plans before installation; 361.31 sealed docs + calcs; 361.40 supervision + naming the supervising professional |
| engineering-ufgs-01-33-00 | UFGS 01 33 00 Submittal Procedures | 1 | public_domain | DOR approval of extensions of design, review action codes, sealed docs govern |
| engineering-nspe-what-pe | NSPE — What is a PE? | 3 | association_public | identity |
| icc-pa | ICC codes | ref | proprietary_ref_only | IBC 107.3.4.1, 1603, 1704.6 — section numbers in prose/checklist refs only |
| ecfr-1926-e/m/o/p/x/aa | 29 CFR 1926 | 1 | public_domain | site-visit hazards |

Note: "SPS 362 deferred submittals" from the brief was not found — SPS 362 has no deferred-submittal
section; the Wisconsin equivalent is SPS 361.30(3) (component/system plans approved before installation).

## Work steps
None — services pattern (no recipes).

## Hazards
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| open_sides | Edge / opening fall during observation | 1926.501(b)(1) | 4 |
| deck_holes | Fall through deck hole | 1926.501(b)(4)(i) | 4 |
| trench_cave_in | Entering excavation to check bearing/utilities | 1926.652(a)(1) | 4 |
| equipment_reverse | Struck by backing earthmoving equipment | 1926.602(a)(9)(ii) | 4 |
| falling_objects | Overhead falling objects | 1926.100(a) | 3 |
| ladder_access | Ladder to roof/mezzanine | 1926.1053(b)(1) | 3 |
| confined_space | Manhole/vault/pit entry | 1926.1203(a) | 4 |

## QA checklist (deliverables)
sealed_sheets, revision_resealed, calcs_support_drawings, deferred_list, delegated_review_stamp,
shop_drawing_action, rfi_turnaround, observation_reports, supervisor_named, conformance_letter.

## Inspection / acceptance checkpoints
- `sealed_construction_documents` — seals, design criteria, calcs, deferred list.
- `deferred_submittal_review` — supplier PE seal, interface loads/bearing, EOR stamp before install.
- `structural_observation` — visits by stage, written deficiencies, final report.

## Cost basis
None (services wave — no assemblies).

## Quantity rules / Blueprint callouts
None.

## Open questions → REVIEW_QUEUE
- Spanish safety text (7 hazards) pending human translation.
- RFI turnaround and letter-of-conformance format are contract practice, not statute (confidence derived).
- Wisconsin: SPS 361.03(15) global deletions may change which IBC 1704.6 reports must be filed with the official — confirm local practice.
