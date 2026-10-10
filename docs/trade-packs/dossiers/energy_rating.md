# Dossier — `energy_rating` (Energy Rating (HERS / Blower Door))

> Wave: w21 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/energy_rating.ts` · Status: draft
> Taxonomy: category `services` · permit_trade `null` · phase `commissioning` · CSI `01 91`

## Scope (2–4 sentences)
Independent energy rater for new homes: design/plan review, pre-drywall thermal enclosure inspection,
final blower door (ACH50) and duct leakage (CFM25) tests, ventilation airflow measurement, HERS Index
rating, ENERGY STAR checklists and the signed test report the building official asks for. Does NOT do
air sealing, insulation or duct sealing (insulation / air_barrier / ductwork / hvac trades) and does not
perform HVAC commissioning itself (contractor fills the ENERGY STAR HVAC commissioning checklist).

## Existing coverage reconciled
- Hand recipe: none → pack is the only source (services pattern).
- Catalog codes already seeded: none; services → no assemblies.
- Blueprint template tasks hitting this trade: none (0). `grep -iE 'blower|HERS|energy|leakage|air.?seal'`
  over `lib/blueprint-templates/*.ts` → no titles. The recipe fires only on energy_rating tasks.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| energy_rating-wi-sps322 | WI SPS 322 — UDC Energy Conservation (Register Nov 2024) | 1 | gov_open | test setup, < 7 ACH50 testing option, visual option, sealing list, duct sealing, insulation certificate |
| energy_rating-es-rater-field | ENERGY STAR National Rater Field Checklist Rev. 14 | 1 | gov_open | pre-drywall + final inspections, ACH50 (4.2), duct leakage (6.4/6.5), ventilation (7.1), photo rule |
| energy_rating-es-rater-design | ENERGY STAR National Rater Design Review Checklist Rev. 14 | 1 | gov_open | design review QA |
| energy_rating-es-hvac-cx | ENERGY STAR National HVAC Commissioning Checklist Rev. 14 | 1 | gov_open | HVAC checklist collected before certification |
| energy_rating-basc-es-v331 | BASC — ENERGY STAR v3.1 checklists | 1 | gov_open | air sealing / alignment guides |
| energy_rating-resnet-380 | ANSI/RESNET/ICC 380 (ref only) | 3 | proprietary_ref_only | named test standard |
| resnet-301 (existing) | ANSI/RESNET/ICC 301 (ref only) | 3 | proprietary_ref_only | insulation grading |
| energy_rating-resnet-hers | RESNET — HERS Index and Energy Codes | 4 | association_public | HERS Index deliverable |
| ecfr-1926-c/d/e/i/k/m/x | 29 CFR 1926 subparts | 1 | public_domain | hazards |

IECC R402.4.1.2 (air leakage testing) and R403.3.5 (duct testing) — prose only per wave rule; not stored as code_refs.

## Work steps (draft → pack recipes)
Recipe `blower_door_duct_testing` (example title "Blower door & duct leakage testing / HERS rating"):
1. Confirm the house is test-ready — after all penetrations (SPS 322.37(6)(a)).
2. Set up the house for the blower door — SPS 322.37(6)(a)1–7 setup.
3. Run the blower door test — CFM50 → ACH50; compare to code/program limit.
4. Run the duct leakage test — total + to outdoors at 25 Pa.
5. Return the house to normal and check combustion appliances.
6. Issue the test report and rating.

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| ladder_attic_access | ladder falls at attic hatch | 1926.1053(b)(1) | 3 |
| attic_joist_fall | falling through ceiling between joists | 1926.501(b)(4)(i) (nearest — holes) | 3 |
| attic_heat | heat illness in attics | 1926.21(b)(2) (training; no 1926 heat std) | 3 |
| caz_backdraft | CO/flue gas from depressurizing with appliances on | 1926.55(a) | 4 |
| fan_rotating_parts | fan blades | 1926.300(b)(2) | 2 |
| attic_wiring | shock from attic wiring | 1926.416(a)(1) | 3 |
| insulation_fibers | eye/lung irritation | 1926.102(a)(1) | 1 |

## QA checklist (deliverables)
Design review · pre-drywall enclosure inspection · test timing · test setup · ACH50 result + photo ·
duct leakage result · house restored (safety) · report to official + insulation certificate · HERS
certificate + ENERGY STAR HVAC checklist · ventilation airflow.

## Inspection / acceptance checkpoints
- `pre_drywall_enclosure`: insulation contact/alignment, no air-permeable sealing, joint/penetration sealing, IC recessed lights + fan housings, duct sealing.
- `final_testing`: ACH50 recorded within limit, duct results, insulation certificate, signed report.

## Cost basis
None — services trade (no assemblies).

## Quantity rules
None.

## Blueprint callouts (components)
None.

## Open questions → REVIEW_QUEUE
- es_safety: 7 hazards + 1 QA (`qa_house_restored`) pending human Spanish.
- source_doubt: HERS Index scale wording (reference home = 100) — RESNET page redirected to "HERS Index and Energy Codes"; scale kept out of pack text, confirm.
- source_doubt: attic heat has no 1926 standard — 1926.21(b)(2) used as nearest; falling through ceilings mapped to 1926.501(b)(4)(i).
- scope: no template task uses `energy_rating`; consider adding a residential template task "Blower door & duct leakage testing / HERS rating" in the commissioning phase.
