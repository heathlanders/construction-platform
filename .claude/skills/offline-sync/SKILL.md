# Offline Sync Skill
**Locked decisions: T-06 (revised), T-12, T-13, T-14**

## Architecture
Mobile app (React Native) uses WatermelonDB (SQLite) as local store.
All data operations write to local DB first, then sync to server on reconnect.
The app must be fully functional with no network connection.

## Optimistic locking pattern (T-06 revised — NOT last-write-wins)
Every synced record carries a `version` integer.
```typescript
// Every table has this column
version: integer NOT NULL DEFAULT 1

// On update
UPDATE records SET field = $1, version = version + 1
WHERE id = $2 AND version = $3  -- fails if version mismatch
```
If the WHERE clause updates 0 rows → conflict detected → enter resolution flow.

## Conflict resolution tiers (T-12, T-13, T-14)

### Tier 1 — Non-critical fields (notes, comments, descriptions)
Strategy: last-write-wins based on `updated_at` timestamp.
No user intervention required.

### Tier 2 — Financial and schedule data
Strategy: present side-by-side diff to the user.
```
┌─────────────────────────────────┐
│ Conflict: Budget Line Item #42  │
│                                 │
│ Your version:    $45,000        │
│ Server version:  $52,000        │
│                                 │
│ [Keep Mine]  [Use Server]       │
└─────────────────────────────────┘
```

**Built:** a `version_conflict` on push flags the record `sync_status='conflict'` and stashes the
returned `server_record` (`mobile/src/lib/conflicts.ts`, AsyncStorage, key `conflict:{table}:{localId}`).
ONE registry-driven `ConflictResolveScreen` is the field-level Keep Mine/Use Server UI for **every**
conflict-capable table (all differing fields must be chosen before apply — T-14); `ConflictsScreen`
+ the `ConflictBadge` ⚠️ header count surface the inbox.

### Tier 3 — Safety-critical data (incident reports, safety forms)
Strategy: BLOCK until resolved by an authorized user (Safety Officer or Owner role).
Notify via push notification. Do not auto-resolve.
Server returns `conflict_type: 'safety_blocked'` with the full `server_record`; the same
`ConflictResolveScreen` surfaces it, with the pick buttons + submit disabled and a
`conflicts.safety_blocked` notice for anyone outside `resolveRoles` (`canResolve` — UX gate; the API
still enforces).

## Sync endpoints
```
GET  /v1/sync/pull?since={ISO}[&project_id=]  → { changes: { [table]: {created,updated,deleted[]} }, timestamp }
POST /v1/sync/push  { changes: { [table]: {created,updated,deleted[]} } }
                                              → { conflicts: [{table,id,conflict_type,server_record?}] }
```
Both require `withTenantContext()` + full JWT auth. Server registry = `SYNC_TABLES` in
`api/src/routes/v1/sync.ts` (10 tables; mobile registers 7 — 5 push+pull, 2 pull-only). `pull` omits tables with no
changes. `push` **silence means applied** — only failures come back in `conflicts[]`.

## Client protocol (`mobile/src/lib/sync-core.ts` — hand-rolled, NOT WatermelonDB `synchronize()`)
The app keeps a **dual-id** model (WatermelonDB `Model.id` locally, `server_id` for the server), so
the off-the-shelf adapter doesn't fit. `runSyncSweep()` = ONE batched push then ONE batched pull,
driven by a per-table registry (`push` mapper / `applyPull` applier / conflict `tier`). Tiers 2/3
stash generically via `saveConflictFor(table, localId, server_record)` — no per-table stash hook.

- **Client-minted ids → idempotent creates.** The client mints `server_id` (`lib/uuid.ts`, pure JS —
  Hermes has no `crypto.randomUUID`, and `expo-crypto` is native so it would break OTA) **before the
  first push**; the server inserts `ON CONFLICT (id) DO NOTHING`. A retry after a dropped response
  can never duplicate a row, and creates skip the audit/job re-fire.
- **Classification** (`lib/sync-payload.ts`, pure + unit-tested): never-synced → `created`; locally
  deleted **and** previously synced → `deleted`; else → `updated` (carries `version`, T-12). A
  never-synced local delete is dropped entirely.
- **Version mirroring.** On an accepted update the local `version` takes the server's `+1`, so the
  next push isn't stale before the pull heals it.
- **Conflict routing by tier.** Tier 1 = adopt the server version + ONE immediate retry (LWW, no UI);
  tiers 2/3 = stash `server_record` + `sync_status='conflict'` for the resolve screens. Held in the
  queue, never blocking other records (T-14).
- **`forbidden`** — the server refused the write on ownership grounds (self-guard: a non-manager may
  only write their own rows). **No `server_record` is returned** (no leak), so there is nothing to
  resolve against: the row is parked in an in-memory set for the session rather than retried forever.
- **Pull** uses a single cursor (AsyncStorage `sync:lastPulledAt:v2`) across all offline tables; it
  never clobbers a `pending`/`conflict` local row, and a failed table apply does **not** advance the
  cursor (or that delta would be skipped forever).
- **`PULL_ONLY_TABLES` (read cache).** `projects` + `safety_certifications` + **`company_assets`**
  (2026-07-27) sit in `PULL_TABLES` but NOT `PUSH_TABLES` (`push: () => ({})`) — pulled and rendered
  locally so the screen survives with no signal, but **writes still go straight to the API and
  require a connection**. `safety_certifications` stays read-only on purpose: issuing a cert offline
  is a compliance record nobody in the field is waiting on. `company_assets` is the yard cache — the
  QR scan in `screens/assets/Checkout.tsx` resolves an `asset_number` locally, which is what makes
  the fuel / asset-inspection / damage capture queues reachable offline; checkout/check-in stay
  online-only (T-57 cert enforcement is server-side). (`inspections` was pull-only too until
  2026-07-27 — it graduated to `PUSH_TABLES` at tier 2 once the resolve screen became registry-driven.)
- ⚠️ **A pull-only table must be read-only on the SERVER too.** `SyncTableConfig` carries a
  **`readOnly?: true`** flag (`api/src/routes/v1/sync.ts`); `pushTable` returns immediately for those
  tables, so a client push can never inject a row (an INSERT with `pushCols: []` would violate the
  table's NOT NULLs) or rename an existing one. The client-side `push: () => ({})` is a convention,
  not a boundary — the server flag is. `company_assets` is the first `readOnly` entry; `projects` and
  `safety_certifications` are still client-writable server-side (historical, unused by the app).
- Sweep triggers: AppState→active + a 3-min foreground interval. **OS background sync is not built**
  (`expo-task-manager` is a native module → EAS rebuild, not OTA-shippable).
- ⚠️ **The engine lives in `sync-core.ts`, the sweep in `sync.ts`.** `sync.ts` statically imports the
  six queue flushers, which live in React Native screens — importing it in a node test drags in the
  whole RN module graph. Keep engine logic in `sync-core.ts` (DB + api + AsyncStorage only) or it
  becomes untestable. Covered by `lib/__tests__/sync-core.test.ts` against a fake DB + fake server
  (version mirroring, tier routing, delete propagation, cursor-not-advanced-on-failure, `forbidden`
  parking); mutation-checked, so the assertions actually bite.

## Making a table conflict-capable (registry entry, NOT a new screen)
Adding a conflict path used to mean another ~220-line resolve screen — which is exactly why a table
could ship read-only (a Tier-2 conflict with no screen is an invisible, permanently stuck row). Now:

1. Add an entry to `CONFLICT_TABLES` in `mobile/src/lib/conflict-registry.ts`:
   `{table, endpoint, responseKey, tier (2|3), resolveRoles? (tier 3), titleKey, labelKey, fields[]}`.
   `fields[]` = the resolvable columns `{key, labelKey, kind?}` (`kind` ∈ text|hours|money|date|status
   drives `displayValue` only). `key` must be the SAME column name on the local model and the server
   row. `endpoint`+`responseKey` are what the resolving PATCH hits/unwraps (e.g. `/inspections` →
   `inspection`).
2. Add the `labelKey`/field `labelKey` i18n keys to the `field.conflicts.*` namespace, EN **and** ES.
2b. ⚠️ **Check the route's update schema accepts `null` for every field you listed.** The resolver
   PATCHes the WHOLE merged field set, so a field the record doesn't have goes over as `null` — a
   `.optional()` without `.nullable()` returns 422 and the conflict becomes permanently unresolvable
   (this was live on `notes` for both conflict tables until the E2E hit it). Pinned by
   `api/src/test/conflict-resolve-payload.test.ts`.
3. For offline writes, set the table's `tier` in `lib/sync.ts` and move it into `PUSH_TABLES`.

No screen, no route, no stash function. The inbox enumerates `CONFLICT_TABLES` (tier 3 sorts first;
a table absent from the local schema is skipped) and `ConflictResolve: {localId, table}` renders it.
The pure helpers (`norm`, `displayValue`, `differingFields`, `mergeChoices`, `allResolved` = the T-14
gate, `canResolve` = the tier-3 role gate, which lowercases the UPPERCASE JWT role) live in the same
module and are unit-tested (`lib/__tests__/conflict-registry.test.ts`).

⚠️ Stash keys are `conflict:{table}:{localId}` — unchanged from the three hand-rolled per-table
stores this replaced, so snapshots already on a device still resolve. Don't re-key them.

## Offline upload queues (NOT the WatermelonDB batch sync)
Capture surfaces that produce a file or a one-shot write — task QA photos, project documents, asset
inspections / fuel logs / damage reports, trade status PATCHes — use **six AsyncStorage queues**, one
key each, drained inside the same `runSyncSweep` alongside the batch push/pull. Different mechanism
(no local table, no `version`, no conflict tier), shared trigger. All six share ONE implementation:
`lib/offline-queue.ts` (I/O) over `lib/queue-policy.ts` (pure retry policy, unit-tested).

- **A processor that throws means "not done."** `flushQueue(key, processor, opts)` decides what
  happens next; `enqueue(key, item, {sameAs})` collapses supersedable items (the status queue keeps
  only the latest status per record).
- **Retry vs drop is decided by WHO answered, not by the message text.** An `ApiError` carrying a
  numeric `status` means the server replied — that's a verdict (404 task gone, 413 too large, 409
  stale version), and retrying can't change it → drop. Only a connectivity failure retries. The
  per-screen queues used to string-match error messages, which got this wrong both ways.
- **Backoff + cap.** `backoffMs` = ×2 from 30s, capped at 5 min, ±20% jitter (mirrors the API's T-21
  integration-retry shape); `MAX_ATTEMPTS = 6`, then the item is dropped with a warn. Without the cap
  a poison item retried on every 3-min sweep forever.
- **`retryServerErrors: true`** is the narrow opt-out, for a processor whose server error genuinely
  means "come back later" — only the task-photo attach, which 409s `FILE_NOT_READY` until the T-27
  scan promotes the file. The cap still applies.
- ⚠️ **Queue keys are stable, and legacy items are wrapped not dropped.** `normalizeQueue` accepts
  un-enveloped rows written by an older build; changing a key or discarding un-enveloped rows would
  silently lose a field worker's captured photos on upgrade.
- **Depth is visible**: `components/PendingUploadsBadge.tsx` shows ⬆️ N in the Projects header from
  `totalQueueDepth()` (15s poll — AsyncStorage has no change stream), tap forces a sweep.
  `ConflictBadge` is a different thing entirely (WatermelonDB conflicts only).
- **Giving up is visible too (dead letter).** An item dropped by the cap or by a server verdict is
  recorded in `offline_queue_dead_letter` (capped at 50) with its source queue, attempts and reason;
  the badge switches to a red ⚠️ and offers **Retry** (re-enqueued on the ORIGINAL queue with a clean
  slate — not the stale backoff) or **Discard**. Before this, a dropped capture vanished with a
  `console.warn` nobody sees — silent data loss for a worker who shot photos in a basement.
  `listDeadLetters` / `retryDeadLetters` / `clearDeadLetters`; covered by `lib/__tests__/offline-queue.test.ts`.

## Schema migrations are mandatory (mobile)
`mobile/src/lib/schema.ts` carries an `appSchema({version})`; `mobile/src/lib/migrations.ts`
(`schemaMigrations`) is passed to the `SQLiteAdapter`. **Bumping the schema version WITHOUT adding a
migration step makes WatermelonDB fall back to an UNSAFE RESET of the local database — silently
destroying any `pending` offline rows a field worker hasn't synced yet.** Every `schema.ts` version
bump MUST add a matching step (`createTable` / `addColumns` / …) under a new `toVersion`.
History: the schema shipped at v2 with no migrations file, so live installs sit at v2; v3 (the
`inspections` + `safety_certifications` read-cache tables) is the first real migration; **v4**
(2026-07-27) adds the `company_assets` yard read cache.

**A jest guard enforces this** (`lib/__tests__/migrations.test.ts`): the current `schema.version`
must have a migration step, steps must have no version gap, none may run ahead of the schema, and
each must be non-empty. Verified to FAIL on an unmigrated bump — the mistake is invisible in review
(both files look fine alone) and to `tsc`, so the test is the only thing that catches it. The
pre-push OTA hook runs jest, so an unmigrated bump can't auto-ship.

## JSONB columns on the batch path
⚠️ **node-pg renders a JS OBJECT as JSON but a JS ARRAY as a Postgres array literal** (`{...}`),
which a `jsonb` column rejects. `daily_reports.weather` survived only because it happens to be an
object; `jsa_records.attendees`/`hazards` are arrays and every push would have failed. Declare JSONB
columns in `jsonCols` on the table's `SyncTableConfig` — `pushTable` stringifies them before binding
and lets pg cast from text. Covered by `api/src/test/sync-time-entries.test.ts` (fails without it).

## Server-side parity rule
`/v1/sync/push` bypasses the resource routes, so any **side effect or guard** a route performs must
be mirrored on the batch path or mobile silently regresses. Currently config-driven on
`SyncTableConfig`: `costRollup` (dispatch `reconciliation.field_cost_rollup` after commit, deduped
per budget line) and `ownerCol`/`managerRoles` (self-guard — creates force ownership to the actor,
updates/deletes carry an owner guard). Adding a route side effect ⇒ add it here too.
