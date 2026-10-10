# Dossier — `fireproofing` (Spray-Applied Fireproofing)

> Wave: w10 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/fireproofing.ts` · Status: draft
> Taxonomy: category `envelope` · permit_trade `building` · phase `framing` · CSI `07 81`

## Scope (2–4 sentences)
Applies fire-resistive protection to structural steel: spray-applied fire-resistive material (SFRM,
cementitious or fibrous) on beams, columns, joists and deck, and thin-film intumescent / mastic coatings on
exposed steel, to the thickness the listed fire-resistance design requires; supports the special inspector's
tests; patches damage left by later trades. Does NOT do firestopping of penetrations/joints (`firestopping`),
gypsum fire-rated enclosures (`drywall`), or steel priming outside a listed intumescent system (`painting` /
`structural_steel`).

## Existing coverage reconciled
- Hand recipe: none (not in `HAND_RECIPE_KEYS`) → NEW-TRADE pattern, 3 recipes.
- Catalog codes already seeded: none for fireproofing → 5 new `B-FP-*`.
- Blueprint template tasks hitting this trade: none (0). `title_re` covers "fireproof", "SFRM",
  "spray-applied fire", "fire-resistive material", "intumescent", "thin-film fire", "mastic fire".

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| fireproofing-ufgs-07-81-00 | UFGS 07 81 00 Spray-Applied Fireproofing | 1 | public_domain | steps, QA, tolerance, test frequency |
| fireproofing-nfca-100 | NFCA 100 SFRM application practice | 4 | association_public | sequencing, deck-after-roof, flutes, gauging, cure protection, patching |
| fireproofing-awci-tm12 | AWCI TM 12-A / 12-B | 4 | proprietary_ref_only | test-method reference only |
| fireproofing-ul-coatings | UL Solutions — mastic and intumescent coatings | 4 | proprietary_ref_only | listed primer, galvanized, listing governs |
| icc-pa | IBC 703.2, 704, 1705.15, 1705.16 | 3 | proprietary_ref_only | code refs |
| ecfr-1926-c/d/e/i/l/m/z | 29 CFR 1926 | 1 | public_domain | hazards |
| platform-baseline | expert baseline | — | platform_estimate | all costs |

## Work steps (draft → pack recipes)
`sfrm_structural_steel` (default):
1. **Check the steel, attachments and site conditions** — bare clean steel; primer only if listed or bond-tested; clips/hangers before, ducts/pipe/studs after; ≥40 °F 24 h before/after; deck only after roof tight. QA steel_clean, attachments_first, deck_after_roof, temp_vent.
2. **Confirm the design and thickness for every member** — design listing no. per member (reference only). Code: IBC 703.2, 704.
3. **Mask, mix and spray to thickness** — passes, flutes per design, gauge as you go, no tamping, 4 ACH. QA flutes_filled, thickness_gauge, no_tamping.
4. **Special inspection: thickness, density and bond** — Gate: `framing`. Code: IBC 1705.15. QA special_inspection_pass, thickness_tolerance.
5. **Patch after other trades and clean up** — Gate: `final`. Code: IBC 704. QA patch_same_material, overspray_cleaned.

`intumescent_coating` (priority 10): listed primer → environmental checks → coats to DFT → special inspection (gate `framing`, IBC 1705.16) → topcoat/touch-up (gate `final`).

`patch_existing_fireproofing` (priority 20): asbestos test first (1926.1101) → remove loose → patch to thickness (gate `final`).

**Why gate `framing`:** the building family has no dedicated "above-ceiling / pre-cover" inspection. The framing
inspection is the last AHJ hold point while structure is exposed, before insulation, MEP-covering ceilings and
drywall. Fireproofing must be tested while the steel is still accessible (UFGS 3.6.3: inspections before
enclosure), so the acceptance step gates there. Patching gates `final` because damage from later trades is
repaired and re-inspected before close-out.

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| scissor_lift | lift fall/tip/crush | 1926.452(w) | 4 |
| aerial_lift | boom basket | 1926.453(b)(2)(v) | 4 |
| scaffold_fall | rolling scaffold | 1926.451(g)(1) | 4 |
| fall_edge | floor edges/openings | 1926.501(b)(1) | 4 |
| dust_resp | dust/mist | 1926.103 | 3 |
| vapor_ventilation | solvent/epoxy vapors | 1926.57(a) | 3 |
| hazcom | cement burns, epoxy sensitizer | 1926.59 | 2 |
| overspray_eye | overhead spray | 1926.102(a)(1) | 3 |
| hose_whip | hose >1/2 in. failure | 1926.302(b)(7) | 3 |
| airless_injection | airless gun injection | 1926.302(b)(8) | 4 |
| slip_rebound | wet rebound on floors | 1926.25(a) | 2 |
| asbestos_existing | legacy spray-on asbestos | 1926.1101(k) | 4 |

## QA checklist
15 items — see pack. Measured: UFGS 3.4.4 thickness tolerance (avg ≥ listed; single reading ≥ listed −1/4 in.
when ≥1 in., −25 % when <1 in.); test areas 1 per 10,000 SF floor or 2 per floor; ≥40 °F; 4 ACH; overspray
cleaned within 24 h.

## Inspection / acceptance checkpoints
- framing: special-inspection report, schedule with design numbers, steel still exposed, intumescent DFT log.
- final: patches done and re-inspected, final special-inspection report filed.

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| B-FP-SFRM-1HR-SF | SFRM ~1 hr | SF steel | 85 | 0.012 | 10 | 15 | estimate |
| B-FP-SFRM-2HR-SF | SFRM ~2 hr | SF steel | 170 | 0.018 | 15 | 15 | estimate |
| B-FP-INTUM-SF | thin-film intumescent ~1 hr | SF steel | 450 | 0.05 | 25 | 10 | estimate |
| B-FP-PATCH-SF | patch/repair | SF | 150 | 0.10 | 0 | 20 | estimate |
| B-FP-TEST-EA | special-inspection test area | EA | 0 | 0.5 | 45000 | 0 | estimate (agency fee in equipment, mirrors B-AB-BLDG-TEST-EA) |

## Quantity rules
- `B-FP-SFRM-1HR-SF` = area_sf_sum × 0.5 (commercial / industrial / residential_mf).
- `B-FP-TEST-EA` = ceil(area_sf_sum × 0.0001 + 1).
- `B-FP-PATCH-SF` = ceil(area_sf_sum × 0.01).
Only evaluated when `fireproofing` is a trade on the project's schedule; residential_sf / pole_barn excluded.

## Blueprint callouts (components)
None this wave.

## Open questions → REVIEW_QUEUE
- IBC numbering differs by edition (2021: 1705.15 SFRM / 1705.16 intumescent; 2018: 1705.14 / 1705.15); 2024 IBC not verified (ICC public access returns 403 to scripts).
- No pre-cover/above-ceiling inspection type in the building family — `framing` used as the proxy gate.
- All 5 costs are platform estimates.
- awci.org blocks scripted requests; TM 12-A cited via its ICC store page.
