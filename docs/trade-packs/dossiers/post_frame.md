# Dossier — `post_frame` (Post-Frame Construction)

> Wave: w07 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/post_frame.ts` · Status: draft
> Taxonomy: category `structural` · permit_trade `building` · phase `framing` · CSI `06 13`

## Scope
Builds post-frame (pole barn) structures: stakes and augers column holes, sets footing pads or piers,
sets treated / laminated columns with uplift anchorage, plumbs and braces them, backfills or pours collars,
then hangs splash plank, wall girts, roof purlins and permanent bracing, and checks the steel skin is
fastened to the diaphragm design. Hand-offs: truss supply and setting (`truss_setting`, B-TRS-*), metal
panel install/trim (`metal_panels`, `roofing`, `siding`), slab (`concrete`), overhead doors.

## Existing coverage reconciled
- Hand recipe: none → NEW-TRADE pattern (3 recipes with `example_title`).
- Catalog codes already seeded: none for post-frame (B-FOOTING is a continuous footing; B-FRAME-SF is the
  hand-seeded stick-frame line — not redeclared).
- Blueprint template tasks: `Set post-frame columns / poles & plumb` (pole-barn.ts, framing) → `set_columns`.
  Components `post_frame_columns`, `wall_girts`, `roof_purlins`, `metal_roofing`, `metal_siding` exist; used
  `post_frame_columns` in quantity rules; no components added.

## Sources used
| id | Title | Tier | License | Used for |
|---|---|---|---|---|
| post_frame-nfba-guide-spec | NFBA Guide Specification for Post-Frame Building Systems | 4 | association_public | foundation options, UC4B/UC4A treatment, backfill types, fasteners, temporary bracing, no field cuts, tolerance docs |
| post_frame-asabe-eps | ASABE EP 484 / 486 / 559 | 3 | proprietary_ref_only | named as design standards only |
| post_frame-wi-stat-101-01 | Wis. Stat. 101.01 | 1 | gov_open | WI farm-building scope note (101.01(11) excludes farming from "place of employment") |
| ufgs-06-10-00 | UFGS 06 10 00 Rough Carpentry | 1 | public_domain | purlin/connection QA practice |
| icc-pa | IBC 1807.3, 1809.5, 2304.12, 2306.1; IRC R317.1.4, R317.3, R403.1.4.1 | 3 | proprietary_ref_only | code refs (section + paraphrase) |
| ecfr-1926-c/e/h/i/l/m/o/p/cc | 29 CFR 1926 | 1 | public_domain | hazards (sections verified on law.cornell.edu mirror) |

## Work steps
- `set_columns` (template task): check holes/pads [footing] → set columns + uplift anchor → plumb/align/brace → backfill or collar, recheck [framing].
- `post_holes_pads` (priority 10): locate utilities + stake → auger → set/pour pads or piers [footing] → uplift collars + backfill.
- `girts_purlins_bracing`: splash plank + girts → purlins (after trusses set by truss_setting) → permanent bracing → diaphragm screw pattern check [framing].

## Hazards
utility_strike 1926.651(b)(1) · open_hole 1926.501(b)(4)(ii) · auger_entangle 1926.300(b)(2) · column_tipover 1926.20(b)(1) ·
suspended_load 1926.1425(b) · power_line 1926.1408(a) · rigging 1926.251(a)(1) · fall_edge 1926.501(b)(1) ·
steep_roof 1926.501(b)(11) · aerial_lift 1926.453(b)(2)(v) · backing_equipment 1926.602(a)(9)(ii) · panel_cut 1926.95(a).
Telehandler with hook/winch is covered by Subpart CC (1926.1400(c)(8) exclusion only applies to forklift use without one).

## QA checklist
15 items (layout, hole depth/frost, pad bearing, UC4B treatment, uplift anchor, plumb tolerance, backfill lifts,
laminated fasteners, UC4A splash/girts, purlin spacing, no field cuts, diaphragm fasteners; safety: bracing
kept until permanent, holes covered, utilities located).

## Inspection / acceptance checkpoints
- footing: holes/pads/piers per sealed design.
- framing: treatment tags, uplift + backfill, plumb, bracing, diaphragm screw pattern.
- final: temp bracing gone only after permanent, splash plank + grade.

## Cost basis (all platform-baseline estimates, 2026)
| Code | Item | Unit | Mat ¢ | Lab hr | Eq ¢ | Waste % |
|---|---|---|---|---|---|---|
| B-PF-COLUMN-EA | 3-ply laminated column, set/plumb/brace | EA | 18000 | 1.5 | 2000 | 0 |
| B-PF-FOOTING-EA | Augered hole + pad + uplift collar + backfill | EA | 5500 | 1.25 | 3000 | 5 |
| B-PF-SECFRAME-SF | Girts, purlins, splash plank, bracing per SF footprint | SF | 160 | 0.025 | 15 | 10 |

## Quantity rules
- B-PF-COLUMN-EA, B-PF-FOOTING-EA = area_sf_sum × 0.01 (ceil) when `post_frame_columns` callout.
- B-PF-SECFRAME-SF = area_sf_sum when building type `pole_barn`.

## Open questions → REVIEW_QUEUE
- Costs estimate-only. Column count is a density heuristic, not the column schedule.
- Hand-seeded B-FRAME-SF also fires on area for pole-barn plans → possible double-count with B-PF-SECFRAME-SF.
- No `earth_auger` equipment type; skid_steer used.
- WI farm buildings outside the state commercial code (Wis. Stat. 101.01(11)); DSPS FAQ saying electrical/plumbing still apply (90% farm-product tests) could not be retrieved (404) — unverified, not encoded.
