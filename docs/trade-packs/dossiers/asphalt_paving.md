# Dossier — `asphalt_paving` (Asphalt Paving)

> Wave: w06 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/asphalt_paving.ts` · Status: draft
> Taxonomy: category `sitework` · permit_trade `building` · phase `sitework` · CSI `32 12`

## Scope (2–4 sentences)
Hot-mix asphalt driveways, parking lots, drive aisles and truck courts, plus overlays, milling,
patching, crack sealing and sealcoating. Covers base proof-rolling and finish base, tack coat, paving,
rolling to density, joints, and drainage checks. Hands off bulk earthwork to `excavation`, curb & gutter
and walks to `concrete_flatwork`, utilities to `site_utilities`, striping/stall layout to
`pavement_marking` (not duplicated here).

## Existing coverage reconciled
- Hand recipe: `task-buildout/building.ts` asphalt/flatwork branch (Prep subgrade & base → Pave &
  compact asphalt) → pack **complements** (`recipes: []`): glossary, hazards, QA, three owner/GC hold-point
  checklists, equipment hints, assemblies, quantity rules. No AHJ building-inspection gate → no gates,
  no `code_refs`.
- Catalog codes already seeded (referenced, not redeclared): `B-ASPHALT-SY`, `B-AGG-BASE-SY` (0037),
  `G-SITE-DEMO-SF` (0045), `G-STRIPE-STALL` (0037, pavement_marking). No hand seeder emits `B-ASPHALT-SY`.
- Blueprint component `asphalt_paving` (parse-sheets.ts) exists → used to gate quantity rules.
- Blueprint template tasks: "Driveway & walkway paving" (res-sf), "Parking lot & drive aisle paving"
  (res-mf), "Parking lot base course & paving" (commercial), "Truck court & parking asphalt paving"
  (industrial) — all served by the hand recipe; pack equipment `title_re` hits all four.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| asphalt_paving-wisdot-ss-211 | WisDOT SS 211 Preparing the Foundation | 1 | gov_open | soft spots, subgrade |
| asphalt_paving-wisdot-ss-305 | WisDOT SS 305 Dense-Graded Base | 1 | gov_open | base lift thickness |
| asphalt_paving-wisdot-ss-450 | WisDOT SS 450 General Req. Asphaltic Pavements | 1 | gov_open | weather, delivery temp, rolling, joints, straightedge, no hauling |
| asphalt_paving-wisdot-ss-455 | WisDOT SS 455 Asphaltic Materials (tack) | 1 | gov_open | tack rate/conditions |
| asphalt_paving-wisdot-ss-460 | WisDOT SS 460 HMA Pavement | 1 | gov_open | layer thickness, density table |
| asphalt_paving-wisdot-ss-465 | WisDOT SS 465 Asphaltic Surface | 1 | gov_open | patching/driveway compaction |
| asphalt_paving-wisdot-aup | WisDOT Average Unit Price List FY2023–25 | 2 | gov_open | derived costs |
| asphalt_paving-fhwa-tack | FHWA-HIF-16-017 Tack Coat Best Practices | 1 | public_domain | break, milled-surface rate |
| asphalt_paving-niosh-npg-asphalt | NIOSH NPG Asphalt fumes | 1 | gov_open | REL C 5 mg/m³ |
| asphalt_paving-mutcd-part6 | MUTCD 11th ed. Part 6 | 1 | public_domain | work zone / flaggers |
| asphalt_paving-sealmaster-spec | SealMaster sealer guide spec | 5 | manufacturer_public | sealcoat timing, weather, cracks first |
| asphalt_paving-ai-ref | Asphalt Institute MS-4/MS-22 | 4 | proprietary_ref_only | concepts only (not cited on any fact) |
| ecfr-1926-c/d/e/f/g/o/p/z | 29 CFR 1926 subparts | 1 | public_domain | hazards |
| platform-baseline | Platform cost baseline | — | platform_estimate | labor/equipment splits, sealcoat |

NAPA (asphaltpavement.org) answers 403 to scripts and is not gov → not cited.

## Work steps
Hand recipe kept (2 steps). Pack adds no recipe.

## Hazards
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| hot_mix_burns | ~300 °F mix, screed, melters | 1926.95(a) | 3 |
| asphalt_fumes | fumes at paver/screed (NIOSH REL C 5 mg/m³; no OSHA PEL) | 1926.21(b)(2) | 2 |
| truck_backing | backing dump trucks | 1926.601(b)(4) | 4 |
| roller_paver_reverse | rollers/pavers in reverse | 1926.602(a)(9)(ii) | 4 |
| work_zone_traffic | passing traffic | 1926.200(g)(2) (MUTCD Part 6) | 4 |
| flagger_exposure | flaggers | 1926.201(a) | 4 |
| heat_stress | hot pavement + sun | 1926.51(a)(1) | 3 |
| silica_milling | milling/saw dust | 1926.1153(c)(1) Table 1 (xiii–xv) | 3 |
| tack_slip | fresh tack slips/tracking | 1926.95(a) | 2 |
| utility_strike | undercut/digging | 1926.651(b)(1) | 4 |
| propane_screed | LPG screed heaters/melters | 1926.153 | 3 |

## QA checklist (15)
utilities_marked (safety), traffic_control_set (safety), base_compacted (305), base_proof_rolled
(211/450), weather_ok (450 36/32 F), tack_on_existing (455 0.05–0.07 gal/SY + FHWA break), mat_temperature
(450 within 20 °F), compact_while_hot (450.3.2.6), density_check (460 table 93%), lift_thickness (460.3.2),
joints_tight (450.3.2.8), drainage_slope (estimate, 1–2%), smoothness (450.3.2.9 1/8 in.),
no_traffic_until_cooled (450.3.2.5(5)), sealcoat_timing (SealMaster 30–60 d; label governs).

## Inspection / acceptance checkpoints
- `base_proof_roll`: utilities, subgrade, base thickness/compaction, proof roll, grades, structure frames, dry/unfrozen.
- `paving_temperature_log`: air temp, tickets, mix temp per load, tack broken, rolling, thickness/density, spotter.
- `final_walkthrough`: texture, joints, drainage, straightedge, edges, owner notes, cleanup.

## Cost basis
| Code | Unit | Mat ¢ | Lab hr | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|
| B-ASP-HMA-TON | TON | 6000 | 0.1 | 900 | 3 | derived: ≈80% of WisDOT FY25 460.6224 $71.11 / 460.5224 $75.11; labor/equip estimate |
| B-ASP-MILL-SY | SY | 0 | 0.006 | 130 | 0 | derived: 204.0120 $1.50 (FY25) / $1.82 (FY24) |
| B-ASP-TACK-SY | SY | 18 | 0.001 | 3 | 5 | derived: 0.06 gal × 455.0605 $2.95/gal |
| B-ASP-CRACKSEAL-LF | LF | 30 | 0.008 | 15 | 10 | derived: 415.6000.S $0.99/LF FY23–24 (FY25 $6.00 outlier) |
| B-ASP-SEALCOAT-SY | SY | 40 | 0.008 | 8 | 5 | estimate (no public price) |
| B-ASP-PATCH-SF | SF | 150 | 0.06 | 80 | 10 | derived: 0.018 t/SF × 465.0110 $140.26/t, ≈60% material |

## Quantity rules (all gated `facts_any: ['asphalt_paving']`)
- `B-ASPHALT-SY` = 89 (res-sf two-car drive ≈20×40 ft)
- `B-ASP-HMA-TON` = 330 (mf/commercial/industrial ≈1,500 SY × 4 in. × 0.055 t/SY-in)
- `B-ASP-TACK-SY` = 1500 (between lifts)
- `B-AGG-BASE-SY` = 1500 (6 in. catalog row; heavier sections need more)

## Blueprint callouts (components)
None added (existing `asphalt_paving` component reused).

## Open questions → REVIEW_QUEUE
- Sealcoat cure: brief says 90 days; SealMaster guide says 30–60 days (others 90 days/season) → QA says "per label, commonly 30–90 days".
- concrete_flatwork's residential_sf const defaults (640 SF flatwork) still fire when the plans call out asphalt paving → possible double driveway scope.
- Vocab: `paver`, `roller` (distinct from plate compactor), `milling_machine` not in equipment vocab.
- Asphalt fume hazard osha_ref uses the general training duty (no OSHA PEL).
