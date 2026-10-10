# Dossier — `closets_storage` (Closets / Storage Systems)

> Wave: w05 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/closets_storage.ts` · Status: draft
> Taxonomy: category `interior` · permit_trade `null` · phase `finishes_interior` · CSI `10 56`

## Scope (2–4 sentences)
Installs manufactured storage systems: fixed wire shelving (closets, pantries, laundry), adjustable
hang-track/standard shelving, laminate/melamine closet towers with rods, drawers and doors, and garage
storage (wall/base cabinets, rails, overhead ceiling racks). Does NOT build site-built shelf + rod
(`finish_carpentry`, `G-FC-CLOSET-SHELF-LF`), hang closet doors (`doors_hardware`), or frame blocking
(`framing`). No AHJ permit path — no gates, no code_refs; checkpoints live in `inspection_checklists`.

## Existing coverage reconciled
- Hand recipe: none → NEW-TRADE pattern, 2 pack recipes with `example_title`.
- Catalog codes already seeded: none with `G-CLS-`; `G-FC-CLOSET-SHELF-LF` (finish_carpentry pack) is the site-built shelf — not redeclared.
- Blueprint template tasks hitting this trade: none (`grep trade_type: 'closets_storage'` empty). Parser recognizes `CLOSET`/`PANTRY` as rooms only — no closet-specific fact → no quantity rules.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| closets-closetmaid-wire-kit | ClosetMaid Wire Shelf Hardware Kit 54126 | 5 | manufacturer_public | clip spacing (2 in. from ends, ≤12 in.), drill only, caps, cutting |
| closets-closetmaid-shelftrack | ClosetMaid ShelfTrack Elite combo kit tips | 5 | manufacturer_public | hardware by wall type, track to header, standards ≤24 in./≤4 in., caps |
| closets-closetmaid-hangtrack | ClosetMaid 40 in. hang track sheet | 5 | manufacturer_public | warning: correct hardware, standards secured, do not overload |
| closets-closetmaid-impressions | ClosetMaid Impressions laminate kits | 5 | manufacturer_public | inventory, tower placement, affix towers, 48 in. max span |
| closets-elfa-install | elfa Installation & Assembly | 5 | manufacturer_public | design sheet per wall, level/mark top track, anchors by wall type, utilities warning |
| closets-gladiator-gearloft | Gladiator GearLoft overhead rack manual | 5 | manufacturer_public | joists only, 24 in. span, posted max load, ~80 in. height, clearance, two-person lift |
| icc-pa | ICC public access (IRC R302.5.1) | 3 | proprietary_ref_only | garage-to-dwelling door self-closing (QA, reference only) |
| ecfr-1926-c/e/h/i/k/x/z | 29 CFR 1926 | 1 | public_domain | hazards |

## Work steps (pack recipes)
`wire_shelving_closet` (default, title_re closet/pantry/linen/shelving): confirm layout + find framing → level lines + drill clip holes → cut + cap → hang + brackets → load test + clean.
`manufactured_closet_garage_system` (priority 10, laminate/closet system/hang track/garage storage/overhead rack): check parts + plan placement (garage no-mount zones) → mount track/rail into framing → assemble + secure towers/cabinets/standards → overhead racks into joists → rods/shelves/drawers/doors, adjust, clean.

## Hazards
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| falling_shelf | Loaded shelf/cabinet pulls out of drywall anchors (struck-by) | 1926.21(b)(2) (derived) | 3 |
| overhead_rack | Ceiling rack/load falls | 1926.20(b)(1) (derived) | 4 |
| heavy_lift | Lifting cabinets/towers/rack decks | 1926.21(b)(2) (derived) | 2 |
| stepladder | Top step use | 1926.1053(b)(13) | 3 |
| drill_tool | Drill bind / ungrounded tool | 1926.302(a)(1) | 2 |
| wire_cut | Cutting wire shelving/rod | 1926.102(a)(1) | 2 |
| eye_debris | Overhead drilling dust | 1926.102(a)(1) | 2 |
| hidden_utilities | Concealed wiring/pipes | 1926.416(a)(3) | 4 |
| silica_drilling | Drilling concrete/block garage walls | 1926.1153 | 3 |
| cord_shock | Cords in garages | 1926.404(b)(1) | 3 |
| material_stacks | Carton stacks | 1926.250(a)(1) | 2 |
| housekeeping | Packaging/offcuts | 1926.25(a) | 1 |

No 1926 section addresses storage-system anchorage or manual lifting — those refs are general duties, prov `derived`.

## QA checklist
13 items; safety (ES pending): anchored_framing, clip_spacing, span_limits, load_rating, overhead_joists, egress_firedoor, garage_clearances.

## Inspection / acceptance checkpoints
- `layout_verify`, `anchor_check`, `final_walkthrough` (owner/GC checkpoints).

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| G-CLS-WIRE-LF | Fixed wire shelving | LF | 900 | 0.15 | 0 | 8 | platform-baseline, estimate |
| G-CLS-TRACK-LF | Hang-track system | LF wall | 3500 | 0.35 | 0 | 5 | estimate |
| G-CLS-LAM-LF | Laminate closet system | LF wall | 12000 | 1.0 | 0 | 3 | estimate |
| G-CLS-GARCAB-LF | Garage cabinet run | LF wall | 22000 | 0.8 | 0 | 0 | estimate |
| G-CLS-OHRACK-EA | Overhead garage rack 4×8 | EA | 22000 | 3.0 | 0 | 0 | estimate |

## Quantity rules
- None — no closet/storage fact or component on plans (CLOSET is a room label only).

## Blueprint callouts (components)
- None this wave.

## Open questions → REVIEW_QUEUE
- All 5 costs are estimates.
- Manufacturer PDFs are retailer-hosted (Lowe's/Home Depot/Rona); closetmaid.com redirects to homebyames.com and Rubbermaid FastTrack returns 403 — not cited.
- falling_shelf/overhead_rack/heavy_lift OSHA refs are general-duty (derived).
