# Dossier — `waterproofing` (Waterproofing / Dampproofing)

> Wave: w09 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/waterproofing.ts` · Status: draft
> Taxonomy: category `envelope` · permit_trade `building` · phase `foundation` · CSI `07 10`

## Scope (2–4 sentences)
Below-grade moisture protection: surface prep of cured concrete / parged block, dampproofing (no hydrostatic
head) or membrane waterproofing (high water table), protection / drainage board, footing (subsoil) drain to
daylight, storm or sump, sump basin, and the under-slab vapor retarder. Hand-offs: overdig excavation and
backfill compaction = `excavation`; walls/footings = `concrete` / `formwork` / `masonry`; sump pump + discharge
= `plumbing` (P-PL-SUMP-PUMP-EA); rigid foundation insulation = `insulation` (B-INS-RIGID-FDN-SF); radon riser
= `radon_mitigation`. Plaza/deck/shower waterproofing is out of scope for these recipes (phase-locked to foundation).

## Existing coverage reconciled
- Hand recipe: none for the key — the 4 template tasks fell to the generic foundation branch of
  `task-buildout/building.ts` (footing + walls/slab steps). Pack = NEW-TRADE recipes, phase `foundation`.
- Catalog codes already seeded (not redeclared): B-INS-RIGID-FDN-SF, B-RDN-SUMP-EA (radon sump cover),
  B-RDN-MEMB-SF (crawl membrane), B-RTW-DRAIN-LF (retaining-wall toe drain), P-PL-SUMP-PUMP-EA.
- Blueprint template tasks: 'Waterproofing & damp-proofing' (residential-sf), 'Waterproofing, damp-proofing &
  drainage mat' (residential-mf), 'Waterproofing & below-grade drainage' (commercial), 'Foundation waterproofing &
  vapor barrier' (industrial). All matched by `\bwater-?proofing\b|\bdamp-?proofing\b` (verified with pickRecipe:
  residential_sf → `below_grade_residential`; residential_mf/commercial/industrial → `below_grade_commercial`).

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| waterproofing-ufgs-07-11-13 | UFGS 07 11 13 Bituminous Dampproofing (2023) | 1 | public_domain | prep, coats, recoat, protection |
| waterproofing-ufgs-07-13-53 | UFGS 07 13 53 Elastomeric Sheet Waterproofing (2025) | 1 | public_domain | laps, corners, flashing, flood test, protection |
| waterproofing-ufgs-07-14-00 | UFGS 07 14 00 Fluid-Applied Waterproofing (2023) | 1 | public_domain | prep, wet-film, flood test |
| waterproofing-ufgs-33-46-16 | UFGS 33 46 16 Subdrainage Piping (2018) | 1 | public_domain | geotextile, outlets |
| waterproofing-basc-footing-drain | DOE BASC Footing Drain Pipe | 1 | gov_open | drain tile placement, stone, outlet |
| waterproofing-basc-dampproof | DOE BASC Damp-Proof Exterior of Below-Grade Walls | 1 | gov_open | parging, drainage mat, backfill |
| waterproofing-basc-capillary-break | DOE BASC Capillary Break Beneath Slab | 1 | gov_open | vapor retarder laps/sealing |
| waterproofing-basc-sump | DOE BASC Drain or Sump Pump | 1 | gov_open | sump basin |
| waterproofing-basc-urban-below-grade | DOE BASC Below-Grade Water Management (Urban) | 1 | gov_open | water-table approaches, protection |
| waterproofing-ccw-miradri-tds | CCW MiraDRI 860/861 TDS (distributor-hosted) | 5 | manufacturer_public | cure, prime, fillets, terminations |
| waterproofing-icces-esr4925 | ICC-ES ESR-4925 (MiraDRI as 07 11 00 dampproofing) | 4 | association_public | evaluated membrane as code dampproofing (QA system_matches_plan) |
| icc-pa | IRC R401.3/R405.1/R406.1/R406.2/R506.2.3; IBC 1805/1805.1.3/1805.2/1805.3/1805.4/1907.1 | 3 | proprietary_ref_only | code refs (section + paraphrase) |
| ecfr-1926-p/d/e/f/m/x/z | 29 CFR 1926 subparts | 1 | public_domain | hazards |

## Work steps (draft → pack recipes)
`below_grade_residential` (IRC): 1 cure + prep (ties, fins, voids, parge) · 2 dampproof or waterproof (R406.1/R406.2)
· 3 footing drain to daylight/sump (R405.1) · 4 protection/drainage board + backfill (R401.3) · 5 under-slab vapor
retarder (R506.2.3) — **gate `foundation`** (sequence defines it as the pre-pour check incl. vapor barrier).
`below_grade_commercial` (IBC, priority 10, commercial/industrial/residential_mf): 1 verify ground water + substrate
(1805.1.3) · 2 membrane + transitions + flood test (1805.3/1805.2) · 3 subsoil drain + composite + backfill (1805.4)
· 4 vapor retarder (1907.1) — gate `foundation`.

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| trench_cavein | Overdig/drain-trench cave-in | 1926.652(a)(1) | 4 |
| trench_egress | No egress from 4 ft+ trench | 1926.651(c)(2) | 3 |
| spoil_edge | Material falling into excavation | 1926.651(j)(2) | 3 |
| excavation_water | Accumulated water | 1926.651(h)(1) | 3 |
| solvent_vapor_trench | Solvent vapors pooling in trench/pit | 1926.651(g)(1)(i) | 4 |
| solvent_exposure | Vapors above limits | 1926.55(a) | 3 |
| flammable_storage | Solvent primers fire | 1926.152(a)(1) | 3 |
| skin_chem | Asphalt/primer skin contact | 1926.95(a) | 2 |
| eye_splash | Spray/splash/chips | 1926.102(a)(1) | 2 |
| silica_grind | Grinding fins / patching | 1926.1153(c)(1) | 3 |
| excavation_edge_fall | Fall into 6 ft+ excavation | 1926.501(b)(7)(i) | 3 |
| ladder | Ladder in overdig | 1926.1053(b)(1) | 2 |

## QA checklist
15 items: cure_dry_surface, ties_patched, system_matches_plan, coverage_continuous, membrane_laps, flood_test,
protection_board, drain_beside_footing, clean_stone_fabric, drain_outlet, sump_pit, vapor_retarder_continuous,
backfill_care, trench_protected (safety), vapor_ventilated (safety).

## Inspection / acceptance checkpoints
- `foundation`: dampproofing footing→grade (where checked pre-backfill), membrane where high water table, footing
  drain + discharge, vapor retarder continuous/sealed, evaluation report or maker's instructions on site.

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| B-WP-DAMP-SF | Asphalt dampproofing, primer + 2 coats | SF | 18 | 0.008 | 0 | 10 | estimate; coverage rate from UFGS 07 11 13 |
| B-WP-MEMB-SF | Sheet/fluid membrane incl. detailing | SF | 160 | 0.035 | 0 | 12 | estimate |
| B-WP-DRAINBRD-SF | Drainage board/composite | SF | 65 | 0.012 | 0 | 8 | estimate |
| B-WP-DRAINTILE-LF | 4 in perforated footing drain in stone + fabric | LF | 450 | 0.1 | 50 | 5 | estimate; stone volume from BASC 16×16 in trench |
| B-WP-SUMP-EA | Sump basin, gasketed lid, gravel, tie-in (no pump) | EA | 15000 | 3 | 0 | 0 | estimate |
| B-WP-VR-SF | Under-slab vapor retarder 10-mil+, taped | SF | 22 | 0.003 | 0 | 10 | estimate |

## Quantity rules
- `B-WP-VR-SF` = area_sf_sum × 0.6 (ceil) when `slab_on_grade` — footprint guess
- `B-WP-DAMP-SF` = 1120 SF when `foundation_wall` + residential_sf (≈140 LF × 8 ft)
- `B-WP-DRAINTILE-LF` = 150 LF when `foundation_wall` + residential_sf
- `B-WP-SUMP-EA` = 1 when `foundation_wall` + residential_sf

## Blueprint callouts (components)
- none this wave (existing core tokens `foundation_wall`, `slab_on_grade` used for quantities).

## Open questions → REVIEW_QUEUE
- All 6 assembly costs are platform estimates.
- `foundation_wall` does not distinguish basement walls from frost walls — residential dampproofing/drain/sump
  quantities may over-seed slab-on-grade houses with frost walls.
- Equipment vocab lacks an airless/asphalt spray rig.
- MiraDRI TDS URL is distributor-hosted (henry.com/carlisleccw.com pages redirect); swap for a maker URL when stable.
