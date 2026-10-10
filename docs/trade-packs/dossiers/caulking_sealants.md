# Dossier — `caulking_sealants` (Caulking / Joint Sealants)

> Wave: w09 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/caulking_sealants.ts` · Status: draft
> Taxonomy: category `envelope` · permit_trade `null` · phase `finishes_exterior` · CSI `07 92`

## Scope (2–4 sentences)
Seals movement joints: exterior perimeter joints at window, door, louver and penetration frames; expansion and
control joints in masonry, concrete and panel cladding; interior wet-area and finish joints. Covers joint
survey, cleaning, priming, backer rod / bond breaker, gunning, tooling, cure protection, field adhesion
testing, and cut-out + reseal of failed sealant. Does NOT cover firestop sealants (`firestopping`), flatwork
joint sealing (`concrete_flatwork`, B-CFW-JOINTSEAL-LF), asphalt crack seal (`asphalt_paving`), or flashing.
PCB/asbestos-bearing old sealant goes to `abatement`.

## Existing coverage reconciled
- Hand recipe: none → NEW-TRADE pattern (2 recipes), no gates/code refs (permit_trade null).
- Catalog codes already seeded: B-CFW-JOINTSEAL-LF, B-ASP-CRACKSEAL-LF (other trades — not redeclared, not re-seeded).
  Window flashing B-WIN-FLASH-EA already includes flange/interior sealant → perimeter-sealant rule scoped to
  commercial / MF / industrial only.
- Blueprint template tasks hitting this trade: none.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| caulking_sealants-ufgs-07-92-00 | UFGS 07 92 00 Joint Sealants (Aug 2023) | 1 | public_domain | steps, QA, checklists |
| caulking_sealants-tremco-adhesion | Tremco — field adhesion test | 5 | manufacturer_public | pull-test procedure + rate |
| caulking_sealants-swri | SWRI technical resources / glossary | 4 | association_public | terminology |
| caulking_sealants-astm-c1193 | ASTM C1193 | 3 | proprietary_ref_only | joint design concept (ref) |
| caulking_sealants-astm-c1521 | ASTM C1521 | 3 | proprietary_ref_only | adhesion test method (ref) |
| ecfr-1926-d/e/f/l/m/x/z | 29 CFR 1926 | 1 | public_domain | hazards |
| platform-baseline | — | — | platform_estimate | costs |

## Work steps (draft → pack recipes)
`joint_sealant_install` (title_re `caulk|sealants?|joint seal|backer rod`):
1. Survey joints + weather (40–90 °F, not in lieu of flashing) — UFGS 1.5, 3.4.1, 3.4.2.
2. Clean, mask, prime — UFGS 3.2, 3.4.3, 3.4.5.
3. Backer rod / bond breaker (no three-sided adhesion) — UFGS 3.4.4, 3.4.6.
4. Gun + tool, pull tape ≤10 min — UFGS 3.3, 3.4.7.
5. Protect cure + clean — UFGS 3.5.
6. Field adhesion pull test — UFGS 3.1, Tremco rate, C1521 Method A (ref).

`sealant_cut_out_reseal` (priority 10; remove/replace/re-seal): PCB/asbestos check → cut out → prep/rod/seal → pull-test.

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| ladder | ladder fall | 1926.1053(b)(1) | 3 |
| scaffold_fall | scaffold / swing stage fall | 1926.451(g)(1) | 4 |
| aerial_lift | boom basket | 1926.453(b)(2)(v) | 4 |
| falling_objects | struck below | 1926.501(c) | 3 |
| hazcom | sealant/primer/isocyanate contact | 1926.59 | 2 |
| solvent_vapor | vapors | 1926.57(a) | 3 |
| solvent_fire | flammable solvents/rags | 1926.152(a)(1) | 3 |
| eye_splash | splash/chips | 1926.102(a)(1) | 2 |
| knife_cut | knife cuts | 1926.95(a) | 2 |
| silica_grind | grinding masonry faces | 1926.1153(c)(1) | 3 |
| pcb_legacy | PCB/asbestos in old sealant | 1926.1101(k)(1) | 4 |

## QA checklist
15 items — see pack (`not_in_lieu_of_flashing`, `temp_window`, `joint_ratio`, `faces_clean_dry`,
`primer_where_required`, `rod_sized_depth`, `no_three_sided`, `compatible_product`, `full_fill_tooled`,
`tape_pulled`, `clean_no_smears`, `adhesion_test_rate`, `adhesion_failures_fixed`, `old_fully_removed`,
`old_sealant_tested` (safety)).

## Inspection / acceptance checkpoints
- `joint_prep_check`: ratio/tolerance, flashing first, faces + primer, rod/bond breaker, approved products.
- `adhesion_test`: after cure at rate, logged, failures fixed + neighbors tested, cuts patched.
- `final_walkthrough`: all joints sealed, beads tooled, no smears, report turned over.

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| G-SEAL-EXT-PERIM-LF | perimeter sealant ½ in. + rod | LF | 110 | 0.035 | 0 | 10 | platform-baseline estimate |
| G-SEAL-JOINT-WIDE-LF | ¾–1 in. expansion/control joint | LF | 280 | 0.06 | 5 | 10 | platform-baseline estimate |
| G-SEAL-REMOVE-LF | cut out old sealant | LF | 0 | 0.04 | 10 | 0 | platform-baseline estimate |
| G-SEAL-ADHTEST-EA | adhesion pull test + patch | EA | 100 | 0.4 | 0 | 0 | platform-baseline estimate |

## Quantity rules
- `G-SEAL-EXT-PERIM-LF` = windows × 16 (commercial/MF/industrial).
- `G-SEAL-EXT-PERIM-LF` = doors × 5 (≈25% exterior × 20 LF; commercial/MF/industrial).
- `G-SEAL-ADHTEST-EA` = const 8 (commercial/industrial).

## Blueprint callouts (components)
- none this wave.

## Open questions → REVIEW_QUEUE
- All four G-SEAL costs are platform estimates.
- Safety ES pending: 11 hazards + 1 QA.
- Vocab: no swing-stage / suspended-scaffold equipment type exists — high-rise sealant work would want one.
- Scope: interior caulking quantities left to painting / finish carpentry (they already price caulk).
