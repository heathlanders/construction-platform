# Dossier — `water_treatment` (Water Treatment / Filtration)

> Wave: w13 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/water_treatment.ts` · Status: draft
> Taxonomy: category `plumbing_systems` · permit_trade `plumbing` · phase `commissioning` · CSI `22 31`

## Scope (2–4 sentences)
Tests raw water, then sizes, installs and starts up point-of-entry and point-of-use treatment: softeners,
iron/manganese/sulfur filters, whole-house sediment/carbon filters, UV disinfection and under-sink RO.
Hand-offs: the rough-in loop itself belongs to the plumber (`P-PL-SOFTENER-LOOP-EA`); the well, pump and
pressure tank belong to `well_drilling`; receptacles belong to the electrician.

## Existing coverage reconciled
- Hand recipe: none (not in `HAND_RECIPE_KEYS`) → NEW-TRADE pattern, 2 recipes.
- Catalog codes already seeded: `P-PL-SOFTENER-LOOP-EA` (plumbing pack, migration 0050) — not duplicated;
  new `P-WT-*` assemblies price the equipment on top of that loop.
- Blueprint template tasks hitting this trade: none. No fixture/component token exists for softeners/RO,
  so `quantity_rules` is empty (a `const` rule would price a softener into every residential estimate).

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| water_treatment-cdc-home-treatment | CDC — About Home Water Treatment Systems | 1 | gov_open | test-first, treatment types, maintenance |
| water_treatment-cdc-well-treatment | CDC — Guidelines for Treating Well Water | 1 | gov_open | well disinfection/treatment order |
| water_treatment-epa-protect-home-water | EPA — Protect Your Home's Water | 1 | gov_open | testing guidance |
| water_treatment-epa-well-contaminants | EPA — Potential Well Water Contaminants | 1 | gov_open | contaminant → test list |
| water_treatment-epa-watersense-pou-ro | EPA WaterSense — POU RO systems | 1 | gov_open | RO practice |
| well_drilling-wi-dnr-well-test (reused) | WI DNR private well testing | 1 | gov_open | WI testing |
| water_treatment-wslh-homeowner-tests / -test-prices | WI State Lab of Hygiene | 1 | gov_open | certified lab, test fee basis |
| water_treatment-nsf-58 | NSF/ANSI 58 (and 44/53/55 names) | 3 | proprietary_ref_only | certification names only |
| water_treatment-wqa | Water Quality Association | 4 | association_public | sizing/maintenance practice (paraphrase) |
| icc-pa / nfpa-fa | IPC 608.1, 610, 611, 802; NEC 250.68(B) | 3 | proprietary_ref_only | code refs |
| ecfr-1926-c/d/e/h/i/j/k | 29 CFR 1926 | 1 | public_domain | hazards |

## Work steps (draft → pack recipes)
`whole_house_treatment` (title_re softener / water soft / iron filter / UV disinfection|sterili / water treatment|filter|filtration|conditioning):
1. **Test the water** — lab test before purchase. QA raw_water_tested, certified_equipment.
2. **Size and lay out** — hardness+iron × occupants × use, peak flow; filter → softener → UV order. QA sized_for_flow, treatment_order.
3. **Rough in bypass + air-gapped drain** — Code IPC 802, 608.1. Gate rough_in. QA drain_air_gap, bypass_works.
4. **Set tanks, connect, bond** — Code NEC 250.68(B). QA bonding_jumper, gfci_power.
5. **Start up, leak-check, backwash** — Gate water_supply. QA no_leaks, programmed.
6. **Sanitize, retest, hand over** — Code IPC 610. Gate final. QA sanitized, treated_retest, owner_handoff.

`ro_point_of_use` (priority 10; reverse osmosis / \bRO\b / drinking water filter|system|unit): confirm test + NSF 58 unit → mount/feed/tank → drain through air gap (IPC 611, gate final) → flush, TDS check, hand over.

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| chemical_handling | sanitizer/chlorine/permanganate burns | 1926.59 | 3 |
| chemical_eye | splash opening housings | 1926.102(a)(1) | 2 |
| chlorine_vapor | vapor in closed room | 1926.55(a) | 2 |
| shock | controls/UV near water | 1926.416(a)(1) | 4 |
| torch_fire | soldering near combustibles | 1926.352(a) | 3 |
| hand_tools | cutters, hole saws | 1926.301(a) | 2 |
| lifting_salt | 40–50 lb bags on stairs | 1926.250(a)(1) | 2 |
| material_storage | stacked bags/tanks | 1926.250(a)(1) | 2 |
| wet_floor | backwash/drain-down spills | 1926.25(a) | 2 |

## QA checklist
14 items in the pack (6 safety → ES pending).

## Inspection / acceptance checkpoints
- rough_in: air-gapped drains, bypass/isolation, lead-free supported piping
- water_supply: no leaks at working pressure, bonding jumper
- final: certified units + manuals, disinfected and retested

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| P-WT-SOFTENER-EA | metered softener | EA | 110000 | 3 | 0 | 0 | estimate |
| P-WT-IRON-FILTER-EA | backwash iron/Mn/S filter | EA | 150000 | 4 | 0 | 3 | estimate |
| P-WT-UV-EA | UV + prefilter | EA | 110000 | 3.5 | 0 | 3 | estimate |
| P-WT-RO-EA | under-sink RO | EA | 40000 | 2.5 | 0 | 0 | estimate |
| P-WT-WHOLE-FILTER-EA | sediment + carbon set | EA | 35000 | 2 | 0 | 3 | estimate |
| P-WT-LAB-TEST-EA | lab test pre + post | EA | 30000 | 1 | 0 | 0 | estimate (WSLH $450 broad package noted) |

## Quantity rules
- none — no blueprint fact identifies treatment equipment.

## Blueprint callouts (components)
- none this wave.

## Open questions → REVIEW_QUEUE
- IRC equivalents (P29xx drinking water treatment units, P2706-ish indirect waste) not verified — omitted; only IPC refs cited.
- IPC 611 / 802 / 608.1 / 610 section numbers from 2021 IPC memory; ICC public access 403 to curl — reviewer to confirm.
- NSF and CDC URLs 403 to curl (bot block); confirmed via search.
- All 6 assemblies are platform estimates.
