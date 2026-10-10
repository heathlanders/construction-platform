# Dossier — `civil` (Civil / Sitework (General))

> Wave: w23 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/civil.ts` · Status: draft
> Taxonomy: category `sitework` · permit_trade `building` · phase `site_prep` · CSI `33` · **umbrella: true**

## Scope (2–4 sentences)
Umbrella roll-up key, not a trade of its own. Tasks and vendors tagged `civil` are generic; the
knowledge (steps, hazards, QA, assemblies) belongs in the finer child packs: excavation, demolition, erosion_control, dewatering, site_utilities, shoring_underpinning, deep_foundations, asphalt_paving, concrete_flatwork, retaining_walls, fencing, landscaping.
Per the wave rule the pack carries identity + glossary only.

## Existing coverage reconciled
- Hand recipe: task-buildout/building.ts (civil branch) → pack **complements** (identity/glossary only; no recipe, so steps are unchanged — verified with `pack:smoke` before/after).
- Catalog codes already seeded: n/a (no assemblies; `est_bucket` left unset so estimating behavior is unchanged).
- Blueprint template tasks hitting this trade: 3.
- Why no hazards/QA/checklists: an umbrella key is attached to many unrelated tasks; any knowledge here would show on all of them.

## Sources used
None — glossary is general construction vocabulary in our own words; no facts, numbers or code sections.

## Work steps / Hazards / QA / Inspection checkpoints / Cost basis / Quantity rules / Components
None by design (umbrella).

## Open questions → REVIEW_QUEUE
- Consider retagging template tasks from `civil` to finer taxonomy keys where a child pack fits (scope).
