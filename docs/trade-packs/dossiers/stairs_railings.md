# Dossier — `stairs_railings` (Stairs & Railings)

> Wave: w16 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/stairs_railings.ts` · Status: draft
> Taxonomy: category `interior` · permit_trade `building` · phase `finishes_interior` · CSI `05 51`

## Scope
Wood and interior finish stairs (site-cut and prefabricated stringers, treads, risers) and wood balustrades
(newels, handrails, guards, balusters) plus interior cable-rail kits. Hand-offs: steel pan stairs / pipe rail →
`misc_metals`; deck stairs / rail → `decks`; glass rail → `glazing`; wall-only handrail → `finish_carpentry`
(`G-FC-HANDRAIL-LF`); finish stair treads → `flooring_wood` (`G-WD-STAIR-TREAD-EA`); stair carpet →
`flooring_carpet` (`G-CPT-STAIR-EA`).

## Existing coverage reconciled
- Hand recipe: none (not in `HAND_RECIPE_KEYS`) → NEW-TRADE pattern.
- Catalog codes already seeded: none with `B-STR-`; adjacent codes above referenced only in descriptions.
- Blueprint template tasks hitting this trade: none.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| ecfr-1926-x | 29 CFR 1926 Subpart X — Stairways and Ladders | 1 | public_domain | 1926.1052(a)(6), (c)(1), (c)(12) — temp stair rails, landings, projections |
| ecfr-1926-m | 29 CFR 1926 Subpart M — Fall Protection | 1 | public_domain | 1926.501(b)(4)(i) stairwell holes |
| ecfr-1926-i | 29 CFR 1926 Subpart I — Tools | 1 | public_domain | 1926.300(b)(1), 1926.302(b)(3) |
| ecfr-1926-e / -d | Subparts E, D | 1 | public_domain | 1926.102(a)(1), 1926.95(a), 1926.52(d)(1) |
| plumbing-ada-2010 | 2010 ADA Standards | 1 | public_domain | 504 stairs, 505 handrails (ref) |
| awc-dca6 | AWC DCA 6 | 4 | association_public | stringer-cutting concept (derived) |
| stairs_railings-ljsmith-install (new) | L.J. Smith installation guides | 5 | manufacturer_public | newel mounting, rail fittings, balusters |
| stairs_railings-atlantis-install (new) | Atlantis Rail installation | 5 | manufacturer_public | cable tensioning / deflection check |
| icc-pa | ICC public access (IRC/IBC) | 3 | proprietary_ref_only | R311.7.x, R312.1, IBC 1011/1014/1015/1607.9 — section + paraphrase only |
| platform-baseline | — | — | platform_estimate | all costs |

UFGS 06 43 13 (Wood Stairs) could not be verified (WBDG returns the same JS shell for any section id) — not cited.

## Work steps
Recipe `wood_stair_flight` (priority 5): layout rise/run → cut/set stringers + headroom/width (gate framing) →
temporary rails → risers and treads → guards and handrails (gate final).
Recipe `balustrade` (priority 3): post layout + blocking (gate framing) → newels → handrail → balusters / cable
→ finish + final walk (gate final).

## Hazards
open_side_fall 1926.1052(c)(1) · landing_edge 1926.1052(c)(12) · stairwell_hole 1926.501(b)(4)(i) ·
temp_rail_removal 1926.1052(c)(1) · saw_guard 1926.300(b)(1) · nailer 1926.302(b)(3) · eye_flying 1926.102(a)(1)
· noise 1926.52(d)(1) · housekeeping 1926.1052(a)(6) · cable_tension 1926.95(a).

## QA checklist
14 items (7 safety → ES pending): riser/tread uniformity, stringer throat, stringers plumb/level, headroom,
width, temp rails, treads glued, nosing uniform, newel rigid, handrail height/grip, guard height/openings, cable
deflection, bracket blocking, finish smooth.

## Inspection checkpoints
- framing: stringers, headroom/width, layout uniformity, blocking.
- final: handrail, guards, newels rigid, ADA nosings/extensions (commercial).

## Cost basis (all `estimate`, platform baseline 2026)
| Code | Item | Unit | Material ¢ | Labor hr | Equip ¢ | Waste % |
|---|---|---|---|---|---|---|
| B-STR-WOOD-FLIGHT-EA | Site-built wood flight ~13 risers | EA | 45000 | 10 | 0 | 12 |
| B-STR-PREFAB-STRINGER-EA | Prefab stringer set installed | EA | 35000 | 4 | 0 | 0 |
| B-STR-RAIL-WOOD-LF | Wood balustrade per LF | LF | 4500 | 0.8 | 0 | 10 |
| B-STR-NEWEL-EA | Newel with mounting kit | EA | 18000 | 1.5 | 0 | 0 |
| B-STR-CABLE-RAIL-LF | Interior cable-rail kit per LF | LF | 9000 | 1.2 | 0 | 5 |

## Quantity rules
- residential_sf only (const): 1 × B-STR-WOOD-FLIGHT-EA, 2 × B-STR-NEWEL-EA, 14 × B-STR-RAIL-WOOD-LF — "confirm stair count on plans".

## Blueprint callouts
None this wave.

## Open questions → REVIEW_QUEUE
- 7 safety QA items + 10 hazards + all inspection items ES pending.
- 5 estimate-only costs.
- UFGS 06 43 13 unverifiable; residential_sf const rules assume one stair (single-story homes over-count).
