# Dossier — `plaster` (Plaster / Veneer Plaster)

> Wave: w15 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/plaster.ts` · Status: draft
> Taxonomy: category `interior` · permit_trade `building` · phase `drywall` · CSI `09 23`

## Scope (2–4 sentences)
Interior plaster: veneer plaster (1/16–1/8 in.) troweled over gypsum base (blueboard), three-coat
gypsum plaster on expanded metal lath or masonry, the beads/grounds that set its thickness, and repair
of old flat plaster walls and ceilings. Exterior cement plaster (stucco) is `stucco_eifs`; taped
gypsum board is `drywall`; lead/asbestos removal is `abatement`.

## Existing coverage reconciled
- Hand recipe: `task-buildout/building.ts` shared drywall/plaster branch ("Hang gypsum board",
  "Tape & finish") → pack **complements** (recipes: []). The hand steps describe drywall, not
  plaster — logged as a scope item rather than superseded (needs snapshot work).
- Catalog codes already seeded: `B-DRYWALL-SF` (hand-seeded 3.2 × floor area), `B-DW-*` (drywall
  pack), `B-STUCCO-SF`, `B-STU-*` (stucco pack). None duplicated.
- Blueprint template tasks hitting this trade: none.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| plaster-ufgs-09-23-00 | UFGS 09 23 00 Gypsum Plastering (Aug 2024) | 1 | public_domain | conditions, coats, thickness, tolerance, joints, patching |
| plaster-ufgs-09-26-00 | UFGS 09 26 00 Veneer Plaster (Aug 2024) | 1 | public_domain | gypsum base, joint reinforcement, veneer application, wet-area limit |
| plaster-ufgs-09-22-36 | UFGS 09 22 36 Lath (Aug 2024) | 1 | public_domain | lath/beads coordination |
| plaster-nps-pb21 | NPS Preservation Brief 21 | 1 | public_domain | old plaster repair, keys, washers, lead/asbestos warning |
| ecfr-1926-c/d/e/i/k/l/x/z | 29 CFR 1926 subparts | 1 | gov_open | hazards |
| icc-pa | ICC public access (IRC R702.2, IBC 110.3.5 / 2507 / 2511) | 3 | proprietary_ref_only | code refs (section + paraphrase) |
| platform-baseline | The Jobsite cost baseline | — | platform_estimate | all costs |

## Work steps
None — hand recipe owns steps (complement pattern).

## Hazards
12: scaffold fall 1926.451(g)(1); rolling scaffold 1926.452(w)(2); ladder 1926.1053(b)(13); lead in old
plaster 1926.62(d)(1)(i); asbestos in troweled surfacing 1926.1101(k)(1)(i); silica chipping
1926.1153(d)(1); lime burns 1926.95(a); eye splash 1926.102(a)(1); falling ceiling 1926.100(a); mixer
1926.300(b)(1); cord shock 1926.404(b)(1); debris 1926.25(a). Gypsum itself is not crystalline silica —
silica applies to sanded base coats and masonry substrates.

## QA checklist
15 items (2 safety): conditions 55–80 °F, base not sun-faded, base install, joint reinforcement (no
self-adhering mesh), grounds aligned, clean substrate, coat count, thickness (5/8 in.; veneer ≥1/16),
1/8 in. in 8 ft, control joints, no retempering, repair method, no veneer in showers, hazmat cleared,
rated assembly.

## Inspection / acceptance checkpoints
- insulation: cover inspection passed; lath/base inspection before plaster (IBC 110.3.5); lath per IBC 2507.
- final: coats complete, no holes in rated assemblies (R702.2.1); wet areas per IBC 2511.

## Cost basis (all `estimate`, platform-baseline)
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % |
|---|---|---|---|---|---|---|
| B-PLA-VENEER-ADD-SF | Veneer finish adder over B-DRYWALL-SF | SF | 30 | 0.012 | 1 | 10 |
| B-PLA-3COAT-SF | Three-coat gypsum plaster on metal lath | SF | 190 | 0.09 | 5 | 12 |
| B-PLA-REPAIR-SF | Old plaster repair | SF | 160 | 0.3 | 0 | 20 |
| B-PLA-BEAD-LF | Plaster bead / ground | LF | 85 | 0.03 | 0 | 5 |

## Quantity rules
- `B-PLA-VENEER-ADD-SF` = area_sf_sum × 1 (residential_sf/mf, commercial) — conservative; only seeds
  when plaster is a schedule trade; whole-house veneer ≈ ×3.2.

## Blueprint callouts (components)
None this wave.

## Open questions → REVIEW_QUEUE
- Hand recipe gives plaster tasks drywall steps (hang board / tape & finish).
- No `plaster_pump` equipment vocab.
- All costs estimates.
