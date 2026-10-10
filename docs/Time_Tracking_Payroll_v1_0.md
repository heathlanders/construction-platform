# Time Tracking & Payroll — Feature Specification v1.0
**"The Operating System for Construction" — Time Entries, Timecards, Clock In/Out & Payroll Export**

> **Status:** BUILT (Sessions 7, 22–26) — documented retroactively Session 40 (2026-06-24) during an
> e2e review. This doc is the canonical spec; it reconciles drift between the original `.docx` MVP
> scope and what actually shipped.
> **Locked decisions:** T-02 (cents), T-10 (job envelope tenant_id), T-12 (optimistic locking),
> T-60 (timecard approval FSM), T-61 (time-tracking mode toggle + clock-out upsert),
> T-62 (payroll token encryption + export gate + no tier gate).
> **No tier gate** — time tracking is available on every tier (Starter+).

---

## Overview

Time tracking captures field labor two ways, switchable per tenant:

1. **Manual time entries** — a worker (or PM/Foreman on their behalf) logs `hours_worked` against a
   project + date, optionally a cost code, budget line item, and hourly rate.
2. **Clock in/out (time punches)** — a worker punches in (project + cost code), punches out; the
   system computes hours and **upserts a `time_entries` row** so both modes feed one ledger.

Daily `time_entries` roll up into **weekly `timecards`** (one per user per ISO week) that run a
**draft → submitted → approved/rejected** approval workflow. Approved timecards feed **payroll CSV
export** and optional provider push (QuickBooks Payroll / Gusto / ADP).

```
 punch in/out ──┐
                ├─► time_entries (daily) ──► timecards (weekly, approved) ──► payroll CSV / provider push
 manual entry ──┘        │
                         └─► field_cost_rollup ──► budget_line_items.actual_cents (job costing)
```

The org chooses its mode in `tenant_settings.time_tracking_mode` (`manual` | `clock_in_out`).

---

## Capture modes (`tenant_settings`)

| Mode | What field workers see | Time entry creation |
|------|------------------------|---------------------|
| `manual` (default) | "Log Time" form (date + hours + cost code + notes) | Direct insert into `time_entries` |
| `clock_in_out` | Clock-in / clock-out buttons + live "on the clock" board | `time_punches` row; on clock-out, `upsertTimeEntry()` writes/updates the day's `time_entries` row |

`tenant_settings` is one row per tenant (`UNIQUE (tenant_id)`), RLS enabled + forced.

---

## Data Model (6 tables)

Full column specs live in `docs/Schema_Reference.md §Domain 17`. Summary:

| Table | Migration | Purpose |
|-------|-----------|---------|
| `time_entries` | 0001 (+0002 cols) | Daily labor ledger. `hours_worked`, `cost_code_id`, `budget_line_item_id`, `hourly_rate_cents`. Mobile-writable (offline). |
| `timecards` | 0005 | Weekly aggregation + approval FSM. One active per user/week. |
| `time_punches` | 0011 | Clock-in/out events. One open punch per user (DB-enforced). |
| `tenant_settings` | 0011 | Per-tenant time-tracking mode toggle. |
| `tenant_integrations` | 0007 | Encrypted payroll provider tokens (QB/Gusto/ADP). |
| `user_payroll_settings` | 0007 | Per-user employment type, default rate, OT multiplier, pay frequency. |

All six are tenant-scoped with **RLS enabled + forced**.

### Key columns

**`time_entries`** (mobile-writable, `version` optimistic lock):
`project_id`, `user_id`, `date`, `hours_worked NUMERIC(5,2)`, `cost_code_id?`, `budget_line_item_id?`,
`hourly_rate_cents?` (T-02), `notes?`, `version`.

**`timecards`**:
`user_id`, `week_start DATE` (Monday), `status TEXT CHECK ('draft','submitted','approved','rejected')`,
`total_hours NUMERIC(6,2)`, `overtime_hours NUMERIC(6,2)` (hours over 40), `submitted_at?`,
`approved_by?`, `approved_at?`, `rejection_note?`, `version`.
**Partial UNIQUE:** `(tenant_id, user_id, week_start) WHERE status != 'rejected' AND deleted_at IS NULL`
— one open/approved card per user per week, but rejected cards don't block a fresh one.

**`time_punches`**:
`user_id`, `project_id?`, `cost_code_id?`, `clock_in_at`, `clock_out_at?` (NULL = open),
`hours_worked?` (set on close), `auto_clocked_out BOOL` (midnight job closed it),
`time_entry_id?` (FK to the upserted entry), `notes?`, `version`.
**Partial UNIQUE:** `(tenant_id, user_id) WHERE clock_out_at IS NULL AND deleted_at IS NULL`
— a worker can only have one punch open at a time (race guard).

**`user_payroll_settings`**:
`user_id UNIQUE`, `employment_type ('w2'|'contractor_1099')`, `default_hourly_rate_cents`,
`overtime_multiplier NUMERIC(4,2)` (default 1.50), `pay_frequency ('weekly'|'biweekly'|'semimonthly'|'monthly')`,
`gusto_employee_id?`, `adp_worker_aoid?`.

**`tenant_integrations`**:
`provider ('quickbooks'|'gusto'|'adp')`, `access_token_enc` / `refresh_token_enc` (**AES-256-GCM**),
`token_expires_at?`, `external_id` (realmId/company_uuid/org_id), `status ('active'|'disconnected'|'error')`,
`last_sync_at?`, `sync_error?`. **UNIQUE `(tenant_id, provider)`**.

---

## Lifecycle / State machines

### Timecard FSM (T-60)
```
        POST /timecards (open)              /submit                  /approve
 (none) ───────────────────────► draft ───────────► submitted ───────────────► approved ──► payroll
                                   ▲                     │
                                   │      /reject        │
                                   └─────────────────────┘  (rejection_note required)
```
- Opening or submitting **re-sums** `time_entries` for the week into `total_hours`; `overtime_hours = max(0, total_hours − 40)`.
- `/approve` and `/reject` use optimistic locking (`version`) and write `audit_log`.
- On approve, one `payroll.{provider}_push` job is enqueued per active `tenant_integrations` row.
- Reject sends the card back to `draft` for the worker to fix and re-submit.

### Punch lifecycle (T-61)
```
 clock-in ──► open punch ──► clock-out ──► closed punch (+ upserted time_entry)
                  └──────► midnight cron ──► auto_clocked_out = true (+ time_entry)
```
- One open punch per user enforced at the DB (partial unique index).
- Clock-out computes `hours_worked`, pulls the worker's rate from `user_payroll_settings`, and
  **upserts the day's `time_entries` row** inside one transaction (`upsertTimeEntry()`).
- `time_punch.auto_clockout` cron closes any punch still open at midnight (`auto_clocked_out = true`).

---

## Cost linkage & job costing

- `time_entries.cost_code_id` — accounting cost code (optional, user-selected).
- `time_entries.budget_line_item_id` — when set, create/update dispatches the
  `reconciliation.field_cost_rollup` job, which recomputes
  `budget_line_items.actual_cents = SUM(FLOOR(hours_worked × hourly_rate_cents))` over all live
  entries on that line item. This is how field labor flows into project job costing.

---

## API Endpoints

All require JWT auth, `/v1/` prefix, `User-Agent` header, `withTenantContext()`. No tier gate.

### Time entries — `api/src/routes/v1/time-entries.ts`
| Method | Path | Roles | Notes |
|--------|------|-------|-------|
| POST | `/v1/time-entries` | OWNER, PM, FOREMAN, ACCOUNTANT | Create; `field_cost_rollup` if `budget_line_item_id` set |
| GET | `/v1/time-entries` | any authed | Cursor pagination; filter `project_id`/`user_id`/`date` |
| GET | `/v1/time-entries/:id` | any authed | |
| PATCH | `/v1/time-entries/:id` | OWNER, PM, FOREMAN, ACCOUNTANT | Optimistic lock (409 `VERSION_CONFLICT`); re-rollup on hours/rate change |
| DELETE | `/v1/time-entries/:id` | OWNER, PM, FOREMAN, ACCOUNTANT | Soft delete |

### Timecards — `api/src/routes/v1/timecards.ts`
| Method | Path | Roles | Notes |
|--------|------|-------|-------|
| GET | `/v1/timecards` | any authed | Filter `week`/`user_id`/`status` |
| POST | `/v1/timecards` | any authed | Open week (`week_start` Monday; `user_id` defaults to self); auto-sums hours + OT |
| POST | `/v1/timecards/:id/submit` | any authed (own) | Re-sums then → submitted |
| POST | `/v1/timecards/:id/approve` | OWNER, PM, ACCOUNTANT | Optimistic lock; enqueues provider push; audit |
| POST | `/v1/timecards/:id/reject` | OWNER, PM, ACCOUNTANT | `rejection_note` required; → draft |

Note: time-entry writes are OWNER/PM/FOREMAN/ACCOUNTANT/**FIELD_TECH** (field tech **self-only**);
`time_entries.project_id` is **optional** (nullable since migration 0024); rate is **not client-set**
(resolved from `user_payroll_settings`).

### Time punches — `api/src/routes/v1/time-punches.ts` (enterprise clock in/out, Session 44)
| Method | Path | Roles | Notes |
|--------|------|-------|-------|
| POST | `/v1/time-punches/clock-in` | OWNER, PM, FOREMAN, FIELD_TECH | Opens punch (project optional) |
| POST | `/v1/time-punches/clock-out` | OWNER, PM, FOREMAN, FIELD_TECH | Closes; **project optional**; recomputes the day |
| POST | `/v1/time-punches` | OWNER, PM, FOREMAN, FIELD_TECH | Add a completed **"missed" punch** (explicit in/out). Field tech **self-only**; managers any |
| GET | `/v1/time-punches/active` | OWNER, PM | "On the clock" board (all open punches) |
| GET | `/v1/time-punches` | any authed | Filter `user_id`/`date_from`/`date_to`/`status`/`project_id` |
| PATCH | `/v1/time-punches/:id` | self or OWNER/PM | Correct times; recomputes the day (self-guard: field tech = own) |
| DELETE | `/v1/time-punches/:id` | self or OWNER/PM | Remove a punch; recomputes the day |

**Edit-safe day rollup:** a day's clock `time_entry` (`notes='Via clock in/out'`) = **SUM of that day's
CLOSED punches** per user+date+project, recomputed on every clock-out/add/edit/delete
(`recomputeClockDay()`). Robust to multiple timestamps, edits, and deletes (replaced the incremental
`upsertTimeEntry`). Manual entries are never touched. Tests: `api/src/test/time-punches.test.ts` (6).

### Payroll — `api/src/routes/v1/payroll.ts`
| Method | Path | Roles | Notes |
|--------|------|-------|-------|
| POST | `/v1/payroll/export` | OWNER, ACCOUNTANT, PM | Async CSV export for a week; **requires ≥1 approved timecard** (T-62); 202 + `job_id` |
| GET | `/v1/payroll/exports` | OWNER, ACCOUNTANT, PM | List jobs (placeholder) |

### Payroll settings — `api/src/routes/v1/payroll-settings.ts`
| Method | Path | Roles | Notes |
|--------|------|-------|-------|
| GET | `/v1/payroll-settings` | OWNER, ACCOUNTANT | All non-portal users LEFT JOIN their settings |
| POST | `/v1/payroll-settings` | OWNER, ACCOUNTANT | 409 if user already has settings |
| PATCH | `/v1/payroll-settings/:userId` | OWNER, ACCOUNTANT | Optimistic lock |
| DELETE | `/v1/payroll-settings/:userId` | OWNER, ACCOUNTANT | Soft delete |

---

## Background jobs

| Job type | Worker | Trigger | Action |
|----------|--------|---------|--------|
| `reconciliation.field_cost_rollup` | `field-cost-worker.ts` | time_entry create/update with `budget_line_item_id` | Recompute `budget_line_items.actual_cents` |
| `payroll.export_csv` | `payroll-worker.ts` | `POST /v1/payroll/export` | Build week CSV (rates × hours), email via SendGrid |
| `payroll.{quickbooks,gusto,adp}_push` | `payroll-worker.ts` | timecard `/approve` | Push approved hours to provider |
| `time_punch.auto_clockout` | `time-punch-worker.ts` | midnight cron | Close open punches, set `auto_clocked_out`, create time_entry |

All carry `tenant_id` in the envelope (T-10) and use `withTenantContext()` (T-42). Registered in the
`stripe-worker.ts` dispatcher (A-14 pattern).

**Payroll CSV columns:** Employee, Email, Employment Type, Week Start, Regular Hrs, OT Hrs, Rate ($/hr),
OT Rate ($/hr), Regular Pay, OT Pay, Gross Pay.

---

## Web UI

| Page | Path | Purpose |
|------|------|---------|
| Timecards hub / review | `web/src/app/(dashboard)/timecards/page.tsx` | Submitted-timecard review, approve/reject |
| Live clock board | `web/src/app/(dashboard)/timecards/board/page.tsx` | Who's on the clock; punch correction slide-over; 60s refresh |
| My timecard | `web/src/app/(dashboard)/timecards/my/page.tsx` | Worker's week, open/submit |
| Clock in/out | `web/src/app/(dashboard)/timecards/clock/page.tsx` | Punch UI; project/cost-code selectors; today + week summary |
| Payroll settings | `web/src/app/(dashboard)/settings/payroll/page.tsx` | Per-user rates, OT, pay frequency; provider hub |
| Project time entries | `web/src/app/(dashboard)/projects/[id]/time-entries/page.tsx` | Per-project entries + slide-over edit + cost totals |

**Proxies:** `web/src/app/api/{time-entries,timecards,time-punches,payroll,payroll-settings}/...` (11 routes).
**i18n:** all chrome under the `field` namespace (`field.{timecards,time_entries,time_punches,board}.*`),
**EN + ES complete** (`field.json` both locales). Data rows (worker names, cost-code names) render as stored.

**Role gating gap:** pages do not gate on JWT role client-side; the API enforces. A Field Tech can
reach `/timecards` (the approval view). Tracked as hardening work (see Gaps).

---

## Mobile

| Item | State |
|------|-------|
| `mobile/src/screens/TimeEntryScreen.tsx` | **Offline-first** — one of the 5 WatermelonDB screens |
| `mobile/src/models/TimeEntry.ts` | WatermelonDB model: `server_id`, `version`, `sync_status`, `is_deleted`, all entry fields incl. `cost_code_id`/`budget_line_item_id` |
| Sync | `mobile/src/lib/sync.ts` — **batch protocol** (2026-07-24): ONE `POST /v1/sync/push` + ONE `GET /v1/sync/pull` per sweep across all offline tables, via a table registry. `server_id` minted client-side before the first push (server inserts `ON CONFLICT (id) DO NOTHING` → idempotent creates); local `version` mirrors the server's `+1`; local deletes propagate; single cursor `sync:lastPulledAt:v2`, T-12 guarded, skips locally-dirty rows. Runs on foreground change **and a 3-min foreground interval**. OS-level background sync (app closed) deferred — native module + EAS rebuild (Plan §B2). |
| i18n | `field` namespace EN+ES complete on this screen |

**Mobile gaps (tracked):**
- **Cost-code / budget-line-item picker — DONE.** `TimeEntryScreen.tsx` has offline-aware Modal
  pickers (fetch `/cost-codes` + `/budget-line-items?project_id=`, cache in AsyncStorage, fall back to
  cache offline). Selection sets `cost_code_id`/`budget_line_item_id` on the record; the batch push
  already carries them. Field time is now cost-codable from mobile.
- **Clock-in/out + timecard screens — DONE.** `ClockScreen.tsx` (punch in/out, project picker,
  switch, week summary; its previously-undefined `time_punches.*` i18n keys + a `tc('common.x')`
  double-prefix bug are now fixed) and `MyTimecardScreen.tsx` (open current ISO week → auto-sum
  total+OT, submit for approval, rejection note + reopen, recent-card history). Both reachable from
  the Projects header (⏱️ / 🗓️). API-only/online (not in the offline set). Approve/reject stay
  web-only (office roles).
- **T-13/T-14 Tier-2 conflict UI — DONE.** A `version_conflict` on a time-entry push marks the record
  `sync_status='conflict'` and stashes the returned `server_record` (snapshot held in AsyncStorage
  `conflict:time_entries:*`). `ConflictResolveScreen`
  renders the local vs server values **field by field** (hours/rate/cost-code/budget-line/notes); the
  worker picks Keep Mine / Use Server per differing field and **all differing fields must be chosen**
  before applying (T-14). Resolve re-PATCHes at the server's version; a re-conflict re-stashes rather
  than looping. A reactive ⚠️ header badge surfaces the `ConflictsScreen` inbox; held conflicts never
  block other records. (Also fixed the then-current sweep's camelCase field accessors, which were
  silent runtime no-ops — mobile time-entry sync only started working after that.)
- **Sync — batch push + pull DONE (2026-07-24).** The old "batch push needs a shared-id rework"
  blocker was wrong: the server accepts a **client-minted `id`** on create (`ON CONFLICT (id) DO
  NOTHING`), so the dual-id `server_id` pattern is kept and creates are idempotent. Push and pull are
  now one batched request each per sweep. ⚠️ Because the batch path bypasses `time-entries.ts`, the
  server mirrors its side effects on `SyncTableConfig` — `costRollup` dispatches
  `reconciliation.field_cost_rollup` after commit (deduped per budget line, incl. on delete), and
  `ownerCol`/`managerRoles` reproduce the field-tech self-guard (creates force ownership to the
  actor; another user's row → `conflict_type: 'forbidden'`, **no `server_record`**). **OS background
  sync** (app closed via `expo-task-manager`) remains deferred — native module + EAS rebuild, can't
  ship via OTA.

---

## Roles summary

| Action | Roles |
|--------|-------|
| Log / edit / delete time entry | Owner, PM, Foreman, Accountant, **Field Tech (own only)** |
| Clock in / out | Owner, PM, Foreman, Field Tech |
| Add missed punch / edit / delete punch | Owner, PM, Foreman, Field Tech — **field tech/foreman = own only; Owner/PM = anyone** |
| Open / submit own timecard | any authenticated user |
| Approve / reject timecard | Owner, PM, **Accountant** |
| Active "on the clock" board | Owner, PM |
| Payroll export | Owner, Accountant, PM |
| Payroll settings (rates) | Owner, Accountant |
| Set pay at user creation | Owner (only) |

---

## Spec drift reconciled (vs original `.docx` MVP scope)

| `.docx` says | Reality | Resolution |
|--------------|---------|------------|
| "No mobile time entry screen" | `TimeEntryScreen` exists, offline-capable | This doc is canonical; `.docx` is stale |
| "GPS clock in/out — v1.0 SHIP" | Clock in/out built; **no GPS/geofence capture or enforcement** | OQ-17 — recommend defer geofence to v1.1 |
| "Crew clock-in (foreman clocks in multiple crew) — v1.0 SHIP" | **Not built** — single-user punch only | OQ-17 — recommend defer to v1.1 |
| "Certified payroll / Davis-Bacon" | Not built | Already deferred v2.0+ |

---

## Deferred / gaps

| Item | Target |
|------|--------|
| GPS geofence clock-in + enforcement | v1.1 (OQ-17) |
| Crew bulk clock-in (foreman → multiple workers) | v1.1 (OQ-17) |
| Mobile Tier-2 conflict UI for time entries (T-14) | **DONE** — `ConflictResolveScreen` (field-level Keep Mine/Use Server) + ⚠️ inbox badge; 409 returns `server_record` |
| Mobile cost-code / budget-line picker | **DONE** — offline-aware Modal pickers in `TimeEntryScreen.tsx` (AsyncStorage-cached) |
| Mobile batch pull + periodic foreground sync | **DONE** — one batched `GET /v1/sync/pull` for all offline tables + 3-min interval |
| Mobile batch push | **DONE (2026-07-24)** — one batched `POST /v1/sync/push`; client-minted `server_id` makes creates idempotent (no shared-id migration needed). Server side-effect/guard parity added on `SyncTableConfig` (`costRollup`, `ownerCol`/`managerRoles` → `forbidden`) |
| Mobile OS background sync (app closed) | Deferred — `expo-task-manager` is a native module → EAS build, not OTA-shippable (Mobile Enterprise Plan §B2) |
| Web role gating on timecard pages | **DONE** — `RoleGate` server gate (`web/src/components/auth/role-gate.tsx`): `/timecards`+`/board`=owner/PM, `/clock`=field roles, `/my`=open |
| Automated tests (API) for the money path | **DONE** — `timecards-payroll.test.ts` (14 cases, route chain) + `payroll-worker.test.ts` (3 cases, CSV math). Mobile money-path tests still pending. |
| Worker CSV export rate query | **FIXED** — rate AVG joined on a non-existent `time_entries.timecard_id` (export threw at runtime); now links by `user_id` + ISO week range like `timecards.ts`. Caught by `payroll-worker.test.ts`. |
| Certified payroll / prevailing wage (Davis-Bacon) | v2.0+ |

---

## File locations

| File | Purpose |
|------|---------|
| `prisma/migrations/0001_initial/` | `time_entries` base |
| `prisma/migrations/0002_reconciliation_layer/` | `time_entries` + `budget_line_item_id`, `hourly_rate_cents` |
| `prisma/migrations/0005_timecards/` | `timecards` |
| `prisma/migrations/0007_payroll/` | `tenant_integrations`, `user_payroll_settings` |
| `prisma/migrations/0011_clock_in_out/` | `tenant_settings`, `time_punches` |
| `prisma/migrations/0024_time_entry_project_optional/` | `time_entries.project_id` → nullable (Session 43) |
| `api/src/routes/v1/time-entries.ts` | time entry CRUD |
| `api/src/routes/v1/timecards.ts` | timecard FSM |
| `api/src/routes/v1/time-punches.ts` | clock in/out |
| `api/src/routes/v1/payroll.ts` | CSV export |
| `api/src/routes/v1/payroll-settings.ts` | per-user payroll settings |
| `api/src/workers/field-cost-worker.ts` | `field_cost_rollup` |
| `api/src/workers/payroll-worker.ts` | CSV export + provider push |
| `api/src/workers/time-punch-worker.ts` | midnight auto-clockout |
| `web/src/app/(dashboard)/timecards/**` | timecard hub/board/my/clock |
| `web/src/app/(dashboard)/settings/payroll/page.tsx` | payroll settings |
| `web/src/app/(dashboard)/projects/[id]/time-entries/page.tsx` | per-project entries |
| `web/locales/{en,es}/field.json` | i18n (`timecards`/`time_entries`/`time_punches`/`board`) |
| `mobile/src/screens/TimeEntryScreen.tsx` | mobile offline entry |
| `mobile/src/models/TimeEntry.ts` | WatermelonDB model |
| `mobile/src/lib/sync.ts` · `sync-payload.ts` · `uuid.ts` | batch `/v1/sync/*` sweep (table registry + pure payload/conflict logic + client-minted ids) |
| `.claude/skills/time-tracking/SKILL.md` | skill |

---

*Spec version: 1.0 — Session 40 — 2026-06-24*
