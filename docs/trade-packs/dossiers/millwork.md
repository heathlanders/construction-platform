# Dossier — `millwork` (Architectural Millwork)

> Wave: w15 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/millwork.ts` · Status: draft
> Taxonomy: category `interior` · permit_trade `null` · phase `finishes_interior` · CSI `06 40`

## Scope
Shop-built commercial architectural woodwork: plastic-laminate and wood-veneer casework, reception /
transaction desks, wood wall paneling and custom trim packages to an AWI grade. Covers shop drawings,
field verification, in-wall blocking coordination, acclimation, install, scribe, adjust and touch-up.
NOT: residential stock cabinets (`cabinetry`), countertop fabrication (`countertops`), site trim
(`finish_carpentry`), doors/frames/hardware (`doors_hardware`).

## Existing coverage reconciled
- Hand recipe: `task-buildout/nopermit.ts` case `millwork` (shared with cabinetry/countertops:
  Field-verify & layout → Install & scribe) → pack **complements** (`recipes: []`, `millwork` in HAND_RECIPE_KEYS).
- Catalog codes already seeded: none `G-MW-*`. Adjacent: G-CAB-BASE/UPPER-LF (residential stock),
  G-CB-*, G-CT-*/G-CTOP-LF, G-FC-*, G-DHW-* — not duplicated.
- Blueprint template tasks: commercial `Interior millwork, doors & hardware` (finishes_interior, 06 40 00).

## Sources used
| id | Title | Tier | License | Used for |
|---|---|---|---|---|
| cabinetry-ufgs-06-41-16 | UFGS 06 41 16.00 10 P-lam architectural cabinets | 1 | public_domain | shop drawings, mock-up, storage, humidity, 72 h conditioning, 1/8 in 8 ft, fastening, adjust/clean |
| finish_carpentry-ufgs-06-20-00 | UFGS 06 20 00 Finish Carpentry | 1 | public_domain | FRT label (1.7.7, 2.7) |
| millwork-access-board-ada (new) | Access Board — 2010 ADA Standards text | 1 | public_domain | 902.3, 904.4, 306 |
| plumbing-ada-2010 | 2010 ADA Standards (DOJ) | 1 | public_domain | ADA cross-cite |
| millwork-osha-wood-dust (new) | OSHA Topics — Wood Dust | 1 | gov_open | dust hazard |
| flooring_wood-niosh-npg-wood-dust | NIOSH NPG wood dust | 1 | gov_open | dust hazard |
| cabinetry-awi-aws | AWI Architectural Woodwork Standards | 4 | proprietary_ref_only | grade reference only |
| ecfr-1926-{d,e,f,h,i,k,l,x,z} | 29 CFR 1926 | 1 | gov_open | hazards |

Not found: UFGS 06 41 13, 06 20 23, 06 42 00 (WBDG S3 returns AccessDenied = no such key) — not cited.

## Work steps
Hand recipe only (complement). Hold points carried in `inspection_checklists`.

## Hazards
panel_tip 1926.250(a)(1) · hidden_utilities 1926.416(a)(3) · circular_saw 1926.304(d) · table_saw
1926.304(f) · pin_nailer 1926.302(b)(3) · wood_dust 1926.55(a) · formaldehyde 1926.1148 ·
contact_adhesive 1926.152(a)(1) · stepladder 1926.1053(b)(13) · lift_fall 1926.451(g)(1) ·
cord_shock 1926.404(b)(1) · eye_injury 1926.102(a)(1).

## QA checklist
14 items: shop drawings approved, field measured, blocking before drywall (safety), mock-up,
room conditioned, 72 h acclimation, AWI grade/labels, FRT labels (safety), 1/8 in 8 ft, fastened
16 in o.c. into framing (safety), scribe/refinish, doors/drawers, ADA counters, touch-up/clean.

## Inspection / acceptance checkpoints (no permit — descriptive keys)
pre_drywall_blocking · field_verify_release · delivery_acclimation · fire_rating_check (IBC 803.1 ref) ·
ada_counter_check (2010 ADA 902.3 / 904.4 / 306) · final_punch.

## Cost basis (all `platform-baseline`, estimate)
| Code | Unit | Mat ¢ | Hr/unit | Eq ¢ | Waste % |
|---|---|---|---|---|---|
| G-MW-PLAM-BASE-LF | LF | 26000 | 0.6 | 0 | 0 |
| G-MW-PLAM-UPPER-LF | LF | 19000 | 0.5 | 0 | 0 |
| G-MW-VENEER-PANEL-SF | SF | 3800 | 0.12 | 0 | 5 |
| G-MW-RECEPT-DESK-EA | EA | 1200000 | 16 | 0 | 0 |
| G-MW-SHOP-DWG-EA | EA | 250000 | 6 | 0 | 0 |
| G-MW-FRT-BLOCK-LF | LF | 450 | 0.08 | 0 | 10 |

## Quantity rules (commercial only, const)
shop drawings ×1 · P-lam base 24 LF · P-lam upper 16 LF · FRT blocking 80 LF · reception desk ×1.

## Blueprint callouts
None this wave.

## Open questions → REVIEW_QUEUE
- Spanish safety text pending (12 hazards, 3 QA, 3 checklist items).
- All six G-MW costs are estimates; reception desk allowance is design-driven.
- Commercial-const quantity rules may double-count with G-CAB-* when a `cabinetry` callout exists.
- No public UFGS for wood paneling / veneer casework found; AWI tolerances not copied.
