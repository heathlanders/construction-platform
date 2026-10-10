# Dossier — `concrete_repair_lifting` (Concrete Repair / Lifting (Mudjacking / Polyjacking))

> Wave: w05 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/concrete_repair_lifting.ts` · Status: draft
> Taxonomy: category `concrete_masonry` · permit_trade `null` · phase `sitework` · CSI `03 01 30`

## Scope (2–4 sentences)
Raising and re-supporting settled slabs (walks, driveways, patios, steps/stoops, garage and pool decks) by
polyurethane foam injection or mudjacking, plus crack routing/sealing, spall and partial-depth patching and
thin polymer-modified resurfacing. Includes finding the cause of settlement and sealing joints afterward.
Does NOT cover: foundation piering/underpinning (`foundation_repair`), new or replacement flatwork
(`concrete_flatwork`), downspout/grading fixes (`gutters`, `excavation`, `landscaping`), structural
repair of reinforced members. No permit path → no gates/code refs; owner hold points in checklists.

## Existing coverage reconciled
- Hand recipe: none → NEW-TRADE pattern (2 recipes).
- Catalog codes already seeded and referenced (not redeclared): `B-CFW-JOINTSEAL-LF` (backer rod + sealant
  after lifting), `B-FLAT-SEAL-SF` (penetrating sealer). New: `G-CRL-*` (6).
- Blueprint template tasks hitting this trade: none (repair work is not on new-build plans).
- Quantity rules: none (no blueprint fact drives repair scope).

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| concrete_repair_lifting-ufgs-03-01-00 | UFGS 03 01 00 Rehabilitation of Concrete (2018) | 1 | public_domain | saw-cut perimeter 0.50–0.75 in., remove to sound, sound substrate, V-groove routing, no rigid epoxy in active cracks |
| concrete_repair_lifting-modot-slabstab-tb | MoDOT Tech Brief cmr 17-013-TB6 Slab Stabilization | 1 | gov_open | lift gauges, small-hole PU grid ≈4 ft, over-pumping cracks slabs, seep at joints = voids filled |
| concrete_repair_lifting-modot-epg-771-1 | MoDOT EPG 771.1 Slab Stabilization (Jacking) | 1 | gov_open | mudjacking: thin grout, ≤1/4 in. at a time, blowouts, cap holes |
| concrete_repair_lifting-regina-2780 | City of Regina Spec 2780 Slab Jacking | 1 | gov_open | pre-work condition survey, vertical holes, within 5 mm of target, flush patch, damage by excess force |
| concrete_repair_lifting-alchatek-aplift435-tds | Alchatek AP Lift 435 TDS | 5 | manufacturer_public | soils review, locate utilities, 3–4 ft grid, protect surfaces, no over-pressure, dial indicators, fast-set hole fill |
| concrete_repair_lifting-alchatek-aplift430 | Alchatek AP Lift 430 product page | 5 | manufacturer_public | product class corroboration |
| concrete_repair_lifting-ncfi-terrathane | NCFI TerraThane lifting foams | 5 | manufacturer_public | corroboration only |
| concrete_repair_lifting-epa-spf-health / -epa-spf-tips | EPA Safer Choice SPF pages (archived) | 1 | gov_open | isocyanate asthma/sensitization; SDS, PPE, keep occupants away |
| concrete_repair_lifting-niosh-96-111 | NIOSH Alert 96-111 diisocyanates | 1 | public_domain | isocyanate respiratory hazard |
| concrete_repair_lifting-osha-isocyanates | OSHA Isocyanates topic page | 1 | gov_open | isocyanate controls |
| concrete_repair_lifting-nrmca-cip4 | NRMCA CIP 4 Cracking | 4 | association_public | settlement/drainage as crack cause |
| concrete_flatwork-nrmca-cip6 | NRMCA CIP 6 Joints (reused) | 4 | association_public | joint sealing |
| concrete_repair_lifting-icri-guidelines | ICRI 310.1R/310.2R/320.1R | 4 | proprietary_ref_only | concept only (sound concrete, square edges, CSP) |
| concrete_repair_lifting-call811 | 811 Before You Dig (CGA) | 4 | association_public | locate, private lines |
| ecfr-1926-c/d/e/i/k/z | 29 CFR 1926 subparts | 1 | public_domain | hazards |
| platform-baseline | The Jobsite baseline | — | platform_estimate | all costs |

HMI (hmicompany.com) concrete raising guide blocks automated fetch (403) — not cited.

## Work steps (draft → pack recipes)
**slab_lifting** (`mud ?jack|slab ?jack|poly ?jack|polyurethane (foam )?(lift|inject)|concrete (lift|level|rais)|slab (lift|level|rais|stabiliz)|…|void fill`):
1. Survey the slab and fix the cause — QA cause_identified, slab_condition.
2. Locate utilities and plan the hole pattern — QA utilities_located, hole_layout.
3. Drill holes and set up lift monitoring — QA silica_controls, hole_layout.
4. Inject and lift in small, controlled steps — QA isocyanate_controls, lift_monitored, voids_filled, structure_clear.
5. Patch holes, seal joints and restore drainage — QA holes_patched, joints_sealed, drainage_restored.

**crack_spall_repair** (`crack (repair|seal|fill|rout|inject)|spall|resurfac|\boverlay\b|concrete (repair|patch|restor)|…|partial-depth`):
1. Assess cracks and sound for loose concrete — QA crack_classified.
2. Cut out, chip and prepare repair areas — QA silica_controls, spall_prep.
3. Fill cracks and patch spalls — QA patch_overlay_cure.
4. Resurface worn concrete (when specified) — QA silica_controls, patch_overlay_cure.

## Hazards (draft → pack hazards)
| id | Hazard | Controls | OSHA ref | Sev |
|---|---|---|---|---|
| silica_drilling | silica from drilling injection holes | shroud + vacuum per Table 1 (vii) | 1926.1153(c)(1) | 3 |
| silica_grinding | silica from grinding/sawing/chasing | water feed or shroud+DC, Table 1 respirator | 1926.1153(c)(1) | 3 |
| silica_cleanup | dry sweeping / compressed air | HEPA vac or wet | 1926.1153(f)(1) | 2 |
| isocyanate_inhalation | isocyanate vapor/mist — asthma, sensitization | SDS respirator program, occupants away, ventilation | 1926.103 | 3 |
| isocyanate_skin | A-side / uncured foam skin contact | HazCom/SDS, chemical gloves | 1926.59 | 3 |
| chemical_eye | foam/grout blow-back, burst line, chips | goggles + face shield | 1926.102(a)(1) | 3 |
| pressurized_hose | hose whip/burst | supply safety device >1/2 in., whip checks, tag damaged | 1926.302(b)(7) | 3 |
| buried_utilities | drilling/probing into lines | 811 + private lines | 1926.416(a)(3) | 4 |
| noise | hammers, saws, pump engines | hearing protection | 1926.101(a) | 2 |
| cement_grout | wet cement burns | waterproof gloves, wash off | 1926.95(a) | 2 |
| housekeeping_trips | hoses, holes, foam scrap | route hoses, cover holes | 1926.25(a) | 1 |

## QA checklist
- [ ] cause_identified · slab_condition · utilities_located (safety) · hole_layout · lift_monitored · voids_filled ·
  structure_clear · holes_patched · joints_sealed · drainage_restored · silica_controls (safety) ·
  isocyanate_controls (safety) · crack_classified · spall_prep · patch_overlay_cure (15 total; see pack for text + prov).

## Inspection / acceptance checkpoints
- `pre_lift_survey`: photos/heights with owner, cause + fix agreed, 811 + private lines, broken slabs flagged for replacement.
- `repair_prep_hold`: square saw-cut outlines + loose concrete removed (UFGS 03 01 00 3.3), surface profile per product, weather window.
- `final_walkthrough`: heights/no rocking/no trip edges, holes patched + blended, joints sealed + drainage, basement/drain intrusion check, cure times + records to owner.

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| G-CRL-POLYLIFT-SF | PU foam lift + void fill | SF | 250 | 0.045 | 100 | 10 | estimate — ≈0.5 lb/SF @ ~$5/lb; 2-person crew ≈350 SF/day |
| G-CRL-MUDJACK-SF | mudjack lift + void fill | SF | 60 | 0.05 | 50 | 15 | estimate — ≈0.1 CF grout/SF; ≈400 SF/day |
| G-CRL-INJHOLE-EA | drill, port, patch hole | EA | 150 | 0.15 | 25 | 10 | estimate |
| G-CRL-CRACK-LF | crack rout + seal | LF | 80 | 0.06 | 5 | 10 | estimate — ≈16 LF/hr |
| G-CRL-SPALL-SF | spall / partial-depth patch ≈1 in. | SF | 600 | 0.5 | 50 | 15 | estimate — small-area productivity |
| G-CRL-RESURF-SF | resurfacer overlay ≈1/8–1/4 in. | SF | 150 | 0.04 | 15 | 10 | estimate |

Joint sealing after a lift → existing `B-CFW-JOINTSEAL-LF`; sealer → existing `B-FLAT-SEAL-SF`.

## Quantity rules
- None — repair scope is not derivable from blueprint facts.

## Blueprint callouts (components)
- None.

## Open questions → REVIEW_QUEUE
- All 6 `G-CRL-*` costs are platform estimates (foam $/lb and consumption vary widely by soil/void).
- Hazard and safety-QA Spanish pending human translation (11 hazards, 3 QA, 1 checklist item).
- `pressurized_hose` cites 1926.302(b)(7) (compressed-air hoses); no 1926 section is specific to heated
  polyurethane proportioner lines — reviewer to confirm.
- Isocyanate guidance is written for spray foam (EPA SPF, archived pages); applied by analogy to low-pressure injection foam.
- ICRI guideline URL is the institute homepage (store pages block automated checks); HMI guide unreachable (403).
- Equipment vocab lacks `polyurethane_rig` / `grout_pump`; using `generator` / `air_compressor` as optional proxies.
