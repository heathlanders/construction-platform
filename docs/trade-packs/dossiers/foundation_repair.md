# Dossier — `foundation_repair` (Foundation Repair / Piering / Leveling)

> Wave: w05 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/foundation_repair.ts` · Status: draft
> Taxonomy: category `concrete_masonry` · permit_trade `building` · phase `foundation` · CSI `31 60`

## Scope
Repairs foundations on existing buildings: helical and push-pier underpinning with controlled lifting
(house leveling), wall anchors or steel/carbon-fiber braces for bowing basement walls, and crack injection
(epoxy structural / polyurethane water-stop). Work follows an engineer's design or evaluation; many AHJs
accept an engineer's letter instead of inspecting. Hand-offs: drainage/waterproofing systems (waterproofing
trade), slab lifting (`concrete_repair_lifting`), interior patching (remodeling/drywall), plumbing checks after a lift.

## Existing coverage reconciled
- Hand recipe: none → NEW-TRADE pattern, 3 recipes with `example_title`.
- Catalog codes already seeded: none with `B-FDR-` (checked `prisma/migrations/*/migration.sql`).
- Blueprint template tasks hitting this trade: none (0).

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| foundation_repair-icces-esr2794 | ICC-ES ESR-2794 CHANCE helical foundation systems | 4 (eval report) | association_public | helical install, torque log, calibration, termination criteria, special-inspection items |
| foundation_repair-icces-esr5005 | ICC-ES ESR-5005 IMG push pier (IBC + IRC) | 4 | association_public | engineered design under IRC (R301.1.3), soil (R401.4), bracket seating, pressure/depth records |
| foundation_repair-icces-ac358 | ICC-ES AC358 helical acceptance criteria | 3 | proprietary_ref_only | concept only (not cited in pack data) |
| foundation_repair-chance-wall-anchor | CHANCE T1500080 wall anchor installation sheet | 5 | manufacturer_public | anchor steps, crack-pattern diagnosis, torque, utilities + crush warnings |
| foundation_repair-fhwa-micropile | FHWA-NHI-05-039 Micropile manual | 1 | public_domain | underpinning practice: load transfer, monitoring, records |
| foundation_repair-usace-em1110-2-2002 | USACE EM 1110-2-2002 Evaluation and Repair of Concrete Structures | 1 | public_domain | crack material selection |
| ecfr-1926-c/d/h/i/k/p/z/aa | 29 CFR 1926 subparts | 1 | public_domain | hazards |
| icc-pa | IRC / IBC / IEBC | 3 | proprietary_ref_only | code refs (section + paraphrase) |
| platform-baseline | The Jobsite baseline | — | platform_estimate | all costs |

## Work steps (→ pack recipes)
**pier_underpinning** (example "Install helical piers and lift settled foundation")
1. Confirm the engineered design and set up — R301.1.3, R401.4. QA design_on_file, baseline_elevations, cause_identified.
2. Excavate the pier access holes — pit sequence, spoil 2 ft back, competent person. QA pit_sequence.
3. Prepare the footing and mount the bracket — wet cutting (silica). QA bracket_seated.
4. Install each pier to its termination criteria — Gate foundation. IBC 1810.4.11, IEBC 405. QA termination_logged, torque_gauge_calibrated.
5. Transfer the load and lift under monitoring — Gate foundation. R403.1. QA lift_monitored.
6. Backfill, fix drainage and hand over records — Gate final. R401.3.

**bowing_wall_stabilization** (example "Stabilize bowing basement wall with wall anchors") — assess/layout (R404.1) → drill wall + dig pits → install anchors or braces (gate foundation, IEBC 405) → tension, seal, monitor → backfill/drainage/records (gate final, R405.1).

**crack_injection** (example "Foundation crack injection") — diagnose + pick material → clean + ports → seal + inject → cure, water-test, log. No gate (owner walkthrough).

## Hazards
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| cave_in | Pit cave-in next to footing | 1926.652(a)(1) | 4 |
| undermining | Undermining the footing / adjacent structure | 1926.651(i)(1) | 4 |
| utility_strike | Buried utility strike | 1926.651(b)(1) | 4 |
| hydraulic_pressure | Hose/fitting burst, fluid injection | 1926.302(d)(2) | 3 |
| jack_overload | Jack overload/slip lifting the house | 1926.305(a)(1) | 4 |
| rotating_drive | Torque bar / drive head strike or crush | 1926.21(b)(2) | 3 |
| silica | Silica from coring/chipping/grinding | 1926.1153(c)(1) | 3 |
| confined_crawl | Crawlspace possibly a permit space | 1926.1203(a) | 3 |
| heavy_steel | Handling heavy steel; stacking pipe | 1926.250(a)(1) | 2 |
| chem_resin | Epoxy/polyurethane contact | 1926.59 | 2 |
| gfci_wet | Corded tools in wet pits | 1926.404(b)(1)(ii) | 3 |

## QA checklist (15)
design_on_file (safety), cause_identified, baseline_elevations, pit_sequence (safety), bracket_seated,
termination_logged, torque_gauge_calibrated, lift_monitored (safety), bow_recorded, anchor_torque_logged,
crack_material_matched, water_test, backfill_compacted, drainage_corrected, records_handover.

## Inspection / acceptance checkpoints
- `engineer_letter`: evaluation contents, logs sent, completion letter filed.
- `foundation` (where the AHJ inspects): brackets visible before backfill, pier count/locations, pier log on site.
- `final_walkthrough`: owner walk vs before photos, site restored, warranty/records handed over.

## Cost basis (all `platform-baseline`, confidence estimate)
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % |
|---|---|---|---|---|---|---|
| B-FDR-HELICAL-EA | Helical pier + bracket installed (~20 ft) | EA | 65000 | 6 | 12000 | 0 |
| B-FDR-PUSHPIER-EA | Push pier + bracket installed | EA | 55000 | 6 | 8000 | 0 |
| B-FDR-WALLANCHOR-EA | Wall anchor installed | EA | 35000 | 4 | 3000 | 0 |
| B-FDR-WALLBRACE-EA | Steel/carbon-fiber wall brace | EA | 30000 | 2.5 | 0 | 0 |
| B-FDR-CRACKINJ-LF | Crack injection per LF | LF | 1500 | 0.35 | 0 | 10 |
| B-FDR-ENGEVAL-EA | Engineer evaluation + letter (fee in material) | EA | 60000 | 1 | 0 | 0 |

## Quantity rules
None — no blueprint basis for repair scope.

## Blueprint callouts (components)
None this wave.

## Open questions → REVIEW_QUEUE
- EM 1110-2-2002 content not re-read (DTIC 403, mirror served HTML) — confirm crack-method wording.
- All six costs are estimates.
- Family equipment rules add excavator/power_trowel to crack-injection steps (phase-keyed) — not wanted for interior injection.
- Inspection vocab: no building-family type for "engineer letter in lieu of inspection" — kept in `inspection_checklists`.
