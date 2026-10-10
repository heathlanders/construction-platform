# Dossier — `concrete` (Footings / Foundations / Slabs)

> Wave: 0b (pilot — complement pattern) · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/concrete.ts` · Status: draft
> Taxonomy: category `concrete_masonry` · permit_trade `building` · phase `foundation` · CSI `03 30`

## Scope
Cast-in-place footings, foundation walls and slabs: forms, reinforcement, placement, consolidation,
finishing, field testing and curing.

## Existing coverage reconciled
- Hand recipe: `task-buildout/building.ts` foundation branch → **pack complements** (no recipes, no supersede).
- Catalog codes already seeded: B-FOOTING, B-SLAB, B-CONCRETE-CY, B-REBAR (0028/0030) → no new assemblies.
- Blueprint template tasks: 15 → still served by the hand recipe.

## Sources used
| id | Title | Tier | License | Used for |
|---|---|---|---|---|
| ufgs-03-30-00 | UFGS 03 30 00 Cast-in-Place Concrete | 1 | public_domain | QA (subgrade, forms, cover, embeds, testing, consolidation) |
| nrmca-cip | NRMCA Concrete In Practice (CIP 1, 5, 9, 11, 12, 27) | 4 | association_public | QA (finishing timing, water, curing, hot/cold weather) |
| ecfr-1926-q/p/o/e/z/k | 29 CFR 1926 Subparts Q, P, O, E, Z, K | 1 | public_domain | hazards: 1926.703(a)(1), 1926.701(b), 1926.652(a)(1), 1926.601(b)(4), 1926.702(e), 1926.95(a), 1926.1153, 1926.404(b)(1) |

## Open questions → REVIEW_QUEUE
- Spanish safety text: 8 hazards pending human translation (QA items here are quality, not safety — author-translated).
