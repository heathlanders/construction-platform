# Dossier — `mechanical_insulation` (Mechanical / Pipe Insulation)

> Wave: w14 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/mechanical_insulation.ts` · Status: draft
> Taxonomy: category `mechanical_systems` · permit_trade `mechanical` · phase `insulation` · CSI `23 07`

## Scope (2–4 sentences)
Insulates HVAC and plumbing piping, ductwork and mechanical equipment after the piping/duct trade has
pressure- or leakage-tested it: material and thickness per schedule, continuous vapor retarder on cold
service, fitting/valve covers, metal or PVC jackets outdoors and in high-abuse areas, hanger shields and
inserts, labels. Does NOT do firestop systems (firestopping), grease duct fire wrap (kitchen_exhaust,
`M-KEX-WRAP-LF`), building envelope insulation (insulation), or asbestos removal (abatement).

## Existing coverage reconciled
- Hand recipe: none (not in `HAND_RECIPE_KEYS`); only the generic mechanical phase recipe applies → pack is NEW-TRADE.
- Catalog codes already seeded: `M-DUCT-INSUL-LF` (0030, duct wrap per LF) — not redeclared; pack adds pipe/jacket/fitting items only.
- Blueprint template tasks hitting this trade: none. Recipes keyed by `title_re` (pipe insulation, duct insulation/wrap, equipment insulation, lagging, jacketing, mechanical insulation).

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| mechanical_insulation-ufgs-23-07-00 | UFGS 23 07 00 Thermal Insulation for Mechanical Systems (Aug 2024) | 1 | public_domain | steps, QA, 25/50 rating, hangers, vapor retarder, jackets |
| mechanical_insulation-nia-midg | NIBS/NIA Mechanical Insulation Design Guide | 4 | association_public | vapor retarder, duct wrap, labels |
| mechanical_insulation-3e-plus | NAIMA 3E Plus calculator | 4 | association_public | method reference only (not cited in pack data yet) |
| ecfr-1926-z | 1926 Subpart Z (1926.1101 asbestos — PACM = TSI ≤1980, owner (k)(2)(i)) | 1 | public_domain | hazard |
| ecfr-1926-c/d/e/l/m/x/aa | 1926 subparts | 1 | public_domain | hazards |
| icc-pa | IECC C403.12.1/C403.12.3/C403.12.3.1, R403.3.1/R403.4/R403.4.1; IMC 604.1/604.3/1204.1; IBC 714 | 3 | proprietary_ref_only | code refs (numbers only) |

## Work steps (draft → pack recipes)
- `pipe_insulation` (6): tests released (gate gas_refrigerant_test; asbestos stop rule) → material/thickness/rating check → straight runs through hangers (rough_in) → cold-line vapor retarder + fittings (rough_in) → outdoor jacket (final) → penetrations + labels (final).
- `duct_insulation` (4): wait for leakage test (duct_leakage) → wrap uncompressed (rough_in) → seal facing on cold duct (rough_in) → weatherproof outdoor + patch after TAB (final).
- `equipment_insulation` (3): plan removable covers → insulate/seal (final) → jacket.

## Hazards (draft → pack hazards)
asbestos_tsi 1926.1101(k)(2)(i) sev4 · fiber_irritation 1926.55(a) · adhesive_vapors 1926.59 · knife_cuts / sheet_metal_cut 1926.95(a) · hot_surface 1926.28(a) · ladder 1926.1053(b)(1) · aerial_lift 1926.453(b)(2)(v) · scaffold 1926.451(g)(1) · roof_edge 1926.501(b)(10) · confined_space 1926.1203(a).

## QA checklist
15 items (UFGS 23 07 00 Part 3 + MIDG); safety-flagged: flame/smoke rating, penetrations continuous for firestop.

## Inspection / acceptance checkpoints
gas_refrigerant_test, duct_leakage (before cover), rough_in (material/thickness/rating/vapor retarder), final (exterior protection, firestopped penetrations).

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| M-INS-FG-PIPE-LF | Fiberglass + ASJ 1 in. on ≤2 in. pipe | LF | 300 | 0.08 | 0 | 10 | platform-baseline estimate |
| M-INS-ELAST-PIPE-LF | Elastomeric 3/4–1 in. wall | LF | 280 | 0.07 | 0 | 10 | platform-baseline estimate |
| M-INS-ALUM-JKT-LF | Aluminum jacket outdoor | LF | 250 | 0.06 | 0 | 12 | platform-baseline estimate |
| M-INS-FITTING-EA | PVC fitting/valve cover + insert | EA | 600 | 0.2 | 0 | 5 | platform-baseline estimate |

## Quantity rules
- `M-INS-ELAST-PIPE-LF` = fau × 25 (matches hvac line-set assumption)
- `M-INS-FG-PIPE-LF` = water_heater × 10
- commercial const: FG 200 LF, elastomeric 80 LF, fittings 28 EA, aluminum jacket 40 LF

## Blueprint callouts (components)
- none this wave.

## Open questions → REVIEW_QUEUE
- IECC section numbers assume the 2021 edition (C403.12.x; 2018 used C403.11.x) — confirm AHJ edition.
- R403.3.1 heading wording for 2021 vs 2024 (duct insulation outside conditioned space) — verify.
- IMC 604.3 / 1204.1 flame-spread/smoke sections cited from memory of the IMC structure — verify on ICC public access.
- All four costs are platform estimates.
