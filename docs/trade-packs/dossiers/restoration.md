# Dossier — `restoration` (Restoration (Water / Fire / Storm Damage))

> Wave: w05 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/restoration.ts` · Status: draft
> Taxonomy: category `specialty` · permit_trade `null` · phase `site_prep` · CSI `02 41`

## Scope (2–4 sentences)
Emergency mitigation after a water, fire or storm loss: make the building safe, stop further damage
(extraction, roof tarps, board-up), tear out what cannot be saved, clean, and dry the structure to a
documented goal with moisture logs and photos for the insurer. The rebuild is `remodeling`; asbestos/lead
abatement found during the survey hands off to `abatement`; electrical re-energizing needs an electrician.

## Existing coverage reconciled
- Hand recipe: none (not in `building.ts` / `nopermit.ts`) → NEW-TRADE pattern, 3 recipes with `example_title`.
- Catalog codes already seeded: none with a `G-RST-` prefix. `G-DEMO-SF` (interior demo) and `G-CLEAN-SF` exist and are not redeclared.
- Blueprint template tasks hitting this trade: none (0 template tasks).

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| restoration-epa-mold-commercial | EPA Mold Remediation in Schools and Commercial Buildings (Table 1) | 1 | gov_open | removal by material, 24–48 h, biocide not routine, sewage → PPE + containment, completion criteria |
| restoration-epa-mold-brief | EPA A Brief Guide to Mold, Moisture and Your Home | 1 | gov_open | moisture control first, >10 SF → pro guide, HVAC off if contaminated |
| restoration-epa-flooded-homes | EPA Flooded Homes Cleanup Guidance | 1 | gov_open | general reference |
| restoration-fema-234 | FEMA 234 Repairing Your Flooded Home (LA County mirror) | 1 | gov_open | brace sagging ceilings, drain cavities, 4 ft wallboard removal, wet insulation out, photos + flooring sample for adjuster, do not rebuild until dry |
| restoration-osha-fs3698 | OSHA FS-3698 Disaster Cleanup | 1 | public_domain | contaminated floodwater, tetanus, N95 minimum, generators, asbestos |
| restoration-osha-fs3713 | OSHA FS-3713 Mold Hazards during Disaster Cleanup | 1 | public_domain | 48 h porous rule, respirator selection, mist/bag/HEPA |
| restoration-osha-fs3276 | OSHA FS-3276 Cleanup Hazards | 1 | public_domain | structure check, lockout wet wiring, 50 lb team lift |
| restoration-osha-fs3286 | OSHA FS-3286 Portable Generators | 1 | public_domain | never indoors, open windows don't help, clearance |
| restoration-osha-wildfires | OSHA Wildfires — response | 1 | public_domain | fire-cleanup hazard list |
| restoration-niosh-co | NIOSH Carbon Monoxide Hazards at Work | 1 | gov_open | engines outdoors, power units away from intakes, CO detector |
| restoration-iicrc-s500 / -s700 / -s520 | IICRC standards | 3 | proprietary_ref_only | CONCEPTS only: water category/class, dry standard, residue type, removal over biocide |
| ecfr-1926-c/d/e/k/m/t/z, painting-epa-rrp | 29 CFR 1926; EPA RRP | 1 | public_domain | hazards |

## Work steps (draft → pack recipes)
- `water_mitigation_drying` (priority 1; "Water damage mitigation & structural drying"): make safe & stop water → document/classify/map moisture → extract & move contents → remove what can't be dried (by category) → clean/treat/set drying equipment → monitor daily & verify drying goal.
- `fire_smoke_cleanup` (priority 2; "Fire/smoke damage cleanup & board-up"): clearance & secure → document & hazmat survey → remove charred material → clean soot/smoke residue → dry firefighting water & verify.
- `storm_tarp_boardup` ("Storm damage tarp & board-up"): size up hazards → tarp roof → board up openings → stop interior water & start drying.
No gates, no code refs (permit_trade null).

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| electrical_shock | wet wiring, downed lines, cords on wet floors | 1926.416(a)(1) (+.417, .404(b)(1)(ii) in note) | 4 |
| contaminated_water | sewage/floodwater biohazard | 1926.95(a) | 3 |
| mold_spores | spores during tear-out | 1926.103 | 3 |
| asbestos_disturb | ACM in old finishes | 1926.1101(k)(1) | 4 |
| lead_paint | lead dust pre-1978 | 1926.62(d) | 3 |
| co_engines | gas pumps/generators indoors | 1926.57(a) | 4 |
| structural_collapse | wet ceilings, burned framing | 1926.850(b) | 4 |
| fire_debris | ash/soot toxics | 1926.55(a) | 3 |
| roof_fall | tarping damaged roofs | 1926.501(b)(13) | 4 |
| heat_stress | closed hot drying zones | 1926.21(b)(2) (derived) | 3 |
| manual_lifting | water-heavy materials | 1926.21(b)(2) (derived) | 2 |
| sharp_debris | glass, nails, tack strip | 1926.25(a) | 2 |

## QA checklist
15 items: source_stopped, utilities_safe*, hazmat_survey*, moisture_map_daily, dry_standard_set,
porous_removed_by_category, flood_cut_height, containment_hepa, antimicrobial_where_needed,
no_engines_indoors*, hvac_not_run, drying_goal_before_rebuild, insurance_docs, contents_inventory,
openings_secured (* = safety, ES pending).

## Inspection / acceptance checkpoints
- initial_safety_assessment, moisture_mapping, drying_goal_verified, final_walkthrough.

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| G-RST-EXTRACT-SF | water extraction | SF | 0 | 0.005 | 5 | 0 | platform-baseline estimate |
| G-RST-AIRMOVER-DAY | air mover | DAY | 0 | 0.05 | 2500 | 0 | estimate |
| G-RST-DEHU-DAY | LGR dehumidifier | DAY | 0 | 0.1 | 9000 | 0 | estimate |
| G-RST-FLOODCUT-LF | flood cut + insulation out | LF | 40 | 0.1 | 0 | 0 | estimate |
| G-RST-BOARDUP-EA | board-up opening | EA | 6000 | 0.75 | 0 | 10 | estimate |
| G-RST-TARP-SF | roof tarp w/ battens | SF | 35 | 0.01 | 0 | 15 | estimate |

## Quantity rules
None — blueprint facts carry no damage extent (affected SF, wet LF, broken openings). Estimator enters them.

## Blueprint callouts (components)
None (restoration scope is not drawn on plans).

## Open questions → REVIEW_QUEUE
- 12 hazards + 3 safety QA + 5 checklist items pending professional ES translation.
- All 6 G-RST costs are platform estimates (Xactimate-style rates are proprietary; no public baseline).
- Antimicrobial application and contents pack-out assemblies were not added (6-assembly cap); EPA says biocide is not routine.
- FEMA 234 cited via a county mirror — fema.gov blocks scripted fetches.
- Hepatitis B vaccination left as an employer discussion (no 1926 construction rule; 1910.1030 is general industry).
