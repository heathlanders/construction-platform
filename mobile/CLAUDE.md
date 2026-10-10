# Mobile Module — Claude Code Context

## Spec docs for this module
@../docs/Platform_Mobile_Spec_v1_0.docx
@../docs/Platform_API_Spec_v1_0.docx
@../docs/Platform_UX_Wireframe_Brief_v1_0.docx
@../docs/Mobile_Enterprise_Plan_v1_0.md

## Enterprise plan (Session 35 — roadmap, not yet built)
Feature-expansion + test strategy in `docs/Mobile_Enterprise_Plan_v1_0.md`. Three workstreams:
**A** role-aware experience (JWT-role gate at nav, per-role tile manifest — 9 roles, field-first),
**B** offline/sync hardening (19/24 screens are API-only today; adopt batch `/v1/sync/*`; **build the
unbuilt T-13/T-14 tiered conflict UI**), **C** full test pyramid (Jest unit incl. i18n key-integrity
test that would've caught the launch crash + Maestro E2E on the server KVM emulator, gating OTA).
4-sprint sequencing. E2E tool = **Maestro**.

## Stack (locked)
- React Native + Expo (managed workflow)
- WatermelonDB (SQLite) for offline storage
- react-i18next for EN + ES
- Expo OTA updates

## Offline-first rules
- Every data operation must work offline
- Sync on reconnect using optimistic locking (version integer on every record)
- Conflict resolution: tiered field policy (see Architecture Section 4.8)
- Side-by-side UI for unresolvable conflicts

## Conflict resolution tiers
- Tier 1 (non-critical fields like notes): last-write-wins
- Tier 2 (financial, schedule): present side-by-side diff to user
- Tier 3 (safety-critical): block until resolved by authorized user

See skill: @../.claude/skills/offline-sync/SKILL.md

## Push notifications
APNs (iOS) + FCM (Android). Token lifecycle managed server-side.
Per-user preference controls. Read/unread state synced.

## Login (2026-06-24 — fixed, all OTA-shipped)
`screens/LoginScreen.tsx` + `lib/auth.ts` + `navigation/AppNavigator.tsx`. Three sequential bugs
that blocked every login (none reached before because earlier crashes died first):
- **`tenant_slug` required.** `POST /v1/auth/login` Zod schema (shared with web) requires
  `email`+`password`+**`tenant_slug`**. LoginScreen sends a **Company ID** field (`tenant_slug`) +
  `platform:'mobile'` (→ 30d JWT). Missing slug → 422 "Request validation failed".
- **No `atob` in Hermes.** `parseJwt()` (`lib/auth.ts`) decodes the JWT payload with a pure-JS
  `decodeBase64` helper — `atob`/`btoa` are undefined on RN ("property atob doesn't exist").
- **`Stack.Navigator` `initialRouteName` is read once at mount** → after `setIsAuthenticated(true)`
  the navigator stays on `Login`. Fixed with `key={isAuthenticated ? 'app':'guest'}` (remounts).
- Brand = **"The Jobsite"** (P-11). `mobileApi` throws `ApiError {status,body,message}`, `message` =
  server `error.message`. See memory `mobile_login_fixes`.

## Auto-ship OTA on push to main (2026-06-25)
JS-only mobile changes ship to prod users automatically. A tracked git **pre-push** hook
(`scripts/hooks/pre-push`, wired via `git config core.hooksPath scripts/hooks`) fires on any push
whose refs include `refs/heads/main` and runs `eas update --branch production` — gated by **both**:
(1) files under `mobile/` changed in the pushed range, and (2) `npx tsc --noEmit` clean in `mobile/`
(known pre-existing `Checkout.tsx` expo-camera errors ignored). Either gate failing **skips the ship
but never blocks the push**; an `eas update` failure also doesn't block the push (re-run manually).
- **One-time setup on a new clone:** `git config core.hooksPath scripts/hooks` (hooksPath is local
  config, not committed; the hook script itself is tracked). Requires `eas-cli` on PATH + EAS auth.
- **Skip a ship:** `SKIP_OTA=1 git push` or `git push --no-verify`.
- **Native dep changes still need a full build** (`scripts/build-and-publish.sh`) — OTA ships JS only.
- Scope is `main` only (per decision): feature-branch pushes don't ship. Ship a feature-branch fix
  manually with `(cd mobile && eas update --branch production)`.

## Project list load fix (2026-06-25)
`screens/ProjectsScreen.tsx` `syncProjects()` read **`res.data`** but `GET /v1/projects` returns
**`{ projects, pagination }`** (`api/src/routes/v1/projects.ts:195`) — so `serverProjects` was
`undefined`, the `for…of` threw, and the blanket `catch {}` swallowed it → **projects table never
populated → empty list → no project detail screens reachable** ("none of the project details
loading"). Fix: `ProjectsListResponse` now `{ projects, pagination? }`, read `res.projects ?? []`,
and the catch now `console.warn`s (was silent — hid the shape drift). `ClockScreen` already read
`.projects` correctly; ProjectsScreen was the lone outlier. **Convention: list endpoints return the
named collection (`{projects}`/`{permits}`/`{roofing_systems}`…), never `{data}` — match the field.**
JS-only → OTA.

## Project nav by server_id + cache prune (2026-06-26)
`ProjectsScreen.tsx` navigated to `ProjectDetail` with **`item.id`** (the WatermelonDB **local** row
id), which `ProjectDetailScreen` forwards as `projectId` to every API-backed child (Tasks, Permits,
Structural, TimeEntry…). So `GET /v1/schedule-tasks?project_id=<local-id>` (and all sibling queries)
matched nothing → **"No tasks yet" on every project** (Permits/Structural/etc. empty too). Fix:
navigate with **`item.server_id`**. **Convention: anything calling the API with a project/record id
passes `server_id`, never the WatermelonDB `Model.id`.** Also added a **prune** to `syncProjects()`:
after the upsert loop, locals whose `server_id` the server no longer returns AND
`sync_status==='synced'` get `is_deleted=true` (server soft-deletes/merges stop lingering; never
touches pending local-only creates) — this is why 6 duplicate "Example Builders — Madison Pilot" rows wouldn't
disappear after a DB cleanup. JS-only → OTA. Commit `e2a817f`. Memory `mobile_project_list_fix`.

## i18n integrity test — first mobile test (2026-06-26)
`mobile/jest.config.js` (node env, `babel-jest`) + `mobile/src/lib/__tests__/i18n.test.ts` — Mobile
Enterprise Plan §C1. Importing `lib/i18n.ts` re-runs its top-level augmentation blocks, so the
flat-vs-nested key bug that crashed the first build at bundle load now fails CI instead of users.
Also asserts EN/ES parity across all 16 namespaces (34 cases, all green). Run: `cd mobile && npx jest`.
Commit `75296f3`. **TODO (Plan §C6):** add `npx jest` as a third gate to the pre-push OTA hook (after `tsc`).

## "What's New" popup (post-login release notes)
Layman's-terms changelog popup shown once per version after login; a Settings toggle disables it.
JS-only → OTA. Pure JS, themed, EN+ES chrome.
- **Data:** `lib/changelog.ts` — `CHANGELOG[]` (newest FIRST: `{version,date,en[],es[]}` layman bullets) +
  `CURRENT_VERSION` (= `CHANGELOG[0].version`, **keep in sync with `app.json` version when you bump it**) +
  per-user last-seen helpers (`get/setLastSeenVersion`, AsyncStorage `whatsnew:lastSeen:{user_id}`) + `bulletsFor(entry, lang)`.
- **UI:** `components/WhatsNewModal.tsx`; chrome via the `whatsnew` i18n ns (EN+ES, in the test's NAMESPACES).
- **Gate (`AppNavigator.tsx` RootNavigator):** on auth, load prefs + last-seen → show if `lastSeen !== CURRENT_VERSION`
  AND `!prefs.hideUpdateMessages`. If disabled, silently mark current seen (re-enabling shows only FUTURE versions).
  Dismiss → `setLastSeenVersion`. Uses `i18n.language` for bullets (note: `AppNavigator` now `import i18n from '../lib/i18n'`, not a bare side-effect import).
- **Disable:** `preferences.ts` `hideUpdateMessages` (default false) + an "Updates" toggle in `SettingsScreen.tsx`.
- **Ship release notes:** prepend a `CHANGELOG` entry (EN+ES bullets) + bump `app.json` `version` to match.

## Role-based navigation, Settings & dark mode (Session 42 — 2026-06-25)
Industry-standard **bottom tab bar** + role-aware tiles + a user Settings surface. Implements
Mobile Enterprise Plan §A. **UX-only gating — the API still enforces every permission.** See skill
@../.claude/skills/mobile-role-nav/SKILL.md and memory `role_based_mobile_nav`.
- **Bottom tabs** (`@react-navigation/bottom-tabs`, pure JS → OTA, no native rebuild): `AppNavigator.tsx`
  = `MainTabs` over `HomeStackNavigator` (the full app stack) + a root Login/Main switch. Tabs:
  **Home 🏠** (all) hosts the whole stack; **Clock ⏱️** (foreman/field_tech); **Timecard 🗓️**
  (PM/accountant/safety_officer); **Alerts 🔔** (all); **Settings ⚙️** (all — Settings is now one tap
  from anywhere). In-app nav stays inside the Home tab's stack, so existing `navigate()` calls are
  unchanged; Clock/Timecard/Notifications/Settings are ALSO registered in the Home stack for the
  Projects quick-strip. `App.tsx` adds `SafeAreaProvider` (tab insets). Reused stack-typed screens
  passed to `Tab.Screen` need `as React.ComponentType`.
- **Manifest** `lib/tileManifest.ts` is the single source of truth: every project tile + global/header
  action with `{key, ns, route, color, icon, allowedRoles (LOWERCASE), scope}` + `hasRole` /
  `tilesForRole` / `headerActionsForRole`. `ProjectDetailScreen` (project grid) + `ProjectsScreen`
  (role quick-strip) render from it. **Permission beats preference by construction**: tiles =
  `tilesForRole(role)` then subtract `hiddenTiles` (a preference can only remove).
- **Role context** `lib/user-context.tsx` (`RoleProvider` + `useCurrentUser()`) reads the JWT user
  ONCE (synchronous role; no per-screen `await getUser()`), and applies the UI language on load
  (`applyLanguage(prefs.language ?? user.preferred_language)` — fixes the old hardcoded `lng:'en'`).
- ⚠️ **JWT role is UPPERCASE** (`OWNER`/`PROJECT_MANAGER`/…) — API `issueToken` does
  `user.role.toUpperCase()` (`api/src/middleware/auth.ts:193`). Manifest `allowedRoles` are
  lowercase, so **`hasRole()` lowercases before comparing** (case-insensitive). ALWAYS gate via
  `hasRole()`. **Bug fixed 2026-06-25:** `hasRole` did an exact compare → UPPERCASE role matched
  nothing → `tilesForRole()` returned `[]` → **clicking a project showed an empty detail (no tiles)**.
  Symptom was "project details empty"; the project LIST still showed (cached). OTA-shipped.
- **Settings** `screens/SettingsScreen.tsx` + `lib/preferences.ts` (`prefs:{user_id}:v1` AsyncStorage):
  show/hide allowed tiles, language EN/ES, appearance System/Light/Dark.
- **Dark mode** `lib/theme.ts` (LIGHT/DARK palettes) + `lib/theme-context.tsx` (`ThemeProvider`/
  `useTheme`, `'system'` follows `useColorScheme`). Only bg/surface/text/border/header tokens swap;
  tile accents + status/severity badges stay literal. Chrome themed; deep screens themed incrementally.
- **Provider order:** `SafeAreaProvider` → `RoleProvider` → `ThemeProvider` → navigator.
- **`components/RoleGate.tsx`** = UX gate (parity with web `role-gate.tsx`).
- **Bugs fixed in passing:** `PermitDetailScreen` + `TaskDetailScreen` compared UPPERCASE role arrays
  to the lowercase JWT role → edit was permanently dead; now use `hasRole()` (lowercase). And the
  i18n `lng:'en'` hardcode that ignored `preferred_language`.

## Timecard for all roles + owner Log Time + startup-spinner guard (2026-06-30)
- **Timecard now shows for every role.** `MyTimecardScreen` is the user's OWN weekly card
  (open/submit) — API allows any authed user. The bottom **Timecard 🗓️** tab renders for all
  (`showTimecard = true` in `AppNavigator` `MainTabs`, was PM/accountant/safety_officer) and
  `nav.timecard` in `tileManifest.ts` lists all 9 roles. `actions.log_time` gained **owner** (API
  `POST /v1/time-entries` = OWNER/PM/FOREMAN/ACCOUNTANT) so an owner can add the entries the card
  sums. **Add entries via the project ⏱️ Log Time tile; the Timecard tab only aggregates them.**
  Approve/reject stays OWNER/PM (web). Skill `mobile-role-nav`.
- ⚠️ **OTA can't cross a native version bump.** Today's `80eb8d1` bumped `app.json` 1.0.0→1.1.0
  (`runtimeVersion.policy:"appVersion"` → runtime 1.1.0) for native deps (doc upload, damage photos).
  A device on the **1.0.0** APK never receives **1.1.0** OTAs no matter how many restarts — it needs
  a one-time reinstall of the 1.1.0 APK from `get.thejobsite.app` (which already hosted it). After
  crossing the native boundary, JS OTAs auto-apply again. Diagnose with `eas build:list` (compare
  installed runtime vs the OTA's runtime) — same-runtime is the precondition for OTA.
- ⚠️ **Startup spinner that never clears = `RoleProvider.refresh()` threw.** Root gate is
  `if (loading)` in `RootNavigator`. `refresh()` had no try/catch/finally → a throw from `getUser()`
  (`SecureStore.getItemAsync` can **throw on a stale Keystore blob after reinstall**, not just return
  null) or `loadPrefs` left `loading=true` forever. Fixed (`lib/user-context.tsx` + `lib/auth.ts`):
  `refresh()` is try/catch/**finally**(setLoading(false)); `getUser()` catches SecureStore-read +
  JSON.parse failures → `clearAuth()` + null. **Convention: the startup auth gate must always clear
  `loading`.** User-side instant unblock for a pre-fix build: Android → Apps → The Jobsite → Storage →
  **Clear data** (drops the bad blob → login screen).

## Unified Time hub (Session 43 — 2026-06-30)
One **Time ⏱️ bottom tab** for all roles (`screens/TimeHubScreen.tsx`) — replaces the old separate
Clock + Timecard tabs and the fragmented "add hours is buried in a project tile" flow. Reads
`GET /v1/settings/org` and adapts to `tenant_settings.time_tracking_mode`:
- **clock_in_out:** punch in/out card (live elapsed, project picker, switch project, today's punches).
- **manual:** **"Add Hours"** modal with TWO tabs — **Single Day** (date+hours) and **Whole Week**
  (Mon–Sun grid → one `time_entry` per day with hours). Offline-first (WatermelonDB→POST, same pattern
  as `TimeEntryScreen`), required project + optional cost-code/budget-line/rate/notes pickers.
- Both modes: week bar grid + weekly **Timecard** card (open/submit FSM, total/OT, history).
- **Owner mode toggle** in `SettingsScreen` (owner-only segmented Manual / Clock In-Out → `PATCH
  /settings/org`, 409 re-fetch+retry-once). Non-owners never see it.
- `AppNavigator`: single `TimeTab` (was Clock+Timecard tabs); `ClockScreen`/`MyTimecardScreen` stay
  registered in HomeStack for project deep links. `TimeHub` in `RootStackParamList`. Removed unused
  `hasRole` import from AppNavigator.
- i18n: `common.nav.time`, `field.time_hub.*`, `settings.time_tracking`/`mode_*` (EN+ES). Reuses
  existing `field.timecards.*` + `field.time_punches.*`. tsc clean; 46 i18n parity tests pass.
- Shipped OTA to production (runtime 1.1.0) on merge to main, commit `3614904`.

## Employee time guardrails + calendar picker + enterprise clock (Sessions 43–44)
- **Employee guardrails (`feat/time-employee-guardrails`, 2026-06-30):** Add-Hours (Time hub +
  `TimeEntryScreen`) stripped to **date + hours + optional project + notes** — **no rate / cost-code /
  budget** (rate is admin-set in `user_payroll_settings`, resolved server-side). Hub capture actions
  **role-gated** (`hasRole`): clock = worker roles, add = time-entry write roles. Web `users/new` gained
  an owner-only Payroll section (rate/employment/pay-frequency → `POST /v1/users`). Migration 0024
  made `time_entries.project_id` nullable. i18n `time_hub.project_optional`/`no_project`.
- **Calendar date picker (`feat/time-hub-date-picker`):** `components/CalendarPicker.tsx` — pure-JS
  month grid (‹ prev/next ›, Today, localized labels, themed; **no native dep → OTA**). Replaces the
  free-text `YYYY-MM-DD` field in Add-Hours (Day tab) + `TimeEntryScreen`.
- **Enterprise clock in/out (`feat/enterprise-clock-punches`, Session 44):** `components/PunchEditor.tsx`
  — pure-JS add/edit/delete a punch: date (CalendarPicker) + start/end **time stepper** + optional
  project + live duration; delete in edit mode. Wired into the Time hub clock section ("＋ Add time"
  + tap a closed punch to correct). Multiple in/out per day now total correctly (backend recompute).
  i18n `field.punch.*` (EN+ES). All OTA-shipped (runtime 1.1.0). Backend: see `api/CLAUDE.md`
  time-punches + skill `time-tracking`.

## i18n
All user-facing strings via react-i18next keys.
Safety content: professional translation required, no machine translation.
Locale resolution: user setting → device locale → EN fallback.
See skill: @../.claude/skills/i18n/SKILL.md

⚠️ **`lib/i18n.ts` flat-vs-nested key gotcha** (caused the first-build launch crash, 2026-06-20):
the `projects` namespace mixes a real nested `nav:{}` object with **flat dotted `'actions.*'` keys**
(`'actions.log_time'`, `'actions.permits'`…). When augmenting after the literal, write
`(resources.en as any).projects['actions.x'] = …` — NOT `.projects.actions.x = …` (`projects.actions`
is `undefined`, so the dotted form throws `TypeError: Cannot set property … of undefined` at **bundle
load**, before React mounts → ErrorBoundary can't catch it and `expo export` won't flag it). `common.nav.x`
IS safe (`common.nav` is a real object).

## Debugging native/launch crashes — local emulator (no phone needed)
A headless Android emulator runs on the server (KVM) — captures real `logcat` FATAL for any crash,
including JS errors thrown at bundle load that die below the JS ErrorBoundary. See memory
[[mobile_apk_distribution]] "NEW capability". Quick path: **`scripts/run-emu-capture.sh`** (tracked in
the repo; `/home/user/run-emu-capture.sh` is the working copy) boots an x86 API-30 AVD, installs the
published APK, dumps `/tmp/crash-full.log`. JS-only fixes verify via `eas update --branch production`
+ relaunch on the emulator (no 15-min rebuild). One-time setup needs `sudo chmod 666 /dev/kvm`
(user not in `kvm` group).
- ⚠️ **Symptom "hangs at `=== wait for device ===`" is almost always the HOST DISK, not the
  emulator.** The AVD's default userdata partition is ~7.4GB; when the root disk is tight the boot
  dies with `FATAL | Not enough space to create userdata partition` in **`/tmp/emu.log`** (the run
  log shows nothing — the script is just blocked in `adb wait-for-device`). **Always read
  `/tmp/emu.log` first.** Fixed 2026-07-25 by passing **`-partition-size 2048`** (2GB is plenty for
  one APK) so a tight disk can't kill the harness. Reclaim space with `docker builder prune -f`,
  `docker image prune -f`, `rm -rf ~/.npm/_cacache ~/.cache/{pip,uv}` — do **not** `docker volume
  prune` (other projects' DB data). See memory `server_disk_pressure`.
- **Applying an OTA takes TWO launches** (`fallbackToCacheTimeout: 0` → the running launch uses the
  cached bundle and the freshly-downloaded one starts on the NEXT launch). Force-stop + relaunch
  twice before judging a JS fix.
- **A WatermelonDB migration is visible in logcat** — the 2026-07-25 v3 verification showed
  `[🍉] [SQLite] Database needs migrations` → `Migrating from version 2 to 3...` → `Migration
  successful`. If you instead see an unsafe reset, the migration step is missing (see §Offline read
  cache).

## Maestro E2E (Enterprise Plan §C3/§C4 — first flows green 2026-07-27)
`mobile/.maestro/` runs against the **installed APK** on the KVM emulator, hitting the real API
(`api.thejobsite.app` → this box's Docker stack). Setup + notes: `mobile/.maestro/README.md`.
- **Test accounts:** `api/src/scripts/seed-e2e-tenant.ts` (§C4) — tenant `e2e-test`, one user per
  role, shared password, **idempotent** (re-running resets passwords so a run never fails on drift).
  ⚠️ Tenant-scoped inserts go through `withTenantContext()` — a bare `pgPool` insert dies with
  `unrecognized configuration parameter "app.current_tenant_id"` (RLS policy evaluation).
- **Flows:** `login.yaml` (the flow that broke three separate times), `project-tiles.yaml`
  (guards the `hasRole()` UPPERCASE-vs-lowercase regression that blanked every tile grid), and the
  **offline→reconnect→sync** trio driven by `run-offline-sync.sh`.
- **Offline round-trip** (`run-offline-sync.sh` → login → `offline-log-time` → `verify-time-synced`):
  Maestro can't toggle a radio, so the harness owns the flip and the flows split around it. The
  assertion is on a **server-rendered** row (Today's Entries reads `GET /v1/time-entries`), so it can
  only pass if the batch push delivered a record created with no network. Hours are **randomised per
  run** — a fixed value lets a second same-day run pass on the first run's entry.
  - ⚠️ A flow-level `env:` default **silently wins over `-e`** — the two parameterised flows
    deliberately carry no default and require the harness.
  - ⚠️ Reconnect needs a real reachability poll, not a sleep: a sweep firing while Wi-Fi is still
    re-associating just fails and waits out the next 3-min interval, which reads as "sync is broken."
- **Conflict round-trip** (`run-conflict-resolve.sh`, 2026-07-27): the harness plays the SECOND
  writer — it PATCHes the same inspection through the API while the device sits offline holding a
  stale version — then the flow asserts badge → inbox → side-by-side → apply → empty inbox. Poking
  the local DB to fake a conflict would test the resolve UI without testing what produces its input.
  Verified through to the DB: the worker's "Keep Mine" value is what persists.
- 🐞 **Three bugs from that one flow**, all silent: (1) list screens used a bare `.observe()`, which
  never fires on a FIELD edit — tapping a status closed the sheet and left the card unchanged, and
  the `•` pending marker never appeared (now `observeWithColumns`, jest-guarded); (2) `ConflictBadge`
  named three models, so `inspections` conflicts had no badge and sat unresolvable forever (now
  registry-driven); (3) the resolve PATCH sends EVERY registry field, so absent ones go as `null` —
  `notes` was `.optional()` without `.nullable()` and 422'd, making T-14 unusable for any record
  without notes (`api/src/test/conflict-resolve-payload.test.ts` pins the real wire shape).
- 🐞 **What it found on its first honest run:** the Time hub asked for `limit=200` on a route capped
  at **100** (T-01) → 422 → `.catch(() => ({ time_entries: [] }))` → the week grid and Today's
  Entries were **permanently empty for every manual-mode worker**. Ten more callers had the same
  shape (web cert list + user dropdown, JSA attendees, project members, vendor + cost-code pickers,
  web clock punches) — each silently empty, no error anywhere. All clamped;
  `api/src/test/list-limit-callers.test.ts` now parses every route's Zod ceiling and fails any caller
  that exceeds it. **An empty list is the default failure mode of an over-limit fetch — don't read
  an empty screen as "no data."**
- ⚠️ **Select inputs by PLACEHOLDER text** (`your-company`, `Email`, `Password`) — RN renders those
  as real text nodes. A coordinate tap silently typed the email into the company field and every
  step still reported COMPLETED; only the final assert caught it.
- ⚠️ **`clearState` also wipes the What's-New last-seen marker**, so a fresh login always lands on
  the release-notes popup before the app. Flows dismiss `Got it` (optional) first.
- `run-emu-capture.sh` recreates the AVD each run → the app initialises at the CURRENT schema
  version, so a fresh-install E2E does NOT exercise a migration (see the migrations jest guard).
- **Post-ship smoke, not a pre-push gate** (§C6): `scripts/mobile-e2e-smoke.sh`, run by the hook when
  `RUN_E2E=1` **after** a successful `eas update`. Gating BEFORE the ship would be theatre — the
  emulator runs whatever the production channel last served, so a pre-ship run verifies the bundle
  you're replacing. Ship, then verify what shipped; if red, republish the last good update
  (`eas update:republish --group <id>`). Hook gates stay tsc + jest.
- ✅ Verified green against the shipped bundle 2026-07-27 (login + project-tiles + offline round-trip).

⚠️ **API URL is baked into the JS bundle at build time** (`api.ts`: `process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'`).
`.env` (`EXPO_PUBLIC_API_URL=https://api.thejobsite.app`) is gitignored → **not uploaded to EAS cloud builds**,
so a cloud-built APK can bake the localhost fallback. The local `expo export` / `eas update` bundle DOES read
`.env`, so OTA updates carry the correct origin. Fix properly: add an `env` block to `eas.json` build profiles
so cloud builds get the production URL too.

## Time tracking (Sessions 22–26)
- `screens/TimeEntryScreen.tsx` — offline-first (one of the 6 offline-**write** WatermelonDB screens). `models/TimeEntry.ts` carries `server_id`/`version`/`sync_status`/`is_deleted` + entry fields incl. `cost_code_id`/`budget_line_item_id`.
- Sync via `lib/sync.ts`: time entries ride the **batch protocol** (see §Batch sync below) — one `POST /v1/sync/push` + one `GET /v1/sync/pull` per sweep, Tier-2 conflicts still route to the resolve screen (Gap D). `runSyncSweep()` runs on AppState→active **and** a 3-min foreground `setInterval` (AppNavigator). **Deferred:** OS background sync (`expo-background-fetch`/`expo-task-manager` = native module + EAS rebuild, not OTA-shippable). Server `sync.ts` `time_entries` pull/pushCols carry `hourly_rate_cents`+`budget_line_item_id` (parity; test `api/src/test/sync-time-entries.test.ts`).
- i18n: `field` namespace (EN + ES complete).
- Cost-code / budget-line pickers: `TimeEntryScreen.tsx` now has offline-aware Modal pickers (fetch `/cost-codes` + `/budget-line-items?project_id=` on mount, cache per tenant/project in AsyncStorage `opt:cost_codes:*` / `opt:budget_lines:*`, fall back to cache when offline). Selection sets `cost_code_id`/`budget_line_item_id` on the WatermelonDB record → the batch push already carries them. Field time is now cost-codable from mobile (Gap B done).
- `screens/ClockScreen.tsx` — clock in/out for `clock_in_out` mode tenants: active-punch card + live elapsed, project picker, switch-project, today + week summary. POSTs `/time-punches/clock-in|clock-out` directly (timestamp accuracy). API-only/online. Reached from the Projects header ⏱️ button. (Gap C: filled in its previously-undefined `time_punches.*` i18n keys + fixed a `tc('common.x')` double-prefix that rendered raw keys.)
- `screens/MyTimecardScreen.tsx` — worker's own weekly timecard (mirrors web `/timecards/my`): opens the current ISO week (`POST /timecards` → auto-sums total+OT from `time_entries`), submits for approval (`POST /timecards/:id/submit`, FSM T-60), shows rejection note + reopen, and a recent-card history with status badges. Approve/reject stay web-only (office roles). API-only/online. Reached from the Projects header 🗓️ button. `field.timecards.*` + `common.nav.timecard` i18n (EN+ES). Registered in `AppNavigator.tsx` (`Timecard`). (Gap C done.)
- T-13/T-14 Tier-2 conflict UI (Gap D done): a `version_conflict` on a time-entry push marks the record `sync_status='conflict'` and stashes the returned `server_record` (AsyncStorage `conflict:time_entries:*` via `lib/conflicts.ts`). `screens/ConflictResolveScreen.tsx` renders local vs server **field by field** (for time entries: hours/rate/cost-code/budget-line/notes); worker picks Keep Mine / Use Server per differing field, **all differing fields required** before apply (T-14); resolve re-PATCHes at the server version, re-conflict re-stashes. Since 2026-07-27 that ONE screen is **registry-driven** and serves every conflict-capable table (§Registry-driven conflict resolve). `screens/ConflictsScreen.tsx` = inbox; `components/ConflictBadge.tsx` = reactive ⚠️ header badge (`observeCount`, hidden at 0). `lib/api.ts` throws `ApiError {status, body}` so callers can branch on 409. i18n `field.conflicts.*` + `common.nav.conflicts` (EN+ES). Nav: `Conflicts`, `ConflictResolve`.
- **Sync correctness fix (P0-1/P0-2, plan `docs/Mobile_Bugfix_Plan_v1_0.md`):** `tsconfig.json` now sets `experimentalDecorators` (WatermelonDB legacy decorators — mobile `tsc` 171→18). The then-current per-record sweeps + `pullProjects` were converted from **camelCase no-op accessors** (which wrote/read the wrong props at runtime — `r.serverId` left `server_id` empty → `pullProjects` re-created duplicate projects every pull; daily/punch/safety POSTed `undefined` required fields → 422 → stuck `pending`) to **snake_case** (the batch registry that replaced them is snake_case throughout). `SafetyIncident` model de-camelCased (its `syncStatus` `@field` collided with WatermelonDB's built-in `Model.syncStatus`); `SafetyIncidentScreen`/`PunchListScreen` updated to match (PunchListScreen also: named import, `JSON.stringify` body, dropped non-existent `assigned_to`). **Convention: all WatermelonDB models + access use snake_case** (matches `@field` column names, avoids the reserved-accessor collision).
- GAPS: punch + timecard screens are online-only (not in the offline WatermelonDB set); WatermelonDB **write** coverage is 6 tables (the original 5 + `inspections` since 2026-07-27; `safety_certifications` stays a read cache; jsa_records etc. remain API-only — Mobile Enterprise Plan §B1). (Resolved since: the registry-driven Tier-2/3 resolve screen covers punch + safety + inspections; daily-report `conditions`↔server `weather.conditions` is mapped in the batch push/pull — plan P2-8.)
- See skill: @../.claude/skills/time-tracking/SKILL.md

## Batch sync over `/v1/sync/*` (2026-07-24 — Enterprise Plan §B2)
`lib/sync.ts` rewritten around a **table registry** (`push` mapper / `applyPull` applier / conflict
`tier` / `stash` per table). One `POST /v1/sync/push` **and** one `GET /v1/sync/pull` per sweep for
ALL offline tables — replaces `sweepTimeEntries`/`sweepDailyReports`/`sweepPunchListItems`/
`sweepSafetyIncidents` and `pullTimeEntries`/`pullDailyReports`/`pullProjects` (all removed).
- **The "shared-id rework" blocker was wrong.** The server accepts a **client-minted `id`** on create
  and inserts `ON CONFLICT (id) DO NOTHING`, so the client mints `server_id` **before the first push**
  → creates are idempotent (a retry after a dropped response can't duplicate a row) and the dual-id
  model (`Model.id` local + `server_id`) stays. `lib/uuid.ts` = **pure-JS uuid v4** — Hermes has no
  `crypto.randomUUID`/`getRandomValues` (same gap class as the missing `atob`) and `expo-crypto` is a
  **native** dep → would break OTA. Row ids only, not crypto-grade.
- `lib/sync-payload.ts` = pure/testable (no WatermelonDB, no fetch, no AsyncStorage):
  `buildPushPayload()` folds every table's pending rows into one payload + an index keyed
  `table:server_id`, `indexConflicts()`, `conflictKey()`, `nextLocalVersion()`.
  Classification: never-synced → `created`; locally deleted **and** previously synced → `deleted`;
  else → `updated` (carries `version`, T-12). A never-synced local delete is dropped.
- **Local deletes now propagate** — the old sweeps `continue`d on `is_deleted`, so a local delete
  never reached the server.
- **Version mirroring:** on an accepted update the local `version` takes the server's `+1`, so the
  next push isn't stale before the pull heals it.
- **Conflict routing by tier (T-13):** tier 1 `daily_reports` = last-write-wins (adopt the server
  version + ONE immediate retry inside the same sweep); tier 2 `time_entries`/`punch_list_items`/
  `inspections` and tier 3 `safety_incidents` = stash the server row (`saveConflictFor(table, …)`) +
  `sync_status='conflict'` for the registry-driven resolve screen. New **`forbidden`** outcome (server rejected on ownership, returns **no** `server_record`)
  is parked in an in-memory `refused` set for the session — retrying can never succeed. Cleared on
  restart.
- **Pull:** single cursor `sync:lastPulledAt:v2` covering every offline table incl. `projects`;
  T-12-guarded, skips `pending`/`conflict` locals; a failed table apply logs, keeps the sweep alive,
  and does **not** advance the cursor.
- **`PULL_ONLY_TABLES`** (`projects` + `safety_certifications` + `company_assets`) are in
  `PULL_TABLES` but NOT `PUSH_TABLES` — read caches, `push: () => ({})`. Registry split today =
  **5 push** (`time_entries`, `daily_reports`, `punch_list_items`, `safety_incidents`, `inspections`)
  **+ 3 pull-only** = 8 tables. See §Offline read cache below.
- The AsyncStorage upload queues (fuel logs / asset inspections / documents / status / task photos /
  damage reports) are a **separate mechanism** — six distinct queues drained alongside the batch
  push/pull in the same sweep, all now sharing one implementation + retry policy (see
  §Unified offline upload queue).
- Tests: `src/lib/__tests__/sync-payload.test.ts` (classification, undefined-vs-null, cross-table
  index keying, conflict routing, version mirroring, uuid shape) — mobile jest **51 → 67**.
- Still deferred: OS background sync (`expo-task-manager` = native module → EAS build, not OTA) and
  expanding WatermelonDB **write** coverage beyond the 6 push tables (§B1; `safety_certifications`
  is a read-only cache — see below).

## Offline read cache + schema migrations (2026-07-25 / 2026-07-27 — Enterprise Plan §B1)
Two dead-with-no-signal field screens now render from WatermelonDB. Shipped as a **read cache** —
pulled, never pushed. `inspections` has since graduated to offline WRITES (2026-07-27, see below);
`safety_certifications` is still read-only.
- **Schema v3** (`lib/schema.ts`) adds `inspections` + `safety_certifications` (snake_case columns,
  same `server_id`/`version`/`sync_status`/`synced_at`/`is_deleted` envelope as the write tables) +
  models `models/{Inspection,SafetyCertification}.ts`, registered in `lib/database.ts`.
- ⚠️ **FIRST migrations file `lib/migrations.ts`** (`schemaMigrations` + `createTable` steps for v3),
  now passed to `SQLiteAdapter`. **A schema version bump WITHOUT a migration makes WatermelonDB
  UNSAFE-RESET the local DB — silently destroying a field worker's unsynced `pending` rows. Every
  future `schema.ts` version bump MUST add a step here.** History: the schema shipped at v2 with no
  migrations file, so every live install sits at v2; v3 is the first real migration.
- `lib/sync.ts` `PULL_ONLY_TABLES` = `projects` + **`safety_certifications`** (`push: () => ({})`);
  `PULL_TABLES = [...PULL_ONLY_TABLES, ...PUSH_TABLES]`. Certs stay read-only **on purpose**: issuing
  a cert offline is a compliance record nobody in the field is waiting on, and there's no capture
  screen worth the write path. (Both tables shipped read-only because a Tier-2 conflict had no
  resolve screen — that blocker is gone, see §Registry-driven conflict resolve.)
- `InspectionsScreen` + `SafetyCertScreen` render from a reactive local `.observe()` query
  (`Q.where('is_deleted', false)`, mapped to `server_id` — never `Model.id`); pull-to-refresh runs
  ONE batched `pullAll()`. `SafetyCertScreen` also caches the org roster in AsyncStorage
  `opt:users:roster` (worker names aren't on the cert row) — same pattern as the cost-code /
  budget-line pickers.
- Server parity: `api/src/routes/v1/sync.ts` `inspections` pull/pushCols gained `inspector_name` +
  `trade_type` (matches `POST /v1/inspections`).

### Asset yard cache — `company_assets` (2026-07-27, schema v4)
The last §B1 P0. The asset **capture queues** (fuel logs, asset inspections, damage reports) had
queued offline for a while — but they were **unreachable in the field**: mobile has **no asset LIST
screen**, so the only entry point is the QR scan in `screens/assets/Checkout.tsx`, and that scan had
to hit the API to turn a scanned `asset_number` into an asset. No signal → no asset → no capture.
Caching the asset row is what actually turned those queues on.
- **Schema v4** + a `createTable` step in `lib/migrations.ts` + `models/CompanyAsset.ts` +
  a **pull-only** `companyAssets` entry in the `lib/sync.ts` registry (`push: () => ({})`, tier 1).
- `Checkout.tsx` `findCachedAsset(assetNumber)` — on API failure the scan resolves from the local
  cache (`Q.where('asset_number', …)`, `Q.where('is_deleted', false)`, mapped to `server_id` — never
  `Model.id`) and sets `offlineAsset`.
- ⚠️ **Checkout / check-in stay ONLINE-ONLY by design.** When the asset came from the cache both
  buttons are `disabled` with a warning notice (`common.assets.offline_checkout_blocked`, EN+ES):
  **T-57 operator-cert enforcement is server-side**, and letting a worker believe they checked out a
  machine they aren't certified for is worse than asking them to reconnect. The pulled row does carry
  `requires_operator_cert` + `required_cert_type` so the UI can warn *before* an attempt — that's a
  hint, not the gate.
- Server side: `company_assets` is the first **`readOnly: true`** entry in `SYNC_TABLES` — pulled,
  never pushed (see `api/CLAUDE.md`). Business+ (T-56) is a **feature** gate, not a data gate — a
  lower-tier tenant just has no rows to pull.

## Trade screen (electrical/plumbing) offline (2026-07-28 — Plan §B1)
`TradeScreen` was API-only, so both tabs were blank in a house with no signal — which is where an
electrician actually stands. Now: `electrical_panels` + `plumbing_systems` are pull-only caches,
`electrical_circuits` + `plumbing_fixtures` are offline WRITE tables (schema **v9**, tier 2), and
both tabs render from WatermelonDB.
- **The status flip moved off the upload queue onto the sync path.** It used to PATCH directly and
  fall back to `enqueueStatusUpdate` — where a 409 counts as a *server verdict* and the edit is
  DROPPED (dead-lettered at best). On the sync path the same 409 becomes a resolvable conflict in
  the shared inbox. Same user gesture, opposite outcome when two people touch one circuit.
- Parent/child split as everywhere else: a panel is designed, a circuit's status is field progress.

## Structural screen fully offline (2026-07-28 — Plan §B1)
All three tabs now render from the local cache, and each has its field capture:
- **Roofing QA** (`RoofingQaScreen`, `roofing_qa_records` tier 2) — dry-in, seam welds, fastener
  pulls are checked ON the roof. Only the pull-out test carries a load value, so the unit (`lbf`)
  is attached for that type alone.
- **Framing corrections** (`FramingCorrectionsScreen`, `framing_correction_items` tier 2) — raised
  AND cleared at the wall. Tapping a row opens the status sheet, because *clearing* is the field
  action; creating is behind the FAB.
- `roofing_systems` + `framing_inspections` join `concrete_pours`/`permits` as pull-only caches
  (`readOnly` server-side; a pushed parent is ignored — tested).
- Schema **v8**. ⚠️ Same trap as concrete twice over: caching the parents without pointing the tabs
  at them would have left both dead offline — all three lists now read from WatermelonDB.

## Concrete QA tests, offline (2026-07-28 — Plan §B1 / parity P1)
`screens/ConcreteTestsScreen.tsx` — ACI test records per pour (slump / air / temperature /
cylinder break), reached from the 🧪 link on a pour card in `StructuralScreen`.
- Slump, air and temperature are measured **while the truck is at the pour**; a measurement you
  couldn't write down gets re-taken or invented later. `concrete_test_records` is an offline WRITE
  table (schema **v7**, tier 2 — a conflict is two people disagreeing about a measurement).
  `concrete_pours` rides along as a pull-only cache (scheduling a pour is an office act, and the
  tests need something to hang off; a client-pushed pour is ignored — tested).
- **The unit is implied by the test type** (`in`/`pct`/`F`/`psi`) rather than typed — asking for it
  is a chance to get it wrong. Age-in-days only shows for cylinder breaks.
- Mirrors the server's auto pass/fail for cylinder breaks (measured ≥ specified); every other type
  stays `pending` rather than being silently graded on the device.
- ⚠️ pg returns NUMERIC as a **string**, so `applyPull` runs `Number()` — the local column rejects
  the raw value otherwise.
- ⚠️ **Caching a table isn't the same as reaching it.** The pours were cached but `StructuralScreen`
  still fetched them from the API, so offline the Concrete tab said "Nothing recorded yet" and the
  🧪 link — the only way into the capture — didn't exist. Identical shape to the asset yard. The
  concrete tab now renders from the local cache; roofing/framing are still API-only.

## Permits + AHJ inspection results, offline (2026-07-28 — Plan §B1)
An AHJ inspection is witnessed standing at the work with the inspector — the one moment you can
least count on a signal — and both permit screens were API-only, so the whole surface was dead
exactly when it was needed.
- **`permits` is a pull-only read cache** (schema **v6**, `readOnly: true` server-side). Permit
  lifecycle (submit/approve/void) stays office-side: it carries tier gates (T-55) and jurisdiction
  resolution (T-59), neither of which belongs on a phone.
- **The writable half is the inspection result.** `inspections` (already a Tier-2 offline write table)
  gained `permit_id`/`inspection_type`/`sequence_order`/`result`/`correction_notice`. `result` +
  `correction_notice` are pushable; the other three are **pull-only on the server** so a phone can't
  re-parent a milestone onto another permit or reorder an AHJ sequence (mutation-checked test).
- `PermitDetailScreen` writes the result locally (`pending`, `•` marker) and lets the batch push
  carry it; a 409 lands in the shared conflict inbox instead of an alert the worker can only dismiss.
  It mirrors the API's result→status derivation locally (pass→passed, fail→failed,
  partial→requires_action) — otherwise the status dot lies until the next pull.
- E2E `.maestro/run-permit-result-offline.sh` (foreman; prime the cache online → radio off → record
  → reconnect → the API confirms `result`+`status`). ✅ green 2026-07-28. Seeded permit +
  3 AHJ milestones come from `seed-e2e-tenant.ts`.

## JSA capture, offline (2026-07-28 — Plan §B1 / parity P1)
`screens/JSAScreen.tsx` — job safety analysis: list + capture (attendees, hazards with severity +
controls), **offline-first**. A JSA is the pre-task hazard briefing run standing on the site, so it's
the record most likely to be created with no signal; mobile had no JSA surface at all, which left the
**Safety Officer — a P0 mobile role — unable to produce their core artifact**.
- Schema **v5** + a `createTable` migration step + `models/JsaRecord.ts` + a `PUSH_TABLES` entry at
  **tier 3** (same treatment as safety incidents: a conflict waits for an authorized resolver) +
  a `CONFLICT_TABLES` entry. Tile `actions.jsa` (owner/PM/safety_officer/foreman — a field tech
  doesn't run the briefing). i18n ns `jsa` EN+ES (chrome only; hazard/control text is user data).
- **A JSA with zero hazards is refused** — that's a signature sheet, not a hazard analysis.
- ⚠️ **JSONB on the batch path:** `attendees`/`hazards` are JSONB server-side and JSON TEXT locally
  (SQLite has no JSON type), parsed at the sync boundary. That surfaced a live landmine — the push
  binds values raw and **node-pg turns a JS ARRAY into a Postgres array literal** (`{...}`) that
  `jsonb` rejects. `daily_reports.weather` only ever worked because it's an object. Fixed with
  `jsonCols` on `SyncTableConfig` (server stringifies); `api/src/test/sync-time-entries.test.ts`
  fails without it.
- E2E: `.maestro/run-jsa-offline.sh` (safety officer, radio off → capture → reconnect → the API
  confirms hazards + attendees survived the round trip). ✅ green 2026-07-28; the same run verified
  the **v4 → v5 migration on a device with existing data** (`Migrating from version 4 to 5…
  Migration successful` in logcat) — something a fresh-install E2E can never exercise.
- ⚠️ Long forms: the submit button sits below the fold, so the flow must `scrollUntilVisible` before
  tapping it. A `tapOn` that can't find its target fails the step rather than scrolling for you.

## Registry-driven conflict resolve + inspections offline writes (2026-07-27 — Plan §B3 + §B1)
Adding a conflict path used to mean another ~220-line resolve screen — which is exactly why the
schema-v3 tables shipped read-only (a Tier-2 conflict with no screen is an invisible, permanently
stuck row). Now it's a registry entry. JS-only → OTA.
- **`lib/conflict-registry.ts`** declares every conflict-capable table:
  `{table, endpoint, responseKey, tier (2|3), resolveRoles?, titleKey, labelKey, fields[{key,labelKey,kind?}]}`
  for `time_entries`, `punch_list_items`, `safety_incidents` (tier 3, `resolveRoles`
  owner/safety_officer) and `inspections` (tier 2). Same module holds the **pure** helpers `norm`,
  `displayValue`, `differingFields`, `mergeChoices`, `allResolved` (the T-14 gate) and `canResolve`
  (tier-3 role gate — **lowercases the UPPERCASE JWT role**, same trap as `hasRole`).
- **ONE `ConflictResolveScreen`** drives every table from that registry; route is now
  `ConflictResolve: { localId: string; table: string }`. `PunchConflictResolveScreen.tsx` +
  `SafetyConflictResolveScreen.tsx` are **DELETED** (−444 lines) along with their routes.
  `ConflictsScreen` enumerates `CONFLICT_TABLES` instead of three hard-coded kinds (tier-3 rows sort
  first; a table missing from the local schema is skipped).
- **`lib/conflicts.ts` is generic**: `saveConflictFor/getConflictFor/clearConflictFor(table, localId, …)`,
  key `conflict:{table}:{localId}` — ⚠️ the SAME key format the three per-table stores used, so
  snapshots already stashed on a device still resolve. The per-table exports + typed record
  interfaces are gone; `lib/sync.ts` dropped the per-table `stash` member from `TableDef`.
- **`inspections` graduated to `PUSH_TABLES` (tier 2).** `InspectionsScreen` create + status change
  write locally as `sync_status='pending'` (row shows a `•` pending marker) and ride the batch push;
  a 409 lands in the shared inbox instead of an inline alert. Offline-write tables = 6.
- i18n: `field.conflicts.*` gained `kind_time_entry`/`kind_punch`/`kind_safety`/`kind_inspection`,
  `field_date`, `field_inspector`, `safety_blocked` (EN+ES).
- Tests: `lib/__tests__/conflict-registry.test.ts` — registry shape, tier-3 gate case-insensitivity,
  `''`-vs-`null` non-difference, T-14 all-fields-resolved gate. Mobile jest **79 → 90**. tsc clean.
- Adding a table = a `CONFLICT_TABLES` entry + its `field.conflicts.*` keys in both locales (+ a
  `tier` and `PUSH_TABLES` membership in `lib/sync.ts` if it should write offline). No new screen.

## Unified offline upload queue (2026-07-25 — Enterprise Plan §B4)
Six capture surfaces (task QA photos, project documents, asset inspections / fuel logs / damage
reports, trade status PATCHes) each hand-rolled the same AsyncStorage read-json / push / write-json
+ flush loop with slightly different rules. They're still **six queues** (one key each, drained in
`runSyncSweep` as before) but now share ONE implementation and ONE retry policy. **Not** the
WatermelonDB batch sync — a different mechanism riding the same sweep.
- `lib/queue-policy.ts` — **pure, unit-tested** (no AsyncStorage, no fetch): `QueueEnvelope<T>
  {item, attempts, next_at}`, `MAX_ATTEMPTS = 6`, `backoffMs(attempts, rand?)` (×2 from 30s, capped
  5 min, ±20% jitter — mirrors the API's T-21 integration-retry shape; `rand` injectable so tests
  are deterministic), `isNetworkError`, `decideRetry`, `normalizeQueue`, `partitionDue`.
- `lib/offline-queue.ts` — the thin AsyncStorage layer: `QUEUE_KEYS`, `enqueue(key, item, {sameAs})`,
  `flushQueue(key, processor, {retryServerErrors})`, `queueDepth`, `totalQueueDepth`. A processor
  that **throws means "not done"**; `sameAs` collapses supersedable items (the status queue keeps
  only the latest status per record).
- **Two real defects the duplication was hiding.** (1) **No attempt cap** — a permanently-failing
  item retried on every 3-min sweep forever; now backoff + a 6-attempt cap, then dropped with a
  `console.warn`. (2) **Retryable-vs-final was decided by string-matching the error message** — now
  an `ApiError` with a numeric `status` means the server actually replied → a verdict → drop
  (retrying can't change it); only a connectivity failure retries.
- **`retryServerErrors`** opts back in where a server error genuinely IS "come back later" — only
  `photo-queue.ts`, whose attach 409s `FILE_NOT_READY` until the virus scan promotes the file
  (its inner `attachWithRetry` now **throws** after ~18s instead of returning false). The cap still
  applies.
- ⚠️ **Queue keys are UNCHANGED** from the per-screen versions, and `normalizeQueue` **wraps** legacy
  un-enveloped items rather than dropping them — live installs hold plain items written by the old
  queues, and discarding them would lose a field worker's captured photos. Keep both properties on
  any future change.
- `components/PendingUploadsBadge.tsx` — ⬆️ N in the Projects header (next to `ConflictBadge` in
  `AppNavigator`); queue depth was previously **invisible** (`ConflictBadge` only covers WatermelonDB
  conflicts). Polls `totalQueueDepth()` every 15s — AsyncStorage has no change stream and the queues
  only move on a sweep — tap forces `runSyncSweep()`. i18n `common.nav.pending_uploads` (EN+ES,
  interpolates `{{count}}`; `common.nav` is a real nested object → safe to extend).
- Tests: `src/lib/__tests__/queue-policy.test.ts` — mobile jest **67 → 79**. The suite caught a live
  gap: the retry regex missed RN's "The operation timed out".

## Project tasks — detail + work steps + QA photos (Session 41)
- `screens/TaskListScreen.tsx` — project schedule tasks grouped by phase (API-only read), status dot; reached via the **Tasks** tile on ProjectDetailScreen. Tap → `TaskDetail`.
- `screens/TaskDetailScreen.tsx` — task summary + **Work Steps** (laborer-facing, read-only: instruction + code refs + gating inspection + tools/materials/safety/qa) + **Codes & Compliance** (task-scoped) + **QA Photos** (capture+upload; offline capture queues via `enqueueTaskPhoto`) + dependencies. OWNER/PM can set status/% (PATCH + optimistic lock, 409 prompt — mirrors PermitDetailScreen). All from `GET /v1/schedule-tasks/:id/detail`.
- Photo upload: `lib/api.ts` `uploadFile()` — reads the local blob, `POST /v1/files/upload` (presigned PUT to quarantine), PUTs the blob, then `POST /v1/schedule-tasks/:id/photos {file_id}` retried until the scan promotes it (`FILE_NOT_READY`). Captured offline → `lib/photo-queue.ts` (shared offline queue, `retryServerErrors` — see §Unified offline upload queue).
- i18n: `tasks` namespace in `lib/i18n.ts` (EN+ES); nav.tasks + flat `projects['actions.tasks']` (flat-key rule). Step content is English data.
- Registered in `navigation/AppNavigator.tsx` (`Tasks`, `TaskDetail`).
- See skill: @../.claude/skills/task-buildout/SKILL.md

## Trade permits (Session 31)
- `screens/PermitListScreen.tsx` — trade-aware AHJ permit list (electrical/plumbing/mechanical/building), API-only read, code badge (`code_type code_edition`, NEC fallback). Reached via the Permits tile on ProjectDetailScreen.
- `screens/PermitDetailScreen.tsx` — permit summary + inspection milestones; OWNER/PM/FOREMAN can record result (pass/fail/partial) + date + inspector via `PATCH /inspections/:id` with optimistic locking (T-12, 409 → conflict prompt). Summary shows the matched AHJ (name + level + phone) and jurisdiction amendment notes — all read from the permit's stored jurisdiction snapshot (no extra call). `ahj_level_{state,county,city}` i18n keys in `lib/i18n.ts`.
- API-only (online), mirrors TradeScreen — NOT offline-first yet. Upgrade path: add Permit/Inspection WatermelonDB models + sync sweeps.
- i18n: `permits` namespace in `lib/i18n.ts` (EN + ES). nav.permits/projects.actions.permits added.
- Registered in `navigation/AppNavigator.tsx` (Permits, PermitDetail).

## Structural trades (Session 31)
- `screens/StructuralScreen.tsx` — tabbed read-only field view: Roofing / Concrete / Framing. API-only, mirrors TradeScreen. Reached via the Structural tile on ProjectDetailScreen.
- i18n: `structural` namespace in `lib/i18n.ts` (EN + ES). nav.structural / projects.actions.structural added.
- Concrete strength-test records (ACI 318) live on web only (concrete page, expandable per pour) — not yet on mobile.

## Cross-tenant Connections (2026-07-19 — P-02 mobile surface)
- `screens/ConnectionsScreen.tsx` — GC↔Sub connection list (status chips, 402 `ADDON_REQUIRED` →
  upgrade note via `ApiError.status`); `screens/ConnectionDetailScreen.tsx` — summary + shared-event
  thread (family labels + whitelisted-payload snippets ONLY — never render raw payload objects) +
  **Accept/Decline** for the invited sub's OWNER/PM while `pending`. ⚠️ Bodyless POSTs to Fastify
  must send an explicit `body: JSON.stringify({})` — mobileApi always sets `Content-Type:
  application/json` and an empty json body 400s pre-handler.
- Global 🔗 tile (`nav.connections`, OWNER/PM) in `tileManifest.ts`; routes `Connections` +
  `ConnectionDetail` in HomeStack. i18n = new top-level `connections` ns (nested literal — flat-key
  trap N/A) in init `ns` array + jest NAMESPACES.
- `NotificationsScreen` rows are tappable when `data.connection_id` present → navigates
  `'HomeTab', { screen: 'ConnectionDetail', params }` (works from BOTH the Alerts tab and the
  HomeStack mount — the dispatch resolves at the Tab parent). Notification interface now reads `data`.
- API-only/online (Permit screens pattern). Deeper workflows (permissions, closeout, RFI/invoice
  responses, discovery) stay web. Shipped OTA runtime 1.2.0.
