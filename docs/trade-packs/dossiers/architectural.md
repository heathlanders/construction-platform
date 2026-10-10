# Dossier — `architectural` (Architectural (General))

> Wave: w23 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/architectural.ts` · Status: draft
> Taxonomy: category `interior` · permit_trade `building` · phase `finishes_interior` · CSI `09` · **umbrella: true**

## Scope (2–4 sentences)
Umbrella roll-up key, not a trade of its own. Tasks and vendors tagged `architectural` are generic; the
knowledge (steps, hazards, QA, assemblies) belongs in the finer child packs: drywall, metal_stud_framing, acoustical_ceilings, doors_hardware, millwork, toilet_partitions, specialties, windows, glazing, curtain_wall, siding, roofing.
Per the wave rule the pack carries identity + glossary only.

## Existing coverage reconciled
- Hand recipe: none → pack **complements** (identity/glossary only; no recipe, so steps are unchanged — verified with `pack:smoke` before/after).
- Catalog codes already seeded: n/a (no assemblies; `est_bucket` left unset so estimating behavior is unchanged).
- Blueprint template tasks hitting this trade: 0.
- Why no hazards/QA/checklists: an umbrella key is attached to many unrelated tasks; any knowledge here would show on all of them.

## Sources used
None — glossary is general construction vocabulary in our own words; no facts, numbers or code sections.

## Work steps / Hazards / QA / Inspection checkpoints / Cost basis / Quantity rules / Components
None by design (umbrella).

## Open questions → REVIEW_QUEUE
- Consider retagging template tasks from `architectural` to finer taxonomy keys where a child pack fits (scope).
