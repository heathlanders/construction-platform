# Maestro E2E flows (Mobile Enterprise Plan §C3)

Runs against the **installed APK** on the KVM emulator, hitting the real API
(`api.thejobsite.app`, which tunnels to this box's Docker stack).

## Setup

```bash
# 1. seed the disposable test tenant + one user per role (§C4, idempotent)
cd api && npx tsx --require dotenv/config src/scripts/seed-e2e-tenant.ts

# 2. boot the emulator + install the current APK
scripts/run-emu-capture.sh

# 3. run a flow
export PATH="$HOME/.maestro/bin:$PATH"
maestro test mobile/.maestro/login.yaml
```

## Notes

- **Accounts:** tenant `e2e-test`, password from `E2E_PASSWORD`
  (kept outside the repo; export it before running a flow or the seed), one user per role
  (`owner@`, `field_tech@`, … `@e2e.thejobsite.test`). Re-running the seed resets
  passwords, so a flow never fails because of drift.
- **The APK bakes its API URL at build time** (`eas.json` → `EXPO_PUBLIC_API_URL`),
  so flows exercise the production-channel bundle against the live stack. There is
  no local-API build profile yet.
- `clearState` first in every flow — a leftover token silently skips the login
  screen and the assertions then test nothing. It also wipes the What's-New
  last-seen marker, so a fresh login lands on the release-notes popup first;
  flows dismiss it with an `optional: true` tap.
- **Select inputs by their placeholder text**, not by coordinate. RN renders the
  placeholder as a real text node while the field is empty. A coordinate tap once
  typed the email into the *company* field and every step still reported
  `COMPLETED` — only the final assertion caught it.

## Offline → reconnect → sync

```bash
mobile/.maestro/run-offline-sync.sh          # or: … run-offline-sync.sh emulator-5554
```

Maestro can't toggle the radio, so the flip lives in the shell harness and the
flows are split around it: `login.yaml` (online) → `offline-log-time.yaml` (radio
off, entry written to WatermelonDB only) → `verify-time-synced.yaml` (radio back
on, foreground transition runs the sweep).

The assertion is deliberately on a **server-rendered** row: Today's Entries comes
from `GET /v1/time-entries`, so the hours can only appear there if the batch push
actually delivered a record that was created with no network. The value is
randomised per run — with a fixed one, a second run on the same day would find
the first run's entry already on screen and pass without testing anything.

Airplane mode is restored on any exit (`trap`); inheriting an offline emulator
next session is a confusing failure to debug.

## Selector traps (each of these cost a run)

- **A text selector matches the WHOLE node, not a substring.** `assertVisible: 'Inspector 42'`
  fails against `"• No Date Set · Inspector 42 · Pass"` — use `.*Inspector 42.*`.
- **RN `text-transform: capitalize` changes what's on screen**, so `AHJ Inspector`
  renders as `Ahj Inspector`. Keep the typed and displayed forms identical, or match loosely.
- **A repeated button needs an anchor.** Every milestone row has `Record result`; a bare
  `tapOn` takes the first one and silently records against the wrong inspection. Use
  `below: {text: '<row title>'}`.
- **`inputText` APPENDS into a pre-filled field, and `eraseText` clears only 50 chars by
  default.** An edit form that pre-fills from the record (correct behaviour) turned repeat
  runs into `"Inspector 11126Inspector 17134…"`. Use `eraseText: 200` before typing. The
  first run passes either way, which is what makes it a trap.
- **`clearState` also drops the downloaded OTA bundle**, so the app spends its next launch
  re-downloading it. A fixed sleep after login raced that and cut the radio before the first
  pull ran — the priming step has to ASSERT the cached row is on screen, not just wait.
- **A seed that writes straight to the DB skips the API's validation.** The framing seed used
  `section: 'walls'`, which isn't in the route's enum — the card rendered the raw i18n key
  `section_walls`, i.e. the seed manufactured a state the app cannot label. Seed values must be
  ones the API would have accepted.
- **Randomise an IDENTIFIER, not a measurement.** Slump is read to a tenth of an inch — ~90
  possible values — so a "randomised" run matched a previous run's row by coincidence (two runs
  both produced 6.8). Identity comes from a per-run sample id; the measurement is then asserted
  against that row.
- **Prime a read cache while online before cutting the radio.** `clearState` wipes the
  local DB, so an offline-first assertion straight after login tests an empty cache, not
  the offline path.
