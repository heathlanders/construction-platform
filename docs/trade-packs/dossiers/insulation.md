# Dossier — `insulation` (Insulation — Batt / Blown / Rigid)

> Wave: w01 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/insulation.ts` · Status: draft
> Taxonomy: category `envelope` · permit_trade `building` · phase `insulation` · CSI `07 21`

## Scope (2–4 sentences)
Installs thermal insulation in the building envelope — fiberglass/mineral-wool batts, blown loose-fill
(cellulose/fiberglass) and rigid foam board — in walls, attic floors, floors over unconditioned space,
rim joists and at foundations/slab edges, plus the air sealing, eave baffles and attic hatch work that the
insulation inspection checks. Hand-offs: spray polyurethane foam → `spray_foam`; house wrap / exterior air
barrier → `air_barrier`; sound batts in party walls are often by `drywall`; firestopping → `firestopping`.

## Existing coverage reconciled
- Hand recipe: `task-buildout/building.ts` insulation branch ("Install insulation & air seal", gate
  `insulation`, refs `N1102`) → pack **complements** (`recipes: []`): adds QA, hazards, inspection checklist,
  code refs, glossary, assemblies.
- Catalog codes already seeded: `B-INSUL-SF` (generic insulation per SF, seeded from summed room area by
  `quantities.ts`). Pack adds `B-INS-*` add-ons only; blown-attic and rigid-foundation assemblies have **no**
  quantity rule so they don't double-count `B-INSUL-SF` (estimator adds them manually / swaps).
- Blueprint template tasks (10): "Wall & ceiling batt insulation", "Attic insulation", "Wall & roof insulation —
  production & office", "Exterior insulation & air barrier", "Wall, floor & ceiling batt insulation", "Attic &
  roof insulation", "Sound attenuation (party walls & floors)", "Wall & roof insulation — all floors", "Acoustic
  insulation — conference rooms & restrooms", "Roof & wall insulation (banded / batt)" — all handled by the hand
  recipe's `trade === 'insulation'` branch.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| energy-star-rater-checklist | ENERGY STAR National Rater Field Checklist Rev 12 | 1 | gov_open | QA (Grade I, aligned air barrier, eaves, slab edge, rim, hatch, ICAT lights) |
| doe-basc-ins-aligned-ab | BASC — Fully Aligned Air Barriers | 1 | gov_open | QA aligned air barrier |
| doe-basc-ins-windwash | BASC — Wind Washing | 1 | gov_open | QA baffles |
| doe-basc-ins-baffles | BASC — Look For and Install Attic Vent Baffles | 1 | gov_open | QA baffles, assembly B-INS-BAFFLE-EA |
| naima-library | Insulation Institute (NAIMA) resource library | 4 | association_public | QA chimney clearance (derived) |
| resnet-301 | ANSI/RESNET/ICC 301 grading | 3 | proprietary_ref_only | Grade I term (ref only) |
| icc-pa | ICC public access (IECC/IRC) | 3 | proprietary_ref_only | code_refs, QA refs (paraphrase only) |
| ecfr-1926-c/d/e/k/m/x, ecfr-1926 | 29 CFR 1926 | 1 | public_domain | hazards |
| platform-baseline | The Jobsite baseline | — | platform_estimate | all assembly costs |

## Work steps
Hand recipe kept (1 step: air seal → install to R-value → vapor retarder → insulation inspection).

## Hazards
| id | Hazard | Controls | OSHA ref | Sev |
|---|---|---|---|---|
| fiber_dust | Fiber/dust inhalation | N95+, ventilate | 1926.103 | 2 |
| airborne_limits | Dust/vapor over limits | SDS, Table 1 limits, exhaust | 1926.55(a) | 2 |
| eye_fibers | Eye injury from fibers/foam | glasses/goggles | 1926.102(a)(1) | 2 |
| fall_through_ceiling | Fall through ceiling between joists | walk boards, step on framing | 1926.501(a)(2) | 3 |
| open_holes | Fall through stairwell/chase/hatch holes >6 ft | cover/guard holes | 1926.501(b)(4)(i) | 4 |
| ladder | Ladder at attic hatch | 3 ft extension, footing | 1926.1053(b)(1) | 3 |
| live_wiring | Shock from energized wiring | identify/de-energize, no stapling cables | 1926.416(a)(1) | 3 |
| attic_heat | Heat stress | schedule, water/shade, train | 1926.21(b)(2) | 3 |
| confined_attic | Confined attic/crawlspace | competent-person evaluation | 1926.1203(a) | 3 |
| foam_fire | Fire from foam/facings | no flame/smoking, keep heat away | 1926.151(a)(3) | 3 |

All `hazard_es`/`controls_es` = pending human translation.

## QA checklist
- [ ] R-value matches plan/compliance report — ENERGY STAR 1.2
- [ ] Grade I fill (no gaps/voids/compression) — ENERGY STAR 1.3, RESNET 301 (ref)
- [ ] R-value labels or installer certificate — IECC R303.1.1
- [ ] Air sealing before cover — ENERGY STAR §4
- [ ] Insulation in contact with complete aligned air barrier — ENERGY STAR §2, BASC
- [ ] Baffles in every vented bay above insulation height — BASC, ENERGY STAR §2
- [ ] Full depth over exterior top plates — ENERGY STAR 3.1
- [ ] Attic depth level + markers ~every 300 SF facing access — IECC R303.1.1.1
- [ ] Attic hatch insulated + weatherstripped + dam — ENERGY STAR 4.10, IECC R402.2.4
- [ ] Recessed lights ICAT / clearances (safety) — ENERGY STAR 4.2
- [ ] Chimney/flue clearance + noncombustible dam (safety) — derived (listing governs)
- [ ] Foam plastic covered by thermal/ignition barrier (safety) — IRC R316 (ref)
- [ ] Vapor retarder class/side per climate zone — IRC R702.7 (ref)
- [ ] Rim/band joists insulated + sealed — ENERGY STAR 2.7
- [ ] Slab-edge/foundation rigid continuous — ENERGY STAR 3.2

## Inspection / acceptance checkpoints
- `insulation`: type/R-value per compliance docs; labels/certificate; air sealing complete; full cavity fill;
  eave baffles + hatch; clearances at lights/flues; vapor retarder.
- `final`: attic depth + markers; insulation certificate posted (IECC R401.3).

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| B-INS-BLOWN-ATTIC-SF | Blown attic loose-fill ~R-49 | SF | 85 | 0.005 | 5 | 5 | platform-baseline, estimate |
| B-INS-RIGID-FDN-SF | Rigid foam ~2 in. foundation/slab edge | SF | 125 | 0.02 | 0 | 8 | platform-baseline, estimate |
| B-INS-AIRSEAL-EA | Whole-house air sealing package | EA | 25000 | 10 | 0 | 0 | platform-baseline, estimate |
| B-INS-BAFFLE-EA | Eave baffle per bay | EA | 150 | 0.05 | 0 | 5 | platform-baseline, estimate |
| B-INS-RIM-LF | Rim joist insulate + seal | LF | 300 | 0.08 | 0 | 10 | platform-baseline, estimate |

No public unit-price source for residential insulation found (DOT bid tabs don't cover it) → all `estimate`.

## Quantity rules
- `B-INS-AIRSEAL-EA` = const × 1 (residential_sf) — one package per dwelling
- `B-INS-BAFFLE-EA` = area_sf_sum × 0.025, ceil (residential) — ≈1 baffle per 40 SF floor
- `B-INS-RIM-LF` = area_sf_sum × 0.09, ceil (residential) — perimeter ≈ 0.09 LF/SF

## Blueprint callouts (components)
None — `batt_insulation` and `vapor_barrier` are core tokens.

## Open questions → REVIEW_QUEUE
- 13 safety ES items pending (10 hazards + 3 QA); 7+2 inspection checklist items pending ES.
- All 5 assembly costs `estimate`-only.
- IRC N-section numbering differs by edition (N1101.10.1.1 in 2021 vs N1101.10.1 in 2018); recessed-lighting
  section omitted (R402.4.5 vs R402.4.6 across editions).
- Heat stress has no 1926 standard — cited 1926.21(b)(2) training; review.
- Vocab proposal: `insulation_blower` equipment type (blowing machine) — not in equipment-vocab.
- BASC deep-link resource guides for attic depth markers / rim joists not found (site returns soft redirects).
