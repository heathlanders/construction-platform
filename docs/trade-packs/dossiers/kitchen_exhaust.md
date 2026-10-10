# Dossier — `kitchen_exhaust` (Commercial Kitchen Exhaust (Type I Hood / Grease Duct))

> Wave: w13 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/kitchen_exhaust.ts` · Status: draft
> Taxonomy: category `mechanical_systems` · permit_trade `mechanical` · phase `rough_in` · CSI `23 38 13`

## Scope (2–4 sentences)
Installs commercial kitchen ventilation: listed Type I (grease) and Type II (heat/steam) hoods, field-welded
liquid-tight grease duct with cleanouts, rated shaft or listed duct wrap, upblast exhaust fans on vented curbs
with hinge kits, and the makeup air unit interlocked with the exhaust. Light-tests the grease duct, balances,
and smoke-tests capture. Does NOT do the hood fire-suppression system (`fire_protection_special`), gas piping
beyond the unit connection (plumbing / gas fitter), power wiring (electrical), or roof curb flashing (roofing).

## Existing coverage reconciled
- Hand recipe: none (not in `HAND_RECIPE_KEYS`; only the generic mechanical phase recipe) → NEW-TRADE pack.
- Catalog codes already seeded: none for kitchen exhaust (`M-DUCT-*`, `M-DU-*`, `M-RTU` are general HVAC). New prefix `M-KEX-`.
- Blueprint template tasks hitting this trade: none.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| kitchen_exhaust-va-23-38-13 | VA master spec 23 38 13 Commercial-Kitchen Hoods (03-01-23) | 1 | public_domain | listing, welded seams, install level/plumb, smoke test, startup/retest |
| kitchen_exhaust-doe-zeb-kitchen | DOE ZEB Technologies: Kitchen Equipment & Design | 1 | gov_open | capture/containment, DCKV, makeup air placement |
| icc-pa | IMC 506 / 507 / 508, 401.4, 603; IFGC Ch. 4 | 3 | proprietary_ref_only | code refs (section + paraphrase) |
| nfpa-fa | NFPA 96 Ch. 5 / 7 / 8 | 3 | proprietary_ref_only | code refs |
| kitchen_exhaust-ul-710 / -ul-1978 / -ul-762 | UL 710 hoods, UL 1978 grease ducts, UL 762 restaurant exhaust fans | 3 | proprietary_ref_only | listing references |
| ecfr-1926-c/e/i/j/k/l/m/x/cc | 29 CFR 1926 subparts | 1 | public_domain | hazards |

Note: no current DoD UFGS 23 38 13 was found on WBDG; the VA master section (same CSI number) was used instead.
The fishnick.com CKV design guides no longer resolve (404) and were not cited.

## Work steps (draft → pack recipes)
Recipe `kitchen_hood_grease_duct` (title_re hood / grease duct / kitchen exhaust / Type I):
1. Check listing, shop drawings, roof openings — IMC 507, UL 710.
2. Hang hood level and plumb — IMC 507. Gate rough_in.
3. Fabricate and weld grease duct (liquid-tight, slope, cleanouts, hot work permit) — IMC 506.3 / 506.3.7 / 506.3.8. Gate rough_in.
4. Light-test before concealment — IMC 506.3.2.5. Gate duct_leakage.
5. Enclose / wrap, clearances — IMC 506.3.6, NFPA 96 Ch. 7. Gate rough_in.
6. Set upblast fan on curb with hinge kit — IMC 506.5, 506.3.13, UL 762. Gate equipment_set.
7. Balance, smoke test, interlock check — IMC 507. Gate final.

Recipe `kitchen_makeup_air` (priority 10; make-up air / MAU): set unit (equipment_set) → supply duct + diffusers
away from hood (rough_in) → gas connection test (gas_refrigerant_test, IFGC Ch. 4) → interlock + balance (final, IMC 508.1).

Recipe `grease_duct_light_test` (priority 20): prepare → pull light and mark (duct_leakage) → re-weld, retest, sign-off.

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| hot_work_fire | Welding sparks/slag fire | 1926.352(e) | 4 |
| weld_fumes | Stainless / coated steel fumes in enclosed spaces | 1926.353(c)(1) | 3 |
| weld_eye_burn | Arc radiation | 1926.102(c)(1) | 3 |
| roof_edge | Roof edge fall setting fans/MAU | 1926.501(b)(10) | 4 |
| roof_opening | Open curb hole | 1926.501(b)(4)(i) | 4 |
| struck_by_load | Hoisted hood/fan/MAU | 1926.1425(b) | 4 |
| aerial_lift | Lift basket fall | 1926.453(b)(2)(v) | 4 |
| ladder | Ladder fall | 1926.1053(b)(1) | 3 |
| sheet_metal_cut | Stainless edge cuts | 1926.95(a) | 2 |
| lockout | Unexpected fan start / shock | 1926.417(b) | 4 |
| cord_shock | Test lamp / tools in wet kitchen | 1926.404(b)(1) | 3 |
| gas_leak | MAU burner gas leak | 1926.21(b)(2) (derived) | 4 |

## QA checklist
15 items — hood listing, level/clearance, welded liquid-tight (safety), slope (safety), cleanouts, light test,
wrap per listing (safety), clearances (safety), fan listed + hinged, discharge location (safety), diffusers,
gas tested (safety), interlock (safety), airflow set, smoke test (VA 23 38 13 3.2.B).

## Inspection / acceptance checkpoints
- rough_in: hood listing/clearances, welded sloped independent duct, cleanouts.
- duct_leakage: light test witnessed before concealment.
- equipment_set: listed hinged fan + discharge; MAU on curb with intake separation.
- gas_refrigerant_test: MAU gas piping test.
- final: interlock, airflow report + smoke test, suppression tagged (by others).

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| M-KEX-HOOD-LF | Type I wall canopy hood | LF | 90000 | 1.8 | 2000 | 0 | platform-baseline, estimate |
| M-KEX-GDUCT-LF | Welded grease duct 12–16 in. | LF | 6000 | 1.5 | 800 | 10 | estimate |
| M-KEX-WRAP-LF | Listed grease duct wrap | LF | 5000 | 0.6 | 0 | 15 | estimate |
| M-KEX-UPBLAST-EA | Upblast fan + curb + hinge kit | EA | 380000 | 8 | 120000 | 0 | estimate |
| M-KEX-MAU-EA | Gas MAU ≈3,000 cfm | EA | 1200000 | 16 | 150000 | 0 | estimate |
| M-KEX-LIGHT-TEST | Light test per system | EA | 0 | 4 | 2500 | 0 | estimate |

## Quantity rules
All `const`, scoped to `building_types: ['commercial']` (seeded only when the project has kitchen_exhaust tasks):
hood 12 LF, grease duct 30 LF, upblast fan 1, MAU 1, light test 1. Wrap has no rule (depends on shaft route).

## Blueprint callouts (components)
- none this wave.

## Open questions → REVIEW_QUEUE
- IMC subsection numbers (506.3.2.5, 506.3.6, 506.3.7, 506.3.8, 506.3.13, 506.5, 508.1, 401.4) taken from 2018–2021 IMC topic lists; 2024 IMC reorganized parts of 507 — verify against the adopted edition.
- All 6 assembly costs are platform estimates.
- No public CKV design guide currently hosted (fishnick 404); consider a CEC/ENERGY STAR DCKV source later.
