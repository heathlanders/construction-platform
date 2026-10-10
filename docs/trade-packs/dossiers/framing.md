# Dossier — `framing` (Rough Carpentry / Framing (Wood))

> Wave: w01 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/framing.ts` · Status: draft
> Taxonomy: category `structural` · permit_trade `building` · phase `framing` · CSI `06 10`

## Scope (2–4 sentences)
Wood light-frame structure: sill plates on the foundation, floor joists/I-joists and subfloor, stud walls
with headers, roof trusses or stick-framed rafters, wall and roof sheathing, fireblocking, and the metal
connectors (hangers, hold-downs, uplift ties). Does NOT include the foundation and anchor bolt placement
(`concrete`), truss crane service as a standalone sub (`truss_setting`, `crane_service`), WRB/siding
(`siding`, `air_barrier`), roof covering (`roofing`), or heavy timber / SIPs / post-frame (own keys).

## Existing coverage reconciled
- Hand recipe: `lib/task-buildout/building.ts` framing/sheathing branch (Frame structure → gate `framing`;
  Sheath & nail braced walls → gate `sheathing`; facts-aware for trusses / I-joists / LVL) → pack
  **complements** (`recipes: []`, no `supersedes_hand`). Pack adds code refs (merged into both steps),
  equipment hints, hazards, QA, inspection checklists, glossary.
- Catalog codes already seeded: `B-FRAME-SF` (floor-area framing), `B-WALL-FRAME-LF`, `B-SHEATHING-SF`
  (wall/roof). Not redeclared. New `B-FRM-*` codes cover what those don't: subfloor, sill, LVL, hold-downs,
  uplift ties.
- Blueprint template tasks hitting this trade: 17 (`trade_type: 'framing'`) — served by the hand recipe.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| ufgs-06-10-00 | UFGS 06 10 00 — Rough Carpentry | 1 | public_domain | QA (moisture, sills, crown, bearing, hangers, cutting, tolerances, subfloor, roof sheathing, uplift anchors) |
| doe-basc-advframing | DOE BASC Advanced Framing Construction Guide | 1 | gov_open | advanced-framing QA |
| ecfr-1926-c/e/i/k/m/x/cc | 29 CFR 1926 subparts | 1 | public_domain | hazards (sections verified on eCFR 2026-10-06 text) |
| awc-wfcm-2018 | AWC Wood Frame Construction Manual 2018 | 4 | association_public | headers, fireblocking QA (paraphrase) |
| apa-e30 | APA E30 Engineered Wood Construction Guide | 4 | association_public | sheathing nailing QA |
| sbca-bcsi | SBCA/TPI BCSI truss handling & bracing | 4 | proprietary_ref_only | truss bracing QA (ref only) |
| icc-pa | ICC IRC public access | 3 | proprietary_ref_only | code_refs section numbers |
| platform-baseline | The Jobsite baseline | — | platform_estimate | all assembly costs |

## Work steps (draft → pack recipes)
None — hand recipe retained (complement pattern). Pack code refs added to its steps:
1. **Frame structure** (gate `framing`) — +R602.3, R602.7, R602.6, R502.8, R602.8, R802.10, R802.11, R403.1.6.
2. **Sheath & nail braced walls** (gate `sheathing`) — +R503, R803 (R602.10 already in family map).

## Hazards (draft → pack hazards)
| id | Hazard | Controls | OSHA ref | Sev |
|---|---|---|---|---|
| fall_residential | Fall from walls/floor edges/roof framing | guardrail/net/PFAS ≥6 ft or written fall protection plan | 1926.501(b)(13) | 4 |
| floor_holes | Fall through stair openings / holes | covers or rails | 1926.501(b)(4)(i) | 4 |
| structure_collapse | Unbraced walls/trusses collapse | temp bracing as set; competent-person check; stop in wind | 1926.20(b)(2) | 4 |
| truss_hoist | Struck by hoisted truss bundle | stay out of fall zone; qualified rigger, tag lines | 1926.1425(b) | 4 |
| power_line | Boom contacts power line | work zone + clearance check; spotter | 1926.1408(a) | 4 |
| nailer | Nailer puncture | muzzle safety device; sequential trip | 1926.302(b)(3) | 3 |
| circular_saw | Saw cut/kickback | guards working; support work | 1926.304(d) | 3 |
| ladder | Ladder slip/overreach | 3 ft extension, secure; 3 points | 1926.1053(b)(1) | 3 |
| cord_shock | Shock from cords/tools | GFCI; inspect cords | 1926.404(b)(1) | 3 |
| eye_injury | Flying nails/chips | safety glasses | 1926.102(a)(1) | 2 |
| lumber_stacks | Lumber pile collapse | level solid sills; denail used lumber | 1926.250(b)(8) | 2 |
| nail_debris | Protruding nails / debris | clear scrap from walkways | 1926.25(a) | 2 |

## QA checklist
- [ ] Lumber ≤19% MC when enclosed; no mold/decay — UFGS Part 2/3
- [ ] Sill plates level, square, anchored, ≥2 anchors per piece — UFGS 3.2.14
- [ ] Joists/rafters crown up, full bearing, splices over bearing — UFGS 3.1/3.1.4
- [ ] Minimum joist bearing; hangers where framing into side of beam — UFGS 3.1.4.1
- [ ] Every connector hole fastened with listed fastener — UFGS 3.1.14
- [ ] No over-cut/bored/notched members; repairs per approved detail — UFGS 3.1
- [ ] Headers per plan with jack + king studs — WFCM
- [ ] Studs plumb 1/4 in. in 8 ft; plates straight — UFGS 3.4
- [ ] Subfloor long dimension across joists, staggered, gapped, glued + fastened — UFGS 3.1.6 / APA E30
- [ ] Shear nailing edge/field per plan; no overdriven nails — APA E30
- [ ] Roof sheathing edge support where span requires — UFGS 3.1.17
- [ ] Uplift ties at spacing, fully nailed — UFGS 3.1.14
- [ ] Fireblocking before cover — WFCM
- [ ] (safety) Truss temp + permanent bracing before load — BCSI (ref) / UFGS 3.1.15
- [ ] Advanced framing alignment / 2-stud corners where specified — DOE BASC

## Inspection / acceptance checkpoints
- framing: sill anchorage + hold-downs; member sizes/spans + truss drawings on site; headers/point loads;
  no over-cut members; fireblocking; truss bracing + uplift ties; floor holes guarded.
- sheathing: braced wall panel locations/lengths; nail spacing; roof edge clips/blocking + gaps.

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| B-FRM-SUBFLOOR-SF | 3/4 T&G OSB subfloor glued+nailed | SF | 125 | 0.016 | 0 | 8 | platform-baseline, estimate (panel ≈$30/4×8 + adhesive; ~1,000 SF/crew-day) |
| B-FRM-SILL-LF | PT sill + gasket, anchors tightened | LF | 260 | 0.05 | 0 | 5 | platform-baseline, estimate |
| B-FRM-LVL-LF | LVL 1-3/4×11-7/8 per LF per ply | LF | 1100 | 0.08 | 0 | 5 | platform-baseline, estimate (volatile) |
| B-FRM-HOLDDOWN-EA | Hold-down + anchor + fasteners | EA | 4000 | 0.5 | 0 | 0 | platform-baseline, estimate |
| B-FRM-UPLIFT-TIE-EA | Truss/rafter uplift tie | EA | 150 | 0.05 | 0 | 2 | platform-baseline, estimate |

## Quantity rules
- `B-FRM-SUBFLOOR-SF` = area_sf_sum (when floor_joists | i_joists) — room-area sum, understates gross floor
- `B-FRM-SILL-LF` = component anchor_bolts × 160 — typical SFR perimeter
- `B-FRM-LVL-LF` = component lvl_beam × 24 — one 2-ply 12 ft beam
- `B-FRM-UPLIFT-TIE-EA` = component engineered_trusses × 60 — ≈30 trusses × 2 ends
- (no rule for B-FRM-HOLDDOWN-EA — hold-downs only on engineered shear walls; add manually)

## Blueprint callouts (components)
None this wave (core tokens `engineered_trusses`, `i_joists`, `lvl_beam`, `floor_joists`, `wood_studs`,
`roof_sheathing`, `anchor_bolts` already exist and drive the rules above).

## Open questions → REVIEW_QUEUE
- 12 hazards + 1 safety QA + 10 inspection items pending human ES translation.
- All 5 assembly costs are `estimate` (no public lumber/connector unit price source used); LVL is volatile.
- `structure_collapse` cites 1926.20(b)(2) (general competent-person duty) — no 1926 section is specific to
  wood truss/wall bracing; reviewer may prefer a different ref.
- WFCM cited at 2018 edition page (newer edition page not found on awc.org).
- Scope: does `B-FRAME-SF` (floor-area framing) already include subfloor? If so, `B-FRM-SUBFLOOR-SF` rule
  double-counts — reviewer to confirm.
- Hand recipe has no fireblocking/sill step; consider a pack recipe with `supersedes_hand` in a later wave.
