# Dossier — `terrazzo` (Terrazzo)

> Wave: w15 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/terrazzo.ts` · Status: draft
> Taxonomy: category `interior` · permit_trade `null` · phase `finishes_interior` · CSI `09 66`

## Scope (2–4 sentences)
Poured-in-place terrazzo (thin-set epoxy over a slab; bonded and sand-cushion cementitious systems with
an underbed), cast-in-place cove base and stairs, and precast terrazzo tile, base and stair treads.
Covers substrate acceptance, crack-isolation membrane, divider/control-joint strip layout, placing,
wet grinding, grouting, fine grinding, cleaning and sealing, plus restoration regrinds. Does NOT
include slab placement, moisture mitigation by others, or stair structure (concrete/steel pans).

## Existing coverage reconciled
- Hand recipe: `task-buildout/nopermit.ts` shared flooring case (`Prep & acclimate` → `Install flooring`);
  `terrazzo` is in `HAND_RECIPE_KEYS` → pack **complements** (recipes: []).
- Catalog codes already seeded: none for terrazzo (`G-FLOOR-EPOXY-SF` is a resinous coating, `G-POL-*`
  polished concrete, `G-TILE-FLOOR-SF` tile — not redeclared).
- Blueprint template tasks hitting this trade: none.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| terrazzo-ufgs-09-66-13 | UFGS 09 66 13 Portland Cement Terrazzo | 1 | public_domain | strips, panel size, grind/grout sequence, 70% chips, flatness, sealing |
| terrazzo-ufgs-09-66-16 | UFGS 09 66 16 Terrazzo Floor Tile | 1 | public_domain | precast tile/base prep, setting, protection |
| terrazzo-ufgs-09-66-23 | UFGS 09 66 23 Resinous Matrix Terrazzo | 1 | public_domain | 28-day slab, temperature window, thickness, conductive test |
| terrazzo-ntma-epoxy-spec | NTMA guide spec 09 66 23.16 Epoxy Terrazzo | 4 | association_public | flatness, moisture, membrane, strips in epoxy, grit sequence, precast, mockup, temperatures |
| terrazzo-ntma-systems | NTMA Types & Systems pages | 4 | association_public | system thickness/weight, divider placement over joints, sand-cushion spacing, precast treads |
| terrazzo-ntma-sealer-guide | NTMA Sealer Reference Guide | 4 | association_public | sealer selection, COF depends on sealer |
| concrete_cutting-mpca-slurry | MPCA concrete slurry guidance (reused) | 1 | gov_open | slurry disposal |
| ecfr-1926-c/d/e/f/k/x/z | 29 CFR 1926 subparts | 1 | gov_open | hazards |

## Work steps (draft → pack recipes)
None — complement pattern. Hand recipe stays: Prep & acclimate → Install flooring. Pack adds equipment
hints (generator; forklift on commercial/MF/industrial) keyed on `terrazzo` in the task title.

## Hazards (draft → pack hazards)
| id | Hazard | Controls | OSHA ref | Sev |
|---|---|---|---|---|
| silica_floor_grinding | Silica from walk-behind floor grinders | Integrated water feed or maker's dust collection (Table 1 xiii) | 1926.1153(c)(1) | 3 |
| silica_edge_grinding | Silica from handheld grinders | Water or shroud+vac; APF 10 indoors (Table 1 xii) | 1926.1153(c)(1) | 3 |
| silica_cleanup | Dry sweeping / compressed air | Wet/HEPA vacuum | 1926.1153(f) | 2 |
| wet_grinding_shock | Shock in slurry | GFCI / AEGCP, cords off floor | 1926.404(b)(1)(ii) | 3 |
| epoxy_vapors | Resin/primer/sealer vapors | Ventilation, respirator per SDS | 1926.57(a) | 3 |
| epoxy_skin | Epoxy sensitization | Gloves, sleeves, wash with soap | 1926.95(a) | 3 |
| flammable_products | Solvent primers/sealers | Safety cans, no ignition | 1926.152(a)(1) | 3 |
| noise | Grinders/vacuums | Hearing protection | 1926.52(d)(1) | 2 |
| flying_particles | Chips, grit, strip offcuts | Glasses + face shield | 1926.102(a)(1) | 2 |
| stair_edges | Open stair sides while setting treads | Stairrails/handrails | 1926.1052(c)(1) | 3 |
| slurry_slip_trip | Wet slurry, hoses | Pick up as you go, route hoses | 1926.25(a) | 2 |

## QA checklist
- [ ] Slab ≤1/4 in. in 10 ft before epoxy — NTMA 3.01
- [ ] Slab ≥28 days, RH / MVER within resin maker's limits — NTMA 3.01 B, UFGS 09 66 23 3.1
- [ ] Cracks/joints marked, membrane where recommended — NTMA 3.01/3.02
- [ ] Mechanical prep, no curing compound — NTMA 3.02, UFGS 09 66 13 3.2.1
- [ ] Control-joint strips over every slab joint — UFGS 3.2.2, NTMA
- [ ] Strips straight, level, fully bedded — UFGS 3.2.2, NTMA 3.03
- [ ] Panel size limits (6 ft UFGS; 5 ft sand cushion) — UFGS, NTMA
- [ ] Mockup approved and matched — NTMA 1.05
- [ ] Temperature/ventilation window held — NTMA 1.09, UFGS 09 66 23 1.6
- [ ] Topping thickness — UFGS 09 66 23 3.2 / 09 66 13
- [ ] Grind sequence 24 → 60/80 → grout → 120+ — NTMA 3.03 E, UFGS 3.2.5
- [ ] No pinholes, ≥70% chip (cement) — UFGS 3.2.5.3
- [ ] Finished flatness 1/4 in. in 10 ft — UFGS 3.2.5.1
- [ ] Sealed, COF data on file — UFGS 3.3, NTMA sealer guide
- [ ] Precast treads bedded, traffic held (safety) — UFGS 09 66 16, NTMA 3.04
- [ ] Slurry disposal — MPCA

## Inspection / acceptance checkpoints
- pre_install_substrate_acceptance: slab age/moisture, flatness, joints mapped, overhead work done
- mockup_approval: color/chips/finish sign-off, strip samples
- pre_seal_finish_review: fine grind complete, strip lines, conductive test scheduling
- turnover_protection: sealer + maintenance docs, GC protection

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| G-TZ-EPOXY-SF | Epoxy terrazzo 3/8 in., marble | SF | 900 | 0.16 | 150 | 5 | platform-baseline, estimate |
| G-TZ-DIVIDER-LF | 16-ga zinc divider strip | LF | 220 | 0.04 | 0 | 8 | estimate |
| G-TZ-MEMB-SF | Crack-isolation membrane | SF | 260 | 0.02 | 0 | 10 | estimate |
| G-TZ-TREAD-EA | Precast epoxy terrazzo tread ~4 ft | EA | 22000 | 1.0 | 0 | 0 | estimate |
| G-TZ-REFINISH-SF | Restoration regrind + reseal | SF | 45 | 0.025 | 35 | 5 | estimate |

## Quantity rules
- None. Blueprint facts carry no terrazzo signal (no component/fixture token), and seeding terrazzo on
  every commercial job would be wrong. Proposed: a `terrazzo` component token in a later wave.

## Blueprint callouts (components)
- None this wave (brief). Candidate later: `terrazzo` — `/\bTERRAZZO\b/` — "EPOXY TERRAZZO FLOOR, 3/8\"".

## Open questions → REVIEW_QUEUE
- 11 hazards + 1 safety QA pending human Spanish.
- All 5 G-TZ costs are platform estimates.
- NTMA pages are association material (paraphrased); ASTM F2170/F1869, ANSI A108.5/.6, NFPA 99 cited by section only.
- Vocab: no `floor_grinder` / `slurry_vacuum` equipment types — generator used as proxy.
- Scope: no quantity rules until a terrazzo blueprint token exists.
