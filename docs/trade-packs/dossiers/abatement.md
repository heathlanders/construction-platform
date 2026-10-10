# Dossier — `abatement` (Abatement (Asbestos / Lead / Mold))

> Wave: w05 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/abatement.ts` · Status: draft
> Taxonomy: category `specialty` · permit_trade `building` · phase `site_prep` · CSI `02 80`

## Scope (2–4 sentences)
Removes or controls regulated hazardous building materials ahead of or during renovation/demolition:
asbestos (pipe/thermal system insulation, floor tile and mastic, textured ceilings), lead-based paint
**abatement** (40 CFR 745 Subpart L — permanent hazard elimination by a certified abatement firm, as
opposed to RRP renovation under Subpart E, which stays with painting/remodeling), and mold remediation.
Hand-offs: the repair of the water source (plumbing/roofing/waterproofing), the rebuild of drywall and
finishes, and structural demolition (demolition trade) are not this trade.

Clearance is governed by OSHA/EPA and state health/environmental agencies (WI DHS, WI DNR), **not the
building AHJ** — so recipes carry **no gating inspections and no code refs**. Hold points are
`inspection_checklists` under descriptive keys: `asbestos_survey`, `containment_check`,
`clearance_air_test`, `lead_clearance_dust_wipe`, `mold_post_remediation`. `final` was considered and
rejected (the AHJ final does not certify abatement clearance).

## Existing coverage reconciled
- Hand recipe: none → NEW-TRADE pattern, 3 recipes with `example_title`.
- Catalog codes already seeded: none with `B-ABT-`. Related existing: `G-SITE-DEMO-SF`, `G-DEMO-SF` (demolition — not abatement).
- Blueprint template tasks hitting this trade: none.
- Sibling packs already mention asbestos/lead as hazards (flooring_resilient, siding, windows, painting RRP); this pack is the specialist scope they hand off to.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| ecfr-1926-z | 29 CFR 1926 Subpart Z (1926.1101 asbestos) | 1 | public_domain | classes I–IV, PEL 0.1 f/cc / 1 f/cc excursion (c), regulated areas (e), exposure assessment + daily monitoring (f), prohibitions (g)(3), NPE −0.02 in. w.c., 4 ACH, smoke test each shift, GFCI/deactivated circuits (g)(5)(i), respirators (h), decon (j), owner duties (k)(2), waste bags (l)(2) |
| ecfr-1926-d | 29 CFR 1926 Subpart D (1926.62 lead, 1926.59 HazCom) | 1 | public_domain | lead PEL 50 µg/m³ (c), trigger-task protection (d)(2), hygiene (i); SDS/HazCom |
| ecfr-1926-e | Subpart E (1926.103) | 1 | public_domain | respirators for mold work |
| ecfr-1926-k / ecfr-1926-x | Subparts K, X | 1 | public_domain | GFCI; ladder footing |
| abatement-ecfr-40-61m | 40 CFR 61 Subpart M (asbestos NESHAP) | 1 | public_domain | 61.145 survey, notice ≥10 working days at 260 LF / 160 SF / 35 CF RACM or any demolition, adequately wet; 61.150 labeled leak-tight containers, marked vehicles, waste shipment records |
| abatement-ecfr-40-745l | 40 CFR 745 Subpart L | 1 | public_domain | 745.226 certification; 745.227(e) certified supervisor, 5-business-day EPA notice, occupant protection plan, prohibited practices (open flame, uncontrolled machine sanding/blasting, heat gun ≥1100 °F), post-abatement clearance by certified inspector/risk assessor ≥1 h after cleanup, abatement report (e)(10) |
| painting-ecfr-40-745e | 40 CFR 745 Subpart E (RRP) — reused | 1 | public_domain | the renovation-vs-abatement distinction (not cited in pack data) |
| abatement-epa-asbestos-neshap / abatement-epa-lead-abatement | EPA program pages | 1 | gov_open | context |
| abatement-epa-mold-commercial / abatement-epa-mold-home | EPA mold guidance | 1 | gov_open | fix moisture first, dry 24–48 h, >~10 SF → commercial guide, remove porous materials, completion criteria |
| abatement-wi-dhs159 | Wis. Admin. Code DHS 159 | 1 | gov_open | company/individual certification; 159.20 DHS notification before set-up (residential <5 units: >1 bag or >3 SF/LF friable repair), fee tier at 2 working days; 159.19(7) 3-year records incl. project logs, occupant protection plans |
| abatement-wi-dhs163 | Wis. Admin. Code DHS 163 | 1 | gov_open | 163.13(7) firm verifies certs; 163.14(1) abatement by certified supervisor/workers; 163.14(2) notice ≥2 working days before start |
| abatement-wi-dhs-asbestos / abatement-wi-dhs-lead | WI DHS program pages | 1 | gov_open | certification/notification programs |
| abatement-wi-dnr-asbestos / abatement-wi-nr447 | WI DNR asbestos page / NR 447 | 1 | gov_open | DNR is EPA's NESHAP delegate in WI; ARDN notification system |
| platform-baseline | — | — | platform_estimate | all costs |

## Work steps (draft → pack recipes)
1. **asbestos_abatement** (`asbestos|ACM|TSI|popcorn ceiling|acoustic ceiling texture|vermiculite`) — confirm survey/notices/certs → regulated area + containment (NPE, manometer, smoke test, GFCI) → wet removal (no dry sweep / compressed air / unshrouded saw), daily monitoring → bag/label/manifest → final clean + independent clearance air test.
2. **lead_paint_abatement** (`lead(-based) paint|lead abatement|lead hazard reduction|LBP`) — confirm abatement vs RRP, inspection, occupant protection plan, notice → contain + protect occupants → remove/replace/enclose/encapsulate (prohibited practices) → clean + dust-wipe clearance by certified inspector/risk assessor.
3. **mold_remediation** (`mold|mould|microbial|fungal`) — fix moisture → contain + negative air (scaled) → remove porous / clean hard surfaces → dry + verify.

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| asbestos_inhalation | fiber inhalation | 1926.1101(c) | 4 |
| asbestos_prohibited_methods | dry sweep / air / abrasive saw | 1926.1101(g)(3) | 4 |
| npe_failure | containment loses negative pressure | 1926.1101(g)(5)(i) | 4 |
| decon_takehome | take-home contamination | 1926.1101(j) | 3 |
| respirator_fit | wrong/unfitted respirator | 1926.1101(h) | 4 |
| lead_exposure | lead dust/fume | 1926.62(c) | 4 |
| lead_trigger_tasks | torch/blast/power-tool lead tasks | 1926.62(d)(2) | 4 |
| lead_hygiene | ingestion | 1926.62(i) | 3 |
| mold_spores | spore inhalation | 1926.103 | 3 |
| chemical_products | strippers/encapsulants/biocides | 1926.59 | 3 |
| electric_shock_wet | wet containment shock | 1926.404(b)(1) | 4 |
| ladder_fall | ladders on poly | 1926.1053(b)(6) | 3 |

## QA checklist
15 items — survey before disturbance, notices filed, certs/fit tests, regulated area posted, containment
negative + manometer log, occupant protection, kept wet, daily exposure monitoring, lead prohibited
methods, waste labeled + manifested, moisture source fixed, porous materials removed, dry before rebuild,
independent clearance, records kept (WI 3 years). 10 marked `safety: true` (ES pending).

## Inspection / acceptance checkpoints
- `asbestos_survey`: inspector survey + lab results; owner disclosure (1926.1101(k)(2)); notices (61.145(b), DHS 159.20, NR 447/ARDN).
- `containment_check`: regulated area, NPE smoke test + manometer log, decon unit, circuits.
- `clearance_air_test`: independent visual + air samples with barriers up; waste shipment records (61.150(d)).
- `lead_clearance_dust_wipe`: visual + dust wipes ≥1 h after cleanup (745.227(e)(8)); abatement report (e)(10).
- `mold_post_remediation`: moisture fixed, dry, no visible mold/odor, assessor if contracted.

## Cost basis
All `platform-baseline` / `estimate` (no public unit-cost source).
| Code | Item | Unit | Mat ¢ | Labor hr | Equip ¢ | Waste % |
|---|---|---|---|---|---|---|
| B-ABT-SURVEY-EA | asbestos survey, SF home | EA | 25000 | 5 | 0 | 0 |
| B-ABT-PIPE-LF | TSI pipe insulation removal | LF | 900 | 0.35 | 300 | 10 |
| B-ABT-FLOOR-SF | floor tile + mastic removal | SF | 175 | 0.05 | 50 | 5 |
| B-ABT-CEIL-SF | popcorn ceiling removal in NPE | SF | 125 | 0.045 | 50 | 10 |
| B-ABT-LEAD-SF | lead paint abatement | SF | 250 | 0.12 | 75 | 10 |
| B-ABT-MOLD-SF | mold remediation | SF | 250 | 0.15 | 150 | 10 |
Disposal is folded into material. Clearance air test and containment setup were left out to stay within
the 6-assembly cap (REVIEW_QUEUE).

## Quantity rules
None (per wave note — no blueprint fact reliably signals hazardous materials).

## Blueprint callouts (components)
None this wave.

## Open questions → REVIEW_QUEUE
- Family `building` equipment rules attach excavator/skid_steer/compactor/dump_truck to every site_prep task — wrong for interior abatement.
- Vocab: `negative_air_machine` / `hepa_air_scrubber`, `dehumidifier` not in equipment vocab.
- Assemblies not added (cap): `B-ABT-CLEAR-EA` clearance air test, `B-ABT-CONTAIN-EA` containment setup.
- Dust-lead hazard/clearance levels changed 2026-01-12 in 40 CFR 745 — pack deliberately states no numbers; a reviewer should confirm WI DHS 163.15 adoption.
