# Mobile Design Parity — Session Tracker v1.0

> **One task = one session.** Pick the top unchecked task, do it, verify on the KVM emulator,
> commit, check the box, stop. Mirrors the web `Web_UI_Redesign_Followups.md` cadence.
> **Branch:** cut `feat/mobile-design-parity` fresh from `main`
> (`git checkout main && git pull && git checkout -b feat/mobile-design-parity`).
> **JS-only → OTA** (no native deps) — ships via the pre-push hook on merge to `main`
> (`mobile/CLAUDE.md` §"Auto-ship OTA"). Verify each session on the server KVM emulator
> (`/home/user/run-emu-capture.sh`) in light AND dark before checking the box.

## Background

The web app was fully migrated onto an in-house UI kit + semantic tokens + canonical color
sources (`Web_UI_Redesign_Migration.md`, `DESIGN.md`). **Mobile never got the same pass**
(`DESIGN.md` Appendix A "Mobile"): ~35 of 38 screens hardcode status/severity hexes, only 4 use
`statusColor()`, there is **no shared Badge/Button/Card kit**, and typography is ad hoc (font
sizes 10–40 scattered). Tap-target audit (≥44pt) never done.

Dark mode is wired (`theme-context.tsx` `useTheme()`, `LIGHT`/`DARK` palettes + `paletteFor()`
in `theme.ts`, from the Session-42 role-nav work). Screens must consume `useTheme().palette` +
canonical `statusColor`/`severityColor` instead of literal hex, through a small shared kit.

## ⚠️ Ground-truth corrections (2026-07-10 — verified before M1)

Two premises in the original draft were wrong. Corrected:

1. **`mobile/src/lib/theme.ts` has ONLY the palette** (52 lines: `LIGHT`/`DARK`/`Palette`/
   `paletteFor`). There is **NO `statusColor`/`severityColor`/`STATUS_MAP`/`SEVERITY`** — screens
   roll their own (`SafetyIncidentScreen` local `severityColor`, `assets/AssetDetail` local
   `STATUS_COLORS`, etc.). The web `web/src/lib/status.ts` even says it "Mirrors mobile
   `theme.ts` STATUS_MAP" — that mobile canonical was **assumed but never built**. **So M1 must
   CREATE the canonical status/severity helpers in `theme.ts` first**, then the kit.
2. **`DESIGN.md` lives on the unmerged `feat/web-ui-redesign` branch (PR #5), not on `main`.** This
   plan/branch is off `main`, so `DESIGN.md` is absent here. → **Defer the M10 "update DESIGN.md
   Appendix A" step until PR #5 merges to main** (or rebase this branch on main after that merge).
   Everything else is independent of DESIGN.md.

### Canonical maps to create in `theme.ts` (M1) — copied from web `status.ts` + `DESIGN.md` §2.3/2.4 (the SoT)

**Status — semantic key → {fg hex, bg hex}** (DESIGN §2.3):
`success #059669 / #dcfce7` · `danger #dc2626 / #fee2e2` · `info #2563eb / #dbeafe` ·
`warning #d97706 / #fef9c3` · `action #7c3aed / #ede9fe` · `neutral #6b7280 / #f3f4f6`.
(Dark mode: brighten fg, translucent bg — or reuse these literals initially; badges read on both.)

**`STATUS_MAP` (domain state → semantic key)** — mirror web `status.ts` exactly:
active/passed/answered/awarded/valid/approved/complete → success;
on_hold/pending/scheduled/expiring/in_repair/in_progress/submitted/under_review/resubmit/rough_in/roughed_in/trimmed → warning;
completed/open/sent → info;
cancelled/failed/expired/overdue/out_of_service/stolen/lost/rejected/revoked/declined → danger;
requires_action/reserved/trial → action;
draft/closed/inactive/decommissioned/sold/voided/not_started/void → neutral;
paid → success; approved_as_noted → success.
`statusColor(state) = STATUS[STATUS_MAP[state] ?? 'neutral']`.

**Severity (incident) — ordered** (DESIGN §2.4): `near_miss #6b7280` (lowest) · `first_aid #d97706` ·
`recordable #ea580c` · `lost_time #dc2626` · `fatality #7f1d1d` (highest).
`severityColor(s) = SEVERITY[s] ?? '#6b7280'`.

Keep these the ONE source; delete the per-screen copies as each cluster is migrated.

## Per-session workflow

1. `cd mobile`. `npx tsc --noEmit` must stay clean (pre-existing `Checkout.tsx` expo-camera errors
   aside). No native deps — everything here is pure JS/RN so it OTA-ships.
2. For each screen in the task: replace literal status/severity hex with `statusColor()` /
   `severityColor()`; swap ad-hoc `View`/`Text` chrome for the kit primitives (M1); pull
   background/surface/text/border from `useTheme().palette` (not literal grays) so dark mode works;
   apply the type scale (M1) instead of raw `fontSize`.
3. **Don't touch semantic literals that are canonical by design** — tile accent colors and the
   trade colors are intentionally literal at call sites (mirror the web rule). Status + severity are
   the ones that must route through the helpers.
4. Verify: `npx tsc --noEmit` clean; boot the KVM emulator, OTA the branch build
   (`eas update --branch <branch>` or run the dev bundle), eyeball the migrated screens in **light
   and dark**, confirm `/tmp/crash-full.log` is FATAL-free.
5. Commit: `style(mobile): adopt kit + tokens on <cluster> (M#)`. Check the box.

## Tasks

- [x] **M1 — Canonical color helpers + kit foundation.** ✅ 2026-07-10. `theme.ts` gained `STATUS`/`STATUS_MAP`/`statusColor`/`SEVERITY`/`severityColor` (mirror web maps). `components/ui/`: `typography.ts` (TYPE_SCALE), `Text`, `Badge`+`StatusBadge`+`SeverityBadge`, `Button`, `Card`, `Screen`, `EmptyState`, `Row`, barrel `index.ts` w/ usage note. Jest `theme.test.ts` (STATUS_MAP validity + severity). tsc clean, 51 jest green. No screen migrations yet. FIRST add to `mobile/src/lib/theme.ts` the
  canonical `STATUS` (semantic→{fg,bg}), `STATUS_MAP`, `statusColor(state)`, `SEVERITY`,
  `severityColor(s)` per the "Ground-truth corrections" maps above (mirror web `status.ts`). THEN
  build `mobile/src/components/ui/`: `Text` (typography scale — a fixed token set replacing raw sizes
  10–40), `Badge` + `StatusBadge`/`SeverityBadge` (consume `statusColor`/`severityColor`), `Button`,
  `Card`, `Screen` (safe-area + themed bg), `EmptyState`, `Row`/`ListItem`. All theme-aware via
  `useTheme().palette`. No screen migrations yet — just the helpers + primitives + a short usage note.
  Optionally add a jest test asserting every `STATUS_MAP` value is a valid `STATUS` key. Everything
  else adopts these.
- [x] **M2 — Shell / nav / auth / alerts.** ✅ 2026-07-10 (commit `b2f8ee8`). Migrated
  `ProjectsScreen` (Card/StatusBadge w/ i18n label/EmptyState), `ProjectDetailScreen` (Screen/Card/Text),
  `LoginScreen` (palette inputs + kit Button, was all literal hex), `NotificationsScreen` (palette chrome,
  was all literal; category accents stay literal), `ConflictsScreen`/`ConflictResolveScreen`/
  `PunchConflictResolveScreen`/`SafetyConflictResolveScreen` (palette + kit Button; select=accent/warning;
  safety Tier-3 banner+submit=STATUS.danger). `SettingsScreen` was already palette-driven (only `#fff` on
  accent buttons) — left as-is. tsc clean, 51 jest green. **On-device light+dark eyeball deferred to the
  batched emulator pass (M10 owns the final cross-app check)** — feature-branch JS can't `eas update
  --branch production` (main-only scope); static guarantee holds (zero chrome hex left; only semantic
  category/status accents remain).
- [x] **M3 — Time cluster.** ✅ 2026-07-10. Migrated `TimeEntryScreen` (was fully literal + hardcoded
  `LIGHT` → dark broken; now `useTheme().palette` + kit `Text`/`Button` + palette CalendarPicker),
  `MyTimecardScreen` (local `STATUS_STYLE`→`StatusBadge`; note colors→`STATUS.warning/success/danger.fg`;
  palette chrome), `ClockScreen` (fully literal → palette; active card = `palette.surface`+`STATUS.success`
  border/dot/label fixing dark contrast; clock-out=`STATUS.danger.fg`; project-picker/week-grid/manual
  redirect all palette), `TimeHubScreen` (`STATUS_STYLE`→`StatusBadge`; active-punch card success-border
  fix; semantic note text→`STATUS.*`). `PunchEditor` delete→`STATUS.danger.fg`. `CalendarPicker`
  already palette-driven (only rgba scrim + on-accent `#fff` remain — canonical). Offline write paths
  untouched. tsc clean, 51 jest green. Only residual hex = rgba modal scrims + `#cbd5e1` cancel-on-dark-header
  (canonical literals). **On-device light+dark eyeball deferred to M10 batched pass** (feature branch can't
  OTA `--branch production`; static guarantee holds — zero status/severity hex left).
  Recent, heavily used — kept offline paths intact.
- [x] **M4 — Tasks / schedule.** ✅ 2026-07-10. Migrated `TaskListScreen` (local `STATUS_COLORS`→`statusColor().fg`
  dots; Card/EmptyState/Text + palette), `TaskDetailScreen` (`INSP_DOT` map→`statusColor().fg`; status buttons→palette.accent;
  semantic step safety/qa/notes→`STATUS.warning/success.fg`; code badge→`STATUS.action`; kit `Text` throughout; palette chrome),
  `MilestoneListScreen` (fully literal → palette; done checkbox→`STATUS.success.fg`; modal inputs+buttons→kit `Button`/palette),
  `CrewListScreen` (fully literal → palette; remove-✕→`STATUS.danger.fg`; avatar/chip active→palette.accent; kit `Button`).
  Data/API wiring, optimistic-lock (409) flows, photo quarantine upload, i18n untouched. tsc clean (ignore Checkout.tsx),
  51 jest green. Only residual hex = `#000` shadows, `#fff`-on-accent, rgba photo-delete scrim (canonical). On-device
  light+dark eyeball deferred to M10 batched pass (feature branch can't OTA `--branch production`).
- [x] **M5 — Field ops.** ✅ 2026-07-10. Migrated `DailyReportScreen` (offline WatermelonDB — chrome only:
  palette inputs + kit `Text`/`Button`), `PunchListScreen` (offline — local `STATUS_COLORS`→`StatusBadge` w/
  i18n label; Card/EmptyState/palette; snake_case model accessors untouched), `InspectionsScreen`
  (`STATUS_COLORS` map→`statusColor().fg` sheet dots + `StatusBadge`; Card/EmptyState/kit `Button` modals;
  palette chrome + status sheet), `RfiListScreen`/`SubmittalListScreen` (status chips→`statusColor().fg`
  active fill; `StatusBadge` cards; kit `Button` modal actions; read-only banner→`STATUS.warning`; palette),
  `DocumentsScreen` (file-scan status ready/scanning/rejected→`FILE_STATUS` tone map→`Badge colors={STATUS[tone]}`
  keeping i18n label; upload-notice→`STATUS.info`; Card/EmptyState/palette). Offline write paths, optimistic-lock
  (409) flows, quarantine upload queue, i18n untouched. tsc clean, 51 jest green. Only residual hex = `#000`
  shadows + `#fff`-on-accent (FAB/upload/active-chip) — canonical. On-device light+dark eyeball deferred to
  M10 batched pass (feature branch can't OTA `--branch production`).
- [x] **M6 — Trades / permits / structural.** ✅ 2026-07-10. Migrated `TradeScreen` (circuit/fixture
  `*_STATUS_COLORS` maps→`statusColor().fg` dots; palette tab bar/cards/rows + kit `Text`/`EmptyState`;
  edit-✎→palette.accent), `PermitListScreen` (permit lifecycle status→local `PERMIT_STATUS_TONE`→`STATUS[tone].fg`
  dot incl. failed_inspection=danger; **trade `PERMIT_TYPE_COLORS` stay literal** rendered via kit `Badge`;
  Card/EmptyState/palette), `PermitDetailScreen` (inspection dot→`statusColor().fg`; correction notice→`STATUS.danger`;
  jurisdiction notes→`STATUS.warning`; result buttons active→palette.accent; kit `Card`/`Button`/`Text`/`EmptyState`),
  `StructuralScreen` (roofing/concrete/framing trade-progress statuses→local `*_TONE` maps→`STATUS[tone].fg`
  via `toneColor()`; palette tab bar + kit `Card`/`Text`/`EmptyState`). Offline status-queue (`enqueueStatusUpdate`),
  optimistic-lock 409 reloads, Alert action-sheets, i18n untouched. tsc clean, 51 jest green. Only residual hex =
  literal trade colors (by design), `#000` shadow, `#fff`-on-accent. On-device light+dark eyeball deferred to M10
  batched pass.
- [x] **M7 — Safety.** ✅ 2026-07-10. Migrated `SafetyIncidentScreen` (offline WatermelonDB — chrome only:
  deleted the LOCAL `SEVERITIES` color array + local `severityColor` shadow → canonical `severityColor()` +
  kit `SeverityBadge` for the incident badge; severity chips fill via `severityColor(value)`; emergency box→
  `STATUS.danger`, notice banner→`STATUS.warning`, report/submit=`Button variant="danger"`; palette chrome;
  `observe()` sub + offline write path untouched), `SafetyCertScreen` (expiry buckets expired/expiring/valid/none
  are canonical status strings → `StatusBadge status={state}` w/ i18n label; FAB/preset chips→palette.accent;
  kit `Card`/`Button`/`EmptyState`; palette modal + user-picker sheet). tsc clean, 51 jest green. Only residual
  hex = `#fff`-on-severity/accent, `#000` shadow, severity chip fill via `severityColor()` (semantic, canonical).
  On-device light+dark eyeball deferred to M10 batched pass.
- [x] **M8 — Assets.** ✅ 2026-07-10. Migrated `AssetDetail` (`STATUS_COLORS` map→`StatusBadge`; cert warning→
  `STATUS.warning`; Card/Text; **action-button accents blue/green/amber/red stay literal** — tile-like nav accents),
  `FuelLog` (chrome→palette; fuel chips/submit/total = `FUEL_ACCENT` literal accent; Full-Fill toggle on→`STATUS.success`;
  kit `Button`/`Text`), `InspectionForm` (ok/defect/na chips→`STATUS[success/danger/neutral]` via `RESPONSE_TONE`;
  result badge→`STATUS.danger/warning/success`; defect-photo btn→`STATUS.danger`; Card templates + `EmptyState`;
  submit=kit `Button`), `DamageReport` (damage-type chips→palette.accent; **damage severity = local literal ramp**
  documented DISTINCT from OSHA `severityColor` — minor/moderate/major/total_loss saturated hexes read both themes;
  OOS toggle/warning→`STATUS.danger`; submit=`Button variant="danger"`), `Checkout` (condition chips→palette.accent,
  damage condition→`STATUS.danger`; checked-out badge→`STATUS.warning`; damage note→`STATUS.danger`; checkout=green
  `CHECKOUT_ACCENT` literal, checkin=kit `Button`; **camera scanner block + white/scrim overlay untouched** — canonical
  camera UI). Offline queues (fuel/inspection/damage), photo/quarantine upload, cert-block (403), OOS logic, camera
  scan untouched. `Button.style` is single `ViewStyle` (not array) — merged 2 accent overrides inline. tsc clean
  (Checkout expo-camera noise resolved), 51 jest green. Residual hex = action/fuel/checkout accents (literal by
  design), camera overlay, damage-severity ramp, `#fff`-on-accent. On-device light+dark eyeball deferred to M10.
- [x] **M9 — Warranties.** ✅ 2026-07-10. Migrated `WarrantyListScreen` (`STATUS_COLORS`→`StatusBadge`; open-claim
  badge→`STATUS.warning`; Card/EmptyState/palette), `WarrantyDetailScreen` (coverage-type cards→`COVERAGE_TONE`→
  badge-style `STATUS[tone].bg` fill + `STATUS[tone].fg` text so readable in dark — the old light tints matched
  info/success/danger/action exactly; claim status→`StatusBadge`; sections→palette.surface; new-claim link→accent),
  `NewClaimScreen` (category/priority chips→palette.accent shared `Chip`; kit `Button`; palette inputs),
  `ClaimDetailScreen` (priority badge→`PRIORITY_TONE`→`Badge` w/ STATUS; status-stepper dots→`STATUS.success.fg`/
  palette.accent/palette.border; sections→palette). Data (`apiGet`/`apiPost`), claim FSM, i18n untouched. tsc clean,
  51 jest green. Only residual hex = `#fff`-on-accent chip text. On-device light+dark eyeball deferred to M10.
- [x] **M10 — Typography + tap-target audit + closeout.** ✅ 2026-07-10. **Typography:** swept — the only
  raw `fontSize` left in migrated screens are `TextInput`s (legit; kit `Text` doesn't wrap inputs) + emoji/
  camera glyphs; all chrome text is on the M1 `<Text variant=…>` scale. **Tap targets:** kit primitives are
  ≥44/48 by construction (`Button` 48, `Card`/`Row` 44/56); added `hitSlop` to the sub-44 standalone touchables
  (DamageReport photo-remove ✕ 20×20, FuelLog/DamageReport toggles ~34pt, InspectionForm "Change" +
  WarrantyDetail "new claim" + PermitDetail "record result" text-only links). Chips (~30pt, visible fill + gap)
  left as an accepted common pattern. **Skill:** added a "Design kit + tokens" section to
  `.claude/skills/mobile-role-nav/SKILL.md` (kit usage, `*_TONE` local-map rule, literal-by-design list,
  tap-target + deferral notes). tsc clean, 51 jest green. **Two items explicitly deferred** (per this plan):
  (1) final on-device light+dark emulator eyeball → batched manual pass on merge to `main` (feature branches
  can't `eas update --branch production`); (2) `DESIGN.md` Appendix A "Mobile" → waits on PR #5 (owns DESIGN.md).

## Notes / gotchas

- **Canonical sources, don't fork them:** status → `statusColor()`, severity → `severityColor()`,
  palette → `useTheme().palette`. Trade + tile accent colors are literal by design (see web §2.5 rule).
- **OTA can't cross a native version bump** (`mobile/CLAUDE.md`) — this plan adds no native deps, so
  every M# ships via OTA. If a session is tempted to add a native module, STOP and rethink.
- **Emulator dark-mode check is mandatory** — the whole point is that hardcoded hex breaks in dark.
  A screen that "looks fine" in light but keeps `#fff`/`#111` literals fails the task.
- **i18n is already done** (F1–F7, web) — mobile chrome i18n is separate and NOT in scope here; this
  is colors/kit/typography only.
- Audit re-scope anytime: `grep -rlE "#[0-9a-fA-F]{6}" mobile/src/screens` (35 files at start) and
  `grep -rc "statusColor\|severityColor" mobile/src/screens`.

## Definition of done

Every screen consumes `useTheme().palette` for chrome + `statusColor()`/`severityColor()` for state
badges (no literal status/severity hex), renders correctly in light AND dark on the emulator, uses
the M1 kit + type scale, and passes the ≥44pt tap-target audit. `DESIGN.md` Appendix A "Mobile"
closed. `tsc` clean; OTA-shipped.

*Created 2026-07-10 — mobile counterpart to the web UI redesign (T1–T16 + F1–F7).*
