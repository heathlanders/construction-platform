# Dossier — `radon_mitigation` (Radon Mitigation)

> Wave: w05 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/radon_mitigation.ts` · Status: draft
> Taxonomy: category `specialty` · permit_trade `building` · phase `foundation` · CSI `31 21`

## Scope (2–4 sentences)
Two jobs: (1) **active sub-slab depressurization (SSD)** in existing homes — test review, diagnostics, slab
suction point(s), sealed PVC to a fan outside the living space, discharge above the roof, crack/sump sealing,
manometer, labels, post-mitigation test; (2) **passive radon-resistant new construction (RRNC)** rough-in —
gravel layer + riser tee, sheeting, slab sealing, vent pipe to the roof, labels and an attic power stub.
Not included: the fan circuit (electrician), the slab gravel base/sheeting material when it's already in the
concrete scope, large-building (RMS-LB) systems, and testing as a licensed measurement service.

## Existing coverage reconciled
- Hand recipe: none → NEW-TRADE pattern (2 recipes with `example_title`).
- Catalog codes already seeded: none for radon (`B-SLAB-SF` exists — not duplicated; RRNC assembly excludes gravel/sheeting).
- Blueprint template tasks hitting this trade: none.
- Gates (building family): `foundation` (RRNC sheeting before pour), `final` (both recipes).

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| radon_mitigation-epa-consumers-guide | EPA Consumer's Guide to Radon Reduction (2016) | 1 | public_domain | action level 4 / consider 2–4, SSD method, fan location, 10 ft / 2 ft discharge rule, warning device, labels, post-test ≥24 h / ≤30 days / 2–7 days, retest every 2 yr |
| radon_mitigation-epa-building-radon-out | EPA Building Radon Out | 1 | public_domain | RRNC: 4 in. clean coarse gravel, poly, 3–4 in. (4 rec.) pipe + tee, junction box, sealing, seal/label riser stub |
| radon_mitigation-epa-rrnc-basics | EPA RRNC basics | 1 | gov_open | RRNC overview |
| radon_mitigation-epa-radon | EPA radon home | 1 | gov_open | action level; radon as long-term risk |
| radon_mitigation-epa-standards | EPA Radon Standards of Practice | 1 | gov_open | pointer to ANSI/AARST SGM-SF, CCAH, RMS-LB |
| radon_mitigation-epa-zones-wi | EPA Map of Radon Zones — Wisconsin | 1 | public_domain | much of WI Zone 1/2; test every home |
| radon_mitigation-wi-dhs-radon | WI DHS Radon | 1 | gov_open | state program |
| radon_mitigation-wi-dhs-reduce | WI DHS Radon Mitigation | 1 | gov_open | certified mitigators (NRPP/NRSB), SSD, $1,000–2,000 avg installed (cost cross-check) |
| radon_mitigation-wi-dhs-rics | WI DHS Radon Information Centers | 1 | gov_open | regional centers, low-cost kits, 888-LOW-RADON |
| radon_mitigation-aarst-standards | ANSI/AARST standards | 3/4 | proprietary_ref_only | concept only (PFE diagnostics) |
| icc-pa | IRC Appendix F (AF103.2/.3/.4/.6/.6.1/.7/.8/.9/.12) + R302.5.3 | 3 | proprietary_ref_only | code refs — section numbers checked against a published Appendix F text (2012–2021 numbering) |
| ecfr-1926-z/m/x/k/d/e/aa | 29 CFR 1926 | 1 | public_domain | hazards (1926.1153(c)(1) Table 1 drills/core; 1926.501(b)(13); 1926.1053(b)(1); 1926.404(b)(1); 1926.416(a)(3); 1926.53; 1926.1203(a); 1926.59; 1926.52; 1926.102(a)(1)) |

## Work steps (draft → pack recipes)
**active_ssd** (`\bradon\b|sub-slab depressurization|SSD`; example "Install active sub-slab depressurization radon system")
1. Review the radon test and size up the house — QA pre_test_documented.
2. Core the suction hole and check the pressure field — QA pfe_verified.
3. Run the pipe and mount the fan outside the living space — IRC R302.5.3. QA fan_location, pipe_slope, fire_penetration.
4. Terminate the discharge above the roof — QA discharge_location.
5. Seal cracks, joints and the sump — QA sealing_entry, sump_cover.
6. Wire the fan, install the gauge and label the system — QA fan_wired, manometer, system_labeled.
7. Post-mitigation test and hand over — Gate final. QA post_test.

**rrnc_passive_rough_in** (priority 10; `RRNC|radon-resistant|passive radon|radon (vent) rough-in/stub/riser/pipe`)
1. Place the gas-permeable layer and the riser tee — AF103.2, AF103.6.
2. Lay the soil-gas retarder and seal it — AF103.3. Gate foundation.
3. Seal slab joints and openings after the pour — AF103.4.
4. Run the vent pipe up through the roof — AF103.6.1, AF103.7, AF103.8.
5. Label, power stub and final — AF103.9, AF103.12. Gate final.

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| silica_core | Silica dust coring/drilling slab | 1926.1153(c)(1) | 3 |
| hidden_utilities | Utilities/radiant tubing in slab | 1926.416(a)(3) | 3 |
| roof_fall | Roof edge fall | 1926.501(b)(13) | 4 |
| ladder | Ladder slip/overreach | 1926.1053(b)(1) | 3 |
| fan_electrical | Shock — cords/fan circuit | 1926.404(b)(1) | 3 |
| radon_exposure | Radon exposure (long-term, low acute) | 1926.53 | 2 |
| crawl_confined | Tight crawlspace | 1926.1203(a) | 3 |
| pvc_solvent | PVC primer/cement/sealant vapors | 1926.59 | 2 |
| noise | Core drill / rotary hammer noise | 1926.52 | 2 |
| eye_flying | Chips/debris | 1926.102(a)(1) | 2 |

Fire-rated penetrations are handled as a safety QA item + IRC R302.5.3 code ref (not a worker hazard).

## QA checklist
15 items — pre_test_documented, pfe_verified, fan_location*, pipe_slope, fire_penetration*, discharge_location*,
sealing_entry, sump_cover, fan_wired*, manometer, system_labeled, post_test, gravel_layer, retarder_lapped,
rrnc_labeled_stub (* = safety, ES pending).

## Inspection / acceptance checkpoints
- foundation: gas-permeable layer, retarder lapped/sealed, riser tee capped + labeled.
- final: vent pipe to roof draining back, labels, attic junction box, garage separation fireblocked, active-system items.

## Cost basis (all `platform-baseline`, confidence estimate)
| Code | Item | Unit | Material ¢ | Labor hr | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| B-RDN-SSD-EA | Active SSD, one suction point | EA | 48000 | 6 | 2500 | 5 | fan + ~35 LF PVC + fittings + boot + manometer; cross-checked vs WI DHS $1,000–2,000 avg installed |
| B-RDN-SUCT-EA | Additional suction point | EA | 9000 | 2.5 | 1500 | 5 | estimate |
| B-RDN-SUMP-EA | Airtight sump cover | EA | 12000 | 1 | 0 | 0 | estimate |
| B-RDN-RRNC-EA | Passive RRNC rough-in (gravel/sheeting by others) | EA | 25000 | 4 | 0 | 5 | estimate |
| B-RDN-TEST-EA | Short-term test kit + lab | EA | 3500 | 0.5 | 0 | 0 | estimate |
| B-RDN-MEMB-SF | Crawlspace membrane | SF | 60 | 0.012 | 0 | 12 | estimate |

## Quantity rules
- `B-RDN-RRNC-EA` = const 1 when `facts_any [slab_on_grade, foundation_wall]` AND `residential_sf` —
  justification: rules only evaluate when `radon_mitigation` is on the project's schedule; on a new
  single-family plan with a slab/basement, the radon scope is the RRNC rough-in (active SSD is retrofit).
- `B-RDN-TEST-EA` = const 1, same scope — EPA: test every home after occupancy.

## Blueprint callouts (components)
- none this wave.

## Open questions → REVIEW_QUEUE
- AF103.x numbering checked against the 2012–2021 Appendix F layout; the 2024 IRC renamed it Appendix AF — confirm numbering for the adopted edition.
- 1926.53 (ionizing radiation) is the closest OSHA hook for radon exposure — reviewer to confirm.
- WI EPA zone county counts not stated in the pack (wording kept to "much of WI Zone 1 or 2").
- All 6 assembly costs are estimates.
