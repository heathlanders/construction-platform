# Dossier — `tunneling` (Tunneling / Microtunneling)

> Wave: w20 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/tunneling.ts` · Status: draft
> Taxonomy: category `heavy_civil` · permit_trade `null` · phase `site_prep` · CSI `31 71`

## Scope (2–4 sentences)
Sinks and supports jacking / receiving shafts, drives microtunnels and pipe-jacked casings with a remote
laser-guided MTBM, and hand-mines short liner-plate tunnels (railroad / highway crossings). Owns air
monitoring, ventilation, check-in/out, settlement monitoring and line-and-grade survey during the drive.
Hand-offs: HDD and auger boring → `directional_drilling`; lateral CIPP / bursting → `trenchless_sewer`;
carrier pipe and manholes → `site_utilities`; shaft dewatering wells → `dewatering`; large ground treatment
→ `ground_improvement`.

## Existing coverage reconciled
- Hand recipe: none (heavy_civil, permit null) → pack is the only knowledge.
- Catalog codes already seeded: none with `HC-TUN-`. trenchless_sewer uses `P-TS-*` (lateral scale, pit
  `P-TS-PIT-EA` is a small residential pit — not a jacking shaft); no overlap.
- Blueprint template tasks hitting this trade: none.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| tunneling-ufgs-33-05-23 | UFGS 33 05 23 Trenchless Utility Installation (Chg 3 08/26) | 1 | public_domain | steps, QA (plans, thrust block FS, inflow limits, overcut, 48 h annulus grout, 5 in./300 ft line tolerance, settlement limit levels, monitoring schedule) |
| tunneling-fhwa-road-tunnels | FHWA-NHI-10-034 Road Tunnel Manual — Civil Elements | 1 | public_domain | shafts, liner plate / segmental lining, Ch 15 instrumentation (context) |
| tunneling-ecfr-1926-800 | 29 CFR 1926.800 Underground construction | 1 | public_domain | hazards, safety QA, checklist refs |
| ecfr-1926-s (NEW shared) | 29 CFR 1926 Subpart S | 1 | public_domain | added to shared OSHA block (not used directly by this pack yet) |
| ecfr-1926-i | Subpart I (1926.305 jacks) | 1 | public_domain | jack hazard |
| ecfr-1926-p | Subpart P (1926.651(b)(1) utilities) | 1 | public_domain | utility strike |
| platform-baseline | platform estimate | — | platform_estimate | all costs |

Verified paragraph letters on eCFR (2026-10-08): (b) access/egress, (c) check-in/out, (f) communications,
(g) emergency provisions — (g)(1) hoisting capability, (g)(2) self-rescuers, (g)(3) designated person,
(h) hazardous classifications, (j) air quality and monitoring (O2 19.5–22 %, oxygen tested first),
(k) ventilation (200 cfm per person; 30 fpm), (o) ground support — (o)(3) underground areas, (o)(4) shafts
(full-depth support, 5 ft into rock, 42 ± 3 in. collar), (r) haulage, (s) electrical, (t) hoisting.
Confined spaces: 1926.1201(b)(2) excludes work regulated by Subpart S, so 1926.800 governs air monitoring.
1926.803 compressed air exists (competent person, physician) — not in the pack's hazards because
pressurized-heading work is specialist and rare; noted as scope.
ASCE/CI 36-15 (microtunneling standard, cited by UFGS) — publisher page returns 403 to scripts, so not
added as a source; mentioned here only. NASTT / NUCA: reference only, not used.

## Work steps (draft → pack recipes)
- `microtunnel_drive` (example "Microtunnel 48 in. sanitary sewer under highway"): plans + baseline →
  jacking frame / thrust block / laser → launch and jack → steer and monitor → receive, grout annulus, records.
- `shaft_construction` (example "Construct jacking shaft and receiving shaft at Sta 12+00"): utilities + layout
  → shaft support → excavate in lifts → base seal + eye treatment → access / hoisting / air fit-out → backfill.
- `liner_plate_tunnel` (example "Hand-mined liner plate tunnel under railroad"): air test + check-in →
  face inspection + short advance → liner ring + contact grout → muck haulage → line/grade + monitoring.
No gates (permit null).

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| bad_air | O2-deficient / toxic air | 1926.800(j)(1) | 4 |
| ventilation | inadequate fresh air | 1926.800(k)(1) | 3 |
| gassy_ground | methane ignition | 1926.800(h)(1) | 4 |
| shaft_collapse | shaft support failure | 1926.800(o)(4) | 4 |
| ground_loss | face run-in / loose ground / break-out inrush | 1926.800(o)(3) | 4 |
| shaft_fall | fall into shaft | 1926.800(b)(3) | 4 |
| suspended_load | loads in shaft | 1926.800(t)(1) | 4 |
| trapped_underground | emergency egress | 1926.800(g)(1) | 4 |
| jack_force | jacks / thrust / hoses | 1926.305(a)(1) | 3 |
| haulage | muck cars / conveyors | 1926.800(r)(1) | 3 |
| electrical_wet | wet circuits | 1926.800(s)(1) | 3 |
| utility_strike | buried utilities | 1926.651(b)(1) | 4 |

## QA checklist
15 items — 12 translated, 3 safety (`ground_support_inspected`, `atmospheric_test`, `check_in_out`)
pending human ES. Numbers from UFGS 33 05 23 / 1926.800.

## Inspection / acceptance checkpoints
`shaft_support_inspection`, `atmospheric_monitoring_records`, `settlement_monitoring`,
`line_and_grade_survey`, `ground_support_segment_inspection`.

## Cost basis
All `platform-baseline` / `estimate` — no verifiable public unit bid price for microtunneling found in this
pass (WisDOT AUP has no microtunnel item). Mobilization of MTBM spreads excluded.
| Code | Unit | Mat ¢ | Lab hr | Equip ¢ | Waste % |
|---|---|---|---|---|---|
| HC-TUN-MT48-LF | LF | 32000 | 1.3 | 70000 | 0 |
| HC-TUN-JACKSHAFT-EA | EA | 6000000 | 640 | 4000000 | 5 |
| HC-TUN-RECVSHAFT-EA | EA | 3000000 | 320 | 2000000 | 5 |
| HC-TUN-LINERPLATE72-LF | LF | 45000 | 6 | 15000 | 3 |
| HC-TUN-SETTLEPT-EA | EA | 2500 | 2 | 1500 | 0 |
| HC-TUN-SLURRY-CY | CY | 1500 | 0.15 | 6000 | 0 |

## Quantity rules
None (no blueprint facts describe tunnels).

## Blueprint callouts (components)
None this wave.

## Open questions → REVIEW_QUEUE
- Safety ES pending: 12 hazards + 3 QA items.
- All 6 costs estimate-only; seek a state DOT / municipal microtunnel bid tab.
- Vocab: no equipment types for MTBM, slurry separation plant, ventilation fan/blower.
