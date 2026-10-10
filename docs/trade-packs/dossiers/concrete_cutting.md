# Dossier — `concrete_cutting` (Concrete Cutting / Coring)

> Wave: w08 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/concrete_cutting.ts` · Status: draft
> Taxonomy: category `concrete_masonry` · permit_trade `null` · phase `foundation` · CSI `03 81`

## Scope (2–4 sentences)
Diamond cutting and drilling of EXISTING concrete and masonry: flat/slab sawing (trenches, openings,
pavement), core drilling (penetrations for MEP, anchors), track-mounted wall sawing (door/window/egress
openings), and wire sawing (thick or irregular sections). Includes scan-before-cut coordination, slurry
capture/disposal and handing off guarded openings. Excludes control-joint sawing in new flatwork
(`concrete_flatwork`, B-FLAT-SAWCUT-LF), curb-cut removal (B-CFW-CURBCUT-LF), structural design and
shoring design (engineer), GPR as a stand-alone service (priced here as G-CUT-GPR-EA because the cutter
usually subs it), and haul-off of debris beyond the break-out (`hauling`/`demolition`).

## Existing coverage reconciled
- Hand recipe: none (`permit_trade: null`, not in `nopermit.ts`) → NEW-TRADE pattern, 3 recipes.
- Catalog codes already seeded: B-FLAT-SAWCUT-LF (new-flatwork control joints), B-CFW-CURBCUT-LF (curb
  opening) — not redeclared; scopes differ (existing structural concrete).
- Blueprint template tasks hitting this trade: none.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| ecfr-1926-z | 29 CFR 1926.1153 Table 1 | 1 | public_domain | silica hazards: entries (ii) handheld saws, (iv) walk-behind saws, (vi) rig-mounted core drills, (vii) handheld/stand drills, (x) jackhammers; (f) housekeeping; (g) written plan |
| ecfr-1926-i | Subpart I — tools | 1 | public_domain | 1926.300(b)(1)-(2) guards, 1926.302(a)(1), (c)(2), (d)(2) |
| ecfr-1926-k | Subpart K | 1 | public_domain | 1926.404(b)(1) GFCI, 1926.416(a)(3) concealed circuits |
| ecfr-1926-m | Subpart M | 1 | public_domain | 1926.501(b)(4)(i),(iii) holes/falling objects |
| ecfr-1926-t | Subpart T | 1 | public_domain | 1926.850(a) engineering survey (cut openings = partial demolition) |
| ecfr-1926-h / e / c | Subparts H, E, C | 1 | public_domain | rigging 1926.251(a); 1926.95(a); 1926.25(a) |
| demolition-ufgs-02-41-00 | UFGS 02 41 00 (Aug 2022) | 1 | public_domain | §1.3 supports for cutting + approval; §3.1.7 straight saw lines, aligned faces, broken face only where concealed |
| concrete_cutting-wisdot-slurry | WisDOT/WDNR concrete slurry fact sheet (Jul 2026) | 1 | gov_open | slurry is regulated wastewater; no discharge to waters; pH 6–9 + daily log; solids per NR 500–538 |
| concrete_cutting-mpca-slurry | MPCA slurry guidance | 1 | gov_open | keep slurry out of storm drains; on-site only with BMPs |
| concrete_cutting-csda / -csda-standards | CSDA + Standards/Specs/Best Practices (BP-007, BP-026) | 4 | association_public | scan-before-cut concepts by title only (library 403 to scripts) |
| concrete_repair_lifting-call811 | 811 | 4 | association_public | slab-on-grade cuts reaching soil |
| restoration-niosh-co | NIOSH CO | 1 | gov_open | gas saws indoors |

## Work steps (draft → pack recipes)
- `core_drilling` (prio 2): confirm locations + scan → set up rig/water/below → drill wet → clean up & hand off.
- `wall_wire_sawing` (prio 2): engineer detail + shoring → layout/track/corner cores → cut wet, pin pieces → remove, dress, clean.
- `slab_sawing` (prio 1, catch-all incl. "concrete cutting"): mark + scan → water/slurry/power → cut in passes → break out & protect.
No gates, no code refs (null permit).

## Hazards (draft → pack hazards)
12: silica_walk_wall, silica_handheld, silica_coring, silica_breaking (1926.1153(c)(1)); embedded_electrical
(1926.416(a)(3)); pt_tendon_structure (1926.850(a)); struck_by_cut_piece (1926.501(b)(4)(iii)); open_holes
(1926.501(b)(4)(i)); saw_guard_kickback (1926.300(b)(1)); wet_electrical (1926.404(b)(1)); engine_exhaust
(1926.302(c)(2)); slurry_skin (1926.95(a)). Wall and wire saws are NOT Table 1 entries → 1926.1153(d)
assessment; pack applies walk-behind controls as a conservative default (flagged).

## QA checklist
14 items — 7 safety (scan_marked, structural_ok, silica_controls, below_protected, piece_secured,
shoring_in_place, holes_covered) pending ES; others translated.

## Inspection / acceptance checkpoints
scan_before_cut · structural_approval · slurry_plan · final_walkthrough.

## Cost basis (all platform-baseline estimates, 2026)
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % |
|---|---|---|---|---|---|---|
| G-CUT-CORE-SM-EA | core ≤6 in. dia, ≤8 in. thick | EA | 1500 | 0.75 | 2500 | 0 |
| G-CUT-CORE-LG-EA | core 8–12 in. dia, ≤8 in. thick | EA | 4000 | 1.5 | 4500 | 0 |
| G-CUT-FLATSAW-LF | flat saw ≤6 in. deep | LF | 150 | 0.04 | 150 | 0 |
| G-CUT-WALLSAW-LF | wall saw ≤12 in. wall | LF | 600 | 0.4 | 900 | 0 |
| G-CUT-GPR-EA | GPR scan per location | EA | 0 | 0.25 | 5000 | 0 |

## Quantity rules
None — blueprint facts carry no penetration/opening counts; a `const` rule would guess scope.

## Blueprint callouts (components)
None this wave.

## Open questions → REVIEW_QUEUE
- Wall/wire saw silica controls by analogy to Table 1 (iv) — confirm with an exposure assessment source.
- CSDA library is 403 to scripted fetch; BP numbers confirmed via press coverage only.
- All 5 costs are estimates.
- Equipment vocab lacks `hydraulic_power_unit`, `core_rig`, `wall_saw`, `gpr_scanner`.
