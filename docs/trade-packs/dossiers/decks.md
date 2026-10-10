# Dossier — `decks` (Decks & Porches)

> Wave: 0b (pilot — new-trade pattern) · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/decks.ts` · Status: draft
> Taxonomy: category `structural` · permit_trade `building` · phase `finishes_exterior` · CSI `06 15`

## Scope
Attached and freestanding wood-framed residential decks and porches: footings, posts, beams, joists,
ledger attachment to the house, decking, guards and stairs. Excludes roof-covered porches' roof framing
(framing/roofing), concrete patios (concrete_flatwork / hardscape_pavers), and pergolas (patio_covers_awnings).

## Existing coverage reconciled
- Hand recipe: none (no `decks` branch; previously fell to building.ts phase branches) → pack provides the recipe.
- Catalog codes already seeded: none → 7 new `B-DECK-*` rows (migration 0048).
- Blueprint template tasks: none. New component token `deck` (qualifier required — bare "DECK" is roof/steel deck).

## Sources used
| id | Title | Tier | License | Used for |
|---|---|---|---|---|
| awc-dca6 | AWC DCA 6 Prescriptive Residential Wood Deck Construction Guide (2015 IRC) | 4 | association_public | steps, QA, inspection checklists (footing depth, 6x6 posts, 2x8 ledger, 1/2 in. lags/bolts, no veneer attach, G-185/SS, guards >30 in., stairs ≥36 in. on 2x12) |
| simpson-deckcode | Simpson Strong-Tie F-DECKCODE | 5 | manufacturer_public | hanger nailing QA |
| ecfr-1926-m/x/p/i/k/c | 29 CFR 1926 Subparts M, X, P, I, K, C | 1 | public_domain | hazards: 1926.501(b)(13), 1926.1053, 1926.651(b)(1), 1926.300(b), 1926.302(b), 1926.404(b)(1), 1926.20(b), 1926.28(a) |
| icc-pa | IRC R507, R312, R311.7, R317, R703.8 | 3 | proprietary_ref_only | section numbers only |
| platform-baseline | national cost baseline | — | platform_estimate | all 7 assemblies (estimate) |

## Notes
- DCA 6's latest free edition is aligned to the 2015 IRC; newer IRC editions renumbered parts of R507.
  Code refs cite `R507` (section family), not sub-sections, to stay edition-safe.
- All costs are `estimate` — no public deck unit-cost source found. Learn-from-actuals (0031) will tune.
- Quantity rules assume a 12×16 attached deck when only a callout is found — every line says so.

## Open questions → REVIEW_QUEUE
- Spanish safety text: 8 hazards + 11 safety QA items pending human translation.
- Proposed equipment vocab `post_hole_auger` (deck footings) — currently `air_compressor` + optional `skid_steer`.
