# Dossier — `flooring_epoxy` (Flooring — Epoxy / Resinous)

> Wave: w15 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/flooring_epoxy.ts` · Status: draft
> Taxonomy: category `interior` · permit_trade `null` · phase `finishes_interior` · CSI `09 67`

## Scope (2–4 sentences)
Seamless resin floors bonded to concrete: thin-film epoxy/urethane coatings, broadcast quartz and flake
(chip) systems incl. residential garage floors, troweled epoxy mortar, urethane cement and MMA. Most of
the work is substrate acceptance (moisture testing), mechanical prep to a CSP, crack/joint detailing,
then mixing to ratio and placing coats inside pot life / recoat windows. Hand-offs: slab placement and
curing (`concrete`), polished concrete and its joint fill (`concrete_polishing`), self-leveling
underlayment (`underlayment_leveling`), terrazzo incl. resinous terrazzo (`terrazzo`).

## Existing coverage reconciled
- Hand recipe: `task-buildout/nopermit.ts` shared flooring branch (Prep & acclimate → Install flooring);
  `flooring_epoxy` ∈ HAND_RECIPE_KEYS → pack **complements** (`recipes: []`, like framing.ts).
- Catalog codes already seeded: `G-FLOOR-EPOXY-SF` (0037, prep + 2 coats) — referenced by a quantity rule,
  not redeclared. `G-POL-JOINTFILL-LF` (concrete_polishing) — joint fill priced there, not duplicated.
- Blueprint template tasks: industrial `Production floor epoxy coating & joint fill` (09 67 23).

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| flooring_epoxy-ufgs-09-67-23-13 | UFGS 09 67 23.13 Standard Resinous Flooring | 1 | public_domain | moisture tests, cure age, ignition 50 ft, mixing temp, thickness/flatness, sealer recoat, cove, protection |
| flooring_epoxy-ufgs-09-67-23-14 | UFGS 09 67 23.14 Chemical Resistant Resinous Flooring | 1 | public_domain | temp window 48 h/1 wk, D4263 sheet check, prep by contamination, primer ponding |
| flooring_epoxy-nyogs-096723 | NYS OGS master spec 09 67 23 | 1 | gov_open | mockup, F2170 frequency + 75% RH, 24 h no traffic, broadcast, cores |
| flooring_epoxy-mapei-install-guide | MAPEI Mapefloor installation instructions | 5 | manufacturer_public | CSP 3–6 by shotblast, pull-off 200 psi, dew point +5 °F, pot life vs heat, wet-film gauges |
| flooring_epoxy-cpwr-epoxy-skin | CPWR epoxy skin protection guide (NIOSH-funded) | 4 | association_public | sensitization, gloves, wash stations |
| flooring_epoxy-niosh-npg-mma | NIOSH NPG — Methyl methacrylate | 1 | gov_open | MMA 100 ppm, irritation/dermatitis |
| concrete_repair_lifting-niosh-96-111 (reuse) | NIOSH 96-111 isocyanates | 1 | public_domain | urethane topcoat asthma |
| concrete_repair_lifting-icri-guidelines (reuse) | ICRI 310.2R CSP | 4 | proprietary_ref_only | CSP concept only |
| flooring_epoxy-astm-f2170 / -f1869 | ASTM moisture tests | 3 | proprietary_ref_only | method names only |
| ecfr-1926-c/d/e/f/k/z | 29 CFR 1926 | 1 | public_domain | hazards |

## Work steps
Hand recipe kept (2 steps). Pack adds QA ids and hold points around it.

## Hazards (12)
epoxy_skin_sensitizer 1926.95(a) · wash_station 1926.51(f)(1) · vapor_enclosed_rooms 1926.57(a) ·
mma_monomer 1926.55(a) · isocyanate_topcoat 1926.103 · ignition_vapors 1926.151(a)(3) ·
flammable_storage_exotherm 1926.152(a)(1) · silica_floor_grinding 1926.1153(c)(1) (Table 1 xii/xiii) ·
silica_shot_blast 1926.1153(d) (not a Table 1 task) · eye_splash 1926.102(a)(1) ·
electrical_cords 1926.404(b)(1)(ii) · slip_trip 1926.25(a).

## QA checklist (15; 3 safety)
slab_cured, moisture_tested, plastic_sheet_check, profile_csp, pull_off, cracks_joints, temp_dew_point,
mix_ratio, film_thickness, recoat_window, slip_texture (safety), finish_flat, cove_base,
cure_before_traffic (safety), ignition_control_posted (safety).

## Inspection / acceptance checkpoints (owner hold points — no permit path)
substrate_acceptance · mockup_approval · between_coats · final_acceptance.

## Cost basis (all `platform-baseline`, estimate)
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % |
|---|---|---|---|---|---|---|
| G-EPX-SHOTBLAST-SF | Shot-blast/grind to CSP 3–5 | SF | 6 | 0.006 | 14 | 0 |
| G-EPX-MVB-PRIMER-SF | Moisture-mitigation epoxy primer | SF | 165 | 0.008 | 0 | 8 |
| G-EPX-FLAKE-SF | Flake (chip) system | SF | 240 | 0.02 | 0 | 10 |
| G-EPX-UCRETE-SF | Urethane cement 1/4 in. | SF | 600 | 0.05 | 5 | 6 |
| G-EPX-COVE-LF | Integral cove 4 in. | LF | 280 | 0.12 | 0 | 10 |

## Quantity rules
- `G-FLOOR-EPOXY-SF` = area_sf_sum × 0.15 (industrial) — coated production/wash/lab rooms.
- `G-EPX-COVE-LF` = area_sf_sum × 0.04 (industrial) — cove around coated rooms.
(Flake/urethane cement/MVB/prep not auto-seeded — no blueprint fact distinguishes them.)

## Blueprint callouts (components)
None this wave.

## Open questions → REVIEW_QUEUE
- Spanish safety text pending (12 hazards, 3 QA, inspection checklist items).
- All 5 assembly costs are platform estimates.
- Equipment vocab lacks `shot_blaster` / `floor_grinder` / `dust_extractor`; only `generator` used.
- Generic equipment rule matches both hand-recipe steps (title-based); acceptable but noisy.
