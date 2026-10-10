# Dossier — `guardrail_barriers` (Guardrail / Barriers / Attenuators)

> Wave: w19 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/guardrail_barriers.ts` · Status: draft
> Taxonomy: category `heavy_civil` · permit_trade `null` · phase `sitework` · CSI `34 71 13`

## Scope (2–4 sentences)
Installs roadside safety hardware: MGS W-beam and thrie-beam guardrail on driven or set posts, proprietary
energy-absorbing end terminals and transitions to rigid barrier/bridge rail, temporary precast concrete barrier
in work zones (set, pin, anchor, move, remove), and crash cushions / sand barrel arrays. Does NOT design the
barrier layout or length of need (designer), grade the shoulder (excavation/highway), cast permanent concrete
barrier or parapets (highway_bridge), or own the work-zone plan (traffic_control).

## Existing coverage reconciled
- Hand recipe: none → NEW-TRADE pattern, no gates/code_refs (permit_trade null). DOT hold points in `inspection_checklists`.
- Catalog codes already seeded: none (no `HC-` codes existed). New `HC-GR-*` codes added.
- Blueprint template tasks hitting this trade: none.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| guardrail_barriers-wisdot-ss-614 | WisDOT SS 614 Semi-rigid Barrier Systems and End Treatments | 1 | gov_open | steps, QA, checklists |
| guardrail_barriers-wisdot-ss-603 | WisDOT SS 603 Concrete Barrier (temporary precast) | 1 | gov_open | temp barrier steps/QA |
| guardrail_barriers-wisdot-fdm-11-45 | WisDOT FDM 11-45 Roadside design / barrier guidance | 1 | gov_open | length of need, flare, deflection space, MASH context |
| guardrail_barriers-fhwa-hardware | FHWA roadside safety hardware eligibility letters | 1 | public_domain | glossary/context (MASH, eligibility ≠ site approval) |
| guardrail_barriers-rsi-mskt-manual | Road Systems MSKT terminal assembly manual (KYTC-hosted) | 5 | manufacturer_public | terminal steps + checklist |
| guardrail_barriers-valtir-quadguard-manual | Valtir QuadGuard crash cushion assembly manual (KYTC-hosted) | 5 | manufacturer_public | cushion pad, clearance, anchors, checklist |
| asphalt_paving-mutcd-part6 | MUTCD Part 6 (reused) | 1 | public_domain | work zone / flaggers |
| concrete_repair_lifting-call811 | 811 Before You Dig (reused) | 4 | association_public | utility locates |
| excavation-wisdot-aup | WisDOT Average Unit Price list FY23–25 (reused) | 2 | gov_open | all costs (derived) |
| ecfr-1926-c/d/e/g/h/o/p/z | 29 CFR 1926 subparts (shared) | 1 | public_domain | hazards |

AASHTO MASH and the Roadside Design Guide are cited by name only (proprietary, ref-only).

## Work steps (draft → pack recipes)
**beam_guardrail_terminals** — traffic control + 811 → stake/grading check → drive/set posts to plan depth →
hang blocks + rail (laps with traffic, no torch) → terminals/transitions per manual → touch-up, reflectors, closeout.

**temp_barrier_crash_cushion** — confirm layout/approved devices/sealed cushion design → set + pin sections →
anchor/connect, keep deflection space clear → build crash cushion / sand barrels on pad → per-shift inspection, maintenance, removal.

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| struck_by_traffic | Live-traffic struck-by | 1926.201(a) | 4 |
| buried_utility_strike | Post driving into buried utilities | 1926.651(b)(1) | 4 |
| overhead_power | Mast/boom contact with lines | 1926.600(a)(6) | 4 |
| post_driver_noise | Post driver noise | 1926.52(b) | 2 |
| post_driver_caught | Caught/struck at driver head | 1926.21(b)(2) | 3 |
| backing_equipment | Backing equipment | 1926.601(b)(4) | 3 |
| rail_handling_cuts | Sharp heavy rail | 1926.95(a) | 2 |
| suspended_load | Barrier sections lifted | 1926.251(a)(1) | 4 |
| drilling_silica | Silica from anchor drilling | 1926.1153(c)(1) | 2 |
| unattended_equipment | Material/equipment left by live lanes | 1926.600(a)(1) | 3 |

## QA checklist
15 items — traffic control, 811, grading first, posts plumb/depth/marked, laps with traffic + no torch, rail height
(MGS ≈31 ± 1 in.), terminal per manual + checklist, breakaway stub height, galvanizing touch-up + reflectors, sealed
cushion design on site, joints pinned, anchors/connections, deflection space clear, cushion checklist, object marker.

## Inspection / acceptance checkpoints
- dot_post_embedment_check — location, embedment (engineer may pull ≤5%), backfill.
- end_terminal_checklist — approved list, maker checklist signed, stub height, marker.
- crash_cushion_check — sealed design, pad/slope/anchors, installer certification + plaque, sand-barrel weights.
- temporary_barrier_shift_check — pins, anchors, deflection space, cushion condition.
- dot_final_acceptance — punch, touch-up, temporary removal, as-built quantities.

## Cost basis
All from WisDOT Average Unit Price list (FY2023–25 averages, installed bid prices); material/labor/equipment split
is a platform split of the bid price at ≈$75/hr burdened labor → confidence `derived`.
| Code | Item | Unit | Material ¢ | Labor hr | Equip ¢ | Waste % | Bid basis |
|---|---|---|---|---|---|---|---|
| HC-GR-MGS-LF | MGS W-beam guardrail | LF | 1500 | 0.12 | 300 | 2 | 614.2300 ≈$28.22 |
| HC-GR-EAT-EA | MASH EAT terminal | EA | 280000 | 8 | 25000 | 0 | 614.2610 ≈$3,810 |
| HC-GR-THRIE-TRANS-LF | MGS thrie-beam transition | LF | 5500 | 0.35 | 800 | 2 | 614.2500 ≈$92.50 |
| HC-GR-TCB-LF | Temp precast barrier delivered+installed | LF | 600 | 0.06 | 400 | 0 | 603.8000+603.8125 ≈$14.40 |
| HC-GR-TCB-ANCHOR-LF | Anchoring temp barrier | LF | 250 | 0.04 | 150 | 3 | 603.8500 ≈$7.03 |
| HC-GR-CUSHION-TEMP-EA | Temporary crash cushion | EA | 360000 | 8 | 35000 | 0 | 614.0905 ≈$4,595 |

Also seen (not modeled): 613.1100.S cable barrier ≈$40/LF, 613.1200.S cable terminal ≈$7,000; 614.0800 permanent
crash cushion ≈$33,000; 614.0700 sand barrel arrays $8,750–14,865.

## Quantity rules
None — building blueprints carry no guardrail/barrier facts (no component token, no flag). Quantities come from
highway plan tabulations; logged as scope.

## Blueprint callouts (components)
None this wave.

## Open questions → REVIEW_QUEUE
- vocab: no `post_driver` equipment type (skid_steer used as optional carrier).
- scope: cable median barrier recipe not written (WisDOT 613 is a special provision; no public maker manual verified).
- scope: no quantity rules possible from building facts.
- source_doubt: FHWA hardware page 403s to scripts; MSKT/QuadGuard manuals are state-hosted copies — re-check revisions.
- cost: all six costs are a platform split of bid prices (derived); waste % values are estimates.
- es_safety: 10 hazards + 4 safety QA + 3 checklist items pending human translation.
