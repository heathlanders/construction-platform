# Dossier — `concrete_pumping` (Concrete Pumping)

> Wave: w08 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/concrete_pumping.ts` · Status: draft
> Taxonomy: category `concrete_masonry` · permit_trade `null` · phase `foundation` · CSI `03 30`

## Scope (2–4 sentences)
Places ready-mix concrete with a truck-mounted boom pump or a trailer line pump: setup planning (ground,
outriggers, overhead power lines, truck access), priming, end-hose control during placement, and cleanout with
contained washout. Does NOT supply, finish, cure or test the concrete (concrete / concrete_flatwork), build forms
(formwork) or place rebar (rebar). No AHJ permit path → no gating inspections and no code refs; hold points are in
`inspection_checklists`.

## Existing coverage reconciled
- Hand recipe: none (not in `HAND_RECIPE_KEYS`; `nopermit.ts` has no pumping branch) → NEW-TRADE pattern.
- Catalog codes already seeded: `EQUIP-CONCRETE_PUMP` (day rate, 0044) — not redeclared. New `G-PUMP-*` codes are
  the per-pour/per-CY billing alternative; assembly description warns not to price both.
- Blueprint template tasks hitting this trade: none (`grep pump blueprint-templates` empty).

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| ecfr-1926-q | 29 CFR 1926 Subpart Q | 1 | public_domain | 702(e)(1) pipe supports, 702(e)(2) air-hose connectors, 702(j) lockout, 701(b) rebar |
| ecfr-1926-o | 29 CFR 1926 Subpart O | 1 | public_domain | 600(a)(6) power-line clearance (10 ft ≤50 kV, observer), 601(b)(4) backing |
| ecfr-1926-p / -m / -e / -d / -c | Subparts P, M, E, D, C | 1 | public_domain | 651(j)(2) edge, 501(b)(1), 95(a), 52, 20(b)(2) |
| ecfr-1926-cc | Subpart CC | 1 | public_domain | NOT cited: 1926.1400(c)(1) excludes concrete pumps (verified) |
| ufgs-03-30-00 | UFGS 03 30 00 §1.6.3.2, §3.7.2 | 1 | public_domain | pumping submittal; ≤2 in slump loss; no aluminum pipe; sample at discharge |
| concrete_pumping-acpa-* (10) | ACPA safety bulletins + Do’s/Don’ts | 4 | association_public | setup, outriggers, power lines (20/50 ft + spotter), startup, hose whip, hose handling, cleanout, hopper, wind, burns |
| concrete_pumping-epa-washout | EPA 833-F-11-006 Concrete Washout BMP | 1 | gov_open | leak-proof washout, no storm drains |
| platform-baseline | The Jobsite baseline | — | platform_estimate | all costs |

## Work steps (draft → pack recipes)
`boom_pump_placement` (title_re pump/placing boom): 1 Plan setup with operator · 2 Set outriggers and check pump ·
3 Prime and start · 4 Place with end hose · 5 Clean out and contain washout.
`line_pump_placement` (priority 10, line/trailer/grout pump): 1 Plan spot and hose route · 2 Lay, support,
inspect line · 3 Prime and place · 4 Break down, clean, contain washout. No gates (permit_trade null).

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| hose_whip | End-hose whip | 1926.702(e) | 4 |
| pipeline_burst | Burst/separated line | 1926.702(e)(1) | 3 |
| air_cleanout | Compressed-air cleanout | 1926.702(e)(2) | 4 |
| power_line | Boom contact/arc | 1926.600(a)(6) | 4 |
| outrigger_tip | Tip-over | 1926.20(b)(2) | 4 |
| excavation_edge | Near excavation | 1926.651(j)(2) | 4 |
| truck_backing | Ready-mix backing | 1926.601(b)(4) | 4 |
| hopper_caught | Hopper/valve caught-in | 1926.702(j)(1) | 4 |
| fall_edge | Deck edge fall | 1926.501(b)(1) | 4 |
| rebar_impale | Rebar impalement | 1926.701(b) | 3 |
| concrete_burns | Alkaline burns | 1926.95(a) | 3 |
| noise | Pump noise | 1926.52 | 2 |

## QA checklist
15 items (11 safety → ES pending; 4 translated): setup ground, power-line plan, truck route, washout planned,
outriggers cribbed, E-stops, line inspected, startup clear, signals, hose handling, segregation/slump (UFGS),
samples at discharge (UFGS), rebar capped, clamps depressurized/lockout, washout contained.

## Inspection / acceptance checkpoints
- pump_setup_check: ground/outriggers, power lines + spotter, wind, E-stops/line.
- pre_pour_check: pumping submittal (UFGS 1.6.3.2), signals + backing route, washout in place.
- cleanout_washout_check: depressurize/lockout, washwater contained.

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| G-PUMP-SETUP-EA | Mobilization/setup/minimum per pour | EA | 0 | 1.0 | 45000 | 0 | platform-baseline, estimate |
| G-PUMP-CY | Pumping charge per CY | CY | 0 | 0 | 700 | 0 | platform-baseline, estimate |
| G-PUMP-LINE-LF | Extra hose/pipeline per LF | LF | 0 | 0.02 | 300 | 0 | platform-baseline, estimate |
| G-PUMP-WASHOUT-EA | Washout container per pour | EA | 0 | 0.5 | 30000 | 0 | platform-baseline, estimate |

## Quantity rules
- `G-PUMP-SETUP-EA` = const 1 when slab_on_grade / foundation_wall / concrete_footing — one setup, adjust per pour count.
- `G-PUMP-CY` = area_sf_sum × 0.012346 ceil (4 in slab CY) when slab_on_grade AND commercial/MF/industrial.
- `G-PUMP-WASHOUT-EA` = const 1, same scope as setup.

## Blueprint callouts (components)
- none this wave.

## Open questions → REVIEW_QUEUE
- All four costs are `estimate`; G-PUMP-SETUP-EA/G-PUMP-CY vs EQUIP-CONCRETE_PUMP day rate are alternative billing
  bases — reviewer to confirm the double-count warning is enough.
- ACPA site serves an incomplete TLS chain (curl exit 60, browsers fine) — `pack:verify-sources` may flag it.
- ACPA power-line distance (20/50 ft) is association policy, stricter than OSHA 1926.600(a)(6) (10 ft ≤50 kV) — kept
  both in controls.
- Possible vocab: distinguish `boom_pump` vs `line_pump` in equipment-vocab (today one `concrete_pump`).
