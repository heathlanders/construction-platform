# Design Studio — Session Wrap-up & Pickup Plan
**Session date:** 2026-10-06 · **Branch:** `feat/client-visualizer` (pushed) · **PR:** #69 (draft) · **Local CI:** green (`--report` posted)
**Spec:** `docs/Client_Visualizer_v1_0.md` · **Skill:** `.claude/skills/design-studio/SKILL.md` · **Proposed decision:** T-65 (NOT locked)

## What this is
Contractor invites a client → client answers an AI-guided per-trade wizard (EN/ES), adds photos → concept pictures +
budget range → submits → contractor reviews/verifies → estimate → proposal PDF → client accepts in portal → project.
**v1 trade = `concrete_flatwork`; the framework serves any of the 127 taxonomy trades** (user requirement: every trade in
scope; adding one = one module in `api/src/lib/intake/trades/` + catalog rows, no routes/tables/UI).

## State at end of session — all committed and pushed
| Phase | Status | Key commits |
|---|---|---|
| P1a trade-generic intake framework (`api/src/lib/intake/`) | ✅ | 2248164 |
| P1b `concrete_flatwork` + migration 0045 (14 assemblies) | ✅ | 6399236 |
| P2 API + migration 0046 (5 tables, RLS forced) | ✅ | a8d8893 |
| P3 web (client wizard, contractor inbox/review/settings, i18n `studio`) | ✅ | 98316f6 |
| P4 proposal response + convert to project, migration 0047 | ✅ | a740747 |
| Cloud image adapters (OpenAI `gpt-image-1`, Gemini 2.5 Flash Image) + spike script | ✅ code / ⏳ untested vs real APIs | b8d783b |
| Multi-area requests, AI usage panel, self-serve resend link | ✅ | f12a538, c3ca6ef |
| Fixes: presigned URL host (all uploads), saved language never applied (web-wide), visual pass, T-11 UA on public studio routes | ✅ | 9228a31, 5b286db, 9ee885a, be2c7fc |
| **P0 provider spike (real images)** | ⏳ blocked on keys + photos | — |
| P5 more trades / marketplace entry | not started | — |

Verified: route-chain tests (`design-studio.test.ts` 38), intake guard/unit suites (46+), provider/image-meta tests;
live E2E on the Docker stack (real Ollama assistant, mock-echo render, real proposal PDF); headless screenshot pass
(client EN+ES phone viewport, contractor desktop); RLS audit PASS.

## Local environment notes
- `.env` (gitignored) has `STUDIO_IMAGE_PROVIDER=mock` (echoes the photo) and `STUDIO_LLM_PROVIDER=ollama` (local, $0).
- `docker-compose.yml` sets `STORAGE_PUBLIC_ENDPOINT` default `http://localhost:19000` → browser uploads work on this machine only.
- Migrations 0045–0047 are applied to the local DB; api + web containers were rebuilt from this branch (the live
  `thejobsite.app` stack is serving this branch's build right now).
- Test data: requests/clients under tenant `e2e-test` (seeded by `api/src/scripts/seed-e2e-tenant.ts`).
- Screenshots without the Playwright MCP: `npm i playwright-core` in a scratch dir + `executablePath` =
  `~/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`. The live-E2E/screenshot scripts lived in the session
  scratchpad (not committed) — recreate from the flow in "Live verification" below if needed.

## NEXT SESSION → `docs/Design_Studio_Testing_Providers_Plan.md`
Claude-subscription bridge for the assistant + open image models (ComfyUI: Qwen-Image-Edit / FLUX Kontext; optional
hosted) + provider comparison — owner's testing only.

## Decisions waiting on the user
1. **Image provider (P0).** Set `OPENAI_API_KEY` and/or `GEMINI_API_KEY` in `.env`, put ~10 real patio photos in a folder, then:
   `cd api && npx tsx --require dotenv/config src/scripts/studio-provider-spike.ts <dir> --providers openai,gemini`
   → open `<dir>/spike-*/index.html`; judge realism + "house/yard unchanged"; record real $/image; set
   `STUDIO_IMAGE_PROVIDER` + the `STUDIO_*_COST_MICRO_USD` estimates accordingly.
2. **Tier pricing** — included / add-on (like GC $99) / per-picture overage. Then replace the placeholder caps
   (`STUDIO_MAX_RENDERS_PER_SCOPE` 6, `..._AI_CALLS_PER_SCOPE` 20, `..._RENDERS_PER_TENANT_MONTH` 200) and add the gate
   (`assertTier`/`assertHasAddon`) in the studio routes + `Pricing_Tier_Enforcement_Matrix.md`.
3. **Remote uploads** — Cloudflare tunnel route `files.thejobsite.app` → `minio:9000` (no Access gate), then
   `STORAGE_PUBLIC_ENDPOINT=https://files.thejobsite.app` in `.env` + `docker compose up -d api`. See deployment skill.
4. **T-11 platform gap (pre-existing)** — `/v1/auth/login`, `forgot-password`, `homeowner/auth/exchange`,
   `sub-portal/auth/accept` accept requests without a User-Agent. Option: global `onRequest` hook (exempt `/health`,
   webhooks) after confirming mobile + webhook senders always send one.
5. **Lock T-65?** Seven invariants in the spec/skill; add to `LOCKED_DECISIONS.md` only with sign-off.
6. **Merge PR #69** once 1–3 are settled (or merge now with mock renders and keep the feature unannounced).

## Next build steps (once unblocked)
- After P0: run one real render through the product; tune `prompt.scene`/suffix for the chosen provider; consider a
  mask/area hint if the model paints outside the slab.
- Second trade module to prove the "any trade" claim end-to-end (fencing or painting are the cheapest), via the
  "How to add a trade" checklist in the spec.
- Small follow-ups found this session: contractor header missing-glyph icon next to the bell; `pusher/auth` 400s in
  the browser console (both pre-existing); mobile push for studio notifications has no deep link (web-first).

## Live verification (how it was tested — repeat after changes)
1. Owner login (`owner@e2e.thejobsite.test` / seed password, tenant `e2e-test`) → `PUT /v1/studio/offerings/concrete_flatwork`.
2. `POST /v1/studio/invites` → mint a link token with `generateClientStudioMagicLinkToken(clientId, tenantId)` →
   `POST /api/portal/studio/exchange` (web proxy sets cookie).
3. Client: trades/intake → upload (presigned PUT) → PATCH answers → `ai/guide` → accept → `renders` (poll) →
   common answers → submit.
4. Owner: review → verify → `POST …/estimate` → `POST /v1/estimates/:id/proposal {send, recipient_email}` → client
   `proposal/respond accepted` → `POST …/convert` → client sees the project in `/v1/client-portal/projects`.
