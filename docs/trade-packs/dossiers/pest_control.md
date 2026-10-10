# Dossier — `pest_control` (Pest Control / Termite Pretreatment)

> Wave: w18 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/pest_control.ts` · Status: draft
> Taxonomy: category `specialty` · permit_trade `null` · phase `foundation` · CSI `31 31`

## Scope (2–4 sentences)
Licensed applicator work on a building job: pre-construction subterranean termite soil treatment (horizontal
barrier under the slab, vertical barrier along the foundation), termite bait / monitoring stations, borate wood
treatment on framing, and rodent exclusion at penetrations. Fumigation, wildlife removal and recurring service
contracts are out of scope. Vapor retarder and slab belong to `concrete`; grading and drainage to `excavation`.

## Existing coverage reconciled
- Hand recipe: none (generic no-permit fallback) → pack adds 3 recipes (NEW-TRADE pattern).
- Catalog codes already seeded: none with `G-PEST-`.
- Blueprint template tasks hitting this trade: none.
- No permit family → no gates, no code_refs. IRC R318 appears only in `inspection_checklists.pretreat_certificate`
  as section numbers + paraphrase.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| pest_control-epa-prn96-7 | EPA PRN 96-7 Termiticide Labeling | 1 | gov_open | full label rate on pretreat, weather limits, notify GC/clear workers, wells/drains, PPE by toxicity, retreatment |
| pest_control-epa-termites | EPA — Termites: How to Identify and Control Them | 1 | gov_open | treatment types, borate during construction, well contamination risk, state licensing, prevention |
| pest_control-epa-labels | EPA — Introduction to Pesticide Labels | 1 | gov_open | label contents |
| pest_control-fifra-136j | 7 USC 136j (FIFRA §12) | 1 | public_domain | use inconsistent with labeling is unlawful |
| pest_control-ecfr-40-156 | 40 CFR 156 labeling | 1 | public_domain | label elements (EPA reg. no., signal word) |
| pest_control-wi-atcp29 | Wis. Admin. Code ATCP 29 | 1 | gov_open | 29.20/29.25 licenses, 29.31(14) termite category, 29.21 records (2 yr, same day), 29.22 customer info |
| pest_control-npic-termites | NPIC — Termites | 4 | association_public | identify before treating; licensed products |
| ecfr-1926-c/d/e/k/aa | 29 CFR 1926 | 1 | public_domain | hazards |
| icc-pa (IRC R318) | ICC public access | 3 | proprietary_ref_only | checklist ref only (not cited by id in the pack) |

## Work steps (draft → pack recipes)
`termite_soil_pretreat` (title_re `termit(e|icide)|pre-?treat|soil (poison|treatment)`):
1. **Schedule the pretreat and notify the crew** — after under-slab plumbing/fill, before vapor retarder/pour; license check; GC notified; wells/drains located.
2. **Check soil and weather before mixing** — no saturated/frozen soil, no rain (PRN 96-7); debris out; mix per label with backflow device.
3. **Apply the horizontal barrier under the slab** — full label rate (never reduced for pretreat), penetrations, interior footings.
4. **Treat the foundation perimeter** — trench and rod, continuous barrier, treat backfill on deep foundations; locates first.
5. **Cover, record and certify** — keep off until absorbed, cover per label if pour delayed, re-treat disturbed barrier, same-day record + certificate.

`termite_bait_borate`: confirm system/license → borate spray on dry framing before close-in → set stations at label spacing after final grade, map → hand over record.
`rodent_exclusion`: find openings (crawl space = possible confined space) → seal with metal mesh/sheet metal/mortar + sealant.

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| chemical_exposure | mixing/spraying skin/eye/inhalation | 1926.59 | 3 |
| respiratory | non-ventilated spaces, sub-slab rodding | 1926.103 | 3 |
| eye_splash | concentrate splash | 1926.50(g) | 3 |
| bystander_exposure | other trades on treated soil | 1926.21(b)(2) | 2 |
| wash_facility | no washing on site | 1926.51(f)(1) (names insecticide application) | 2 |
| water_contamination | wells, cisterns, drains | 1926.59 (env. hazard; derived) | 3 |
| spill | concentrate/tank mix spill | 1926.59 | 2 |
| buried_utilities | trenching/rodding/augering | 1926.416(a)(3) | 4 |
| confined_crawl | crawl spaces | 1926.1203(a) | 3 |
| heat_stress | chemical PPE in heat | 1926.21(b)(2) | 2 |
| manual_handling | jugs, hoses, digging | 1926.21(b)(2) | 1 |
| sharp_edges | mesh/sheet metal | 1926.28(a) | 1 |

## QA checklist
15 items in the pack: license verified (ATCP 29.25/29.31(14)), label + SDS on site*, crew notified*, wells located*,
soil condition, mix per label, full label rate, penetrations treated, perimeter continuous, barrier protected,
record completed (ATCP 29.21), certificate delivered (ATCP 29.22), borate coverage, stations mapped, openings sealed.
(* = safety, ES pending.)

## Inspection / acceptance checkpoints
- `pretreat_certificate`: certificate contents; method among those IRC R318.1 lists where the building official
  requires termite protection; soil treatment per label (R318.1.1 — paraphrase only).
- `pre_pour_check`: barrier undisturbed / re-treated, covered before rain, workers off treated soil.
- `applicator_records`: ATCP 29.21 record, ATCP 29.22 customer sheet.

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| G-PEST-SOIL-SF | Horizontal barrier under slab | SF | 5 | 0.001 | 1 | 5 | platform-baseline estimate |
| G-PEST-PERIM-LF | Trench-and-rod vertical barrier | LF | 40 | 0.03 | 2 | 5 | estimate |
| G-PEST-BAIT-EA | In-ground bait/monitor station | EA | 2500 | 0.25 | 0 | 0 | estimate; service contract excluded |
| G-PEST-BORATE-SF | Borate spray, per SF floor area | SF | 4 | 0.002 | 0 | 10 | estimate |
| G-PEST-EXCL-EA | Rodent exclusion per opening | EA | 300 | 0.25 | 0 | 10 | estimate |
| G-PEST-MOB-EA | Service call + certificate | EA | 0 | 1.0 | 2500 | 0 | estimate |

## Quantity rules
- `G-PEST-SOIL-SF` = area_sf_sum × 0.6 (residential_sf only) — ground-floor footprint proxy; conservative for two-story.
- `G-PEST-MOB-EA` = const 1 (residential_sf only).
Rules only fire when `pest_control` is on the project schedule (seedFromPacks gets the schedule trades).
Perimeter LF has no blueprint fact basis → not seeded.

## Blueprint callouts (components)
- none this wave.

## Open questions → REVIEW_QUEUE
- All costs are platform-baseline estimates.
- 12 hazards + 3 safety QA items need human ES translation.
- IRC R318 section numbering (R318.1 / R318.1.1) cited from memory of the 2021 IRC — ICC site blocks scripts; verify.
- WI termite pressure is low; pretreat is uncommon in Dane County — confirm with Example Builders whether the trade is used.
