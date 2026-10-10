# Dossier — `lightning_protection` (Lightning Protection)

> Wave: w12 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/lightning_protection.ts` · Status: draft
> Taxonomy: category `electrical_systems` · permit_trade `null` · phase `finishes_exterior` · CSI `26 41`

## Scope
Designs (or installs to an engineer's design) and installs lightning protection systems: air terminals,
roof and down conductors with guards, grounding electrodes / ground ring, bonding of metal bodies and the
common building ground, then tests every connection and obtains third-party certification (UL Master
Label or LPI-IP). Does NOT install surge protective devices (electrician, `E-EL-SPD-EA`) or roofing
(roofer approves attachment details). No AHJ permit path → no gating inspections or code refs; hold
points are owner/third-party checkpoints in `inspection_checklists`.

## Existing coverage reconciled
- Hand recipe: none → NEW-TRADE pack.
- Catalog codes already seeded: `E-EL-SPD-EA` (surge device — electrician scope, not duplicated). No `G-LPS-*`.
- Blueprint template tasks hitting this trade: none; no component detector (none this wave).

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| lightning_protection-ufgs-26-41-00 | UFGS 26 41 00 Lightning Protection System (May 2026) | 1 | public_domain | steps, QA, checkpoints |
| lightning_protection-nfpa-780 | NFPA 780 (doc info page) | 3 | proprietary_ref_only | named design standard only |
| lightning_protection-ul-96a | UL 96A | 3 | proprietary_ref_only | certification basis only |
| lightning_protection-lpi-technical | LPI Technical / Education | 4 | association_public | system components, process |
| lightning_protection-lpi-ip | LPI Inspection (LPI-IP) | 4 | association_public | third-party certification |
| lightning_protection-nws-lightning-safety | NWS Lightning Safety | 1 | public_domain | worker storm hazard |
| concrete_repair_lifting-call811 (reused) | 811 Before You Dig | 4 | association_public | utility locate |
| ecfr-1926-c/e/j/k/l/m/p/x/z (shared) | 29 CFR 1926 subparts | 1 | gov_open | hazards |

## Work steps (pack recipes)
`lps_new_install` (title_re `lightning|air terminal|\bLPS\b`):
1. Confirm the design and coordinate the roof — QA design_listed_parts, roof_warranty_ok.
2. Locate utilities and install the grounding — QA rod_undisturbed_earth, buried_exothermic, ground_tested_before_cover. Hold: ground_system_concealed_inspection.
3. Run the down conductors and guards — QA two_paths_ground, guards_bonded, no_sharp_bends.
4. Set air terminals and roof conductors — QA terminal_layout, adhesive_bases_ok. Hold: roof_rough_in_inspection.
5. Bond metal bodies and building grounds — QA common_ground_bonded (safety), spd_confirmed, connections_unpainted.
6. Test, document and certify — QA continuity_every_joint, test_point_sketch, third_party_cert. Hold: master_label_inspection.

`lps_reroof_reinstall` (priority 10; remove/reinstall/repair/reroof/recertify + lightning|LPS): document & test → reinstall → retest & recertify (UFGS 3.5.1a).

## Hazards
12: lightning_storm 1926.21(b)(2) (+NWS), roof_edge_low 1926.501(b)(10), roof_steep 1926.501(b)(11),
ladder 1926.1053(b)(1), aerial_lift 1926.453(b)(2)(v), underground_utility 1926.651(b)(1),
buried_power 1926.416(a)(2), energized_bond 1926.416(a)(1), exo_weld_fire 1926.352(d),
exo_weld_eye 1926.102(a)(1), silica_drill 1926.1153, trench_spoil 1926.651(j)(2). All ES pending.

## QA checklist
16 items (1 safety). UFGS-derived values used in text: guard to ~6 ft, ground tests in dry weather ≥48 h
after rain, third-party inspector not the designer/installer, no painted connections. NFPA 780 numbers
(spacing, bend radius, rod depth tables) deliberately NOT reproduced — the pack says "per design".

## Inspection / acceptance checkpoints
- ground_system_concealed_inspection — rods/ring vs drawings, exothermic welds, readings, photos before cover.
- roof_rough_in_inspection — terminal layout/paths, adhesive bases, bonds.
- master_label_inspection — third-party walk-down, test data, guards/bonds/SPD, certificate + record drawings.

## Cost basis (all platform-baseline estimates)
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % |
|---|---|---|---|---|---|---|
| G-LPS-AIR-TERM-EA | Air terminal w/ base | EA | 4500 | 0.75 | 0 | 0 |
| G-LPS-COND-LF | Main conductor + fasteners | LF | 600 | 0.12 | 0 | 8 |
| G-LPS-GROUND-ROD-EA | Ground rod + exothermic + test well | EA | 9000 | 1.5 | 1500 | 0 |
| G-LPS-BOND-EA | Bonding connection | EA | 3500 | 0.5 | 0 | 0 |
| G-LPS-CERT-EA | Third-party inspection + cert | EA | 120000 | 4 | 0 | 0 |

## Quantity rules
- `G-LPS-CERT-EA` = const 1 (commercial / industrial / residential_mf).
- `G-LPS-GROUND-ROD-EA` = const × 4 (same building types) — placeholder until shop drawings.
No blueprint fact exists for LPS, so terminals/conductor LF are left to the estimator.

## Blueprint callouts (components)
None this wave (candidate later: "AIR TERMINAL" / "LIGHTNING PROTECTION" callouts on roof plans).

## Open questions → REVIEW_QUEUE
- All costs are platform estimates; certification fee varies widely by size/region.
- const-based rod count (4) is a guess scoped by building type.
- 12 hazards + 1 safety QA need human ES translation.
- UL Master Label program page: no stable public UL URL found (ul.com service URLs 404) — cited UL 96A standard page instead.
