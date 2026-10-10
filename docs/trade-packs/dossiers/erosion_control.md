# Dossier — `erosion_control` (Erosion & Sediment Control)

> Wave: w06 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/erosion_control.ts` · Status: draft
> Taxonomy: category `sitework` · permit_trade `building` · phase `site_prep` · CSI `31 25`

## Scope (2–4 sentences)
Installs and maintains temporary erosion and sediment controls on a disturbed site: silt fence and
sediment logs, stone tracking pads, storm inlet protection, stockpile protection, sediment traps,
erosion mat and temporary seeding; runs the weekly and after-rain inspections and the street cleaning;
removes the controls after final stabilization and closes the stormwater permit. Does NOT build the
permanent stormwater system (detention pond outlet structures, storm sewer → `site_utilities` /
`excavation`), mass grading (`excavation`) or the finished lawn (`landscaping`).

## Existing coverage reconciled
- Hand recipe: none (not in `HAND_RECIPE_KEYS`) → NEW-TRADE pattern, 2 recipes with `example_title`.
- Catalog codes already seeded: none for erosion control. `G-LSC-SEED-SF` (landscaping) covers seeding,
  so no temporary-seeding assembly here. New prefix `B-ERO-` (bucket building via permit_trade).
- Blueprint template tasks: "Temporary erosion controls" (residential-sf, pole-barn), "Stormwater
  management & erosion controls" (residential-mf), "Stormwater detention & erosion controls"
  (commercial). Residential recipe `title_re` = `erosion|silt fence|sediment control`; permitted-site
  recipe adds `stormwater|swppp|sediment`, scoped to commercial/industrial/residential_mf, priority 1.

## Gating decision
permit_trade is `building`, but no building inspection stage signs off erosion control. In Wisconsin
the UDC erosion check rides along with **every** other UDC inspection (SPS 320.10(3)(b)) and permitted
sites (≥1 acre) are self-inspected under the WPDES general permit — so no `gating_inspection_type`, no
top-level `code_refs`. Hold points are `inspection_checklists`: `pre_construction_controls`,
`weekly_inspection_log`, `post_rain_inspection`, `final_stabilization`. Step code refs use
`code_type` 'WI SPS' (321.125, 320.09) and 'WI NR' (216.46, 216.48, 216.55, 151.11).

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| erosion_control-wi-dnr-1056 | WDNR TS 1056 Perimeter Sediment Control (Apr 2024) | 1 | gov_open | silt fence install, inspection, cleanout |
| erosion_control-wi-dnr-1057 | WDNR TS 1057 Trackout Control (Jul 2018) | 1 | gov_open | tracking pad, street cleaning |
| erosion_control-wi-dnr-1060 | WDNR TS 1060 Inlet Protection (Jan 2022) | 1 | gov_open | inlet types, clearance, cleanout |
| erosion_control-wi-dnr-1052 | WDNR TS 1052 Non-Channel Erosion Mat (Oct 2018) | 1 | gov_open | mat install, Sept 1 rule |
| landscaping-wi-dnr-1058 / -1059 | WDNR TS 1058 Mulching / 1059 Seeding | 1 | gov_open | temporary stabilization (reused) |
| erosion_control-wi-dnr-standards | WDNR construction standards index | 1 | gov_open | index |
| erosion_control-wi-csgp | WPDES general permit WI-S067831-6 | 1 | gov_open | inspections 4.5, records 4.6, NOT 2.7 |
| erosion_control-wi-dnr-forms | DNR construction stormwater forms | 1 | gov_open | inspection report form |
| erosion_control-wi-nr216 | Wis. Adm. Code NR 216 subch. III | 1 | gov_open | 70% final stabilization, plan, inspections |
| erosion_control-wi-nr151 | Wis. Adm. Code NR 151.11 | 1 | gov_open | install-before, 14-day temp stabilization, 7-day stockpiles |
| patio_covers_awnings-wi-sps321 | Wis. Adm. Code SPS 321 (UDC) | 1 | gov_open | SPS 321.125 (reused id) |
| erosion_control-wi-sps320 | Wis. Adm. Code SPS 320 (UDC admin) | 1 | gov_open | site plan 320.09(5)(a), inspection 320.10(3)(b) |
| erosion_control-wisdot-ss-628 | WisDOT Std Spec 628 Erosion Control | 1 | gov_open | install/maintenance practice, pay units |
| excavation-wisdot-aup | WisDOT Average Unit Price List FY23–25 | 2 | gov_open | derived costs 628.1504/628.2008/628.7020/628.7560/628.1520 (reused) |
| erosion_control-epa-cgp | EPA 2022 CGP | 1 | gov_open | non-WI federal backdrop |
| ecfr-1926-c/e/g/i/o/p/w/z | 29 CFR 1926 subparts | 1 | public_domain | hazards |
| landscaping-diggers-hotline | Diggers Hotline (WI 811) | 1 | gov_open | locates (reused) |

## Work steps (draft → pack recipes)
**residential_lot_controls** (example "Temporary erosion controls"): lay out + locates (SPS 320.09(5)(a)) →
tracking pad (321.125(2)(a)) → silt fence on contour (321.125(1)(b)) → inlets + stockpiles (321.125(2)(b)) →
inspect/log/maintain (321.125(5)) → stabilize then remove (321.125(1)(c)).
**permitted_site_controls** (example "Stormwater detention & erosion controls", commercial/industrial/MF):
permit coverage + plan posted (NR 216.46) → perimeter/exit/inlet first (NR 151.11(8)) → sediment traps,
basins, diversions → weekly + rain inspections (NR 216.48(4)) → staged stabilization → final
stabilization + NOT (NR 216.55).

## Key verified numbers
- Inspect weekly and within 24 h after ≥0.5 in. rain in any continuous 24 h — CSGP 4.5.1, NR 216.48(4)(a),
  SPS 321.125(5)(a) (UDC: written record required at ≥1 acre).
- Repair within 24 h (permitted, CSGP 4.5.2 / NR 216.48(4)(b)); 48 h on UDC lots (SPS 321.125(6)(b)); immediately
  if threat to sewers/waters.
- Silt fence: ≥24 in. tall, trench ≥4 in. × 6 in., hardwood posts ≥1-1/8 in. × 4 ft, ≥2 ft embed, ≤8 ft (woven)
  / ≤3 ft (non-woven), clean at ½ height (WDNR 1056).
- Tracking pad: 3 in.–1-1/2 in. stone (Table 1), ≥12 in. thick, ≥50 ft, full width or ≥12 ft lane, not compacted
  (WDNR 1057). Inlet bags: 3 in. overflow clearance, clean at ⅓–½ (WDNR 1060).
- Temporary stabilization when idle >14 days (NR 151.11(8)(d)) — NOT 7 days; 7 days is the stockpile threshold.
- Final stabilization = uniform perennial cover ≥70% (NR 216.002(8), SPS 321.125(1)(c)). NOT within 45 days (CSGP 2.7).

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| utility_strike | trenching fence / driving posts into lines | 1926.651(b)(1) | 4 |
| struck_by_equipment | reversing skid steer / truck | 1926.602(a)(9)(ii) | 4 |
| street_traffic | public traffic at exit, street sweeping, curb inlets | 1926.201(a) (+200(g)) | 4 |
| equipment_rollover | skid steer on basin slopes | 1926.1000(a) | 4 |
| overhead_lines | dump bed / boom near lines | 1926.600(a)(6) | 4 |
| drowning_basin | sediment basin / pond | 1926.106(a) | 4 |
| silica_dry_sweeping | dry sweeping tracked soil | 1926.1153(f)(1) | 3 |
| heat_stress | hand trenching in sun | 1926.21(b)(2) | 3 |
| post_driving | stakes/posts | 1926.301(a) | 2 |
| slip_on_slopes | wet slopes / mat | 1926.21(b)(2) | 2 |

## QA checklist
15 items in the pack (ids: locates_called*, controls_before_disturbance, silt_fence_contour, silt_fence_trench,
silt_fence_posts, tracking_pad_build, inlet_protection_fit, stockpile_protected, inspection_log, repair_timing,
sediment_cleanout, street_clean, erosion_mat_contact, temp_stabilization, final_stabilization). *safety.

## Cost basis
| Code | Unit | Mat ¢ | Lab hr | Eq ¢ | Waste | Basis |
|---|---|---|---|---|---|---|
| B-ERO-SILT-FENCE-LF | LF | 75 | 0.018 | 15 | 5 | derived — WisDOT 628.1504 avg ~$2.06/LF (FY23–25) split at ~$55/hr |
| B-ERO-SILT-MAINT-LF | LF | 5 | 0.006 | 0 | 0 | estimate — WisDOT 628.1520 $0.03–0.11 is highway volume |
| B-ERO-TRACK-PAD-EA | EA | 83700 | 3 | 20000 | 5 | estimate — 22 CY stone + fabric; WisDOT 628.7560 $351–699 noted |
| B-ERO-INLET-PROT-EA | EA | 7500 | 0.85 | 0 | 0 | derived — WisDOT 628.7020 Type D avg ~$122 |
| B-ERO-MAT-SY | SY | 110 | 0.012 | 0 | 10 | derived — WisDOT 628.2008 Urban Class I Type B avg ~$1.97/SY |
| B-ERO-PLAN-EA | EA | 250000 | 4 | 0 | 0 | estimate — plan/SWPPP consultant fee |

## Quantity rules (only when erosion_control is on the schedule — seedFromPacks)
- `B-ERO-SILT-FENCE-LF` = const 200 (residential_sf)
- `B-ERO-SILT-MAINT-LF` = const 200 (residential_sf, one cleaning)
- `B-ERO-TRACK-PAD-EA` = const 1 (all building types)
- `B-ERO-INLET-PROT-EA` = const 1 (residential_sf)
- `B-ERO-PLAN-EA` = const 1 (residential_mf, commercial, industrial)

## Blueprint callouts (components)
None this wave (per brief). Candidate later: `silt_fence` ("SILT FENCE" on UDC site plans).

## Open questions → REVIEW_QUEUE
- es_safety: 10 hazards + 1 QA + 1 checklist item pending human translation.
- cost_estimate: SILT-MAINT, TRACK-PAD, PLAN estimate-only; derived splits assume ~$55/hr burdened labor.
- scope: WI-specific code refs (SPS/NR) render on every project regardless of state; jurisdiction-aware refs needed.
- vocab: silt-fence slicing machine not in equipment vocab.
- scope: temporary seeding left to `G-LSC-SEED-SF` (landscaping, general bucket) — not emitted by this pack.
