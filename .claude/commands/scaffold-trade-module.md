# /scaffold-trade-module — RETIRED (2026-10-08)

This command used to generate a new set of per-trade tables, routes and screens. That pattern is
retired: it violates T-59 (one trade-aware permit path) and T-64 (canonical taxonomy), and it does
not scale past a handful of trades.

**Adding or deepening a trade now = a Trade Knowledge Pack.** Use the `trade-packs` skill:

1. Confirm the key exists in `api/src/lib/trades/taxonomy.ts` (new keys need owner approval).
2. Follow `docs/trade-packs/RESEARCH_PROMPT.md` → dossier → `api/src/lib/trades/packs/<key>.ts`.
3. `npm run pack:check <key>` → `npm run pack:smoke <key>` → `npm run gen:catalog-migration`.

For a client-facing request wizard, add a Design Studio intake module instead
(`docs/Client_Visualizer_v1_0.md` → "How to add a trade"). Wave plan: `docs/Trade_Knowledge_Session_Plan.md`.
