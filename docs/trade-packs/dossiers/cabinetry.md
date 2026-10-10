# Dossier — `cabinetry` (Cabinet Installation / Casework)

> Wave: w03 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/cabinetry.ts` · Status: draft
> Taxonomy: category `interior` · permit_trade `null` · phase `finishes_interior` · CSI `12 32`

## Scope (2–4 sentences)
Installs factory-built kitchen, bath and laundry cabinets and commercial casework: receiving and
acclimating, layout from the floor high point, hanging uppers into framing, leveling/shimming bases,
scribing fillers and panels, crown/light rail, toe kick, hardware and door/drawer adjustment. Does NOT
fabricate or set countertops (`countertops`), make sink/appliance connections (plumbing/electrical), or
build site-built architectural millwork (`millwork`). No AHJ permit path — no gates, no code_refs.

## Existing coverage reconciled
- Hand recipe: `lib/task-buildout/nopermit.ts` case `cabinetry` (Field-verify & layout → Install & scribe) → pack **complements** (`recipes: []`).
- Catalog codes already seeded: `G-CAB-BASE-LF`, `G-CAB-UPPER-LF` (0037); hand-seeded in `seedGeneral` on the `cabinetry` component. Not redeclared; pack rules add only new `G-CB-*` codes.
- Blueprint template tasks: "Cabinet & countertop installation" (residential_sf), "Unit cabinet & countertop installation" (residential_mf) — served by the hand recipe.
- Component token `cabinetry` already core (`parse-sheets.ts` COMPONENT_PATTERNS) — no new components.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| cabinetry-ufgs-06-41-16 | UFGS 06 41 16.00 10 Plastic-Laminate-Clad Architectural Cabinets (Aug 2025) | 1 | public_domain | storage, conditioning, 1/8 in in 8 ft tolerance, wall fastening, scribing, adjusting/cleaning |
| cabinetry-masterbrand-install | MasterBrand Wall and Base Cabinet Installation Instructions | 5 | manufacturer_public | inspect on delivery, reference lines, T-brace, screws not nails, shimming backs, face-frame joining, no cut backs, utilities warning |
| cabinetry-kraftmaid-install | KraftMaid cabinet installation / adjustment support | 5 | manufacturer_public | door/drawer adjustment, not freestanding |
| cabinetry-kcma-a161 | KCMA / ANSI A161.1 | 4 | proprietary_ref_only | reference only (product certification) |
| cabinetry-awi-aws | AWI Architectural Woodwork Standards | 4 | proprietary_ref_only | reference only (commercial casework grades) |
| plumbing-ada-2010 | 2010 ADA Standards (reused) | 1 | public_domain | 902.3, 606, 306, 308, 811 accessible casework checks |
| ecfr-1926-c/d/e/h/i/k/x | 29 CFR 1926 | 1 | public_domain | hazards |

## Work steps
Hand recipe stands (layout, install & scribe). Pack adds QA/hazards referenced from the knowledge endpoint.

## Hazards
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| upper_cabinet_fall | Upper/tall cabinet falls or tips before fastened (ledger/jack/T-brace) | 1926.21(b)(2) | 3 |
| cabinet_stacks | Stacked boxes topple | 1926.250(a)(1) | 2 |
| hidden_utilities | Drilling into concealed wiring/pipes | 1926.416(a)(3) | 4 |
| circular_saw | Portable saw cuts/kickback | 1926.304(d) | 3 |
| table_saw | Ripping fillers on table saw | 1926.304(i)(1) | 3 |
| pin_nailer | Pneumatic trim nailer puncture | 1926.302(b)(3) | 2 |
| stepladder | Top-step use on stepladder | 1926.1053(b)(13) | 3 |
| cord_shock | Cords/temporary power | 1926.404(b)(1) | 3 |
| eye_injury | Chips/dust | 1926.102(a)(1) | 2 |
| wood_dust | MDF/particleboard dust | 1926.55(a) | 2 |
| packing_debris | Cardboard/strap trips | 1926.25(a) | 1 |

No 1926 standard covers manual lifting directly; team-lift is carried in the `upper_cabinet_fall` controls.

## QA checklist
15 items — conditioning/storage (UFGS 1.5/1.6/3.1), delivery inspection, layout vs appliance specs,
reference lines, level/plumb 1/8 in in 8 ft, **uppers into framing (safety)**, **no cut backs / never
freestanding (safety)**, shimmed backs, flush face frames, scribed fillers, door/drawer reveals, toe kick
+ crown (platform estimate), hardware by template, protect & clean, ADA casework (commercial).

## Inspection / acceptance checkpoints (no AHJ gate)
- `layout_verify`, `upper_install_check` (safety — ES pending), `final_walkthrough`, `ada_casework_check`.

## Cost basis (all platform-baseline estimates, 2026)
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % |
|---|---|---|---|---|---|---|
| G-CB-VANITY-EA | Bath vanity 30–36 in | EA | 35000 | 1.5 | 0 | 0 |
| G-CB-TALL-EA | Pantry/tall cabinet | EA | 65000 | 2.0 | 0 | 0 |
| G-CB-CROWN-LF | Crown / light rail | LF | 900 | 0.15 | 0 | 12 |
| G-CB-HARDWARE-EA | Knob/pull with template | EA | 600 | 0.1 | 0 | 3 |
| G-CB-REMOVE-LF | Existing cabinet removal + disposal | LF | 0 | 0.3 | 250 | 0 |

## Quantity rules (all gated on the core `cabinetry` component)
- `G-CB-CROWN-LF` = 16 LF (matches the hand-seeded upper run)
- `G-CB-HARDWARE-EA` = 30 EA
- `G-CB-TALL-EA` = 1 EA (residential_sf only)
- `G-CB-VANITY-EA` = 2 EA (residential_sf only)
- `G-CB-REMOVE-LF` — no rule (no remodel fact available)

## Blueprint callouts
None new — `cabinetry` core token reused.

## Open questions → REVIEW_QUEUE
- All 5 assembly costs are estimates.
- Dependency hints are note-only (no `after_trades`) to avoid template DAG snapshot drift; consider `after_trades: ['drywall']` later.
- Vanity count has no fact basis (no bath/lavatory token) — a `lavatory` fixture token would let it scale.
- KraftMaid support page links its guide PDF but the page itself carries little text; MasterBrand guide carries the specifics.
