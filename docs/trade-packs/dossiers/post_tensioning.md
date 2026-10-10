# Dossier — `post_tensioning` (Post-Tensioning)

> Wave: w08 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/post_tensioning.ts` · Status: draft
> Taxonomy: category `concrete_masonry` · permit_trade `building` · phase `foundation` · CSI `03 38`

## Scope (2–4 sentences)
Places, stresses and finishes PT tendons: unbonded monostrand slab-on-ground foundations (expansive-soil
residential), elevated two-way PT decks (podium / parking / MF), and bonded grouted systems. Covers anchors,
chairs/profile, pre-pour inspection, stressing + elongation records, tail cutting, pocket patching and the
owner no-cut warning, plus scan-before-cut work on existing PT slabs. Does NOT pour/finish the concrete
(concrete / concrete_flatwork), build forms or shoring (formwork), or place mild steel beyond anchorage-zone
bars (rebar). Tendon design is by the engineer of record / PT supplier.

## Existing coverage reconciled
- Hand recipe: none (not in HAND_RECIPE_KEYS) → NEW-TRADE pattern, 3 recipes.
- Catalog codes already seeded: none `B-PT-*`. Concrete/slab lines (B-SLAB-SF, B-CONCRETE-CY, B-REBAR-LF) stay with their trades.
- Blueprint template tasks hitting this trade: none.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| post_tensioning-ufgs-03-23-00 | UFGS 03 23 00 Stressed Tendon Reinforcing (2016/2018) | 1 | public_domain | execution steps, QA numbers (48 in. support, 7% reconciliation, 6-mo calibration, tail 1/2–3/4 in., pocket within 1 day, grout within 7 days) |
| post_tensioning-pti-edc130 | PTI EDC-130 Section 2 — PT Systems | 4 | association_public | encapsulation, pocket formers, chairs to profile, vibration at anchors, approve elongations before tails |
| post_tensioning-pti-cert | PTI field certification (Level 1/2 installer & inspector) | 4 | association_public | certified crew; M10.3 / DC10.5 named only |
| ecfr-1926-q / m / i / e / c / z | 29 CFR 1926 | 1 | public_domain | hazards — 1926.701(a)(b)(c)(1)(c)(2), 1926.703(e)(1), 1926.501(b)(1), 1926.302(d)(2), 1926.102(a)(1), 1926.95(a), 1926.20(b)(1), 1926.1153 (texts checked on law.cornell.edu) |
| icc-pa | ICC IRC/IBC | 3 | ref only | R109.1.1, R506, 110.3.1, 1808.6.2, 1705.3, 1901.2 |
| rebar-aci-318 | ACI 318 | 3 | ref only | 25.9 anchorage zones |

## Work steps (draft → pack recipes)
- `pt_slab_on_grade` (default): drawings/layout → place anchors, tendons, chairs → pre-pour inspection (gate **foundation**; IRC R109.1.1, IBC 110.3.1, IBC 1808.6.2) → pour/consolidate at anchors → stress + elongations → cut tails, pockets, no-cut warning.
- `pt_elevated_deck` (priority 10): drawings + shoring plan → tendons to profile + anchorage-zone steel → pre-pour + special inspection (gate **framing**; IBC 1705.3, 1901.2, ACI 318 25.9) → pour, stress (bonded: grout) → pockets, then release shores.
- `pt_scan_before_cut` (priority 20, no gates): scan + mark → engineer-approved cut, dust control → report hit tendon.

Gate choice: SOG pre-pour = foundation inspection (it is the foundation). Elevated deck = `framing`, the
structural-frame inspection in the building family; the real hold point is the IBC 1705.3 special inspection —
logged as a scope note.

## Hazards (draft → pack hazards)
12: behind_jack 1926.701(c)(1) s4 · stressing_zone 1926.701(c)(2) s4 · rebar_impalement 1926.701(b) s3 ·
construction_loads 1926.701(a) s3 · premature_stripping 1926.703(e)(1) s4 · deck_edge 1926.501(b)(1) s4 ·
hydraulic_hose 1926.302(d)(2) s3 · tail_cutting 1926.102(a)(1) s2 · cement_contact 1926.95(a) s2 ·
live_tendon_cut 1926.20(b)(1) s4 · silica 1926.1153 s3 · material_handling 1926.20(b)(1) s2.

## QA checklist
15 items (3 safety → ES pending): drawings on site, anchors square, live/dead ends, profile + 48 in. support,
sheathing repaired, anchorage-zone bars, consolidation at anchors, stressing strength, calibrated jack/gauge,
elongations within 7%, tails after approval, pockets within a day, shores after stressing*, PT warning*, scan before cut*.

## Inspection / acceptance checkpoints
- foundation: tendon count/spacing/ends, chairs/ties/sheathing, anchors + backup bars, vapor retarder (R506).
- framing: profile, anchorage-zone steel (ACI 318 25.9), special inspector (1705.3).
- final: stressing records approved; pockets patched; warning posted.

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| B-PT-SOG-SF | SOG tendon system adder | SF | 55 | 0.012 | 0 | 3 | estimate — ≈0.5 LF strand/SF + anchors; 3-person crew 2,000 SF/day |
| B-PT-ELEV-SF | Elevated PT deck tendon system | SF | 220 | 0.03 | 15 | 3 | estimate |
| B-PT-STRESS-EA | Stress one tendon | EA | 0 | 0.1 | 150 | 0 | estimate — 2-person crew ≈20/h; jack/pump rental share |
| B-PT-POCKET-EA | Pocket cap + patch | EA | 150 | 0.1 | 0 | 10 | estimate |
| B-PT-SCAN-EA | GPR scan per location | EA | 15000 | 0.25 | 0 | 0 | estimate — service with trip minimum |

## Quantity rules
- `B-PT-SOG-SF` = area_sf_sum (when slab_on_grade).
- `B-PT-STRESS-EA` = area_sf_sum × 0.012 ceil (≈4 ft spacing both ways).
- `B-PT-POCKET-EA` = area_sf_sum × 0.012 ceil (single-end stressing).

## Blueprint callouts (components)
- none this wave (a `post_tensioned_slab` callout like "POST-TENSIONED SLAB PER PTI" is a candidate later).

## Open questions → REVIEW_QUEUE
- Elevated-deck gate mapped to `framing`; a dedicated pre-pour/special-inspection type does not exist.
- All costs are platform estimates.
- Quantity rules fire whenever the PT trade is scheduled and a slab is called out; area_sf_sum approximates slab footprint.
