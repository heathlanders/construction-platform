# Dossier — `industrial_coatings` (Industrial Coatings / Abrasive Blasting)

> Wave: w18 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/industrial_coatings.ts` · Status: draft
> Taxonomy: category `specialty` · permit_trade `null` · phase `finishes_exterior` · CSI `09 96`

## Scope
Protective (high-performance) coatings on steel structures, tanks, vessels and process equipment: abrasive
blasting, surface contamination testing, stripe coats, zinc/epoxy/urethane systems, tank linings, QC by DFT
and holiday testing, and removal of old lead-containing coatings from steel inside containment. NOT
architectural paint (`painting`, G-PAINT-*), resinous floors (`flooring_epoxy`, G-EPX-*), or lead abatement in
housing/child-occupied facilities under 40 CFR 745 (`abatement`). Shop priming is the fabricator's.

## Existing coverage reconciled
- Hand recipe: none (painting has its own nopermit recipe) → NEW-TRADE pack, 3 recipes.
- Catalog codes already seeded: none for this trade; G-PAINT-*, G-EPX-* (incl. G-EPX-SHOTBLAST-SF) left alone.
- Blueprint template tasks hitting this trade: none.
- Permit family null → no gates, no code_refs; hold points in `inspection_checklists`.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| industrial_coatings-ufgs-09-97-13-27 | UFGS 09 97 13.27 High Performance Coating for Steel Structures | 1 | public_domain | steps, QA (dew point, salts, profile, DFT, stripe, recoat, repair) |
| industrial_coatings-ufgs-09-97-13-17 | UFGS 09 97 13.17 Three Coat Epoxy — Interior of Steel Fuel Tanks | 1 | public_domain | tank recipe (dehumidification, LEL, stripe 1.5 in., holiday test, 14-day cure) |
| industrial_coatings-osha-3697 | OSHA 3697 Abrasive Blasting fact sheet | 1 | public_domain | hazards (dust, abrasives, noise, hygiene) |
| industrial_coatings-osha-3142 | OSHA 3142 Lead in Construction | 1 | public_domain | lead hazards / hygiene |
| industrial_coatings-carbozinc-11-pds | Carbozinc 11 PDS | 5 | manufacturer_public | above-dew-point, humidity cure, agitation, loose zinc, tank ventilation |
| industrial_coatings-ampp-sspc | AMPP/SSPC standards | 3 | proprietary_ref_only | designations by name only (SP 10, PA 2, SP0188) |
| ecfr-1926-{c,d,e,f,i,k,l,m,z,aa} | 29 CFR 1926 subparts | 1 | public_domain | osha refs (1926.57(f), 1926.62, 1926.1153(d)(3)(ii), 1926.302(b), 1926.1204 …) |

## Work steps (→ pack recipes)
- `blast_and_coat_steel` (6): containment + weather → clean/salts/blast → profile/clean → stripe + primer → intermediate/topcoat in recoat window → inspect/repair/turnover.
- `tank_lining` (4, priority 1): permit space + ventilation/dehumidification → blast + salts → stripe + lining coats → holiday test, repair, cure before service.
- `lead_coating_removal` (4, priority 2): metals test + lead program → ventilated containment → removal + waste → prep and recoat.

## Hazards
12: blast silica/metal dust (1926.1153(d)(3)(ii)), lead (1926.62(d)(2)(iv)), abrasive rebound (1926.57(f)(5)(v)),
hose whip (1926.302(b)(7)), breathing air (1926.57(f)(6)), confined space (1926.1204), solvent fire (1926.152(a)(1)),
airless injection (1926.302(b)(8)), coating chemicals (1926.59), noise (1926.52(d)(1)), falls (1926.501(b)(1)),
electrical cords (1926.404(b)(1)(ii)).

## QA checklist
15 items (4 safety: containment, entry permit, lead assessment, hygiene).

## Inspection / acceptance checkpoints
`coating_preconstruction`, `surface_prep_verification`, `dft_readings`, `holiday_test`, `final_acceptance`.

## Cost basis (all platform-baseline estimates)
| Code | Unit | Mat ¢ | Labor hr | Equip ¢ | Waste % |
|---|---|---|---|---|---|
| G-COAT-BLAST-SP10-SF | SF | 45 | 0.03 | 60 | 0 |
| G-COAT-IOZ-PRIMER-SF | SF | 55 | 0.008 | 10 | 25 |
| G-COAT-3COAT-STEEL-SF | SF | 140 | 0.024 | 25 | 25 |
| G-COAT-TANK-LINING-SF | SF | 260 | 0.07 | 180 | 15 |
| G-COAT-CONTAIN-EA | EA | 180000 | 40 | 250000 | 10 |
| G-COAT-QC-TEST-EA | EA | 15000 | 8 | 10000 | 0 |

## Quantity rules (industrial only)
- G-COAT-BLAST-SP10-SF and G-COAT-3COAT-STEEL-SF = area_sf_sum × 0.5 (field-coated steel surface guess).
- G-COAT-QC-TEST-EA = area_sf_sum × 0.00025 (one work area per ~2,000 SF of steel).

## Blueprint callouts
None this wave.

## Open questions → REVIEW_QUEUE
- All costs are estimates; 0.5 SF steel/SF floor ratio is a rough guess.
- 12 hazards + 4 QA items need human ES translation.
- Carbozinc PDS is a regional (StonCor Africa) copy with metric ISO prep wording; consider a US PDS.
- Vocab: no `dust_collector` / `dehumidifier` equipment type (proposed).
