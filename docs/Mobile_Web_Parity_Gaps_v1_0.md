# Mobile ↔ Web Parity Gap Analysis v1.0
**"The Operating System for Construction" — Mobile feature coverage vs Web**

> **Status:** Audit — 2026-06-25. Maps what the React Native mobile app (`mobile/`) covers vs the
> Next.js web app (`web/`). Companion to `Mobile_Enterprise_Plan_v1_0.md` (Doc 15) — that doc owns
> the *plan*; this doc is the *gap ledger* (the diff that feeds it).
> **Stack/locked context:** A-09 (RN+Expo), A-10 (WatermelonDB), T-06/T-12/T-13/T-14 (offline conflict),
> T-56/T-57 (Business+ asset/cert gates), P-02 (cross-tenant v1.1).
> **Ground truth:** web ≈ 120 dashboard pages / ~200 API proxies; mobile = 29 screens (all registered,
> none orphaned — was 31; the per-table punch + safety conflict screens were folded into one
> registry-driven resolve screen 2026-07-27), **6 offline-write** (Inspections joined 2026-07-27, §B3)
> + **1 offline read-cache** (SafetyCert — 2026-07-25, §B1; writes still online), 22 API-only.

---

## 0. How to read this

Each gap has a **severity**:
- **P0** — field worker is blocked or a locked decision is unmet (offline-critical, safety/cert).
- **P1** — feature exists on web, mobile has none or read-only — parity debt.
- **P2** — office-first surface; intentionally web-first (Estimator/Accountant roles). Low mobile value.

Status legend: ❌ none · ⚠️ partial/read-only · ✅ parity.

---

## 1. Whole domains absent on mobile

Web has full pages; mobile has zero screen.

| Domain | Web coverage | Mobile | Severity | Note |
|--------|--------------|--------|----------|------|
| Standalone **inspections** (non-permit) | list / create / edit (T-12) | ✅ `InspectionsScreen` — list + create + status edit, **fully offline** | P2 | Was ❌/P0 → read-cache/P1. **Offline WRITES since 2026-07-27** (§B3): create + status change write locally as `pending` (row shows `•`) and ride the batch push; a 409 lands in the registry-driven conflict inbox (tier 2). Remaining vs web: no full field edit (date/notes/inspector on an existing row). |
| **Safety certifications** | list / upload / expiry | ⚠️ `SafetyCertScreen` — list + create | P1 | Was ❌/P0. **List is an offline READ CACHE** (schema v3) — T-57 cert state is now checkable in the field with no signal (worker names from the AsyncStorage roster cache `opt:users:roster`). Writes online-only; no document upload. |
| **JSA records** (job safety analysis) | full + attendees/hazards | ✅ `JSAScreen` — list + capture (attendees, hazards w/ severity + controls), **fully offline** | ✅ | Was ❌/P1 while the Safety Officer (a P0 mobile role) had no way to produce their core artifact. Offline WRITE table (schema v5, tier 3). A JSA with zero hazards is refused — that's a signature sheet, not a hazard analysis. Remaining vs web: no edit of an existing JSA, no attendee signatures. |
| **Submittals** | list / create / FSM | ⚠️ `SubmittalListScreen` — list + create (online) | P2 | Row was stale (said ❌); the screen exists. Remaining: FSM transitions. |
| **Milestones** | CRUD | ⚠️ `MilestoneListScreen` — list + create + mark complete (online) | P2 | Row was stale (said ❌); the screen exists. |
| **Crew assignments** | CRUD | ⚠️ `CrewListScreen` — list + assign (online) | P2 | Row was stale (said ❌); the screen exists. |
| **Project members / people** | CRUD | ❌ | P2 | Office task. |
| **Vendors** | registry + detail | ❌ | P2 | Office task. |
| **Cost codes** | CRUD | ❌ (picker only) | P2 | Picker exists inside TimeEntry; no management. |
| **Financial** (budget, invoices, change orders + approve, contracts) | full CRUD + approve FSM | ❌ | P2 | Accountant/PM = web-first per Enterprise Plan. |
| **Estimating** (bid packages, takeoffs, vendor bids, award) | full | ❌ | P2 | Estimator = web-first. |
| **Blueprints** (upload → analyze → review → import) | full hub + review UI | ❌ | P2 | Flagship feature, but heavy upload/review flow — web-first. |
| **Reports** (profitability) | yes | ❌ | P2 | — |
| **Dashboard / KPI home** | `/` KPIs + recents | ❌ | P2 | Mobile lands on project list; Owner exec dashboard is Enterprise Plan §A2 P2. |
| **Connections / cross-tenant** | full | ❌ | — | Deferred — blocked on P-02 (v1.1). Not a gap yet. |

---

## 2. Read-only / partial on mobile (hooked up, half-built)

Mobile screen exists but lacks the write/depth the web page has.

| Mobile screen | Mobile state | Web parity | Severity |
|---------------|-------------|------------|----------|
| `TradeScreen` (electrical/plumbing) | **both tabs offline** (panels/systems cached) + circuit/fixture **status offline-writable** (schema v9, conflicts resolvable) | create/edit the panels + systems themselves | P2 | Was P1 read-only. |
| `StructuralScreen` (roofing/concrete/framing) | **all three tabs offline** (parents cached) + status edit + **QA capture on all three** (concrete tests v7, roofing QA + framing corrections v8) | create/edit the parent systems/pours/inspections themselves | P2 | Was P1 read-only. Parents stay office-side (pull-only, `readOnly` server-side). |
| `TaskDetailScreen` | steps read-only; no "rebuild steps" (photos queue offline since §B4) | full edit + rebuild-steps | P1 |
| `TaskListScreen` | read list; status/% edit (OWNER/PM) | full edit, deps, build-steps | P1 |
| `PermitListScreen`/`PermitDetailScreen` | list + inspection result edit, **both fully offline** (permits = pull-only read cache, schema v6; result written locally + batch-pushed) | full permit CRUD + milestone generation | P1 |
| `DocumentsScreen` | browse + **photo upload** (offline-queued, T-27 pipeline) | + PDF/office upload (needs expo-document-picker, a native dep) | P2 | Row was stale (said browse-only, no upload). |
| `RfiListScreen` | list + create | full + edit/answer FSM | P1 |
| `SettingsScreen` | tiles/language/theme only | + org profile, billing, payroll, notification prefs | P1 |
| HVAC/mechanical | absent (not in Structural) | editable `hvac` page | P1 |

---

## 3. Offline / sync gaps (T-06 / T-12 / T-13 / T-14 debt)

The highest enterprise risk — a field tool that dies with no signal.

| Gap | Detail | Severity |
|-----|--------|----------|
| **22/29 screens are API-only** | Offline **write** = Project, TimeEntry, DailyReport, PunchList, SafetyIncident, Inspections (6 — the last joined 2026-07-27, §B3). Offline **read caches** = SafetyCert (2026-07-25, §B1) + the **asset yard cache** (2026-07-27, §B1 — `company_assets`, no screen of its own: it backs the QR scan in `assets/Checkout.tsx`), both pulled/never pushed with writes still needing signal (deliberate: a cert issued offline is a compliance record nobody is waiting on; checkout is T-57-gated server-side). Asset **capture** (fuel/inspection/damage) now works offline. All trade/permit/task/warranty/doc screens still dead offline. | **P0** |
| ~~**Asset field ops not offline**~~ | **DONE 2026-07-27** — and this row was wrong about the cause. Fuel log / asset inspection / damage report already had offline **capture queues** (§B4); they were **unreachable** because mobile has no asset LIST screen — the entry point is the QR scan in `assets/Checkout.tsx`, which needed the API to turn an `asset_number` into an asset. `company_assets` is now an offline READ cache (schema **v4**, pull-only client-side; the first `readOnly: true` entry in the server's `SYNC_TABLES`) and `findCachedAsset()` resolves the scan locally, so all three captures work in the yard. **Checkout / check-in stay online-only by design** — T-57 operator-cert enforcement is server-side, so both are disabled with a notice when the asset came from cache. Enterprise Plan §B1. | ✅ |
| ~~**Offline photo queue not built**~~ | **DONE** — this row was wrong in both directions. QA photos (TaskDetail), damage photos, inspection defect photos, documents, fuel logs and status PATCHes each already queued offline and flushed through the T-27/T-28 quarantine pipeline on reconnect. What was missing landed 2026-07-25 (§B4): one shared implementation + retry policy (`lib/queue-policy.ts` + `lib/offline-queue.ts`) fixing a **missing attempt cap** (poison item retried forever) and **message-string retry decisions**, plus `PendingUploadsBadge` so queue depth is visible at all. | ✅ |
| ~~**Queued upload failures are silent**~~ | **DONE 2026-07-27** — a dropped item (attempt cap or server verdict) now lands in a **dead-letter store** and the `PendingUploadsBadge` turns into a red ⚠️ offering Retry (back onto the original queue, clean slate) or Discard. Residual: the ImagePicker cache uri must still be valid at flush time — a photo whose local file the OS reclaimed can't be recovered. | ✅ |
| ~~**Tier-3 conflict UI unbuilt**~~ | **DONE** — and since 2026-07-27 it is ONE **registry-driven** `ConflictResolveScreen` (`lib/conflict-registry.ts`) covering time entries / punch / inspections (Tier 2) + safety incidents (Tier 3, `resolveRoles`-gated); the two per-table screens are deleted. `ConflictsScreen` inbox + `ConflictBadge` enumerate the registry. | ✅ |
| ~~**No conflict UI on daily/punch/safety**~~ | **DONE** — punch/safety/inspections all route to the one resolve screen; `daily_reports` is Tier-1 by policy (last-write-wins, no UI). | ✅ |
| **OS background sync** | **Batch push DONE 2026-07-24** (§B2 — one `POST /v1/sync/push` + one pull per sweep; the "shared-id rework" premise was wrong: the server takes a client-minted `id`). Sync still fires only in the foreground; app-closed sync needs `expo-task-manager` → native module + EAS rebuild. | P1 |

---

## 4. Priority roadmap

Sequenced; aligns to Enterprise Plan workstreams (A role, B offline, C tests).

### P0 — field-blocked / locked-decision debt
1. ~~**Safety certifications** view + standalone **inspections** create on mobile~~ — **DONE** (screens shipped; both lists cached offline since 2026-07-25, so T-57 cert state is visible in the field with no signal; **inspections got offline writes 2026-07-27**, §B3). Remaining: cert document upload (cert offline writes are deliberately not planned).
2. ~~**Offline coverage** for asset checkout / fuel / inspection (§B1 WatermelonDB models).~~ — **DONE 2026-07-27** (`company_assets` read cache, schema v4 — the QR scan resolves offline, which is what made the existing fuel/inspection/damage capture queues reachable). **Checkout/check-in deliberately excluded** — T-57 cert enforcement is server-side.
3. ~~**Offline photo queue** (§B4) — capture → local queue → presigned PUT on reconnect → triple validation.~~ — **DONE** (per-surface queues already existed; 2026-07-25 unified them onto one policy — backoff + 6-attempt cap + drop-on-server-verdict — and added the ⬆️ depth badge). Remaining: a user-facing surface for an item dropped after the cap.
4. ~~**Tier-3 conflict resolve UI** + `safety_blocked` inbox (§B3, satisfies T-14).~~ — **DONE** (registry-driven single resolve screen, 2026-07-27; adding a table is a `CONFLICT_TABLES` entry, not a screen).

### P1 — parity
5. Trade + structural **write** access (panels/circuits/fixtures; QA child records).
6. **Submittals, milestones, crew assignments** screens.
7. TaskDetail **rebuild-steps** + offline; RFI edit/answer; document upload.
8. Settings → org/billing/payroll/notification-preferences.
9. ~~Conflict UI on daily/punch/safety tables.~~ — **DONE** (see P0 #4).

### P2 — keep web-first (low mobile value)
10. Financial, estimating, vendors, cost-code mgmt — Estimator/Accountant are web roles.
11. Blueprints hub — heavy upload/review, web-first.
12. Owner exec dashboard / profitability reports (§A2 P2).

---

## 5. Coverage scorecard

| Bucket | Web | Mobile | Parity |
|--------|-----|--------|--------|
| Field ops (time, daily, punch, safety incident) | ✅ | ✅ offline | **good** |
| Tasks / schedule | ✅ full | ⚠️ read + status edit | partial |
| Trades (electrical/plumbing/structural/hvac) | ✅ CRUD + QA | ⚠️ read-only | partial |
| Permits / AHJ | ✅ full | ⚠️ list + inspection edit | partial |
| Assets | ✅ 9-tab + insurance | ⚠️ 5 screens; QR scan + fuel/inspection/damage capture work offline (asset read cache, 2026-07-27); checkout/check-in online-only (T-57) | partial |
| Warranty | ✅ full + homeowner | ⚠️ 4 screens, online-only | partial |
| Safety (cert, JSA, inspections) | ✅ | ⚠️ incidents + inspections (offline write) + certs (offline read cache, online writes); JSA ❌ | partial |
| Financial / estimating / vendors | ✅ | ❌ | gap (web-first) |
| Blueprints | ✅ | ❌ | gap (web-first) |
| Offline-first | n/a | ⚠️ 6/29 write + 1/29 read cache | **gap** |
| Tiered conflict UI (T-14) | n/a | ✅ registry-driven — tier 2 (time/punch/inspections) + tier 3 (safety), inbox + badge | ✅ |

---

## 6. Notes

- **Role lens matters.** Mobile is a *field* tool (Foreman/Field Tech/Safety Officer P0; Estimator/Accountant web-first per Enterprise Plan §1). P2 gaps are mostly intentional, not debt.
- **API is ready for most gaps.** Almost every missing mobile screen has a live `/v1/*` endpoint + web proxy already built — the gap is mobile UI + (for P0) offline plumbing, not backend.
- **This doc supersedes the scattered gap notes** in `mobile/CLAUDE.md` and the skill files for the parity view; the Enterprise Plan (Doc 15) remains the build plan.

---

*Audit version: 1.0 — 2026-06-25*
