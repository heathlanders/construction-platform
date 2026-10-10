# Dossier — `drywall` (Drywall / Gypsum Board)

> Wave: w01 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/drywall.ts` · Status: draft
> Taxonomy: category `interior` · permit_trade `building` · phase `drywall` · CSI `09 21`

## Scope (2–4 sentences)
Hangs and finishes gypsum board on interior walls and ceilings: board selection (regular, Type X,
moisture/mold-resistant, tile backer), fastening, corner bead, control joints, taping/finishing to a
specified level, and ceiling texture. Does NOT frame or furr (framing / metal_stud_framing), install
insulation or firestop systems (insulation / firestopping), plaster (plaster), or paint (painting).

## Existing coverage reconciled
- Hand recipe: `task-buildout/building.ts` drywall/plaster branch (Hang gypsum board → Tape & finish) →
  pack **complements** (`recipes: []`, no supersede).
- Catalog codes already seeded: `B-DRYWALL-SF` (hung + finished, 0028/0037) — new codes are **adders**
  on top of it, never replacements; `quantities.ts` already seeds B-DRYWALL-SF at ≈3.2 × floor SF.
- Blueprint template tasks: 9 (e.g. "Drywall hang", "Drywall tape, mud & finish") → still served by the hand recipe.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| ufgs-09-29-00 | UFGS 09 29 00 Gypsum Board (08/24, chg 1 05/25) — PDF read in full Part 3 | 1 | public_domain | QA: examination, application, control joints (structure joints, >30 ft runs, framing direction change), finish levels by use, mesh tape + setting compound, fire-rated assemblies + penetrations, temp 50–80 °F, weathertight |
| ga-216 | GA-216 Application and Finishing of Gypsum Panel Products (2024) | 4 | proprietary_ref_only | concept only (via UFGS reference) — edges on framing, fastener schedule |
| ga-214 | GA-214 Levels of Finish (2021) | 4 | association_public | concept only — Level 0–5 scale |
| usg-gch | USG Gypsum Construction Handbook | 5 | manufacturer_public | screw-pop troubleshooting (paraphrase) |
| icc-pa | IRC R702.3, R702.3.5, R302.6, R302.7 | 3 | proprietary_ref_only | code_refs, inspection items (section + paraphrase only) |
| ecfr-1926-c/d/e/h/i/k/l/x/z | 29 CFR 1926 | 1 | public_domain | hazards: 1926.250(a)(1), 1926.20(b)(1), 1926.1053(b)(13), 1926.452(w)(2), 1926.451(g)(1), 1926.55(a), 1926.1153(c)(1), 1926.102(a)(1), 1926.300(b)(1), 1926.404(b)(1) |

eCFR/osha.gov block scripts; section text was confirmed on law.cornell.edu (mirror of the CFR).
**Silica note:** 1926.1153 does not mention gypsum or joint compound — sanding mud is treated as nuisance
dust (1926.55(a)). Silica applies when power-cutting cement backer or fiber-cement board (Table 1 entry for
fiber-cement board: outdoors only, saw with dust collector).

## Work steps
Hand recipe kept (2 steps). Pack adds QA ids, hazards and checklists rendered through the knowledge endpoint.

## Hazards
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| board_stack_tipover | Stacked/leaning sheets tip or slide | 1926.250(a)(1) | 4 |
| sheet_lifting | Strains lifting full sheets | 1926.20(b)(1) | 2 |
| ladder | Top-step stepladder falls | 1926.1053(b)(13) | 3 |
| rolling_scaffold | Mobile scaffold rolls/tips | 1926.452(w)(2) | 3 |
| scaffold_fall | Scaffold platform >10 ft | 1926.451(g)(1) | 4 |
| stilts | Stilt trips/falls (no specific std) | 1926.20(b)(1) | 3 |
| sanding_dust | Joint-compound dust | 1926.55(a) | 2 |
| silica_cement_board | Silica from power-cutting cement/fiber-cement board | 1926.1153(c)(1) | 3 |
| eye_debris | Chips/splatter in eyes | 1926.102(a)(1) | 2 |
| power_tool | Knife/cut-out tool cuts | 1926.300(b)(1) | 2 |
| cord_shock | Shock from tools/temp power | 1926.404(b)(1) | 3 |

## QA checklist
15 items — framing ready, cover inspection passed, conditions, board types, garage separation*, rated
listing*, rated penetrations*, wet-area board, edges/joints, fastener pattern, no screw pops, cut-outs,
control joints, finish level, mesh tape + setting compound. (*/board types = safety → ES pending)

## Inspection / acceptance checkpoints
- `insulation`: cover inspection passed before boarding; fireblocking visible.
- `framing`: where the AHJ inspects board fastening (some do) — fasteners exposed, rated board identified.
- `final`: garage separation complete, under-stair protection, no open holes in rated work.

## Cost basis (all `estimate`, platform-baseline, 2026 national)
| Code | Item | Unit | Mat ¢ | Labor hr | Equip ¢ | Waste % |
|---|---|---|---|---|---|---|
| B-DW-TYPEX-SF | 5/8 Type X upgrade adder | SF | 18 | 0.004 | 0 | 10 |
| B-DW-MR-SF | Moisture/mold-resistant adder | SF | 22 | 0.002 | 0 | 10 |
| B-DW-L5-SF | Level 5 skim adder | SF | 6 | 0.012 | 0 | 5 |
| B-DW-CORNER-LF | Outside corner bead + finish | LF | 70 | 0.035 | 0 | 5 |
| B-DW-TEXTURE-SF | Sprayed ceiling texture | SF | 8 | 0.006 | 2 | 10 |

## Quantity rules
- `B-DW-TEXTURE-SF` = area_sf_sum × 1 (residential) — ceilings ≈ floor area
- `B-DW-CORNER-LF` = rooms × 8
- `B-DW-TYPEX-SF` = const 450 (residential_sf) — attached 2-car garage separation; remove if none
- `B-DW-MR-SF` = const 200 (residential_sf) — two baths + laundry
- `B-DW-L5-SF` — no rule (spec-driven; add manually)

## Blueprint callouts (components)
None.

## Open questions → REVIEW_QUEUE
- 11 hazards + 4 safety QA items + all checklist items pending human ES translation.
- All 5 assembly costs are `estimate` only.
- IRC R702.3.x sub-numbering differs between editions — only R702.3 / R702.3.5 cited; verify against adopted edition.
- Some AHJs run a separate gypsum-board fastening inspection — no such `inspection_type` in the building sequence; filed under `framing`. Propose vocab `gypsum_board`?
- Const-basis Type X / MR rules assume an attached garage and two baths — need a garage/wet-room fact.
- GA-216 is a paid standard; cited for concepts only through UFGS 09 29 00.
