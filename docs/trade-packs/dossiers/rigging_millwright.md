# Dossier — `rigging_millwright` (Rigging / Millwright / Machinery Moving)

> Wave: w18 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/rigging_millwright.ts` · Status: draft
> Taxonomy: category `specialty` · permit_trade `null` · phase `rough_in` · CSI `41`

## Scope (2–4 sentences)
Moves, sets, levels and aligns industrial machinery and heavy equipment: in-plant moves on jacks and
skates, crane picks under a lift plan, precision shaft alignment, and baseplate grouting. Does NOT do the
electrical/piping disconnect and reconnect (owner's crafts or the MEP trades), the foundation concrete
(`concrete`), or crane ownership/operation as a rental service (`crane_service`).

## Existing coverage reconciled
- Hand recipe: none → NEW-TRADE pattern, 3 recipes, no gates / code refs (permit_trade null).
- Catalog codes already seeded: none with `G-RIG-`; existing `EQUIP-CRANE` / `EQUIP-FORKLIFT` day rates are not duplicated.
- Blueprint template tasks hitting this trade: none (0).

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| rigging_millwright-ecfr-1926-251 | 29 CFR 1926.251 Rigging equipment | 1 | public_domain | rigging hazards, QA |
| ecfr-1926-h | 29 CFR 1926 Subpart H (incl. 1926.250 floor load limits) | 1 | public_domain | floor overload |
| rigging_millwright-ecfr-1926-305 | 29 CFR 1926.305 Jacks | 1 | public_domain | jacking/cribbing |
| ecfr-1926-i | Subpart I | 1 | public_domain | jacks |
| rigging_millwright-ecfr-1926-1425 | 29 CFR 1926.1425 Keeping clear of the load (+1926.1400(c) exclusions) | 1 | public_domain | fall zone |
| ecfr-1926-cc | Subpart CC (1926.1408 power lines, 1926.1417(o) load weight, 1926.1419 signals) | 1 | public_domain | lift plan, power lines, signals |
| ecfr-1926-o | Subpart O (1926.602(c) industrial trucks) | 1 | public_domain | forklift capacity |
| ecfr-1926-k | Subpart K (1926.417 lockout/tagging) | 1 | public_domain | LOTO of existing machine |
| ecfr-1926-e / ecfr-1926-z | 1926.95 PPE / 1926.1153 silica | 1 | public_domain | grout chemicals, chipping dust |
| rigging_millwright-asme-b30-9 / -b30-26 / -b30-1 | ASME slings / rigging hardware / jacks-rollers-gantries | 3 | proprietary_ref_only | practice references only |
| rigging_millwright-itw-chockfast | Chockfast epoxy grout overview | 5 | manufacturer_public | role of epoxy machinery grout |

## Work steps (draft → pack recipes)
- `machinery_move_set` (title_re: millwright / machinery moving / machine…relocate|skate|rig in/out): walk path + floor capacity → LOTO → jack, crib, skates → move → set, level, anchor.
- `precision_alignment_grout` (priority 10; laser/shaft/precision alignment, grout + baseplate): prep foundation + bolts → level base + soft foot → rough/final alignment → form + pour grout → torque + re-check.
- `critical_lift` (priority 20; critical/tandem/crane lift, lift/rigging plan): lift plan → rigging select/inspect → fall zone + signals → test pick, lift, land → unhook.

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| rigging_failure | failed/overloaded rigging | 1926.251(a)(1) | 4 |
| sling_cut | sling cut on sharp edge | 1926.251(c)(9) | 4 |
| pinch_crush | hands between sling and load / machine and wall | 1926.251(c)(10) | 3 |
| suspended_load | in fall zone | 1926.1425(b) | 4 |
| load_unknown | guessed weight/CG | 1926.1417(o)(3) | 4 |
| power_line | crane near lines | 1926.1408(a)(2) | 4 |
| jack_drop | jack slip/failure | 1926.305(d)(1)(i) | 4 |
| floor_overload | floor/cover collapse | 1926.250(a)(2)(i) | 4 |
| forklift_tip | forklift over capacity | 1926.602(c)(1)(i) | 4 |
| stored_energy | unexpected start / stored energy | 1926.417(b) | 4 |
| grout_chem | cement/epoxy grout burns | 1926.95(a) | 2 |
| silica_dust | chipping foundations | 1926.1153(c) | 3 |

## QA checklist
15 items (10 safety, ES pending): weight/CG known, floor capacity, LOTO, jack rating + cribbing, rigging inspected, signals, lift plan signed, power-line zone, fall zone, test lift, location/level, soft foot, alignment records, grout full bearing, anchor torque.

## Inspection / acceptance checkpoints
- pre_move_check, lift_plan_review, final_alignment, grout_acceptance (owner/engineer hold points; no AHJ inspection).

## Cost basis (all platform-baseline estimates, 2026)
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % |
|---|---|---|---|---|---|---|
| G-RIG-MOVE-EA | machinery move per piece | EA | 5000 | 24 | 60000 | 0 |
| G-RIG-CREW-DAY | rigging crew + jack/skate set | DAY | 2500 | 24 | 35000 | 0 |
| G-RIG-ALIGN-EA | laser shaft alignment | EA | 3000 | 6 | 15000 | 0 |
| G-RIG-GROUT-CF | epoxy baseplate grout | CF | 25000 | 3 | 1000 | 10 |
| G-RIG-LIFTPLAN-EA | critical lift plan / engineering | EA | 0 | 8 | 0 | 0 |

## Quantity rules
- `G-RIG-LIFTPLAN-EA` = const 1 (industrial only)
- `G-RIG-CREW-DAY` = const × 2 (industrial only)

## Blueprint callouts (components)
- none this wave.

## Open questions → REVIEW_QUEUE
- All 5 assembly costs are platform estimates.
- UFGS 03 62 00 (nonshrink grouting) and API RP 686 (machinery installation) could not be fetched for verification — not cited.
- Vocab: no skate/gantry/jack equipment type in equipment-vocab (only forklift/crane used).
