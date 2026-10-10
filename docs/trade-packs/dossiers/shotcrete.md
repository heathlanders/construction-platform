# Dossier — `shotcrete` (Shotcrete / Gunite)

> Wave: w08 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/shotcrete.ts` · Status: draft
> Taxonomy: category `concrete_masonry` · permit_trade `building` · phase `foundation` · CSI `03 37`

## Scope (2–4 sentences)
Pneumatic placement of concrete — wet-mix shotcrete (pumped, air at the nozzle) and dry-mix gunite (water at
the nozzle) — for walls, soil-nail / shoring facing, pool and tank shells and repairs. Covers surface prep,
shooting wires, nozzleman qualification, test panels, layered shooting, finishing, curing, sounding/cores and
defect repair. Reinforcement supply/placement is the `rebar` trade, excavation and soil nails are
`excavation` / `shoring_underpinning`, pool plumbing/bonding/plaster belong to `pools_spas`.

## Existing coverage reconciled
- Hand recipe: none → NEW-TRADE pattern (two recipes, title-matched).
- Catalog codes already seeded: none for shotcrete (B-CONCRETE-CY / B-FLAT-* are cast-in-place / flatwork).
- Blueprint template tasks hitting this trade: none.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| shotcrete-ufgs-03-37-13 | UFGS 03 37 13 — Shotcrete (Aug 2026) | 1 | public_domain | steps, QA, panels, curing, repair, inspection items |
| shotcrete-aci-cert | ACI certification programs (Shotcreter dry/wet, Shotcrete Inspector) | 4 | association_public | nozzleman certification QA |
| shotcrete-aci-506 | ACI PRC-506-22 Shotcrete — Guide / PRC-506.1-21 | 3/4 | proprietary_ref_only | reference only (title) |
| ecfr-1926-q | 29 CFR 1926 Subpart Q | 1 | public_domain | 1926.701(b), 1926.702(e)(2), 1926.702(j)(1) |
| ecfr-1926-z | 29 CFR 1926.1153 silica | 1 | public_domain | (c)(1) Table 1 chipping/coring, (d) shooting |
| ecfr-1926-e / -l / -m / -p | Subparts E, L, M, P | 1 | public_domain | PPE, scaffold, dig edge, cave-in |
| icc-pa | IRC R404.1, IBC 1705.3 | 3 | proprietary_ref_only | code refs (section + paraphrase) |
| nfpa-fa | NEC 680.26(B)(1) | 3 | proprietary_ref_only | pool shell steel bonding before cover |

## Work steps (draft → pack recipes)
`structural_shotcrete` (title_re shotcrete|gunite|sprayed concrete):
1. **Prepare the receiving surface and forms** — SSD, no standing water, vented forms. QA surface_ssd, forms_vented.
2. **Set the reinforcement and shooting wires** — non-contact laps parallel to shooting, rigid ties, cover, ground wires. Code IRC R404.1, IBC 1705.3. Gate: foundation.
3. **Qualify the nozzlemen and shoot test panels** — ACI shotcreter cert; preconstruction panels per mix/nozzleman/position; production panels per spec frequency.
4. **Shoot in layers and encase the steel** — corners first, perpendicular, blowpipe, no rebound reuse, layer bond, weather limits.
5. **Screed, finish and cure** — cutting screed after initial set, finish, ~7-day cure.
6. **Sound, core and repair before final** — sound, core where directed, square-edged repairs, reports. Code IBC 1705.3. Gate: final.

`pool_shell` (pool/spa + shotcrete/gunite, priority 10): check dig/steel/bonding (NEC 680.26(B)(1), no building gate — bonding is an electrical inspection) → shoot walls/coves/floor → bond beam/steps trim → wet cure ~7 days.

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| hose_whip | Hose whip / burst / plug blowout | 1926.702(e)(2) | 4 |
| pump_lockout | Servicing pump/gun/compressor | 1926.702(j)(1) | 4 |
| silica_dust | Silica at gun/nozzle (not a Table 1 task) | 1926.1153(d) | 3 |
| silica_chip_core | Chipping and coring dust | 1926.1153(c)(1) | 3 |
| cement_burn | Wet cement burns | 1926.95(a) | 3 |
| eye_rebound | Rebound / overspray to eyes | 1926.102(a)(1) | 3 |
| noise | Compressor / gun noise | 1926.101(a) | 2 |
| rebar_impale | Protruding bars | 1926.701(b) | 4 |
| cave_in | Cut faces, soil-nail lifts, pool digs | 1926.652(a)(1) | 4 |
| dig_edge_fall | Fall into pool dig / pit | 1926.501(b)(7) | 3 |
| scaffold_fall | Scaffold over 10 ft | 1926.451(g)(1) | 4 |

## QA checklist
19 items (18 translated, 1 safety pending ES) — all from UFGS 03 37 13 Part 1.5–1.7 and Part 3 except
nozzleman_cert (+ACI listing), reports_filed (IBC 1705.3) and pool_bonding_signed (NEC 680.26, safety).

## Inspection / acceptance checkpoints
- foundation: steel per plans, ground wires, nozzleman certs + panel results, surface prep.
- final: panel/core strength results, no open defects, special inspection reports.

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| B-SHOT-WET-CY | Wet-mix shotcrete placed | CY | 23000 | 1.6 | 6000 | 10 | platform-baseline estimate |
| B-SHOT-DRY-CY | Dry-mix gunite placed | CY | 19000 | 2.2 | 5000 | 25 | platform-baseline estimate |
| B-SHOT-FINISH-SF | Screed + finish + cure | SF | 15 | 0.03 | 0 | 5 | platform-baseline estimate |
| B-SHOT-PANEL-EA | Test panel incl. cores + lab | EA | 55000 | 1.5 | 0 | 0 | platform-baseline estimate |
| B-SHOT-CORE-EA | In-place core + patch + test | EA | 20000 | 1.25 | 6000 | 0 | platform-baseline estimate |

## Quantity rules
- `B-SHOT-PANEL-EA` = const 2 (commercial / industrial) — preconstruction panel allowance.
- `B-SHOT-PANEL-EA` = const 1 (residential_sf / residential_mf) — delete for non-structural pool shells.
No blueprint fact gives shotcrete volume or area; placement lines are left to the estimator.

## Blueprint callouts (components)
- none this wave.

## Open questions → REVIEW_QUEUE
- American Shotcrete Association (shotcrete.org) returns 403 to scripts — position statements not cited; verify manually.
- IBC chapter 19 shotcrete section (1908 in older editions) could not be verified — only 1705.3 cited.
- Pool pre-gunite bonding is an electrical inspection; no building-family gate fits — consider an `inspection_checklists`-only hold point or a pools_spas cross-reference.
- All five costs are platform estimates.
