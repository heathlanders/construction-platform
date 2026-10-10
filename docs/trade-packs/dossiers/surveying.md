# Dossier — `surveying` (Surveying / Staking)

> Wave: w21 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/surveying.ts` · Status: draft
> Taxonomy: category `services` · permit_trade `null` · phase `site_prep` · CSI `02 21`

## Scope (2–4 sentences)
Licensed professional land surveyor work on a building job: record research, boundary retracement and
corner monuments, project control + benchmark, footprint/grade staking with offsets and cut sheets,
foundation location (as-built) survey, and the sealed survey map or ALTA/NSPS plat. Geotechnical borings
and environmental assessment named in the same template tasks belong to `geotech` /
`environmental_consulting`; this pack only coordinates (shared control, boring layout). Utility locating
belongs to `utility_locating`.

## Existing coverage reconciled
- Hand recipe: none → pack is the NEW-TRADE pattern (2 recipes, no gates).
- Catalog codes already seeded: none for surveying; services wave adds no assemblies.
- Blueprint template tasks hitting this trade: "Survey & stake building footprint" (residential_sf,
  pole_barn), "Survey, stake & geotechnical investigation" (residential_mf), "Survey, ALTA & geotechnical
  investigation" (commercial), "Survey, geotechnical & environmental assessment" (industrial). All match
  `survey_and_stake` (`\bsurvey`); the commercial ALTA title is picked by `alta_boundary_survey` (priority 1).

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| surveying-wi-ae7 | Wis. Admin. Code ch. A-E 7 | 1 | gov_open | steps, QA (7.03, 7.025, 7.05, 7.06, 7.07) |
| surveying-wi-stat443 | Wis. Stat. ch. 443 | 1 | gov_open | licensure (443.02(4)) |
| surveying-wi-stat236-15 | Wis. Stat. 236.15 | 1 | gov_open | monument types / flush placement |
| surveying-wi-stat236-32 | Wis. Stat. 236.32 | 1 | gov_open | monument disturbance penalty → protection QA |
| surveying-wi-stat59-45 | Wis. Stat. 59.45 | 1 | gov_open | county filing of surveys |
| surveying-alta-nsps-2021 | 2021 ALTA/NSPS Minimum Standard Detail Requirements | 3 | proprietary_ref_only | ALTA scope (Table A, title commitment) — paraphrase only |
| ecfr-1926-c/e/g/o/p | 29 CFR 1926 Subparts C, E, G, O, P | 1 | public_domain | hazards |
| platform-baseline | Platform baseline | — | platform_estimate | layout-practice QA (control redundancy, cut sheet, foundation check) |

## Work steps (draft → pack recipes)
`survey_and_stake` (`\bsurvey`): research/scope → retrace boundary + set monuments → control + benchmark →
stake footprint with offsets + cut sheet → foundation location survey → seal/file map.
`alta_boundary_survey` (`\bALTA\b|land title survey|boundary survey`, priority 1): ALTA scope + Table A +
title commitment → record + adjoiner research → field monuments/improvements/evidence of use → control →
draft/certify/file plat. No gates (permit_trade null), no code_refs.

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| traffic_struck_by | Struck by traffic on roads / ROW | 1926.201(a) | 4 |
| equipment_struck_by | Struck by earthmoving equipment | 1926.602(a)(9)(ii) | 4 |
| trench_entry | Cave-in entering unprotected trench | 1926.652(a)(1) | 4 |
| excavation_edge | Falling in / edge collapse | 1926.651(l) | 3 |
| heat_cold | Heat illness / cold stress | 1926.21(b)(2) | 3 |
| plants_animals | Ticks, poison ivy, insects, dogs | 1926.21(b)(4) | 2 |
| stake_driving | Flying chips / sledge glance | 1926.102(a)(1) | 2 |

## QA checklist
10 deliverable items: written scope (incl. A-E 7.01(4) exclusions), monuments found/set, positional
accuracy 0.13 ft + 100 ppm and 1:3,000 closure, redundant control, layout check + cut sheet, foundation
location check, map content, sealed/filed by PLS, ALTA easements addressed, monuments protected.

## Inspection / acceptance checkpoints
- `footprint_staking_review`, `foundation_location_survey` (descriptive keys; owner/contractor hold points).

## Cost basis
None — services wave (no assemblies).

## Quantity rules
None.

## Blueprint callouts (components)
None.

## Open questions → REVIEW_QUEUE
- ALTA/NSPS 2021 PDF not fetchable (NSPS 403) → kept proprietary_ref_only; verify public availability.
- Foundation location survey requirement varies by municipality/lender — QA is a platform baseline.
- Equipment vocab has no survey instruments (total station / GNSS) — none added.
