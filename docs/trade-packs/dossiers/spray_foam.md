# Dossier — `spray_foam` (Spray Foam Insulation)

> Wave: w09 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/spray_foam.ts` · Status: draft
> Taxonomy: category `envelope` · permit_trade `building` · phase `insulation` · CSI `07 21 29`

## Scope (2–4 sentences)
Sprays two-component polyurethane foam (open-cell ~0.5 lb, closed-cell ~2 lb) into wall cavities, roof decks
(unvented attics), rim joists and crawlspace walls to insulate and air seal. Includes zone isolation and
ventilation, rig setup and ratio checks, lift-controlled application, trimming, certificate, and the ignition
barrier coating where it is the SPF contractor's scope. Does NOT include batts/blown/rigid board (`insulation`),
drywall thermal barriers (`drywall`), or SPF roofing (`roofing`).

## Existing coverage reconciled
- Hand recipe: none (not in HAND_RECIPE_KEYS). The `insulation` trade's hand recipe + pack cover generic
  insulation; this pack is NEW-TRADE pattern and only fires for tasks whose trade is `spray_foam`.
- Catalog codes already seeded: `B-INSUL-SF` (hand seeder, conditioned area), `B-INS-*` incl. `B-INS-RIM-LF`
  (insulation pack). None redeclared; no SPF rim assembly added because `B-INS-RIM-LF` already prices
  "rigid + foam or spray foam".
- Blueprint template tasks hitting this trade: none.
- Quantity rules: intentionally none — `B-INSUL-SF` is hand-seeded on conditioned area and a foam rule would
  double-count. SPF assemblies are for estimator-added lines that replace B-INSUL-SF on the same area.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| spray_foam-cpi-health-safety | CPI SPF Health and Safety Guidelines (reoccupancy/reentry) | 4 | association_public | isolation, ventilation, reentry, QA |
| spray_foam-cpi-basics | CPI SPF Insulation Basics — closed vs open cell | 4 | association_public | glossary, type selection |
| spray_foam-spfa | SPFA (certification program, ref only) | 4 | association_public | context |
| spray_foam-ecfr-1910-134 | 29 CFR 1910.134 respiratory protection | 1 | public_domain | respirator program (via 1926.103) |
| concrete_repair_lifting-epa-spf-health / -epa-spf-tips | EPA Safer Choice SPF pages (archived) | 1 | gov_open | isocyanate hazards, reentry (reused) |
| concrete_repair_lifting-niosh-96-111 / -osha-isocyanates | NIOSH 96-111; OSHA isocyanates | 1 | gov | isocyanate hazard (reused) |
| ecfr-1926-c/d/e/f/k/l/m/x/aa | 29 CFR 1926 subparts | 1 | public_domain | hazards |
| icc-pa | IRC R316, R806.5, R702.7, N1101.10; IBC 2603.4 | 3 | proprietary_ref_only | code refs (section + paraphrase only) |
| platform-baseline | expert baseline | — | platform_estimate | all costs |

## Work steps (draft → pack recipes)
Recipe `spf_cavity_and_deck` (title_re spray foam / SPF / closed-cell / open-cell / spray polyurethane):
1. **Check rough-ins and the substrate** — QA rough_ins_passed, substrate_dry_temp, type_thickness_plan.
2. **Isolate the area and set up ventilation** — QA zone_isolated, reentry_plan, masking_done.
3. **Set up the rig and check the mix** — QA test_shot_ok.
4. **Spray in controlled lifts to thickness** — QA lift_limit, thickness_min, adhesion_no_voids, boxes_flues_clear.
5. **Trim, clean up and post the certificate** — Code N1101.10.1, R316.3. Gate: insulation.
6. **Cover the foam with a thermal or ignition barrier** — Code R316.4, R316.5.3, R316.5.4. Gate: final.

Recipe `spf_rim_joist` (rim/band joist + spray/foam/SPF, priority 10): prep → spray closed-cell (R316.5.11) →
verify/label (gate insulation).

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| isocyanate_inhal | MDI mist/vapor — asthma, sensitization | 1926.103 (→1910.134) | 4 |
| ventilation_limits | vapor build-up / drift | 1926.57(a) | 3 |
| skin_eye_contact | A/B side and uncured foam contact | 1926.95(a) | 3 |
| chem_hazcom | SDS / labels | 1926.59 | 2 |
| eye_debris | trimming chips | 1926.102(a)(1) | 2 |
| foam_fire | over-thick lifts, ignition sources | 1926.151(a)(3) | 4 |
| rig_electrical | rig, hose heat, generator | 1926.404(b)(1) | 3 |
| fall_ceiling | attic fall-through | 1926.501(a)(2) | 3 |
| scaffold_fall | high walls/decks | 1926.451(g)(1) | 4 |
| ladder | ladder slip | 1926.1053(b)(1) | 3 |
| confined_attic | tight attics/crawls | 1926.1203(a) | 4 |
| heat_stress | coveralls in hot attics | 1926.21(b)(2) | 3 |

## QA checklist
15 items in the pack (6 safety → ES pending): rough-ins passed, substrate dry/temperature, type/thickness vs plan,
zone isolated*, reentry plan*, masking, test shot, lift limit*, minimum thickness, adhesion/no voids,
boxes/flues clear*, trimmed flush, certificate posted, reentry kept*, barrier covered*.

## Inspection / acceptance checkpoints
- insulation: certificate, probe thickness, continuity, product label/evaluation report (R316.3), unvented attic (R806.5).
- final: thermal barrier in living spaces (R316.4); ignition barrier in attics/crawls (R316.5.3).

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| B-SPF-CC-BF | Closed-cell SPF per board foot | BF | 60 | 0.004 | 6 | 10 | platform-baseline, estimate |
| B-SPF-OC-SF | Open-cell SPF ~5.5 in per SF | SF | 85 | 0.008 | 5 | 15 | platform-baseline, estimate |
| B-SPF-IGN-COAT-SF | Intumescent ignition-barrier coating | SF | 45 | 0.005 | 2 | 10 | platform-baseline, estimate |
| B-SPF-PREP-EA | Job setup / masking / ventilation per mobilization | EA | 15000 | 4 | 5000 | 0 | platform-baseline, estimate |

## Quantity rules
- None (avoid double-count with hand-seeded `B-INSUL-SF` and insulation pack `B-INS-RIM-LF`).

## Blueprint callouts (components)
- None this wave.

## Open questions → REVIEW_QUEUE
- All 4 costs are platform estimates.
- IRC R316.5.3 / R316.5.4 / R316.5.11 and IBC 2603.4.1.6 numbering per 2021 editions — confirm against adopted edition.
- Equipment vocab lacks a `spray_foam_rig` (trailer proportioner); generator + air_compressor used as proxies.
- Unit `BF` (board foot) is new to the catalog — confirm estimating UI renders it.
- DOE BASC and current epa.gov SPF pages 404; EPA content only on archive.epa.gov (reused existing ids).
