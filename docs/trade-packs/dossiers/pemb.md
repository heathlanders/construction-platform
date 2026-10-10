# Dossier — `pemb` (Pre-Engineered Metal Buildings)

> Wave: w07 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/pemb.ts` · Status: draft
> Taxonomy: category `structural` · permit_trade `building` · phase `framing` · CSI `13 34 19`

## Scope
Erects systems-engineered metal buildings from the manufacturer's sealed erection drawings: anchor-rod
layout/verification with the concrete crew, primary rigid frames with temporary and permanent rod/cable
bracing, secondary members (girts, purlins, eave struts, flange braces, sag rods), faced blanket
insulation, through-fastened or standing-seam roof and wall panels, trim, closures and touch-up.
Hand-offs: footings/piers and rod casting (concrete/rebar), foundation design (engineer of record —
the manufacturer only supplies reactions), doors/windows/overhead doors, gutters, MEP penetrations.

## Existing coverage reconciled
- Hand recipe: none → NEW-TRADE pattern (3 recipes).
- Catalog codes already seeded: none for PEMB. Building-bucket seeder already emits `B-FRAME-SF` and
  `B-INSUL-SF` from room area on every building project — on a PEMB job those are wood framing / batt
  lines the estimator should delete (logged as scope in REVIEW_QUEUE). `B-PEMB-BLANKET-SF` is the
  metal-building replacement for `B-INSUL-SF`; no quantity rule for it so it does not double-count.
- Blueprint template tasks hitting this trade: none. Blueprint components `anchor_bolts`, `wall_girts`,
  `roof_purlins`, `metal_roofing`, `metal_siding` exist (core) but give presence only, not quantities.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| pemb-ufgs-13-34-19 | UFGS 13 34 19 Metal Building Systems (Aug 2026) | 1 | public_domain | steps, QA (Part 3.1–3.11, 2.3.4 bracing) |
| ecfr-1926-r | 29 CFR 1926 Subpart R — Steel Erection (§752, 753, 754, 758, 759, 760) | 1 | gov_open | hazards, QA |
| ecfr-1926-cc | Subpart CC — Cranes (§1926.1408) | 1 | gov_open | power-line hazard |
| ecfr-1926-l / -e | Subparts L (§1926.453), E (§1926.95) | 1 | gov_open | aerial lift, cuts |
| pemb-mbma | MBMA Metal Building Systems Manual | 4 | proprietary_ref_only | reference only |
| icc-pa | IBC / IECC public access | 3 | proprietary_ref_only | code refs (section + paraphrase) |
| platform-baseline | The Jobsite baseline | — | platform_estimate | all costs |

## Work steps
- `frame_erection` (Erect metal building frames): verify foundations/rods/strength notice → shake out +
  lift plan → set braced bay first (758(c) bolts before release, temp bracing) → girts/purlins/eave
  struts/bracing (758(e) shared holes) → final bolt-up + touch-up [framing; IBC 2205, 2210, 1705.2].
- `anchor_rods` (Anchor bolts for metal building, priority 10): layout → set in templates [footing;
  IBC 1809, 1901.3] → post-pour survey + EOR approval for changes [foundation; IBC 1705.3].
- `panels_insulation` (Install metal building roof/wall panels, priority 10): stage + strap →
  wall insulation + panels [sheathing] → roof blanket [insulation; IECC C402.1] → roof panels, 8 in.
  end laps, ribs down slope [roof_dry_in; IBC 1507.4, 1504.3.2] → trim/closures/swarf [final].

## Hazards
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| connector_fall | connector fall | 1926.760(b)(1) | 4 |
| edge_fall | unprotected edge >15 ft | 1926.760(a)(1) | 4 |
| purlin_anchor | tie-off / walking on purlins | 1926.758(g) | 4 |
| frame_stability | partial frame collapse | 1926.754(a) | 4 |
| frame_release_bolts | frame released before bolting | 1926.758(c) | 4 |
| girt_connection | shared-hole connection opened | 1926.758(e) | 3 |
| green_concrete | erection on uncured concrete | 1926.752(b) | 4 |
| suspended_load | working under loads | 1926.753(d)(1) | 4 |
| power_line | crane near power lines | 1926.1408(a) | 4 |
| aerial_lift | thrown from basket | 1926.453(b)(2)(v) | 4 |
| falling_objects | loose items / wind-blown panels | 1926.759(a) | 3 |
| sheet_edges | panel edge cuts | 1926.95(a) | 2 |

## QA checklist
15 items — anchor layout/as-built, concrete strength notice*, four anchor rods*, bearing level, temp
bracing*, frame bolts before release*, flange braces, plumb/square + bracing snug, bolt tightening, no
field mods, blanket facing + taped tears, fastener seating, roof end lap ≥8 in., swarf cleaned / no
torch cutting. (* safety, ES pending)

## Inspection / acceptance checkpoints
footing, foundation, framing (erection drawings + special inspection), sheathing, insulation,
roof_dry_in, final (mfr certification letter + special inspection final report).

## Cost basis (all `estimate`, 2026 national baseline)
| Code | Item | Unit | Material ¢ | Labor hr | Equip ¢ | Waste % |
|---|---|---|---|---|---|---|
| B-PEMB-KIT-SF | building package supply | SF | 1600 | 0 | 0 | 0 |
| B-PEMB-ERECT-SF | erection | SF | 20 | 0.05 | 125 | 0 |
| B-PEMB-ANCHOR-EA | anchor rod set per column | EA | 9000 | 1.0 | 0 | 0 |
| B-PEMB-BLANKET-SF | faced blanket insulation | SF | 110 | 0.012 | 0 | 5 |
| B-PEMB-SSR-ADD-SF | standing-seam roof adder | SF | 250 | 0.015 | 10 | 3 |

## Quantity rules
- `B-PEMB-KIT-SF`, `B-PEMB-ERECT-SF` = area_sf_sum, commercial/industrial only.

## Blueprint callouts
None new (core tokens already cover anchor bolts, girts, purlins, metal roofing/siding).

## Open questions → REVIEW_QUEUE
- Costs all estimate; kit price swings widely with steel market.
- B-FRAME-SF / B-INSUL-SF auto-seeded on PEMB projects (scope).
- IBC section numbers (2205, 2210, 1705.x, 1901.3) checked for 2018/2021 numbering — confirm per adopted edition.
- No manufacturer erection guide cited (Nucor/VP sites 403 to scripts; no public guide URL verified).
