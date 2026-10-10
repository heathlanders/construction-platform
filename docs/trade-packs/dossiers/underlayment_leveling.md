# Dossier — `underlayment_leveling` (Floor Underlayment / Self-Leveling (Gypcrete))

> Wave: w15 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/underlayment_leveling.ts` · Status: draft
> Taxonomy: category `interior` · permit_trade `building` · phase `finishes_interior` · CSI `03 54`

## Scope
Pours floor toppings: pumped gypsum underlayment over wood/concrete decks (multifamily floor-ceiling
assemblies, often over sound mat or radiant tubing) and cementitious self-leveling underlayment to flatten
floors for finish flooring. Includes deck prep, sound mat + perimeter isolation, priming, pour, drying and the
pre-flooring moisture test + sealing. Does NOT include structural subfloor repair (framing/GC), radiant tubing
(boilers_hydronic), moisture-mitigation membranes over slabs, or the finish flooring itself.

## Existing coverage reconciled
- Hand recipe: none → NEW-TRADE pack (3 recipes).
- Catalog codes already seeded: `B-UNDERLAYMENT-SF` is ROOF underlayment (07 31 00); `G-RES-UNDERLAY-SF`
  (floating vinyl pad) and `G-WD-UNDERLAY-SF` (felt/poly under hardwood) are flooring pads — none overlap a
  poured topping, so no rule references them. New `B-UL-*` rows.
- Blueprint template tasks: none.
- No building-sequence inspection fits a floor topping honestly → no gating; hold points in
  `inspection_checklists` (`pre_pour_holdpoint`, `pre_flooring_release`). IBC 1206/711 refs filed under `final`
  as reference (STC/IIC + rated floor assemblies are what an MF final/acoustical review looks at).

## Sources used
| id | Title | Tier | License | Used for |
|---|---|---|---|---|
| underlayment_leveling-maxxon-procedures | Maxxon Procedures Guide 10-18 | 5 | manufacturer_public | conditions (>50 °F, <70% RH), non-structural, min thickness, dry times, F2659 ≤5% / F2170, sealing, walls over mat glued |
| underlayment_leveling-maxxon-gypcrete-2000 | Gyp-Crete 2000 product data | 5 | manufacturer_public | depth 3/4–3 in, 80 lb bag, UL designs |
| underlayment_leveling-maxxon-gypcrete-radiant | Gyp-Crete Radiant product data | 5 | manufacturer_public | 3/4 in over top of tubes, 10–14 d dry |
| underlayment_leveling-ardex-k15 | ARDEX K 15 product page | 5 | manufacturer_public | primer per substrate, 1/8–1-1/2 in, 10-min flow, 30 SF/55 lb @1/4 in, flooring wait |
| icc-pa | ICC public access | 3 | ref only | IBC 711, 1206(.2/.3); IRC AK103 |
| ecfr-1926-{c,d,e,f,k,m,q,z} | 29 CFR 1926 | 1 | gov | hazards |

UFGS 03 54 16 was suggested but the PDF is not on WBDG's store (S3 AccessDenied for 03 54 13/16/00, while
09 29 00 resolves) — not cited.

## Work steps
- gypsum_underlayment: confirm rated assembly + conditions → prep deck, mat, isolation, guard holes → radiant
  tubing pressurized + depth marks → prime, mix, pump, screed → protect + dry → moisture test + seal.
- self_leveling: assess + mechanical prep → dam, isolate, prime → mix (measured water) + pour + gauge rake →
  cure, flatness, release.
- sound_mat (priority 10): confirm mat in assembly → lay mat + perimeter strip → protect until pour.

## Hazards
silica 1926.1153 · dust_general 1926.55(a) · cement_skin 1926.95(a) · eye_splash 1926.102(a)(1) ·
pump_hose 1926.702(e)(2) · floor_hole 1926.501(b)(4)(i) · trip_hose 1926.25(a) · heater_co 1926.154(a)(1) ·
noise 1926.52 · cord_shock 1926.404(b)(1) · lift_bags 1926.20(b) · chem_primer 1926.59.

## Cost basis (all estimate unless noted)
| Code | Unit | Mat ¢ | hr/unit | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|
| B-UL-GYP-075-SF | SF | 95 | 0.012 | 15 | 5 | platform baseline |
| B-UL-SLU-SF | SF | 165 | 0.02 | 5 | 10 | coverage published (30 SF/55 lb @1/4 in) × est. $50/bag |
| B-UL-PRIMER-SF | SF | 12 | 0.003 | 0 | 10 | baseline |
| B-UL-SOUNDMAT-SF | SF | 85 | 0.005 | 0 | 5 | baseline |
| B-UL-ISO-STRIP-LF | LF | 30 | 0.01 | 0 | 10 | baseline |

## Quantity rules (residential_mf only)
- gypsum, sound mat, primer = area_sf_sum; isolation strip = rooms × 40 LF.

## Open questions → REVIEW_QUEUE
- 12 hazards + 2 QA + 1 checklist item pending human ES.
- All 5 assembly costs are estimates.
- No honest building-sequence gate; consider an acoustical/field-sound-test checkpoint type.
- IRC Appendix AK section numbering assumed (AK103 impact sound) — verify against the adopted edition.
