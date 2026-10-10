# Dossier — `concrete_polishing` (Concrete Polishing / Staining / Sealing)

> Wave: w08 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/concrete_polishing.ts` · Status: draft
> Taxonomy: category `concrete_masonry` · permit_trade `null` · phase `finishes_interior` · CSI `03 35`

## Scope
Makes an interior slab the finished floor. The crew diamond-grinds it to an approved aggregate exposure, densifies it, hones and polishes it to a gloss level, fills the saw-cut joints with polyurea, colors it with reactive acid stain or dye, and applies a guard or penetrating sealer. Simpler grind-and-seal floors are in scope too. Out of scope: placing and finishing the slab (`concrete`, `concrete_flatwork`), resinous coatings (`flooring_epoxy`, G-FLOOR-EPOXY-SF), exterior flatwork sealers (B-FLAT-SEAL-SF), and saw-cutting control joints (`concrete_cutting`).

## Existing coverage reconciled
- Hand recipe: none. `nopermit.ts` generic fallback only. Pack = NEW-TRADE pattern.
- Catalog codes already seeded: none for this scope. B-FLAT-SEAL-SF (exterior flatwork sealer) and G-FLOOR-EPOXY-SF (epoxy) are adjacent and were not redeclared.
- Blueprint template tasks hitting this trade: none.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| concrete_polishing-cpaa-def-pc-100 | CPAA DEF-PC-100 Polished Concrete Defined | 4 | association_public | exposure classes A–D, gloss levels 1–4, measurement methods (D523/D5767/D4039) |
| concrete_polishing-aps-033543 | Albuquerque Public Schools 03 35 43 Polished Concrete Finishing | 1 (public owner spec) | gov_open | execution steps, mock-up hold, gloss acceptance, joint fill, protection |
| ufgs-03-30-00 | UFGS 03 30 00 Cast-in-Place Concrete | 1 | public_domain | silicate hardener definition, sealer VOC ≤100 g/L |
| concrete_polishing-brickform-acid-stain-tis | Brickform acid stain TIS | 5 | manufacturer_public | stain prep, application, neutralize/residue, PPE |
| concrete_polishing-aci-310r | ACI 310R Guide to Decorative Concrete | 3 | proprietary_ref_only | reference only |
| concrete_polishing-tcna-a326-3 | ANSI A326.3 DCOF (TCNA page) | 3 | proprietary_ref_only | slip-resistance method reference only |
| ecfr-1926-z | 1926.1153 Table 1 rows (xii), (xiii); (f) housekeeping | 1 | public_domain | silica hazards |
| ecfr-1926-d | 1926.50(g), .52(d)(1), .55(a), .59 | 1 | public_domain | eyewash, noise, CO, hazcom |
| ecfr-1926-f | 1926.152(a)(1), 1926.153(h) | 1 | public_domain | flammable liquids, LP-gas indoors |
| ecfr-1926-k | 1926.404(b)(1)(ii) | 1 | public_domain | GFCI |
| ecfr-1926-c | 1926.25(a) | 1 | public_domain | housekeeping / slurry |
| restoration-niosh-co | NIOSH carbon monoxide | 1 | gov_open | CO from propane machines (reused) |

## Work steps
Recipe `mechanical_polish` (title_re: polish | grind and seal | densif | sealed concrete | burnished concrete | concrete hone/guard/finish):
1. **Check the slab and approve a mock-up.** Cure age and strength, hard trowel, ~100 SF mock-up, exposure approved after the first grind. QA: slab_ready, mockup_approved, slab_protected.
2. **Repair cracks and patch defects.** Fill cracks 1/8 in. and wider, flush. QA: repairs_flush, silica_controls.
3. **Grind with metal diamonds to the approved exposure.** Planetary grinder, edges within 1/8 in., wet or maker's dust collector, HEPA between passes. QA: exposure_uniform.
4. **Densify, then hone and polish with resin diamonds.** Silicate densifier to refusal, remove excess, one pass per grit, gloss meter. QA: densifier_applied, no_scratches, gloss_met.
5. **Fill the saw-cut joints.** Polyurea, crowned, shaved flush; not isolation/expansion joints. QA: joints_filled.
6. **Apply guard, burnish and protect the floor.** QA: guard_even, slab_protected, slip_resistance.

Recipe `stain_and_seal` (title_re: stain(ed) concrete | acid stain | concrete dye | colored sealer):
1. Open the surface and run a color mock-up. 2. Apply the stain or dye. 3. Neutralize and remove the residue. 4. Seal and cure.

No gates and no code_refs because permit_trade is null.

## Hazards
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| silica_floor_grinding | walk-behind floor grinder dust | 1926.1153(c)(1) Table 1 (xiii) | 3 |
| silica_edge_grinding | handheld edge grinder dust (APF 10 indoors) | 1926.1153(c)(1) Table 1 (xii) | 3 |
| silica_cleanup | dry sweeping / compressed air | 1926.1153(f) | 2 |
| propane_co | CO from propane machines indoors | 1926.55(a) | 4 |
| lpg_cylinders | LP cylinders inside buildings | 1926.153(h) | 3 |
| acid_stain_corrosive | acid stain burns, eyewash | 1926.50(g) | 3 |
| chemical_products | densifier/dye/filler/sealer SDS | 1926.59 | 2 |
| flammable_liquids | solvent dyes/sealers | 1926.152(a)(1) | 3 |
| noise | grinders/extractors | 1926.52(d)(1) | 2 |
| electrical_cords | cords on wet slurry | 1926.404(b)(1)(ii) | 3 |
| slurry_slip_trip | slurry, hoses, cords | 1926.25(a) | 2 |

## QA checklist
There are 15 items: slab_ready, mockup_approved, slab_protected, repairs_flush, exposure_uniform, densifier_applied, no_scratches, gloss_met, joints_filled, guard_even, stain_even, residue_removed*, silica_controls*, chemical_ppe*, slip_resistance. Items marked * are safety items with ES pending.

## Inspection / acceptance checkpoints
- pre_polish_slab_acceptance: slab age and strength, existing defects recorded, power and water.
- mockup_exposure_hold: exposure approval after the first grind is a hold point; color and gloss approved.
- gloss_acceptance: 60° readings, at least one per 1,000 SF, before the guard is applied; finish and joint check.
- turnover: protection in place, maintenance instructions handed over.

## Cost basis
All rows use the `platform-baseline` estimate as of 2026.
| Code | Unit | Mat ¢ | hr/unit | Equip ¢ | Waste % |
|---|---|---|---|---|---|
| G-POL-GRIND-SEAL-SF | SF | 30 | 0.01 | 20 | 10 |
| G-POL-MECH-L2-SF | SF | 40 | 0.016 | 35 | 10 |
| G-POL-MECH-L3-SF | SF | 45 | 0.022 | 45 | 10 |
| G-POL-STAIN-SF | SF | 30 | 0.008 | 3 | 10 |
| G-POL-JOINTFILL-LF | LF | 90 | 0.025 | 3 | 15 |

## Quantity rules
- `G-POL-MECH-L2-SF` = area_sf_sum × 0.6 (industrial)
- `G-POL-MECH-L3-SF` = area_sf_sum × 0.4 (commercial)
- `G-POL-JOINTFILL-LF` = area_sf_sum × 0.08 (commercial, industrial)
- `G-POL-GRIND-SEAL-SF` = area_sf_sum × 0.2 (residential_sf/mf)

## Blueprint callouts
None this wave.

## Open questions → REVIEW_QUEUE
- 11 hazards and 3 safety QA items need human ES translation.
- All 5 G-POL costs are estimates.
- The CPAA paper is only available through a trade-press mirror because cpaa.org no longer belongs to CPAA. ASCC's Concrete Polishing Council may be the current home. Verify.
- UFGS has no 03 35 43 polishing section, and the `UFGS 03 35 00.00 10` PDF returns 403 (removed). The pack relies on a public owner spec (APS).
- Propane burnisher CO exposure (1926.55(a)): consider a vocab addition for a CO monitor or for propane burnishers. There is no floor-grinder equipment type in vocab; a `floor_grinder` type is proposed.
