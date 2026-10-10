# Mobile Bug-Fix & OTA Plan — Session Handoff

> Worklist of bugs/debt surfaced while closing the timecard/payroll gaps (sessions A–E,
> see `docs/Timecard_Gaps_Handoff.md`). Plus the EAS/OTA update path. Pick up here in a new session.
> Context: mobile is React Native + Expo (managed), WatermelonDB offline, EN+ES i18n.
> **Mobile has zero automated tests** — verify via `npx tsc --noEmit` + the server KVM emulator
> (`/home/user/run-emu-capture.sh`). Do NOT add native modules (breaks OTA — see §EAS).

---

## Bug list (priority order)

> **ALL ITEMS DONE. Mobile `tsc` 171 → 0.** P0-1 ✅, P0-2 ✅, P1-3 ✅, P1-4 ✅, P2-5 ✅, P2-6 ✅,
> P2-8 ✅, P3-7 ✅, PunchListScreen ✅, **assets/Checkout camera ✅** (expo-camera 14 was installed
> after all — pure v15→v14 API port, JS-only/OTA), **pullDailyReports ✅** (daily reports now sync
> down too). Mobile typechecks fully clean. Details inline.

### P0-1 — `@field` decorator typing red across all models (54× TS1240) ⭐ do first — ✅ DONE
- **Symptom:** `npx tsc --noEmit` in `mobile/` reports 171 errors; 54 are
  `TS1240: Unable to resolve signature of property decorator` on every `@field(...)` in `src/models/*`,
  plus cascade (`TS2551` camelCase, `TS2540` read-only, `TS2344` SyncStatus).
- **Root cause (suspected):** `mobile/tsconfig.json` extends `expo/tsconfig.base`, which does **not**
  enable `experimentalDecorators`. WatermelonDB uses **legacy** decorators. Babel compiles them fine
  at runtime (app works); TypeScript rejects them at check time.
- **Fix:** add to `mobile/tsconfig.json` `compilerOptions`:
  `"experimentalDecorators": true` (and test `"useDefineForClassFields": false` if model props still
  error). Purely a typecheck change — no runtime effect.
- **Why first:** clears ~54 errors + the model cascade, so a clean `tsc` baseline makes every other
  fix below *verifiable* (today real type errors hide in the noise).
- **Files:** `mobile/tsconfig.json`. **Verify:** `npx tsc --noEmit` → near-zero; app still boots on emulator.
- **Done:** added `experimentalDecorators: true` + `useDefineForClassFields: false`. Cleared all 54
  TS1240 + the model cascade (171 → 63).

### P0-2 — daily-report / punch-list / safety-incident mobile sync is silently broken — ✅ DONE
- **Symptom:** `sweepDailyReports()`, `sweepPunchListItems()`, `sweepSafetyIncidents()` in
  `mobile/src/lib/sync.ts` read record fields via **camelCase** accessors (`record.projectId`,
  `record.reportDate`, `r.syncStatus`…) but the models declare **snake_case** `@field` props
  (`project_id`, `report_date`, `sync_status`). camelCase access → `undefined` at runtime, so the
  POST body ships `undefined` required fields → server **422**, caught silently → record stuck
  `sync_status='pending'` forever. Mobile daily reports / punch items / safety incidents never sync.
- **Same class fixed for time entries in Gap D** (snake_case + `version` not `client_version`).
- **Fix:** convert the three sweeps to snake_case accessors; send `version` (not `client_version`)
  like `sweepTimeEntries`. Mirror the Gap-D edit exactly.
- **Files:** `mobile/src/lib/sync.ts`. **Verify:** tsc drops the TS2551s; ideally add an API test
  (mirror `api/src/test/sync-time-entries.test.ts`) or a manual emulator round-trip.
- **Done (snake_case + `version`):** `sweepDailyReports`, `sweepPunchListItems`, `sweepSafetyIncidents`,
  **and `pullProjects`** (it had the same camelCase bug → set `r.serverId` so `server_id` stayed empty
  → every pull **re-created duplicate projects**; now fixed). **`SafetyIncident` model** was the lone
  camelCase model AND its `syncStatus` `@field` collided with WatermelonDB's built-in `Model.syncStatus`
  accessor (TS2610) — converted to snake_case; updated `SafetyIncidentScreen.tsx` to match.
  **PunchListScreen.tsx fixed too** (was P1 but same vertical): default→named `PunchListItem` import
  (the `any`-typed `r` had been hiding camelCase writes → wrong DB columns at runtime), snake_case
  create/update, `body: JSON.stringify(...)` (was passing a raw object to fetch), dropped `client_version`.
  **Field mismatches found + handled:** punch model has no `assigned_to` → dropped from the body;
  safety `incident_date` widened to full ISO (server wants `.datetime()`, screen stored `YYYY-MM-DD`).
  **Left as follow-up:** daily-report `conditions` (model, string) vs server `weather` (jsonb) don't map
  — weather/conditions still won't sync; needs a model/route reconciliation (new P2). 171 → 18.

### P1-3 — `TimeEntryScreen` inline POST hits a non-existent route — ✅ DONE
- **Was:** online-create POSTed `"/projects/${projectId}/time-entries"` (no such route) → 404 every
  time, silently deferred to the sweep; also expected a `{ data }` response shape.
- **Fixed:** POST `/time-entries` with `project_id` + `user_id` in the body; read `{ time_entry }`.
- **Files:** `mobile/src/screens/TimeEntryScreen.tsx`.

### P1-4 — warranty + asset screens: real import/type errors — ✅ 16/18 DONE, 2 DEFERRED
- **Warranties (DONE):** all 4 screens imported non-existent `apiGet`/`apiPost` from `@/lib/api`
  → the helpers were `undefined` → screens **crashed on use** (never worked). Added thin `apiGet`/
  `apiPost` wrappers to `lib/api.ts` (over `mobileApi`, strip a leading `/v1`), and typed the call
  sites (`apiGet<WarrantyDetail>` etc.). Also replaced **web-only logical style props** RN rejects
  (`marginBlockStart/End`→`marginTop/Bottom`, `marginInlineStart/End`→`marginStart/End`,
  `borderBlockEndWidth/Color`→`borderBottomWidth/Color`) — these were both tsc errors and silent
  runtime no-ops. (Scanned the rest of `src/` — no other web-logical props.)
- **`assets/Checkout.tsx` — ✅ DONE.** expo-camera 14.1.3 turned out to be installed; this was purely
  the SDK-51→SDK-50 API mismatch. Ported: `CameraView`→`Camera` (default export), `useCameraPermissions`
  →`Camera.useCameraPermissions` (static), `onBarcodeScanned`/`barcodeScannerSettings`/`barcodeTypes`
  →`onBarCodeScanned`/`barCodeScannerSettings`/`barCodeTypes`, dropped `facing="back"` (back is the
  v14 default). JS-only → OTA. (The native expo-camera module is already linked in the APK — the asset
  screens shipped with it. If the QR camera ever errors at runtime with a missing-native-module, that
  APK predates the dep and needs one `eas build`.)
- **Files:** `mobile/src/lib/api.ts`, `mobile/src/screens/warranties/*.tsx`, `mobile/src/screens/assets/Checkout.tsx`.

### P2-8 — daily-report `conditions` ↔ server `weather` mismatch — ✅ DONE
- Send the free-text `conditions` wrapped as the server's `weather` jsonb (`weather: { conditions }`)
  on both the `DailyReportScreen` create and `sweepDailyReports` — no migration; the local model keeps
  `conditions` as text. **Also fixed the same inline-route bug as P1-3:** the screen POSTed
  `/projects/:id/daily-reports` (no such route) → now `/daily-reports` with `project_id` in the body
  and reads `{ daily_report }` (was expecting `{ data }`).
- **Files:** `mobile/src/screens/DailyReportScreen.tsx`, `mobile/src/lib/sync.ts`.
- **`pullDailyReports` — ✅ DONE.** Added an incremental batch pull (`/v1/sync/pull`, own `since`
  cursor, upsert by `server_id`, T-12-guarded, skips locally-dirty rows), mapping the server's
  `weather.conditions` jsonb back onto the local `conditions` field. Wired into `runSyncSweep`'s pull
  phase alongside `pullProjects`/`pullTimeEntries`. Daily reports now round-trip both directions.

### P2-5 — `ClockScreen` hardcoded English (i18n gap) — ✅ DONE
- Moved "Select Project" / "No active projects." / "Clock out without project" / "This Week" /
  the manual-mode block to `field.time_punches.*` (EN+ES); Cancel/Back via `common`.
- **Files:** `mobile/src/screens/ClockScreen.tsx`, `mobile/src/lib/i18n.ts`.

### P2-6 — `ClockScreen` week grid shows fake per-day hours — ✅ DONE
- Added a `weekByDay` bucket (sum the already-fetched week punches by `clock_in_at` date); the grid
  now shows real per-day totals instead of only "today".
- **Files:** `mobile/src/screens/ClockScreen.tsx`.

### P3-7 — dead field in payroll worker — ✅ DONE
- Dropped the unused `timecard_id` from `TimecardRow` + the SELECT. Tests green.
- **Files:** `api/src/workers/payroll-worker.ts`.

---

## Sequencing
1. ~~**P0-1** (tsconfig decorators)~~ ✅ — unblocked a clean `tsc`.
2. ~~**P0-2** (broken sweeps + pullProjects + SafetyIncident model + PunchListScreen)~~ ✅ — mobile
   sync for daily/punch/safety/projects restored. **171 → 18 tsc errors.**
3. ~~**P1-3** (inline route)~~ ✅ → ~~**P1-4** warranties~~ ✅ (asset Checkout deferred — native).
4. ~~**P2-8** (daily weather/conditions)~~ ✅ · ~~**P2-5 / P2-6** (ClockScreen polish)~~ ✅.
5. ~~**P3-7** (cleanup)~~ ✅.

**All plan items done. Remaining tsc: 0.**

> Consider doing the P0/P1 fixes as one mobile commit, then a server commit (P0-2 test, P3-7),
> following the per-gap commit discipline used in `Timecard_Gaps_Handoff.md`.

---

## EAS / OTA update path (how the A–E + these fixes reach devices)

**Status — already wired (no setup needed):**
- `mobile/eas.json`: `preview` + `production` profiles each carry
  `env.EXPO_PUBLIC_API_URL=https://api.thejobsite.app` and `channel: "production"`.
  (This closes the gap `mobile/CLAUDE.md` flagged — cloud builds no longer bake the localhost fallback.)
- `mobile/app.json`: `updates.url = https://u.expo.dev/7cda35c2-…`, `runtimeVersion`, `expo-updates` plugin.
- `expo-updates` installed.

**Shipping our changes — all of A–E + the fixes above are JS-only → OTA, no rebuild:**
```bash
cd mobile
eas login                 # once, interactive — run via `!` in the session
eas update --branch production --message "timecard gaps A–E + mobile sync fixes"
```
- The local `eas update` bundle reads `mobile/.env` (`EXPO_PUBLIC_API_URL`), so the OTA carries the
  correct API origin.
- Devices on the `production` channel pull it on next launch (`fallbackToCacheTimeout: 0`).

**When a rebuild IS required (NOT for A–E):** only if a **native module** is added (e.g. the deferred
`expo-background-fetch` for Gap E OS background sync). Then:
```bash
eas build -p android --profile production   # app-bundle; or `preview` for an installable APK
```
A native change cannot ship via `eas update` — it needs a new binary.

**Verify after publishing:** `/home/user/run-emu-capture.sh` boots the KVM emulator, installs the
published APK, relaunches on the OTA, and dumps `/tmp/crash-full.log`. Watch for the i18n flat-key
crash class (we touched `lib/i18n.ts` heavily in C/D — confirm it boots).

**Gaps / follow-ups:**
- No CI auto-OTA on merge to main (Mobile Enterprise Plan §C6 — deferred). A git hook / CI step running
  `eas update --branch production` would remove the manual step.
- iOS: only Android is built/distributed today; an iOS EAS profile + TestFlight is a separate follow-up.

---

## Risks / notes
- **No mobile tests** — `tsc` + emulator are the only gates. Add the Jest i18n-integrity test
  (Mobile Enterprise Plan §C1) opportunistically — it would have caught the launch-crash class.
- **Disk** was at ~92% this session (root fs). Clean docker build cache before any `eas build`
  (`docker builder prune -f`) — do **not** prune docker *volumes* (dev Postgres data lives there).
- **OTA constraint:** keep every fix here JS-only. Adding a native dep silently breaks the OTA path
  and can hard-crash at bundle load.

---

*Plan written: 2026-06-24 (continues `Timecard_Gaps_Handoff.md`).*
