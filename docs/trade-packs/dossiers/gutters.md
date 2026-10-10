# Dossier — `gutters` (Gutters & Downspouts)

> Wave: w04 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/gutters.ts` · Status: draft
> Taxonomy: category `envelope` · permit_trade `null` · phase `finishes_exterior` · CSI `07 71 23`

## Scope (2–4 sentences)
Collects roof runoff at the eaves and carries it away from the building: seamless aluminum (or steel/copper)
gutters roll-formed on site, hangers, outlets, downspouts, extensions / drain tie-ins, optional gutter guards
and heat cable, and tear-off/replacement of old systems. Does NOT do: drip edge and step/kick-out flashing
(roofing / siding — coordinated, checked), fascia carpentry beyond small rot repair, heat-cable circuits
(electrical), underground storm piping beyond the downspout tie-in (site utilities / landscaping).

## Existing coverage reconciled
- Hand recipe: none → pack is the NEW-TRADE pattern (2 recipes, no gates, no code refs — permit_trade null).
- Catalog codes already seeded: `B-GUTTER-LF` (gutter + downspout, aluminum K-style, building bucket, 0037)
  → referenced from quantity_rules, not redeclared. Pack pins `est_bucket: 'building'` so new `B-GUT-` codes
  sit beside it. Kick-out flashing assembly is owned by siding (`B-SID-KICKOUT-EA`) — QA check only here.
- Blueprint template tasks hitting this trade: `Gutters, downspouts & flashing` (residential-sf),
  `Flashing, gutters & roof drainage` (residential-mf), `Gutters & downspouts` (pole-barn), plus the
  component augment `Gutters & downspouts install` (core token `gutters_downspouts`) — all match
  `seamless_gutter_install`; guard/replacement titles go to `gutter_replace_guards` (priority 10).

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| gutters-doe-basc | DOE BASC — Gutters and Downspouts | 1 | gov_open | slope, downspout spacing 20–50 ft, discharge ≥5 ft / ≥10 ft catchment, no footing-drain tie-in, kick-outs |
| gutters-ufgs-07-60-00 | UFGS 07 60 00 Flashing and Sheet Metal §3.1.17–3.1.18 | 1 | public_domain | hangers ≤30 in., uniform slope / high point midway, slip joints, below roof slope line, downspout joints + straps |
| gutters-amerimax-metal-install | Amerimax — Installing Metal Gutter Systems | 5 | manufacturer_public | ¼ in. per 10 ft string line, under drip edge, hanger 24 in. / 18 in. heavy snow, extensions |
| gutters-amerimax-faq | Amerimax How-To FAQ | 5 | manufacturer_public | pitch, 1 downspout per ~20 ft, 2 bands per 10 ft, seal seams, don't mix metals |
| gutters-amerimax-guard | Amerimax — Hinged Gutter Guard sheet | 5 | manufacturer_public | clean before guards, install per maker |
| gutters-smacna-asmm | SMACNA Architectural Sheet Metal Manual 7th Ed. | 4 | proprietary_ref_only | concept only — sizing by roof area/rainfall, expansion joints |
| sid-doe-basc-kickout | DOE BASC — Step and kick-out flashing (existing) | 1 | gov_open | kick-out QA |
| icc-pa | IRC R801.3 Roof drainage (existing) | 3 | proprietary_ref_only | discharge QA (reference only; no code_refs — no permit family) |
| ecfr-1926-{x,k,m,e,i,l} | 29 CFR 1926 Subparts X, K, M, E, I, L (existing) | 1 | public_domain | hazards |
| platform-baseline | The Jobsite national cost baseline | — | platform_estimate | all assembly costs |

## Work steps (draft → pack recipes)
`seamless_gutter_install` (example "Gutters & downspouts install"):
1. **Walk the eaves and lay out downspouts** — power-line check, fascia/drip edge, downspout spots. QA fascia_sound, downspout_spacing, size_for_roof.
2. **Snap the slope line** — high point midway, ~¼ in./10 ft toward outlets. QA slope_to_outlets.
3. **Form, cut and assemble the gutter** — machine guards, seal + rivet caps/miters, no mixed metals, slip joints on long runs. QA seams_sealed, expansion_joints.
4. **Hang the gutter on the line** — under drip edge, front below roof plane, hangers 24 in. (≈18 in. WI snow). QA behind_drip_edge, hanger_spacing.
5. **Run the downspouts** — telescope downhill, strap top/bottom/between, kick-outs present. QA downspout_fastening, kickout_present.
6. **Carry water away and test** — ≥5 ft discharge or solid pipe, never footing drain; hose test; sweep chips. QA discharge_distance, water_test, cleanup_shavings.

`gutter_replace_guards` (example "Replace gutters and install gutter guards", priority 10): set up below +
overhead lines → take down old gutters / fix fascia → hang or re-hang to slope → clean, flush, install guards
→ water test and clean up.

## Hazards (draft → pack hazards)
| id | Hazard | Controls | OSHA ref | Sev |
|---|---|---|---|---|
| ladder | Fall from extension ladder | 3 ft extension, 4:1, standoffs, 3 points | 1926.1053(b)(1) | 3 |
| ladder_conductive | Metal ladder into conductors | nonconductive side rails | 1926.1053(b)(12) | 4 |
| power_line | Aluminum runs/coil into service drop | locate, keep clear, utility cover | 1926.416(a)(1) | 4 |
| roof_edge_fall | Fall from roof edge (residential) | guardrail/net/PFAS ≥6 ft | 1926.501(b)(13) | 4 |
| falling_objects | Struck by dropped sections/tools | barricade, lower by hand, hard hats | 1926.501(c) | 3 |
| sheet_metal_cut | Cuts from sharp metal | cut-resistant gloves | 1926.95(a) | 2 |
| eye_flying | Chips, rivet stems, debris | safety glasses | 1926.102(a)(1) | 2 |
| gutter_machine | Caught in roll-former | guards on, lockout to clear jams | 1926.300(b)(1) | 3 |
| cord_shock | Shock from tools/cords | GFCI | 1926.404(b)(1) | 3 |
| aerial_lift | Fall from boom lift basket | harness + lanyard | 1926.453(b)(2)(v) | 4 |

OSHA text verified on law.cornell.edu mirror (1053(b)(12), 416(a)(1), 501(b)(13), 501(c)).

## QA checklist
- [ ] fascia_sound · slope_to_outlets (≥ mfr ¼ in./10 ft; UFGS high point midway; DOE ≥1/16 in./ft — follow spec)
- [ ] behind_drip_edge · hanger_spacing (24 in., ~18 in. snow; UFGS ≤30 in.) · seams_sealed · expansion_joints
- [ ] downspout_spacing (DOE 20–50 ft) · size_for_roof · downspout_fastening · discharge_distance (DOE + IRC R801.3 ref)
- [ ] kickout_present · water_test · guards_per_mfr · heat_cable_gfci (safety) · cleanup_shavings

## Inspection / acceptance checkpoints
- `drainage_check`: hose test, discharge ≥5 ft / solid pipe, no footing-drain tie-in, kick-outs.
- `final_walkthrough`: straight + tight, hangers + sealed caps, downspouts plumb/strapped, guards + color, cleanup.

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| B-GUT-DS-LF | Extra 3x4 downspout run | LF | 450 | 0.06 | 0 | 5 | platform-baseline, estimate |
| B-GUT-EXT-EA | Extension + splash block | EA | 2500 | 0.25 | 0 | 0 | platform-baseline, estimate |
| B-GUT-GUARD-LF | Metal mesh gutter guard | LF | 400 | 0.04 | 0 | 5 | platform-baseline, estimate |
| B-GUT-HEAT-LF | De-icing heat cable (circuit by electrician) | LF | 900 | 0.06 | 0 | 5 | platform-baseline, estimate |
| B-GUT-REMOVE-LF | Remove + dispose old gutters | LF | 0 | 0.03 | 25 | 0 | platform-baseline, estimate |

## Quantity rules
- `B-GUTTER-LF` (existing) = component `gutters_downspouts` × 160 (residential_sf) / × 320 (residential_mf).
- `B-GUT-EXT-EA` = component `gutters_downspouts` × 4 (residential_sf) / × 8 (residential_mf).
- Guards, heat cable, extra downspout, removal: option/remodel scope — no rule (no blueprint fact).

## Blueprint callouts (components)
- none new — reuses core token `gutters_downspouts` (`/\bGUTTERS?\b|\bDOWNSPOUT/i`).

## Open questions → REVIEW_QUEUE
- Slope guidance conflict: mfr ¼ in./10 ft vs DOE BASC ≥1/16 in./ft — pack says "follow spec, at least mfr minimum".
- DOE BASC advises avoiding gutters in cold/very cold climates (grade-level drainage instead) — WI practice
  differs; worth an owner note.
- Vocab: `gutter_roll_former` (trailer-mounted seamless machine) not in equipment vocab.
- All 5 assembly costs are `estimate`; LF allowances (160 / 320) are rough.
