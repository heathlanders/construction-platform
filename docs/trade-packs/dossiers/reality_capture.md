# Dossier — `reality_capture` (Reality Capture — Drone / Laser Scan / BIM)

> Wave: w23 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/reality_capture.ts` · Status: draft
> Taxonomy: category `services` · permit_trade `null` · phase `site_prep` · CSI `01`

## Scope (2–4 sentences)
Documents existing and in-progress conditions: Part 107 drone mapping/photo flights, terrestrial/mobile laser
scanning, registered point clouds, orthomosaics and progress photo sets, and scan-to-BIM models with a stated LOD.
Ties data to the project surveyor's control; does NOT set boundaries, control monuments or construction stakes
(surveying), and does not certify as-built locations for permits.

## Existing coverage reconciled
- Hand recipe: none → SERVICES pattern, `recipes: []` (no gates, no code_refs, no assemblies, no components, no equipment).
- Catalog codes already seeded: none.
- Blueprint template tasks hitting this trade: none.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| reality_capture-ecfr-14-107 | 14 CFR Part 107 (eCFR) | 1 | public_domain | 107.12, 107.13, 107.29, 107.39, 107.41, 107.49, 107.65 — QA + preflight checklist |
| reality_capture-faa-part107-pilot | FAA — Become a Certificated Remote Pilot | 1 | gov_open | pilot certificate QA |
| reality_capture-faa-laanc | FAA — LAANC | 1 | gov_open | airspace authorization QA |
| reality_capture-faa-oop | FAA — Operations Over People | 1 | gov_open | background (Subpart D) |
| reality_capture-bimforum-lod | BIMForum LOD Specification | 3 | association_public | LOD glossary + QA (paraphrase) |
| reality_capture-usibd-loa | USIBD LOA Specification v3.1 | 3 | proprietary_ref_only | LOA name only — no tolerances |
| ecfr-1926-c/d/e/m/o | 29 CFR 1926 Subparts C, D, E, M, O | 1 | public_domain | hazards |
| platform-baseline | expert practice | 4 | platform_estimate | flight log, control tie, dated imagery, handover formats |

## Work steps
None (services pattern — no template tasks).

## Hazards
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| struck_by_equipment | Backing equipment while setting scan/target/launch positions | 1926.602(a)(9)(ii) | 4 |
| edge_fall | Unprotected edges while scanning | 1926.501(b)(1) | 4 |
| floor_holes | Openings / unsecured covers | 1926.501(b)(4)(i) | 3 |
| laser_exposure | Scanner / laser aimed at workers | 1926.54(g) | 2 |
| drone_over_crews | Drone lost link/battery over crews | 1926.21(b)(2) (+ 14 CFR 107.39/107.49) | 3 |
| falling_objects | Overhead work | 1926.100(a) | 3 |

## QA checklist (deliverables)
pilot_cert, airspace_auth, flight_log, control_tie, registration_report, stated_accuracy, dated_imagery, model_lod, handover.

## Inspection / acceptance checkpoints
- preflight (14 CFR 107.12/.13/.41/.49/.39)
- control_and_accuracy (surveyor control, held-out check points, LOA)
- data_handover (readme, LOD per category, logs)

## Cost basis
None (services — no assemblies this wave).

## Open questions → REVIEW_QUEUE
- source_doubt: USIBD LOA is paid — QA cites level names only; confirm acceptable.
- source_doubt: BIMForum LOD treated as association_public (free download, copyrighted); bimforum.org 403s bare HEAD.
- scope: no 1926 drone standard; drone-over-crews hazard anchored to 1926.21(b)(2) general training.
