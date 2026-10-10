# Dossier — `acoustical_ceilings` (Acoustical Ceilings)

> Wave: w15 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/acoustical_ceilings.ts` · Status: draft
> Taxonomy: category `interior` · permit_trade `building` · phase `finishes_interior` · CSI `09 51`

## Scope (2–4 sentences)
Suspended acoustical ceilings: hanger wires to structure, wall angle, main runners and cross tees, seismic
perimeter and splay bracing (SDC D–F), support of lights/diffusers/sprinkler clearance, and lay-in tiles.
Also tile replacement in existing grid and specialty clouds/baffles. Hand-offs: framed drywall ceilings =
`metal_stud_framing` (B-MSF-CEIL-SF); asbestos tile removal = `abatement` (B-ABT-CEIL-SF); above-ceiling
MEP/sprinkler/firestop = their trades (this trade holds for the above-ceiling inspection).

## Existing coverage reconciled
- Hand recipe: none (not in HAND_RECIPE_KEYS) → NEW-TRADE pattern, 3 recipes.
- Catalog: no acoustical ceiling codes existed (B-MSF-CEIL-SF and B-ABT-CEIL-SF are other scopes). New prefix `B-ACT-`.
- Blueprint templates: `Suspended acoustic ceiling system` (commercial.ts) and `Office ceiling grid & tiles`
  (industrial.ts) → both matched by `suspended_grid` title_re (verified via pack:check example + regex).

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| acoustical_ceilings-ufgs-09-51-00 | UFGS 09 51 00 Acoustical Ceilings (Aug 2020) | 1 | public_domain | acclimation/environment, scheduling (above-ceiling first), hangers plumb, no deck-underside hangers, 4 wires at fixtures, splay/counter-splay, wall molding fastening, border minimum, hold-down clips, access panels, cleaning |
| acoustical_ceilings-bellevue-checklist | City of Bellevue suspended ceiling inspection checklist (SDC D–F, 2022) | 1 | gov_open | IBC 808.1.1 → C635/C636; E580 seismic perimeter, wire turns, 1:6 plumb, bracing >1,000 SF, fixture support, sprinkler rings |
| acoustical_ceilings-armstrong-howto | Armstrong suspended ceiling install guide | 5 | manufacturer_public | balanced borders, mains 4 ft, 3-turn wraps, cut face up, no insulation on panels |
| acoustical_ceilings-astm-c636 / -astm-e580 / -cisca | ASTM C636, ASTM E580, CISCA | 4 | proprietary_ref_only | reference only |
| icc-pa | ICC public access | 3 | proprietary_ref_only | IBC 808.1.1, IBC 1613.1 |
| nfpa-fa | NFPA free access | 3 | proprietary_ref_only | NEC 410.36(B), NEC 300.11 |
| ecfr-1926-{c,d,e,i,k,l,m,x,z} | 29 CFR 1926 | 1 | public_domain | hazards (sections re-read on law.cornell.edu 2026-10-08) |

## Work steps (draft → pack recipes)
- `suspended_grid`: above-ceiling confirm + acclimate → layout + wall angle (IBC 808.1.1) → hanger wires (808.1.1) → mains/tees + seismic (IBC 1613.1) → lights/diffusers/sprinklers (NEC 410.36(B), 300.11) → tiles + clean, gate `final`.
- `tile_replacement` (priority 5): asbestos survey + cause + match rating → remove/replace → HEPA clean.
- `clouds_baffles` (priority 10): layout vs sprinklers → cables to structure → mount, gate `final`.

## Hazards (draft → pack hazards)
lift_fall 1926.451(g)(1) · scaffold_ride 1926.452(w)(6) · ladder_top_step 1926.1053(b)(13) · live_wiring 1926.416(a)(1) · pat_tool 1926.302(e)(1) · silica_drilling 1926.1153(c)(1) · eye_debris 1926.102(a)(1) · sharp_edges 1926.95(a) · falling_objects 1926.501(c) · fiber_dust 1926.55(a) · asbestos_survey 1926.1101(k)(2)(i) · housekeeping 1926.25(a).

## QA checklist
15 items; 8 safety (ES pending): above-ceiling sign-off, hanger spacing, seismic perimeter, seismic bracing, fixture support, wiring independent, sprinkler clearance, replacement fire rating.

## Inspection / acceptance checkpoints
- `above_ceiling_inspection` (hold point, not a family gate): MEP complete, sprinkler drops, dampers + access, firestopping, hangers, fixture support, seismic bracing.
- `final`: level/square/borders, tiles clean, sprinklers/lights aligned, access tiles + attic stock.

## Cost basis (platform-baseline estimates, 2026-10-08)
| Code | Item | Unit | Material ¢ | Labor hr | Equip ¢ | Waste % |
|---|---|---|---|---|---|---|
| B-ACT-SYS-SF | 15/16 grid + 2x2 mineral-fiber tile system | SF | 230 | 0.02 | 6 | 6 |
| B-ACT-GRID-SF | grid + wire + angle only | SF | 105 | 0.013 | 5 | 5 |
| B-ACT-TILE-REPL-SF | remove/replace tile in existing grid | SF | 135 | 0.012 | 0 | 8 |
| B-ACT-SEIS-SF | SDC D–F seismic adder | SF | 35 | 0.006 | 1 | 5 |

## Quantity rules
- B-ACT-SYS-SF = area_sf_sum × 0.6 (commercial); × 0.1 (industrial offices).
- B-ACT-SEIS-SF = same areas when `has_seismic_design` (flag fires on any SDC callout — assumption says delete for A–C).
- B-ACT-GRID-SF / B-ACT-TILE-REPL-SF: manual lines (no fact distinguishes them).

## Blueprint callouts (components)
None this wave.

## Open questions → REVIEW_QUEUE
- Safety ES pending (12 hazards, 8 QA, 7 inspection items).
- All 4 B-ACT costs are platform estimates.
- `has_seismic_design` does not carry the category letter → seismic adder may over-apply in SDC A–C.
- IBC 808.1.1 / 1613.1 confirmed via Bellevue checklist (2018 IBC era); re-check numbering in the adopted edition.
- No `above_ceiling` inspection type in the building family; kept as a checklist key.
