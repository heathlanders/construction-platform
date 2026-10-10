# Dossier — `flooring_carpet` (Flooring — Carpet)

> Wave: w03 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/flooring_carpet.ts` · Status: draft
> Taxonomy: category `interior` · permit_trade `null` · phase `finishes_interior` · CSI `09 68`

## Scope (2–4 sentences)
Installs carpet: residential stretch-in broadloom over cushion and tack strip (CRI 105), and commercial
glue-down broadloom and carpet tile (CRI 104). Includes substrate acceptance, slab moisture testing,
seams, stairs, transitions, tear-out of old carpet, cleaning and protection. Does NOT do floor leveling
beyond patching (→ `underlayment_leveling`), asbestos abatement of old flooring (→ `abatement`), or base
/ trim (→ `finish_carpentry` / `flooring_resilient`).

## Existing coverage reconciled
- Hand recipe: `lib/task-buildout/nopermit.ts` shared flooring branch (Prep & acclimate → Install flooring)
  → pack **complements** (`recipes: []`): glossary, hazards, QA, owner/spec hold points, assemblies, quantities.
- Catalog codes already seeded: `G-FLOOR-CARPET-SY` (carpet + pad, migration 0037) — not redeclared; a
  quantity rule now seeds it for residential projects (no hand seeder existed for it).
- Blueprint template tasks: "Flooring installation" (residential-sf), "Flooring — carpet, tile & luxury
  vinyl tile" (commercial), "Office flooring (carpet, LVT, tile)" (industrial). Hand recipe handles them.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| flooring_carpet-ufgs-09-68-00 | UFGS 09 68 00 Carpeting (Nov 2024) | 1 | public_domain | prep, moisture tests, seams, tile, ventilation, cleaning, attic stock |
| flooring_carpet-cri-104 | CRI 104 commercial install standard | 4 | association_public | moisture/alkalinity testing, carpet tile |
| flooring_carpet-cri-105 | CRI 105 residential install standard | 4 | association_public | acclimation, cushion, seams, power stretching, tack strip, transitions, stairs |
| flooring_carpet-shaw-plan | Shaw Floors carpet installation planning | 5 | manufacturer_public | cushion must meet carpet warranty |
| ecfr-1926-c/d/e/f/h/i/z | 29 CFR 1926 | 1 | public_domain | hazards |

## Work steps
Hand recipe (nopermit.ts) — unchanged. No gates (no permit path).

## Hazards
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| knee_trauma | Knee kicker / kneeling knee damage | 1926.95(a) | 2 |
| adhesive_vapors | Adhesive / solvent vapors | 1926.57(a) | 3 |
| flammable_adhesive | Solvent adhesive ignition | 1926.151(a)(3) | 3 |
| knife_cuts | Carpet knife cuts | 1926.301(a) | 3 |
| tack_strip_debris | Tack strip punctures, trips | 1926.25(a) | 2 |
| roll_lifting | Heavy roll lifting | 1926.21(b)(2) | 3 |
| roll_storage | Stacked rolls rolling off | 1926.250(a)(1) | 3 |
| stretcher_kickback | Power stretcher slip/kickback | 1926.300(a) | 2 |
| seaming_iron | Seaming iron burns/shock | 1926.302(a)(1) | 2 |
| old_flooring_asbestos | Pre-1981 flooring / cutback under old carpet | 1926.1101(k)(1) | 4 |
| slab_grinding_silica | Grinding slab high spots | 1926.1153(c)(1) | 3 |

## QA checklist
15 items — substrate, slab moisture (CaCl / RH concept, limits = spec/maker), test spacing, acclimation,
cushion per warranty, seam layout, seam sealing, power stretching, tack strip, transitions, stairs
(safety), tile pattern, dye lot / attic stock, ventilation (safety), cleaning/protection.

## Inspection / acceptance checkpoints
- `substrate_acceptance`, `layout_seam_plan`, `final_walkthrough` (owner/spec hold points — no AHJ).

## Cost basis (all platform baseline, confidence `estimate`)
| Code | Item | Unit | Mat ¢ | Labor hr | Equip ¢ | Waste % |
|---|---|---|---|---|---|---|
| G-CPT-TILE-SF | Carpet tile | SF | 350 | 0.012 | 0 | 5 |
| G-CPT-STAIR-EA | Stair step carpet + cushion | EA | 1500 | 0.35 | 0 | 15 |
| G-CPT-TRANS-EA | Transition molding | EA | 1500 | 0.25 | 0 | 0 |
| G-CPT-REMOVE-SY | Tear-out carpet/cushion/strip | SY | 0 | 0.08 | 60 | 0 |
| G-CPT-CUSHION-UPG-SY | Premium / barrier cushion adder | SY | 250 | 0 | 0 | 8 |
| G-CPT-MOIST-TEST-EA | Slab moisture test | EA | 3500 | 0.75 | 0 | 0 |

## Quantity rules
- `G-FLOOR-CARPET-SY` = area_sf_sum × 0.0445 (≈40% ÷ 9), residential
- `G-CPT-TRANS-EA` = rooms × 0.5, residential
- `G-CPT-TILE-SF` = area_sf_sum × 0.35, commercial/industrial
- `G-CPT-MOIST-TEST-EA` = area_sf_sum × 0.00035 + 3, commercial/industrial

## Blueprint callouts (components)
None this wave.

## Open questions → REVIEW_QUEUE
- All 6 costs are platform estimates.
- UFGS 09 68 13 / 09 68 16 PDFs 403 on WBDG (likely absent); 09 68 00 used.
- Mohawk install page could not be verified as real content; not cited.
- Hand recipe step 2 renders the taxonomy label "Flooring — Carpet" → smoke flags the em-dash as an
  unresolved placeholder (hand text, not the pack).
- No stair component token exists → G-CPT-STAIR-EA has no quantity rule.
