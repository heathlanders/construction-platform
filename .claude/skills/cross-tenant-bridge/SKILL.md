# Cross-Tenant Bridge Skill
**Locked decisions: A-07, T-15, T-16, T-17, T-44, T-45, T-46, T-47**
**Release: Schema in v1.0 — user-accessible in v1.1**

## The golden rule
**Sub data NEVER lives in GC tenant tables.**
**GC data NEVER lives in Sub tenant tables.**
All shared data lives in the neutral `shared_project_events` table.

## How the bridge works
1. GC and Sub establish a `tenant_connection` (invitation → acceptance flow)
2. Both parties can write events to `shared_project_events` for shared projects
3. Each party reads events filtered by their `connection_id`
4. Neither party has direct DB access to the other's tenant schema

## shared_project_events table
```sql
CREATE TABLE shared_project_events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id     UUID NOT NULL REFERENCES tenant_connections(id),
  source_tenant_id  UUID NOT NULL,  -- who wrote this event
  event_type        TEXT NOT NULL,
  payload           JSONB NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- NO tenant_id column — this table is NOT RLS-scoped
);
```

## Access control (T-44, T-45)
Before reading or writing to `shared_project_events`:
1. Validate the requesting user's JWT tenant_id
2. Confirm that tenant is a member of the `connection_id` being accessed
3. Check the connection is in `active` status
This validation happens at the application layer — NOT via RLS.

## WebSocket isolation for cross-tenant events (T-15, T-16, T-17)
- Each tenant has ONE private WebSocket channel
- Cross-tenant events are written to `shared_project_events` by source tenant
- Server reads the event and fan-outs to destination tenant's channel
- A tenant's WebSocket channel NEVER receives events from a non-connected tenant

## Portal user migration (T-46, T-47)
When a portal user (Sub employee in GC's portal) becomes a full tenant:
1. Copy all records to the new tenant with fresh UUIDs (do NOT re-stamp old IDs)
2. Soft-delete originals in GC's portal tables
3. Super admin approval required before migration completes

## What data CAN be shared cross-tenant
Only data explicitly written to `shared_project_events` by the source tenant:
- Project milestones and schedule updates
- RFI responses and document approvals
- Invoice status updates
- Safety incident reports (required by contract)

## What data CANNOT cross the bridge
- Internal company financials
- Unapproved documents
- Internal notes/communications
- Employee records

## BUILT — v1.1 user-accessible bridge (PR #27, 2026-07-18) — invariants when touching this

- **Migration 0039:** `tenant_connections` + `project_id` (GC's project) / `scope_description` /
  `contract_value_cents` + status `rejected`; `projects.connection_id` (non-null ⇒ bridge-instantiated
  sub mirror project); `cross_tenant_lookup_tenant_by_email` SECURITY DEFINER fn (postgres-owned,
  tenant_id only, LIMIT 2) — the ONE governed users-FORCE-RLS exception, addon-gated at the route.
- **`publishIfActive` (bridge.ts) is the publish choke point** — re-validates membership + `status='active'`
  at publish time; ALL mirror sites (rfis/COs/submittals create+PATCH+approve/reject) use it, never
  `publishSharedEvent` directly. Revoked bridge ⇒ writes silently blocked, reads stay open (Doc 07 §8.3).
- **Generic `POST /:id/events` is whitelisted** (`GENERIC_EVENT_TYPES` note/milestone/schedule +
  `RESERVED_EVENT_PREFIXES` → 422) — never re-open free-form types (forged `project.location`/`rfi.answered`).
- **Accept instantiates the sub project** in the CALLER's (sub's) own `withTenantContext` from
  `readGcProjectSiteSnapshot` (whitelist: name/address/city/state/zip/lat/lng/geocode_status ONLY),
  audited `connection.project_snapshot_copied` in BOTH tenants, materialized as a `project.location`
  event (source = GC). Blocked at sub project limit (402, connection stays pending). Decline has NO
  addon gate. Revoke → `connection.revoked` job (envelope tenant = SUB) → mirror project `on_hold`.
- **Map layer:** `publishProjectLocationForProject` fires on accept / `PATCH /projects/:id/location` /
  geocode-worker; `GET /v1/connections/map` filters `source_tenant_id != caller` — GC pins stay empty
  until sub→GC publishing exists.
- **Realtime web:** `web/src/lib/use-tenant-channel.ts` (pusher-js, dynamic import, env-gated no-op;
  refetch-on-event only). Mounted on connections detail + map — not app-wide.
- **Tests:** `cross-tenant-lifecycle.test.ts` + `cross-tenant-map.test.ts` + `cross-tenant-permissions.test.ts`
  + `cross-tenant-closeout.test.ts` (+ 4 older files). Test cleanup gotcha: circular FK
  `connections.project_id ↔ projects.connection_id` — NULL the link first.

## BUILT — Doc 07 §5 permissions + §8 closeout + sub→GC pins (2026-07-18, migration 0040)

- **Permissions JSONB (§5):** `tenant_connections.permissions` (default = §5.1: core ON, optional ON,
  labor OFF) + `proposed_permissions`. `eventTypePermitted(perms, eventType)` (pure, fail-open) gates
  rfi.* / submittal.* / note.posted; core families (change_order.*, project.location, connection.*,
  milestone/schedule.updated) NEVER gate. Enforcement lives inside `publishIfActive` — LAYERED ON TOP
  of the payload whitelist, which stays the leak floor. Mirror sites gate `notifyCounterparty` on a
  non-null publish result (**no notify without publish** — never regress this). Generic events +
  response routes return 403 `EVENT_TYPE_DISABLED`.
- **Negotiation:** `PUT /connections/:id/permissions` (OWNER/PM, either party, active only). Zod locks
  core `literal(true)` + `show_labor_costs literal(false)` → 422. Pure TIGHTENING applies immediately
  (dual audit `connection.permissions_updated` + `connection.permissions_updated` shared event);
  any LOOSENING → `proposed_permissions`, counterparty decides via `POST /:id/permissions/consent`
  `{accept}` (proposer self-consent 403). `daily_reports` + `labor_visibility` flags gate nothing yet
  — any future labor-summary event builder MUST consult them.
- **Sub→GC pins:** `publishProjectLocationForProject(tenantId, projectId, p)` handles BOTH sides —
  sub side keys on `p.connection_id`, which MUST be threaded from the caller's own RLS-scoped project
  row (projects is FORCE RLS; the raw-pool helper can't read it). Call sites: location PATCH
  (`projects.ts`) + `geocode-worker.ts` RETURNING lists include `connection_id`.
- **Closeout (§8):** status + `'completed'`, `closed_reason` CHECK (completed|terminated_for_cause|
  mutual_agreement|other), `closed_at`. `GET /:id/closeout` = ledger checklist (rfi.created w/o
  rfi.answered, change_order.created w/o responded — NOT EXISTS form). `POST /:id/complete` = GC-side
  OWNER/PM, 409 `CLOSEOUT_INCOMPLETE` unless clear or `acknowledge_incomplete`; publishes the final
  `connection.completed` ledger event WHILE active, dual audit, `sendJob('connection.closed', sub)`.
  Revoke gains `reason_code` (no 'completed' — 422). Worker `handleConnectionClosed` (handles BOTH
  `connection.revoked` + `connection.closed` job types): completed/mutual_agreement → mirror project
  `'completed'`, else `'on_hold'`; legacy envelopes w/o reason unchanged. Completed = writes blocked
  (`status !== 'active'` everywhere), reads stay open (§8.3 read-only archive); re-invite allowed
  (invite dup-check excludes completed).
- **Deferred:** NONE — v1.1 build-out complete. Mobile surface shipped 2026-07-19 (PR #35):
  `mobile/src/screens/Connections{,Detail}Screen.tsx` — list + detail + sub-side accept/decline
  (bodyless POSTs need an explicit `{}` body — Content-Type json with empty body 400s), event
  thread renders family labels + whitelisted-payload snippets only, notifications deep-link via
  `data.connection_id`. Portal group token-migrated same day (PR #36).

## BUILT — §3.3 opt-in fuzzy discovery + portal i18n (2026-07-19, PRs #33/#34, migration 0042)

- **`tenant_discovery_profiles` is NO-RLS per T-44** — but unlike the other neutral tables it is
  opt-in-by-construction: a row only holds directory fields the tenant's OWNER chose to publish
  (`discoverable` defaults FALSE → untouched tenants unfindable). The SELECT column list in
  `GET /connections/discovery` (`tenant_id, name, trades, states, service_area`) is the leak
  whitelist — never widen it, never add sensitive columns to the table.
- **Search guards:** addon gate FIRST (mirrors lookup — scanner learns nothing); `q` required
  2..100 (no browse-all listing); **escape `%_\` before the ILIKE arg** — `q='%%'` would bypass
  the min-length guard and list everything; raw `q` goes only to `similarity()`. LIMIT 10.
  Audit `connection.discovery_search` carries `result_count` only, never result tenant_ids.
- **⚠️ pg_trgm + PgBouncer:** `set_limit()` and the `%` operator read the session GUC
  `pg_trgm.similarity_threshold` — session state leaks across transaction-mode pooling (T-48
  class). Only the stateless form `similarity(a, b) >= 0.3` is allowed in queries.
- **Profile routes:** `PUT /connections/discovery-profile` is OWNER-only (org-exposure decision,
  settings-org precedent) and **addon-free** — controlling your own exposure must never require
  purchasing the add-on (same rationale as decline). Trades validated via `normalizeTradeKey()`
  (T-64 canonical keys; aliases collapse, unknown → 422 `UNKNOWN_TRADE`).
- **Web:** `/settings/discovery` (opt-in toggle + taxonomy trade picker + states + blurb) +
  "Search directory" mode on the connections invite flow (result card → existing `found` state).
  i18n `connections.discovery.*` EN+ES.
- **Portal i18n (PR #34):** (sub-portal) pages keyed under `connections.sub_portal.portal/accept.*`;
  (portal) client portal under the new `portal` namespace (`web/src/lib/i18n.ts` + 
  `web/locales/{en,es}/portal.json`); shared `PortalHeader` client component. Realtime toasts +
  `resolveNotificationUrl` deep-link `connection_id` → `/connections/:id` (mapped BEFORE project
  checks — a shared-event ref may carry the counterparty's unroutable project_id).
- **Tests:** `cross-tenant-discovery.test.ts` (17).

## BUILT — §5.1 event-family depth: invoice.* / lien_waiver.* / message.sent (2026-07-18, migration 0041)

- **Invoice workflow (core, never gated):** `invoices.connection_id` (0041, partial idx) — **SUB-side
  only** link (direction REVERSED vs rfis/COs: the sub bills the GC; create/PATCH gate is
  `conn.sub_tenant_id === tenant_id` → else 403). `invoice.submitted` publishes on create-as-`sent`,
  draft→`sent` PATCH, and amount/due_date amendment while `sent` (thread collapses by `invoice_id`).
  Whitelist `buildInvoiceEventPayload` = `{invoice_id, amount_cents, status, due_date}` — NO
  contract_id/retainage/stripe/QB. Sub marking its own row paid publishes NOTHING —
  `invoice.approved`/`invoice.paid` originate only from the GC-only `POST /:id/invoice-response`
  (`decision: approved|paid`, RESPONSE_ROUTES entry). GC never holds an invoice row.
- **Lien waivers (core, never gated, EVENT-LEDGER-ONLY — no table):** `POST /:id/lien-waiver-request`
  (GC-only; body waiver_type ∈ conditional/unconditional × progress/final + amount_cents? +
  through_date? + note?; server generates `waiver_id`) and `POST /:id/lien-waiver-sign` (sub-only;
  ledger-validated → 404 `WAIVER_NOT_FOUND` / 409 `WAIVER_ALREADY_SIGNED`). State derives from the
  ledger by `waiver_id` — closeout checklist + `/complete` 409 details gained `open_lien_waivers`.
  Revisit a table only when signed-document upload lands (would reference the ledger waiver_id).
- **`message.sent` (optional, gated on `optional_events.messages`):** member-publishable via the
  generic `POST /:id/events` (`GENERIC_EVENT_TYPES`, `{message: 1..2000}`); `note.posted` kept for
  back-compat, same gate branch in `eventTypePermitted`.
- **`RESPONSE_ROUTES` extension:** entries may set `side: 'gc'|'sub'` (403 on wrong party; the 3
  original routes stay side-less) and `eventType` may be a `(body) => string` fn — the loop parses
  the body BEFORE resolving/gating the event type.
- **Reserved prefixes** grew `'invoice.'` + `'lien_waiver.'` (server-published only — generic-events
  forgery guard 422s them). `eventTypePermitted` comment locks invoice.*/lien_waiver.* as core —
  never add a gating branch.
- **Worker copy:** `CROSS_TENANT_NOTIFY_COPY` ×6 new entries (stripe-worker.ts).
- **Pusher last mile LIVE (2026-07-18):** real `PUSHER_*` creds in `.env` (us2); api REST trigger
  verified HTTP 200; web `NEXT_PUBLIC_PUSHER_KEY/CLUSTER` baked via Dockerfile ARG + compose
  build.args (sourced from the same `.env` PUSHER_*). All new families ride `fanOutSharedEvent`
  automatically.
- **Tests:** `cross-tenant-invoices.test.ts` (11) + `cross-tenant-lien-waivers.test.ts` (10, incl.
  message.sent gate + closeout/complete chain); closeout suite assertions updated for
  `open_lien_waivers`.

## BUILT — §5 final families: daily reports (auto-mirror) + labor summaries (nightly cron) (2026-07-18, no migration)

- **Doc 07 §5 is now FULLY gated** — every permission toggle controls a real event family.
- **Daily reports AUTO-MIRROR:** `POST/PATCH /v1/daily-reports` publishes
  `daily_report.submitted`/`updated` when the report's project is a bridge mirror
  (`projects.connection_id` read on the same RLS client) — gated ONLY by
  `optional_events.daily_reports` (fail-open). No per-report opt-in; the §5 negotiation is the
  consent. Whitelist `buildDailyReportEventPayload` = `{report_id, report_date, weather, notes}`
  (pg DATE normalized to YYYY-MM-DD). DELETE publishes nothing. Mobile sync sweep auto-works
  (same routes).
- **Labor summaries:** nightly `cross_tenant.labor_summary_scan` (00:30 UTC, after the 23:55
  auto-clockout) → per-active-connection `cross_tenant.labor_summary` jobs (envelope tenant =
  SUB, owner of the time_entries). Handler (`workers/cross-tenant-labor-worker.ts`) aggregates
  yesterday's `time_entries` on mirror projects (JOIN users for names) → `labor.summary`.
  **`labor.*` gate FAILS CLOSED** (§5 deviation from the fail-open norm — flags default false):
  publishes only when `show_total_hours` or `show_crew_names` is explicitly true.
  `buildLaborSummaryPayload` filters field-by-field; per-worker hours only when BOTH flags on;
  **NO cents field exists in the shape** (leak-floor tested). `laborSummaryAlreadyPublished`
  dedupes per connection/date (pg-boss retry guard). Zero entries → no event.
- **⚠️ Scheduled-queue rule (dead-cron discovery):** `boss.schedule(name, …)` publishes to queue
  `name` — a scheduled queue NEEDS its own `boss.work(name, …)` consumer; the `'jobs'` switch
  NEVER receives it. `time_punches.auto_clockout_scan` + `warranty.daily_expiry_check` had never
  fired (jobs stuck `created`). Auto-clockout consumer now registered in index.ts beside its
  schedule; **warranty cron FIXED 2026-07-18** (`warranty.daily_expiry_scan` scan queue + consumer →
  per-tenant `warranty.daily_expiry_check` jobs; old schedule unscheduled). When adding any
  `boss.schedule`, register the consumer next to it.
- Reserved prefixes grew `'daily_report.'` + `'labor.'`. Worker notify copy ×3.
- Web: read-only **Field activity** card on connections detail (ledger-derived reports + labor
  rows, EN+ES `connections.field_activity.*`).
- Tests: `cross-tenant-daily-reports.test.ts` (8) + `cross-tenant-labor-summary.test.ts` (8).
