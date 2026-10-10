# Dossier — `structural_steel` (Structural Steel Erection)

> Wave: w11 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/structural_steel.ts` · Status: draft
> Taxonomy: category `structural` · permit_trade `building` · phase `framing` · CSI `05 12`

## Scope (2–4 sentences)
Erects fabricated hot-rolled structural steel: anchor rod survey and written notices, crane set of
columns, beams, girders and bracing per the erection drawings, plumbing-up with temporary bracing,
permanent bolt-up (snug-tight or pretensioned), base-plate grouting and field touch-up. Does NOT
cover metal decking (`metal_decking`), structural field welding as a scope (`welding`), stairs/rails
(`misc_metals`) or pre-engineered metal buildings (`pemb`) — those are separate packs.

## Existing coverage reconciled
- Hand recipe: none → NEW-TRADE pattern (two recipes).
- Catalog codes already seeded: none for steel erection. `B-PEMB-ANCHOR-EA` (pemb) covers rod supply/set; this pack adds only the pre-erection survey.
- Blueprint template tasks: `Structural steel erection` (commercial), `Primary structural steel erection (columns & frames)` and `Secondary steel, purlins, girts & bracing` (industrial). The first two hit `primary_erection`; the third hits `secondary_steel` (priority 10).

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| structural_steel-ufgs-05-12-00 | UFGS 05 12 00 Structural Steel (Chg 2 05/21) | 1 | public_domain | steps, QA (grout, storage, bolting, DTI, priming, no torch holes) |
| ecfr-1926-r | 29 CFR 1926 Subpart R — Steel Erection | 1 | public_domain | hazards, notices (.752), rigging (.753), stability (.754), anchorage (.755), beams/columns (.756), falling objects (.759), fall protection (.760) |
| ecfr-1926-cc | 29 CFR 1926 Subpart CC — Cranes | 1 | public_domain | power lines (.1408), swing radius (.1424) |
| structural_steel-rcsc-2020 | RCSC Specification 2020 | 4 | association_public | snug-tight vs pretensioned, pre-installation verification, sequence |
| structural_steel-aisc-303 | ANSI/AISC 303-22 Code of Standard Practice | 4 | association_public | anchor rod / temporary support responsibilities (paraphrase, no sections) |
| icc-pa | ICC IBC | 3 | proprietary_ref_only | 2204, 2205, 2210, 1705.2 |
| platform-baseline | Platform estimate | — | platform_estimate | all costs |

## Work steps (draft → pack recipes)
`primary_erection`: 1 survey anchor rods + written notices (1926.752/.755) · 2 site, crane and lift plan (1926.752(c), .753, CC) · 3 set columns + temporary bracing (.755(a)) · 4 connect beams — two bolts before release, double connections (.756) · 5 plumb, bolt up (RCSC 8.1/8.2), grout, touch up — gate `framing`, IBC 2205/2204/1705.2.
`secondary_steel`: 1 check primary frame + plumbing-up (.754(d)) · 2 hoist/land, multiple lifts (.753(e)) · 3 girts/purlins/sag rods/bracing · 4 final check + touch-up — gate `framing`, IBC 2205/2210/1705.2.

## Hazards (draft → pack hazards)
| id | OSHA ref | Sev |
|---|---|---|
| connector_fall | 1926.760(b)(1) | 4 |
| edge_fall | 1926.760(a)(1) | 4 |
| green_concrete | 1926.752(b) | 4 |
| column_stability | 1926.755(a)(1) | 4 |
| structure_stability | 1926.754(a) | 4 |
| release_bolts | 1926.756(a)(1) | 4 |
| double_connection | 1926.756(c)(1) | 4 |
| suspended_load | 1926.753(d)(1) | 4 |
| multiple_lift | 1926.753(e)(1) | 4 |
| swing_radius | 1926.1424(a)(2) | 4 |
| power_line | 1926.1408(a) | 4 |
| falling_objects | 1926.759(a) | 3 |

## QA checklist
15 items — anchor survey, concrete notice*, four rods*, rod modification approval*, storage, temp bracing*, two bolts before release*, no torch holes, pre-installation verification, snug-tight, pretension sequence, DTI gap, bolt storage, grout full bearing, field prime (* safety, ES pending).

## Inspection / acceptance checkpoints
- foundation: anchor rod as-built; written concrete-strength notice.
- framing: erection drawings on site; bolting per joint type + records; bracing + grout; special inspection (IBC 1705.2).

## Cost basis
| Code | Unit | Material ¢ | Labor hr | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|
| B-STL-FAB-TON | TON | 400000 | 0 | 0 | 0 | estimate — delivered fabricated low-rise steel |
| B-STL-ERECT-TON | TON | 3000 | 10 | 25000 | 0 | estimate — ~5-person crew ~4 t/day |
| B-STL-ANCHOR-SURVEY-EA | EA | 0 | 0.5 | 500 | 0 | estimate |
| B-STL-TEMP-BRACE-TON | TON | 1500 | 0.75 | 0 | 0 | estimate |
| B-STL-TOUCHUP-TON | TON | 800 | 0.5 | 0 | 10 | estimate |
| B-STL-HSBOLT-EA | EA | 600 | 0.05 | 0 | 3 | estimate — no quantity rule (count from connection schedule) |

WisDOT structural steel bid items are bridge work priced per LB — not representative of building
frames, so not used.

## Quantity rules
- FAB / ERECT / TEMP-BRACE / TOUCHUP TON = area_sf_sum × 0.0045 (≈9 lb/SF), commercial + industrial.
- ANCHOR-SURVEY EA = area_sf_sum × 0.00111 (one column per ~900 SF bay), commercial + industrial.

## Blueprint callouts (components)
- none this wave.

## Open questions → REVIEW_QUEUE
- AISC 303 URL sits behind Cloudflare (403 to scripts) — verify in a browser.
- All costs are platform estimates; tonnage-per-SF rule is a crude conceptual factor.
- IBC 2204 "Connections" section number — confirm against the adopted edition.
