# DESIGN.md — The Jobsite

Design-system contract shared by **web** (`/web`, Next.js + Tailwind) and **mobile**
(`/mobile`, React Native + Expo). **Read this before any UI work in either codebase.**

Format: [awesome-design-md](https://github.com/VoltAgent/awesome-design-md) / Google Stitch
9-section layout. Its job: keep the two frontends visually in sync and make **status, severity,
and trade colors one canonical source each** instead of dozens of scattered copies.

> **Contract:** this doc is the source of truth for *visual* decisions. When a value here
> conflicts with the code, **fix the code** — then update this doc if the intent changed.

---

## 1. Visual Theme & Atmosphere

Construction-operations SaaS. Two user contexts, one system:

- **Field** — outdoors, in direct sunlight, sometimes gloved. Needs high contrast, large tap
  targets, and dark mode for glare **legibility, not aesthetics**.
- **Office / admin** — data-dense dashboards, tables, status scannable at a glance.

Consequences:

- **Status is the product.** Every screen renders project / task / permit / RFI / inspection /
  asset state. Status color must be one shared map, never re-picked per screen.
- **Contrast floor is a hard requirement** (sunlight legibility) — WCAG AA minimum.
- **Tap targets ≥ 48px on mobile** (gloves).
- **Flat & industrial** — no gradients; shadows only on overlays/modals.

North star: **Linear / Stripe dashboard** — clean, semantic-color-first, trustworthy.

**Platform split:**

| | Web | Mobile |
|---|---|---|
| Surface | desktop dashboard | field-first phone app |
| Theme | light / dark / system via `theme-provider.tsx` (§2.6) | light / dark / system via `theme-context.tsx` |
| Density | data-dense tables + slide-overs | tile grid + bottom tabs |

**Visual direction: Hybrid / Adaptive.** Bold, glanceable dashboard + project hub (KPI tiles,
charts, "needs attention"); dense tables on the work/data pages. One token set, dark mode
everywhere. Shell = grouped icon sidebar (collapses to a rail) + light top bar.

---

## 2. Color Palette & Roles

Every subsection names its **canonical home**. Consumers reference the home; never redefine.

### 2.1 Brand

Deep blue = trust / industrial. Web home: `web/tailwind.config.ts` `brand.*`.

| Token | Hex | Role |
|-------|-----|------|
| `brand-50` | `#eff6ff` | tint backgrounds |
| `brand-100` | `#dbeafe` | tint / hover fills |
| `brand-500` | `#3b82f6` | focus rings; mobile dark-mode accent |
| `brand-600` | `#2563eb` | **primary action** (buttons, links) |
| `brand-700` | `#1d4ed8` | hover / pressed |

`brand-500/600/700` are hex-identical to Tailwind `blue-500/600/700`.

**Chrome (navigation) colors** — not brand tokens, but canonical:

| Element | Light | Dark | Home |
|---------|-------|------|------|
| Web sidebar | `gray-900` | — | `web/src/components/layout/sidebar.tsx` |
| Mobile header bg | `#1e3a5f` | `#0f172a` | `theme.ts` `headerBg` |
| Mobile header text | `#ffffff` | `#f3f4f6` | `theme.ts` `headerText` |
| Mobile accent | `#1e40af` | `#3b82f6` | `theme.ts` `accent` |

### 2.2 Neutrals

**Web** — Tailwind gray scale (`50/100/200/700/900`). Backgrounds gray-50/white,
text gray-900/700, borders gray-200.

**Mobile** — LIGHT/DARK palettes in `theme.ts` (verbatim, canonical):

| Token | Light | Dark | Use |
|-------|-------|------|-----|
| `background` | `#f9fafb` | `#0b1220` | screen background |
| `surface` | `#ffffff` | `#161e2e` | cards / tiles |
| `surfaceAlt` | `#f3f4f6` | `#1f2937` | inputs / subtle fills |
| `text` | `#111827` | `#f3f4f6` | primary text |
| `textMuted` | `#6b7280` | `#9ca3af` | secondary text |
| `border` | `#e5e7eb` | `#2d3748` | borders |
| `overlay` | `rgba(0,0,0,0.4)` | `rgba(0,0,0,0.6)` | modal scrim |

Only these chrome tokens swap between modes; semantic colors (§2.3–2.5) stay literal.

### 2.3 Status — THE canonical map

Highest-value part of the doc. Web home: `web/tailwind.config.ts` `status.*` (with `-bg`
variants). Mobile home: `theme.ts` `STATUS` + `statusColor()`. **One map. Both codebases
reference it. No screen redefines a status color.**

| Semantic | Fg / solid | Light bg | Meaning |
|----------|-----------|----------|---------|
| `success` | `#059669` | `#dcfce7` | active, passed, approved, awarded, complete |
| `danger` | `#dc2626` | `#fee2e2` | failed, cancelled, expired, overdue, out-of-service |
| `info` | `#2563eb` | `#dbeafe` | open, completed |
| `warning` | `#d97706` | `#fef9c3` | on-hold, pending, scheduled, in-progress, submitted |
| `action` | `#7c3aed` | `#ede9fe` | requires-action, reserved |
| `neutral` | `#6b7280` | `#f3f4f6` | draft, closed, end-of-life |

**Domain state → semantic key** — synced from `theme.ts` `STATUS_MAP` (the live source; richer
than any prose list). Current mappings:

- **success:** `active`, `passed`, `answered`, `awarded`, `valid`, `approved`, `complete`
- **warning:** `on_hold`, `pending`, `scheduled`, `expiring`, `in_repair`, `in_progress`, `submitted`
- **info:** `completed`, `open`
- **danger:** `cancelled`, `failed`, `expired`, `overdue`, `out_of_service`, `stolen`, `lost`, `rejected`
- **action:** `requires_action`, `reserved`
- **neutral:** `draft`, `closed`, `inactive`, `decommissioned`, `sold`, `voided`

Unknown state → `neutral`. **Web home: `web/src/lib/status.ts`** (`statusKey`/`statusClasses` +
the `Badge`/`StatusPill`/`StatusDot` kit components resolve through it — mirrors the mobile map with
a web-only extension block). Adding a state = edit `STATUS_MAP` in both `mobile/src/lib/theme.ts`
and `web/src/lib/status.ts`; never map a state screen-locally.

### 2.4 Incident severity — canonical scale

OSHA incident severity. Ordinal gray→amber→orange→red→dark-red. **Solid chips** (white-on-solid),
no fg/bg pair. Web home: `web/src/lib/colors.ts` `SEVERITY`. Mobile home: `theme.ts` `SEVERITY` +
`severityColor()`. Hexes identical across platforms.

| Level | Hex | Severity |
|-------|-----|----------|
| `near_miss` | `#6b7280` | lowest |
| `first_aid` | `#d97706` | |
| `recordable` | `#ea580c` | |
| `lost_time` | `#dc2626` | |
| `fatality` | `#7f1d1d` | highest |

**Not to be conflated** — two other "severity" scales are *domain* scales that resolve to
**status** tokens (§2.3), not this incident scale. Document as mappings; leave their code alone:

- JSA hazard `low/medium/high/critical` (`safety/jsa/page.tsx`) → status neutral/warning/danger.
- Framing correction `minor/major/safety` (`framing/page.tsx`) → status neutral/warning/danger.

### 2.5 Trade colors

13-trade color map for schedule/blueprint UI. **Web-only** (mobile has no trade-color UI).
Web home: `web/src/lib/colors.ts`. Two representations:

- `TRADE_COLORS: Record<string,string>` — **hex, canonical** (reactflow node styles, inline chips).
- `TRADE_BADGE_CLASSES: Record<string,string>` — Tailwind badge classes (blueprint review page).

| Trade | `TRADE_COLORS` hex | `TRADE_BADGE_CLASSES` |
|-------|-------------------|-----------------------|
| general | `#64748b` | `bg-slate-100 text-slate-800` |
| civil | `#a16207` | `bg-amber-100 text-amber-800` |
| structural | `#7c3aed` | `bg-violet-100 text-violet-800` |
| concrete | `#6b7280` | `bg-gray-100 text-gray-800` |
| framing | `#b45309` | `bg-orange-100 text-orange-800` |
| roofing | `#dc2626` | `bg-red-100 text-red-800` |
| architectural | `#0891b2` | `bg-cyan-100 text-cyan-800` |
| electrical | `#eab308` | `bg-yellow-100 text-yellow-800` |
| plumbing | `#2563eb` | `bg-blue-100 text-blue-800` |
| hvac | `#0d9488` | `bg-teal-100 text-teal-800` |
| insulation | `#db2777` | `bg-pink-100 text-pink-800` |
| drywall | `#9333ea` | `bg-purple-100 text-purple-800` |
| finishes | `#16a34a` | `bg-green-100 text-green-800` |

`TRADE_BADGE_CLASSES` hues are **reconciled** to the nearest Tailwind family of each
canonical `TRADE_COLORS` hex (F7, 2026-07-10). `structural`=violet and `drywall`=purple are
kept distinct (both were `purple`) since canonical `#7c3aed` is violet and `#9333ea` is purple.
**`TRADE_COLORS` hex remains canonical.**

### 2.6 Web dark mode — IMPLEMENTED

Web now has full light / dark / system theming. How it works:

1. **Tokens** — semantic surface colors are CSS custom properties in `web/src/app/globals.css`:
   `:root` holds the canonical light values, `.dark` overrides them with the **mobile DARK palette**
   (`mobile/src/lib/theme.ts`), so both platforms share one dark surface set. Status tokens are
   var-backed too (dark = brighter fg + translucent bg tints).
2. **Tailwind** — `darkMode: 'class'`; semantic names (`surface`, `app`, `ink`, `muted`, `line`,
   `overlay`, `rail.*`) + `status.*` map to those vars, so `bg-surface`/`text-ink`/`bg-status-*-bg`
   theme automatically.
3. **Toggle** — `web/src/components/theme/theme-provider.tsx` (`useTheme`) = system|light|dark,
   `localStorage`-persisted, follows the OS, toggles `.dark` on `<html>`; a blocking inline script in
   the root layout applies it before paint. Toggle lives in the top bar.

**Consume tokens, not raw grays.** New/migrated UI uses `bg-surface`/`text-ink`/`text-muted`/
`border-line` (and the `@/components/ui` kit, which is already tokenized). Dark-mode *coverage* grows
with page migration — un-migrated pages still using raw `bg-white`/`gray-*` stay light until migrated
(tracked in Appendix A).

---

## 3. Typography Rules

System font stack both platforms (web `antialiased`; RN default). Monospace only for IDs /
error screens.

| Web (Tailwind) | Mobile px | Weight | Use |
|----------------|-----------|--------|-----|
| `text-2xl` | 24 | 600/700 | page titles |
| `text-lg` | 18 | 600 | section headers |
| `text-base` | 16 | 400/500 | body / field labels — **min for field legibility** |
| `text-sm` | 14 | 400/500 | dense tables, secondary |
| `text-xs` | 12 | 500/600 | badges, captions only |

Weights: `medium 500`, `semibold 600`, `bold 700`. **Guardrail:** body text in field-facing
screens ≥ 16px.

> Honest state: mobile typography is **ad hoc today** (sizes 10–40 across screens). This table
> is the **target** — apply it to any screen you touch; full tokenization is backlog (Appendix A).

---

## 4. Component Stylings

### Web — the kit (`web/src/components/ui/`, `web/src/components/charts/`)

**Import from `@/components/ui`.** In-house, zero-dependency, token-driven, accessible. Build new
screens and migrate old ones onto these — don't hand-roll cards/tables/modals/buttons inline.

- **Button** — `primary | secondary | danger | ghost`; `sm/md/lg`; loading spinner; token colors
  (`bg-brand-600`, danger `bg-status-danger hover:bg-status-danger-hover`, `ring-brand-500`).
- **Input / Select / Textarea** — label + error, `border-line bg-surface`, brand focus ring.
- **Badge / StatusPill / StatusDot** — color strictly from §2.3 via `lib/status.ts`.
- **Card / CardHeader**, **PageHeader** (page titles are `text-2xl`), **Table** (`Table/THead/TBody/
  TR/TH/TD` — one header/row style, `overflow-x` wrapper).
- **Modal / SlideOver** — one accessible base (`role="dialog"`, focus trap, Escape, scrim, scroll
  lock, focus restore, portal). **Use this instead of a hand-rolled overlay.**
- **Toast** (`useToast`) + **ConfirmProvider/`useConfirm`** — replace `alert()`/`confirm()`.
- **EmptyState**, **Skeleton/SkeletonRows/Spinner** — replace bare "No data"/"Loading…".
- **KpiTile**, **ProgressBar**, **Tabs**, **Pagination**.
- **Charts** (`@/components/charts`, SVG, theme-aware, no dep): `AreaChart`, `BarChart`,
  `Sparkline`, `Donut`. reactflow/gantt/dnd-kit stay for their specialized views.
- Preview every component (light + dark) at the internal `/design` route.

**Shell** — `Sidebar` (grouped icon nav, collapses to a rail, `bg-rail` tokens) + `TopNav`
(tokenized, theme toggle). Both dark-mode ready.

### Mobile (`mobile/src/`)

No shared UI component library yet (7 components exist — CalendarPicker, ConflictBadge,
NotificationPrefs, ProfileEditor, PunchEditor, RoleGate, WhatsNewModal). Patterns until one lands
(a shared Badge/Button/Card lib is backlog — Appendix A):

- Cards: `palette.surface` on `palette.background` via `useTheme()`.
- Status badges: `statusColor(state)` from `theme.ts` — never a hardcoded status hex.
- Severity chips: `SEVERITY` / `severityColor()` from `theme.ts` (§2.4).
- Only 4/38 screens are `useTheme()`-themed today; theme screens as you touch them.

---

## 5. Layout Principles

8px base — Tailwind scale aligns; mobile matches it.

| Token | px | Use |
|-------|----|----|
| `1` | 4 | tight gaps |
| `2` | 8 | inter-element |
| `3` | 12 | input padding |
| `4` | 16 | card padding, section gaps |
| `6` | 24 | page padding |

**Radius:** inputs/buttons `rounded-md` (6), cards `rounded-lg` (8), badges `rounded-full`.
Mobile radii equal these px.

- **Web** — desktop dashboard: fixed `w-64` sidebar + content. Detail/edit uses the
  **slide-over panel** pattern (Sessions 25–26 standard): row click → GET+PATCH via Next.js proxy.
- **Mobile** — tile grid (`ProjectDetailScreen`) + bottom tab bar; role-filtered per
  `lib/tileManifest.ts`.
- **Tap targets ≥ 48px** on mobile controls.

---

## 6. Depth & Elevation

Flat by default. Shadow **only** on modals, dropdowns, and notification popovers. Mobile modal
scrim = `palette.overlay`. **No gradients** anywhere.

---

## 7. Do's and Don'ts

Timeless rules only (dated snapshot data lives in Appendix A so this list never goes stale).

| Do | Don't |
|----|-------|
| Import status color from §2.3 (`statusColor()` / `status.*`) | Redefine a status color inside a screen |
| Use brand/neutral/status/severity/trade tokens | Inline a raw semantic hex in a component |
| Field-facing body text ≥ 16px; tap targets ≥ 48px | Shrink field text below 16px |
| Keep surfaces flat; shadow only on overlays | Add gradients or decorative shadows |
| Land a change in **both** web + mobile, or state why one is out of scope | Fix one platform silently |
| Respect light/dark/system on mobile (`useTheme()`) | Hardcode a light-only chrome color on mobile |
| Route chrome strings through i18n keys, EN + ES (`.claude/skills/i18n/SKILL.md`) | Hardcode user-facing English |

---

## 8. Responsive Behavior

- **Web** — desktop-first, tablet-aware. Sidebar is `w-16 lg:w-64` (collapses to an icon rail
  below `lg`); detail via slide-overs; wide tables **scroll** (`Table` wraps them in `overflow-x`),
  they don't reflow. KPI/tile grids use `grid-cols-2 lg:grid-cols-4`.
- **Mobile** — safe-area insets via `SafeAreaProvider`; follows system color scheme; bottom tabs
  for one-hand reach; tap targets ≥ 48px.

---

## 9. Agent Prompt Guide

Machine-facing quick reference.

### 9.1 One-line rules (kept **verbatim-in-sync** with `.claude/design-guard.sh`)

- Status colors ONLY from the §2.3 canonical map (`lib/status.ts` on web) — never per screen.
- Incident severity + trade colors ONLY from canonical sources (`theme.ts` / `web/src/lib/colors.ts`).
- Build web UI from the `@/components/ui` kit + semantic tokens (`bg-surface`/`text-ink`/`text-muted`/
  `border-line`) — no raw semantic hex, no raw `bg-white`/`gray-*` on new/migrated screens.
- Field-facing body text ≥ 16px; mobile tap targets ≥ 48px; contrast ≥ WCAG AA.
- Flat surfaces; shadow only on overlays.
- Land changes in BOTH web and mobile, or state why one is out of scope.
- Respect light/dark/system (web `theme-provider.tsx`, mobile `theme-context.tsx`).

### 9.2 Stack mapping (where each token lives)

| Token | Web home | Mobile home |
|-------|----------|-------------|
| Brand + neutrals | `tailwind.config.ts` | `theme.ts` palettes |
| Status | `lib/status.ts` + `status.*` tokens | `theme.ts` `STATUS` / `statusColor()` |
| Severity | `web/src/lib/colors.ts` `SEVERITY` | `theme.ts` `SEVERITY` / `severityColor()` |
| Trade | `web/src/lib/colors.ts` `TRADE_COLORS` / `TRADE_BADGE_CLASSES` | n/a |
| Surface tokens | `globals.css` vars + `tailwind.config.ts` names | `theme.ts` palettes |
| Kit / charts | `web/src/components/ui`, `.../charts` | (per-screen; shared lib is backlog) |
| Type / spacing | Tailwind scale | matched px (target) |
| Theme switching | `theme-provider.tsx` (`useTheme`) | `theme-context.tsx` |

### 9.3 Recipes

- **Add a status state** → edit `STATUS_MAP` in BOTH `mobile/src/lib/theme.ts` and
  `web/src/lib/status.ts` + this doc §2.3. Never map screen-locally.
- **Add an incident severity** → edit `SEVERITY` in BOTH `theme.ts` and `web/src/lib/colors.ts`
  (keep hexes identical) + this doc §2.4.
- **Add / change a trade color** → edit `TRADE_COLORS` (canonical) in `web/src/lib/colors.ts`
  + this doc §2.5. Never a screen-local trade map.

---

## Appendix A — Adoption status & migration backlog

Snapshot **2026-07-10** (web UI redesign page rollout complete, `feat/web-ui-redesign`). This
section holds the dated, will-go-stale facts so §1–9 stay timeless.

**Done (redesign, Hybrid direction)**
- Theme + token infra: CSS-var surface tokens + `.dark` + `theme-provider.tsx` (§2.6 shipped).
- In-house kit (`@/components/ui`) + charts (`@/components/charts`); `lib/status.ts` canonical map;
  `Badge` rewritten on it; `input.tsx` focus ring → brand. Preview at `/design`.
- Shell redesigned (grouped icon sidebar + tokenized top-nav, "The Jobsite" brand).
- **Page-migration rollout COMPLETE (T1–T16, tracker `docs/Web_UI_Redesign_Migration.md`).** Every
  dashboard page is on the kit + tokens: home, projects list/hub, punch-list, reports/profitability,
  financial, documents, cost-codes, connections, vendors, users, people; timecards (board/clock/my/
  review); budget/rfis/submittals/daily-reports; milestones/inspections/contracts/crew-assignments/
  members/time-entries; estimating; schedule/board/overview/timeline (chrome only — graph node
  colors kept); concrete/framing/roofing/hvac; permits; blueprints; files/task-detail; safety
  (project + top-level certs); settings cluster; assets; warranties; misc top-level. `npm run build`
  green. Off-canonical `STATUS_COLORS` maps removed → `lib/status.ts`; hand-rolled slide-overs →
  `SlideOver`; `alert()/confirm()` → `useToast`/`useConfirm`; loading/empty → `Skeleton`/`EmptyState`.

**Leftover follow-ups (small)**
- **`defaultValue`-only i18n strings** — RESOLVED (F1–F6, 2026-07-10, tracker
  `docs/Web_UI_Redesign_Followups.md`). Every `t('key', { defaultValue })` across the dashboard now
  has its key in BOTH `locales/{en,es}` (real ES translations; `defaultValue` args kept as English
  safety nets). Audit clean — no missing-key debt. No safety-string (`safety.json`) copy was
  machine-translated. Re-verify anytime: parse each `t(..,{defaultValue})` and confirm the key exists
  in both locale files for the file's `useTranslation` namespace.
- Graph/node coloring on schedule/board/overview/timeline (reactflow/gantt/dnd `COL_COLORS`/
  `STATUS_COLORS`/`TRADE_COLORS`) is kept literal by design — not a backlog item.

**Trade-color drift** (§2.5) — RESOLVED (F7, 2026-07-10)
- `TRADE_BADGE_CLASSES` reconciled to the nearest Tailwind family of each canonical `TRADE_COLORS`
  hex (civil→amber, architectural→cyan, hvac→teal, insulation→pink, drywall→purple, finishes→green;
  structural→violet to stay distinct from drywall). Renders on the blueprint review page (T8) +
  anywhere `TRADE_BADGE_CLASSES` is used.

**Mobile**
- ~24 screens still hardcode status hexes (6 adopted `statusColor()`); no shared Badge/Button/Card
  lib; typography ad hoc (sizes 10–40); tap-target audit pending.
