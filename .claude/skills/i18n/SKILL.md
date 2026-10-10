# i18n / Internationalization Skill
**Locked decisions: A-13, P-09, T-08, T-09**

## Languages at v1.0 launch
- English (EN) — primary
- Spanish (ES) — **required at v1.0, not optional**

Background: 31% of US construction workforce is Hispanic/Latino.
86% of foreign-born construction workers speak Spanish at home.
Multilingual safety training reduces jobsite incidents by 25%.

## Library (locked)
`react-i18next` — same library on both web (Next.js) and mobile (React Native).
Same key namespace across both platforms — maximum code sharing.

## Locale resolution order (T-09)
1. User's saved preference (from their profile settings)
2. Browser/device locale
3. English fallback

Never auto-detect locale only — always check saved preference first.

## Translation file structure
```
/locales/
  en/
    common.json
    projects.json
    financial.json
    safety.json      ← professional translation required
    field.json
    trade-electrical.json
    trade-plumbing.json
  es/
    common.json
    projects.json
    financial.json
    safety.json      ← professional translation required
    field.json
    trade-electrical.json
    trade-plumbing.json
```

## Safety content rule (T-08)
Safety-related strings (hazard warnings, emergency procedures, PPE instructions)
MUST use professional human translation.
Machine translation or AI translation is PROHIBITED for safety content.
Safety strings live in `safety.json` — flag any new safety strings for human review.

## Usage pattern
```typescript
// React component
import { useTranslation } from 'react-i18next';

const { t } = useTranslation('projects');
return <h1>{t('project.title')}</h1>;

// With interpolation
return <p>{t('project.member_count', { count: members.length })}</p>;
```

## Never hardcode user-facing strings
All user-visible text must go through `t()`.
No hardcoded English strings in component JSX.
Use translation key extraction tooling to catch missing keys pre-deploy.

## `defaultValue` is a fallback, NOT a substitute for an ES key
`t('x.y', { defaultValue: 'Foo' })` renders `Foo` in **every** language when `x.y`
is missing — so a page built only with `defaultValue` looks "untranslated" in Spanish
even though it compiles and runs. Every new `t()` key MUST be added to BOTH
`locales/en/*.json` AND `locales/es/*.json`. `defaultValue` is only an English safety net
for a missing key, never the Spanish source.

Quick audit: `grep -ro "t('[a-z_.]*'" web/src | ...` vs keys present in `es/*.json`.
(Web bug fixed Session 33: the Overview page shipped with `defaultValue`-only keys → no ES.)

**Namespace-aware audit (the real debt check).** A bare `grep defaultValue` counts *occurrences*,
not debt — a `defaultValue` whose key is already in both locales is just a redundant safety net.
To find actual missing-key debt: for each `t(..,{defaultValue})`, resolve the namespace from the
file's `useTranslation('<ns>')` (respecting aliases like `const { t: tc } = useTranslation('common')`)
and check the key exists in BOTH `locales/{en,es}/<ns>.json`. Script this (parse the calls + the hook
aliases per file, walk the dotted key path). **As of the F1–F7 followups (2026-07-10) the web
dashboard is fully keyed — this audit is clean.** See memory `web_ui_redesign` + `docs/Web_UI_Redesign_Followups.md`.

## Translate chrome via keys; data is a separate problem
UI chrome (labels, buttons, headers, legends, enum display) → `t()` keys in both locales,
including maps like `phase_labels`/`status_labels` for values rendered from enums.
**Data rows are NOT translated by i18n** — DB content (blueprint task titles, trade names,
vendor names) renders as stored. Blueprint task titles come from English-only template libs;
their ES translation is a v1.1 data task (translate the template libs or at render time).
A blueprint-driven screen is therefore legitimately "Spanish chrome + English data" until then.

## Storing user language preference
```sql
-- In users table
language_preference  CHAR(2) DEFAULT 'en'  -- ISO 639-1 code
```

## ⚠️ Augmenting a `resources` literal: parent must exist (crash at bundle load)
Mobile `mobile/src/lib/i18n.ts` builds the `resources` object literal, then appends keys after it
(`(resources.en as any).projects['actions.permits'] = …`). If you write a **nested** path whose parent
isn't in the literal, you assign onto `undefined` → `TypeError: Cannot set property 'x' of undefined`,
thrown at **top-level module eval before React mounts** — uncatchable by the JS ErrorBoundary and NOT
caught by `expo export` (bundles fine, dies on execution). This took down the first mobile build
(2026-06-20).
- The mobile `projects` namespace stores action keys **flat** (`'actions.log_time'`, `'actions.permits'`)
  — there is no `actions:{}` object. Augment with `projects['actions.x']`, never `projects.actions.x`.
- `common.nav.x` IS safe — `common.nav` is a real nested object in the literal.
- Rule: before `a.b.c = …`, confirm `a.b` exists in the literal, or use a flat bracket key matching the
  surrounding namespace's convention.
