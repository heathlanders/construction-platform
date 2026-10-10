# Dossier — `roofing` (Roofing)

> Wave: w01 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/roofing.ts` · Status: draft
> Taxonomy: category `envelope` · permit_trade `building` · phase `roofing` · CSI `07 30`

## Scope (2–4 sentences)
Steep-slope roof coverings on wood decks: tear-off, drip edge, ice barrier and underlayment (dry-in),
valley/wall/penetration flashing, shingles or metal panels, ridge/hip caps and ridge ventilation.
Does NOT do roof framing or sheathing (framing / truss_setting), gutters (gutters), custom sheet-metal
fabrication (sheet_metal_flashing), skylight units (skylights) or low-slope membrane systems in depth.

## Existing coverage reconciled
- Hand recipe: `task-buildout/building.ts` roofing branch (Dry-in → Install cover; metal-roof aware) →
  **pack complements** (`recipes: []`, no supersede). Pack adds glossary, hazards, QA, checklists,
  code refs (roof_dry_in + final) and assemblies.
- Catalog codes already seeded: `B-ROOF-SF`, `B-ROOF-SHINGLE-SQ`, `B-UNDERLAYMENT-SF`, `B-SHEATHING-SF`
  → not duplicated; new `B-RF-*` rows complement them.
- Blueprint template tasks hitting this trade: residential/MF/commercial roofing tasks → still served by
  the hand recipe.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| ecfr-1926-m | 29 CFR 1926 Subpart M — Fall Protection | 1 | public_domain | 1926.501(b)(4)(i), (b)(10), (b)(11), (b)(13), (c); 1926.502(d)(15) |
| ecfr-1926-x | 29 CFR 1926 Subpart X — Ladders | 1 | public_domain | 1926.1053(b)(1) |
| ecfr-1926-l | 29 CFR 1926 Subpart L — Scaffolds | 1 | public_domain | 1926.451(g)(1) |
| ecfr-1926-k / -i / -c | Subparts K, I, C | 1 | public_domain | 1926.416(a)(1), 1926.302(b), 1926.21(b)(2) |
| ecfr-1926 | Part 1926 (Subpart H) | 1 | public_domain | 1926.252(a) debris chutes |
| osha-3755 (new) | OSHA 3755 Protecting Roofing Workers | 1 | public_domain | hazard controls (supplemental) |
| ufgs-07-31-13 (new) | UFGS 07 31 13 Asphalt Shingles (Aug 2025) | 1 | public_domain | QA: deck, drip edge, underlayment, eave flashing, nailing, stagger, valleys, step/vent flashing |
| oc-duration-install (new) | Owens Corning Duration installation instructions (Jul 2026) | 5 | manufacturer_public | QA: deck dry, ice barrier extent, low-slope underlayment, nail penetration, cold weather |
| nrca-ref (new) | NRCA technical resources | 4 | proprietary_ref_only | reference only — nothing taken |
| icc-pa | ICC IRC public access | 3 | proprietary_ref_only | R905.1.1, R905.1.2, R905.2.8.5, R903.2, R905.2, R806, R908 (section + paraphrase) |
| platform-baseline | Platform estimate | — | platform_estimate | all assembly costs |

All eCFR section texts verified via the eCFR renderer API on 2026-10-08.

## Work steps (draft → pack recipes)
None — hand recipe (dry-in → cover) stays authoritative. Gating inspections used: `roof_dry_in`, `final`.

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| fall_steep_roof | Fall from steep roof edge | 1926.501(b)(11) | 4 |
| fall_low_slope | Fall from low-slope edge | 1926.501(b)(10) | 4 |
| fall_residential | Fall in residential roofing | 1926.501(b)(13) | 4 |
| anchor_failure | Anchor/lifeline pull-out | 1926.502(d)(15) | 4 |
| holes_skylights | Fall through skylights/openings | 1926.501(b)(4)(i) | 4 |
| falling_objects | Struck by falling material below | 1926.501(c) | 3 |
| ladder | Ladder access/carrying | 1926.1053(b)(1) | 3 |
| scaffold_fall | Fall from scaffold | 1926.451(g)(1) | 4 |
| debris_chute | Tear-off debris dropping | 1926.252(a) | 3 |
| power_lines | Overhead line contact | 1926.416(a)(1) | 4 |
| nailer | Pneumatic nailer punctures | 1926.302(b) | 3 |
| heat_illness | Heat illness on hot roofs | 1926.21(b)(2) (training — no heat-specific 1926 standard) | 3 |

## QA checklist
15 items — 2 safety (fall protection rigged, openings covered; ES pending), 13 quality (author-translated
ES): deck sound/dry, drip edge lap order, ice barrier extent, underlayment laps, low-slope underlayment,
nail zone, nail count/depth, joint stagger, valley lining, wall/step flashing, pipe flashing, cold weather.

## Inspection / acceptance checkpoints
- sheathing: deck nailing before underlayment.
- roof_dry_in: drip edge, ice barrier, underlayment, flashings, fall protection for inspector access.
- final: shingle fastening/caps, ventilation open, kick-out + gutters, cleanup.

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| B-RF-ICE-WATER-SF | Self-adhered ice & water barrier | SF | 60 | 0.006 | 0 | 10 | platform estimate (roll ≈2 sq @ $110–140) |
| B-RF-DRIP-EDGE-LF | Metal drip edge | LF | 100 | 0.02 | 0 | 5 | platform estimate |
| B-RF-RIDGE-VENT-LF | Ridge vent + cap shingles | LF | 450 | 0.08 | 0 | 5 | platform estimate |
| B-RF-TEAROFF-SQ | Tear-off 1 layer incl. disposal | SQ | 0 | 1.0 | 2500 | 0 | platform estimate (roll-off share) |
| B-RF-PIPE-BOOT-EA | Pipe flashing boot | EA | 1800 | 0.3 | 0 | 0 | platform estimate |
| B-RF-STEP-FLASH-LF | Step flashing at walls | LF | 150 | 0.06 | 0 | 10 | platform estimate |

## Quantity rules
- `B-RF-ICE-WATER-SF` = area_sf_sum × 0.3 (ceil)
- `B-RF-DRIP-EDGE-LF` = area_sf_sum × 0.1 (ceil)
- `B-RF-RIDGE-VENT-LF` = area_sf_sum × 0.02 (ceil)
- `B-RF-PIPE-BOOT-EA` = area_sf_sum × 0.0015 (ceil)
- Tear-off and step flashing: no blueprint basis (reroof scope / wall-intersection length not extracted) → manual.

## Blueprint callouts (components)
None this wave (core `metal_roofing`, `roof_sheathing`, `engineered_trusses` already exist).

## Open questions → REVIEW_QUEUE
- 12 hazards + 2 safety QA + 10 inspection-checklist items need human Spanish translation.
- All 6 assembly costs are platform estimates.
- Ice-barrier quantity rule fires everywhere; no climate/jurisdiction flag exists to gate it to cold regions.
- Heat-illness hazard cites 1926.21(b)(2) (general training) — no heat-specific 1926 section.
- osha.gov returns 403 to scripts; OSHA 3755 URL taken from search, mirror at wbdg.org.
