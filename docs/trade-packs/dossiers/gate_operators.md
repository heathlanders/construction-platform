# Dossier — `gate_operators` (Automatic Gates / Gate Operators)

> Wave: w10 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/gate_operators.ts` · Status: draft
> Taxonomy: category `sitework` · permit_trade `electrical` · phase `sitework` · CSI `32 31`

## Scope (2–4 sentences)
Automates vehicular gates: slide and swing gate operators and parking barrier arms, with the operator pad,
buried conduit, vehicle loops, monitored entrapment protection (photo eyes, contact edges), grounding,
warning signs, commissioning and owner hand-over. The gate leaf, posts and fence are the `fencing` trade;
keypads / card readers / intercoms tied to the operator are coordinated with `security_access`. The gate
itself must already meet ASTM F2200 before an operator goes on — retrofit work upgrades it.

## Existing coverage reconciled
- Hand recipe: none (not in `HAND_RECIPE_KEYS`) → NEW-TRADE pattern; without the pack the electrical family
  recipes (phase-keyed building wiring) render. Pack recipes: `gate_operator_install`, `gate_retrofit_automation`
  (priority 5), `barrier_arm` (priority 10).
- Catalog codes already seeded: none `E-GATE-*`. Fencing pack owns gate leaves (`B-FNC-GATE-WALK-EA`,
  `B-FNC-GATE-DBL-EA`, `B-FNC-POOLGATE-HW-EA`) — not duplicated.
- Blueprint template tasks hitting this trade: none.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| gate_operators-dasma-tds352 | DASMA TDS 352 — gate system guidelines for installers | 4 | association_public | installer checklist, 2-1/4 in./6 ft screening, 16 in. zone, signs, owner demo |
| gate_operators-dasma-tds353 | DASMA TDS 353 — gate operators and UL 325 | 4 | association_public | usage Classes I–IV, two independent entrapment means, monitored sensors |
| gate_operators-dasma-tds356 | DASMA TDS 356 — UL 325 FAQ | 4 | association_public | controls 6 ft from gate, reset in sight, pedestrian gate |
| gate_operators-dasma-tds370 | DASMA TDS 370 — ASTM F2200 rationale | 4 | association_public | fall restraint, no protrusions/latches, roller guards < 8 ft, positive stops |
| gate_operators-doorking-32-31-11 | DoorKing guide spec 32 31 11 (Model 2160) | 5 | manufacturer_public | execution: plumb/level, splices in accessible boxes, tagging, owner test/training, maintenance |
| gate_operators-ul-325 | ANSI/CAN/UL 325 | 3 | proprietary_ref_only | reference only |
| gate_operators-astm-f2200 | ASTM F2200 | 3 | proprietary_ref_only | reference only |
| nfpa-fa | NFPA 70 (NEC 2023) | 3 | proprietary_ref_only | 300.5, 300.3(C), 725, 225, 110.3(B), 250.54, 314.29 |
| icc-pa | ICC (IBC 3110, IFC 503.6, IFC D103.5) | 3 | proprietary_ref_only | code refs with code_type |
| ecfr-1926-c/e/i/j/k/p/z | 29 CFR 1926 | 1 | public_domain | hazards (1926.21(b)(2), 1926.95(a), 1926.300(b)(1)-(2), 1926.352(a), 1926.416(a)(1), 1926.417(a), 1926.651(b)(1)/(d)/(j)(2), 1926.1153) |
| platform-baseline | The Jobsite baseline | — | platform_estimate | all costs |

LiftMaster manuals were read for field practice (separate power/low-voltage conduits, pad below frost, ground
rod) but only third-party-hosted PDFs were found — not cited. CPSC gate page returned 403 and was not
confirmed — not cited.

## Work steps (draft → pack recipes)
`gate_operator_install`: 1 Confirm gate type, usage class and layout (IBC 3110, IFC 503.6) → 2 Locate
utilities, trench and set conduit (gate rough_in; NEC 300.5, 300.3(C), 725) → 3 Pour the operator pad and
backfill (gate cover; 300.5) → 4 Cut and set the vehicle loops → 5 Mount, wire and ground the operator
(110.3(B), 250.54, 314.29) → 6 Install entrapment protection, commission and hand over (gate final; 110.3(B),
IFC D103.5).
`gate_retrofit_automation`: survey existing gate → bring to F2200 → rewire/ground/loops (rough_in) →
entrapment + commission (final).
`barrier_arm`: lane/island layout → trench + island pad (rough_in) → mount arm + loops → test/sign/hand over (final).

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| utility_strike | Buried utility strike | 1926.651(b)(1) | 4 |
| trench_spoil | Spoil/equipment into trench | 1926.651(j)(2) | 3 |
| traffic | Struck by vehicles in lane | 1926.651(d) | 4 |
| electrical_contact | Shock at operator/circuit | 1926.416(a)(1) | 4 |
| lockout | Remote/re-energized start | 1926.417(a) | 4 |
| moving_gate | Crush/pinch during testing | 1926.21(b)(2) | 4 |
| drive_guard | Chains/sprockets/rollers | 1926.300(b)(2) | 3 |
| heavy_lift | Lifting operators/leaves | 1926.21(b)(2) | 3 |
| silica | Saw-cutting loop slots | 1926.1153 | 3 |
| power_saw | Saw kickback | 1926.300(b)(1) | 3 |
| welding_fire | Welding brackets | 1926.352(a) | 3 |
| concrete_skin | Wet concrete burns | 1926.95(a) | 2 |

## QA checklist
15 items: usage_class, gate_f2200*, rollers_guarded*, positive_stops*, pedestrian_separate*, controls_6ft*,
entrapment_two_means*, monitored_sensors*, force_minimum*, conduits_separate, burial_depth, loops_sealed,
grounded*, warning_signs*, handover (* = safety, ES pending human translation).

## Inspection / acceptance checkpoints
- rough_in: locate ticket, conduit depth + separation, raceway seals.
- cover: backfill/warning tape, pad per manual.
- final: UL 325 listing + F2200 gate, two monitored means per zone, controls 6 ft, grounding + signs, fire emergency opening.

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| E-GATE-OP-SLIDE | Commercial Class II slide operator, pad, wired | EA | 420000 | 14 | 0 | 0 | platform-baseline, estimate |
| E-GATE-OP-SWING | Swing operator per leaf | EA | 120000 | 7 | 0 | 0 | estimate |
| E-GATE-BARRIER-ARM | Barrier arm operator + arm + pad | EA | 350000 | 10 | 0 | 0 | estimate |
| E-GATE-LOOP | Saw-cut loop + detector | EA | 25000 | 3 | 5000 | 5 | estimate |
| E-GATE-ENTRAP | Monitored photo-eye pair or edge | EA | 30000 | 2 | 0 | 0 | estimate |
| E-GATE-TRENCH-LF | Two-conduit gate trench | LF | 600 | 0.15 | 150 | 5 | estimate |

## Quantity rules
Only evaluated when `gate_operators` is a trade on the project.
- commercial / industrial / residential_mf: `E-GATE-OP-SLIDE` × 1, `E-GATE-LOOP` × 2, `E-GATE-ENTRAP` × 4, `E-GATE-TRENCH-LF` × 100.
- residential_sf: `E-GATE-OP-SWING` × 2, `E-GATE-ENTRAP` × 2, `E-GATE-TRENCH-LF` × 60.

## Blueprint callouts (components)
- None this wave.

## Open questions → REVIEW_QUEUE
- All costs are platform estimates.
- NEC 725 cited at article level (2023 reorganized Class 1 into Art. 724); confirm section-level refs (e.g. 725.136) in review.
- IBC 3110 / IFC 503.6 / IFC D103.5 section numbers cited from memory of the 2021 I-codes — verify on codes.iccsafe.org.
- No `barrier` / `gate` blueprint component; quantities are const per building type until a site-plan callout exists.
