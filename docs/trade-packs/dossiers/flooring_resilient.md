# Dossier — `flooring_resilient` (Flooring — Resilient / LVP)

> Wave: w03 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/flooring_resilient.ts` · Status: draft
> Taxonomy: category `interior` · permit_trade `null` · phase `finishes_interior` · CSI `09 65`

## Scope (2–4 sentences)
Installs resilient floors: luxury vinyl plank/tile (click-lock floating and glue-down), sheet vinyl
(chemically sealed or heat-welded seams, flash cove), VCT and rubber tile/sheet in light commercial,
plus resilient wall base, transitions and stair treads. Includes substrate moisture/pH testing, spot
patching and removal of existing non-asbestos resilient flooring. Hands off: full-floor self-leveling
underlayment (`underlayment_leveling`), asbestos abatement (`abatement`), floor finishing/polish
programs (`final_clean`), wood and carpet (`flooring_wood`, `flooring_carpet`).

## Existing coverage reconciled
- Hand recipe: `task-buildout/nopermit.ts` shared flooring branch (Prep & acclimate → Install flooring) → pack **complements** (`recipes: []`).
- Catalog codes already seeded: `G-FLOOR-LVP-SF` (referenced from a quantity rule, not redeclared), `G-DEMO-SF` (generic interior demo — the new `G-RES-REMOVE-SF` is resilient-specific scrape-off).
- Blueprint template tasks hitting this trade: residential-mf.ts sort 36 (`finishes_interior`, CSI 09 65 00) — handled by the hand recipe.
- No permit path → no gates, no code_refs. Owner/GC hold points in `inspection_checklists`: `substrate_moisture`, `existing_floor_removal`, `final_walkthrough`.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| flooring_resilient-ufgs-09-65-00 | UFGS 09 65 00 Resilient Flooring (Nov 2024) — Part 3 read in full | 1 | public_domain | flatness 3/16 in 10 ft, F1869/F2170 + pH + bond test, layout (no border < ½ tile), heat-welded seams, base hand-rolled, mouldings, cleaning, protection |
| ecfr-1926-z | 29 CFR 1926 Subpart Z (1926.1101(g)(8)(i), (k); 1926.1153) | 1 | public_domain | asbestos flooring removal practices, PACM presumption (flooring installed ≤1980), silica |
| ecfr-1926-c/d/e/f/h/i/k | 1926.25, .59, .95, .102, .152, .250, .300, .404 | 1 | public_domain | housekeeping, HazCom, PPE, eye, flammables, storage, power tools, GFCI |
| flooring_resilient-rfci-rwp | RFCI Recommended Work Practices for Removal of Resilient Floor Coverings (Jan 2018) | 4 | association_public | presume ACM unless tested; no sand/dry-scrape/chip |
| flooring_resilient-armstrong-f5061 | Armstrong F-5061 Ch. V Installation Systems | 5 | manufacturer_public | 48 h conditioning, 65–100 °F, pH 5–9, 100 lb roller, cutback/asbestos warning, joints 6 in off substrate joints |
| flooring_resilient-ahf-sheet | AHF commercial sheet vinyl instructions | 5 | manufacturer_public | heat-weld groove ½–⅔ wear layer, two-pass trim, 100 lb 3-section roller, 72 h no rolling loads |
| flooring_resilient-shaw-homog-tile | Shaw/Patcraft homogeneous resilient tile (glue-down) | 5 | manufacturer_public | F2170 ≤90% RH, 3 tests/1,000 SF + 1/added 1,000 SF, pH 7–10, trowel + open time, 12 h/24 h traffic |
| flooring_resilient-coretec-install | COREtec Scratchless (floating) | 5 | manufacturer_public | 1/4 in gap (<2,500 SF) / 1/2 in larger, glue-down under cabinets/islands, 6 mil poly over concrete |
| flooring_resilient-tarkett-lvt | Tarkett InStudio glue-down LVP | 5 | manufacturer_public | 65–85 °F, 40–60% RH, 48 h before/after, ≤90% RH F2170, 75–100 lb roller, asbestos presumption |
| flooring_resilient-astm-f710 | ASTM F710 | 3 | proprietary_ref_only | concept only (concrete prep), cited via UFGS |
| platform-baseline | — | — | platform_estimate | all assembly costs |

## Work steps
Hand recipe kept (Prep & acclimate → Install flooring). Pack adds QA ids that refine it:
substrate_flat_clean, moisture_ph_tested, bond_test, conditions_acclimation, patch_feathered, layout_square,
trowel_open_time, rolled_100lb, floating_gap, seams_welded, transitions_base, clean_protect.

## Hazards
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| asbestos_flooring | ACM in old tile/sheet/cutback | 1926.1101(g)(8)(i) | 4 |
| silica_prep | grinding concrete / patch | 1926.1153 | 3 |
| adhesive_vapors | adhesive/primer/stripper vapors | 1926.59 | 2 |
| flammable_products | solvent products near ignition | 1926.152 | 3 |
| knife_cuts | utility/hook knives | 1926.95(a) | 2 |
| knee_strain | kneeling | 1926.95(a) | 2 |
| carton_lifting | cartons, rolls, pails | 1926.250(a)(1) | 2 |
| power_stripper | floor scraper | 1926.300(a) | 3 |
| cord_shock | cords/tools | 1926.404(b)(1) | 3 |
| eye_injury | chips/splash | 1926.102(a)(1) | 2 |
| slip_trip | scraps, wet adhesive | 1926.25(a) | 1 |

## QA checklist
14 items (1 safety: asbestos clearance before removal). See pack.

## Inspection / acceptance checkpoints
- `substrate_moisture`: test results within limits, test count per mfr, flatness + patch dry.
- `existing_floor_removal`: asbestos survey/lab result on site (safety, ES pending); adhesive residue thin film.
- `final_walkthrough`: adhered/flat/no telegraphing; transitions/base/gaps; attic stock + maintenance docs.

## Cost basis (all `platform-baseline`, confidence `estimate`)
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % |
|---|---|---|---|---|---|---|
| G-RES-SHEET-SF | Sheet vinyl glue-down | SF | 275 | 0.03 | 2 | 12 |
| G-RES-VCT-SF | VCT 12 in. | SF | 130 | 0.02 | 1 | 5 |
| G-RES-BASE-LF | 4 in. rubber/vinyl base | LF | 160 | 0.03 | 0 | 5 |
| G-RES-REMOVE-SF | Remove non-ACM resilient + scrape | SF | 4 | 0.025 | 8 | 0 |
| G-RES-UNDERLAY-SF | Underlayment pad for floating plank | SF | 45 | 0.004 | 0 | 8 |

Self-leveling patch NOT added — belongs to `underlayment_leveling`.

## Quantity rules
- `G-RES-BASE-LF` = rooms × 30 (commercial, industrial)
- `G-RES-VCT-SF` = area_sf_sum × 0.3 (commercial)
- `G-FLOOR-LVP-SF` (existing) = area_sf_sum × 0.35 (residential_sf, residential_mf)

## Blueprint callouts (components)
None this wave.

## Open questions → REVIEW_QUEUE
- 11 hazards + 1 safety QA + 1 checklist item need human ES.
- All 5 assemblies are `estimate`.
- No UFGS 09 65 19 exists; used 09 65 00 (covers 09 65 13/16/19 scope).
- Vocab: `floor_stripper` (walk-behind floor scraper) not in equipment vocab.
- Area-share rules (LVP 35% residential, VCT 30% commercial) may overlap sibling flooring packs' area rules — cross-check at wave review.
