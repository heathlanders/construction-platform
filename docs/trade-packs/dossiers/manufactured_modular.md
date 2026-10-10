# Dossier — `manufactured_modular` (Manufactured / Modular Home Set)

> Wave: w07 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/manufactured_modular.ts` · Status: draft
> Taxonomy: category `structural` · permit_trade `building` · phase `framing` · CSI `13 42`

## Scope (2–4 sentences)
Installs factory-built homes on site. Two distinct jobs: (1) **HUD-code manufactured homes** — site
prep, footings, piers, leveling, ground anchors, marriage-line join, utility crossovers, skirting, per
24 CFR 3285 (WI adopts it by reference in SPS 321.40); (2) **state-code modular homes** — crane set onto a
permanent foundation built to the manufacturer's plan, module-to-module stitch, hinged-roof raise and
button-up, inspected under the UDC/IRC. Does NOT build the permanent foundation (concrete/masonry), make
utility service connections (licensed electrical/plumbing/gas trades), or supply the crane (crane_service).

## Existing coverage reconciled
- Hand recipe: none → NEW-TRADE pattern (2 recipes).
- Catalog codes already seeded: none with `B-MOD-`; `B-FOOTING`, `EQUIP-CRANE` exist (not redeclared).
- Blueprint template tasks hitting this trade: none.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| manufactured_modular-ecfr-24-3285 | 24 CFR 3285 Model Manufactured Home Installation Standards | 1 | public_domain | HUD recipe steps, QA numbers, code refs |
| manufactured_modular-ecfr-24-3286 | 24 CFR 3286 Installation Program | 1 | public_domain | inspection elements (3286.505) |
| manufactured_modular-hud-mhs | HUD Office of Manufactured Housing Programs | 1 | gov_open | context (not cited in pack) |
| manufactured_modular-wi-sps321-40 | WI SPS 321.40 installation standards | 1 | gov_open | WI adopts 3285 |
| manufactured_modular-wi-sps320 | WI SPS 320 UDC administration | 1 | gov_open | modular: insignia, permit (320.13), inspections (320.10) |
| icc-pa | ICC codes (IRC) | 3 | proprietary_ref_only | R301.1, R403.1, R403.1.6, R602.3, R314, R315 section refs |
| ecfr-1926-cc/h/i/m/p/k/f/o/x/e | 29 CFR 1926 subparts | 1 | public_domain | hazards |
| platform-baseline | expert baseline | — | platform_estimate | costs, modular set QA |

## Work steps (draft → pack recipes)
**hud_manufactured_install** (title_re manufactured/mobile/HUD home, HUD-code, single/double-wide; priority 10)
1. Check data plate, soil and drainage — 3285.202/.203/.204.
2. Footings + piers — 3285.312, 3285.310. Gate: footing.
3. Jack, level, block — 3285.6 (≤1/4 in. between adjacent piers), 3285.305 (12 in. clearance).
4. Ground anchors + straps — 3285.402, 3285.404. Gate: foundation.
5. Join sections / marriage-line close-up — 3285.802, 3285.801. Gate: framing.
6. Crossovers, skirting, final — 3285.604, 3285.505, WI SPS 321.40. Gate: final.

**modular_crane_set** (title_re modular, crane-set, set the home/boxes)
1. Check foundation + sill before delivery — IRC R403.1.6, WI SPS 320.13. Gate: foundation.
2. Plan the lift and stage the crane.
3. Set the modules.
4. Stitch marriage line, raise hinged roof — IRC R301.1, R602.3. Gate: framing.
5. Button up, final — IRC R314, R315. Gate: final.

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| crane_load | struck/crushed by suspended module | 1926.1425(b) | 4 |
| crane_swing | crane swing radius | 1926.1424(a)(2) | 3 |
| crane_powerline | boom/load contacts power line | 1926.1408 | 4 |
| rigging_failure | sling/shackle/spreader failure | 1926.251(a)(1) | 4 |
| jack_crush | home slips off jacks | 1926.305(d)(1)(i) | 4 |
| roof_fall | fall from module roof / open edge | 1926.501(b)(13) | 4 |
| buried_utility | anchors/footings hit buried lines | 1926.651(b)(1) | 3 |
| electric_crossover | shock at crossover/service | 1926.416(a)(1) | 3 |
| gas_leak | leaking gas crossover | 1926.151(a) | 4 |
| vehicle_backing | carrier/toter backing | 1926.601(b)(4) | 3 |
| ladder | ladder fall at ridge/seams | 1926.1053(b)(1) | 3 |
| eye_flying | chips/fasteners | 1926.102(a)(1) | 2 |

## QA checklist
15 items — drainage (1/2 in./ft for 10 ft), vapor retarder (6 mil, 12 in. laps), footing bearing/frost,
pier layout (≤24 in. from ends), level (≤1/4 in.), anchors listed + stabilizer plate + angle (safety),
mate line tight, drain crossover slope (1/4 in./ft; 1/8 with cleanout), gas tested (safety), electrical
crossover (safety), skirting vents/access (18×24 in.), smoke/CO alarms (safety), modular foundation to
plan, lift plan (safety), state insignia/HUD label.

## Inspection / acceptance checkpoints
- footing: footing bearing/frost, organics removed, drainage.
- foundation: pier spacing per blocking diagram, anchors per 3286.505(e), modular sill anchorage.
- framing: mate-line interconnection, module-to-module and hinged-roof connections.
- final: crossovers tested, skirting/vents/access, alarms, HUD label / WI insignia.

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| B-MOD-CRANE-SET-EA | crane set per module | EA | 2500 | 6 | 130000 | 0 | estimate — ~$4,000 crane day / 3 modules |
| B-MOD-STITCH-LF | marriage-line stitch + close-up | LF | 1200 | 0.6 | 0 | 10 | estimate |
| B-MOD-PIER-EA | pad + block pier + cap/shims | EA | 7500 | 0.75 | 0 | 5 | estimate |
| B-MOD-ANCHOR-EA | ground anchor + plate + strap | EA | 4500 | 0.75 | 500 | 0 | estimate |
| B-MOD-SKIRT-LF | vinyl skirting w/ vents + access | LF | 1100 | 0.15 | 0 | 8 | estimate |

## Quantity rules
- `B-MOD-PIER-EA` = area_sf_sum × 0.025 (ceil), residential_sf.
- `B-MOD-ANCHOR-EA` = area_sf_sum × 0.011 (ceil), residential_sf.
- `B-MOD-STITCH-LF` = const 56, residential_sf.
- `B-MOD-CRANE-SET-EA` = const 2, residential_sf (remove for HUD homes).

## Blueprint callouts (components)
- none this wave.

## Open questions → REVIEW_QUEUE
- All 5 B-MOD costs are platform estimates.
- Equipment vocab lacks a manufactured-home positioning machine ("toter"/"mule"); skid_steer used as stand-in.
- Quantity consts (crane 2 modules, 56 LF stitch) fire for HUD homes too; consider a HUD-vs-modular fact.
- HUD gates mapped onto the building sequence (piers=footing, anchors=foundation, mate line=framing) — confirm with a WI UDC inspector.
- WI SPS 321.40 adopts 3285 "as in effect on December 1, 2014" — eCFR current text may differ slightly.
