# Cross-Tenant (GC↔Sub) v1.1 — Session Plan

> **Purpose:** working plan to make the GC↔Sub collaboration bridge fully user-accessible (P-02).
> Track through the remaining phases one branch + one PR each. Update the status table as PRs land.
> **Load first:** `.claude/skills/cross-tenant-bridge/SKILL.md`, `.claude/skills/sub-portal/SKILL.md`,
> `.claude/skills/realtime-channels/SKILL.md`, `LOCKED_DECISIONS.md` (A-07, P-02, P-04, PR-08,
> T-15/16/17, T-44/45/46/47).

---

## Kickoff prompt (paste to start a working session)

```
Read docs/CrossTenant_v1_1_Session_Plan.md. We're building out the GC↔Sub cross-tenant
bridge (P-02) phase by phase. PRs #9 (RFI/CO/submittal bridge) and #10 (portal-migration
backend) are already open — treat their code as the established pattern.

Pick the next NOT-STARTED phase from the status table (default: Phase 3 — cross-tenant
notifications + invite worker, it's the smallest and unblocks realtime). Before coding:
git checkout main && git pull && git checkout -b <the branch name in that phase's row>.

Follow the phase's scope exactly. Non-negotiables: everything cross-tenant goes through
api/src/lib/cross-tenant/bridge.ts (T-44/45 membership + payload whitelist — no raw SQL on
shared_project_events / tenant_connections); money in cents; add an app.inject test that
includes a payload-leak assertion where events cross; api + web `tsc --noEmit` clean; i18n
EN+ES parity for any new web chrome. Apply new migrations with
`DATABASE_URL=postgresql://postgres:postgres@localhost:15432/platform_dev node_modules/.bin/prisma migrate deploy --schema prisma/schema.prisma`.
Commit, push, open a PR, then update the status table in this doc. ultrathink the RLS/leak
boundary on every phase.
```

---

## Status

| Phase | Feature | Branch | State | PR |
|-------|---------|--------|-------|----|
| 1 | RFI / change-order / submittal bridge (mirror + Sub response + web) | `feat/cross-tenant-rfi-bridge` | ✅ DONE | #9 |
| 2 | Portal-migration backend (T-46/47) | `feat/portal-migration-backend` | ✅ DONE | #10 |
| 3 | Cross-tenant notifications + `connection.invite_sent` worker | `feat/cross-tenant-notifications` | ✅ DONE (stacked on #9) | #12 |
| 4 | Cross-tenant tier gate (PR-08 add-on) | `feat/cross-tenant-tier-gate` | ✅ DONE (stacked on #12; gates invite + accept) | #13 |
| 5 | Sub-portal invite funnel (P-04) | `feat/sub-portal-invite` | ✅ DONE (stacked on #13) | #14 |
| 6 | Pusher realtime fan-out (T-15/16/17) | `feat/cross-tenant-realtime` | 🟡 SCAFFOLDED (env-gated; backend built+tested; web client = last-mile) | #16 |
| 7 | Portal-migration: associated-data copy | `feat/portal-migration-data-copy` | ✅ DONE (stacked on #10) | #15 |
| 8 | **v1.1 user-accessible bridge (P-02)** — lifecycle UI (slug/email lookup, invite w/ project+scope+value, decline→`rejected`, accept→**sub-project instantiation** Doc 07 §6, revoke→async `on_hold` disposition), true detail + tenant names, `publishIfActive` publish-time guard, generic-event whitelist (forgery fix), CO approve/reject mirror, **cross-tenant map layer** (Doc 20 Phase 6b — `project.location` events + `GET /connections/map` + purple layer), **realtime web client** (`use-tenant-channel.ts`, env-gated). Migration 0039. Live 2-tenant smoke green. | `feat/cross-tenant-v11-bridge` | ✅ DONE — SHIPPED 2026-07-18 | #27 |

| 9 | **Doc 07 spec-gap follow-up** — §5 permissions JSONB (migration 0040: §5.1-default `permissions` + `proposed_permissions`; `eventTypePermitted` gate inside `publishIfActive` LAYERED ON the payload whitelist; tighten = immediate, loosen = counterparty re-consent via `PUT /:id/permissions` + `POST /:id/permissions/consent`; core events Zod-locked ON, `show_labor_costs` locked OFF; notify-without-publish fix at all 8 mirror sites) · **sub→GC location publishing** (mirror `projects.connection_id` threaded through location PATCH + geocode-worker → GC map pins live) · **§8 closeout** (`completed` status + `closed_reason/closed_at`; `GET /:id/closeout` ledger checklist; `POST /:id/complete` GC-only w/ `acknowledge_incomplete`; revoke reason codes; worker `handleConnectionClosed`: completed/mutual_agreement → mirror `completed`, else `on_hold`; read-only archive; re-invite allowed) · web (permissions panel, closeout card, revoke reason, Completed tab, EN+ES) | `feat/cross-tenant-permissions` | ✅ DONE — 2026-07-18 | — |

| 10 | **§5.1 event-family depth** — **invoice workflow** (migration 0041 `invoices.connection_id`, SUB-side link — direction reversed vs rfis; `invoice.submitted` on create-as-sent / draft→sent / amend-while-sent via `publishIfActive`; GC-only `POST /:id/invoice-response` → `invoice.approved`/`invoice.paid`; whitelist = invoice_id/amount_cents/status/due_date, NO contract/retainage) · **lien waivers** (event-ledger-only, NO table — `POST /:id/lien-waiver-request` GC-only w/ server-generated `waiver_id` + `lien-waiver-sign` sub-only w/ 404/409 ledger validation; closeout checklist + `/complete` gain `open_lien_waivers`) · **`message.sent`** (generic member-publishable, gated on `optional_events.messages`; `note.posted` kept for back-compat) · `RESPONSE_ROUTES` gains `side` guards + body-resolved eventType · `invoice.`/`lien_waiver.` reserved prefixes · worker notify copy ×6 · web (invoice thread + GC respond, lien waiver card, message composer, share-with-GC on new-invoice, EN+ES) · **Pusher last mile LIVE** (real creds in .env; api REST trigger verified HTTP 200; `NEXT_PUBLIC_PUSHER_*` baked into the web build) | `feat/cross-tenant-invoice-lien-events` | ✅ DONE — 2026-07-18 | — |

| 11 | **§5 final families — daily reports + labor summaries** (Doc 07 §5 now FULLY gated) — **daily reports AUTO-MIRROR** (`daily_report.submitted`/`updated` published from the daily-reports routes when the report's project is a bridge mirror (`projects.connection_id`), gated only by `optional_events.daily_reports` — the §5 negotiation is the consent, no per-report opt-in; whitelist report_id/report_date/weather/notes; NO migration) · **labor summaries via nightly cron** (`cross_tenant.labor_summary_scan` 00:30 UTC → per-connection `cross_tenant.labor_summary` jobs, envelope tenant = sub; aggregates yesterday's `time_entries` on mirror projects; `labor.summary` payload field-filtered by `labor_visibility` — **fail-CLOSED**, flags default false, per-worker hours only when both flags on, **costs never cross** (no cents field in the shape, leak-floor tested); ledger dedupe per connection/date) · **⚠️ dead-cron discovery + fix**: scheduled pg-boss queues need a dedicated `boss.work` consumer — the 'jobs' switch never receives them; `time_punches.auto_clockout_scan` had NEVER fired (fixed in index.ts); `warranty.daily_expiry_check` same bug, needs fan-out redesign → **open follow-up** · web Field activity card (EN+ES) | `feat/cross-tenant-daily-labor-events` | ✅ DONE — 2026-07-18 | — |

| 12 | **Fuzzy discovery (§3.3)** — opt-in directory (migration 0042: `tenant_discovery_profiles`, NO-RLS per T-44 — opt-in-by-construction whitelist, `discoverable` defaults FALSE; trades = canonical T-64 keys via `normalizeTradeKey`; + `pg_trgm`) · `GET/PUT /connections/discovery-profile` (PUT OWNER-only, addon-FREE) + `GET /connections/discovery?q=&trade=&state=` (OWNER/PM, addon gate FIRST, ILIKE-escaped q + **stateless `similarity()>=0.3` only — `set_limit()`/`%` operator forbidden under PgBouncer transaction mode**, LIMIT 10, whitelisted fields, count-only audit) · web `/settings/discovery` opt-in page + hub card + "Search directory" invite mode (EN+ES) · tests ×17 incl. `%%` browse-all-bypass guard + leak-floor shape | `feat/cross-tenant-discovery` | ✅ DONE — 2026-07-19 | #33 |

| 13 | **Sub-portal + client-portal i18n** — all 7 portal surfaces keyed EN+ES ((sub-portal) → `connections.sub_portal.portal/accept.*`; (portal) client portal → new `portal` ns registered in `web/src/lib/i18n.ts`); shared `PortalHeader` client component (server layouts stay server); status enums via keyed label maps; `'en-US'` date/currency → `i18n.language` · **toast click-through**: realtime toasts link to `/connections/{connection_id}`; `resolveNotificationUrl` maps `data.connection_id` → connection detail BEFORE project checks | `feat/sub-portal-i18n` | ✅ DONE — 2026-07-19 | #34 |

| 14 | **Mobile Connections surface** — `ConnectionsScreen` (status-chip list, 402 → upgrade note) + `ConnectionDetailScreen` (summary, shared-event thread w/ family labels + whitelisted-payload snippets, cursor load-more, **Accept/Decline** for the invited sub's OWNER/PM — `{}` body avoids the bodyless-POST Content-Type 400) · global 🔗 tile (OWNER/PM) · new mobile `connections` i18n ns EN+ES · cross-tenant notifications tap-through → ConnectionDetail via the `HomeTab` parent route · API-only/online, pure JS → OTA (runtime 1.2.0) | `feat/mobile-connections` | ✅ DONE — 2026-07-19 | #35 |

| 15 | **Portal design-token migration** — 9 portal files (client portal + sub-portal + accept + shared header) gray-*/blue-*/red-* → semantic tokens (bg-app/bg-surface/text-ink/text-muted/border-line/brand/status-*); portals now follow light/dark | `feat/portal-token-migration` | ✅ DONE — 2026-07-19 | #36 |

**Post-#27 deferred: NONE — the cross-tenant v1.1 build-out is complete.** (Warranty expiry cron FIXED 2026-07-18 — `feat/warranty-expiry-cron-fix`.)

---

## Established pattern (from Phases 1–2 — reuse, don't reinvent)

- **`api/src/lib/cross-tenant/bridge.ts`** is the ONE choke point: `validateConnectionMembership`
  (T-45), `publishSharedEvent`, and `build<Object>EventPayload` **whitelists** (the data-leak
  boundary — internal ids never cross; CLAUDE.md rules 11–13).
- **Mirror hooks** live in the object's own route (create + PATCH): validate the caller is the GC of
  an *active* connection, write the row, then `publishSharedEvent('{type}.created'|'.updated', …)`
  AFTER commit.
- **Sub responses** are typed endpoints on `connections.ts` (config-driven loop) →
  `{type}.responded`, audited under category `cross_tenant`.
- `shared_project_events` + `tenant_connections` stay **RLS-exempt** (T-44); isolation is enforced in
  the bridge on every access.
- Tests: `api/src/test/cross-tenant-rfi.test.ts` is the model — two tenants, active + pending
  connections, share→mirror→respond→read chains + payload-leak assertions + 403/409 guards.
- Web: connection-detail page renders a unified shared-objects thread; object create pages carry a
  "share with a connected sub" picker (GC-side active connections only). i18n `connections.*` /
  `field.rfis.share_*`.

---

## Phase 3 — Cross-tenant notifications + invite worker  ⬅ recommended next

**Why:** `POST /v1/connections` already enqueues `connection.invite_sent`, but there is no worker
handler and no in-app notification when a Sub is invited or when a shared object arrives. Smallest
phase; makes the bridge feel live without Pusher; prerequisite for realtime (same fan-out shape).

**Scope**
- Add a `cross_tenant.notify` job (or extend the existing `connection.invite_sent`) handler in a
  worker, registered in the `stripe-worker.ts` dispatcher (A-14 pattern). Envelope carries `tenant_id`
  of the RECIPIENT tenant (T-10); worker uses `withTenantContext(recipientTenantId)`.
- On invite: notify the Sub tenant's OWNER/PM (`notifications` row, category `cross_tenant`).
- On a new shared event (`rfi.created`, `change_order.created`, `submittal.created`,
  `*.responded`): server enqueues a notify job to the OTHER party. Fan-out helper in `bridge.ts`
  (`notifyCounterparty(connection, sourceTenantId, eventType)`) so Phase 6 can reuse it.
- Respect `notification_preferences` (T-40); safety events N/A here.

**Files:** `api/src/lib/cross-tenant/bridge.ts` (+notify helper), a worker handler,
`api/src/routes/v1/connections.ts` + the three object routes (enqueue on publish), test.
**Locked:** T-10, T-40, T-41, T-44/45. **Tests:** notify enqueued to the correct counterparty tenant;
none to the source; skipped when pref disabled.

---

## Phase 4 — Cross-tenant tier gate (PR-08)

**Why:** the Pricing matrix gates cross-tenant collaboration behind the `cross_tenant` add-on
(PR-08; included Business+). Today `POST /v1/connections` has no tier check.

**Scope**
- `assertHasAddon(tenant_id, 'cross_tenant')` in the service/route layer on `POST /v1/connections`
  (invite) — 402 `ADDON_REQUIRED` for tenants without it (Professional needs the $149/mo add-on;
  Business+ included). Accept side is NOT gated (a Sub without the add-on can still accept + respond —
  confirm against Pricing doc; if the Sub also needs it, gate accept too and note it).
- Web: surface the 402 as an upgrade prompt on the connections page.

**Files:** `api/src/routes/v1/connections.ts`, tier-enforcement service, web connections page + i18n.
**Locked:** PR-08, P-03, tier matrix §5. **Open Q — RESOLVED (#13):** yes, the *Sub* side is gated
on accept too (PR-08 monetizes "Professional subs connecting"; accept = the sub's act of connecting).
Not the free Sub Portal (P-04). Accept gate runs after membership/status so tier isn't leaked.
**Tests:** invite/accept without add-on → 402; Business or add-on → 201/200; non-member → 403 before tier.

---

## Phase 5 — Sub-portal invite funnel (P-04)  ← biggest business value

**Why:** the acquisition engine. A GC invites a sub who has **no account**; the sub joins free as a
`sub_portal` user inside the GC's tenant, later converts (→ Phase 2 migration). Distinct from the
tenant↔tenant bridge.

**Scope** (mirror the homeowner magic-link pattern — `builder-warranty` skill)
- `POST /v1/sub-portal/invite` (OWNER/PM) `{ email, first_name, last_name, project_id }` → create a
  `users` row in the GC tenant `role='sub_portal', status='invited'` (respect `assertCanAddUser` —
  sub_portal users count toward the GC seat limit, P-04 tier note), enqueue a magic-link email
  (SendGrid, A-15).
- Magic-link auth: Redis `sub_portal_magic:{token}` (7-day, single-use) → set password →
  `status='active'` → standard tenant JWT scoped to the GC tenant, `role='sub_portal'`.
- Portal read surface (scoped, RLS): assigned documents (read), RFIs directed to them (respond),
  submittals (approve/reject), schedule (read). NO financials/budget/team/settings/other projects.
- Web: GC invite form; a minimal `/portal` surface for the sub_portal role.

**Files:** `api/src/routes/v1/sub-portal.ts`, `sub-portal-auth.ts`, magic-link lib (reuse
`password-reset.ts` helpers), a worker job, web invite + portal pages, i18n EN+ES.
**Locked:** P-04, A-15, roles matrix, `assertCanAddUser`. **Tests:** invite creates invited user +
enqueues link; token exchange single-use; sub_portal RLS scoping (cannot read another project /
financials). **Note:** needs SendGrid configured for live email (graceful skip in tests).

**✅ BUILT (PR #14) — what shipped + decisions made:**
- **Linkage = `project_members` row** (`role='sub_portal'`). Every portal read re-derives the caller's
  allowed `project_ids` from `project_members` and filters/authorizes on it (`memberProjectIds`).
- **Containment gate (the security core):** a `sub_portal` user lives INSIDE the GC tenant, so tenant
  RLS alone would expose the whole tenant. A GLOBAL `onRequest` hook in `index.ts` decode-only inspects
  the bearer and **rejects any `SUB_PORTAL` token on every `/v1/*` path except `/v1/sub-portal`** (403).
  Decode-only is safe (deny-only; the per-route `authenticate` still fully verifies). This locks the
  role to its namespace platform-wide in ONE place — no need to touch general/financial routes.
- **Endpoints:** `POST /v1/sub-portal/invite` (OWNER/PM; `assertCanAddUser`; idempotent re-invite adds
  membership), `POST /v1/sub-portal/auth/accept` (public; magic token carries `userId:tenantId` so the
  read/update runs under `withTenantContext(tenantId)` — a raw cross-tenant read hits the `''::uuid` GUC
  error on the NOBYPASSRLS pool), `POST /v1/sub-portal/auth/logout`, `GET /v1/sub-portal/projects`,
  `GET /v1/sub-portal/projects/:id` (schedule+documents+directed RFIs, safe fields, 403 non-member),
  `POST /v1/sub-portal/rfis/:id/respond` (assignee_id must = caller).
- **Tests:** `api/src/test/sub-portal.test.ts` (10) incl. LEAK GUARD (other-project 403) + CONTAINMENT
  (general route 403, financial route 403) assertions. Full suite 320 green; api+web `tsc` clean.
- **Web:** GC invite page (`projects/[id]/sub-portal`, i18n `connections.sub_portal.*` EN+ES) + tile;
  public accept page (`(sub-portal-auth)/…/accept` + cookie proxy `api/sub-portal/accept`); gated portal
  home + project detail (`(sub-portal)/…`). Sub-facing portal chrome is **English** (matches the existing
  client-portal group precedent); ES for the sub-facing portal is a follow-up.

---

## Phase 6 — Pusher realtime fan-out (T-15/16/17)  ← blocked on env

**Why:** delivers the "real time" tagline — Sub sees a shared object without refresh.
**Blocked:** needs a Pusher account + `PUSHER_*` env (Stage 1–2 choice, A-16). Confirm provisioning
before starting.

**Scope**
- `POST /v1/pusher/auth` channel-auth endpoint: validate the JWT `tenant_id` against the requested
  `private-tenant-{tenant_id}` channel (T-15/16) — mismatch → 403.
- Server fan-out (T-17): when `publishSharedEvent` writes, publish a SCOPED payload to EACH party's
  own `private-tenant-{tenant_id}` channel independently (reuse Phase 3's `notifyCounterparty`).
  Sub's internal data never enters the GC's channel payload (already guaranteed by the whitelist).
- Web: subscribe on the connection-detail page; drop the manual poll/refresh.

**Files:** `api/src/routes/v1/pusher-auth.ts`, a pusher client lib, `bridge.ts` fan-out, web
subscription. **Locked:** T-15/16/17, A-16. **Tests:** channel-auth mismatch → 403; fan-out targets
both channels (mock the Pusher client).

**🟡 SCAFFOLDED (PR #16) — backend built + env-gated, web client is the last mile:**
- **`api/src/lib/pusher.ts`** — dependency-free (node:crypto HMAC + fetch; NO `pusher` npm dep).
  `pusherEnabled()` (false when `PUSHER_*` unset OR still the `your-pusher-*` placeholder → everything
  no-ops, platform runs fine without realtime), `authorizeTenantChannel(socketId, channel, tenantId)`
  (signs ONLY the caller's own `private-tenant-{tenant}` channel), `triggerToTenant(tenant, event, data)`
  (Pusher REST, best-effort, never throws).
- **`POST /v1/pusher/auth`** (`pusher-auth.ts`) — the T-16 gate: 200 signed for the caller's own channel,
  **403 `CHANNEL_FORBIDDEN`** for any other tenant's channel, **503 `REALTIME_DISABLED`** when unconfigured.
- **T-17 fan-out folded into `bridge.publishSharedEvent`** (the ONE write choke point → covers all 6
  mirror/response sites automatically): after the INSERT, `fanOutSharedEvent` triggers the whitelisted
  payload to BOTH parties' channels (`shared.event`). Best-effort; no-op when disabled. The whitelist is
  still the leak boundary — no internal data crosses.
- **Web auth proxy** `web/src/app/api/pusher/auth/route.ts` (cookie → Bearer) — ready for a browser
  `pusher-js` authorizer.
- **Tests:** `pusher-auth.test.ts` (4 — own-channel signed, other-channel 403, pure authorize, disabled 503)
  + `cross-tenant-fanout.test.ts` (3 — both channels triggered, publish-choke-point fan-out, unknown-conn
  no-op; Pusher client mocked). Full suite 327 green; api+web `tsc` clean.
- **LAST MILE when creds land** (no code changes to the above): (1) set real `PUSHER_*` in `.env` +
  `NEXT_PUBLIC_PUSHER_KEY`/`NEXT_PUBLIC_PUSHER_CLUSTER` for web; (2) `npm i pusher-js` in `web`; (3) a
  small client hook that subscribes to `private-tenant-{tenant}` via the `/api/pusher/auth` proxy and
  refetches the connection-detail thread on `shared.event` (drops the manual poll). The REST trigger
  signing in `pusher.ts` is untested-until-creds (no network in CI) — smoke-test it on first real key.

---

## Phase 7 — Portal-migration: associated-data copy

**Why:** Phase 2 migrated the user record only (the T-46 invariant). Complete the migration by copying
the sub's project-visible data into the new tenant with fresh UUIDs, then soft-deleting originals.

**Scope**
- Extend the approve/execute path: copy the sub's associated rows (documents metadata, RFIs/submittals
  authored, etc. — enumerate against the roles matrix "what a sub_portal user can access") into the
  target tenant with **new UUIDs** (never re-stamp), soft-delete originals, record a mapping. Likely
  an async job for volume.
- Full PLATFORM audit per step; notify both tenant admins on completion (T-47 step 4).

**Files:** `api/src/routes/v1/portal-migrations.ts` (+ worker), migration if a mapping table is
needed, test. **Locked:** T-46, T-47, T-58 (chain-of-custody audit). **Risk:** cross-tenant data
copy correctness — do it in an idempotent, resumable job; test the new-UUID + soft-delete invariants
per table.

---

## Cross-cutting invariants (every phase)

1. All cross-tenant access through `bridge.ts` — never raw SQL on the two neutral tables (T-44/45).
2. Payload whitelist is the leak boundary — assert it in tests wherever data crosses.
3. `withTenantContext(realTenantId)` for cross-tenant reads/writes — never a superadmin RLS bypass (T-52).
4. Money in cents (T-02); UUIDs (T-03); optimistic locking where the object has `version` (T-12).
5. `tsc --noEmit` clean (api + web); i18n EN+ES parity for new web chrome.
6. One feature = one branch = one PR; update this doc's status table when a PR opens.

---

*Created for the GC↔Sub v1.1 build-out. Phases 1–2 landed as PRs #9 and #10.*
