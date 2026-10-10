# Design Studio Skill (Client Visualizer — proposed T-65)
**Built: 2026-10-06 (P1a framework, P1b concrete_flatwork, P2 API, P3 web, P4 proposal response + convert — migrations 0045–0047). Spec: @docs/Client_Visualizer_v1_0.md**

## What it does
A contractor invites a client (CLIENT_PORTAL user in the contractor's tenant). The client answers an AI-guided,
per-trade wizard, adds photos, gets concept renders and a **budget range**; the contractor verifies and turns it
into a draft estimate → existing proposal flow. v1 ships `concrete_flatwork`; the framework serves ANY taxonomy trade.

## Invariants (proposed T-65)
1. The image never drives scope or price — structured answers → estimating engine; renders store their spec snapshot.
2. Client DTOs never carry lines/totals/catalog/markups — only `range.{low,high}_cents` (`clientScopeDto`).
3. No portal role gets `/v1/files/upload` — client photos upload via `/v1/client-portal/studio/.../uploads` (jpg/png).
4. Providers behind interfaces; AI failure never blocks the wizard (503 → carry on); every call → `ai_usage_events`.
5. Adding a trade = one intake module + catalog rows. No new routes, tables, or web code.
6. Offered trades = tenant `tenant_trade_offerings.enabled` ∩ registered module ∩ `capabilities.priced`.
7. Spec written only via `sanitizeValues`/`applyPatch`; AI output is stored as suggestions and applied only through
   `/suggestions/accept` with the server-recorded provenance (`ai_confirmed` | `photo_estimate`).

## Layout
- `api/src/lib/intake/` — pure framework: `types.ts` (module contract), `fields.ts` (field-type library + shape
  calculator), `spec.ts` (strip-don't-reject sanitize, visibility, upgrades, patch+provenance), `ai-schema.ts`,
  `prompt.ts` (option fragments only), `requirements.ts`, `pricing.ts` (range), `summary.ts`, `lint.ts`,
  `registry.ts`, `trades/<key>.ts`.
- `api/src/lib/studio/` — `service.ts` (DB + DTOs), `providers.ts` (image: none|mock|openai|gemini|comfyui|replicate; LLM: none|mock|ollama|claude_bridge — env-selected), `metering.ts` (caps),
  `circuit.ts`, `image-meta.ts` (EXIF/PNG text strip).
- Routes: `routes/v1/studio.ts` (contractor), `routes/v1/client-studio.ts` (client). Worker: `workers/studio-worker.ts`
  (`studio.render`). Migrations 0045 (flatwork assemblies), 0046 (5 tables).

## Adding a trade
1. Taxonomy key exists, not umbrella (never add/rename keys — T-64).
2. Catalog seed migration for the codes the trade needs (bucket via `estTradeFor()` unless there's a reason).
3. `lib/intake/trades/<key>.ts`: entry points (EN+ES keywords), `location`, steps from library field types,
   `catalog_codes`, `derive`, `scopeToQuantities` (leave `trade` unset on coded lines), `prompt`, `permit_rule`,
   `requirements`, `intake_version: 1`, ≥3 fixtures. New field type only if none fits.
4. Register in `registry.ts`; run `intake-registry.test.ts` (lint, fuzz, catalog-exists, golden snapshot — review it).
5. Tenants enable it under Design Studio settings.

## Provenance
`default` (intake default / entry preset, untouched) · `client` · `ai_confirmed` · `photo_estimate` (widens range) ·
`contractor`. The assistant may suggest over `default` only — never over a person's answer.

## Proposal (P4)
Proposal = existing estimate PDF. Client response lives on `design_requests.proposal_*`; it is stale once the estimate's
`proposal_generated_at` is newer. Convert (`/studio/requests/:id/convert`, OWNER/PM, tier-limited) creates/reuses the
project, links the estimate, adds the client as a project member.

## Owner-testing providers (NOT for clients)
`claude_bridge` LLM = host `ops/claude-bridge/` on the owner's Claude subscription; `comfyui` image = host ComfyUI
(`ops/comfyui/`, FLUX Kontext non-commercial). Workflows live in `api/assets/comfyui/workflows/` with `{{INPUT_IMAGE}}`,
`{{PROMPT}}`, `{{SEED}}` placeholders (guard test checks them). Swap env back before any client uses the studio.

## Gotchas
- Browser uploads need `STORAGE_PUBLIC_ENDPOINT` (presigned URLs signed for a browser-reachable host) — see the deployment skill.
- Bump `intake_version` on any meaning change + add `upgrades[n]` + a fixture at the old version (lint enforces).
- Lint rejects Spanish identical to English unless allowlisted (`BI_SAME_ALLOWLIST` — cognates like Patio/Color).
- AI/provider calls run OUTSIDE `withTenantContext` (tx1 authorize/caps → call → tx2 meter/store).
- `loadCatalog(client)` unfiltered — a trade pulls codes from several buckets.
- Range is wide until the contractor sets `measurements_verified` (band 10% + 15% unverified).
- Caps: renders reserve via the `design_renders` row + `assertRenderCaps` (advisory lock, same tx as the INSERT);
  assess/guide via `reserveAiCall` (Redis in-flight) — the route MUST call the returned release in `finally`.
- `studio.render` runs on its own queue (`DEDICATED_QUEUES`) — never put long provider calls on the `jobs` switch.
- `stripImageMetadata` throws `UnsafeImageError` on anything it can't parse; pass `{passUnknown:true}` only for provider output.
- Contractor PATCH may remove photos, never add (`PHOTOS_CLIENT_ONLY`); `photoUrls` filters to the client's own images.
