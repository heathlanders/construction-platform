---
name: trade-packs
description: Trade Knowledge Packs — one declarative data file per trade (work steps, code refs, hazards, QA, inspection checklists, cost assemblies, quantity rules, blueprint callouts) read by every engine. Use when adding or deepening any trade, running a trade-packs wave, or touching taxonomy/task-buildout/estimating trade knowledge.
---

# Trade Knowledge Packs Skill
**Spec:** @docs/Trade_Knowledge_Packs_v1_0.md · **Ledger (state):** @docs/Trade_Knowledge_Session_Plan.md ·
**Procedure:** @docs/trade-packs/RESEARCH_PROMPT.md · **Decisions:** T-59, T-63, T-64, proposed T-66

## What it is
183 taxonomy trades (`api/src/lib/trades/taxonomy.ts`). Each gets `api/src/lib/trades/packs/<key>.ts`
(`definePack({...})`): pure data + provenance. Engines read packs through `packs/runtime.ts`; precedence
everywhere is **pack → existing hand code → generic**. Built in waves (ledger), one branch/PR per wave.
Status: Wave 0a (taxonomy) + 0b (infra, 183 stubs, pilots `decks` new-trade + `concrete` complement) done.
Copy those two pilots — not ad-hoc shapes.

## Invariants
1. Adding a trade = taxonomy entry + pack (+ catalog rows via generated migration). Never a new table,
   route, or permit path (T-59/T-64). The old `/scaffold-trade-module` per-trade-table pattern is retired.
2. Keys are permanent. Add aliases, never rename. New keys need owner approval.
3. Every fact has `prov {src, confidence, last_verified}`; `src` ids live in `packs/sources.ts`.
4. Proprietary sources (ICC, NFPA, IAPMO, ASTM, RSMeans, NECA/MCAA, IICRC, AARST) are reference-only:
   section number + short title + our paraphrase. No tables, no numbers.
5. Spanish: `I18nText` status `human_translated` (professional) | `translated` (pack author — NON-safety
   only) | `pending_human_translation`. Safety text (hazards, `safety: true` QA) may never be `translated`
   (guard). Summary/glossary/assembly names are plain ES strings written with the pack.
6. Packs complement hand recipes; replacing one needs `supersedes_hand: true`, a reason, and snapshot updates.
7. `heavy_civil` and `services` trades have `permit_trade: null` → no gating inspections; heavy civil
   DOT hold points go in `inspection_checklists`; bucket `general`, codes `HC-`.
8. Catalog migrations are generated (`gen:catalog-migration`), append-only, numbered at PR time.
9. Equipment `type` must exist in `lib/task-buildout/equipment-vocab.ts`; inspection types must exist in
   the family's `*-codes/inspection-sequences.ts`. Propose additions in REVIEW_QUEUE.

## Engine wiring (where packs are read)
`task-buildout/index.ts` (steps; `HAND_RECIPE_KEYS` in `packs/runtime.ts` decides precedence) ·
`task-buildout/code-refs.ts` · `estimating/trade-bucket.ts` + `quantities.ts` `seedFromPacks` (called from
`services/estimates.ts` with the project's schedule trades) · `blueprint-pdf/parse-sheets.ts`
(`COMPONENT_PATTERNS`, `VISION_COMPONENT_TOKENS` cap 120) + `build-tasks.ts` · `task-dependencies/rules.ts`
(`dependency_hints`) · `routes/v1/trades.ts` (`/trades/:key/knowledge`, `/trades/hazards`).
Tests: `trade-packs.test.ts` (guards + mutation checks), `trade-packs-integration.test.ts`.

## Commands
`npm run pack:new <key>` · `pack:check [key]` · `pack:smoke <key>` · `pack:barrel` ·
`pack:verify-sources` · `gen:catalog-migration -- --wave NN [--apply]`

## Workflow for one trade
RESEARCH_PROMPT §0 (reconcile existing coverage) → sources in tier order → dossier → pack → check →
smoke → REVIEW_QUEUE entry → `status: 'draft'`. Only a human sets `reviewed`.

## Gotchas
- `web/src/components/trades/use-trade-taxonomy.ts` `TRADE_CATEGORY_ORDER` drops unknown categories —
  a new category must be added there + `trade_categories` labels in `web/locales/{en,es}/{financial,projects}.json`
  and `category_*` in `connections.json`.
- `estimate_assemblies.trade` has a DB CHECK of 5 buckets — no new buckets.
- `jsa_records` `HazardSchema` strips unknown keys (see `waves/ws1.md`).
- Vision prompt size grows with component tokens — only `vision_hint` tokens go to the model.
