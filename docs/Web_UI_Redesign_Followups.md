# Web UI Redesign — Follow-up Tracker

> **One task = one session.** Pick the top unchecked task, do it, verify, commit, check the box, stop.
> Branch: **`feat/web-ui-redesign-followups`** — cut it fresh from `main` AFTER PR #5 merges
> (`git checkout main && git pull && git checkout -b feat/web-ui-redesign-followups`). If PR #5 has
> not merged yet, branch from `feat/web-ui-redesign` instead and note it.
>
> These are the two leftovers from the T1–T16 page rollout (see `Web_UI_Redesign_Migration.md`
> closeout + `DESIGN.md` Appendix A): **(A) i18n** — replace `defaultValue`-only chrome strings with
> real EN+ES keys, and **(B) trade-color drift** — reconcile `TRADE_BADGE_CLASSES` to `TRADE_COLORS`.

## Background

The T1–T16 migrations introduced new chrome strings as `t('key', { defaultValue: 'English' })`
instead of editing `web/locales/{en,es}/*.json` — deliberate, to avoid parallel-agent JSON
collisions. A `defaultValue` renders its English text in **every** language when the key is missing
from the locale files (i18n skill §"`defaultValue` is a fallback, NOT a substitute"). So any such key
missing from `es/*.json` shows English to Spanish users.

**Snapshot (2026-07-10): 256 `defaultValue` occurrences across 32 files.** Not all are debt — a
`defaultValue` whose key already exists in BOTH `en` and `es` is just a redundant safety net (leave
it or drop the arg). The debt is the keys **missing** from the locale JSON.

## Per-session workflow

1. `cd web`. Dev server for eyeballing (optional): `COOKIE_SECURE=false API_URL=http://localhost:3000 npx next dev -p 3002`. Don't `npm run build` while it's up.
2. For each page in the task: list its `t('ns:...' | 'key', { defaultValue })` calls. Determine the **namespace** from `useTranslation('<ns>')` at the top of the file.
3. For each key: check whether it already exists in `web/locales/en/<ns>.json` AND `web/locales/es/<ns>.json`.
   - **Present in both** → drop the now-redundant `defaultValue` arg (optional tidy) and move on.
   - **Missing** → add the key to **both** `en/<ns>.json` (the English text = the current defaultValue) and `es/<ns>.json` (a real Spanish translation). Then remove the `defaultValue` from the call, OR keep it as an English safety net — but the ES key MUST exist.
4. **Safety strings** (`safety.json`, and any hazard/PPE/emergency wording): professional human
   translation only — DO NOT machine-translate (T-08). If a task surfaces safety strings, add the EN
   key + flag the ES value for human review (leave a `// TODO human-translate` note in the PR / commit
   body); do not invent Spanish safety copy.
5. Verify: `npx tsc --noEmit` clean. **Locale parity** — every key you touched exists in both files.
   Quick check per namespace: `node -e "const en=require('./locales/en/<ns>.json'),es=require('./locales/es/<ns>.json');const f=(o,p='')=>Object.entries(o).flatMap(([k,v])=>v&&typeof v==='object'?f(v,p+k+'.'):[p+k]);const ek=f(en),sk=new Set(f(es));console.log('missing in es:',ek.filter(k=>!sk.has(k)))"` → should print `[]`. Eyeball a migrated page in ES (`?lng=es` or the profile language toggle).
6. Commit: `i18n(web): real EN+ES keys for <area> (F#)`. Check the box.

## Tasks (top = highest traffic / biggest debt)

- [x] **F1 — Timecards / field namespace.** `timecards/{page(review-client),board,clock,my}.tsx` + `projects/[id]/time-entries/{page,new}.tsx`. ns = `field`. ~30 defaultValue strings. (These are the T1 cluster + T3 time-entries.) Add to `field.json` EN+ES.
- [x] **F2 — Schedule / graph pages.** `projects/[id]/{overview,board,schedule,timeline}/page.tsx`. ns = `projects` (the `overview`/`schedule` blocks). **Biggest: ~88 strings** (overview 29, board 25, schedule 18, timeline 16). Many are phase/status chrome that may reuse existing `overview.phase_labels`/`status_labels` — check before adding new keys. Split into two commits if needed.
- [x] **F3 — Contracts / financial.** `projects/[id]/contracts/{page,new}.tsx` + `estimating/[bid_package_id]/page.tsx`. ns likely `financial` (+ `projects`). ~47 strings. Money labels — keep cents formatting untouched, only translate labels.
- [x] **F4 — Field ops (project).** `projects/[id]/{milestones/page, milestones/new, inspections/page, inspections/new, members, crew-assignments, time-entries/new}.tsx`. ns = `projects`. ~37 strings. (time-entries list is in F1; new form here or move to F1 — either.)
- [x] **F5 — Settings + warranties + connections + top-level forms.** `settings/page.tsx` (9), `warranties/{[id]/claims/[claimId],templates,insurance}/page.tsx` (5), `connections/[id]/page.tsx` (2), `projects/new/page.tsx` (2), `projects/[id]/page.tsx` (4), `blueprints/{page,review}` (3). Mixed ns (`settings`/`warranties`/`projects`/`common`). ~25 strings.
- [x] **F6 — Pre-existing defaultValue cleanup (optional / low priority).** `projects/[id]/{punch-list(19),trade(1),roofing(1)}/page.tsx` + `design/page.tsx(2)`. These predate T1–T16 (earlier redesign slices). Same treatment; lower traffic. `design` is the kit preview — can stay English.
- [x] **F7 — Trade-color drift reconciliation.** Reconcile `web/src/lib/colors.ts` `TRADE_BADGE_CLASSES` to the canonical `TRADE_COLORS` hues on the 6 drifting trades (civil, architectural, hvac, insulation, drywall, finishes). This is a **deliberate visual change** — eyeball the blueprint review page (T8) + anywhere `TRADE_BADGE_CLASSES` renders, in light + dark. Update `DESIGN.md` §2.5 + Appendix A when done. No i18n involved.

## Notes / gotchas

- **Namespace discovery:** the `t()` first arg may be bare (`t('foo')`) using the file's
  `useTranslation('<ns>')` default, or explicit (`t('common:cancel')`). Check the hook call at the
  top of each file. Common shared keys (`common.cancel`, `common.total`, `common.edit`,
  `common.dismiss`) likely belong in `common.json` — add once, reuse.
- **Don't regress the graph coloring** (F2): overview/board/schedule/timeline keep their
  reactflow/gantt/dnd node colors — you're only translating chrome text, not touching color.
- **Audit command** to re-scope anytime: `grep -rc "defaultValue" web/src/app | grep -v ':0' | sort -t: -k2 -rn`.
- After all boxes checked: drop this file's backlog note from `DESIGN.md` Appendix A, run
  `npm run build`, and (if on a separate branch) open a PR → `main`.

*Created 2026-07-10 — closeout of the T1–T16 web UI redesign page rollout.*
