# Mobile Role-Based Navigation, Settings & Theme Skill
**Feature added: Session 42 (2026-06-25)**
**Implements: Mobile Enterprise Plan §A (role-aware experience)**
**Builds on: i18n skill (flat-key gotcha), offline-sync (auth/SecureStore)**

## Design kit + tokens (Mobile Design Parity, M1–M10 — 2026-07-10)

A shared UI kit + canonical status/severity color helpers now back every feature screen (plan
`docs/Mobile_Design_Parity_Plan_v1_0.md`). Use them — do NOT hand-roll status hex or ad-hoc `View`/`Text`.
- **Kit:** `import { Screen, Card, Row, Text, Button, StatusBadge, SeverityBadge, Badge, EmptyState } from '@/components/ui'`.
  `<Text variant=…>` off the fixed type scale (no raw `fontSize` on chrome text; TextInputs keep numeric fontSize).
  `Button` is ≥48pt (single `ViewStyle` prop — NOT an array). `Card`/`Row` are ≥44pt.
- **Color:** chrome (bg/surface/surfaceAlt/text/textMuted/border/accent/overlay) → `useTheme().palette`.
  Domain status → `statusColor(state)` / `<StatusBadge>`; incident severity → `severityColor(s)` / `<SeverityBadge>`
  (both in `lib/theme.ts`: `STATUS`/`STATUS_MAP`/`SEVERITY`). A domain state NOT in `STATUS_MAP` (permit
  `failed_inspection`, roofing `tear_off`, file `scanning`, coverage type, priority…) → a small local
  `*_TONE: Record<string, StatusTone>` map → `STATUS[tone]` (keeps colors canonical + dark-safe). Never a raw hex.
- **Literal-by-design (allowed):** trade colors, tile/action-category accents (fuel amber, checkout green,
  AssetDetail action borders), camera-overlay white/scrim, `#000` shadows, `#fff`-on-accent text, and the
  DamageReport damage-severity ramp (distinct from the OSHA `severityColor` scale). Only **status/severity**
  must route through the helpers.
- **Tap targets:** kit primitives are ≥44/48; small standalone touchables (photo ✕, text-only links, compact
  toggles) carry `hitSlop`.
- **Deferred:** on-device light+dark emulator eyeball is a batched manual pass on merge to `main` (feature
  branches can't `eas update --branch production`); `DESIGN.md` Appendix A "Mobile" update waits on PR #5.

## What this feature does

Makes the React Native app role-aware + customizable, with an industry-standard bottom tab bar:
- **Bottom tab bar** (`@react-navigation/bottom-tabs`, pure JS → OTA-shippable). Home tab hosts the
  full app stack; Clock tab is role-filtered; Timecard tab shows for everyone (own weekly card,
  any authed user); Alerts + Settings always present so Settings is one tap from anywhere.
- **Per-role tiles/actions** — each role sees only the project tiles + quick actions it needs
  (e.g. Owner gets no Clock; field roles do). One declarative manifest.
- **Settings screen** — show/hide allowed tiles, language (EN/ES), appearance (System/Light/Dark).
- **Dark mode** — light/dark palette via a ThemeProvider; chrome colors come from the palette.

> **Gating is UX-only / defense-in-depth — the API still enforces every permission.** This layer
> tailors + de-clutters; it is NOT a security boundary.

## Key invariants

1. **The JWT role claim is UPPERCASE** (`OWNER`, `PROJECT_MANAGER`, `FIELD_TECH`, …) — the API
   issues it via `issueToken` → `user.role.toUpperCase()` (`api/src/middleware/auth.ts:193`). The
   manifest `allowedRoles` are LOWERCASE (`user_role` enum values). **`hasRole()` lowercases the role
   before comparing** — ALWAYS gate through `hasRole()`, never a raw `includes`/`===`. (2026-06-25:
   an earlier version of this note wrongly claimed the JWT was lowercase; `hasRole` did an exact
   compare → UPPERCASE `OWNER` ∉ lowercase list → `tilesForRole()` returned `[]` → **every project
   detail screen rendered an empty tile grid**. Fixed by normalizing in `hasRole`.) The old UPPERCASE
   `EDIT_ROLES` arrays in `PermitDetailScreen`/`TaskDetailScreen` are gone — they now use `hasRole()`.
2. **One manifest is the source of truth** (`mobile/src/lib/tileManifest.ts`): every project tile +
   global/header action with `{key, ns, route, color, icon, allowedRoles, scope, ...}`. Screens
   render from `tilesForRole()` / `headerActionsForRole()`; nothing hard-codes a tile array.
3. **Permission beats preference by construction**: effective tiles = `tilesForRole(role, scope)`
   THEN `.filter(t => !hiddenTiles.includes(t.key))`. Starting from the role-allowed set means a
   hidden-tile preference can only ever REMOVE — never reveal a disallowed tile.
4. **Role is read once, synchronously** via the `RoleProvider` context (`useCurrentUser()`), not
   `await getUser()` per screen — avoids a flash of un-gated UI before filtering.
5. **Theme tokens swap, accents stay literal**: only background/surface/text/border/header tokens
   come from the palette; tile accent colors + status/severity badges stay literal (semantic).
6. **i18n flat-key rule still applies**: `settings` is a brand-new top-level ns (safe nested
   literal); `common.nav.*` is a real object (safe to extend); project tile labels stay FLAT
   (`projects['actions.x']`). Honor `preferred_language` at runtime via `applyLanguage()`.

## Architecture / files

| File | Role |
|------|------|
| `mobile/src/lib/tileManifest.ts` | Manifest + `hasRole` / `tilesForRole` / `headerActionsForRole` / `tileByKey`. |
| `mobile/src/lib/user-context.tsx` | `RoleProvider` + `useCurrentUser()` (`{user, role, loading, refresh}`); applies language on load. |
| `mobile/src/lib/preferences.ts` | `UserPreferences {hiddenTiles, language, theme, hideUpdateMessages}`; `loadPrefs`/`savePrefs` at AsyncStorage `prefs:{user_id}:v1`. (`hideUpdateMessages` gates the post-login "What's New" popup — see `lib/changelog.ts` + `components/WhatsNewModal.tsx`; Settings has an "Updates" toggle.) |
| `mobile/src/lib/theme.ts` | `LIGHT`/`DARK` palettes + `paletteFor(scheme)`. |
| `mobile/src/lib/theme-context.tsx` | `ThemeProvider` + `useTheme()` (`'system'` follows `useColorScheme()`). |
| `mobile/src/components/RoleGate.tsx` | `<RoleGate allow={Role[]} fallback>` — UX gate (parity with web `role-gate.tsx`). |
| `mobile/src/screens/SettingsScreen.tsx` | Layout / language / appearance. |
| `mobile/src/navigation/AppNavigator.tsx` | `MainTabs` (bottom tabs) + `HomeStackNavigator` (full stack) + root Login/Main switch. Providers wrap here; `App.tsx` adds `SafeAreaProvider`. |

## Provider order (App root)

`SafeAreaProvider` (App.tsx) → `RoleProvider` → `ThemeProvider` → `RootNavigator`.
`ThemeProvider` reads the persisted theme via `useCurrentUser()`, so it must sit inside `RoleProvider`.

## Bottom tabs (role-filtered)

| Tab | Component | Roles |
|-----|-----------|-------|
| Home 🏠 | `HomeStackNavigator` (Projects → every detail/feature screen) | all |
| Clock ⏱️ | `ClockScreen` | foreman, field_tech |
| Timecard 🗓️ | `MyTimecardScreen` | **all** (own weekly card — API allows any authed to open/submit own) |
| Alerts 🔔 | `NotificationsScreen` | all |
| Settings ⚙️ | `SettingsScreen` | all |

> **Timecard is open to every role (2026-06-30).** `MyTimecardScreen` is the user's OWN week
> (open/submit) — the API permits any authenticated user, so the Timecard tab renders for all
> (`showTimecard = true` in `MainTabs`) and the `nav.timecard` manifest action lists all 9 roles.
> Likewise `actions.log_time` now includes **owner** (API: `POST /v1/time-entries` =
> OWNER/PM/FOREMAN/ACCOUNTANT) so an owner can add the entries the timecard sums. Approve/reject a
> timecard stays OWNER/PM (web).

In-app navigation (tile grid, quick-strip, deep links) all happens inside the Home tab's stack, so
existing `navigation.navigate(...)` calls are unchanged. Clock/Timecard/Notifications/Settings also
remain registered IN the Home stack so the Projects quick-strip can still push them.

## Adding / changing a tile or a role's access

1. Edit `TILES` in `tileManifest.ts` — add the entry or adjust `allowedRoles` (lowercase).
   Project tiles: `ns:'projects'`, flat key `actions.x`, set `needsProjectName`/`noProjectParams`
   per the destination route's params. Global actions: `ns:'common'`, key `nav.x`.
2. Add the i18n label in BOTH locales (`projects['actions.x']` flat, or `common.nav.x` nested).
3. Register the destination route in `HomeStackNavigator` if new.
4. No screen edits needed — `ProjectDetailScreen` (project grid) and `ProjectsScreen` (quick-strip)
   render from the manifest automatically.

## Theming a screen

`const { palette } = useTheme();` then apply `palette.background/surface/text/textMuted/border` to
the swappable chrome; keep semantic colors literal. Chrome is themed; many deep screens still use
literal light colors (incremental — theme them as you touch them).

## Verify (OTA + emulator)

JS-only → OTA: `cd mobile && eas update --branch production`. Then boot the KVM emulator
(`/home/user/run-emu-capture.sh`), relaunch once so the OTA applies, confirm `/tmp/crash-full.log`
is FATAL-free and the app stays alive (see [[mobile_release_workflow]]). `npx tsc --noEmit` must be
clean (pre-existing `expo-camera` errors in `Checkout.tsx` aside).

## Gotchas

- **`@react-navigation/bottom-tabs` is JS-only** — OTA-shippable, no native rebuild. Its native deps
  (`react-native-screens`, `react-native-safe-area-context`) were already linked in the APK.
- **Reused screens in tabs need a cast**: `ClockScreen`/`MyTimecardScreen`/`NotificationsScreen` are
  typed for `RootStackParamList`; pass them to `Tab.Screen` as `Component as React.ComponentType`.
- **`SafeAreaProvider` is required** at the app root for correct tab-bar insets.
- The historical i18n flat-key crash class is real — see the i18n skill before augmenting `resources`.
- **`RoleProvider.refresh()` must ALWAYS clear `loading`** (2026-06-30) — the root spinner is
  `if (loading)` in `RootNavigator`. `refresh()` originally had no try/catch/finally, so a throw
  from `getUser()` (SecureStore decrypt can THROW on a **stale Android Keystore blob after a
  reinstall**, not just return null) or `loadPrefs` left `loading=true` → **infinite startup
  spinner**. Fixed: `refresh()` is try/catch/**finally**(setLoading(false)) → failure = logged-out;
  `getUser()` itself catches SecureStore-read + JSON.parse failures → `clearAuth()` + null. Any new
  async work in the startup gate must keep this guarantee. User-side fallback if a build predates the
  fix: Android Settings → Apps → The Jobsite → Storage → **Clear data** (wipes the bad blob).
