# Dossier — `flooring_wood` (Flooring — Hardwood)

> Wave: w03 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/flooring_wood.ts` · Status: draft
> Taxonomy: category `interior` · permit_trade `null` · phase `finishes_interior` · CSI `09 64`

## Scope (2–4 sentences)
Solid and engineered hardwood floors: moisture testing and acclimation, subfloor flattening, underlayment /
vapor retarder, nail-down, glue-down or floating installation, site sanding and finishing (and sand-and-refinish
of existing floors), stair treads and transitions. Base/shoe trim goes to `finish_carpentry`, wall paint to
`painting`, resilient/LVP to `flooring_resilient`. No AHJ permit path → no gates, no code refs.

## Existing coverage reconciled
- Hand recipe: `task-buildout/nopermit.ts` shared flooring branch (Prep & acclimate → Install flooring) → pack **complements** (`recipes: []`).
- Catalog codes already seeded: `G-FLOOR-HARDWOOD-SF` (0037, installed + finished) — referenced from a quantity rule, not redeclared.
- Blueprint template tasks hitting this trade: none (0 template tasks). No hand-seeded estimating line for hardwood.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| flooring_wood-ufgs-09-64-29 | UFGS 09 64 29 Wood Strip and Plank Flooring (Chg 2, 11/18) | 1 | public_domain | storage/MC, environment, slab flatness, joints, expansion, sanding, seal timing, protection |
| flooring_wood-niosh-npg-wood-dust | NIOSH Pocket Guide — Wood dust | 1 | gov_open | carcinogen framing (REL Ca 1 mg/m3) |
| ecfr-1926-d / -e / -f / -h / -i / -k / -z | 29 CFR 1926 Subparts D, E, F, H, I, K, Z | 1 | public_domain | hazards (1926.55, .57, .52, .102, .95, .151, .252(e), .300, .302, .404, .1153) |
| flooring_wood-shaw-hardwood-install | Shaw Floors — Hardwood Installation | 5 | manufacturer_public | HVAC running, expansion ≥ thickness, undercut jambs, mixed cartons, install methods |
| flooring_wood-nwfa-guidelines | NWFA Installation + Sand & Finish Guidelines | 4 | proprietary_ref_only | concepts only (MC difference by width, acceptance, coat schedule) |
| platform-baseline | Platform baseline | — | platform_estimate | all assembly costs |

## Work steps (draft → pack recipes)
None — hand recipe kept. Pack adds an optional `air_compressor` equipment hint (pneumatic flooring nailer).

## Hazards (draft → pack hazards)
| id | Hazard | Controls | OSHA ref | Sev |
|---|---|---|---|---|
| wood_dust | Wood dust (NIOSH potential carcinogen) | dust-containment sanders + HEPA, respirator program | 1926.55(a) | 3 |
| finish_vapors | Solvent/isocyanate vapors | ventilation, SDS respirators | 1926.57(a) | 3 |
| finish_fire | Flammable finish vapor ignition | pilots off, no smoking/flame, approved containers | 1926.151(a)(3) | 4 |
| oily_rags | Spontaneous combustion of oil-finish rags | covered metal water-filled can, out daily | 1926.252(e) | 4 |
| sander_dust_fire | Sander-bag dust smoldering | empty bags outdoors into metal can | 1926.252(e) | 3 |
| drum_sander | Caught in drum / runaway | guards, unplug to change paper | 1926.300(b)(2) | 3 |
| sander_shock | Shock on temp power | GFCI, cord inspection | 1926.404(b)(1)(ii) | 3 |
| pneumatic_nailer | Nail injuries | muzzle safety device, positive coupler | 1926.302(b)(3) | 2 |
| noise | Hearing loss | quieter tools, hearing protection | 1926.52(a) | 2 |
| eye_injury | Flying chips/grit/splash | glasses with side protection | 1926.102(a)(1) | 2 |
| slab_silica | Silica grinding slab for glue-down | Table 1 controls | 1926.1153(c)(1) | 3 |
| adhesive_skin | Urethane adhesive/finish contact | gloves, eye protection | 1926.95(a) | 1 |

## QA checklist
- [ ] Storage in unopened cartons, conditioned like the rooms — UFGS §1.5
- [ ] HVAC running ≥3 days before/during/after — UFGS §1.6, Shaw (65–75°F, 35–55% RH)
- [ ] MC readings logged; difference within maker/NWFA limits — NWFA (ref)
- [ ] Acclimated per maker — Shaw
- [ ] Substrate flat (slab ~1/8 in in 10 ft radius) — UFGS §3.1
- [ ] Vapor retarder / underlayment (6-mil poly on slab) — UFGS §2.5
- [ ] Expansion gap ≥ floor thickness / maker, covered — Shaw, UFGS §3.2
- [ ] End joints ≥6 in stagger, 2 boards between aligned joints — UFGS §3.2
- [ ] Fastener schedule / full adhesive coverage — Shaw (product-specific)
- [ ] Tight, flat, no hollows/squeaks — NWFA (ref)
- [ ] ≥3 sanding cuts, no burns/chatter — UFGS §3.3
- [ ] First seal within ~8 h of final sanding — UFGS §3.3
- [ ] Finish coats per spec with recoat times — NWFA (ref)
- [ ] Transitions/undercut jambs — Shaw
- [ ] Rags/dust disposal daily (safety) — 1926.252(e)

## Inspection / acceptance checkpoints
- moisture_acclimation: MC log, enclosure + HVAC, acclimation done
- subfloor_acceptance: fastened/flat/dry, retarder in place
- sand_finish_review: raking-light bare-wood walk, stain sample approval, fire controls
- final_walkthrough: cured finish + protection, gaps covered, care instructions handed over

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| G-WD-REFINISH-SF | Sand & refinish existing | SF | 45 | 0.03 | 15 | 0 | platform estimate 2026 |
| G-WD-ENG-GLUE-SF | Engineered glue-down + moisture-control adhesive | SF | 700 | 0.035 | 0 | 7 | platform estimate |
| G-WD-STAIR-TREAD-EA | Tread + nosing + riser | EA | 8500 | 1.5 | 0 | 5 | platform estimate |
| G-WD-UNDERLAY-SF | Underlayment / vapor retarder | SF | 18 | 0.003 | 0 | 10 | platform estimate |
| G-WD-FLATPREP-SF | Subfloor flattening | SF | 75 | 0.04 | 5 | 10 | platform estimate |
| G-WD-TRANS-EA | Transition / reducer | EA | 3500 | 0.5 | 0 | 5 | platform estimate |

## Quantity rules
- `G-FLOOR-HARDWOOD-SF` (existing) = area_sf_sum × 0.4 — ≈40% of room area is wood
- `G-WD-UNDERLAY-SF` = area_sf_sum × 0.4
- `G-WD-FLATPREP-SF` = area_sf_sum × 0.04
- `G-WD-TRANS-EA` = doors × 0.34 (ceil)
(All fire only when `flooring_wood` is on the project schedule.)

## Blueprint callouts (components)
- none this wave (a `hardwood_floor` finish-schedule callout would let the area rules scope properly — future wave).

## Open questions → REVIEW_QUEUE
- Smoke shows "⚠ unresolved placeholder" on the hand step "Install Flooring — Hardwood…" — it is the em dash in the taxonomy label interpolated by `nopermit.ts`, not a pack issue.
- Equipment vocab lacks `floor_sander` (drum/belt sander + edger); `air_compressor` used as the only hint.
- Mohawk / Bona install + finishing instructions are JS-rendered / not retrievable as text; not cited.
- All 6 assembly costs are `estimate`.
