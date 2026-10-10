# Cross-Tenant Follow-Up — Next Session Prompt

> Saved 2026-07-18 after PRs #29–#32 (invoice/lien/message families · daily-report +
> labor-summary families — Doc 07 §5 now FULLY gated · warranty cron fix · dashboard-wide
> realtime toasts). Paste the block below as the session prompt.
>
> **Before the session (optional, 2 min):** the two-browser toast eyeball from PR #32 is
> still unverified by a human — GC logged in on any dashboard page, sub posts a message
> from the connection page → GC sees a bottom-right toast + live bell bump, the author sees
> nothing. If it misbehaves, mention it in the session prompt.

```
Cross-tenant bridge — fuzzy discovery (Doc 07 §3.3) + sub-portal i18n.
The last two web-side deferred items. Ledger: docs/CrossTenant_v1_1_Session_Plan.md
(Phase 11 + "Post-#27 deferred"). Load skill cross-tenant-bridge first.

Scope, priority order:
1. Fuzzy discovery (§3.3): let a GC FIND subs beyond exact slug/email — search
   by name/trade/region. Design constraints (non-negotiable):
   - OPT-IN only: a tenant is invisible to discovery unless it explicitly
     enables a discoverable flag (new migration — flag + trade/service-area
     fields; decide placement: tenants vs tenant_settings; propose in plan).
     Default OFF for every existing tenant — a tenant that never touched the
     setting must be unfindable.
   - Anti-enumeration precedent from the exact lookup (connections.ts
     /connections/lookup): addon-gated FIRST (assertHasAddon before any
     query), results capped, name/trade/region ONLY (no emails, no user data,
     nothing beyond what the invite POST needs), rate-limit consideration.
   - Check the Doc 07 §3.3 spec wording (Platform_CrossTenant_Spec_v1_0.docx —
     binary; extract text or reconstruct intent from GLOSSARY + session plan).
   - Settings UI for the sub to opt in + set trade/service area (settings
     page, EN+ES); GC-side search UI on the connections invite flow
     (augmenting the exact lookup) feeding the existing invite POST.
   - Trade values come from GET /v1/trades (T-64 taxonomy) — never a new
     free-text vocabulary.
2. Sub-portal page i18n: the (portal) pages are English-only. Audit what
   exists under web/src/app/(portal), key ALL portal chrome through
   react-i18next EN+ES (the sub_portal group in connections.json is partial).
   No defaultValue-only keys; data rows render as stored.
3. If time remains: toast click-through — deep-link realtime toasts to the
   connection detail (resolveNotificationUrl pattern; toast API may need an
   optional action/onClick).

Rules: whitelist stays the leak floor; discovery opt-in defaults false; tests
per surface (discovery: opted-out invisible, addon gate 402, capped results,
no-leak field assertions); EN+ES for all new chrome. /plan first, one branch
per feature (feat/cross-tenant-discovery, then feat/sub-portal-i18n as a
second small branch/PR same session), merge + deploy when green.
```

## State snapshot (context for the next session)

- **Shipped 2026-07-18:** PR #27 (v1.1 bridge UI) · #28 (§5 permissions + §8 closeout +
  sub→GC pins, migration 0040) · #29 (invoice/lien_waiver/message families, migration
  0041; Pusher live end-to-end) · #30 (daily-report auto-mirror + nightly labor summaries
  — §5 FULLY gated; auto-clockout dead cron fixed) · #31 (warranty expiry cron fan-out
  fix, live-verified) · #32 (dashboard-wide realtime: shared-socket singleton,
  counterparty toasts, live bell).
- **Cross-tenant remaining after this prompt:** mobile bridge surface (own session —
  native scale; sub sees connections/invoices/waivers from the field). v1.2 ideas:
  lien-waiver table w/ signed-document upload; worker auto-sync of sub invoice status on
  GC invoice.paid.
- **Standing gotchas:** scheduled pg-boss queues need their OWN boss.work consumer —
  register it beside the schedule (two crons were dead for months from this). Loosening
  §5 permissions requires counterparty consent (tests/smoke set jsonb directly). Smoke
  tenants: Apex `gc-67c3ef52` / Volt `sub-7e5d8307`, owner password `SmokeTest2026!`
  (reset 2026-07-18 for smoke).

## Backlog after that (ranked)

1. Mobile bridge surface (Mobile Enterprise Plan; nothing blocks it)
2. OQ-17 geofence enforcement + crew bulk clock-in (v1.1)
3. v1.2 bridge ideas above
