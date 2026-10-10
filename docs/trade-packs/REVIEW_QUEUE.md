# Trade Packs — Human Review Queue

Agents append here; humans work it. A pack moves `draft → reviewed` only by a human edit.

## How to review a pack
1. Read `docs/trade-packs/dossiers/<key>.md` — check sources are real and steps are field-correct.
2. Translate ES safety strings (`pending_human_translation`) — professional translator (T-08).
3. Sanity-check costs marked `estimate` against your own job history.
4. Set `status: 'reviewed'` in the pack, bump `pack_version`, run `npm run pack:check <key>`.

## Open items
| Date | Wave | Trade | Type | Item |
|---|---|---|---|---|
| 2026-10-08 | 0a | (all new keys) | naming | ✅ APPROVED 2026-10-08 — Approve the 56 new taxonomy keys before PR merge — keys are permanent (T-64). List: `docs/Trade_Knowledge_Packs_v1_0.md` §2. |
| 2026-10-08 | 0b | decks | es_safety | 8 hazards + 11 safety QA items + inspection checklists pending human translation. |
| 2026-10-08 | 0b | concrete | es_safety | 8 hazards + inspection checklists pending human translation. |
| 2026-10-08 | 0b | decks | cost_estimate | All 7 `B-DECK-*` assemblies are platform-baseline estimates (no public unit-cost source). Check against Example Builders job history. |
| 2026-10-08 | 0b | decks | vocab | Propose equipment type `post_hole_auger` (+ `EQUIP-POST_HOLE_AUGER` day rate) for footing steps. |
| 2026-10-08 | 0b | decks | source_doubt | AWC DCA 6 free edition is 2015-IRC based; WI adopts a newer IRC — confirm local deck rules (Madison) match. |
| 2026-10-08 | 0b | (all) | decision | Lock proposed **T-66** (Trade Knowledge Packs, Doc 23 §8) in `docs/LOCKED_DECISIONS.md`. |
| 2026-10-08 | 01 | framing | es_safety | 12 hazards (hazard_es + controls_es) + 1 safety QA (truss_bracing) + 10 inspection checklist items pending human translation |
| 2026-10-08 | 01 | framing | cost_estimate | B-FRM-SUBFLOOR-SF, B-FRM-SILL-LF, B-FRM-LVL-LF, B-FRM-HOLDDOWN-EA, B-FRM-UPLIFT-TIE-EA — all platform-baseline estimates; LVL price volatile |
| 2026-10-08 | 01 | framing | source_doubt | hazard structure_collapse cites 1926.20(b)(2) (general competent-person duty) — no 1926 section is specific to wood wall/truss bracing |
| 2026-10-08 | 01 | framing | source_doubt | WFCM cited at the 2018 edition page; no newer-edition page found on awc.org |
| 2026-10-08 | 01 | framing | scope | Hand recipe has no sill/fireblocking/truss-bracing steps — candidate for a supersedes_hand pack recipe in a later wave |
| 2026-10-08 | 01 | framing | scope | B-FRAME-SF ($9/SF "wood framing, floor area", 0028) may already include subfloor — B-FRM-SUBFLOOR-SF rule could double-count; decide and adjust one of them |
| 2026-10-08 | 01 | roofing | es_safety | 12 hazards + 2 safety QA (fall_protection_rigged, openings_covered) + 10 inspection checklist items pending human translation |
| 2026-10-08 | 01 | roofing | cost_estimate | All 6 B-RF-* assemblies are platform-baseline estimates (ice & water, drip edge, ridge vent, tear-off, pipe boot, step flashing) |
| 2026-10-08 | 01 | roofing | scope | B-RF-ICE-WATER-SF rule fires for every climate — no cold-region fact exists to gate it (fine for WI) |
| 2026-10-08 | 01 | roofing | scope | Tear-off and step flashing have no quantity rule (no blueprint basis for reroof scope or roof-wall length) |
| 2026-10-08 | 01 | roofing | source_doubt | heat_illness cites 1926.21(b)(2) (general hazard training) — 1926 has no heat-specific section |
| 2026-10-08 | 01 | roofing | scope | Torch-applied / low-slope membrane hazards + QA deferred (steep-slope focus) |
| 2026-10-08 | 01 | drywall | es_safety | 11 hazards + 4 safety QA + 7 inspection-checklist items pending human translation |
| 2026-10-08 | 01 | drywall | cost_estimate | B-DW-TYPEX-SF, B-DW-MR-SF, B-DW-L5-SF, B-DW-CORNER-LF, B-DW-TEXTURE-SF all platform-baseline estimates |
| 2026-10-08 | 01 | drywall | source_doubt | IRC R702.3.x sub-numbering varies by edition — only R702.3/R702.3.5 cited; verify against adopted edition |
| 2026-10-08 | 01 | drywall | vocab | Some AHJs run a separate gypsum-board fastening inspection; items filed under `framing`. Propose inspection type `gypsum_board`? |
| 2026-10-08 | 01 | drywall | vocab | Quantity DSL needs a room-name basis (e.g. count rooms matching /GARAGE|BATH/) — Type X and moisture-resistant rules were removed rather than guessed with constants. Also: seedFromPacks ignores `when.building_types` (only facts_any). |
| 2026-10-08 | 01 | windows | es_safety | 12 hazards + 4 safety QA (safety_glazing_mark, egress_opening, fall_protection_sill, lead_safe_setup) + 7 inspection checklist items pending human translation |
| 2026-10-08 | 01 | windows | cost_estimate | B-WIN-FLASH-EA, B-WIN-TRIM-EA, B-WIN-REPL-EA, B-WIN-EGRESS-WELL-EA are platform-baseline estimates |
| 2026-10-08 | 01 | windows | scope | B-WIN-TRIM-EA rule may double-count with siding opening trim; estimator drops one |
| 2026-10-08 | 01 | windows | source_doubt | fgiaonline.org 403 to scripts; Marvin install pages 404; Andersen/Pella cited at support-center level, not per-product PDFs |
| 2026-10-08 | 01 | exterior_doors | es_safety | 12 hazards + 5 safety QA + 7 inspection checklist items pending human translation |
| 2026-10-08 | 01 | exterior_doors | cost_estimate | B-EXTDR-SILLPAN-EA, -PATIO-EA, -STORM-EA, -LOCKSET-EA, -GARAGE-EA are platform-baseline estimates |
| 2026-10-08 | 01 | exterior_doors | scope | `doors` fact counts interior + exterior; 0.25/0.08 multipliers are assumptions — an exterior-door count in blueprint facts would fix it |
| 2026-10-08 | 01 | exterior_doors | scope | Residential/pole-barn templates tag "Exterior door & window installation" as `windows` — only the commercial template reaches this pack |
| 2026-10-08 | 01 | exterior_doors | source_doubt | Andersen source is a hinged patio-door guide; find a sliding-door install guide |
| 2026-10-08 | 01 | (tooling) | vocab | pack:smoke only exercises the first recipe title; add per-recipe sample titles. Generic `/fram/` equipment rule adds a forklift to any step title containing "frame". |
| 2026-10-08 | 01 | insulation | es_safety | 10 hazards + 3 safety QA (recessed_lights, chimney_clearance, foam_covered) + 9 inspection checklist items pending human translation |
| 2026-10-08 | 01 | insulation | cost_estimate | B-INS-BLOWN-ATTIC-SF, -RIGID-FDN-SF, -AIRSEAL-EA, -BAFFLE-EA, -RIM-LF all platform-baseline estimates |
| 2026-10-08 | 01 | insulation | source_doubt | IRC N-section numbering is edition-dependent; recessed-lighting section omitted (IECC R402.4.5 vs R402.4.6 across editions) |
| 2026-10-08 | 01 | insulation | scope | Blown-attic / rigid-foundation have no rule (would double-count B-INSUL-SF); consider splitting B-INSUL-SF by assembly |
| 2026-10-08 | 01 | insulation | vocab | Propose equipment type `insulation_blower` |
| 2026-10-08 | 01 | (schema) | vocab | Code refs always take the family code_type prefix — IECC/NFPA refs render as "IRC IECC R402…". Add optional per-ref `code_type` override to StepTpl/code_refs. |
| 2026-10-08 | 02 | hvac | es_safety | 12 hazards + 3 safety QA (vent_combustion_air, co_alarm_present, gas_leak_check) + 17 inspection checklist items pending human translation |
| 2026-10-08 | 02 | hvac | cost_estimate | M-HV-HEATPUMP-SPLIT, -COND-PUMP, -OVERFLOW-EA, -ERV, -STARTUP all platform-baseline estimates; heat-pump price volatile (refrigerant transition) |
| 2026-10-08 | 02 | hvac | source_doubt | IMC 1107/1108 and IECC R403.7 numbers edition-dependent; manual_lifting cites 1926.21(b)(2) (no 1926 lifting standard); attic_fall cites 1926.501(b)(4)(ii) by analogy |
| 2026-10-08 | 02 | hvac | scope | No blueprint fact distinguishes heat pump vs furnace / mini-split / ERV — those assemblies have no rule; M-HV-OVERFLOW-EA fires for every fau (basement units may not need it) |
| 2026-10-08 | 02 | gas_piping | es_safety | 12 hazards + 12 safety QA + 10 inspection-checklist items pending human translation |
| 2026-10-08 | 02 | gas_piping | cost_estimate | P-GAS-APPL-CONN, -TEST-SYS, -CSST-BOND, -REG-LINE, -PROPANE-TANK are platform-baseline estimates |
| 2026-10-08 | 02 | gas_piping | scope | P-GAS-PROPANE-TANK is often leased from the propane supplier — rule may overstate cost; P-GAS-CSST-BOND rule assumes CSST whenever gas is flagged |
| 2026-10-08 | 02 | gas_piping | source_doubt | NFPA 58 cited by chapter only; CSST bonding needs vary by product (arc-resistant jackets) and AHJ |
| 2026-10-08 | 02 | plumbing | es_safety | 11 hazards + 1 safety QA (th_relief_discharge) + 2 inspection checklist items pending human translation |
| 2026-10-08 | 02 | plumbing | cost_estimate | P-PL-EXP-TANK-EA, -PRV-EA, -WH-CHANGEOUT-EA, -SUMP-PUMP-EA, -SOFTENER-LOOP-EA, -HOSEBIB-FF-EA all platform-baseline estimates |
| 2026-10-08 | 02 | plumbing | source_doubt | IPC Ch. 9 vent sub-sections omitted (renumbered between editions); UPC jurisdictions number differently |
| 2026-10-08 | 02 | plumbing | scope | Expansion-tank rule assumes a closed system for every water heater; no blueprint basis for sump pump / softener / PRV quantities |
| 2026-10-08 | 02 | low_voltage | es_safety | 11 hazards + 4 safety QA (cable_rating_space, separation_power, firestop_rated, bonding) + 9 inspection checklist items pending human translation |
| 2026-10-08 | 02 | low_voltage | cost_estimate | E-LV-COAX-DROP, -MEDIA-PANEL, -CERT-TEST, -WAP, -PREWIRE all platform-baseline estimates |
| 2026-10-08 | 02 | low_voltage | source_doubt | NEC Art. 800 numbering shifted 2020→2023 (722/724/725 split) — verify sections against adopted edition |
| 2026-10-08 | 02 | low_voltage | scope | rough_in/final gates assume the electrical permit covers low-voltage work; many AHJs issue no permit for residential Class 2/comms |
| 2026-10-08 | 02 | electrical | es_safety | 10 hazards + 7 safety QA + 22 inspection checklist items pending human translation |
| 2026-10-08 | 02 | electrical | cost_estimate | E-EL-AFCI-BRKR-EA, -GFCI-BRKR-EA, -SPD-EA, -240V-CIRCUIT-EA, -TEMP-POLE-EA all platform-baseline estimates |
| 2026-10-08 | 02 | electrical | source_doubt | necanet.org / esfi.org 403 to scripts — verify in a browser; NEC 230.67 (SPD) and 110.14(D) depend on adopted edition |
| 2026-10-08 | 02 | electrical | scope | const rules SPD (1), 240V circuits (2, range+dryer), temp pole (1) fire on every residential_sf estimate — may over-seed gas homes, remodels, pre-2020-NEC jurisdictions |
| 2026-10-08 | 02 | well_drilling | es_safety | 12 hazards + 4 safety QA + 8 inspection-checklist items pending human translation |
| 2026-10-08 | 02 | well_drilling | cost_estimate | All 6 P-WELL-* assemblies are platform-baseline estimates; drilling $/LF varies widely by geology |
| 2026-10-08 | 02 | well_drilling | vocab | Propose equipment types `well_drilling_rig`, `pump_hoist`; component token `private_well` (needed before any quantity rules) |
| 2026-10-08 | 02 | well_drilling | scope | Drilling recipe has no gate — WI DNR (state), not the local plumbing AHJ, regulates private wells; consider a state-regulated checkpoint type |
| 2026-10-08 | 02 | well_drilling | source_doubt | IPC 602.3 / 610 section titles not checked against ICC text (site blocks scripts) — confirm against adopted edition |
| 2026-10-08 | 02 | septic | es_safety | 11 hazards + 2 safety QA (risers_lids_secured, abandonment_filled) + 9 inspection-checklist items pending human translation |
| 2026-10-08 | 02 | septic | cost_estimate | All 6 P-SEP-* assemblies are platform-baseline estimates |
| 2026-10-08 | 02 | septic | scope | Drainfield/mound quantities not seeded — needs a bedroom-count or design-flow fact (SPS 383.43(3)) |
| 2026-10-08 | 02 | septic | vocab | Consider `boom_truck` equipment type for precast tank setting (currently `crane`) |
| 2026-10-08 | 02 | (engine) | vocab | Fixed in wave: facts_any now matches fixture types (hvac/ductwork forced-air rules were silently dead). Smoke now tests residential_sf + fau/water_heater fixtures. Duplicate eCFR source ids merged into shared ecfr-1926-f/j/aa. |
| 2026-10-08 | 02 | ductwork | scope | Blueprint template duct tasks are tagged trade 'hvac', not 'ductwork' — the ductwork recipes only reach tasks tagged ductwork; consider retagging template duct tasks |
| 2026-10-08 | 02 | ductwork | es_safety | 12 hazards + 3 safety QA (fire_dampers, return_air_source, garage_penetration) + 9 inspection-checklist items pending human translation |
| 2026-10-08 | 02 | ductwork | cost_estimate | M-DU-LEAK-TEST, -SEAL-SYS, -RETURN-DROP, -BAL-DAMPER, -FIRE-DAMPER platform-baseline estimates; IECC duct-test subsection stored generically as R403.3 |
| 2026-10-08 | 03 | painting | es_safety | 12 hazards + 3 safety QA (lead_status_known, rrp_containment, rrp_cleaning_verification) + 5 lead checklist items pending human translation |
| 2026-10-08 | 03 | painting | cost_estimate | G-PNT-RRP-SETUP-EA, -TRIM-EXT-LF, -INT-TRIM-LF, -DOOR-EA, -CAB-REFIN-LF, -STAIN-EXT-SF all platform-baseline estimates |
| 2026-10-08 | 03 | painting | source_doubt | Field spraying cited under 1926.57(a) + 1926.55(b) (1926.66 / 1926.57(h) cover booths/spray rooms) — confirm; MPI site redirect-loops (not cited) |
| 2026-10-08 | 03 | painting | scope | Removed a rule that added 2,000 SF exterior repaint whenever stucco appears (new stucco is usually integral color; flat guess) |
| 2026-10-08 | 03 | flooring_carpet | es_safety | 11 hazards + 2 safety QA (stairs_tight, install_ventilated) + 3 checklist items pending human translation |
| 2026-10-08 | 03 | flooring_carpet | cost_estimate | All 6 G-CPT-* assemblies are platform-baseline estimates |
| 2026-10-08 | 03 | flooring_carpet | vocab | No stair component token — G-CPT-STAIR-EA has no rule; propose `carpeted_stairs` component |
| 2026-10-08 | 03 | finish_carpentry | es_safety | 12 hazards + handrail_secure QA + 5 stair/rail checklist items pending human translation |
| 2026-10-08 | 03 | finish_carpentry | cost_estimate | G-FC-CASING-EA, -WIN-INT-EA, -BASE-LF, -CROWN-LF, -CLOSET-SHELF-LF, -HANDRAIL-LF all platform-baseline estimates |
| 2026-10-08 | 03 | finish_carpentry | scope | G-FC-CLOSET-SHELF-LF may overlap closets_storage (w05); G-FC-HANDRAIL-LF may overlap stairs_railings (w16) — reconcile then. Base rule (rooms × 40 LF) is a perimeter proxy |
| 2026-10-08 | 03 | finish_carpentry | source_doubt | Door instructions cited via pdf.lowes.com retailer-hosted URLs — may move |
| 2026-10-08 | 03 | cabinetry | es_safety | 11 hazards + 2 safety QA (uppers_into_framing, no_cut_backs) + 2 upper_install_check items pending human translation |
| 2026-10-08 | 03 | cabinetry | cost_estimate | G-CB-VANITY-EA, -TALL-EA, -CROWN-LF, -HARDWARE-EA, -REMOVE-LF all platform-baseline estimates |
| 2026-10-08 | 03 | cabinetry | vocab | No lavatory/vanity fixture token — G-CB-VANITY-EA uses a fixed 2 per single-family plan with a cabinet callout; add `lavatory` to FIXTURE_TOKENS so it scales |
| 2026-10-08 | 03 | cabinetry | source_doubt | upper_cabinet_fall cites 1926.21(b)(2) (general training duty) — no 1926 section covers manual lifting / unsecured casework |
| 2026-10-08 | 03 | flooring_wood | es_safety | 12 hazards + 1 safety QA (waste_disposal_daily) + 1 sand/finish fire-control checklist item pending human translation |
| 2026-10-08 | 03 | flooring_wood | cost_estimate | G-WD-REFINISH-SF, -ENG-GLUE-SF, -STAIR-TREAD-EA, -UNDERLAY-SF, -FLATPREP-SF, -TRANS-EA all platform-baseline estimates; rules assume hardwood ≈40% of room area (no finish-schedule fact) |
| 2026-10-08 | 03 | flooring_wood | vocab | Propose equipment type `floor_sander`; a finish-schedule blueprint fact would replace the 40% assumption |
| 2026-10-08 | 03 | flooring_wood | source_doubt | sander_dust_fire cites 1926.252(e) by analogy; NWFA guidelines member-only (concepts only) |
| 2026-10-08 | 03 | tile | es_safety | 12 hazards + 2 safety QA (membrane_continuous, flood_test_passed) + 3 flood-test checklist items pending human translation |
| 2026-10-08 | 03 | tile | cost_estimate | G-TL-PAN-WP-SF, -LINDRAIN-EA, -BKSPL-SF, -UNCPL-SF, -LFT-SF, -TRIM-LF all platform-baseline estimates |
| 2026-10-08 | 03 | tile | scope | Backsplash (30 SF) and shower pan (15 SF) rules are fixed guesses scoped to ceramic_tile callout + residential_sf — verify against elevations |
| 2026-10-08 | 03 | tile | vocab | Propose equipment type `tile_wet_saw` |
| 2026-10-08 | 03 | flooring_resilient | es_safety | 11 hazards + 1 safety QA (old_floor_asbestos_cleared) + 1 asbestos-survey checklist item pending human translation |
| 2026-10-08 | 03 | flooring_resilient | cost_estimate | G-RES-SHEET-SF, -VCT-SF, -BASE-LF, -REMOVE-SF, -UNDERLAY-SF all platform-baseline estimates |
| 2026-10-08 | 03 | flooring_resilient | vocab | Propose equipment type `floor_stripper`; Armstrong F-5061 is a 2009 chapter (brand now AHF) — find current edition |
| 2026-10-08 | 03 | (flooring) | scope | Residential floor-area shares rebalanced at wave review so all four trades together ≤100%: carpet 30%, wood 30%, LVP 25%, tile 15% (were 40/40/35/15 = 130%). Replace with a finish-schedule blueprint fact. |
| 2026-10-08 | 03 | countertops | es_safety | 12 hazards + 2 safety QA (overhang_support, no_dry_cutting) + 2 checklist items pending human translation |
| 2026-10-08 | 03 | countertops | cost_estimate | All 6 G-CT-* assemblies are platform-baseline estimates |
| 2026-10-08 | 03 | countertops | source_doubt | Cambria install guideline is public but marked confidential — relabeled proprietary_ref_only at review (all facts also cite another source). No public laminate install guide verified |
| 2026-10-08 | 03 | countertops | vocab | No slab-handling equipment type (vacuum lifter / slab cart / A-frame) |
| 2026-10-08 | 03 | (engine) | vocab | Fixed in wave: pack:smoke now checks the pack's own unresolved placeholders (em dash in labels was a false alarm). Schedule DAG now orders painting before carpet/resilient/wood flooring (pack hints) — updated task-dependencies test. |
| 2026-10-08 | S1 | (mobile) | blocked | JSA "Suggest hazards" is merged but NOT shipped to phones: verify on a device/emulator (KVM unavailable on the dev box), then `cd mobile && eas update --branch production`. Add a Maestro flow `jsa-suggest-hazards.yaml` once the emulator is back. |
| 2026-10-08 | S1 | (web) | scope | QA checklist check-offs are not persisted (no table yet) — decide whether to add task QA completion records in a later wave. |
| 2026-10-08 | 04 | patio_covers_awnings | es_safety | 10 hazards + 9 safety QA + inspection checklist items pending human translation |
| 2026-10-08 | 04 | patio_covers_awnings | cost_estimate | B-PCA-ALUM-SF, -INSUL-SF, -PERGOLA-WOOD-SF, -SCREEN-RM-SF, -AWNING-EA all platform-baseline estimates |
| 2026-10-08 | 04 | patio_covers_awnings | source_doubt | IRC patio-cover appendix AH101–AH106 (2021) is Appendix BF in 2024 IRC — confirm AHJ edition; manufacturer install guides not public, ICC-ES ESR-4436 used |
| 2026-10-08 | 04 | patio_covers_awnings | scope | Reuses B-DECK-FOOTING-EA / B-DECK-LEDGER-LF — on a project with both a deck and a patio cover only one footing/ledger line seeds (one line per code); no retractable-awning recipe |
| 2026-10-08 | 04 | landscaping | es_safety | 10 hazards + 1 safety QA (locates_done) + 1 final_grade_check item pending human translation |
| 2026-10-08 | 04 | landscaping | cost_estimate | G-LSC-TOPSOIL-CY, -SEED-SF, -SOD-SF, -TREE-EA, -SHRUB-EA, -MULCH-SF all platform-baseline estimates |
| 2026-10-08 | 04 | landscaping | source_doubt | ANSI A300 (TCIA 404) and NRCS CPS 342 (timed out) not cited — UW Extension + WDNR 1058/1059 used |
| 2026-10-08 | 04 | landscaping | scope | No quantity rules (no lawn/bed area fact); lighting + edging assemblies deferred; consider a supersedes_hand recipe (grade → seed/sod → plant → mulch → handoff) |
| 2026-10-08 | 04 | gutters | es_safety | 10 hazards + 1 safety QA (heat_cable_gfci) pending human translation |
| 2026-10-08 | 04 | gutters | cost_estimate | B-GUT-DS-LF, -EXT-EA, -GUARD-LF, -HEAT-LF, -REMOVE-LF platform-baseline estimates; B-GUTTER-LF allowance 160 LF (SF) / 320 LF (MF) is a rough guess |
| 2026-10-08 | 04 | gutters | source_doubt | Slope guidance conflicts (mfr 1/4 in per 10 ft vs DOE BASC ≥1/16 in per ft); DOE BASC advises avoiding gutters in very cold climates — conflicts with WI practice |
| 2026-10-08 | 04 | gutters | vocab | Propose equipment type `gutter_roll_former` |
| 2026-10-08 | 04 | concrete_flatwork | es_safety | 10 hazards + 1 safety QA (utilities_marked) + 4 checklist items pending human translation |
| 2026-10-08 | 04 | concrete_flatwork | cost_estimate | B-CFW-CURB-GUTTER-LF, -CURBCUT-LF, -ISOJOINT-LF, -JOINTSEAL-LF, -DETWARN-EA platform-baseline estimates — candidates for WisDOT avg unit bid prices (601/602) |
| 2026-10-08 | 04 | concrete_flatwork | scope | residential_sf defaults (640 SF drive+walk, 120 SF apron thickened 4→6 in) are guesses; apron standard varies by municipality |
| 2026-10-08 | 04 | concrete_flatwork | source_doubt | WisDOT 602 says do not seal joints on DOT sidewalks/drives — B-CFW-JOINTSEAL-LF is an owner/commercial option; confirm |
| 2026-10-08 | 04 | fencing | es_safety | 12 hazards + 5 safety QA (locate_ticket, pool_gaps, pool_no_climb_aids, pool_gate_self_close, pool_house_wall) + 8 checklist items pending human translation |
| 2026-10-08 | 04 | fencing | cost_estimate | B-FNC-GATE-WALK-EA, -GATE-DBL-EA, -POOLGATE-HW-EA, -CHAINLINK-LF, -ALUM-LF, -REMOVE-LF platform-baseline estimates |
| 2026-10-08 | 04 | fencing | source_doubt | ISPSC 305.2/305.3/305.4 + IRC AG105 numbers confirmed via jurisdiction handouts (ICC site blocks scripts) |
| 2026-10-08 | 04 | fencing | scope | fence_callout quantity (150 LF + 1 walk gate) is a placeholder until site-plan LF extraction exists; second vote for `post_hole_auger` equipment type |
| 2026-10-08 | 04 | hardscape_pavers | es_safety | 10 hazards + 2 safety QA (locate_ticket, wet_cutting) pending human translation |
| 2026-10-08 | 04 | hardscape_pavers | cost_estimate | G-HSP-PAVER-SF, -PERM-SF, -EDGE-LF, -POLY-SF, -SEATWALL-LF platform-baseline estimates |
| 2026-10-08 | 04 | hardscape_pavers | scope | paver_patio callout tightened at review: no longer fires on "EXISTING … PAVERS" or bare "PAVERS"; quantity rules assume ≈250 SF patio until measured; seat-wall recipe deferred (NCMA TEK not extractable) |
| 2026-10-08 | 04 | irrigation | es_safety | 10 hazards + 3 safety QA (utility_locate, backflow_type, backflow_registered_tested) + 7 inspection checklist items pending human translation |
| 2026-10-08 | 04 | irrigation | cost_estimate | P-IRR-ZONE-SPRAY-EA, -ZONE-DRIP-EA, -TAP-EA, -BFP-PVB-EA, -CTRL-SMART-EA, -WINTERIZE-EA platform-baseline estimates |
| 2026-10-08 | 04 | irrigation | source_doubt | IPC lawn-irrigation backflow 608.17.5 (2021) / 608.16.5 (2018) confirmed via secondary sources; Hunter guides 403 to scripts |
| 2026-10-08 | 05 | remodeling | es_safety | 12 hazards + 6 safety QA + 10 inspection-checklist items pending human translation |
| 2026-10-08 | 05 | remodeling | cost_estimate | B-RMD-DUST-EA, -FLOORPROT-SF, -RRP-EA, -PUNCH-EA platform-baseline estimates; B-RMD-PERMIT-EA $750 permit/admin allowance — fees vary widely, tune per tenant |
| 2026-10-08 | 05 | remodeling | source_doubt | IEBC chapter numbers (Ch. 6/8) and IRC R310 sub-sections vary by edition |
| 2026-10-08 | 05 | remodeling | vocab | Propose a project build-year fact so lead-safe (RRP) setup can be seeded automatically for pre-1978 homes |
| 2026-10-08 | 05 | foundation_repair | es_safety | 11 hazards + 3 safety QA (design_on_file, pit_sequence, lift_monitored) pending human translation |
| 2026-10-08 | 05 | foundation_repair | cost_estimate | B-FDR-HELICAL-EA, -PUSHPIER-EA, -WALLANCHOR-EA, -WALLBRACE-EA, -CRACKINJ-LF, -ENGEVAL-EA platform-baseline estimates (engineering fee carried as material) |
| 2026-10-08 | 05 | foundation_repair | source_doubt | USACE EM 1110-2-2002 not re-readable (DTIC 403) — crack-material QA (epoxy dormant / chemical grout leaking) marked derived; confirm |
| 2026-10-08 | 05 | foundation_repair | vocab | No inspection type for "engineer's letter in lieu of AHJ inspection" — kept as checklist key `engineer_letter` |
| 2026-10-08 | 05 | (engine) | vocab | Fixed in wave: pack-recipe steps now use the pack's own equipment rules (family phase rules put an excavator + power trowel on interior crack injection); hand-recipe steps still merge pack + family |
| 2026-10-08 | 05 | closets_storage | es_safety | 12 hazards + 7 safety QA + 4 safety checklist items pending human translation |
| 2026-10-08 | 05 | closets_storage | cost_estimate | G-CLS-WIRE-LF, -TRACK-LF, -LAM-LF, -GARCAB-LF, -OHRACK-EA platform-baseline estimates |
| 2026-10-08 | 05 | closets_storage | source_doubt | Manufacturer PDFs retailer-hosted (may move); falling_shelf / overhead_rack / heavy_lift use general-duty 1926 refs (no specific section) |
| 2026-10-08 | 05 | abatement | es_safety | 12 hazards + 10 safety QA + 16 checklist items pending human translation |
| 2026-10-08 | 05 | abatement | cost_estimate | B-ABT-SURVEY-EA, -PIPE-LF, -FLOOR-SF, -CEIL-SF, -LEAD-SF, -MOLD-SF platform-baseline estimates (disposal folded into material); clearance-test + containment assemblies deferred |
| 2026-10-08 | 05 | abatement | source_doubt | 40 CFR 745 dust-lead hazard/clearance levels changed 2026-01-12 — pack states no numbers; confirm WI DHS 163.15 adoption |
| 2026-10-08 | 05 | abatement | vocab | Propose equipment types `negative_air_machine` / `hepa_air_scrubber`, `dehumidifier` (also restoration). No AHJ gates by design — clearance is agency-regulated |
| 2026-10-08 | 05 | chimney | es_safety | 12 hazards + 5 safety QA (clearance_combustibles, termination_height, cap_spark_arrestor, draft_test, co_alarm_present) + checklist items pending human translation |
| 2026-10-08 | 05 | chimney | cost_estimate | All 6 B-CHM-* assemblies are platform-baseline estimates; tuckpointing + cricket assemblies deferred |
| 2026-10-08 | 05 | chimney | source_doubt | NFPA 211 15.2 / 15.4 confirmed only via secondary sources — verify in NFPA free-access viewer |
| 2026-10-08 | 05 | chimney | vocab | Propose equipment types `scaffold` and `inspection_camera` |
| 2026-10-08 | 05 | restoration | es_safety | 12 hazards + 3 safety QA (utilities_safe, hazmat_survey, no_engines_indoors) + 5 checklist items pending human translation |
| 2026-10-08 | 05 | restoration | cost_estimate | All 6 G-RST assemblies (EXTRACT-SF, AIRMOVER-DAY, DEHU-DAY, FLOODCUT-LF, BOARDUP-EA, TARP-SF) platform-baseline estimates; antimicrobial + contents pack-out deferred |
| 2026-10-08 | 05 | restoration | source_doubt | FEMA 234 cited via LA County DPW mirror (fema.gov blocks scripts); OSHA/CDC URLs verified only with full browser headers |
| 2026-10-08 | 05 | restoration | vocab | Propose equipment types `air_mover`, `dehumidifier`, `water_extractor`, `air_scrubber` |
| 2026-10-08 | 05 | concrete_repair_lifting | es_safety | 11 hazards + 3 safety QA (utilities_located, silica_controls, isocyanate_controls) + 1 checklist item pending human translation |
| 2026-10-08 | 05 | concrete_repair_lifting | cost_estimate | All 6 G-CRL-* assemblies platform-baseline estimates; foam lb/SF and $/lb vary widely with soil and void size |
| 2026-10-08 | 05 | concrete_repair_lifting | source_doubt | Isocyanate guidance (EPA SPF pages) applied by analogy to injection foam; Regina (Canada) municipal spec and distributor-hosted Alchatek TDS used; HMI 403 |
| 2026-10-08 | 05 | concrete_repair_lifting | vocab | Propose equipment types `polyurethane_rig`, `grout_pump` |
| 2026-10-08 | 05 | radon_mitigation | es_safety | 10 hazards + 4 safety QA (fan_location, fire_penetration, discharge_location, fan_wired) + 3 final checklist items pending human translation |
| 2026-10-08 | 05 | radon_mitigation | cost_estimate | B-RDN-SSD-EA, -SUCT-EA, -SUMP-EA, -RRNC-EA, -TEST-EA, -MEMB-SF platform-baseline (SSD cross-checked vs WI DHS $1,000–2,000 avg) |
| 2026-10-08 | 05 | radon_mitigation | source_doubt | IRC Appendix F AF103.x numbering (2012–2021) renamed Appendix AF in 2024 IRC; radon_exposure hazard uses 1926.53 (ionizing radiation) as nearest OSHA hook |

Types: `naming` · `es_safety` · `cost_estimate` · `source_doubt` · `vocab` (new equipment type /
inspection type proposed) · `scope` (trade boundary unclear) · `blocked`.
| 2026-10-08 | 06 | tree_service | es_safety | 11 hazards + 7 safety QA + 4 hazard-assessment checklist items pending human translation |
| 2026-10-08 | 06 | tree_service | cost_estimate | All 6 G-TREE-* assemblies platform-baseline estimates (chipping/haul folded into removal rows) |
| 2026-10-08 | 06 | tree_service | vocab | Propose equipment types `wood_chipper`, `stump_grinder` |
| 2026-10-08 | 06 | tree_service | source_doubt | OSHA has no tree-care standard — 1926 refs applied by analogy (marked derived); line-clearance work is 1910.269 (general industry). Purdue FNR-463 used for protection zones (no UW Extension page found) |
| 2026-10-08 | 06 | hauling | es_safety | 12 hazards + 5 safety QA + 5 checklist items pending human translation |
| 2026-10-08 | 06 | hauling | cost_estimate | G-HAUL-RO20-EA / RO30-EA / RENT-DAY / DISP-TON / LOAD-EA platform-baseline estimates — tune with WI hauler quotes + tipping fees; tipping fee carried in equipment_cost (not taxed as material) — confirm convention |
| 2026-10-08 | 06 | hauling | scope | residential_sf allowances (2 × 30 yd pulls, 6 tons disposal) — confirm defaults; ROW dumpster permit sourced from Madison only |
| 2026-10-08 | 06 | hauling | vocab | Propose equipment type `roll_off_truck` |
| 2026-10-08 | 06 | excavation | es_safety | 12 hazards + 3 safety QA (locates_marked, protective_system, spoil_setback) pending human translation |
| 2026-10-08 | 06 | excavation | cost_estimate | B-EXC-BULK-CY + -STRUCT-BACKFILL-CY derived from WisDOT average unit prices (highway — small residential jobs run higher); ROCK/TRENCH/FINE-GRADE/COMPACT-TEST platform estimates; basement allowances (550 CY / 140 CY / 5,000 SF) are constants |
| 2026-10-08 | 06 | excavation | scope | Removed at review: slab rule that priced interior slab excavation with the exterior-flatwork code from summed room area (overstated on multi-story, double-counted the basement dig) |
| 2026-10-08 | 06 | excavation | vocab | Propose equipment types `dozer`, `grader`, `roller`, `trench_box`, `vacuum_excavator` |
| 2026-10-08 | 06 | (engine) | vocab | Fixed in wave: guard now requires code_type 'IRC' on IRC section refs (R/N/M/E/G/P###, A?###) in building-family packs — commercial jobs resolve to IBC and printed "IBC R401.3". 165 refs in 15 packs corrected. |
| 2026-10-08 | 06 | demolition | es_safety | 12 hazards + 5 safety QA + 11 checklist items pending human translation |
| 2026-10-08 | 06 | demolition | cost_estimate | B-DEM-HOUSE-SF, -ACCESS-EA, -UTIL-EA, -BACKFILL-CY platform estimates; B-DEM-FDN-CY derived from WisDOT 204.0185. Removed duplicate B-DEM-DISP-TON at review — use hauling's G-HAUL-DISP-TON |
| 2026-10-08 | 06 | demolition | vocab | No raze-permit inspection type (descriptive checklist keys used); propose equipment `hydraulic_breaker`, `debris_chute`. Pre-demo rodent baiting not sourced for WI |
| 2026-10-08 | 06 | retaining_walls | es_safety | 10 hazards + 3 safety QA (engineered_design, locate_ticket, guard_at_drop) pending human translation |
| 2026-10-08 | 06 | retaining_walls | cost_estimate | B-RTW-SRW-SF, -GEOGRID-SY, -DRAIN-LF, -CAP-LF, -BOULDER-SF, -ENGDESIGN-EA platform estimates; WisDOT modular-block MSE wall price not found (candidate to derive SRW-SF) |
| 2026-10-08 | 06 | retaining_walls | scope | `retaining_wall` plan callout deferred — CJPIA commercial fixture notes mention retaining walls; needs a note-context guard + snapshot update in its own PR before quantity rules |
| 2026-10-08 | 06 | asphalt_paving | es_safety | 11 hazards + 2 safety QA (utilities_marked, traffic_control_set) + 3 checklist items pending human translation |
| 2026-10-08 | 06 | asphalt_paving | cost_estimate | Material on B-ASP-HMA-TON, -MILL-SY, -TACK-SY, -CRACKSEAL-LF, -PATCH-SF derived from WisDOT FY2023–25 average unit prices (labor/equip splits estimated); B-ASP-SEALCOAT-SY estimate; commercial lot defaults (1,500 SY, 4 in HMA) are placeholders |
| 2026-10-08 | 06 | asphalt_paving | scope | concrete_flatwork's residential default (640 SF drive + walk) can double the driveway when an asphalt drive is also on the plans — decide which owns the driveway |
| 2026-10-08 | 06 | asphalt_paving | vocab | Propose equipment types `asphalt_paver`, `roller`, `milling_machine`; OSHA has no asphalt-fume PEL (NIOSH REL used) |
| 2026-10-08 | 06 | erosion_control | es_safety | 10 hazards + 1 safety QA (locates_called) + 1 checklist item pending human translation |
| 2026-10-08 | 06 | erosion_control | cost_estimate | B-ERO-SILT-MAINT-LF, B-ERO-TRACK-PAD-EA, B-ERO-PLAN-EA estimate-only; SILT-FENCE/INLET-PROT/MAT derived from WisDOT highway-volume prices (~$55/hr burdened labor split) |
| 2026-10-08 | 06 | erosion_control | scope | Step refs are WI-specific (SPS 321.125/320.09, NR 216/151.11) and render regardless of project state — needs jurisdiction-aware refs |
| 2026-10-08 | 06 | erosion_control | scope | Quantity rules are scoped const allowances (200 LF fence, 1 pad, 1 inlet, 1 SWPPP); candidate component token `silt_fence` |
| 2026-10-08 | 06 | erosion_control | vocab | Propose equipment type for silt-fence slicing machine |
| 2026-10-08 | 06 | site_utilities | es_safety | 12 hazards + 2 safety QA (locates_verified, protective_system) + 13 inspection-checklist items pending human translation |
| 2026-10-08 | 06 | site_utilities | cost_estimate | All 6 P-SU-* assemblies are platform-baseline estimates; WisDOT has no service-lateral unit prices; P-SU-TAP-ALLOW-EA $2,000 is a placeholder allowance (fees vary by municipality) |
| 2026-10-08 | 06 | site_utilities | source_doubt | IPC 305.4.1/306.2/306.3/312.5/312.6/603.2 not opened on codes.iccsafe.org (403); confirmed via secondary sources |
| 2026-10-08 | 06 | site_utilities | scope | Storm leader per-LF assembly dropped (6-assembly cap); 4 recipes incl. utility_services to match combined template titles |
| 2026-10-08 | 07 | panelized_sips | es_safety | 12 hazards + 3 safety QA (no_unapproved_cuts, lift_plan, thermal_barrier) + 8 inspection checklist items pending human translation |
| 2026-10-08 | 07 | panelized_sips | cost_estimate | B-SIP-WALL-SF, B-SIP-ROOF-SF, B-SIP-TAPE-LF, B-SIP-SILL-LF platform-baseline estimates; SIP pricing varies widely by maker/region |
| 2026-10-08 | 07 | panelized_sips | scope | Wall/roof/tape/sill quantities derived from floor area (0.8/1.15/0.35/0.09 × area_sf_sum) — rough; replace with shop-drawing takeoff |
| 2026-10-08 | 07 | panelized_sips | source_doubt | APA SIP page 404, SIPA free pages thin; steps rest on DOE BASC. IRC R610 cited at section level only; panel_tip hazard cites general 1926.20(b)(1) |
| 2026-10-08 | 07 | truss_setting | es_safety | 12 hazards + 5 safety QA + 5 framing checklist items pending human translation |
| 2026-10-08 | 07 | truss_setting | cost_estimate | B-TRS-TRUSS-EA, B-TRS-SET-EA, B-TRS-BRACE-LF, B-TRS-HANGER-EA platform-baseline estimates; truss price volatile with lumber |
| 2026-10-08 | 07 | truss_setting | scope | B-TRS-TRUSS-EA (30 trusses on an engineered_trusses callout) may double-count with B-FRAME-SF if a tenant's framing rate includes roof framing |
| 2026-10-08 | 07 | truss_setting | source_doubt | UFGS 06 17 53 not retrievable (WBDG AccessDenied); osha.gov fact sheet URLs 403 to scripts, existence confirmed via search |
| 2026-10-08 | 07 | engine | scope | Pack building_types now accepts 'pole_barn' (plan type); task steps match via BuildContext.planBuildingType since the codes engine maps pole_barn → residential_sf |
| 2026-10-08 | 07 | heavy_timber | es_safety | 11 hazards + 3 safety QA (lift_plan_on_site, lifting_hardware_marked, plumb_braced) + 5 framing checklist items pending human translation |
| 2026-10-08 | 07 | heavy_timber | cost_estimate | B-HT-CLT-SF, B-HT-GLULAM-BF, B-HT-CONN-EA, B-HT-PROTECT-SF, B-HT-TIMBERFRAME-SF platform estimates; no public unit-price source for mass timber |
| 2026-10-08 | 07 | heavy_timber | scope | No quantity rules (no blueprint fact basis); propose components clt_panel and glulam_beam so B-HT-* lines can be seeded |
| 2026-10-08 | 07 | heavy_timber | source_doubt | IBC Ch. 33 Type IV-A/B/C construction-fire-safety section not cited (number unverified); WoodWorks example spec read at summary level only |
| 2026-10-08 | 07 | pemb | es_safety | 12 hazards + 4 safety QA (concrete_strength_notice, four_anchor_rods, temp_bracing, frame_bolts_before_release) + inspection checklist items pending human translation |
| 2026-10-08 | 07 | pemb | cost_estimate | B-PEMB-KIT/ERECT/ANCHOR/BLANKET/SSR-ADD platform-baseline only; kit price swings with steel market |
| 2026-10-08 | 07 | pemb | scope | Building seeder adds B-FRAME-SF + B-INSUL-SF from room area; on PEMB jobs these can double-count B-PEMB-KIT/ERECT — consider suppressing when pemb is scheduled. No blanket qty rule (avoids B-INSUL-SF double count) |
| 2026-10-08 | 07 | pemb | source_doubt | IBC 2205/2210/1705.2/1705.3/1901.3/1504.3.2/1507.4 + IECC C402.1 from 2018/2021 numbering, not read on codes.iccsafe.org; no manufacturer erection guide reachable (Nucor/VP 403) |
| 2026-10-08 | 07 | pemb | vocab | Propose equipment type 'panel_seamer' (standing-seam power seamer) |
| 2026-10-08 | 07 | manufactured_modular | es_safety | 12 hazards + 5 safety QA (anchors_listed_installed, gas_tested, electric_crossover_done, smoke_alarms, lift_plan) + inspection checklist items pending human translation |
| 2026-10-08 | 07 | manufactured_modular | cost_estimate | B-MOD-CRANE-SET-EA, B-MOD-STITCH-LF, B-MOD-PIER-EA, B-MOD-ANCHOR-EA, B-MOD-SKIRT-LF platform-baseline estimates (crane ~$4,000 per 3 modules) |
| 2026-10-08 | 07 | manufactured_modular | scope | Quantity rules default to a HUD multi-section home (piers, anchors, 56 LF stitch); crane-set rule removed at review since no fact tells HUD from modular — needs a home-type fact |
| 2026-10-08 | 07 | manufactured_modular | scope | HUD install gates mapped onto building sequence (piers→footing, anchors→foundation, mate line→framing, crossovers→final) — confirm with a WI inspector |
| 2026-10-08 | 07 | manufactured_modular | source_doubt | WI SPS 321.40 adopts 24 CFR 3285 as of 2014-12-01; pack cites current eCFR text. gas_leak hazard cites general 1926.151(a) |
| 2026-10-08 | 07 | manufactured_modular | vocab | Propose equipment type for manufactured-home positioning machine (toter/mule); skid_steer used as stand-in |
| 2026-10-08 | 07 | house_moving | es_safety | 12 hazards + 6 safety QA items pending human translation |
| 2026-10-08 | 07 | house_moving | cost_estimate | All 5 B-HMV-* assemblies are platform estimates (RAISE-SF, CRIB-EA, RELOC-MOB-EA, ROUTE-EA allowance, UTIL-EA) |
| 2026-10-08 | 07 | house_moving | source_doubt | FEMA P-312 cited from LA County mirror (fema.gov 403s scripts); IEBC 1402.x confirmed via CA Existing Building Code mirror; IRC R322.1.6/.1.10/.2.1/.2.2 numbering from 2021 IRC — verify on codes.iccsafe.org |
| 2026-10-08 | 07 | house_moving | scope | B-HMV-RAISE-SF uses area_sf_sum — overcounts on two-story plans (room area > footprint) |
| 2026-10-08 | 07 | house_moving | vocab | Propose equipment types unified_jacking_system, dolly_wheel_set, truck_tractor |
| 2026-10-08 | 07 | post_frame | es_safety | 12 hazards + 3 safety QA (bracing_complete, holes_covered, utilities_located) + inspection checklist items pending human translation |
| 2026-10-08 | 07 | post_frame | cost_estimate | B-PF-COLUMN-EA, B-PF-FOOTING-EA, B-PF-SECFRAME-SF platform estimates; column/footing count = 1 per 100 SF plan area heuristic, not the column schedule |
| 2026-10-08 | 07 | post_frame | scope | Hand seeder B-FRAME-SF also fires on area for pole_barn plans → possible double count with B-PF-SECFRAME-SF; consider suppressing B-FRAME-SF when building_type=pole_barn |
| 2026-10-08 | 07 | post_frame | scope | WI Stat. 101.01(11) excludes farming from "place of employment" → true farm post-frame buildings fall outside the state commercial code; local zoning/permits still apply. DSPS FAQ (404) not encoded |
| 2026-10-08 | 07 | post_frame | source_doubt | IBC 2306.1 → ASABE EP 484/486/559 confirmed via NFBA guide spec, not ICC text; column_tipover cites general 1926.20(b)(1) |
| 2026-10-08 | 07 | post_frame | vocab | Propose equipment type earth_auger; skid_steer used for now |
| 2026-10-08 | 07 | docks_marine_residential | es_safety | 10 hazards + 4 safety QA + 5 inspection checklist items pending human translation |
| 2026-10-08 | 07 | docks_marine_residential | cost_estimate | G-DOCK-SECT-LF, G-DOCK-LIFT-SET-EA, G-DOCK-SVC-INOUT-EA estimate-only; G-DOCK-RIPRAP-CY / G-DOCK-FILTER-SY material+equipment derived from WisDOT highway unit prices (residential access likely costs more) |
| 2026-10-08 | 07 | docks_marine_residential | source_doubt | No ch. NR 326 in the current NR index; pack cites Wis. Stat. 30.12(1g) + NR 320 per 2026 DNR checklists (Pier Planner says NR 320.08, FAQ says 320.09). USACE St. Paul page 403; only 33 CFR 322 cited |
| 2026-10-08 | 07 | docks_marine_residential | scope | No quantity rules — blueprint facts carry no shoreline/pier/lift data |
| 2026-10-08 | 07 | docks_marine_residential | vocab | Propose equipment type work_barge / work_boat |
| 2026-10-08 | 08 | masonry | es_safety | 12 hazards + 1 safety QA (wall_braced) + 10 inspection checklist items pending human translation |
| 2026-10-08 | 08 | masonry | cost_estimate | B-MAS-STONE-ADH-SF, B-MAS-FLASH-WEEP-LF, B-MAS-LINTEL-EA, B-MAS-COLD-WX-SF, B-MAS-CLEAN-SF platform-baseline estimates (lintel steel volatile) |
| 2026-10-08 | 08 | masonry | scope | Lintel qty = one per window on any masonry_veneer callout — overcounts when veneer covers only part of the elevations |
| 2026-10-08 | 08 | masonry | scope | Pack code refs never surface: hand-recipe steps gate no inspection — consider gating "Lay masonry units" on framing and the veneer step on sheathing (would change snapshots) |
| 2026-10-08 | 08 | masonry | source_doubt | NCMA TEK URLs now redirect to cmha.org home — TEK notes not cited |
| 2026-10-08 | 08 | masonry | vocab | Propose equipment types mast_climber, mortar_mixer, masonry_saw |
| 2026-10-08 | 08 | rebar | es_safety | 12 hazards + 2 safety QA (caps_installed, verticals_braced) + 8 inspection checklist items pending human translation |
| 2026-10-08 | 08 | rebar | cost_estimate | B-RBR-ANCHOR-EA, B-RBR-DOWEL-EA, B-RBR-SLAB-GRID-SF, B-RBR-EPOXY-DOWEL-EA platform-baseline estimates; B-REBAR-LF now seeded at 352 LF on residential footing callouts |
| 2026-10-08 | 08 | rebar | source_doubt | IRC R403.1.3/R404.1.3/R506.2.4 + ACI 318-19 20.5.1.3/25.5/26.6.2 numbering not fetched (ICC 403) — confirm. UFGS 03 20 00 archived; WI DFD 03 20 00 master spec used |
| 2026-10-08 | 08 | rebar | scope | Rebar template task now gets pack steps (was the generic foundation branch). B-RBR-DOWEL-EA assumes dowels ~4 ft o.c. — prescriptive IRC walls often have none |
| 2026-10-08 | 08 | shotcrete | es_safety | 11 hazards + 1 safety QA (pool_bonding_signed) + 7 inspection checklist items pending human translation |
| 2026-10-08 | 08 | shotcrete | cost_estimate | B-SHOT-WET-CY, B-SHOT-DRY-CY, B-SHOT-FINISH-SF, B-SHOT-PANEL-EA, B-SHOT-CORE-EA platform-baseline estimates; only test panels are seeded (no blueprint fact for volume/area) |
| 2026-10-08 | 08 | shotcrete | source_doubt | shotcrete.org 403 to scripts — ASA position statements not cited; IBC Ch.19 shotcrete section unverified, only IBC 1705.3 cited |
| 2026-10-08 | 08 | shotcrete | scope | Pool pre-gunite bonding check is electrical (NEC 680.26) — no building gate fits; pool_shell recipe ungated. Cross-reference with pools_spas (wave 17) |
| 2026-10-08 | 08 | concrete_pumping | es_safety | 12 hazards + 11 safety QA + safety checklist items pending human translation |
| 2026-10-08 | 08 | concrete_pumping | cost_estimate | G-PUMP-SETUP-EA, G-PUMP-CY, G-PUMP-LINE-LF, G-PUMP-WASHOUT-EA platform estimates; setup+per-CY is an alternative to the EQUIP-CONCRETE_PUMP day rate — double-count risk when "include equipment" is used |
| 2026-10-08 | 08 | concrete_pumping | source_doubt | concretepumpers.com serves an incomplete TLS chain (curl exit 60) — pack:verify-sources may flag 11 ACPA URLs. Power lines: OSHA 1926.600(a)(6) 10 ft vs ACPA 20/50 ft + spotter (1926.1400(c)(1) excludes pumps from Subpart CC) |
| 2026-10-08 | 08 | concrete_pumping | vocab | Consider splitting concrete_pump into boom_pump / line_pump |
| 2026-10-08 | 08 | post_tensioning | es_safety | 12 hazards + 3 safety QA (shores_after_stress, pt_warning_posted, scan_before_cut) pending human translation |
| 2026-10-08 | 08 | post_tensioning | cost_estimate | B-PT-SOG-SF, B-PT-ELEV-SF, B-PT-STRESS-EA, B-PT-POCKET-EA, B-PT-SCAN-EA platform-baseline estimates; SOG area = room-area total, tendons ≈1 per 83 SF |
| 2026-10-08 | 08 | post_tensioning | scope | Elevated PT pre-pour gated as 'framing' (no special-inspection type); real hold point is IBC 1705.3 special inspection |
| 2026-10-08 | 08 | post_tensioning | source_doubt | ACI 318 25.9 numbering + UFGS 03 23 00 used in place of an unconfirmed 03 38 00; live_tendon_cut cites general 1926.20(b)(1). Sources say consolidate behind anchors (trade note said don't vibrate near anchors) |
| 2026-10-08 | 08 | post_tensioning | vocab | Candidate blueprint component 'post_tensioned_slab' |
| 2026-10-08 | 08 | concrete_cutting | es_safety | 12 hazards + 7 safety QA + 9 safety checklist items pending human translation |
| 2026-10-08 | 08 | concrete_cutting | cost_estimate | G-CUT-CORE-SM-EA, G-CUT-CORE-LG-EA, G-CUT-FLATSAW-LF, G-CUT-WALLSAW-LF, G-CUT-GPR-EA platform-baseline estimates; no quantity rules (no penetration/opening facts) |
| 2026-10-08 | 08 | concrete_cutting | source_doubt | CSDA library 403 to scripts — BP-007/BP-026 cited by title only. Wall/wire saws are not 1926.1153 Table 1 entries; walk-behind (iv) controls applied as conservative default. WisDOT/WDNR slurry sheet (highway) applied by analogy |
| 2026-10-08 | 08 | concrete_cutting | vocab | Propose equipment types core_rig, wall_saw, hydraulic_power_unit, gpr_scanner |
| 2026-10-08 | 08 | concrete_polishing | es_safety | 11 hazards + 3 safety QA (residue_removed, silica_controls, chemical_ppe) pending human translation |
| 2026-10-08 | 08 | concrete_polishing | cost_estimate | G-POL-GRIND-SEAL-SF, G-POL-MECH-L2-SF, G-POL-MECH-L3-SF, G-POL-STAIN-SF, G-POL-JOINTFILL-LF platform estimates; area shares (60% industrial / 40% commercial / 20% residential, 0.08 LF/SF joints) are guesses |
| 2026-10-08 | 08 | concrete_polishing | source_doubt | cpaa.org now an unrelated site — CPAA DEF-PC-100 cited via trade-press mirror (check ASCC Concrete Polishing Council). No UFGS polishing section; APS 03 35 43 owner spec + UFGS 03 30 00 used |
| 2026-10-08 | 08 | concrete_polishing | vocab | Propose equipment type floor_grinder (planetary grinder) |
| 2026-10-08 | 08 | formwork | es_safety | 12 hazards + 5 safety QA (drawings_on_site, bracing_plumb, pour_watch, shoring_inspected, strip_strength) + inspection checklist items pending human translation |
| 2026-10-08 | 08 | formwork | cost_estimate | B-FORM-WALL-SFCA, B-FORM-FTG-LF, B-FORM-ICF-SF, B-FORM-BUCK-EA, B-FORM-SHORE-SF platform estimates; B-FORM-FTG-LF may double-count if a tenant prices B-FOOTING (which likely includes forming) |
| 2026-10-08 | 08 | formwork | source_doubt | ICF wall section cited as IRC R608 (2012+ numbering; brief said R611 = 2009) — confirm. UFGS 03 11 13 superseded into 03 30 00 §3.3; DOE BASC ICF guide not found |
| 2026-10-08 | 08 | formwork | scope | Elevated-slab shoring has no building-sequence gate; shoring_reshore recipe ungated |
| 2026-10-08 | 08 | formwork | vocab | Propose equipment type concrete_vibrator and component token icf_wall |
| 2026-10-08 | 09 | stucco_eifs | es_safety | 12 hazards + 1 safety QA + 9 inspection checklist items pending human translation |
| 2026-10-08 | 09 | stucco_eifs | cost_estimate | B-STU-WRB2-SF, B-STU-WEEP-LF, B-STU-CJ-LF, B-STU-DRAINMAT-SF, B-STU-EIFS-SF, B-STU-RECOAT-SF platform-baseline estimates |
| 2026-10-08 | 09 | stucco_eifs | source_doubt | IRC R703.7.2.1/R703.7.3/R703.9.2 + IBC 110.3.5/2510.6/2512.1.2/1407 numbering not text-verified on the ICC site — confirm against adopted edition |
| 2026-10-08 | 09 | stucco_eifs | scope | stucco_finish component matches both stucco and EIFS → EIFS/drain-mat lines not auto-seeded; consider an `eifs` token. Siding + stucco on one project can seed both B-SID-WRB-SF and B-STU-WRB2-SF |
| 2026-10-08 | 09 | stucco_eifs | vocab | Propose equipment types scaffold, plaster_pump |
| 2026-10-08 | 09 | spray_foam | es_safety | 12 hazards + 6 safety QA + 7 inspection checklist items pending human translation |
| 2026-10-08 | 09 | spray_foam | cost_estimate | B-SPF-CC-BF, B-SPF-OC-SF, B-SPF-IGN-COAT-SF, B-SPF-PREP-EA platform estimates; no quantity rules by design (avoids double count with hand-seeded B-INSUL-SF and B-INS-RIM-LF) |
| 2026-10-08 | 09 | spray_foam | source_doubt | IRC R316.5.3/.5.4/.5.11 + IBC 2603.4.1.6 numbering from 2021 editions — verify; epa.gov SPF page + DOE BASC SPF guides 404 (EPA cited via archive.epa.gov) |
| 2026-10-08 | 09 | spray_foam | vocab | Propose equipment type spray_foam_rig |
| 2026-10-08 | 09 | metal_panels | es_safety | 12 hazards + 1 safety QA (nfpa285_listed) + 6 inspection checklist items pending human translation |
| 2026-10-08 | 09 | metal_panels | cost_estimate | B-MP-ACM-RS-SF, B-MP-IMP-WALL-SF, B-MP-STEEL-EXP-SF, B-MP-SUBFRAME-SF, B-MP-TRIM-LF platform estimates |
| 2026-10-08 | 09 | metal_panels | source_doubt | IBC 1402.2/1402.5/1404.4/2603.5 cited from 2021 numbering — confirm vs adopted edition |
| 2026-10-08 | 09 | metal_panels | scope | Only 1 quantity rule (trim per window on metal_siding callout) — no wall-SF fact; metal_siding already seeds generic B-SIDING-SF, which may underprice architectural panels |
| 2026-10-08 | 09 | metal_panels | vocab | Propose vacuum_lifter equipment type (IMP) |
| 2026-10-08 | 09 | caulking_sealants | es_safety | 11 hazards + 1 safety QA (old_sealant_tested) pending human translation |
| 2026-10-08 | 09 | caulking_sealants | cost_estimate | G-SEAL-EXT-PERIM-LF, G-SEAL-JOINT-WIDE-LF, G-SEAL-REMOVE-LF, G-SEAL-ADHTEST-EA platform estimates; perimeter rule (windows × 16 LF, doors × 5 LF fallback) scoped to commercial/MF/industrial to avoid double count with B-WIN-FLASH-EA |
| 2026-10-08 | 09 | caulking_sealants | scope | Two quantity rules on one code act as first-match fallback (seedFromPacks emits a code once) — door perimeter LF only seeds when no windows are scheduled. Same pattern in gutters, gas_piping, patio_covers_awnings, shotcrete |
| 2026-10-08 | 09 | caulking_sealants | vocab | Propose swing_stage / suspended scaffold equipment type |
| 2026-10-08 | 09 | skylights | es_safety | 12 hazards + 6 safety QA (opening_guarded, cover_marked_secured, screens_installed, glazing_type, reflective_scrap_cleared, smoke_vent_test) + inspection checklist items pending human translation |
| 2026-10-08 | 09 | skylights | cost_estimate | B-SKY-DECK/CURB/TDD/SHAFT/UNIT-COMM/SCREEN-EA platform estimates; no quantity rules (no skylight component token yet — propose one) |
| 2026-10-08 | 09 | skylights | source_doubt | NIOSH Alert 2004-156 withdrawn Aug 2025 (archived copy for case pattern only); IRC R308.6.8/R802.9 + IECC C402.4 numbering — confirm per adopted edition |
| 2026-10-08 | 09 | air_barrier | es_safety | 12 hazards + 2 safety QA (spray_zone_safe, tie_off_lifts) + 7 inspection checklist items pending human translation |
| 2026-10-08 | 09 | air_barrier | cost_estimate | B-AB-FLUID-SF, B-AB-SA-SF, B-AB-TRANS-LF, B-AB-MOCKUP-EA, B-AB-BLDG-TEST-EA, B-AB-VR-POLY-SF platform estimates; mock-up + whole-building test auto-seed once on commercial/industrial jobs (building test fee varies with size) |
| 2026-10-08 | 09 | air_barrier | source_doubt | IECC C402.5/.5.1/.5.1.1 + R402.4.1.1/.2 in 2021 numbering (2024 IECC renumbers) — confirm vs adopted edition |
| 2026-10-08 | 09 | air_barrier | vocab | Propose equipment type airless_sprayer |
| 2026-10-08 | 09 | sheet_metal_flashing | es_safety | 12 hazards + 1 safety QA (edge_es1_tested) pending human translation |
| 2026-10-08 | 09 | sheet_metal_flashing | cost_estimate | B-SMF-COPING-LF, B-SMF-EDGE-LF, B-SMF-CTRFLASH-LF, B-SMF-SCUPPER-EA, B-SMF-PF-TRIM-LF platform estimates; post-frame trim 0.23 LF/SF (pole_barn), 2 scuppers (commercial/industrial) |
| 2026-10-08 | 09 | sheet_metal_flashing | scope | Roofing pack B-RF-DRIP-EDGE-LF rule is unscoped → seeds shingle drip edge on commercial low-slope jobs where B-SMF-EDGE-LF belongs; scoping it needs estimates.building_type set (null today on many estimates) |
| 2026-10-08 | 09 | sheet_metal_flashing | source_doubt | IBC crickets/saddles section varies by edition (1503.5 vs 1503.6) — omitted; UFGS 07 62 00 not confirmed, 07 60 00 used |
| 2026-10-08 | 09 | waterproofing | es_safety | 12 hazards + 2 safety QA (trench_protected, vapor_ventilated) pending human translation |
| 2026-10-08 | 09 | waterproofing | cost_estimate | B-WP-DAMP-SF, B-WP-MEMB-SF, B-WP-DRAINBRD-SF, B-WP-DRAINTILE-LF, B-WP-SUMP-EA, B-WP-VR-SF platform estimates |
| 2026-10-08 | 09 | waterproofing | scope | All 4 template waterproofing tasks now get pack steps (were the generic foundation branch). foundation_wall token doesn't separate basement from frost walls → dampproofing/drain tile/sump may over-seed slab-on-grade houses |
| 2026-10-08 | 09 | waterproofing | source_doubt | MiraDRI TDS hosted by a distributor (maker pages redirect/404); UFGS 07 10 00 doesn't exist — specific 07 11 13/07 13 53/07 14 00/33 46 16 used |
| 2026-10-08 | 10 | doors_hardware | es_safety | 10 hazards + 2 safety QA (fire_door_labels, egress_free) + fire_door_inspection checklist items pending human translation |
| 2026-10-08 | 10 | doors_hardware | cost_estimate | G-DHW-HM-FRAME-EA, G-DHW-FIRE-ASSY-EA, G-DHW-CLOSER-EA, G-DHW-EXIT-DEVICE-EA, G-DHW-LEVER-RETRO-EA platform estimates; closers 50% / exit devices 10% of scheduled doors (commercial/industrial) — heuristic |
| 2026-10-08 | 10 | doors_hardware | scope | B-DOOR-INT prices a wood slab + jamb; commercial hollow-metal openings underpriced — consider a commercial door-unit row. Industrial template task also bundles restroom accessories (specialties/toilet_partitions packs) |
| 2026-10-08 | 10 | glazing | es_safety | 12 hazards + 7 safety QA pending human translation |
| 2026-10-08 | 10 | glazing | cost_estimate | B-GLZ-SHWR-FRMLS-EA, B-GLZ-MIRROR-SF, B-GLZ-IGU-REPL-EA, B-GLZ-PART-SF, B-GLZ-RAIL-LF platform estimates; qty rules are fixed residential guesses (1 frameless shower, 30 SF mirror) — no shower/lavatory fixture token |
| 2026-10-08 | 10 | glazing | source_doubt | IRC R308.4.4/R308.4.5 + IBC 2406.4.5 subsection numbers from 2018/2021 — confirm; GANA manual paid (NGA bulletins paraphrased, derived) |
| 2026-10-08 | 10 | glazing | vocab | Propose equipment type vacuum_lifter (also asked for by metal_panels) |
| 2026-10-08 | 10 | curtain_wall | es_safety | 12 hazards + 4 safety QA (anchors_locked, setting_blocks_bite, ssg_adhesion, safety_glazing_mark) + 7 inspection checklist items pending human translation |
| 2026-10-08 | 10 | curtain_wall | cost_estimate | B-CW-STOREFRONT/STICK/UNITIZED-SF, B-CW-ENTR-PAIR-EA, B-CW-WATERTEST-EA platform estimates; auto-seeds 2 water tests + 1 entrance pair on commercial — entrance pair may overlap B-DOOR-EXT from the door count |
| 2026-10-08 | 10 | curtain_wall | source_doubt | IBC 1404.4/1402.2/1709.5 + IECC C402.5 (renumbered 2024) — verify; UFGS 08 44 13 unpublished (08 44 00 used); fgiaonline.org 403, AAMA 501.2 named via UFGS only |
| 2026-10-08 | 10 | curtain_wall | vocab | Building family has no envelope/air-barrier inspection type — envelope tie-in + water test gated on `sheathing`; consider an `envelope` inspection type |
| 2026-10-08 | 10 | window_treatments | es_safety | 11 hazards + 5 safety QA + 3 child_cord_safety checklist items pending human translation |
| 2026-10-08 | 10 | window_treatments | cost_estimate | G-WT-BLIND-EA, G-WT-ROLLER-EA, G-WT-MOTOR-EA, G-WT-DRAPE-TRACK-LF platform estimates; one blind (residential) / roller shade (commercial) per scheduled window |
| 2026-10-08 | 10 | window_treatments | scope | Hand recipe in nopermit.ts shares the finish_carpentry case (miters, finish nailer, "doors latch") — a pack recipe with supersedes_hand would fit better; needs snapshot update |
| 2026-10-08 | 10 | window_treatments | source_doubt | cpsc.gov/wcmanet.com/windowcoverings.org 403 to scripts (confirmed via search + 16 CFR 1260.5 IBR listing); Hunter Douglas Duette guides are 2009 corded-product docs, cited for brackets/anchors only |
| 2026-10-08 | 10 | overhead_doors | es_safety | 13 hazards + 9 safety QA + 6 final checklist items pending human translation |
| 2026-10-08 | 10 | overhead_doors | cost_estimate | B-OHD-RES-16X7-EA, B-OHD-OPENER-EA, B-OHD-COMM-SECT-EA, B-OHD-ROLL-EA, B-OHD-COMM-OPER-EA, B-OHD-SLIDE-EA platform estimates; auto-seeds 1 door + opener (residential), 1 slider pair (pole barn), 2 sectional + 2 operators (industrial) |
| 2026-10-08 | 10 | overhead_doors | source_doubt | IBC 1709.5.2 + IRC R309.4 not ICC-verified; spring hazard cites general 1926.20(b)(1); no mfr install manual reachable (Clopay/LiftMaster 404, Wayne Dalton 403) |
| 2026-10-08 | 10 | overhead_doors | scope | Both template overhead-door tasks now get pack steps (pole-barn slider recipe via planBuildingType). Dock levelers left to loading_dock_equipment |
| 2026-10-08 | 10 | firestopping | es_safety | 10 hazards + 3 safety QA + 6 inspection checklist items pending human translation |
| 2026-10-08 | 10 | firestopping | cost_estimate | B-FS-PIPE-SM/LG-EA, B-FS-CABLE-EA, B-FS-HOW-LF, B-FS-PERIM-LF, B-FS-LABEL-EA platform estimates; quantity rules are per-SF density guesses (MF/commercial/industrial) — replace with survey counts |
| 2026-10-08 | 10 | firestopping | vocab | No above-ceiling / pre-cover inspection type — gated on `insulation` (last pre-concealment inspection); consider adding one |
| 2026-10-08 | 10 | firestopping | source_doubt | IBC 1705.18 + 715 checked against 2021 (2024 renames 715 "Joints and Voids") — confirm vs adopted edition |
| 2026-10-08 | 10 | fireproofing | es_safety | 12 hazards + 3 safety QA (thickness_tolerance, special_inspection_pass, existing_tested) + 6 inspection checklist items pending human translation |
| 2026-10-08 | 10 | fireproofing | cost_estimate | B-FP-SFRM-1HR/2HR-SF, B-FP-INTUM-SF, B-FP-PATCH-SF, B-FP-TEST-EA platform estimates; SFRM = 0.5 SF steel per SF floor (rough until a steel takeoff) |
| 2026-10-08 | 10 | fireproofing | source_doubt | IBC special inspection numbering differs by edition (2021: 1705.15 SFRM / 1705.16 intumescent; 2018: 1705.14/.15; 2024 unchecked); awci.org 403, TM 12-A/B cited via ICC store page |
| 2026-10-08 | 10 | fireproofing | vocab | Same pre-cover inspection gap as firestopping — `framing` used as proxy gate |
| 2026-10-08 | 10 | gate_operators | es_safety | 12 hazards + 11 safety QA + 10 inspection checklist items pending human translation |
| 2026-10-08 | 10 | gate_operators | cost_estimate | E-GATE-OP-SLIDE/OP-SWING/BARRIER-ARM/LOOP/ENTRAP/TRENCH-LF platform estimates; fixed counts per building type (no gate blueprint component — propose `vehicular_gate`) |
| 2026-10-08 | 10 | gate_operators | source_doubt | IFC 503.6 / D103.5 not confirmed on ICC; NEC 725 cited at article level (2023 moved Class 1 to Art. 724); no maker-hosted LiftMaster manual; CPSC page 403 |
| 2026-10-08 | 10 | engine | scope | Pack equipment `when.title_re` matches task title + step title together, so a task-title match puts the equipment on every step (trencher on all gate steps) — consider a step-only matcher |
| 2026-10-08 | 11 | structural_steel | es_safety | 12 hazards + 5 safety QA + 6 inspection checklist items pending human translation |
| 2026-10-08 | 11 | structural_steel | cost_estimate | All 6 B-STL-* assemblies platform estimates (fab $4,000/ton, erect 10 hr/ton + $250 equip/ton); qty uses conceptual 9 lb/SF + 1 column per 900 SF on commercial/industrial — replace with take-off. Hand B-FRAME-SF may also seed on the same estimate |
| 2026-10-08 | 11 | structural_steel | source_doubt | AISC 303-22 download behind Cloudflare (403 to scripts); IBC 2204 "Connections" number from memory — confirm vs adopted edition |
| 2026-10-08 | 11 | structural_steel | scope | All 3 template steel tasks now get pack steps (were the generic framing branch) |
| 2026-10-08 | 11 | precast_erection | es_safety | 12 hazards + 5 safety QA + 6 inspection checklist items pending human translation |
| 2026-10-08 | 11 | precast_erection | cost_estimate | B-PCE-WALL-SF, B-PCE-HOLLOWCORE-SF, B-PCE-KEYWAY-LF, B-PCE-BRACE-EA, B-PCE-WELD-EA platform estimates |
| 2026-10-08 | 11 | precast_erection | scope | Hollowcore + keyway quantity rules removed at review: total floor area includes slab-on-grade levels (one-story building has no plank) — needs an elevated-floor-area fact |
| 2026-10-08 | 11 | precast_erection | source_doubt | UFGS 03 41 13 (hollowcore) has no PDF; steps from UFGS 03 41 33 |
| 2026-10-08 | 11 | precast_erection | vocab | No gate for tilt-up panel pre-pour rebar/insert special inspection; casting steps ungated |
| 2026-10-08 | 11 | metal_decking | es_safety | 12 hazards + 4 safety QA (bundles_landed_supported, secured_end_of_shift, openings_covered, perimeter_cables) + 4 framing checklist items pending human translation |
| 2026-10-08 | 11 | metal_decking | cost_estimate | B-MDK-ROOF-SF, B-MDK-FLOOR-SF, B-MDK-STUD-EA, B-MDK-POURSTOP-LF, B-MDK-OPENING-EA platform estimates |
| 2026-10-08 | 11 | metal_decking | scope | Quantity rules assume story counts (industrial 1, commercial 2) that blueprint facts don't carry; studs ≈1 per 4 SF floor deck. A `stories` fact would fix deck, precast and steel quantities together |
| 2026-10-08 | 11 | metal_decking | source_doubt | IBC 1705.2.2 + 2210 from 2018/2021 knowledge — verify; sdi.org 403 (QA/QC, C, RD, MOC may be free — could upgrade license) |
| 2026-10-08 | 11 | metal_decking | vocab | Propose equipment type stud_welder |
| 2026-10-08 | 11 | shoring_underpinning | es_safety | 12 hazards + 8 safety QA + inspection checklist items pending human translation |
| 2026-10-08 | 11 | shoring_underpinning | cost_estimate | B-SHO-SPL-SF derived from WisDOT 511.1200 FY23/24 (~$36.6/SF; FY25 $99.19 excluded as outlier); B-SHO-SNAIL-SF, B-SHO-TIEBACK-EA, B-SHO-TBOX-DAY, B-SHO-UNDERPIN-EA estimates. No quantity rules (scope comes from geotech report / neighbors) |
| 2026-10-08 | 11 | shoring_underpinning | source_doubt | UFGS 31 50 00 not cited (JS page, PDF 403) |
| 2026-10-08 | 11 | shoring_underpinning | vocab | Hold points as descriptive checklist keys; consider a 'special_inspection' hold-point type (also asked by curtain wall, firestopping, fireproofing, precast) |
| 2026-10-08 | 11 | welding | es_safety | 12 hazards + 2 safety QA (hot_work_permit, fire_watch_kept) + 4 framing checklist items pending human translation |
| 2026-10-08 | 11 | welding | cost_estimate | B-WLD-FILLET-LF, B-WLD-CJP-LF, B-WLD-RIG-HR, B-WLD-UT-EA, B-WLD-FIREWATCH-HR platform estimates; fillet allowance room area × 0.02 LF is a crude placeholder |
| 2026-10-08 | 11 | welding | source_doubt | UFGS 05 05 23 AccessDenied — welding QA sourced from UFGS 05 12 00 (structural_steel source id); IBC 2204.1 + 1705.2.1 assumed stable 2018–2024 |
| 2026-10-08 | 11 | misc_metals | es_safety | 12 hazards + 6 safety QA + 9 inspection checklist items pending human translation |
| 2026-10-08 | 11 | misc_metals | cost_estimate | B-MISC-PAN-STAIR-FLT, B-MISC-PIPE-RAIL-LF, B-MISC-BOLLARD-EA, B-MISC-FIXED-LADDER-EA, B-MISC-EMBED-EA platform estimates; placeholder constants (2 stair flights, 60 LF rail, 4 bollards) by building type |
| 2026-10-08 | 11 | misc_metals | source_doubt | IBC 1607.9 is 2021 numbering (1607.8 in 2018); fixed ladder IBC section not cited; UFGS 05 52 13 403 → 05 52 00 used |
| 2026-10-08 | 11 | misc_metals | vocab | earth_auger again proposed (bollard holes) |
| 2026-10-08 | 11 | metal_stud_framing | es_safety | 12 hazards + 2 safety QA (rated_track_listing, grab_bar_backing) + 2 framing checklist items pending human translation |
| 2026-10-08 | 11 | metal_stud_framing | cost_estimate | B-MSF-PART-SF, B-MSF-EXT-SF, B-MSF-DEFTRK-LF, B-MSF-BACKING-EA, B-MSF-CEIL-SF platform estimates; multipliers (1.0 SF partition/SF floor, 0.1 LF deflection track/SF, 15% framed ceiling, 1.5 backings/room) unvalidated |
| 2026-10-08 | 11 | engine | scope | CROSS-CUTTING: hand seeder adds wood B-FRAME-SF on floor area for every building estimate — double-counts with pemb, post_frame, structural_steel and metal_stud_framing packs. Consider suppressing B-FRAME-SF when those trades are scheduled or by building type (changes existing estimates — owner call) |
| 2026-10-08 | 11 | metal_stud_framing | source_doubt | SFIA /technical-notes 404 (Technical Product Guide used); UFGS 09 22 16 403 (09 22 00 used); CFSEI not cited |
| 2026-10-08 | 11 | deep_foundations | es_safety | 12 hazards + 1 safety QA (shaft_covered) pending human translation |
| 2026-10-08 | 11 | deep_foundations | cost_estimate | B-DF-HPILE-LF / SHAFT24-LF / SHAFT36-LF splits derived from WisDOT bid averages (include markup; material estimated); B-DF-HELICAL-EA, B-DF-LOADTEST-EA ($15k), B-DF-MOBIL-EA ($15k) estimates — load test + mobilization auto-seed on commercial/industrial |
| 2026-10-08 | 11 | deep_foundations | source_doubt | IBC 1803.5.5/1705.7–.9/1810.x confirmed on IBC 2015 TOC only; excavation-wisdot-aup reused for piling items (its note lists excavation only) |
| 2026-10-08 | 11 | deep_foundations | vocab | Propose equipment types pile_driver, drill_rig |
| 2026-10-08 | 12 | lightning_protection | es_safety | 12 hazards + 1 safety QA (common_ground_bonded) + inspection checklist items pending human translation |
| 2026-10-08 | 12 | lightning_protection | cost_estimate | G-LPS-AIR-TERM-EA, G-LPS-COND-LF, G-LPS-GROUND-ROD-EA, G-LPS-BOND-EA, G-LPS-CERT-EA platform estimates; 4 ground rods + 1 certification placeholder (commercial/industrial/MF) |
| 2026-10-08 | 12 | lightning_protection | source_doubt | No stable UL Master Label program URL (ul.com 404) — UL 96A page cited |
| 2026-10-08 | 12 | lightning_protection | scope | Candidate component detector for AIR TERMINAL / LIGHTNING PROTECTION roof-plan callouts |
| 2026-10-08 | 12 | fire_alarm | es_safety | 12 hazards + 10 safety QA + 12 inspection checklist items pending human translation |
| 2026-10-08 | 12 | fire_alarm | cost_estimate | E-FA-FACP-ADDR, E-FA-MON-MODULE, E-FA-EXIT-EMERG, E-FA-ACCEPT-TEST platform estimates; E-FA-DEVICE seeded rooms × 2 (commercial/industrial) |
| 2026-10-08 | 12 | fire_alarm | source_doubt | UFGS 28 31 00 retired 2020 → 28 31 70 used; IBC 907.1.2/907.6.6/1013.6.3 + IFC 901.5 from 2021 editions not text-checked; NFPA 72 cited by chapter |
| 2026-10-08 | 12 | fire_alarm | scope | All 3 template fire-alarm tasks now get pack steps (were generic electrical rough-in). E-FA-EXIT-EMERG is often the electrician's scope |
| 2026-10-08 | 12 | security_access | es_safety | 12 hazards + 7 safety QA pending human translation |
| 2026-10-08 | 12 | security_access | cost_estimate | E-SEC-DOOR, E-SEC-CONTROLLER, E-SEC-INTRUSION-PANEL, E-SEC-SENSOR, E-SEC-NVR platform estimates; commercial/industrial: 1 controller + 1 NVR, doors ≈15% of scheduled doors, cameras ≈1 per 5,000 SF; single-family: panel + 8 sensors |
| 2026-10-08 | 12 | security_access | source_doubt | IBC 1010.2 cited at parent level (subsections differ 2021 vs 2024); UFGS 28 10 00/28 20 00 not on WBDG → 28 10 05 + 28 08 10 used |
| 2026-10-08 | 12 | security_access | scope | Electrified locksets/maglocks/power-transfer hinges split vs doors_hardware — E-SEC-DOOR includes electric strike only |
| 2026-10-08 | 12 | generators | es_safety | 12 hazards + 8 safety QA + inspection checklist items pending human translation |
| 2026-10-08 | 12 | generators | cost_estimate | E-GEN-ATS-200-EA, E-GEN-PAD-EA, E-GEN-INLET-EA, E-GEN-COMM-STBY-EA (≈100 kW allowance $60k), E-GEN-LOADBANK-EA platform estimates; fixed counts by building type (propose a standby_generator component) |
| 2026-10-08 | 12 | generators | source_doubt | NEC 445/700/701/702 sections chosen as stable 2017–2023 — verify vs adopted edition; NFPA 110 Ch. 7 confirm |
| 2026-10-08 | 12 | generators | vocab | Propose equipment type load_bank |
| 2026-10-08 | 12 | solar_pv | es_safety | 11 hazards + 8 safety QA + 12 inspection checklist items pending human translation |
| 2026-10-08 | 12 | solar_pv | cost_estimate | E-PV-INV-STRING, E-PV-MICROINV, E-PV-RSD, E-PV-DISC-LABEL, E-PV-GROUND-KW platform estimates; residential rules key on has_solar_ready (reserved zone, not a sold system) with an 18-module placeholder — replace with the PV design |
| 2026-10-08 | 12 | solar_pv | source_doubt | NREL timeout / SEIA 403 not cited; IRC R324.6, IFC 1205, NEC 690.53/705.11 edition-dependent — confirm |
| 2026-10-08 | 12 | solar_pv | vocab | Propose equipment type post_driver (ground-mount) |
| 2026-10-08 | 12 | battery_storage | es_safety | 12 hazards + 7 safety QA + 10 inspection checklist items pending human translation |
| 2026-10-08 | 12 | battery_storage | cost_estimate | E-ESS-BATT-RES-EA (13.5 kWh unit included, $9,500), E-ESS-GATEWAY-EA, E-ESS-LOADS-MOVE-EA, E-ESS-COMMISSION-EA platform estimates; reuses E-SUBPANEL-100 for backup loads panel |
| 2026-10-08 | 12 | battery_storage | source_doubt | Enphase QIG via distributor mirror (enphase.com 403); IRC R328.x via third-party 2021 summaries; NEC 706.7/706.15 via 2023 NEC articles |
| 2026-10-08 | 12 | battery_storage | scope | has_ess regex `\bESS\b` may fire on unrelated text; no commercial BESS recipe/assembly |
| 2026-10-08 | 12 | ev_charging | es_safety | 12 hazards + 6 safety QA + 13 inspection checklist items pending human translation |
| 2026-10-08 | 12 | ev_charging | cost_estimate | E-EV-L2-WALL-EA / L2-PEDESTAL-EA / DCFC-EA material derived from DOE AFDC cost ranges; E-EV-TRENCH-LF, LOADMGMT-EA, SPACE-SIGN-EA + all labor/equipment estimates. Const counts by building type (2 pedestals, 150 LF trench, 4 bollards, 4 signs) — propose an `evse` fixture token |
| 2026-10-08 | 12 | ev_charging | source_doubt | NEC 2023 220.57/220.87/625.x via secondary summaries; afdc.energy.gov unresolvable on local DNS (verified via 8.8.8.8); accessible EV dims are Access Board technical assistance, not enforceable scoping |
| 2026-10-08 | 12 | av_automation | es_safety | 12 hazards + 7 safety QA + 10 inspection checklist items pending human translation |
| 2026-10-08 | 12 | av_automation | cost_estimate | E-AV-SPK-PAIR, E-AV-TV-MOUNT, E-AV-RACK, E-AV-PROGRAM, E-AV-CONF-ROOM ($14k + 32 h allowance) platform estimates |
| 2026-10-08 | 12 | av_automation | source_doubt | UFGS 27 41 16 is a DHA criteria section → UFGS 27 41 00 used; NEC 640.x via secondary sources; Class 2 cited as generic 725 (NEC 2023 split into 722/724/725) |
| 2026-10-08 | 13 | process_piping | es_safety | 12 hazards + 6 safety QA (backflow_installed, test_plan, relief_on_air_test, pneumatic_staged, test_held, pipe_labels) + 6 inspection checklist items pending human translation |
| 2026-10-08 | 13 | process_piping | cost_estimate | P-PRC-AIR-PIPE-LF, P-PRC-AIR-DROP (6 placeholder), P-PRC-COMP-SET, P-PRC-TEST-SYS, P-PRC-LABEL platform estimates (industrial only) |
| 2026-10-08 | 13 | process_piping | scope | IPC doesn't govern compressed-air/chemical piping — owner/engineer witness tests under ASME B31.3/B31.9; plumbing-family gates are a stand-in. Pneumatic-test hazard cites 1926.21(b)(2) (no specific 1926 section) |
| 2026-10-08 | 13 | process_piping | scope | Both industrial process-piping template tasks now get pack steps (install vs test/turnover) |
| 2026-10-08 | 13 | water_treatment | es_safety | 9 hazards + 6 safety QA + 6 inspection checklist items pending human translation |
| 2026-10-08 | 13 | water_treatment | cost_estimate | P-WT-SOFTENER/IRON-FILTER/UV/RO/WHOLE-FILTER/LAB-TEST-EA platform estimates (lab test cross-checked vs WSLH price list); no quantity rules (propose a water_softener fixture token) |
| 2026-10-08 | 13 | water_treatment | source_doubt | IPC 608.1/610/611/802 from 2021 IPC, not text-checked (ICC 403); IRC P2909 not verified — omitted |
| 2026-10-08 | 13 | medical_gas | es_safety | 12 hazards + 11 safety QA + 8 inspection checklist items pending human translation |
| 2026-10-08 | 13 | medical_gas | cost_estimate | P-MG-PIPE-LF, P-MG-OUTLET-EA, P-MG-ZVB-EA, P-MG-ALARM-EA, P-MG-VERIFY-EA platform estimates; only 1 verification / zone box / alarm seeded (no med-gas blueprint tokens) |
| 2026-10-08 | 13 | medical_gas | source_doubt | NFPA 99 5.1.9 (warning systems) / 5.1.10 (distribution) / 5.1.11 (labeling) / 5.1.12 (testing) match the 2021 edition structure to reviewer knowledge but were not text-checked; UFGS 22 62 13/22 63 13 not public → 22 60 70 used |
| 2026-10-08 | 13 | fire_sprinkler | es_safety | 12 hazards + 9 safety QA + 3 inspection checklists pending human translation |
| 2026-10-08 | 13 | fire_sprinkler | cost_estimate | P-FS-RISER, P-FS-MAIN-SF, P-FS-FDC, P-FS-BACKFLOW, P-FS-TEST-SYS estimates; P-FS-RES-SF derived from USFA FA-43 (2008 $1.00–1.50/SF escalated to ~$2.50/SF, 45/55 split assumed); P-SPRINKLER-HEAD ≈1 per 130 SF room area (planning estimate, not NFPA spacing) |
| 2026-10-08 | 13 | fire_sprinkler | source_doubt | NFPA 13 Ch. 6/17/18/27/28 assume 2019/2022 layout (secondary sources); AFSA 403 not cited; NFPA 24 chapter omitted |
| 2026-10-08 | 13 | fire_sprinkler | scope | No dry-pipe valve/compressor or fire pump assembly yet. Both template sprinkler tasks now get pack steps |
| 2026-10-08 | 13 | kitchen_equipment | es_safety | 12 hazards + 3 safety QA (indirect_waste_air_gap, gas_shutoff_leak, power_per_nameplate) + inspection checklist items pending human translation |
| 2026-10-08 | 13 | kitchen_equipment | cost_estimate | B-KEQ-SET/WORKTABLE/SINK3/SEAL/STARTUP platform estimates; const placeholders (10/1/40 LF/6) on commercial |
| 2026-10-08 | 13 | kitchen_equipment | source_doubt | IPC 802.1.1 + IFGC 409.5 from 2021 editions; UFGS 11 40 00 script-gated, not used. Uses code_types 'FDA Food Code' and 'WI ATCP' |
| 2026-10-08 | 13 | tooling | scope | pack:smoke now takes an optional building type (`pack:smoke -- <key> commercial`, pole_barn via plan type) so commercial-only recipes and quantity rules can be exercised |
| 2026-10-08 | 13 | trenchless_sewer | es_safety | 12 hazards + 2 safety QA (ventilation_styrene, protective_system) + 9 inspection checklist items pending human translation |
| 2026-10-08 | 13 | trenchless_sewer | cost_estimate | P-TS-CCTV-EA, P-TS-JET-EA, P-TS-CIPP-LAT-LF, P-TS-BURST-LF, P-TS-PIT-EA platform estimates (public bid tabs are 8 in.+ mains, not comparable); no quantity rules (repair work) |
| 2026-10-08 | 13 | trenchless_sewer | source_doubt | 2021 IPC 717.6 lists fold-and-form only — CIPP relies on alternate-method approval (check 2024); 716.x subsection numbers via ICC CodeNotes; WI SPS relining treatment unverified |
| 2026-10-08 | 13 | trenchless_sewer | vocab | Propose equipment types sewer_jetter, cctv_camera, cipp_boiler, pipe_bursting_rig |
| 2026-10-08 | 13 | kitchen_exhaust | es_safety | 12 hazards + 7 safety QA + inspection checklist items pending human translation |
| 2026-10-08 | 13 | kitchen_exhaust | cost_estimate | M-KEX-HOOD-LF, GDUCT-LF, WRAP-LF, UPBLAST-EA, MAU-EA, LIGHT-TEST platform estimates; commercial const placeholders (12 LF hood, 30 LF duct, 1 fan/MAU/test) |
| 2026-10-08 | 13 | kitchen_exhaust | source_doubt | IMC 506.3.x/506.5/508.1/401.4 from 2018–2021 topic lists (2024 IMC reorganized) — verify; no DoD UFGS 23 38 13 → VA master spec used; fishnick CKV guides 404 |
| 2026-10-08 | 13 | fire_protection_special | es_safety | 10 hazards + 6 safety QA + 7 final checklist items pending human translation |
| 2026-10-08 | 13 | fire_protection_special | cost_estimate | All 6 B-FPS-* platform estimates; only extinguisher cabinets seeded (~1 per 3,000 SF, commercial/industrial/MF) — propose hood-suppression / clean-agent tokens |
| 2026-10-08 | 13 | fire_protection_special | source_doubt | IFC 904.x/906.x, IBC 904.1, IMC 509.1, NFPA 10 Ch. 6 consistent with 2018/2021 structure to reviewer knowledge but not text-checked (ICC 403) — verify vs adopted edition. Agent-atmosphere hazard cites 1926.55(a) |
| 2026-10-08 | 14 | test_balance | es_safety | 10 hazards + 2 safety QA (motor_limits, outdoor_air_verified) pending human translation |
| 2026-10-08 | 14 | test_balance | cost_estimate | M-TAB-OUTLET/AHU/TRAVERSE/HYD-TERM/REPORT platform estimates; floor-area ratios (outlets ×0.006, AHU ×0.0001, traverses ×0.0003) — replace with schedule counts |
| 2026-10-08 | 14 | test_balance | source_doubt | IECC C403.12.2.3 = 2021 numbering (C403.11.2.3 in 2018); C408.2.2.1/.2 via secondary (WA/MN adoptions); AABC/NEBB 403 |
| 2026-10-08 | 14 | test_balance | scope | Both template TAB tasks now get pack steps |
| 2026-10-08 | 14 | controls_bms | es_safety | 11 hazards + 3 safety QA (class2_separation, smoke_detector_access, safeties_proven) pending human translation |
| 2026-10-08 | 14 | controls_bms | cost_estimate | M-BAS-DDC-PANEL-EA, POINT-EA, VAV-CTRL-EA, PROG-PT, FPT-SYS platform estimates; area ratios coarse (points ≈1/400 SF commercial). VAV controller qty rule removed at review — commercial jobs with packaged RTUs have no VAV boxes; needs a VAV fact |
| 2026-10-08 | 14 | controls_bms | source_doubt | IECC C403.4/.4.1/C408.2 vs 2021 only; NEC 725 = Class 2/3 after 2023 split; UFGS 23 09 23 403 → 23 09 00 used |
| 2026-10-08 | 14 | mechanical_insulation | es_safety | 11 hazards + 2 safety QA + 3 inspection checklist items pending human translation |
| 2026-10-08 | 14 | mechanical_insulation | cost_estimate | M-INS-FG-PIPE-LF, ELAST-PIPE-LF, ALUM-JKT-LF, FITTING-EA platform estimates; commercial const placeholders (FG 200 LF, elastomeric 80 LF, 28 fittings, 40 LF jacket) |
| 2026-10-08 | 14 | mechanical_insulation | source_doubt | IECC C403.12.x = 2021 numbering via secondary sources; IECC R403.3.1 + IMC 604.1/604.3/1204.1 not ICC-checked; NIA MIDG cited at insulation.org |
| 2026-10-08 | 14 | mechanical_insulation | scope | Pipe-cover hold point gated on gas_refrigerant_test — hydronic/domestic pressure tests have no mechanical-family inspection type |
| 2026-10-08 | 14 | elevator | es_safety | 12 hazards + 6 safety QA + 12 inspection checklist items pending human translation |
| 2026-10-08 | 14 | elevator | cost_estimate | B-ELV-HYD-2STOP-EA, MRL-STOP-EA, RES-EA, VPL-EA, PIT-EA platform estimates (quote-driven equipment) |
| 2026-10-08 | 14 | elevator | source_doubt | WI SPS 318.1007/.1011/.17086/.170810/.1810 confirmed in the chapter PDF at review; IBC 3001–3005 + IRC R321 from knowledge (ICC 403) — verify |
| 2026-10-08 | 14 | elevator | vocab | Propose chain_hoist; optional welder matches every elevator title |
| 2026-10-08 | 14 | refrigeration | es_safety | 12 hazards + 3 safety QA pending human translation |
| 2026-10-08 | 14 | refrigeration | cost_estimate | M-REF-COND-UNIT/CASE/LEAK-TEST/EVAC-CHARGE/ICE-MACHINE platform estimates; refrigerant volatile under AIM Act phasedown; commercial const placeholders (1 unit, 2 cases, 50 LF line) |
| 2026-10-08 | 14 | refrigeration | source_doubt | IMC 1101.10/1103–1108 from chapter structure; leak repair: 40 CFR 82.157 (≥50 lb ODS) + 40 CFR 84.106 (HFC ≥15 lb, from 2026-01-01) both verified in eCFR |
| 2026-10-08 | 14 | cold_storage | es_safety | 12 hazards + 4 safety QA (inside_release, jbox_sealed, alarm_tested, floor_heat_tested) + inspection checklist items pending human translation |
| 2026-10-08 | 14 | cold_storage | cost_estimate | M-CS-COOLER-SF, FREEZER-SF, FLRHEAT-SF, DOOR-EA, EVAP-EA platform estimates; commercial placeholders (80 SF cooler, 64 SF freezer, 2 doors, 2 evaporators) — propose walk_in_cooler/walk_in_freezer tokens |
| 2026-10-08 | 14 | cold_storage | source_doubt | IECC C403.11.2 (2021) via secondary sources; inside-release requirement from manufacturer manuals only (no code/1926 rule); Nor-Lake/NAKS manuals distributor-hosted |
| 2026-10-08 | 14 | cold_storage | scope | Taxonomy CSI 11 41 vs assemblies 13 21 26 (UFGS cold-storage rooms) — pick one |
| 2026-10-08 | 14 | geothermal | es_safety | 12 hazards + 3 safety QA (setbacks, grout_bottom_up, fluid_approved) + inspection checklist items pending human translation |
| 2026-10-08 | 14 | geothermal | cost_estimate | M-GEO-VBORE-LF, HTRENCH-LF, HEADER-LF, VAULT-EA, FLUSH-EA, GSHP-EA platform estimates; residential const (1 GSHP, 600 LF bore, 60 LF header, 1 flush) |
| 2026-10-08 | 14 | geothermal | source_doubt | WI NR 812.151 etc. checked vs Feb 2026 chapter text; IMC 1210.x + IRC M2105.x via up.codes 2021 mirror. NR 812.03(2) "one work day" vs 812.151(3) "≥24 h" notification — pack states 24 h |
| 2026-10-08 | 14 | geothermal | vocab | drill_rig (also asked by deep_foundations) |
| 2026-10-08 | 14 | boilers_hydronic | es_safety | 11 hazards + 7 safety QA (vent_listed, relief_discharge, no_valve_relief, gas_tested, combustion_test, safety_controls, co_check) pending human translation |
| 2026-10-08 | 14 | boilers_hydronic | cost_estimate | All 6 M-HYD-* platform estimates; residential const (1 boiler, rooms × 10 LF baseboard, 2 zones) — may sit beside an M-FURNACE line if hvac is also scheduled |
| 2026-10-08 | 14 | boilers_hydronic | source_doubt | IMC 1004–1011/1206–1209, IRC M2001–M2103, IFGC 304/406/503 from TOC knowledge (derived); WI SPS 341.16/.18/.29/.30/.41 read from PDF |
| 2026-10-08 | 14 | boilers_hydronic | scope | Propose hydronic_boiler / radiant_floor component tokens |
| 2026-10-08 | 15 | wallcovering | es_safety | 11 hazards + 2 safety QA (devices_off, flame_class) + 1 checklist item pending human translation |
| 2026-10-08 | 15 | wallcovering | cost_estimate | G-WCV-VINYL2-SY, RES-SF, PRIMER-SF, REMOVE-SF platform estimates; commercial rule cut at review from 40 → 10 SY per room (most rooms are painted; avoids double count with painting) |
| 2026-10-08 | 15 | wallcovering | source_doubt | wallcoverings.org 403 — UFGS 09 72 00 used; no DOE BASC page for vinyl/vapor retarder (UFGS note cites UFC 3-101-01) |
| 2026-10-08 | 15 | wallcovering | scope | FRP panels + wall protection routed to specialties |
| 2026-10-08 | 15 | wallcovering | es_safety | 11 hazards + 2 safety QA (devices_off, flame_class) + 1 checklist item pending human translation |
| 2026-10-08 | 15 | wallcovering | cost_estimate | G-WCV-VINYL2-SY, RES-SF, PRIMER-SF, REMOVE-SF platform estimates; commercial rule cut at review from 40 → 10 SY per room (most rooms are painted) |
| 2026-10-08 | 15 | wallcovering | source_doubt | wallcoverings.org 403 — UFGS 09 72 00 used; FRP + wall protection routed to specialties |
| 2026-10-08 | 15 | access_flooring | es_safety | 11 hazards + 5 safety QA pending human translation |
| 2026-10-08 | 15 | access_flooring | cost_estimate | B-AF-SYS-SF, PERF-EA, CUTOUT-EA, RAMP-LF, GRND-SF platform estimates; assumes ~15% of commercial/industrial floor is raised floor until a callout exists |
| 2026-10-08 | 15 | access_flooring | source_doubt | IMC 602.2 + NEC 645.5 from memory (645.5 subsection letter varies by edition); ASCE 7 §13.5.7 seismic not cited (no ASCE code_type convention); CISCA homepage only |
| 2026-10-08 | 15 | plaster | es_safety | 12 hazards + 2 safety QA + 5 inspection checklist items pending human translation |
| 2026-10-08 | 15 | plaster | cost_estimate | B-PLA-VENEER-ADD-SF (adder on B-DRYWALL-SF), 3COAT-SF, REPAIR-SF, BEAD-LF platform estimates; single veneer rule at 1 SF/SF floor |
| 2026-10-08 | 15 | plaster | scope | Hand recipe sends plaster tasks down the drywall branch ("Hang gypsum board / Tape & finish") — plaster needs its own steps (supersedes_hand + snapshot update — owner call) |
| 2026-10-08 | 15 | plaster | source_doubt | IBC 110.3.5/2507/2511 + IRC R702.2.x via web search + Seattle mirror (ICC 403); UFGS 09 26 13 doesn't exist → 09 26 00 |
| 2026-10-08 | 15 | millwork | es_safety | 12 hazards + 3 safety QA (blocking_in_place, frt_labeled, fastened_to_framing) + 3 checklist items pending human translation |
| 2026-10-08 | 15 | millwork | cost_estimate | G-MW-* platform estimates; reception-desk rule ($12k allowance on every commercial job) removed at review; P-lam base/upper commercial const may double-count G-CAB-* when a cabinetry callout exists |
| 2026-10-08 | 15 | millwork | source_doubt | No public UFGS for paneling/veneer casework; AWI tolerances proprietary — UFGS 06 41 16 used |
| 2026-10-08 | 15 | terrazzo | es_safety | 11 hazards + 1 safety QA (precast_set) pending human translation |
| 2026-10-08 | 15 | terrazzo | cost_estimate | G-TZ-EPOXY-SF, DIVIDER-LF, MEMB-SF, TREAD-EA, REFINISH-SF platform estimates; no quantity rules (propose a `terrazzo` component token) |
| 2026-10-08 | 15 | terrazzo | vocab | floor_grinder (again), slurry_vacuum |
| 2026-10-08 | 15 | flooring_epoxy | es_safety | 12 hazards + 3 safety QA (slip_texture, cure_before_traffic, ignition_control_posted) + 9 inspection checklist items pending human translation |
| 2026-10-08 | 15 | flooring_epoxy | cost_estimate | G-EPX-SHOTBLAST/MVB-PRIMER/FLAKE/UCRETE-SF + COVE-LF platform estimates; industrial rule seeds G-FLOOR-EPOXY-SF at 15% of floor + 0.04 LF cove/SF — the industrial template task is a production-floor coating, so 15% may be low |
| 2026-10-08 | 15 | flooring_epoxy | vocab | shot_blaster, floor_grinder, dust_extractor |
| 2026-10-08 | 15 | underlayment_leveling | es_safety | 12 hazards + 2 safety QA (openings_guarded, heater_vented) + 1 checklist item pending human translation |
| 2026-10-08 | 15 | underlayment_leveling | cost_estimate | B-UL-GYP-075-SF, SLU-SF (ARDEX coverage published, bag price est.), PRIMER-SF, SOUNDMAT-SF, ISO-STRIP-LF estimates; MF rules scaled at review to 75% of room area (slab-on-grade level gets no topping) — a stories fact would fix this |
| 2026-10-08 | 15 | underlayment_leveling | source_doubt | UFGS 03 54 16 not on WBDG; IRC Appendix AK103 numbering unverified |
| 2026-10-08 | 15 | underlayment_leveling | vocab | No building gate fits a floor topping — consider a field sound test (FIIC/ASTC) checkpoint type |
| 2026-10-08 | 15 | acoustical_ceilings | es_safety | 12 hazards + 8 safety QA + 7 checklist items pending human translation |
| 2026-10-08 | 15 | acoustical_ceilings | cost_estimate | B-ACT-SYS/GRID/TILE-REPL/SEIS-SF platform estimates; ceiling = 60% of commercial / 10% of industrial floor. Seismic-adder rules removed at review: has_seismic_design fires on any "SEISMIC DESIGN CATEGORY" text incl. A–C (most of WI) — needs an SDC letter fact |
| 2026-10-08 | 15 | acoustical_ceilings | source_doubt | IBC 808.1.1/1613.1 confirmed only via Bellevue 2018-era checklist (ICC 403); Armstrong guide distributor-hosted; UFGS 09 51 13 403 → 09 51 00 |
| 2026-10-08 | 15 | acoustical_ceilings | vocab | above_ceiling_inspection as a non-gating milestone type (also requested by firestopping/fireproofing) |
| 2026-10-08 | 16 | operable_partitions | es_safety | 12 hazards + 5 safety QA (support_verified, track_anchorage, motor_controls_safety, emergency_release, pass_door_egress) + inspection checklist items pending human translation |
| 2026-10-08 | 16 | operable_partitions | cost_estimate | B-OP-ACOUSTIC-SF, ACCORDION-SF, PLENUM-BARRIER-LF, SUPPORT-STEEL-LF, PASS-DOOR-EA platform estimates; no quantity rules (propose operable_partition token) |
| 2026-10-08 | 16 | operable_partitions | source_doubt | ASTM E557 cited only via UFGS 10 22 39 (store 404); UFGS 10 22 26 not resolvable |
| 2026-10-08 | 16 | stairs_railings | es_safety | 10 hazards + 7 safety QA + 8 inspection checklist items pending human translation |
| 2026-10-08 | 16 | stairs_railings | cost_estimate | B-STR-WOOD-FLIGHT-EA, PREFAB-STRINGER-EA, RAIL-WOOD-LF, NEWEL-EA, CABLE-RAIL-LF platform estimates; residential const (1 flight, 2 newels, 14 LF rail) |
| 2026-10-08 | 16 | stairs_railings | source_doubt | UFGS 06 43 13 unverifiable (WBDG shell page); awc-dca6 (deck stairs) cited for stringer layout concept |
| 2026-10-08 | 16 | stairs_railings | scope | stair/rail titles overlap misc_metals, decks, glazing, finish_carpentry — separation relies on the task's trade_type |
| 2026-10-08 | 16 | lab_casework | es_safety | 13 hazards + 7 safety QA + 14 inspection checklist items pending human translation |
| 2026-10-08 | 16 | lab_casework | cost_estimate | G-LAB-BASE-LF, EPOXY-TOP-LF, HOOD-EA, HOOD-CERT-EA, SHELF-LF platform estimates; commercial const placeholders |
| 2026-10-08 | 16 | lab_casework | source_doubt | UFGS 12 35 53 403 (scope only); OSHA sections copied from sibling packs, not re-checked on eCFR; hood acceptance values in SEFA 1/ASHRAE 110 (ref only) |
| 2026-10-08 | 16 | specialties | es_safety | 12 hazards + 5 safety QA + 5 hold-point checklist items pending human translation |
| 2026-10-08 | 16 | specialties | cost_estimate | All 6 G-SPC-* platform estimates; fixed counts (2 accessory sets + 4 grab bars commercial/industrial, 1 CBU multifamily) |
| 2026-10-08 | 16 | specialties | source_doubt | CBU height limits only on vendor FAQs (USPS-B-1118 not readable) — left out; postmaster-installs-master-lock from maker guidance; no public flagpole foundation source |
| 2026-10-08 | 16 | specialties | scope | Commercial template's restroom-accessories task is tagged toilet_partitions, so G-SPC accessory lines only seed when a specialties task is scheduled |
| 2026-10-08 | 16 | furniture_ffe | es_safety | 12 hazards + 7 safety QA + 7 checklist items pending human translation |
| 2026-10-08 | 16 | furniture_ffe | cost_estimate | G-FFE-WKST/PWR/SEAT-EA, RECV-TRK, MOVE-HR platform estimates; workstation material = hardware only (owner-furnished assumed), seat material = mid-grade furnished — zero it when OFCI. Owner decision: OFCI vs contractor-furnished basis |
| 2026-10-08 | 16 | furniture_ffe | source_doubt | BIFMA 403 (reference only); Hussey/Steelcase guides not used; STURDY Act (16 CFR 1261) not applicable |
| 2026-10-08 | 16 | toilet_partitions | es_safety | 11 hazards + 3 safety QA (ceiling_support, anchor_rating, emergency_access) + 3 checklist items pending human translation |
| 2026-10-08 | 16 | toilet_partitions | cost_estimate | G-TP-STD/ADA/AMB-COMP-EA, URINAL-SCRN-EA, CEIL-STEEL-EA platform estimates; commercial const (2 ADA, 2 standard, 1 screen) — propose water_closet/urinal fixture tokens |
| 2026-10-08 | 16 | toilet_partitions | source_doubt | UFGS 10 21 13.17 scope unconfirmed; Scranton/ASI/Hadrian guides unreachable — Bobrick only. Commercial template restroom task now gets partition steps |
| 2026-10-08 | 16 | signage | es_safety | 12 hazards + 5 safety QA + inspection checklist items pending human translation |
| 2026-10-08 | 16 | signage | cost_estimate | B-SGN-ADA-EA (1 per room, commercial/MF/industrial), WAYF-EA estimates; CHANNEL-EA + MONUMENT-EA are allowances (sign-shop quotes); FTG-EA pier sized from engineered drawing |
| 2026-10-08 | 16 | signage | source_doubt | IBC Appendix H (H109) numbering/adoption varies; sign_permit is a local zoning hold point, not an AHJ building inspection |
| 2026-10-08 | 16 | appliances | es_safety | 13 hazards + 6 safety QA + 8 inspection checklist items pending human translation |
| 2026-10-08 | 16 | appliances | cost_estimate | All 6 G-APP-* platform estimates; G-APP-PKG-ALLOW-EA $3,500 per single-family dwelling highly variable |
| 2026-10-08 | 16 | appliances | source_doubt | No federal range tip-over rule (CPSC Pub. 5007 + maker instructions; general-duty OSHA refs); GE dishwasher guide retailer-hosted |
| 2026-10-08 | 16 | engine | scope | Equipment rules gain optional `step_re` (matched against the step title only) so a pack can scope equipment to one step — requested by furniture_ffe, gate_operators, elevator, flooring_epoxy. Guard (regex compiles) + integration test added |
| 2026-10-08 | 17 | central_vacuum | es_safety | 10 hazards + 3 safety QA (notch_bore_limits, penetrations_sealed, exhaust_outdoors) pending human translation |
| 2026-10-08 | 17 | central_vacuum | cost_estimate | B-CVAC-INLET-EA, POWER-EA, TRIM-EA platform estimates; inlets = rooms × 0.4 (residential_sf) |
| 2026-10-08 | 17 | central_vacuum | source_doubt | Beam/H-P/Lindsay install PDFs not retrievable (steps at 'estimate'); IRC R302.4/R302.11/R502.8/R602.6 + OSHA 1926.152(a)(1)/.1153/.301(a)/.501(b)(4) not text-checked this pass (real sections per reviewer) |
| 2026-10-08 | 17 | central_vacuum | scope | Tubing rough-in gated on 'insulation' (no rough_in type in the building sequence) |
| 2026-10-08 | 17 | pools_spas | es_safety | 12 hazards + 8 safety QA + 8 inspection checklist items pending human translation |
| 2026-10-08 | 17 | pools_spas | cost_estimate | All 6 B-POOL-* platform estimates (vinyl package, fiberglass set, equipment pad, VGB drain set, bonding, safety cover); no quantity rules (no pool token) |
| 2026-10-08 | 17 | pools_spas | source_doubt | ISPSC 305.2/305.3 + NEC 680.26 edition-dependent; IRC Appendix AG not cited; 1926.1408(a)/.501(b)(7)/.404(b)(1) not re-verified this pass |
| 2026-10-08 | 17 | pools_spas | scope | Pre-gunite bonding gated on building 'foundation'; a pools_spas-tagged "gunite shell" task falls back to generic steps (shell work lives in shotcrete pool_shell recipe); hot tubs/indoor pools not covered |
| 2026-10-08 | 17 | special_construction | es_safety | 14 hazards + 10 safety QA pending human translation |
| 2026-10-08 | 17 | special_construction | cost_estimate | B-SCN-SAFEROOM-EA, SHELTER-STEEL-EA, GREENHOUSE-SF, CLEANROOM-SF, CERT-EA platform estimates (wide real ranges); no quantity rules |
| 2026-10-08 | 17 | special_construction | source_doubt | fema.gov + iso.org 403 — FEMA P-320/P-361 content concept-level ('derived'); IBC 312/423/803/1809 + IRC R323 not text-checked; no UFGS for cleanroom/greenhouse found |
| 2026-10-08 | 17 | special_construction | scope | Sound-isolation rooms/vaults not covered |
| 2026-10-08 | 17 | playground_equipment | es_safety | 12 hazards + 7 safety QA pending human translation |
| 2026-10-08 | 17 | playground_equipment | cost_estimate | All 5 B-PLAY-* platform estimates; STRUCT/SWING are install allowances excluding the maker's kit; no quantity rules |
| 2026-10-08 | 17 | playground_equipment | source_doubt | CPSC handbook Table 2 sand/wood-mulch values garbled in extraction (only wood chips, rubber, pea gravel cited); IPEMA 403; ASTM F1951 unverified URL |
| 2026-10-08 | 17 | gym_theatrical | es_safety | 12 hazards + 12 safety QA + 10 inspection checklist items pending human translation |
| 2026-10-08 | 17 | gym_theatrical | cost_estimate | All 6 G-GYM-* platform estimates; commercial const placeholders (2 ceiling backstops, 400 SF wall pad) |
| 2026-10-08 | 17 | gym_theatrical | source_doubt | UFGS 11 66 23 unverifiable; no maker install PDFs reachable (steps say "per the maker"); assembly-seating IBC section not numbered (ICC 300 ref only); CPSC Pub 330 bleacher guidance read |
| 2026-10-08 | 17 | fireplaces | es_safety | 14 hazards + safety QA + checklist items pending human translation |
| 2026-10-08 | 17 | fireplaces | cost_estimate | B-FPL-DV-GAS-EA, VENT-KIT-EA, CHASE-EA, HEARTH-EA, WOODSTOVE-EA platform estimates; no quantity rules (no fireplace token) |
| 2026-10-08 | 17 | fireplaces | source_doubt | IRC R1004.1/.2, R1005.1, R1006.1, R1001.1/.9, R302.11, R315.2, G2417 from memory (ICC 403) — consistent with IRC structure per reviewer, confirm; vented gas fireplace sections (G2432–G2435) not cited; CPSC/HPBA 403 |
| 2026-10-08 | 17 | sport_courts_turf | es_safety | 12 hazards pending human translation |
| 2026-10-08 | 17 | sport_courts_turf | cost_estimate | All 6 G-SCT-* platform estimates; no quantity rules (propose a court/turf token) |
| 2026-10-08 | 17 | sport_courts_turf | source_doubt | ASBA, Synthetic Turf Council, EPA crumb-rubber, ITF/USTA unreachable — tennis/basketball dimensions uncited (pickleball from USA Pickleball); turf steps rest on a FieldTurf overview |
| 2026-10-08 | 17 | sport_courts_turf | vocab | pressure_washer, turf_power_broom/infill_spreader, auger attachment |
| 2026-10-08 | 17 | loading_dock_equipment | es_safety | 14 hazards + 3 safety QA (pit_covered, disconnect_tagged, safety_devices_work) + 5 checklist items pending human translation |
| 2026-10-08 | 17 | loading_dock_equipment | cost_estimate | All 5 B-LDE-* platform estimates; industrial const (2 levelers/restraints/seals/bumper pairs, 48 LF curb angle) |
| 2026-10-08 | 17 | loading_dock_equipment | source_doubt | UFGS 11 13 00 + maker install manuals unverified (steps are general sequence); IBC 1705.3 foundation-gate ref from memory |
| 2026-10-08 | 17 | tooling | scope | Wave 17 used the `implementer` (Sonnet) subagent with curl-only source checks — packs pass all guards, but more sources were unreachable (ICC/FEMA/ISO/manufacturer PDFs) and several code numbers are memory-cited; re-verify in owner review |
| 2026-10-08 | w18 | crane_service | es_safety | 12 hazards + 11 safety QA items + 13 safety checklist items pending human Spanish translation |
| 2026-10-08 | w18 | crane_service | cost_estimate | G-CRANE-HYD-HR, G-CRANE-MOB-EA, G-CRANE-MATS-DAY, G-CRANE-RIGGER-DAY, G-CRANE-LIFTPLAN-EA all platform-baseline estimates; crane rates vary widely by region (4-hr minimums, counterweight trucks, permits) |
| 2026-10-08 | w18 | crane_service | cost_estimate | G-CRANE-LIFTPLAN-EA professional fee carried as equipment_cost (not taxed as material) — confirm convention |
| 2026-10-08 | w18 | crane_service | source_doubt | crane_service-osha-topic (osha.gov/cranes-derricks) returns 403 to curl; rule text verified on eCFR instead |
| 2026-10-08 | w18 | final_clean | es_safety | 11 hazards + 2 safety QA (products_low_hazard, no_dry_sweep) + 1 checklist item (rough_clean_release HEPA/no dry sweep) pending human ES translation |
| 2026-10-08 | w18 | final_clean | cost_estimate | G-CLN-ROUGH-SF, G-CLN-WINDOW-EA, G-CLN-GLAZE-SF, G-CLN-PWASH-SF, G-CLN-FILTER-EA — platform-baseline estimates, tune per tenant |
| 2026-10-08 | w18 | final_clean | source_doubt | GANA GIB 01-0300 cited via distributor mirror (syracuseglass.com); original glasswebsite.com URL dead, glass.org bulletin page JS-rendered — confirm a canonical NGA URL |
| 2026-10-08 | w18 | final_clean | vocab | proposed equipment types pressure_washer, hepa_vacuum, floor_scrubber (not in equipment-vocab.ts) |
| 2026-10-08 | w18 | final_clean | scope | G-CLN-GLAZE-SF quantity assumes ≈30 SF glass per scheduled window on commercial jobs; G-CLN-ROUGH-SF on room area alongside the always-seeded G-CLEAN-SF (rough vs final — confirm not double clean); G-CLN-PWASH-SF has no quantity rule |
| 2026-10-08 | w18 | material_handling | es_safety | 12 hazards + 8 safety QA items + 8 inspection-checklist items need human Spanish translation |
| 2026-10-08 | w18 | material_handling | cost_estimate | All 7 B-MH-* assemblies are platform-baseline estimates; MONORAIL-HOIST and BRIDGE-CRANE are wide-spread allowances |
| 2026-10-08 | w18 | material_handling | source_doubt | IBC 2209.1 (steel storage racks) and IFC 3201.1 (high-piled storage) section numbers not verifiable (ICC site blocks curl) — confirm against 2021 editions |
| 2026-10-08 | w18 | material_handling | scope | IBC ch.16 crane-load section omitted (1607.x numbering varies by edition); add once verified |
| 2026-10-08 | w18 | scaffolding | es_safety | 12 hazards + 12 safety QA items (hazard/controls/item_es) and the safety-related inspection_checklists items are pending_human_translation |
| 2026-10-08 | w18 | scaffolding | cost_estimate | G-SCAF-FRAME-SF, G-SCAF-RENT-SFMO, G-SCAF-NET-SF, G-SCAF-ROLL-WK, G-SCAF-MAST-WK, G-SCAF-SHED-LF are all platform-baseline estimates — need supplier quotes / regional tuning |
| 2026-10-08 | w18 | scaffolding | scope | Wall-face quantity heuristic (0.5 × summed floor area, masonry/stucco callouts on commercial/MF/industrial) is crude — a perimeter/height blueprint fact would make the scaffold quantity rules credible |
| 2026-10-08 | w18 | scaffolding | scope | No mast-climber recipe (ANSI A92.9, no specific OSHA 1926 section) — only an allowance assembly; decide if a recipe is wanted |
| 2026-10-08 | w18 | scaffolding | source_doubt | scaffolding-osha-etool answers 403 to scripts (content not fetched); scaffold color-tagging is cited as industry practice (derived), not an OSHA mandate |
| 2026-10-08 | w18 | rigging_millwright | es_safety | 12 hazards + 10 safety QA items + 7 safety checklist items pending human Spanish translation |
| 2026-10-08 | w18 | rigging_millwright | cost_estimate | G-RIG-MOVE-EA, G-RIG-CREW-DAY, G-RIG-ALIGN-EA, G-RIG-GROUT-CF, G-RIG-LIFTPLAN-EA — all platform-baseline estimates, no public cost source |
| 2026-10-08 | w18 | rigging_millwright | source_doubt | UFGS 03 62 00 (nonshrink grouting) PDF returned 403/404 and the API RP 686 page was a soft 404, so neither is cited; grout practice rests on the manufacturer page only (confidence derived) |
| 2026-10-08 | w18 | rigging_millwright | vocab | No machinery skate / hydraulic gantry / toe-jack equipment type in equipment-vocab; consider adding `machinery_skates` or `hydraulic_gantry` |
| 2026-10-08 | w18 | rigging_millwright | scope | 1926.1400(c) leaves hydraulic gantries, plain forklifts and come-alongs/chainfalls outside Subpart CC; the pack applies 1926.251 to those moves and keeps Subpart CC for crane picks only |
| 2026-10-08 | w18 | pest_control | es_safety | 12 hazards + 3 safety QA items (label_on_site, crew_notified, wells_located) + 1 checklist item need human ES translation |
| 2026-10-08 | w18 | pest_control | cost_estimate | All 6 G-PEST-* assemblies are platform-baseline estimates (SOIL-SF, PERIM-LF, BAIT-EA, BORATE-SF, EXCL-EA, MOB-EA) |
| 2026-10-08 | w18 | pest_control | source_doubt | IRC R318.1 / R318.1.1 section numbers cited from the 2021 IRC without a live check (codes.iccsafe.org returns 403 to scripts) — verify |
| 2026-10-08 | w18 | pest_control | scope | Slab pretreat quantity = room area × 0.6 is a rough ground-floor proxy; WI termite pressure is low, so confirm whether Example Builders ever uses this trade |
| 2026-10-08 | w18 | traffic_control | es_safety | 10 hazards + 11 safety QA items + 6 checklist items pending human Spanish translation |
| 2026-10-08 | w18 | traffic_control | cost_estimate | G-TC-FLAGGER-HR, G-TC-SIGN-PKG-DAY, G-TC-ARROW-DAY, G-TC-DEVICE-DAY, G-TC-LANE-CLOSE-EA, G-TC-TCP-EA all platform-baseline estimates; WisDOT 643.x AUP device-day prices used only as a floor |
| 2026-10-08 | w18 | traffic_control | vocab | equipment-vocab lacks arrow_board, truck_mounted_attenuator (TMA) and traffic-control/beacon truck; pack has no equipment rules until added |
| 2026-10-08 | w18 | traffic_control | source_doubt | MUTCD 11th ed. numbering used: tapers 6B.08, flaggers Ch. 6D (6E = one-lane two-way methods) |
| 2026-10-08 | w18 | traffic_control | source_doubt | 1926.202 (barricades → MUTCD Part 6) not cited because the text could not be fetched to verify; hazards cite 1926.200(g)(1)/(2) and 1926.201(a) instead |
| 2026-10-08 | w18 | traffic_control | scope | const quantity rules (TCP 1, closures 2, sign pkg 5 days, devices 100 device-days, flagger 16 h) seed whenever a project schedule has a traffic_control task on mf/commercial/industrial — confirm defaults are reasonable |
| 2026-10-08 | w18 | industrial_coatings | es_safety | 12 hazards (hazard + controls) and 4 safety QA items (containment_intact, entry_permit, lead_assessed, hygiene_setup) need human Spanish translation |
| 2026-10-08 | w18 | industrial_coatings | cost_estimate | All 6 G-COAT-* assemblies are platform-baseline estimates; quantity rule guesses 0.5 SF of field-coated steel per SF of industrial floor |
| 2026-10-08 | w18 | industrial_coatings | source_doubt | The Carbozinc 11 data sheet is a regional (StonCor Africa) copy with metric ISO wording, and its server fails curl (old TLS; read via WebFetch). Replace with a US data sheet if one can be found |
| 2026-10-08 | w18 | industrial_coatings | vocab | Propose equipment types dust_collector and dehumidifier (blast containment and tank lining depend on them; generator/air_compressor used as stand-ins) |
| 2026-10-08 | w18 | industrial_coatings | scope | Lead removal from steel structures is in this pack (1926.62); lead abatement in housing (40 CFR 745) stays in the abatement trade — confirm the split |
| 2026-10-08 | w18 | material_handling | scope | Wave review removed the const industrial quantity rules (20 rack bays / 44 anchors / 10 guards) — no rack-layout blueprint fact; B-MH-* lines are added by hand |
| 2026-10-08 | w18 | crane_service | scope | Wave review removed the G-CRANE-HYD-HR truss-day rule: with include_equipment the truss tasks already seed EQUIP-CRANE days (double count). Assembly kept for manual use |
| 2026-10-08 | w19 | pavement_marking | es_safety | 12 hazards + 1 safety QA + 2 checklist items pending human Spanish translation |
| 2026-10-08 | w19 | pavement_marking | cost_estimate | G-PM-THERMO-LF fully platform-baseline (no WisDOT thermoplastic bid item); labor hrs/unit on all G-PM-* rows are estimates |
| 2026-10-08 | w19 | pavement_marking | source_doubt | pavement_marking-odot-644 is the 2013 Ohio CMS edition (thermo 400–440 °F, 125 mil); confirm vs current ODOT CMS or a manufacturer PDS (Ennis-Flint site now redirects to PPG) |
| 2026-10-08 | w19 | pavement_marking | vocab | propose equipment types: striping machine (walk-behind/ride-on), thermoplastic kettle/applicator, line remover (grinder/water blaster) |
| 2026-10-08 | w19 | pavement_marking | scope | detectable warning fields left to curb-ramp/concrete scope (WisDOT 602); no blueprint fact gives stall count or striping LF, so G-STRIPE-STALL and line/legend codes have no quantity rules |
| 2026-10-08 | w19 | dewatering | es_safety | 11 hazards + 6 safety QA items (water_below_bottom, no_boiling, gfci_pumps, drawdown_verified, standby_power, settlement_within_limits) + inspection checklist items pending human ES translation |
| 2026-10-08 | w19 | dewatering | cost_estimate | All 6 B-DWTR-* assemblies are platform-baseline estimates (sump, pump-day, filter bag, tank-day, wellpoint LF, monitoring point); const counts (2 sumps / 20 pump-days commercial; 1 / 7 SF) |
| 2026-10-08 | w19 | dewatering | source_doubt | UFGS 31 23 19 (dewatering-ufgs-31-23-19) not re-read — WBDG page is script-rendered and the PDF returns 403; cited only for general structure |
| 2026-10-08 | w19 | dewatering | source_doubt | High-cap threshold: GP WI-0049344 + TS 1061 say ≥70 gpm combined; DNR high-cap page says >100,000 gal/day per property (NR 812.09(4)) — confirm wording in the recipe step and the `highcap_approval` QA item |
| 2026-10-08 | w19 | dewatering | vocab | No dewatering pump / wellpoint vacuum pump in equipment-vocab.ts — propose `dewatering_pump` (+ EQUIP- catalog row); generator used as a stand-in |
| 2026-10-08 | w19 | dewatering | scope | Assembly prefix B-DWTR- used instead of B-DW- (B-DW-* is the drywall prefix) |
| 2026-10-08 | w19 | traffic_signals_lighting | es_safety | 10 hazards + 4 safety QA items + 2 inspection-checklist items pending human ES translation |
| 2026-10-08 | w19 | traffic_signals_lighting | cost_estimate | Material/labor/equipment split of WisDOT AUP averages is ours (≈$95/hr crew); waste % and the parking-lot allowance (4 light units / 300 LF) are platform estimates |
| 2026-10-08 | w19 | traffic_signals_lighting | source_doubt | WisDOT pole/base "Type" ↔ size mapping assumed (Type 10 pole/base ≈ mast-arm signal pole, Type 5 pole / Type 2 base ≈ street light) — verify against WisDOT SDDs |
| 2026-10-08 | w19 | traffic_signals_lighting | vocab | No `drill_rig` or `bucket_truck` equipment type; used backhoe / boom_lift as proxies — propose adding both |
| 2026-10-08 | w19 | traffic_signals_lighting | scope | Signal timing and lighting photometrics left to the agency/engineer; the controller/cabinet has no assembly (WisDOT pays it through special items) |
| 2026-10-08 | w19 | guardrail_barriers | es_safety | 10 hazards + 4 safety QA + 3 temporary_barrier_shift_check items pending human translation |
| 2026-10-08 | w19 | guardrail_barriers | cost_estimate | All 6 HC-GR-* costs split material/labor/equipment from WisDOT AUP bid totals (platform split at ≈$75/hr); waste % are platform estimates |
| 2026-10-08 | w19 | guardrail_barriers | vocab | No `post_driver` equipment type — skid_steer used as optional carrier; propose adding post_driver |
| 2026-10-08 | w19 | guardrail_barriers | scope | No quantity_rules (no guardrail blueprint fact); cable median barrier recipe not written (WisDOT 613 special provision) |
| 2026-10-08 | w19 | guardrail_barriers | source_doubt | FHWA hardware page answers 403 to scripts; MSKT/QuadGuard manuals are state-hosted copies — confirm current revisions; QA joints_pinned rests on platform-baseline |
| 2026-10-08 | w19 | highway_bridge | es_safety | 11 hazards (hazard_es/controls_es), 3 safety QA (girder_braced_before_release, falsework_per_plan, falsework_release_approved) and 3 checklist items pending human Spanish translation |
| 2026-10-08 | w19 | highway_bridge | cost_estimate | All 6 HC-HWY-* costs: WisDOT AUP installed bid totals split into material/labor/equipment by us (≈$60–65/h burdened labor); waste_pct is platform-baseline estimate |
| 2026-10-08 | w19 | highway_bridge | source_doubt | Deck top-bar clearance check and "proof roll" are DOT practice, not named WisDOT 2025 standard-spec items (anchored to SS 211/301.3.5) |
| 2026-10-08 | w19 | highway_bridge | scope | No quantity_rules: blueprint facts carry no road/bridge quantities |
| 2026-10-08 | w19 | highway_bridge | vocab | Consider equipment types motor_grader, slipform_paver, deck_finishing_machine, water_truck |
| 2026-10-08 | w19 | site_furnishings | es_safety | 12 hazards + 5 safety QA items (protruding_objects, outside_play_zones, bollard_footing, receiver_flush, anchor_test) + 8 checklist items PENDING_ES |
| 2026-10-08 | w19 | site_furnishings | cost_estimate | G-SFN-BENCH-SM-EA, G-SFN-BIKERACK-EA, G-SFN-TRASH-EA, G-SFN-PICNIC-EA, G-SFN-BOLLARD-RMV-EA — all platform-baseline estimates |
| 2026-10-08 | w19 | site_furnishings | scope | ADA 903 benches are scoped to locker/dressing rooms and 226/902 dining surfaces to outdoor tables by inference; federal outdoor sites follow ABA 1011 — pack says "where designated accessible"; confirm wording |
| 2026-10-08 | w19 | site_furnishings | source_doubt | Bike-rack clearances (5/4/3 ft) come from City of Boston guidelines as an example local rule; the owner/AHJ standard governs |
| 2026-10-08 | w19 | site_furnishings | vocab | Propose equipment type `core_drill` (coring for bollards/receivers); `generator` used as a stand-in |
| 2026-10-08 | w19 | environmental_remediation | es_safety | 12 hazards + 3 safety QA items pending human Spanish translation |
| 2026-10-08 | w19 | environmental_remediation | cost_estimate | All 7 HC-REM-* assemblies are platform estimates; no public unit prices found. Soil disposal $/ton varies widely by region and landfill |
| 2026-10-08 | w19 | environmental_remediation | source_doubt | Closure notice lead time: WI ATCP 93.560 says 5 business days, federal 280.71 says 30 days unless the agency sets another period. Pack states both; confirm WI's state program approval makes 5 days the governing rule |
| 2026-10-08 | w19 | environmental_remediation | source_doubt | NR 718/720/724/726 and NR 141 are cited at chapter or section-title level only (NR 718.05, NR 726.05, NR 141.25); subsection wording not verified |
| 2026-10-08 | w19 | environmental_remediation | vocab | Consider adding vacuum_truck and drill_rig to equipment-vocab; both appear only as tools today |
| 2026-10-08 | w19 | environmental_remediation | scope | Quantity rules are const placeholders (HASP ×1 and 5 confirmation samples on commercial/industrial, 1 small UST on residential_sf); they fire only when this trade is on the project schedule |
| 2026-10-08 | w19 | ground_improvement | es_safety | 11 hazards + 1 safety QA (caustic_ppe) pending human Spanish translation |
| 2026-10-08 | w19 | ground_improvement | cost_estimate | HC-GI-COMPGROUT-CY labor/equipment, HC-GI-RAP-LF material, HC-GI-WICK-LF material are platform-baseline estimates; FHWA-derived costs escalated from 2007–2010 data |
| 2026-10-08 | w19 | ground_improvement | source_doubt | USACE EM 1110-2-3506 (grouting) / EM 1110-1-1905 not cited — publications.usace.army.mil returns 403 and no DTIC mirror confirmed; add if a verified URL is found |
| 2026-10-08 | w19 | ground_improvement | vocab | No equipment type for pier rig / vibroflot / grout plant / soil reclaimer; mapped to excavator, crane, air_compressor/generator, compactor — consider adding drill_rig, grout_pump, soil_stabilizer |
| 2026-10-08 | w19 | ground_improvement | scope | Wave review removed the HC-GI-CEMSTAB-SY area rule: it fired alongside HC-GI-RAP-LF on the same jobs (two alternative methods both priced). RAP rule kept as the single placeholder |
| 2026-10-08 | w20 | power_line | es_safety | 12 hazards + 4 safety QA items + 6 checklist items (switching_clearance_order, energization_acceptance) pending human Spanish translation |
| 2026-10-08 | w20 | power_line | cost_estimate | All 6 HC-PWR-* assemblies are platform-baseline estimates (padmount transformer price volatile since 2022) — replace with RUS/co-op unit cost data or DOT utility-relocation bid tabs |
| 2026-10-08 | w20 | power_line | source_doubt | RUS 1728F-804 full text unreachable (rd.usda.gov 403); cited generically. Pole depth/plumb/tamping QA rests on one co-op standard (PRE-CNS-002, Pedernales EC), marked derived |
| 2026-10-08 | w20 | power_line | vocab | Equipment vocab lacks digger_derrick, bucket_truck (boom_lift used as stand-in), wire puller/tensioner |
| 2026-10-08 | w20 | power_line | scope | No quantity rules (no blueprint facts for utility lines); substation recipe is a thin civil/electrical outline — owner commissioning detail not modeled |
| 2026-10-08 | w20 | marine_dredging | es_safety | 11 hazards + 1 safety QA item (plant_inspected) pending human Spanish translation |
| 2026-10-08 | w20 | marine_dredging | cost_estimate | All 6 HC-MAR-* assemblies are platform-baseline estimates; USACE Dredging Information System is a JS app, no bid-abstract unit prices could be verified — derive from USACE bid abstracts |
| 2026-10-08 | w20 | marine_dredging | source_doubt | marine_dredging-usace-em-1110-2-5025 URL returns 403 to scripts; cited as general reference only |
| 2026-10-08 | w20 | marine_dredging | source_doubt | line_handling, pipeline_pressure, submerged_utility hazards cite 1926.21(b)(2) (no specific 1926 section) — confidence derived |
| 2026-10-08 | w20 | marine_dredging | vocab | No equipment types for dredge, barge/crane barge, tug/work boat, survey boat, pile hammer — crane/excavator used as proxies; propose marine vocab |
| 2026-10-08 | w20 | marine_dredging | scope | Turbidity limits/work windows are project-specific (permit special conditions / Sec. 401 cert, 33 CFR 325.4) — pack gives no numeric limits |
| 2026-10-08 | w20 | tunneling | es_safety | 12 hazards + 3 safety QA items (ground_support_inspected, atmospheric_test, check_in_out) pending human Spanish translation |
| 2026-10-08 | w20 | tunneling | cost_estimate | All 6 HC-TUN-* assemblies are platform-baseline estimates (MT48 LF, jacking/receiving shaft EA, liner plate 72 in. LF, settlement point EA, slurry CY); seek a state DOT or municipal microtunnel bid tab |
| 2026-10-08 | w20 | tunneling | vocab | Propose equipment types: microtunnel boring machine (MTBM) / jacking frame, slurry separation plant, ventilation blower |
| 2026-10-08 | w20 | tunneling | scope | 1926.803 compressed-air (pressurized heading) work not covered by hazards/recipes; add if tenants do hand-mined work under air |
| 2026-10-08 | w20 | tunneling | source_doubt | ASCE/CI 36-15 microtunneling standard not added (publisher URL 403 to scripted check); add as proprietary_ref_only after manual URL check |
| 2026-10-08 | w20 | directional_drilling | es_safety | 11 hazards + 1 safety QA (locates_potholes) pending human Spanish translation |
| 2026-10-08 | w20 | directional_drilling | cost_estimate | HC-HDD-MD-6IN-LF, HC-HDD-JB-24IN-LF, HC-HDD-POTHOLE-EA, HC-HDD-PIT-EA, HC-HDD-FLUID-DISP-CY are platform-baseline estimates; only HC-HDD-SM-2IN-LF is derived (WisDOT 671.0212) |
| 2026-10-08 | w20 | directional_drilling | source_doubt | HDD Consortium guidelines and NASTT not cited — no verifiable public URL; USACE ERDC/GSL TR-02-9 blocked by DTIC (403) |
| 2026-10-08 | w20 | directional_drilling | source_doubt | excavation-wisdot-aup note lists only the 205/209 items; HC-HDD-SM-2IN-LF cites item 671.0212 in its own prov note — consider extending the shared source note |
| 2026-10-08 | w20 | directional_drilling | vocab | Equipment vocab lacks hdd_rig, vacuum_excavator, auger_boring_machine |
| 2026-10-08 | w20 | directional_drilling | scope | pullback_log QA cites platform-baseline (safe pull load from pipe maker; same-day pull rule is FDOT 555-4.1); frac_out hazard maps to general PPE 1926.28(a) |
| 2026-10-08 | w20 | rail_track | es_safety | 12 hazards + 7 safety QA items + checklist safety items pending human ES translation |
| 2026-10-08 | w20 | rail_track | cost_estimate | All 6 HC-RR-* assemblies are platform-baseline estimates — no public DOT bid tab with track items found (WisDOT AUP only has 204.0200 removal + 801.0117 flagging at $1); HC-RR-FLAGGER-DAY $1,200/day is a placeholder (each railroad bills its own rate) |
| 2026-10-08 | w20 | rail_track | vocab | Equipment vocab lacks rail-specific types: hi_rail_truck, tamper, ballast_regulator, spiker |
| 2026-10-08 | w20 | rail_track | scope | 49 CFR 213 excludes plant railroads (213.3(b)); private industry-track acceptance follows the serving railroad's industry-track standard — confirm QA/checklist wording with an owner |
| 2026-10-08 | w20 | rail_track | source_doubt | FHWA Railroad-Highway Grade Crossing Handbook URL returned 403 — not cited; crossing practice rests on AREMA ref-only + platform estimate |
| 2026-10-08 | w20 | telecom_outside_plant | es_safety | 11 hazards + 6 safety QA items + 5 inspection checklist items need human Spanish translation |
| 2026-10-08 | w20 | telecom_outside_plant | cost_estimate | HC-TEL-FIBER-AERIAL-LF (all), HC-TEL-OTDR-FIBER-EA (all), material on HC-TEL-FIBER-UG-LF, HC-TEL-CLOSURE-EA, HC-TEL-SPLICE-EA — no public bid source (WisDOT 678 items are install-only, cable/enclosures state-furnished) |
| 2026-10-08 | w20 | telecom_outside_plant | source_doubt | RUS Bulletins 1753F-150/151/152 (buried/underground/aerial) return 403 on rd.usda.gov and were not read; aerial is 1753F-152 — verify buried depth and aerial practices against them |
| 2026-10-08 | w20 | telecom_outside_plant | source_doubt | 1926 Subpart V not cited (1926.950 scope is electric T&D, not telecom); 1910.268 noted in prose only; overhead power hazard mapped to 1926.416(a)(1) |
| 2026-10-08 | w20 | telecom_outside_plant | source_doubt | SpringNet (City Utilities of Springfield MO) standard used for dual lashing / strand-splice-near-pole / strand bonding — owner-specific; licensed gov_open as a municipal utility, confirm |
| 2026-10-08 | w20 | telecom_outside_plant | vocab | No equipment types for cable plow, bucket truck, splice trailer, cable blower — mapped to trencher / boom_lift / generator / air_compressor |
| 2026-10-08 | w20 | telecom_outside_plant | scope | NESC communication-to-power clearances are reference-only and not stored; clearance QA item defers to pole-owner/permit values |
| 2026-10-08 | w20 | pipeline | es_safety | 11 hazards + 1 safety QA item (test_pressure_and_duration) + 5 inspection-checklist items pending human ES translation |
| 2026-10-08 | w20 | pipeline | cost_estimate | All 7 HC-PIPE-* assemblies are platform-baseline estimates (no public transmission-pipeline unit-price source); line pipe excluded (owner-furnished) |
| 2026-10-08 | w20 | pipeline | vocab | No sideboom / dozer / padding_machine / pipe-stringing trailer equipment types; sideboom mapped to `crane` (1926.1440 treats sidebooms as cranes) |
| 2026-10-08 | w20 | pipeline | source_doubt | PHMSA construction page returns 403 to curl (context only); INGAA Foundation guidance not cited — ingaa.org rate-limited (429) |
| 2026-10-08 | w20 | pipeline | source_doubt | Hydrotest stored-energy hazard mapped to 1926.21(b)(2) (training) — no specific 1926 section covers pressure testing |
| 2026-10-08 | w21 | commissioning_agent | es_safety | 6 hazards (hazard_es + controls_es) + 1 safety QA item (life_safety_witnessed) pending human translation |
| 2026-10-08 | w21 | commissioning_agent | source_doubt | UFGS 01 91 00 page body/PDF not script-readable (403/empty shell); deliverable steps/QA paraphrased from section structure — confirm against the PDF |
| 2026-10-08 | w21 | commissioning_agent | source_doubt | "~10-month" warranty-period review is common industry practice, not quoted from a cited source |
| 2026-10-08 | w21 | commissioning_agent | scope | residential-mf template "HVAC & life-safety systems commissioning" is trade_type general — consider retagging to commissioning_agent |
| 2026-10-08 | w21 | geotech | es_safety | 6 hazards (hazard_es/controls_es) pending human translation |
| 2026-10-08 | w21 | geotech | vocab | No `drill_rig` equipment type — the boring step carries no equipment; consider adding drill_rig to equipment-vocab |
| 2026-10-08 | w21 | geotech | scope | Proof roll and footing bearing observation overlap the materials_testing and special_inspection packs — confirm ownership |
| 2026-10-08 | w21 | geotech | source_doubt | Frost depth 48 in. taken from the reused patio_covers_awnings-wi-sps321 source note (SPS 321.16); the section text was not re-read in this wave |
| 2026-10-08 | w21 | home_inspection | es_safety | 7 hazards (hazard + controls) pending human Spanish translation |
| 2026-10-08 | w21 | home_inspection | source_doubt | Standards are at Wis. Stat. 440.975 and SPS 131.31–131.33 (moved from SPS 134 by CR 14-010); SPS 132–134 appear to have no current home-inspection rules — confirm |
| 2026-10-08 | w21 | home_inspection | source_doubt | QA `report_delivered_on_time`: 24–48 h delivery is industry practice, not a Wisconsin rule (confidence derived) |
| 2026-10-08 | w21 | home_inspection | scope | Pack is anchored to Wisconsin rules; other states' licensing and report rules differ. 1926 hazard refs kept although many home inspectors are not construction employers |
| 2026-10-08 | w21 | surveying | source_doubt | ALTA/NSPS 2021 standards PDF not fetchable (NSPS 403); kept proprietary_ref_only, paraphrase only — confirm public availability |
| 2026-10-08 | w21 | surveying | scope | QA items control_redundant / layout_checked / foundation_location_checked are platform-baseline practice; foundation location survey requirement varies by WI municipality/lender |
| 2026-10-08 | w21 | surveying | vocab | Equipment vocab has no survey instruments (total_station / gnss_receiver); none added |
| 2026-10-08 | w21 | surveying | es_safety | 7 hazards (hazard_es/controls_es) pending human translation |
| 2026-10-08 | w21 | special_inspection | source_doubt | IBC 2021 Ch.17 section numbers (1704.2.1/.2.3/.2.4/.2.5, 1704.6, 1705.2–1705.6) cited from edition knowledge (codes.iccsafe.org 403) — verify against the adopted edition |
| 2026-10-08 | w21 | special_inspection | source_doubt | WI SPS 361.03(15) note cites SPS 362.1700 (IBC 1711–1716) but 362.1700 is absent from the current SPS 362 TOC — confirm whether WI applies any ch.17 reporting rule; pack tells users to check with the local official |
| 2026-10-08 | w21 | special_inspection | scope | Hazard deck_edge cites 1926.760(a)(1) (written for steel-erection employees) for an inspector walking erection areas — confirm vs 1926.501; dependency hint (after rebar/concrete/steel/masonry/deep foundations/fireproofing) — confirm services packs should add DAG edges |
| 2026-10-08 | w21 | special_inspection | es_safety | 7 hazards (hazard + controls) pending human Spanish translation |
| 2026-10-08 | w21 | energy_rating | es_safety | 7 hazards + 1 safety QA (qa_house_restored) pending human Spanish translation |
| 2026-10-08 | w21 | energy_rating | source_doubt | RESNET hers-index URL redirects to "HERS Index and Energy Codes"; the reference-home = 100 scale is not visible in the fetched page text (left out of pack text) — confirm |
| 2026-10-08 | w21 | energy_rating | source_doubt | No 1926 heat standard — attic_heat uses 1926.21(b)(2); fall through ceiling joists mapped to 1926.501(b)(4)(i) as nearest |
| 2026-10-08 | w21 | energy_rating | scope | No blueprint template task uses energy_rating; consider a residential commissioning-phase task "Blower door & duct leakage testing / HERS rating" |
| 2026-10-08 | w21 | utility_locating | es_safety | 5 hazards + 5 safety QA items + 5 inspection-checklist items pending human ES translation |
| 2026-10-08 | w21 | utility_locating | vocab | No equipment types for GPR unit / EM locator / vacuum excavator — equipment omitted; propose gpr_unit, em_locator, vacuum_excavator |
| 2026-10-08 | w21 | utility_locating | source_doubt | APWA uniform color code page returns 403 to scripts — not cited; colors taken from Wis. Stat. 182.0175(2m)(b) + CGA (purple/reclaimed is CGA/APWA only, not in WI list) |
| 2026-10-08 | w21 | utility_locating | source_doubt | CGA Best Practices printed guide is sold (online search free) — kept association_public, concepts only, no numbers |
| 2026-10-08 | w21 | utility_locating | scope | Pack is Wisconsin-anchored (3 working days, 10-day ticket rule, 18 in clearance); other states' one-call rules differ — candidate for jurisdiction-layer data |
| 2026-10-08 | w21 | materials_testing | es_safety | 7 hazards (hazard + controls) pending human Spanish translation |
| 2026-10-08 | w21 | materials_testing | source_doubt | NRC portable-gauge guidance (NUREG-1556 Vol. 1) returns 403 to scripts and was not cited; gauge licensing rests on 10 CFR 30.3 + 29 CFR 1926.53(a) |
| 2026-10-08 | w21 | materials_testing | source_doubt | WisDOT concrete test frequencies are in std spec Table 710-5 (referenced from CMM 870), not transcribed; QA says "at the frequency the spec sets" |
| 2026-10-08 | w21 | materials_testing | scope | No table holds soil-density or asphalt-core results (only concrete_test_records exists); consider one if testing-agency reports should be captured |
| 2026-10-08 | w22 | estimating_services | es_safety | 7 site-walk hazards (hazard_es/controls_es) pending human translation |
| 2026-10-08 | w22 | estimating_services | source_doubt | QA `bid_leveling` has no verified public standard — cited platform-baseline, confidence estimate |
| 2026-10-08 | w22 | estimating_services | source_doubt | GSA P120 gsa.gov URL paths 404; cited WBDG mirror (GSA directives page /directives-library/178490 also live) |
| 2026-10-08 | w22 | estimating_services | source_doubt | AACE 18R-97/56R-08 cited via public sample PDFs only (proprietary_ref_only); no class accuracy ranges stored |
| 2026-10-08 | w22 | architect | es_safety | 6 hazards (hazard_es/controls_es) pending human translation |
| 2026-10-08 | w22 | architect | source_doubt | SPS 361.30 (state plan-review thresholds) not fetched — confirm which WI commercial buildings need state vs municipal review beyond the Wis. Stat. 443.15 exemptions |
| 2026-10-08 | w22 | architect | source_doubt | AIA B101/A201/G704 used as concepts from public summaries only — confirm no proprietary form language |
| 2026-10-08 | w22 | construction_management | es_safety | 6 hazards (hazard_es/controls_es) pending human translation |
| 2026-10-08 | w22 | construction_management | source_doubt | Wisconsin conditional/unconditional lien-waiver practice is industry convention, not set by 779.02/779.06 — owner to confirm wording |
| 2026-10-08 | w22 | construction_management | scope | Lien-notice QA item is Wisconsin-only; other states' notice rules are not covered |
| 2026-10-08 | w22 | permit_expediting | es_safety | 5 hazards (hazard/controls) pending human Spanish translation |
| 2026-10-08 | w22 | permit_expediting | scope | Pack prose and QA are Wisconsin-anchored (SPS 320/361, Madison, Dane County); other states' plan-review thresholds and expirations differ — consider per-state notes from the jurisdiction engine |
| 2026-10-08 | w22 | permit_expediting | source_doubt | SPS 361.30 Table 361.30-1 exemption (< 25,000 cu ft for A-2/A-3/B/F/M/S/U) parsed from PDF text — confirm the row applies to all listed groups |
| 2026-10-08 | w22 | permit_expediting | source_doubt | UDC permit cited at SPS 320.08/320.09 (320.07 is definitions) |
| 2026-10-08 | w22 | safety_consulting | es_safety | 7 hazards + 4 safety QA items (written_programs, fall_plan, silica_plan, competent_persons) need human ES translation |
| 2026-10-08 | w22 | safety_consulting | source_doubt | OSHA 3886 "Recommended Practices for Safety and Health Programs in Construction" URL/pub number and osha.gov/training/outreach not script-verifiable (403) — confirm |
| 2026-10-08 | w22 | safety_consulting | source_doubt | silica_dust hazard cites 1926.1153(g)(1)(iv) (employer plan-content duty) for a visiting consultant — confirm framing |
| 2026-10-08 | w22 | safety_consulting | scope | State OSHA 10/30 card mandates (several states, unverified) not in pack; consider a state note after verification |
| 2026-10-08 | w22 | engineering | es_safety | 7 hazards (hazard_es/controls_es) pending human translation |
| 2026-10-08 | w22 | engineering | source_doubt | No "SPS 362 deferred submittals" section exists; pack uses SPS 361.30(3) component/system plan approval instead |
| 2026-10-08 | w22 | engineering | source_doubt | QA rfi_turnaround and conformance_letter are contract practice, not statute (confidence 'derived') |
| 2026-10-08 | w22 | engineering | scope | WI SPS 361.03(15) global deletions may change which IBC 1704.6 structural observation reports are filed with the official — confirm local practice |
| 2026-10-08 | w22 | environmental_consulting | es_safety | Spanish for 7 hazards (hazard and controls) and the `exposure_monitoring_report` QA item is pending human translation |
| 2026-10-08 | w22 | environmental_consulting | source_doubt | `phase_ii_plan` QA prov note names ASTM E1903 (proprietary) by number only; it has no SOURCES entry — add a ref-only source or drop the mention |
| 2026-10-08 | w22 | environmental_consulting | scope | PCB, mercury and universal-waste survey items appear only in a glossary definition and have no QA item; decide whether to add one |
| 2026-10-08 | w22 | interior_design | es_safety | 4 hazards (hazard_es/controls_es) + QA finish_rating_backup item_es pending human translation |
| 2026-10-08 | w22 | interior_design | scope | QA procurement_tracked — "update at least every two weeks" cadence is a platform-baseline default |
| 2026-10-08 | w22 | interior_design | source_doubt | interior_design-cidq-exams — cidq.org returns 403 to scripts; confirmed via web search only; ncidq.org is a parked domain (do not cite) |
| 2026-10-08 | w22 | interior_design | scope | WI interior designer law is in Wis. Stat. ch. 443 (title law only; 443.175 seal acceptance) — confirm against DSPS before marking reviewed |
| 2026-10-08 | w23 | general | scope | 25 template tasks tagged umbrella `general`; consider retagging to finer keys (final_clean, construction_management, commissioning_agent…) so child-pack knowledge reaches them |
| 2026-10-08 | w23 | civil | scope | 3 template tasks tagged umbrella `civil`; consider retagging to excavation/site_utilities/erosion_control so child-pack knowledge reaches them |
| 2026-10-08 | w23 | site_services | es_safety | 6 hazards + 3 safety QA items (temp_power_gfci, temp_wiring, temp_lighting) need human Spanish translation |
| 2026-10-08 | w23 | site_services | source_doubt | Temp-fence install guidance cites a NZ rental supplier sheet (Hirepool IFU-099); replace with a US temp-fence manufacturer instruction sheet if one is found |
| 2026-10-08 | w23 | site_services | source_doubt | fence_blowover hazard has no specific OSHA standard; tied to 1926.20(b)(2) competent-person inspections (confidence derived) |
| 2026-10-08 | w23 | reality_capture | es_safety | 6 hazards (hazard + controls) pending human Spanish translation |
| 2026-10-08 | w23 | reality_capture | source_doubt | USIBD LOA spec is paid — QA cites LOA level names only, no tolerances; confirm acceptable |
| 2026-10-08 | w23 | reality_capture | source_doubt | BIMForum LOD classed association_public (free download, copyrighted); bimforum.org 403s bare HEAD — expect pack:verify-sources warning |
| 2026-10-08 | w23 | reality_capture | scope | No 29 CFR 1926 drone standard; drone-over-crews hazard anchored to 1926.21(b)(2) general training + 14 CFR 107.39/107.49 |
| 2026-10-08 | w23 | equipment_rental | es_safety | 7 hazards + 4 safety QA items + 2 delivery_receipt checklist items have Spanish pending human translation |
| 2026-10-08 | w23 | equipment_rental | source_doubt | No public ARA safety guide text found (americanrental.org is a parked domain; only the ararental.org RentalU page was verified). Rental-desk practices (walk-around, off-rent, damage waiver, meters) rest on platform-baseline |
| 2026-10-08 | w23 | equipment_rental | source_doubt | OSHA aerial lift fact sheet returns 403 to scripts — used for framing only; ANSI A92.22/.24 cited by number only (source URL is the SAIA homepage) |
| 2026-10-08 | w23 | equipment_rental | scope | 1926.453 covers boom platforms; scissor lifts fall under Subpart L scaffold rules (1926.451). Hazards framed for boom lifts; consider a scissor-lift item |
