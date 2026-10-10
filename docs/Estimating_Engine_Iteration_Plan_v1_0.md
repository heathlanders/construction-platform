# Estimating Engine — Iteration Plan (next session)
**Branch:** `feat/estimating-engine` (pushed; not merged). **Base spec:** `docs/Estimating_Engine_v1_0.md` · **Skill:** `.claude/skills/estimating/SKILL.md` · **Locked:** T-63.

> **Shipped (Session 46):** pure engine (`lib/estimating/`), migration 0028 (3 RLS tables + seeded
> system catalog), routes (`estimates` + `estimate-assemblies`), web (list/detail/catalog), 23 tests,
> docs. Migration applied to dev DB. Everything below is the REMAINDER.

---

## Phase 0 — Live verify + PR (do first, ~30 min)
- [ ] `docker compose build web && docker compose up -d web` (web runs a prod build — new pages need a rebuild to appear).
- [ ] Click-through on a real project (the sample project has blueprint facts): create estimate → generate (assembly + parametric) → edit a line → markups → to-bid-package → award → confirm `budget_line_items` seeded. Catalog editor: create a tenant override, confirm it wins on regenerate.
- [ ] Run full API suite once (`cd api && npx vitest run`) — confirm no cross-file regression from 0028.
- [ ] Open the PR (link printed on push). Keep it open until the iteration lands, or merge Phase 0 now and stack the rest.

## Phase 1 — Proposal PDF (customer-facing bid) — ✅ DONE (2026-07-13, migration 0029)
- [x] `POST /v1/estimates/:id/proposal` — **synchronous** (chosen over async: PDF is tiny, immediate download, no polling infra): render branded proposal (letterhead=tenant name, scope lines, optional cost-breakdown toggle, totals, assumptions, terms) via **pdfkit** (`api/src/lib/estimate-pdf.ts`, pure/deterministic) → upload direct-to-live (system-generated file, no quarantine — mirrors `payroll-worker`) → `estimates.proposal_path`. `send=true` emails a **7-day** link (T-35 precedent; `generateDownloadUrl` gained an optional TTL param) via inline SendGrid (graceful skip) + advances draft/final→`sent`. Returns `{download_url (15-min), sent}`.
- [x] `GET /v1/estimates/:id/proposal` — fresh 15-min URL (404 `PROPOSAL_NOT_GENERATED` before first render).
- [x] Web: Download / Send-to-customer controls on the estimate detail (`estimates/[estimateId]/page.tsx`); i18n `projects.estimates.proposal.*` EN+ES.
- [x] Tests: `api/src/test/estimate-proposal.test.ts` (9). No worker/dispatcher needed (sync).

## Phase 2 — Learn-from-actuals (the moat)
- [ ] `GET /v1/estimate-assemblies/suggestions?trade=` — derive refined unit costs from the tenant's own history: labor $/unit from `time_entries` (hours × rate) grouped by cost_code, material from awarded `vendor_bids`/`invoices`. Read-only advisory (never auto-overwrites the catalog).
- [ ] Web: on the catalog editor, show "your actuals suggest $X" next to the tenant/system value + one-click "apply to my catalog". Deterministic aggregation, no AI.
- Cold-start: degrade silently when no history.

## Phase 3 — Catalog depth (data-ops, no engine change) — ✅ DONE (2026-07-13, migration 0030)
- [x] Expanded seeded system assemblies (+26 → 60 system rows): mechanical (duct LF, duct insul, refrigerant LF, mini-split, thermostat, RTU, VAV), building (shingle SQ, underlayment, concrete CY, rebar LF, wall-frame LF, sheathing, siding, window, int/ext door), electrical (sub-panel, data drop, EVSE, AC disconnect), plumbing (shower, floor drain, PEX LF, DWV pipe LF, cleanout). Migration `0030_estimate_catalog_expansion` (INSERT-only, `is_system`, `source='platform-seed'`, idempotent ON CONFLICT).
- [x] **Enabled building assembly-mode seeding** in `quantities.ts` (`seedBuilding`: window/door counts + summed room area → B-WINDOW / B-DOOR-EXT/INT / B-FRAME-SF / B-INSUL-SF / B-DRYWALL-SF; guarded on `available.has` + fact presence → still `[]` with no facts). Unit tests (3) in `estimating-engine.test.ts`.
- Note: live building generate not exercised on Example Builders (its OCR analysis carries no window/door/room facts — the thin-facts reality; seeder returns `[]` as designed). Deterministic seeder logic fully covered by unit tests.

## Phase 4 — Richer auto-takeoff
- [ ] Improve blueprint fixture/room COUNTS in the text/OCR path so assembly-mode seeding is fuller (today counts are often null → thin seed). Tracks Blueprint extraction depth — coordinate with `parse-sheets.ts`.
- [ ] Optional: seed quantities directly from `blueprint_proposed_tasks` where a task maps to an assembly.

## Phase 5 — Mobile (light) + polish
- [ ] Mobile: **read-only** estimate view (Estimator is web-first — no full editor). Or skip to v1.1 per Mobile Enterprise Plan. Confirm with user.
- [ ] ES translation of catalog item names + assumptions (data task, v1.1).
- [ ] Optional: estimate ↔ GC/sub bid bridge (cross-tenant, v1.1 — P-02 gated).

## Phase 6 — Close out
- [ ] Update `Estimating_Engine_v1_0.md` + skill with anything added; new locked decision if the PDF/actuals model introduces one.
- [ ] Memory: add an `estimating_engine` project memory entry.
- [ ] Merge PR → main (auto-ships mobile OTA only if `mobile/` changed).

---

### Guardrails (unchanged)
Cents/FLOOR (T-02) · optimistic lock (T-12) · RLS+FORCE+WITH CHECK (A-03) · burdened labor snapshot on the estimate, NOT `user_payroll_settings` (T-63) · no tier gate · engine stays pure/no-AI · every generated line keeps `assumptions[]`.

### Key files
`api/src/lib/estimating/{types,math,quantities,index}.ts` · `api/src/services/estimates.ts` · `api/src/routes/v1/{estimates,estimate-assemblies}.ts` · `api/src/test/{estimating-engine,estimates-routes}.test.ts` · `prisma/migrations/0028_estimating_engine/` · `web/src/app/(dashboard)/projects/[id]/estimates/**` · `web/src/app/(dashboard)/settings/estimating/page.tsx`
