# Dossier — `air_barrier` (Air / Vapor Barrier)

> Wave: w09 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/air_barrier.ts` · Status: draft
> Taxonomy: category `envelope` · permit_trade `building` · phase `insulation` · CSI `07 27`

## Scope (2–4 sentences)
Installs the continuous air barrier of the building enclosure: fluid-applied and self-adhered sheet
membranes on exterior sheathing or masonry backup, transition membranes at openings, roof edge and
foundation, plus interior sheet vapor retarders. Proves the work with a mock-up, wet-mil and adhesion
checks, staged inspections and (when specified) a whole-building air leakage test. Does NOT do
residential housewrap / WRB (siding pack, `B-SID-WRB-SF`), window flashing (windows pack), spray foam
(spray_foam pack), under-slab vapor retarder (concrete) or thru-wall flashing (sheet_metal_flashing).

## Existing coverage reconciled
- Hand recipe: none (family building.ts insulation branch is generic) → pack = NEW-TRADE recipes.
- Catalog codes already seeded: none for air barriers; `B-SID-WRB-SF` (siding) and `B-INS-AIRSEAL-EA`
  (insulation, residential whole-house air sealing) left alone — not duplicated.
- Blueprint template tasks hitting this trade: none. The OCR `vapor_barrier` component creates an
  augment task under trade `insulation`, so it does not route here; the pack uses the token only as a
  quantity-rule fact.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| air_barrier-ufgs-07-27-10 | UFGS 07 27 10 Building Air Barrier System (08/23) | 1 | public_domain | mock-up, daily reports, QC list (priming 2 in. past edge, laps, fishmouths, thickness, adhesion) |
| air_barrier-ufgs-07-27-19-01 | UFGS 07 27 19.01 Self-Adhering Air Barriers (08/23 chg 1) | 1 | public_domain | substrate exam, priming, lap sizes, 12 in. corner strip, transitions, end-of-day top edge, 5/50/95 % inspections, exposure limit |
| air_barrier-ufgs-07-27-26 | UFGS 07 27 26 Fluid-Applied Membrane Air Barriers (08/23) | 1 | public_domain | mock-up ≥54 SF, D4263 moisture test, transition membrane first, wet film → DFT (spec note ~40/60 mil), 3 in. lap over transition, termination sealant |
| air_barrier-abaa-qap | ABAA Quality Assurance Program | 4 | association_public | installer certification / audit context only (protocols ref-only) |
| doe-basc-ins-aligned-ab | DOE BASC Fully Aligned Air Barriers | 1 | gov_open | interior vapor retarder continuity + alignment |
| icc-pa | IECC C402.5 / R402.4, IBC 1404.3, IRC R702.7 | 3 | proprietary_ref_only | section numbers + paraphrase |
| ecfr-1926-c/d/e/f/k/l/m/x | 29 CFR 1926 | 1 | public_domain | hazards |

## Work steps (draft → pack recipes)
- `fluid_applied` (title_re air barrier / AVB / fluid- or liquid-applied; default): pre-install meeting +
  mock-up → substrate exam/prep → transition membranes → spray/roll to thickness → inspect & test before
  cover (gate `sheathing`, IECC C402.5.1.1) → whole-building test support (gate `final`, IECC C402.5).
- `self_adhered_sheet` (priority 10; self-adhered / peel-and-stick / sheet membrane): mock-up + substrate
  → prime → corners/transitions/penetrations → shingle-lapped field sheets → inspect, test, protect
  (gate `sheathing`).
- `interior_vapor_retarder` (priority 5; vapor barrier/retarder or poly sheet, NOT when the title says
  "air"): class + side → hang, tape, seal perimeter → seal penetrations (gate `insulation`, IRC R702.7,
  IBC 1404.3, IECC R402.4.1.1).

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| scaffold_fall | fall from scaffold | 1926.451(g)(1) | 4 |
| aerial_lift | thrown from lift basket | 1926.453(b)(2)(v) | 4 |
| edge_fall | roof/floor edge at tie-ins | 1926.501(b)(1) | 4 |
| ladder | ladder slip | 1926.1053(b)(1) | 3 |
| chem_hazcom | primers/adhesives/mastics | 1926.59 | 2 |
| solvent_vapor | solvent vapor exposure | 1926.55(a) | 3 |
| ventilation | enclosed-space vapor build-up | 1926.57(a) | 3 |
| respirator | spray mist | 1926.103 | 3 |
| flammable | solvent primers near ignition | 1926.152(a)(1) | 3 |
| spray_injection | airless tip injection (training) | 1926.21(b)(2) | 4 |
| eye_flying | splash / overspray / brushing | 1926.102(a)(1) | 2 |
| cord_shock | cords on wet site | 1926.404(b)(1) | 3 |

## QA checklist
15 items (13 non-safety, translated ES; 2 safety, pending ES): mock-up approved, substrate sound/dry +
compatible sealants, transitions supported, continuity, wet-mil readings + 3 in. lap, penetrations
sealed, primer/laps/rolled/top-edge, adhesion test, 5/50/95 % inspections + daily report, exposure
limit, whole-building test, VR class/side, VR continuous/aligned, spray zone safe*, tie-off*.

## Inspection / acceptance checkpoints
- sheathing: exposed and complete; transitions bonded; penetrations sealed, laps shingled.
- insulation: continuous air-barrier path as drawn; interior VR class/side/taped/sealed.
- final: air leakage test report (when used); QC + adhesion reports on file.

## Cost basis (all `platform-baseline`, confidence `estimate`)
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % |
|---|---|---|---|---|---|---|
| B-AB-FLUID-SF | fluid-applied AB 40–60 dry mil | SF | 150 | 0.02 | 8 | 10 |
| B-AB-SA-SF | self-adhered sheet + primer | SF | 190 | 0.03 | 5 | 12 |
| B-AB-TRANS-LF | transition membrane | LF | 160 | 0.05 | 0 | 10 |
| B-AB-MOCKUP-EA | mock-up + field testing (AB share) | EA | 60000 | 16 | 150000 | 0 |
| B-AB-BLDG-TEST-EA | whole-building air leakage test | EA | 30000 | 16 | 600000 | 0 |
| B-AB-VR-POLY-SF | interior 6-mil poly VR | SF | 12 | 0.006 | 0 | 10 |

## Quantity rules
- `B-AB-FLUID-SF` = area_sf_sum × 0.8 (commercial / MF / industrial) — wall ≈ 0.8 × floor area; pick fluid OR sheet.
- `B-AB-TRANS-LF` = windows × 16 (commercial / MF / industrial).
- `B-AB-MOCKUP-EA` = const 1 (commercial / industrial).
- `B-AB-BLDG-TEST-EA` = const 1 (commercial / industrial) — remove if not on the compliance path.
- `B-AB-VR-POLY-SF` = area_sf_sum × 1 when `vapor_barrier` callout (residential_sf / pole_barn).

## Blueprint callouts (components)
- none new (reuses existing `vapor_barrier` token as a fact only).

## Open questions → REVIEW_QUEUE
- IECC section numbers are 2021 numbering (C402.5 / R402.4); 2024 IECC renumbers commercial air leakage — confirm per adopted edition.
- Equipment vocab lacks an `airless_sprayer` type (generator used as proxy).
- All 6 costs are estimates; whole-building test fee varies widely with building size.
- ABAA site blocks scripted fetches (bot check); program URL is the one UFGS cites.
