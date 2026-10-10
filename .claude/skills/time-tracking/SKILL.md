# Time Tracking & Payroll Skill
**Feature: Sessions 7, 22–26 (documented Session 40)**
**See full spec: @docs/Time_Tracking_Payroll_v1_0.md**
**Locked decisions: T-02, T-10, T-12, T-60, T-61, T-62**

## What this feature does

Captures field labor (manual time entries OR clock in/out punches), rolls daily entries into weekly
timecards with a draft→submitted→approved/rejected approval workflow, and exports approved hours to
payroll (CSV + QuickBooks/Gusto/ADP push). **No tier gate — available on every tier.**

## Key invariants

1. All 6 tables (`time_entries`, `timecards`, `time_punches`, `tenant_settings`,
   `tenant_integrations`, `user_payroll_settings`) are **tenant-scoped, RLS enabled + forced**.
2. **Two capture modes** (T-61): `tenant_settings.time_tracking_mode` ∈ `manual` | `clock_in_out`.
   Clock-out **upserts a `time_entries` row** (`upsertTimeEntry()`) so both modes feed one ledger.
3. **One open punch per user** — DB partial unique `(tenant_id,user_id) WHERE clock_out_at IS NULL AND deleted_at IS NULL`. Don't bypass.
4. **One active timecard per user/week** — DB partial unique `(tenant_id,user_id,week_start) WHERE status != 'rejected' AND deleted_at IS NULL`. Rejected cards don't block a fresh one.
5. **Timecard FSM** (T-60): open/submit re-sum `time_entries` → `total_hours`, `overtime_hours = max(0, total_hours − 40)`. Approve/reject are OWNER/PM only, optimistic-locked, audited.
6. **Optimistic locking** (T-12): `version` on time_entries/timecards/time_punches. 409 `VERSION_CONFLICT` on mismatch.
7. **Money in cents** (T-02): `hourly_rate_cents`, `default_hourly_rate_cents`. Never floats.
8. **Cost rollup**: `time_entries.budget_line_item_id` set → dispatch `reconciliation.field_cost_rollup` → `budget_line_items.actual_cents = SUM(FLOOR(hours_worked × hourly_rate_cents))`.
9. **Payroll export gate** (T-62): `POST /v1/payroll/export` requires ≥1 approved timecard for the week. Provider tokens stored **AES-256-GCM** encrypted in `tenant_integrations`. On approve, one `payroll.{provider}_push` job per active integration.
10. **Auto-clockout** (T-61): `time_punch.auto_clockout` midnight cron closes still-open punches, sets `auto_clocked_out=true`, creates the time_entry.
11. All jobs carry `tenant_id` (T-10) + `withTenantContext()` (T-42).

## Table quick reference

| Table | Migration | Notes |
|-------|-----------|-------|
| `time_entries` | 0001 + 0002 | Daily ledger. Mobile-writable (offline). |
| `timecards` | 0005 | Weekly FSM. Partial unique per user/week. |
| `time_punches` | 0011 | Clock in/out. Partial unique one-open-per-user. |
| `tenant_settings` | 0011 | `time_tracking_mode` toggle. |
| `tenant_integrations` | 0007 | Encrypted payroll tokens (QB/Gusto/ADP). |
| `user_payroll_settings` | 0007 | Per-user rate, OT mult, pay frequency. |

## Employee guardrails (Session 43 — 2026-06-30)
- **Rate is admin-only.** Employees never enter their own `hourly_rate_cents` on mobile — the field
  is removed from the Time hub Add-Hours + `TimeEntryScreen`. Rate is set by an OWNER (or ACCOUNTANT)
  in payroll settings / at user creation (`user_payroll_settings.default_hourly_rate_cents`) and
  resolved server-side (clock-out `getHourlyRate()`; payroll CSV falls back to the default).
- **Owner sets pay at user creation.** `POST /v1/users` accepts optional
  `employment_type`/`default_hourly_rate_cents`/`overtime_multiplier`/`pay_frequency`, applied
  **only when the creator is OWNER**, inserting the `user_payroll_settings` row in the same txn.
- **FIELD_TECH can log their OWN time.** `time-entries` write roles = OWNER/PM/FOREMAN/ACCOUNTANT/**FIELD_TECH**;
  a non-manager (field tech) may only create/edit/delete entries for **themselves** (self-guard →
  403 for another user_id). Managers may log for anyone.
- **Project is optional** on a time entry (`time_entries.project_id` nullable, migration 0024) — the
  employee Add-Hours screen requires only date + hours.
- **Timecard approvers = OWNER / PM / ACCOUNTANT** (`APPROVE_ROLES`).

## Enterprise clock in/out — multiple timestamps (Session 44 — 2026-07-01)
- **Edit-safe day rollup.** A day's clock `time_entry` (`notes='Via clock in/out'`) = **SUM of that
  day's CLOSED punches** for that user+date+project, **recomputed from scratch** on every
  clock-out / add / edit / delete (`recomputeClockDay()` in `time-punches.ts`). Robust to multiple
  punches, corrections, and deletions (replaced the old fragile incremental-add). Groups per project
  (null-safe `IS NOT DISTINCT FROM`); clock entries whose punches all went away are soft-deleted.
  **Only touches `'Via clock in/out'` entries — manual entries are never modified.**
- **Missed punches.** `POST /v1/time-punches {clock_in_at, clock_out_at, project_id?, user_id?}` adds
  a completed punch (forgotten clock). Field tech = **own only**; OWNER/PM may add for anyone. Then
  recomputes the day.
- **Self-service edit/delete.** `PATCH` + new `DELETE /v1/time-punches/:id` are open to WORKER_ROLES
  with a **self-guard** (field tech/foreman = own; OWNER/PM = any, via `EDIT_ANY_ROLES`). Both
  recompute the affected day(s) and re-link `time_entry_id`.
- **Project optional on clock-out** — no more `project_required` 422 (workers can just clock time).
- **Return the FINAL row.** A version trigger bumps `time_punches.version` on the internal
  `time_entry_id` link update, so clock-out/POST/PATCH re-`SELECT` and return the row AFTER all
  updates (else the client's next optimistic-locked call 409s). ⚠️ **`MIN(uuid)` has no aggregate** —
  the recompute sums cost_code via `MIN(cost_code_id::text)::uuid`.
- Tests: `api/src/test/time-punches.test.ts` (6) — multi-punch sum, edit recompute, delete-to-zero
  soft-delete, field-tech self-only, invalid range. Requires `tenant_settings.time_tracking_mode='clock_in_out'`.
- **Mobile** `components/PunchEditor.tsx` (pure-JS, OTA): add/edit/delete a punch — date (CalendarPicker)
  + start/end **time stepper** + optional project + live duration; delete in edit mode. Wired into the
  Time hub clock section ("＋ Add time" + tap a closed punch to correct). i18n `field.punch.*` (EN+ES).

## API quick reference

```
# Time entries — writes OWNER/PM/FOREMAN/ACCOUNTANT/FIELD_TECH (field tech = self-only)
GET/POST            /v1/time-entries      # project_id optional; rate not client-set
GET/PATCH/DELETE    /v1/time-entries/:id

# Timecards
GET/POST            /v1/timecards
POST                /v1/timecards/:id/submit          — any authed (own)
POST                /v1/timecards/:id/approve         — OWNER/PM/ACCOUNTANT
POST                /v1/timecards/:id/reject          — OWNER/PM/ACCOUNTANT (rejection_note required)

# Time punches (enterprise clock in/out — project OPTIONAL on all)
POST                /v1/time-punches/clock-in         — OWNER/PM/FOREMAN/FIELD_TECH
POST                /v1/time-punches/clock-out        — OWNER/PM/FOREMAN/FIELD_TECH (no project required)
POST                /v1/time-punches                  — add a completed "missed" punch (self-only for field tech)
GET                 /v1/time-punches/active           — OWNER/PM (on-the-clock board)
GET                 /v1/time-punches
PATCH               /v1/time-punches/:id              — correct times (self or OWNER/PM); recomputes the day
DELETE              /v1/time-punches/:id              — remove a punch (self or OWNER/PM); recomputes the day

# Payroll
POST                /v1/payroll/export                — OWNER/ACCOUNTANT/PM (needs approved timecard)
GET                 /v1/payroll/exports
GET/POST            /v1/payroll-settings              — OWNER/ACCOUNTANT
PATCH/DELETE        /v1/payroll-settings/:userId      — OWNER/ACCOUNTANT
```

## Background jobs

| Job type | Worker | Trigger |
|----------|--------|---------|
| `reconciliation.field_cost_rollup` | `field-cost-worker.ts` | entry create/update w/ budget_line_item_id |
| `payroll.export_csv` | `payroll-worker.ts` | `POST /payroll/export` |
| `payroll.{quickbooks,gusto,adp}_push` | `payroll-worker.ts` | timecard approve |
| `time_punch.auto_clockout` | `time-punch-worker.ts` | midnight cron |

## Mobile state & gaps

- `TimeEntryScreen.tsx` + `TimeEntry` WatermelonDB model — **offline-first** (1 of 6 offline-write screens).
- Sync (**batch since 2026-07-24**, Plan §B2): ONE `POST /v1/sync/push` + ONE `GET /v1/sync/pull` per
  sweep for all offline tables (`lib/sync.ts` table registry). `server_id` is minted client-side
  before the first push → idempotent creates; local `version` mirrors the server's `+1`; local
  deletes propagate; single pull cursor `sync:lastPulledAt:v2`, skips dirty locals. Runs on
  foreground + a 3-min foreground interval. Only **OS background sync** stays deferred (native
  module). ⚠️ Batch push bypasses `time-entries.ts`, so the server mirrors its side effects on
  `SyncTableConfig`: `costRollup` (field_cost_rollup after commit, deduped per budget line) and
  `ownerCol`/`managerRoles` (field-tech self-guard → `conflict_type:'forbidden'`, no `server_record`).
- Cost-code/budget-line pickers: offline-aware Modal pickers in `TimeEntryScreen.tsx` (fetch
  `/cost-codes` + `/budget-line-items?project_id=`, AsyncStorage-cached `opt:cost_codes:*` /
  `opt:budget_lines:*`, cache fallback offline) set the fields the batch push already carries.
- Clock + timecard screens: `ClockScreen.tsx` (punch in/out, project picker/switch, week summary —
  `time_punches.*` i18n + a `tc('common.x')` double-prefix bug fixed) and `MyTimecardScreen.tsx`
  (open current ISO week, submit FSM, rejection+reopen, history). Both API-only/online, reached from
  the Projects header (⏱️ / 🗓️) and the bottom tab bar. Approve/reject stay web-only.
- **Timecard tab is open to all roles (2026-06-30):** `MyTimecardScreen` = own week (open/submit),
  API allows any authed user → bottom Timecard 🗓️ tab + `nav.timecard` manifest action show for all
  9 roles; `actions.log_time` includes **owner**. Add hours via the ⏱️ Log Time tile (the Timecard
  tab only sums them). See `mobile-role-nav` skill.
- T-13/T-14 Tier-2 conflict UI (DONE): a `version_conflict` on push returns `server_record`; the sweep
  flags the record `sync_status='conflict'` + stashes the snapshot (`lib/conflicts.ts`, AsyncStorage,
  key `conflict:time_entries:{localId}`). ONE **registry-driven** `ConflictResolveScreen` serves every
  conflict-capable table (`lib/conflict-registry.ts`; `time_entries` is tier 2, fields
  hours/rate/cost-code/budget-line/notes) = field-level Keep Mine/Use Server, all differing fields
  required (T-14); `ConflictsScreen` inbox + `ConflictBadge` ⚠️ header count. `mobileApi` throws
  `ApiError {status, body}`.
- **Gaps:** punch/timecard screens are online-only (not offline); WatermelonDB write coverage is 6
  offline tables (Mobile Enterprise Plan §B1) and OS background sync is unbuilt (§B2).

## File locations

```
docs/Time_Tracking_Payroll_v1_0.md              — full spec
prisma/migrations/{0001,0002,0005,0007,0011}    — schema
api/src/routes/v1/{time-entries,timecards,time-punches,payroll,payroll-settings}.ts
api/src/workers/{field-cost-worker,payroll-worker,time-punch-worker}.ts
web/src/app/(dashboard)/timecards/**            — hub/board/my/clock
web/src/app/(dashboard)/settings/payroll/page.tsx
web/locales/{en,es}/field.json                  — i18n (timecards/time_entries/time_punches/board)
mobile/src/screens/TimeEntryScreen.tsx · mobile/src/models/TimeEntry.ts · mobile/src/lib/sync.ts
api/src/test/timecards-payroll.test.ts          — money-path API tests (14 cases)
```

## Tests
API money path: `api/src/test/timecards-payroll.test.ts` — entry create+role gate, timecard FSM
(open/submit/approve/reject), OT sum, optimistic-lock 409, payroll Monday+approved gates,
approve→provider-push enqueue. `vi.mock('../lib/queue.js')` spies `sendJob` (no pg-boss); each
scenario uses its own Monday week (partial-unique one-active-card/user/week).
Worker CSV math: `api/src/test/payroll-worker.test.ts` — calls `handlePayrollCsvExport()` directly,
mocks `../lib/storage.js` (captures CSV body), SendGrid unconfigured. Asserts regular/OT split,
default-rate vs per-entry AVG-rate resolution, dollar formatting, audit row. (Fixed a live bug: the
rate query joined `time_entries.timecard_id`, a column that doesn't exist — now links by user+week.)
Pending: mobile money-path tests.
