# Dossier — `painting` (Painting)

> Wave: w03 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/painting.ts` · Status: draft
> Taxonomy: category `interior` · permit_trade `null` · phase `finishes_interior` · CSI `09 91`

## Scope (2–4 sentences)
Interior and exterior painting and staining for residential and light-commercial new work and repaints:
surface prep, patching, caulking, priming, finish coats, trim, doors, cabinet refinishing, deck/fence stain,
and lead-safe (EPA RRP) work practices on pre-1978 homes. Hand-offs: drywall finishing (accepts the level
of finish before prime), industrial_coatings (SSPC steel/high-performance systems), abatement (full lead
abatement — RRP covers renovation, not abatement), final_clean.

## Existing coverage reconciled
- Hand recipe: `task-buildout/nopermit.ts` `painting` (Prep & prime → Apply finish coats) → pack **complements** (`recipes: []`).
- Catalog codes already seeded: `G-PAINT-SF` (hand-seeded in `seedGeneral` at 3.2 SF/SF floor), `G-PAINT-EXT-SF` (not hand-seeded — referenced by a pack quantity rule gated on `stucco_finish`).
- Blueprint template tasks hitting this trade: interior/exterior paint tasks in the building-type templates (titles unchanged; hand recipe handles them).

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| painting-ufgs-09-90-00 | UFGS 09 90 00 Paints and Coatings | 1 | public_domain | application conditions, moisture limits, priming, film quality, touch-up, waste |
| painting-ecfr-40-745e | 40 CFR 745 Subpart E (RRP) | 1 | public_domain | certified firm, containment, prohibited practices, cleaning verification, records |
| painting-epa-rrp | EPA RRP program page | 1 | gov_open | RRP overview |
| painting-epa-rrp-steps | EPA Steps to Lead Safe RRP | 1 | gov_open | lead housekeeping hazard |
| painting-epa-renovate-right | Renovate Right pamphlet | 1 | gov_open | pre-paint walkthrough (pamphlet delivery) |
| painting-sw-paintdocs | Sherwin-Williams PDS/SDS lookup | 5 | manufacturer_public | spread rate / recoat per product data sheet |
| painting-pca-standards | PCA Industry Standards | 4 | proprietary_ref_only | touch-up (reference only) |
| ecfr-1926-c/d/e/f/l/x | 29 CFR 1926 Subparts | 1 | public_domain | hazards |

## Work steps
Hand recipe stays (2 steps). Pack adds QA ids, hazards, checklists, equipment, assemblies.

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| lead_dust | Lead dust/chips from disturbing old paint | 1926.62(d)(1)(i) | 4 |
| lead_housekeeping | Spreading lead dust | 1926.62(h)(2) | 3 |
| solvent_vapor | Solvent vapors in closed rooms | 1926.55(b) | 3 |
| spray_mist | Spray mist / vapor buildup | 1926.57(a) | 3 |
| respirator_program | Wrong/unfitted respirator | 1926.103 | 3 |
| flammable_storage | Flammable liquids in unapproved containers | 1926.152(a)(1) | 3 |
| ignition_sources | Vapor ignition (smoking, pilots, sparks) | 1926.151(a)(3) | 4 |
| oily_rags | Spontaneous combustion of oily rags | 1926.25(b) | 3 |
| chemical_contact | Skin/eye contact with chemicals (HazCom) | 1926.59 | 2 |
| eye_splash | Paint/solvent splash to eyes | 1926.102(a)(1) | 2 |
| ladder | Ladder falls | 1926.1053(b)(1) | 3 |
| scaffold_fall | Scaffold falls > 10 ft | 1926.451(g)(1) | 4 |

Note: 1926.57(h) (spray finishing) and 1926.66 (spray booths) address booth/room operations, not field
brush/roll/airless work — field spraying cited under 1926.57(a) general ventilation + 1926.55(b).

## QA checklist (15; 3 safety)
Lead status known + RRP certs (safety), RRP containment (safety), RRP cleaning verification (safety),
surface prep, moisture limits (wood ≤12%, plaster ≤8% + 30 days), exterior weather window (50–95 °F,
≥5 °F above dew point), primer on new work, film build / spread rate, recoat times, uniform finish
(no holidays/runs/laps), color/sheen vs approved sample, cut lines, edges, touch-up, waste handling.

## Inspection / acceptance checkpoints (no permit — descriptive keys)
- `pre_paint_walkthrough`: drywall level accepted, colors signed, protection, lead/RRP setup.
- `lead_safe_cleaning_verification`: containment, HEPA + wet clean + visual, card comparison, records (40 CFR 745.85/745.86).
- `final_walkthrough`: raking-light check, color/sheen, hardware back, touch-up paint left.

## Cost basis (all platform-baseline estimates, 2026)
| Code | Unit | Mat ¢ | Hr/unit | Equip ¢ | Waste % |
|---|---|---|---|---|---|
| G-PNT-RRP-SETUP-EA | EA (room) | 6500 | 3 | 2000 | 0 |
| G-PNT-TRIM-EXT-LF | LF | 45 | 0.04 | 0 | 10 |
| G-PNT-INT-TRIM-LF | LF | 20 | 0.03 | 0 | 10 |
| G-PNT-DOOR-EA | EA | 900 | 1.25 | 0 | 10 |
| G-PNT-CAB-REFIN-LF | LF | 1500 | 1.5 | 150 | 15 |
| G-PNT-STAIN-EXT-SF | SF | 30 | 0.012 | 4 | 10 |

## Quantity rules
- `G-PNT-DOOR-EA` = doors (residential)
- `G-PNT-INT-TRIM-LF` = rooms × 40 (residential)
- `G-PNT-TRIM-EXT-LF` = windows × 14 (residential_sf)
- `G-PAINT-EXT-SF` (existing) = stucco_finish × 2000
RRP setup, cabinet refinish and deck/fence stain have no blueprint fact → manual lines only.

## Blueprint callouts (components)
None this wave.

## Open questions → REVIEW_QUEUE
- All 6 assembly costs are platform estimates.
- MPI (mpi.net) redirect loop — not cited; PCA standards cited reference-only.
- 12 hazards + 3 safety QA + lead checklist items pending human ES.
