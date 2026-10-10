# Mobile Enterprise Plan — Feature Expansion & Test Strategy v1.0
**"The Operating System for Construction" — Mobile (React Native + Expo)**

> **Status:** Planning doc — approved scope, not yet built. Created 2026-06-20 (Session 35).
> **Scope:** How we add role-aware features to the mobile app and test it to enterprise
> standard. Three parallel workstreams (A role experience, B offline/sync, C test pyramid).
> **Stack (locked):** React Native + Expo managed (A-09), WatermelonDB SQLite (A-10),
> react-i18next EN+ES (A-13), offline-first optimistic locking (T-06/T-12/T-13/T-14).
> **E2E framework:** Maestro (chosen 2026-06-20 — YAML flows, runs on the server KVM emulator).

---

## 0. Current state (ground truth, Session 35 audit)

| Area | State |
|------|-------|
| Launch crash | ✅ RESOLVED 2026-06-20 (i18n flat-key bug, not jsi). Shipped via OTA. See `[[mobile_apk_distribution]]`. |
| Distribution | ✅ EAS build → `get.thejobsite.app` nginx host; OTA via expo-updates. |
| Screens | 31 total (2026-08-01). **12 offline-write** (WatermelonDB): time_entries, daily_reports, punch_list_items, safety_incidents, inspections, jsa_records, concrete_test_records, roofing_qa_records, framing_correction_items, electrical_circuits, plumbing_fixtures (+ projects locally). **9 read caches**: projects, safety_certifications, company_assets, permits, concrete_pours, roofing_systems, framing_inspections, electrical_panels, plumbing_systems. Every field surface that matters now renders and captures with no signal; blueprints + warranty + financial stay web-first by decision. |
| Sync | ✅ **B2 batch protocol BUILT (2026-07-24)** — ONE `POST /v1/sync/push` + ONE `GET /v1/sync/pull` per sweep across every offline table, driven by a table registry; client-minted `server_id` → idempotent creates; local deletes propagate; one cursor `sync:lastPulledAt:v2`. Still **foreground-trigger only** (AppState→active + 3-min interval) — OS background sync open. (Was: per-record sweeps + per-table pull calls.) |
| Conflict UI | ✅ **BUILT (§B3, completed 2026-07-27)** — Tier 1 = last-write-wins (no UI, by policy); Tiers 2+3 = ONE **registry-driven** `ConflictResolveScreen` (`lib/conflict-registry.ts`) over `time_entries`/`punch_list_items`/`inspections` (tier 2) + `safety_incidents` (tier 3, resolver-role gated), plus the `ConflictsScreen` inbox + `ConflictBadge`. T-14 debt closed. (Was: largely unbuilt.) |
| Tests | ✅ **C1 + C3 green:** `mobile/jest.config.js` (node, `babel-jest`) + `src/lib/__tests__/{i18n,theme,sync-payload,queue-policy}.test.ts` — i18n key-integrity + EN/ES parity (catches the bundle-load flat-key crash class), theme tokens, batch-sync payload classification / conflict routing / version mirroring (2026-07-24), upload-queue retry policy (2026-07-25 — caught a live gap: the retry regex missed RN's "The operation timed out"), and `conflict-registry` (2026-07-27 — registry shape, tier-3 gate case-insensitivity, `''`-vs-`null`, the T-14 all-fields gate). **121 jest cases** + **8 Maestro E2E flows** green against the shipped bundle (§C3). Each offline surface has a flow that asserts against the SERVER, not the screen. |
| Role gating | ✅ **BUILT (Session 42, 2026-06-25)** — bottom tab bar + per-role tile manifest (`lib/tileManifest.ts`), `RoleProvider`/`useCurrentUser`, `RoleGate`, Settings (tile show/hide + language + dark mode). UX-only (API still enforces). Skill `mobile-role-nav`. (Was: none at nav layer, single stack, tiles tier-gated only.) |
| Emulator | ✅ Server-side KVM x86 API-30 — real crash logs, no phone. Harness now tracked at **`scripts/run-emu-capture.sh`** and hardened 2026-07-25 with `-partition-size 2048`: the default ~7.4GB userdata partition made it die at "wait for device" whenever the host disk was tight (real failure mode — read `/tmp/emu.log`, not the run log). |

**The three biggest gaps (as audited at Session 35):** (1) 19/24 screens break offline,
(2) tiered conflict resolution UI is a locked-decision (T-14) that was never built — **closed
2026-07-27, §B3**, (3) no automated test coverage at all — C1 unit layer now green.

---

## 1. Workstream A — Role-based experience

Mobile is a **field** tool. Today all 9 roles get the same shell. Field roles (Foreman,
Field Tech, Safety Officer) drive mobile value; office roles (Estimator, Accountant) stay
web-first. We make the app role-aware.

> **Status (2026-06-25):** A1 + A2 core are **BUILT** (Session 42) — `lib/tileManifest.ts`,
> `lib/user-context.tsx` (`RoleProvider`/`useCurrentUser`), `components/RoleGate.tsx`, a bottom tab
> bar (Home/Clock/Timecard/Alerts/Settings, role-filtered), and a Settings screen (tile show/hide +
> language + dark mode). Permission-beats-preference; gating is UX-only (API enforces). Skill:
> `.claude/skills/mobile-role-nav/SKILL.md`. Remaining A2: per-role *deep* surfaces (PM approvals
> inbox, Owner exec dashboard, making field screens offline) are still open.

### A1. Role gate at the navigation layer
- JWT already carries `role` (`{ user_id, tenant_id, role, exp }`). Read it from the claim —
  **never derive permissions client-side from UI state** (mirrors the web rule).
- Build `<RoleGate roles={[...]}>` wrapper + a per-role **tile manifest** for `ProjectDetailScreen`.
- Compose with existing tier gating (Asset/Warranty tiles already gate Business+).

### A2. Per-role home / default surface
| Role | Mobile priority | Default surface | New/changed screens |
|------|-----------------|-----------------|---------------------|
| **Field Tech** | P0 | Field tiles | Make checkout / fuel / inspection **offline** (today API-only) |
| **Foreman** | P0 | Field tiles | Crew assign, photo markup, (punch/time/daily already offline) |
| **Safety Officer** | P0 | Safety surface | JSA capture, cert-expiry view, **Tier-3 conflict resolve UI** |
| **PM** | P1 | Approvals/dashboard | Approvals inbox, schedule edit, RFI reply, asset assign |
| **Owner** | P2 | Exec dashboard | KPI cards, push-actionable approvals |
| **Client portal** | P2 | Read-only progress | Progress, schedule (read), photos |
| **Sub portal** | v1.1 | — | Cross-tenant — blocked on P-02 (v1.1) |
| **Estimator** | web-first | — | None — keep web |
| **Accountant** | web-first | — | None — keep web |

Roles use the existing `user_role` enum (owner, project_manager, estimator, foreman,
field_tech, accountant, safety_officer, client_portal, sub_portal).

---

## 2. Workstream B — Offline + sync hardening

Highest enterprise risk: a field worker with no signal hits a dead screen on 19/24 surfaces.

### B1. Expand WatermelonDB coverage — 🟡 partial (read cache landed 2026-07-25)
Add offline models for P0 field needs (each needs `server_id`, `version`, `sync_status`,
`is_deleted` per existing pattern + the `(tenant_id, updated_at)` sync index):
- ✅ **`inspections` + `safety_certifications` — DONE** (schema v3; models
  `Inspection`/`SafetyCertification`). Both landed 2026-07-25 as a READ CACHE (`PULL_ONLY_TABLES` in
  `lib/sync.ts` — pulled, never pushed) because an offline write needs a conflict path and neither
  had a resolve screen. `InspectionsScreen`/`SafetyCertScreen` render from a reactive local query, so
  both survive with no signal; pull-to-refresh runs one batched `pullAll()`. Server parity:
  `inspections` pull/pushCols gained `inspector_name` + `trade_type`.
  - ✅ **`inspections` graduated to offline WRITES 2026-07-27** (§B3 removed the blocker): moved into
    `PUSH_TABLES` at **tier 2**; create + status change write locally as `sync_status='pending'` (row
    carries a `•` marker) and ride the batch push, and a 409 lands in the shared registry-driven
    inbox instead of an inline alert.
  - `safety_certifications` **stays read-only on purpose** — issuing a cert offline is a compliance
    record nobody in the field is waiting on, and there's no capture screen worth the write path.
- ⚠️ **Schema migrations are now mandatory.** `mobile/src/lib/migrations.ts` (the first one, added
  with v3) is passed to `SQLiteAdapter`. Without a migration step a version bump makes WatermelonDB
  UNSAFE-RESET the local DB, destroying unsynced `pending` rows — **every future `schema.ts` bump
  MUST add a step.** (Schema shipped at v2 with no migrations file, so live installs sit at v2.)
- ✅ **Asset yard flow — DONE 2026-07-27** (`company_assets`, schema **v4** + migration step +
  `models/CompanyAsset.ts` + a PULL-ONLY registry entry; server-side the first `readOnly: true`
  `SYNC_TABLES` entry). **The capture queues for asset fuel logs / inspections / damage reports
  already existed** (§B4) — what was missing is that they were **unreachable**: mobile has no asset
  LIST screen, so the entry point is the QR scan in `assets/Checkout.tsx`, which needed the API to
  turn an `asset_number` into an asset. No signal → no asset → no capture. `findCachedAsset()` now
  resolves the scan from the local cache, so all three captures work in a dead zone.
  - **Checkout / check-in are excluded BY DESIGN** — disabled with a warning notice
    (`common.assets.offline_checkout_blocked`, EN+ES) when the asset came from cache. **T-57
    operator-cert enforcement is server-side**; telling a worker they hold a machine they aren't
    certified for is worse than "reconnect". The cached row carries `requires_operator_cert` +
    `required_cert_type` so the UI can warn before an attempt — a hint, not the gate.
  - T-56 (Business+) is a **feature** gate, not a data gate — a lower tier just has no rows to pull.
- ✅ **`jsa_records` — offline WRITES (schema v5, 2026-07-28).** The JSA is the pre-task hazard
  briefing run standing on the site, so it is the record most likely to be created with no signal;
  mobile had no JSA surface at all, leaving the Safety Officer (a P0 mobile role) unable to produce
  their core artifact. Tier 3 in the conflict registry (same treatment as safety incidents).
  `attendees`/`hazards` are JSONB server-side, JSON TEXT locally, parsed at the sync boundary —
  which surfaced a live landmine: the batch push binds arrays raw, and node-pg turns a JS array into
  a Postgres array literal that `jsonb` rejects (`weather` only worked because it's an object). Fixed
  with `jsonCols` on `SyncTableConfig`.
- ⏳ Still open: `permits` (read-mostly), `rfis`, `documents` (metadata + queued photos),
  `crew_assignments`. Asset **checkout/check-in** stay online-only (T-57, above), not "open".

### B2. Adopt the batch sync protocol — ✅ **BUILT 2026-07-24** (background sync still TODO)
- Server exposes `GET /v1/sync/pull` + `POST /v1/sync/push` (11 SYNC_TABLES — `company_assets` is
  the 11th and the only `readOnly` one, T-12/T-13 conflict
  handling, audit logging). **Server-side prereq shipped first:** the batch path bypassed the
  resource-route logic, so it never dispatched `reconciliation.field_cost_rollup` and had no
  `user_id` self-guard. Both are now config-driven on `SyncTableConfig` (`costRollup`,
  `ownerCol`/`managerRoles`), with a new `forbidden` conflict type (no `server_record` — no leak)
  and `RETURNING`-gated create audits so an idempotent retry doesn't re-audit/re-fire.
- ✅ Per-record sweeps replaced by ONE batched push + ONE batched pull per sweep, over a table
  registry (`push` mapper / `applyPull` / tier). Every offline table pulls on one cursor
  (6 push+pull since §B3, plus the `PULL_ONLY_TABLES` read caches — §B1).
- ✅ The **"shared-id rework" blocker was wrong** — the server accepts a client-minted `id` and
  inserts `ON CONFLICT (id) DO NOTHING`, so the client mints `server_id` before the first push
  (idempotent creates, dual-id model retained). `lib/uuid.ts` is pure JS: Hermes has no
  `crypto.randomUUID` and `expo-crypto` is native (would break OTA).
- ✅ Local deletes now propagate (the old sweeps skipped `is_deleted`, so they never reached the
  server); local `version` mirrors the server's `+1` on an accepted update.
- ⏳ **Background sync** (`expo-task-manager`) still open — today sync only fires on app foreground
  (AppState→active + 3-min interval). Native module → needs an EAS build, not OTA-shippable.

### B3. Tiered conflict UI (T-13/T-14) — ✅ **BUILT** (locked-decision debt closed 2026-07-27)
- **Tier 1** (notes/append-only): last-write-wins in the sweep — no UI, by policy (`daily_reports`).
- **Tier 2** (financial/schedule) + **Tier 3** (safety-critical) share ONE side-by-side field-level
  diff screen. T-14 holds: only DIFFERING fields need a choice ("Keep Mine" / "Use Server") and ALL
  of them must be chosen before submit (`allResolved`). Tier 3 additionally blocks the picks +
  submit for anyone outside the table's `resolveRoles` (owner/safety_officer) with a
  `conflicts.safety_blocked` notice — UX gate; the API still enforces. Unresolved conflicts stay in
  the queue and never block other records.
- ✅ **Registry, not screens.** `lib/conflict-registry.ts` declares each conflict-capable table
  (`{table, endpoint, responseKey, tier, resolveRoles?, titleKey, labelKey, fields[]}`) for
  `time_entries` / `punch_list_items` / `inspections` (tier 2) and `safety_incidents` (tier 3), plus
  the pure helpers (`norm`, `displayValue`, `differingFields`, `mergeChoices`, `allResolved`,
  `canResolve` — which lowercases the UPPERCASE JWT role). ONE `ConflictResolveScreen`
  (`{localId, table}`) drives all of them; `PunchConflictResolveScreen` +
  `SafetyConflictResolveScreen` are **deleted** (−444 lines) and `ConflictsScreen` enumerates the
  registry (tier 3 first; a table absent from the local schema is skipped).
- ✅ This is what unblocked §B1: adding a conflict path used to cost ~220 lines of screen, which is
  precisely why schema-v3 tables shipped read-only. Adding a table is now a registry entry + its
  `field.conflicts.*` keys (EN+ES).
- ✅ `lib/conflicts.ts` is generic (`saveConflictFor/getConflictFor/clearConflictFor(table, localId)`),
  keyed `conflict:{table}:{localId}` — **the same key format the three per-table stores used**, so
  snapshots already stashed on a device still resolve.

### B4. Offline photo / file queue — ✅ **BUILT 2026-07-25**
Capture → local queue → flush + presigned PUT on reconnect → quarantine + triple validation
(T-27/T-28) → live. **Per-surface capture queues already existed** (task QA photos, project
documents, asset inspections / fuel logs / damage reports, trade status PATCHes — six, all drained
in `runSyncSweep`); what this delivered is the shared policy and the visibility they lacked.
- ✅ **One implementation + one retry policy.** `lib/queue-policy.ts` (pure, unit-tested) +
  `lib/offline-queue.ts` (thin AsyncStorage layer: `QUEUE_KEYS` / `enqueue` / `flushQueue` /
  `queueDepth` / `totalQueueDepth`). All six migrated; their bespoke storage + flush loops deleted.
- ✅ **Two real defects the duplication hid.** (1) NO attempt cap — a permanently-failing item
  retried on every 3-min sweep forever; now exponential backoff ×2 from 30s, capped 5 min, ±20%
  jitter (T-21 shape) with a 6-attempt cap, then dropped. (2) retryable-vs-final was decided by
  **string-matching the error message**; now an `ApiError` with a numeric `status` = the server
  replied = a verdict → drop. `retryServerErrors` opts in for the task-photo attach, which
  legitimately 409s `FILE_NOT_READY` until the scan promotes the file.
- ✅ **Upgrade-safe.** Queue keys unchanged and legacy un-enveloped items are wrapped, not dropped —
  photos captured on an older build survive.
- ✅ **Visible.** `components/PendingUploadsBadge.tsx` — ⬆️ N in the Projects header, polls
  `totalQueueDepth()` every 15s, tap forces a sweep. Depth was previously invisible (`ConflictBadge`
  covers only WatermelonDB conflicts). i18n `common.nav.pending_uploads` EN+ES.
- ⏳ **Not covered:** daily reports and punch items have no photo capture at all (they're offline
  WatermelonDB rows, no attachments); the ImagePicker cache uri must still be valid at flush time
  (a queued item whose local file the OS reclaimed is lost); and a dropped item after MAX_ATTEMPTS
  only `console.warn`s — there's no user-facing failure surface.

---

## 3. Workstream C — Full test pyramid

Copy the API's discipline (vitest + real-DB, 18 files). Mobile currently has nothing.

### C1. Unit — Jest
- ✅ **Config + i18n test BUILT (2026-06-26, commit `75296f3`)** — `mobile/jest.config.js` (node env,
  `babel-jest` via `babel-preset-expo`, no RN preset needed for pure-logic tests) +
  `src/lib/__tests__/i18n.test.ts`: importing `lib/i18n.ts` re-runs its top-level augmentation blocks
  (the bundle-load crash class), + EN/ES parity across all 16 namespaces (34 cases green). `npx jest`.
- ✅ **Sync payload/conflict tests BUILT (2026-07-24)** — `src/lib/__tests__/sync-payload.test.ts` over
  the pure `lib/sync-payload.ts` (push classification create/update/delete, never-synced delete dropped,
  undefined-vs-null field handling, cross-table conflict-index keying, tier routing, version mirroring)
  + `lib/uuid.ts` shape. Mobile jest **51 → 67 green**.
- TODO: add `npx jest` as a 3rd pre-push gate (§C6).

### C2. Integration — 🟡 engine covered (2026-07-27); real-stack round-trip still open
- ✅ **Sync engine covered in isolation.** `lib/sync.ts` was split: the engine moved to
  `lib/sync-core.ts` (local DB + API client + AsyncStorage only — no React Native in its import
  graph, so it loads in node), and `lib/__tests__/sync-core.test.ts` drives it against a fake
  WatermelonDB + fake server: client-minted create id, version mirroring, delete propagation,
  offline-leaves-pending, Tier-2 stash+flag, Tier-1 adopt+retry, `forbidden` parking, pull upsert +
  cursor advance, dirty-local protection, server-delete → local soft-delete, **cursor NOT advanced
  when a table fails to apply**, unknown tables ignored. Mutation-checked (breaking version mirroring
  or the cursor guard fails the suite).
- ⏳ Still open: the same scenarios against the **real** Docker API with a seeded tenant (catches
  contract drift the fakes can't), run serially like `api/vitest.config.ts` `singleFork`.

### C3. E2E — Maestro — 🟡 first flows GREEN (2026-07-27)
- ✅ Maestro 2.7.0 installed; `mobile/.maestro/{login,project-tiles}.yaml` **pass on the KVM emulator
  against the real API**. `login.yaml` covers the flow that has broken three separate times;
  `project-tiles.yaml` guards the role-gate regression that once blanked every project screen.
- Two real findings from writing them: inputs must be selected by **placeholder** (a coordinate tap
  typed the email into the company field while every step still reported COMPLETED), and
  `clearState` makes the **What's-New popup** intercept every fresh login.
- ✅ **Offline→reconnect→sync round-trip** (2026-07-27): `run-offline-sync.sh` owns the radio flip
  (Maestro can't) and drives login → `offline-log-time` (radio off) → `verify-time-synced`. The
  assertion is a **server-rendered** row, so it can only pass if the batch push delivered a record
  written with no network. Hours randomised per run; airplane mode restored on any exit.
- 🐞 **It paid for itself on the first honest run.** The Time hub requested `limit=200` from a route
  capped at 100 (T-01) → 422 → swallowed by `.catch(() => ({ time_entries: [] }))`, so the week grid
  and Today's Entries were **permanently empty for every manual-mode worker**. Ten more callers had
  the identical shape across web + mobile. All clamped, and
  `api/src/test/list-limit-callers.test.ts` now parses each route's Zod ceiling and fails any caller
  above it (mutation-checked). None of this was visible as an error — only as a list that looked
  legitimately empty, which is exactly the class a unit test can't reach.
- ✅ All three flows green **against the shipped bundle** once the limit fix went out (2026-07-27).
- ✅ **Tier-2 conflict resolution flow** (`run-conflict-resolve.sh`, 2026-07-27) — inspection status
  changed on the device with no network while the harness PATCHes the same row through the API, so
  the push loses the race for real. Asserts badge → inbox → side-by-side → apply → empty inbox, and
  the worker's chosen value is what lands in the DB. It found THREE silent bugs: bare `.observe()`
  never re-rendering a field edit, `ConflictBadge` missing `inspections` (conflict with no badge =
  stuck forever), and the resolve PATCH 422ing on `notes: null` — T-14 was unusable end to end.
- ✅ Role parameterisation: `login.yaml` takes credentials from the caller (its `env:` defaults had
  to go — a flow default silently beats `-e`). Foreman drives the conflict flow; field tech the rest.
- ⏳ Still open: flows for the remaining roles, and the asset/QR yard path.

#### Original plan
- YAML flows on the existing server KVM emulator (`run-emu-capture.sh` harness).
- Core flows, parameterized per role test account:
  login → log time offline → background → foreground sync → resolve a Tier-2 conflict →
  checkout tool with cert block (T-57) → submit safety incident.

### C4. Role/tier test accounts — ✅ BUILT (2026-07-27)
- `api/src/scripts/seed-e2e-tenant.ts` — tenant `e2e-test` (Business tier, so the T-56 gates are
  exercised) + one user per role + a seeded project, **idempotent** (re-running resets passwords, so
  a Maestro run never fails because the seed drifted). `--purge` removes it.
- Reusable for manual QA, Maestro E2E, and demos. Multi-tier variants are still open.

### C5. Device matrix
- Emulator API 30 x86 (have) + add API 34 + ≥1 physical iOS device.
- Standardize on the `run-emu-capture.sh` capture pattern for FATAL logcat.

### C6. CI for OTA
- ✅ **BUILT (2026-06-25)** — git **pre-push** hook `scripts/hooks/pre-push` (wired via
  `git config core.hooksPath scripts/hooks`) auto-runs `eas update --branch production` on push to
  `main`. Gates: `mobile/` changed in the range **AND** `mobile` `tsc --noEmit` clean (Checkout.tsx
  pre-existing errors ignored). Gate-fail skips ship, never blocks push. Skip: `SKIP_OTA=1 git push`.
  See `mobile/CLAUDE.md` §"Auto-ship OTA on push to main".
- **E2E is a post-ship smoke, not a pre-publish gate** (2026-07-27). `scripts/mobile-e2e-smoke.sh`
  runs when `RUN_E2E=1`, AFTER `eas update`. A pre-ship run would verify the bundle being replaced —
  the emulator only ever has what the production channel last served — which looks like verification
  without being it. Rollback is `eas update:republish --group <last-good>`. Native changes still go through
  `scripts/build-and-publish.sh`.

---

## 4. Sequencing (4 sprints, workstreams run parallel)

| Sprint | Workstream A | Workstream B | Workstream C |
|--------|--------------|--------------|--------------|
| **1** | A1 role gate scaffold | — | C1 jest + i18n-integrity test, C4 test accounts |
| **2** | A2 per-role homes | B3 conflict UI (T-14 debt) | C3 Maestro skeleton |
| **3** | P0 field screens | B1 offline models + B2 batch sync | C2 integration |
| **4** | P1 PM screens | B4 photo queue | C6 CI/OTA gate |

Sprint 1 priority: lock the i18n test so the launch-crash class can never recur, and stand
up role gating + seeded accounts that everything else builds on.

---

## 5. Definition of Done (enterprise readiness)

- Every P0 field screen works fully offline and syncs cleanly on reconnect.
- All three conflict tiers (T-13) have a working resolution path on mobile (T-14 satisfied).
- Role-appropriate surface for all 9 roles; perms read from JWT, never client-derived.
- Jest unit + integration + Maestro E2E green in CI; E2E gates OTA publish.
- EN+ES chrome on every new screen (data rows render as stored — task-title i18n is v1.1).
- Seeded role/tier test accounts maintained.

---

## 6. Open items / dependencies

| Item | Note |
|------|------|
| Sub portal mobile | Blocked on cross-tenant v1.1 (P-02). |
| Task-title i18n | v1.1 data task (translate template libs); chrome is EN+ES now. |
| jsi:true perf | Left at `jsi:false` (defensive). Revisit for perf once stable + tested. |
| iOS build/distribution | Plan covers Android (live). iOS EAS profile + TestFlight = follow-up. |
| Background sync battery | `expo-task-manager` cadence vs battery — validate on device matrix. |
| Blueprint Intelligence mobile surface | **Absent** — `grep -ril blueprint mobile/src` is empty. The whole upload→analyze→review→import flow is web-only. Add a PM-facing mobile surface (at least review + import) as a follow-up. Confirmed in Blueprint Gap Remediation (Phase 4, 2026-07-11). |

---

## 7. File locations (to be created)

| Path | Role |
|------|------|
| `mobile/jest.config.js` | Jest config (C1) |
| `mobile/src/**/__tests__/` | Unit + integration tests — ✅ incl. `lib/__tests__/conflict-registry.test.ts` (B3/C1) |
| `mobile/.maestro/` | Maestro E2E flows (C3) |
| `mobile/src/components/RoleGate.tsx` | Role gating wrapper (A1) |
| `mobile/src/lib/tileManifest.ts` | Per-role tile manifest (A1/A2) |
| `mobile/src/lib/conflict-registry.ts` | ✅ declarative `CONFLICT_TABLES` + pure diff/merge/gate helpers (B3) — adding a conflict-capable table is an entry, not a screen |
| `mobile/src/screens/ConflictResolveScreen.tsx` | ✅ the ONE registry-driven Tier-2/Tier-3 resolve screen (B3); `ConflictsScreen` = inbox, `ConflictBadge` = ⚠️ count |
| `mobile/src/models/` | New WatermelonDB models (B1) — ✅ `Inspection` (offline writes since 2026-07-27), `SafetyCertification` (read cache) |
| `mobile/src/lib/migrations.ts` | ✅ WatermelonDB schema migrations (B1) — **required on every `schema.ts` version bump** |
| `mobile/src/lib/sync.ts` | ✅ batch `/v1/sync/*` table registry (B2) — background sync still TODO |
| `mobile/src/lib/sync-payload.ts` | ✅ pure push-payload assembly + conflict routing (B2/C1) |
| `mobile/src/lib/uuid.ts` | ✅ pure-JS uuid v4 for client-minted `server_id` (B2) |
| `mobile/src/lib/queue-policy.ts` | ✅ pure retry policy for the offline upload queues — backoff / attempt cap / network-vs-verdict / legacy-item normalization (B4/C1) |
| `mobile/src/lib/offline-queue.ts` | ✅ AsyncStorage layer behind all six upload queues — `QUEUE_KEYS`, `enqueue`, `flushQueue`, `totalQueueDepth` (B4) |
| `mobile/src/components/PendingUploadsBadge.tsx` | ✅ ⬆️ N pending-upload header badge; tap forces a sweep (B4) |

---

*Plan version: 1.0 — Session 35 — 2026-06-20*
