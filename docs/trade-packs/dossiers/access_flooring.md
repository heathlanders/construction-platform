# Dossier — `access_flooring` (Raised Access Flooring)

> Wave: w15 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/access_flooring.ts` · Status: draft
> Taxonomy: category `interior` · permit_trade `building` · phase `finishes_interior` · CSI `09 69`

## Scope (2–4 sentences)
Raised (access) floors for data centers, computer rooms and open offices with underfloor air or cabling:
slab prep/sealing, pedestal grid (adhered or anchored, seismic bracing per design), stringers, removable
panels, cutouts/grommets, perforated airflow panels, ramps/steps/fascia/guards, grounding of the
understructure, and acceptance tests. Underfloor power (electrical), cabling (low_voltage), air (hvac)
and fire detection/suppression are hand-offs.

## Existing coverage reconciled
- Hand recipe: none → NEW-TRADE pattern (one recipe `raised_access_floor`).
- Catalog codes already seeded: none for access floors.
- Blueprint template tasks hitting this trade: none. `title_re` targets "access floor", "raised floor",
  "computer floor", "underfloor air".

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| access_flooring-ufgs-09-69-13 | UFGS 09 69 13 Rigid Grid Access Flooring (Nov 2024) | 1 | public_domain | steps, QA, tolerances, grounding, air leakage, ramps ≤1:12 |
| access_flooring-cisca | CISCA Recommended Test Procedures for Access Floors | 4 | proprietary_ref_only | test-method reference (no numbers) |
| access_flooring-tate-faq | Tate Access Floors FAQ | 5 | manufacturer_public | pedestal adjustment, grounding, HPL static control |
| ecfr-1926-c/d/e/h/i/k/m/z | 29 CFR 1926 subparts | 1 | public_domain | hazards |
| icc-pa / nfpa-fa | IBC 1012, 1015, 1607.1; IMC 602.2; NEC 645.5 | 3 | proprietary_ref_only | code refs (section + paraphrase) |

## Work steps (draft → pack recipes)
1. **Condition the room, clean and seal the slab** — UFGS 3.1/3.1.1. QA room_conditioned, slab_clean_sealed.
2. **Lay out the grid and set the pedestals** — UFGS 3.1.2 (adhesive or expansion anchors per seismic design). QA pedestal_plumb_contact, pedestal_anchor_seismic.
3. **Install stringers and auxiliary framing** — UFGS 3.1.3/3.1.4. QA stringers_locked.
4. **Lay panels, cutouts and airflow panels** — UFGS 3.1.5. QA floor_level, perimeter_fastened, cutouts_trimmed, perf_per_plan.
5. **Build ramps, steps, closures and guards** — IBC 1012, 1015; UFGS 3.1.8 + ramp ≤1:12. QA ramp_slope_rails, edge_closed.
6. **Ground, test and protect the floor** — Gate: final. IBC 1607.1, NEC 645.5, IMC 602.2; UFGS 3.2–3.3. QA grounding_resistance, acceptance_tests, plenum_leakage, protection_runways.

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| open_floor | Step into open panel position / unfinished edge | 1926.501(b)(4)(ii) | 3 |
| cover_secure | Temporary cover displaced | 1926.502(i)(3) | 3 |
| panel_handling | Pinch/back strain lifting panels | 1926.20(b) | 2 |
| stacked_material | Pallets sliding/toppling | 1926.250(a)(1) | 3 |
| floor_overload | Panel/pedestal failure over rated load | 1926.250(a)(2)(i) | 3 |
| silica_dust | Anchor drilling / cementitious panel cutting | 1926.1153(c)(1) | 3 |
| saw_cut | Saw cuts | 1926.300(b) | 3 |
| eye_flying | Chips/debris | 1926.102(a)(1) | 2 |
| chem_adhesive | Adhesive / sealer | 1926.59 | 2 |
| live_circuit | Energized underfloor power in occupied rooms | 1926.416(a)(1) | 4 |
| cord_shock | Cord shock | 1926.404(b)(1) | 3 |

## QA checklist
15 items (5 safety → ES pending). Key measurable: planarity 0.060 in./10 ft and 0.030 in. across joints
(UFGS default); joint resistance < 10 ohms; ramps ≤ 1:12; air leakage per CISCA §10 to project limit.

## Inspection / acceptance checkpoints
- final: ramps (IBC 1012), guards/fascia (IBC 1015), load rating vs use (IBC 1607.1), grounding (NEC 645.5), plenum materials/penetrations (IMC 602.2).

## Cost basis (all `estimate`, platform-baseline, national 2026)
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % |
|---|---|---|---|---|---|---|
| B-AF-SYS-SF | Stringered steel/cementitious 24 in. panel system, 12–24 in. FFH | SF | 1800 | 0.07 | 10 | 3 |
| B-AF-PERF-EA | Perforated airflow panel + damper (add) | EA | 20000 | 0.25 | 0 | 0 |
| B-AF-CUTOUT-EA | Cutout + edge trim + grommet | EA | 3500 | 0.4 | 0 | 5 |
| B-AF-RAMP-LF | Ramp w/ non-slip, rails, closures, per LF run | LF | 25000 | 1.5 | 0 | 5 |
| B-AF-GRND-SF | Understructure grounding grid | SF | 30 | 0.006 | 0 | 5 |

## Quantity rules (commercial/industrial only)
- B-AF-SYS-SF / B-AF-GRND-SF = area_sf_sum × 0.15 (raised-floor share — verify)
- B-AF-PERF-EA = area_sf_sum × 0.0025; B-AF-CUTOUT-EA = area_sf_sum × 0.0015
- B-AF-RAMP-LF = const 12

## Blueprint callouts (components)
- none this wave.

## Open questions → REVIEW_QUEUE
- Seismic: ASCE 7 §13.5.7 (access floors) not cited — ASCE has no source entry/code_type convention yet.
- IMC 602.2 vs a more specific underfloor-plenum subsection; NEC 645.5 subsection letter varies by edition.
- 15% raised-floor share of commercial area is a rough guess — scope.
