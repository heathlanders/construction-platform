# Timecard / Payroll Gaps — Session Handoff

> Continuation plan for the time-tracking "code gaps" worklist. Pick up here in a new session.
> Context docs: `docs/Time_Tracking_Payroll_v1_0.md` (Doc 17), skill `time-tracking`.

---

## Done (this session)

1. **Docs reconciled** to the shipped timecard system (prior session).
2. **Web role gating on timecard pages** — `web/src/components/auth/role-gate.tsx` (server gate via
   `getSession()` → redirect). Wiring:
   - `/timecards` (review) → `owner`/`project_manager` — `page.tsx` is a server gate wrapping
     `review-client.tsx` (client logic split out so folder children stay open).
   - `/timecards/board` → owner/PM — `board/layout.tsx`.
   - `/timecards/clock` → owner/PM/foreman/field_tech — `clock/layout.tsx`.
   - `/timecards/my` → open (no gate). Disallowed → redirect `/timecards/my`.
   - Roles are lowercase `user_role` enum values (match Sidebar). API still enforces (defense-in-depth).
   - Doc updated: `web/CLAUDE.md`.
   - ⚠️ Web runs a prod build (no source mount) → `docker compose build web && docker compose up -d web`
     to take effect live. **Not yet rebuilt.**
3. **Money-path API tests** — `api/src/test/timecards-payroll.test.ts` (14 cases, all green):
   time-entry create + role gate, timecard FSM (open/submit/approve/reject), OT summation,
   optimistic-lock 409, payroll Monday + approved-timecard gates + role gate, approve→
   `payroll.{provider}_push` enqueue, export→`payroll.export_csv` enqueue. Mocks `../lib/queue.js`
   (spy `sendJob`) so no pg-boss boots; each scenario uses its own Monday week (partial-unique
   one-active-card/user/week).
   - **Bug fixed in passing:** `payroll.ts` used a bare global `crypto.randomUUID()` (undefined under
     vitest) → now imports `randomUUID` from `node:crypto`.
   - `npx tsc --noEmit` clean. Docs updated: `api/CLAUDE.md`, Doc 17 gaps table, time-tracking SKILL.

**Nothing committed.** Commit/branch per the repo git rule when ready.

4. **Gap A — worker CSV math test** (`api/src/test/payroll-worker.test.ts`, 3 cases, green):
   calls `handlePayrollCsvExport()` directly, mocks `../lib/storage.js` (captures the uploaded CSV
   body), SendGrid left unconfigured → email skipped. Asserts default-rate regular/OT split + dollar
   formatting, per-entry `AVG(hourly_rate_cents)` overriding the payroll-settings default, and the
   `payroll.csv_exported` audit row.
   - **Live bug fixed:** the CSV rate-AVG query joined `time_entries.timecard_id` — that column does
     **not exist** (time_entries↔timecard linkage is by `user_id` + week range, see `timecards.ts`).
     The export threw at runtime for any tenant with payroll settings. Rewrote to link by
     `user_id` + ISO week range. `npx tsc --noEmit` clean. Docs updated: Doc 17 gaps table,
     `api/CLAUDE.md`, time-tracking SKILL.

---

## Remaining gaps (pick up here)

| # | Gap | Effort | Notes / approach |
|---|-----|--------|------------------|
| ~~A~~ | ~~**Worker CSV math test**~~ | — | **DONE**. Also fixed the broken `timecard_id` rate query it exposed. |
| ~~B~~ | ~~**Mobile cost-code / budget-line picker**~~ | — | **DONE**. Offline-aware Modal pickers in `TimeEntryScreen.tsx` — fetch `/cost-codes` + `/budget-line-items?project_id=` on mount, cache per tenant/project in AsyncStorage (`opt:cost_codes:*`/`opt:budget_lines:*`), fall back to cache offline. Sets `cost_code_id`/`budget_line_item_id` on the record; `sweepTimeEntries()` already pushes them. i18n EN+ES added (`field.cost_code`/`budget_line_item`/`none_selected`/`select_*`). Mobile `tsc` shows only PRE-EXISTING camelCase errors in `sync.ts`/`database.ts` (untouched); my files clean. |
| ~~C~~ | ~~**Mobile clock-in/out + timecard screens**~~ | — | **DONE**. `ClockScreen.tsx` already existed + was registered but its `time_punches.*` i18n keys were undefined and `tc('common.x')` was double-prefixed → rendered raw keys; both fixed (EN+ES). Built `MyTimecardScreen.tsx` (open current ISO week → auto-sum total+OT, submit FSM T-60, rejection note + reopen, recent-card history). Registered in `AppNavigator.tsx` (`Timecard`), reached from Projects header 🗓️ (clock = ⏱️). `field.timecards.*` + `common.nav.timecard` EN+ES. API-only/online; approve/reject stay web-only. Mobile `tsc` adds zero new errors (only the pre-existing sync/model decorator debt). |
| ~~D~~ | ~~**Mobile T-13/T-14 Tier-2 conflict UI**~~ | — | **DONE**. Server: `PATCH /time-entries/:id` 409 now returns `server_record` (test added in `timecards-payroll.test.ts`, 18/18 green). Mobile: `lib/api.ts` throws `ApiError {status, body}`; `sweepTimeEntries` flags 409s `sync_status='conflict'` + stashes the snapshot (`lib/conflicts.ts`, AsyncStorage `conflict:time_entries:*`); `screens/ConflictResolveScreen.tsx` = field-level Keep Mine/Use Server (all differing fields required, re-conflict re-stashes); `screens/ConflictsScreen.tsx` inbox + `components/ConflictBadge.tsx` reactive ⚠️ header badge. i18n `field.conflicts.*` + `common.nav.conflicts` EN+ES; nav `Conflicts`/`ConflictResolve`. **Also fixed** `sweepTimeEntries` camelCase accessors (`record.hoursWorked`, `r.syncStatus`) that were runtime no-ops → time-entry sync now actually works (mobile `tsc` errors 184→171). |
| E | **Mobile batch + background sync** | L | **PARTIAL (done what's OTA-safe)**. **Pull** now uses batch `GET /v1/sync/pull` (`pullTimeEntries()`, incremental `since` cursor in AsyncStorage, upsert by `server_id`, T-12-guarded, skips dirty locals) + a 3-min foreground `setInterval` in AppNavigator. Server `sync.ts` `time_entries` pull/pushCols extended with `hourly_rate_cents`+`budget_line_item_id` (test `api/src/test/sync-time-entries.test.ts`, 3 cases). **Deferred (with reason):** batch *push* — `POST /v1/sync/push` assumes shared UUID row-ids, but this app uses the dual-id `server_id` pattern (WatermelonDB default 16-char ids), so adopting it needs a shared-id migration across all 5 models + schema (risky, no device test here). OS-level background sync (app closed) needs `expo-background-fetch`, a **native module** → EAS rebuild + on-device validation, not OTA-shippable; adding it blind risks a launch crash. Both are genuine §B2 follow-ups, not quick wins. |

**All five gaps addressed (A–D fully; E partially — the OTA-safe pull + foreground-interval done,
batch-push + OS background-sync deferred with reasons above).** Remaining follow-ups, larger Mobile
Enterprise Plan work:
- **Shared-id migration** (unblocks batch `/v1/sync/push` + WatermelonDB-native `synchronize()`).
- **OS background sync** via `expo-background-fetch` (native module → EAS rebuild + device test).
- Extend the conflict UI + the snake_case-accessor fix to the other sweeps (daily/punch/safety),
  which still use camelCase no-op accessors.

---

## Working notes / gotchas

- **Test harness:** vitest, real Postgres via `testPool` (superuser, BYPASSRLS) for fixtures; routes
  exercised with `app.inject()` + hand-signed JWT (`makeToken`). Build a minimal Fastify app per file,
  `app.register(routes, { prefix: '/v1' })`, `registerErrorHandler(app)`. See
  `api/src/test/financial.test.ts` and `timecards-payroll.test.ts` as templates.
- **Bodyless POST gotcha:** `app.inject` POST with `content-type: application/json` and empty body →
  Fastify 400. Send `body: '{}'` for submit/approve-style calls that take no body but get the header.
- **JWT roles in tests are UPPERCASE** (`OWNER`, `FIELD_TECH`); web/DB `user_role` enum is lowercase.
- **Approval-gate flakiness (this session):** Edits to context-injected docs (`docs/*`, `.claude/skills/*`)
  intermittently timed out; a fresh `Read` of the target region before `Edit` cleared it. If edits to
  those files hang, Read first.
- **Doc-update discipline (user ask):** update the relevant doc/skill/CLAUDE.md alongside each gap.
- **`JWT_SECRET` must be in the shell env** for the route tests — without it, `jwt.verify` uses
  `undefined` and every authed request 401s (all 14 `timecards-payroll` cases fail). vitest.config's
  dotenv load of `../.env` doesn't always reach the fork via a bare `npx vitest`. Export it first:
  `export $(grep -h JWT_SECRET .env | head -1)`. `payroll-worker.test.ts` is unaffected (no JWT).

---

*Handoff written: 2026-06-24.*
