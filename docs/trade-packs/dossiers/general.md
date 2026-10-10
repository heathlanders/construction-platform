# Dossier — `general` (General / Multi-Trade)

> Wave: w23 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/general.ts` · Status: draft
> Taxonomy: category `specialty` · permit_trade `building` · phase `commissioning` · CSI `01` · **umbrella: true**

## Scope (2–4 sentences)
Umbrella roll-up key, not a trade of its own. Tasks and vendors tagged `general` are generic; the
knowledge (steps, hazards, QA, assemblies) belongs in the finer child packs: final_clean, scaffolding, hauling, traffic_control, remodeling, restoration, specialties, construction_management, commissioning_agent.
Per the wave rule the pack carries identity + glossary only.

## Existing coverage reconciled
- Hand recipe: none in building.ts by key; generic building-family phase recipes produce the steps → pack **complements** (identity/glossary only; no recipe, so steps are unchanged — verified with `pack:smoke` before/after).
- Catalog codes already seeded: n/a (no assemblies; `est_bucket` left unset so estimating behavior is unchanged).
- Blueprint template tasks hitting this trade: 25 (inspections, punch, closeout and general conditions tasks across templates).
- Why no hazards/QA/checklists: an umbrella key is attached to many unrelated tasks; any knowledge here would show on all of them.

## Sources used
None — glossary is general construction vocabulary in our own words; no facts, numbers or code sections.

## Work steps / Hazards / QA / Inspection checkpoints / Cost basis / Quantity rules / Components
None by design (umbrella).

## Open questions → REVIEW_QUEUE
- Consider retagging template tasks from `general` to finer taxonomy keys where a child pack fits (scope).
