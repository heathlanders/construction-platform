# Dossier — `ductwork` (Sheet Metal Ductwork)

> Wave: w02 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/ductwork.ts` · Status: draft
> Taxonomy: category `mechanical_systems` · permit_trade `mechanical` · phase `rough_in` · CSI `23 31`

## Scope (2–4 sentences)
Fabricates and installs the air distribution system: plenums, sheet-metal trunks and risers, flex/rigid
branches, boots, central returns, balancing and fire dampers; seals all joints, insulates ducts outside
conditioned space and supports the duct leakage test. Equipment setting, refrigerant line sets, gas
connections and startup hand off to `hvac` / `gas_piping`; TAB report to `test_balance`; duct
insulation on commercial jobs may go to `mechanical_insulation`.

## Existing coverage reconciled
- Hand recipe: none of its own — only the generic phase recipe in `task-buildout/mechanical.ts` → pack is
  NEW-TRADE (3 recipes); family code map (`code-refs.ts` mechanical: Ch. 6 / Ch. 3 / IECC 403 / Ch. 5) stays and
  the pack adds sections.
- Catalog codes already seeded: `M-DUCT-LF`, `M-DUCT-RUN`, `M-DUCT-INSUL-LF`, `M-REGISTER` (hand-seeded rooms×2) —
  referenced, not redeclared. Pack quantifies `M-DUCT-RUN` = rooms × 2 (not hand-seeded).
- Blueprint template tasks hitting this trade: none (duct template tasks are tagged `hvac`); recipes match
  "HVAC ductwork rough-in" / "HVAC ductwork distribution — all floors" titles if retagged.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| ductwork-ufgs-23-30-00 | UFGS 23 30 00 HVAC Air Distribution (Feb 2025) | 1 | public_domain | supports (§3.2.5), flex install (§3.2.4), fire dampers, Seal Class A |
| ductwork-doe-job-aid-19-1 | DOE Job Aid 19-1 Seal Ducts With Mastic | 1 | gov_open | mastic/mesh methods, cabinet + filter slot |
| ductwork-basc-seal-insulate | BASC Measure Guideline — Sealing and Insulating Ducts | 1 | gov_open | background |
| energy-star-rater-checklist | ENERGY STAR National Rater Field Checklist Rev 12 §6 | 1 | gov_open | flex install, R-6, return paths, leakage targets, boots |
| ductwork-smacna-dcs | SMACNA HVAC-DCS Metal & Flexible 4th ed. | 4 | proprietary_ref_only | hanger spacing concept (no values stored) |
| icc-pa | IMC 603/603.6/603.9/603.10/604/607/607.4; IRC M1601/M1601.4/M1601.4.1/M1602; IECC R403.3 | 3 | ref only | code refs |
| ecfr-1926-c/d/e/i/k/l/m/x | 29 CFR 1926 | 1 | public_domain | hazards |
| platform-baseline | Jobsite cost baseline | — | estimate | assemblies |

## Work steps (draft → pack recipes)
Recipes `duct_system_residential_sf` (IRC refs, prio 5), `duct_system` (IMC refs), `duct_leakage_test` (prio 10).
1. **Lay out the duct system** — QA return_path.
2. **Set plenum / hang trunk (mains, risers)** — IRC M1601/M1601.4 or IMC 603/603.10. Gate rough_in. QA supports_spacing.
3. **Run branches, connect flex + boots** — IMC 603.6. Gate rough_in. QA flex_stretched, flex_core_sealed.
4. **Seal every joint (mastic/mesh)** — IRC M1601.4.1 / IMC 603.9 + IECC R403.3. Gate duct_leakage.
5. **Insulate ducts outside conditioned space** — IMC 604 / IRC M1601.4 + IECC R403.3. Gate rough_in.
6. **Registers, balancing, fire dampers** — IMC 607 / IRC M1602. Gate final.
Leakage test: prep → pressurize 25 Pa, read CFM25 (duct_leakage) → find/fix/retest (duct_leakage) → record/restore (final).

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| sheet_metal_cut | cuts from sheet metal | 1926.95(a) | 2 |
| eye_flying | chips/shavings | 1926.102(a)(1) | 2 |
| ladder | ladder slip | 1926.1053(b)(1) | 3 |
| scaffold_fall | scaffold fall | 1926.451(g)(1) | 4 |
| aerial_lift | lift ejection | 1926.453(b)(2)(v) | 4 |
| ceiling_fall_through | fall through attic ceiling / hatch | 1926.501(b)(4)(i) | 4 |
| attic_heat | heat illness | 1926.21(b)(2) (training duty; no 1926 heat std) | 3 |
| fiberglass_irritant | duct wrap/board fibers | 1926.103 | 2 |
| powder_actuated | PAT fastener | 1926.302(e)(1) | 3 |
| falling_objects | overhead drops | 1926.100(a) | 3 |
| chem_mastic | mastic/sealants | 1926.59 | 2 |
| cord_shock | cords / tester | 1926.404(b)(1) | 3 |

## QA checklist
14 items: supports_spacing, joints_mastic, mastic_over_mesh, air_handler_sealed, flex_stretched, flex_core_sealed,
insulation_unconditioned (ENERGY STAR ≥R-6), return_path, balancing_dampers, leakage_result (ENERGY STAR rough-in
greater of 4 CFM25/100 sf CFA or 40 CFM25), boots_sealed; safety: fire_dampers, return_air_source, garage_penetration.

## Inspection / acceptance checkpoints
- rough_in: supports, listed materials, insulation, no prohibited return sources.
- duct_leakage: joints sealed, test report meets energy-code target.
- final: boots sealed, fire/smoke dampers with access + labels, balancing dampers + return paths.

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| M-DU-LEAK-TEST | leakage test / system | EA | 500 | 2.5 | 4000 | 0 | platform-baseline estimate |
| M-DU-SEAL-SYS | mastic sealing / system | EA | 7500 | 6 | 0 | 10 | estimate (~2 gal mastic + tapes) |
| M-DU-RETURN-DROP | central return drop | EA | 9000 | 3 | 0 | 10 | estimate |
| M-DU-BAL-DAMPER | branch balancing damper | EA | 1800 | 0.4 | 0 | 0 | estimate |
| M-DU-FIRE-DAMPER | 12x12 fire damper + sleeve + access | EA | 28000 | 2.5 | 0 | 0 | estimate |

## Quantity rules
- `M-DUCT-RUN` = rooms × 2 (existing assembly; mirrors hand-seeded M-REGISTER count)
- `M-DU-BAL-DAMPER` = rooms × 1
- `M-DU-SEAL-SYS`, `M-DU-LEAK-TEST`, `M-DU-RETURN-DROP` = fixture `fau` × 1
- `M-DU-FIRE-DAMPER` — no rule (count only from plans).

## Blueprint callouts (components)
- none this wave.

## Open questions → REVIEW_QUEUE
- IECC duct-testing subsection number varies by edition (R403.3.3 in 2018, R403.3.5 in 2021) — stored generic `R403.3`.
- hvac pack quantity rules use `when.facts_any: ['fau']`; `fau` is a fixture token, not a component/flag, so those rules never fire (scope).
- All 5 assembly costs are estimates.
- BASC total-duct-leakage resource-guide URLs answer 400 to scripts — not cited.
