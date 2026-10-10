# Follow-up Session Plan — 2026-10-07

> Read this at the start of the next session. It lists everything still open after the session that
> hardened and merged **Design Studio** (PR #69). Pick one track, then branch from a fresh `main`
> (`git checkout main && git pull && git checkout -b feat/<name>`).
>
> ⚠️ **Machine limits:** one heavy job at a time across ALL sessions (ci-local, docker builds, ComfyUI
> renders, installs). The box froze on 2026-10-06 from stacked workloads. See
> `docs/Design_Studio_Handover_2026-10-06.md` §Machine limits.

## State at close

- **Design Studio (PR #69): merged to `main`.** P1a–P4 built; pre-merge review found 10 issues, all fixed
  with mutation-checked tests (`17390c7`). Local CI green (744 API tests + api/web tsc).
- `.env` (local): `STUDIO_IMAGE_PROVIDER=mock`, `STUDIO_LLM_PROVIDER=claude_bridge` (owner-testing only).
- **The running Docker API predates the hardening commit.** First step of any studio session:
  `docker compose build api && docker compose up -d api` (the api image has no source mount; migrations
  0045–0047 are already applied locally).
- **`/dev/kvm` still missing** (CPU virtualization off in BIOS since 2026-09-27) → no Android emulator / Maestro.

---

## Track A — Design Studio: decisions the owner must make (blocks client use, not code)

| # | Decision | Options | Notes |
|---|----------|---------|-------|
| A1 | **Production image provider** | OpenAI `gpt-image-1` (~$0.063/img est.) · Gemini 2.5 Flash Image (~$0.039) · Replicate Qwen-Image-Edit (~$0.03) | Adapters + tests exist; only a key is missing. Run the spike first: `npx tsx --require dotenv/config src/scripts/studio-provider-spike.ts <photos-dir> --providers openai,gemini,replicate`. Local ComfyUI (~7 min/img, non-commercial weights) is owner-testing only. |
| A2 | **Tier / pricing** | included · add-on (like GC $99) · per-render overage | Only the env caps limit spend today (`STUDIO_MAX_*`). Gate goes in the service layer (`assertTier`/`assertHasAddon`) per the enforcement matrix. |
| A3 | **Lock T-65** | approve as written | Invariants are in `docs/Client_Visualizer_v1_0.md` §Invariants. Add row to `LOCKED_DECISIONS.md` + `PROJECT_MASTER_REFERENCE.md` registry row 22 "proposed" → locked. |
| A4 | **Remote uploads (whole app)** | Cloudflare dashboard: hostname route `files.thejobsite.app` → `minio:9000` (Type HTTP, **no** Access gate) | Then `.env` `STORAGE_PUBLIC_ENDPOINT=https://files.thejobsite.app` + `docker compose up -d api`. Until then no remote tester can upload anything. Owner-only action. |
| A5 | **LLM provider for clients** | Claude API (paid key) · Ollama local | `claude_bridge` rides the owner's subscription — must be swapped before any real client uses the studio. |
| A6 | Legal copy | render disclaimer + photo consent/privacy | Open question 5 in the spec. |

## Track B — Design Studio: code follow-ups (no decision needed)

1. **Second trade module** (P5) — proves "one module + catalog rows". Candidates: `fencing`, `asphalt_paving`,
   `gutters`. Checklist: spec §"How to add a trade" + skill `design-studio`.
2. **Multi-scope picker** in the client wizard (data/API/wizard already support it; the picker starts one scope).
3. **Replace `.claude/commands/scaffold-trade-module.md`** (creates per-trade tables — violates T-65 invariant 5)
   with `/scaffold-intake-module`.
4. **Screenshot pass** of the client wizard + contractor pages EN+ES (Playwright MCP was down all session).
5. **`/rls-audit`** on the 5 studio tables (listed in spec §Verification, not yet run).
6. Self-serve client re-login link exists — verify end-to-end once A4 lands (email links → tunnel).
7. Minor hardening seen in review but out of scope: the password-reset token (`pwd_reset:`) still does
   GET-then-DEL (same race pattern fixed for magic links) — switch to `GETDEL`.
8. Render quality: broom texture reads "stippled", not parallel lines — prompt tweak in `concrete_flatwork` `prompt`.

## Track C — Mobile 1.3.0 background sync (branch `feat/mobile-background-sync`, unmerged)

- Beta APK: `get.thejobsite.app/thejobsite-1.3.0-beta.apk`.
- **Blocked on BIOS virtualization.** At session start: `ls /dev/kvm`. If present →
  `mobile/.maestro/run-background-sync.sh`, then publish 1.3.0 + merge (steps in repo-root `TODO.md` on that branch).
  If absent → manual phone test instead (install beta APK, log time offline, close app, reconnect, confirm the entry
  syncs without reopening).

## Track D — Roadmap backlog (planned, not started)

| Item | Size | Ref |
|------|------|-----|
| City of San Diego + CA state/county jurisdiction layers (pure data) | S | memory `san_diego_jurisdiction_plan` |
| Mobile: Maestro flows for remaining roles + asset QR yard path | M | `Mobile_Enterprise_Plan_v1_0.md` §C3 |
| Mobile: sync integration tests against the real Docker API | M | §C2 |
| Mobile: native near-me map (Project Map Phase 4) | L (native build) | `Project_Map_v1_0.md` |
| Mobile: blueprint review/import surface | M | Mobile plan §6 |
| Geofence enforcement + crew bulk clock-in | M | OQ-17 |
| Portal migration: copy file bytes to the target tenant prefix | S | `SuperAdmin_Operations_v1_0.md` §4 |
| v1.1 Spanish data: task titles, step content, catalog names | L | i18n skill |
| iOS build / TestFlight | M | Mobile plan §6 |
| Open questions OQ-03, OQ-08, OQ-11/12 | owner | `PROJECT_MASTER_REFERENCE.md` §4 |

## Unmerged remote branches to triage

`origin/fix/client-portal-scoping`, `origin/fix/security-hardening`, `origin/docs/session-close` — #67/#68 are on
`main`, so these are likely stale. Confirm with `git log main..origin/<branch>` and delete if empty.

## Suggested next session

Rebuild the api container → A4 (tunnel route, 5 min of dashboard work) → run the A1 provider spike with real keys
→ decide A1/A2/A3 → B1 second trade.
