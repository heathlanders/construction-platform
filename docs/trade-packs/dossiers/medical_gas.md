# Dossier — `medical_gas` (Medical Gas)

> Wave: w13 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/medical_gas.ts` · Status: draft
> Taxonomy: category `plumbing_systems` · permit_trade `plumbing` · phase `rough_in` · CSI `22 62`

## Scope (2–4 sentences)
Piped medical gas and vacuum systems (oxygen, nitrous oxide, medical/dental air, nitrogen, medical-surgical
and dental vacuum, WAGD) in hospitals, surgery centers, clinics and dental offices: oxygen-clean copper
brazed under nitrogen, zone valve boxes, station outlets/inlets, area alarms, installer testing, and support
for independent ASSE 6030 verification. Source equipment (compressors, vacuum pumps, manifolds, bulk oxygen)
is usually furnished by the supplier; alarm low-voltage wiring is the electrician's; walls are closed by
drywall after the rough-in inspection.

## Existing coverage reconciled
- Hand recipe: none (plumbing family recipe is phase-keyed DWV/water) → NEW-TRADE pack, recipes with `title_re`.
- Catalog codes already seeded: none `P-MG-*`.
- Blueprint template tasks hitting this trade: none.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| medical_gas-ufgs-22-60-70 | UFGS 22 60 70 Gas and Vacuum Systems for Healthcare Facilities (May 2020) | 1 | public_domain | steps, QA, test sequence, labeling, qualifications |
| medical_gas-nfpa-99 + nfpa-fa | NFPA 99 Ch. 5 | 3 | proprietary_ref_only | code refs 5.1, 5.1.9–5.1.12 (section numbers only) |
| medical_gas-asse-6000 | ASSE/IAPMO/ANSI Series 6000 (6010/6020/6030) | 4 | proprietary_ref_only | installer/verifier qualification |
| icc-pa | IPC 1202 Medical gases; IFC 5306 Medical gas systems | 3 | proprietary_ref_only | code refs |
| ecfr-1926-j / -e / -x / -l / -z / -aa | 29 CFR 1926 J, E, X, L, Z, AA | 1 | public_domain | hazards (1926.350(a)(9),(a)(10),(i); 352(a); 353(c)(1); 102(a)(1),(c)(1); 1053(b)(1); 453(b)(2)(v); 1153(c)(1); 1203(a)) |
| platform-baseline | Platform estimate | — | platform_estimate | all assembly costs |

## Work steps (draft → pack recipes)
Recipe `medgas_rough_in` (title_re: med gas / oxygen piping / vacuum piping / nitrous / WAGD / dental air|vac):
1. **Confirm certified crew and brazer qualification** — ASSE 6010; brazer joints witnessed. Code: IPC 1202, NFPA 99 5.1. QA: installers_certified, brazers_qualified.
2. **Receive and protect oxygen-clean tube and fittings** — capped, bagged, no oil. QA: oxygen_clean_material, ends_capped.
3. **Braze joints under a nitrogen purge** — BCuP filler, oxygen-rated sealant male threads only. Code: NFPA 99 5.1.10. QA: nitrogen_purge_brazing, joint_fill.
4. **Hang, sleeve and label the piping** — full-size branches, bushings at metal studs, color labels. Code: 5.1.11.
5. **Set zone valve boxes and outlet rough-ins** — corridor side. Gate: rough_in.
6. **Run the installer tests** — blow-down, initial pressure, cross-connection, purge, standing pressure/vacuum with oil-free nitrogen. Gate: gas_test. Code: 5.1.12.

Recipe `medgas_trim_verify` (priority 1; zone valve / area-master alarm / med gas trim|verif|certif|final / 6030):
1. **Trim outlets and label zone valves** — gas-specific connectors, caution sign.
2. **Connect and test the alarms** — Code 5.1.9.
3. **Independent verification and certification** — ASSE 6030 verifier tests; no patient use before certification. Gate: final. Code: 5.1.12, IFC 5306.

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| brazing_fire | Torch fire in walls/ceilings, occupied building | 1926.352(a) | 4 |
| oxygen_oil | Oxygen + oil/grease ignition | 1926.350(i) | 4 |
| oxygen_enriched | Oxygen-enriched area during tie-in/verification | 1926.350(i) | 4 |
| nitrogen_asphyxia | Purge/test nitrogen displacing oxygen in small spaces | 1926.1203(a) | 4 |
| cylinder_handling | Cylinder falling / valve breaking | 1926.350(a)(9) | 3 |
| cylinder_storage | Oxygen stored with fuel gas | 1926.350(a)(10) | 3 |
| brazing_fumes | Zinc-bearing (brass) fume in enclosed rooms | 1926.353(c)(1) | 2 |
| radiant_eye | Torch glare | 1926.102(c)(1) | 2 |
| test_pressure | Cap blow-off under test | 1926.102(a)(1) | 3 |
| ladder | Ladder fall | 1926.1053(b)(1) | 3 |
| aerial_lift | Lift fall | 1926.453(b)(2)(v) | 3 |
| silica_coring | Coring slabs for risers | 1926.1153(c)(1) | 2 |

## QA checklist
15 items (installers/brazers certified, oxygen-clean material, capped ends, nitrogen purge, joint fill,
supports/bushings, labels, zone valve location, installer tests recorded, cross-connection, gas-specific
outlets, alarms tested, purity/particulate, verifier certification) — all from UFGS 22 60 70 Part 1.4 / Part 3.

## Inspection / acceptance checkpoints
- rough_in: certificates on site; oxygen-clean brazed piping exposed and capped; supports/labels.
- gas_test: installer test reports; standing test gauge holding.
- final: valves/outlets/alarms labeled and working; ASSE 6030 certification on file.

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| P-MG-PIPE-LF | Oxygen-clean Type L copper 1/2–3/4 in., brazed, hangers, labels | LF | 1100 | 0.3 | 50 | 10 | platform estimate |
| P-MG-OUTLET-EA | Station outlet / vacuum inlet, rough + finish | EA | 22000 | 2.0 | 0 | 0 | platform estimate |
| P-MG-ZVB-EA | Zone valve box, 3 services | EA | 120000 | 5.0 | 0 | 0 | platform estimate |
| P-MG-ALARM-EA | Area alarm panel + sensors | EA | 150000 | 4.0 | 0 | 0 | platform estimate |
| P-MG-VERIFY-EA | ASSE 6030 verification allowance, small facility | EA | 350000 | 6.0 | 0 | 0 | platform estimate |

## Quantity rules
- `P-MG-VERIFY-EA` = const 1 (commercial/industrial) — one verification per facility.
- `P-MG-ZVB-EA` = const 1 (commercial) — placeholder until zones counted.
- `P-MG-ALARM-EA` = const 1 (commercial) — placeholder until zones counted.
No blueprint fixture/component tokens exist for medical gas outlets, so outlet and LF quantities are left to the estimator.

## Blueprint callouts (components)
- none this wave.

## Open questions → REVIEW_QUEUE
- NFPA 99 subsection numbers 5.1.9 / 5.1.10 / 5.1.11 / 5.1.12 cited from memory of the 2021 edition — confirm against free-access text.
- All five assembly costs are platform estimates.
- Safety ES pending human translation: 12 hazards, 11 QA items, plus pending inspection-checklist items.
