#!/usr/bin/env bash
# Offline → reconnect → sync, end to end on a real device/emulator.
#
#   mobile/.maestro/run-offline-sync.sh [emulator-5554]
#
# Maestro cannot toggle the radio, so the network flip lives here and the flows are
# split around it. Three phases:
#
#   1. login.yaml            — online, clean state
#   2. offline-log-time.yaml — radio OFF; the entry is written to WatermelonDB only
#   3. verify-time-synced.yaml — radio back ON; foreground transition runs the sweep,
#                                and the value is asserted from a SERVER-rendered row
#
# The hours value is randomised per run. With a fixed value, a second run on the same
# day would find the first run's synced entry already on screen and pass without ever
# testing anything.
set -euo pipefail

# Same SDK bootstrap as scripts/run-emu-capture.sh — neither adb nor maestro is on
# PATH in a plain shell on this box.
SDK="${ANDROID_SDK_ROOT:-$HOME/Android/Sdk}"
export ANDROID_SDK_ROOT="$SDK" ANDROID_HOME="$SDK"
export PATH="$SDK/platform-tools:$HOME/.maestro/bin:$PATH"

cd "$(dirname "$0")"
SERIAL="${1:-}"
ADB=(adb)
[ -n "$SERIAL" ] && ADB=(adb -s "$SERIAL")

# 1.01 – 9.99, two decimals, matching the row renderer's toFixed(2)
HOURS="$(awk -v s="$RANDOM" 'BEGIN{srand(s);printf "%.2f", 1.01+rand()*8.9}')"
echo "== hours for this run: ${HOURS}"

reachable() { "${ADB[@]}" shell ping -c1 -W2 8.8.8.8 >/dev/null 2>&1; }

# Wait for the state to be REAL, don't sleep and hope. Coming out of airplane mode the
# Wi-Fi takes several seconds to re-associate, and a sweep that fires in that window
# just fails and waits out the next 3-minute interval — which reads as "sync is broken".
radio() {  # radio on|off
  local i
  if [ "$1" = off ]; then
    "${ADB[@]}" shell cmd connectivity airplane-mode enable >/dev/null 2>&1 \
      || { "${ADB[@]}" shell svc wifi disable; "${ADB[@]}" shell svc data disable; }
    for i in $(seq 20); do reachable || return 0; sleep 1; done
    echo "!! device still has network after airplane-mode enable" >&2; return 1
  fi
  "${ADB[@]}" shell cmd connectivity airplane-mode disable >/dev/null 2>&1 \
    || { "${ADB[@]}" shell svc wifi enable; "${ADB[@]}" shell svc data enable; }
  for i in $(seq 60); do reachable && return 0; sleep 1; done
  echo "!! device never regained network" >&2; return 1
}

# Airplane mode must come back on ANY exit — leaving a dev emulator offline is a
# confusing failure to inherit next session.
trap 'radio on || true' EXIT

echo "== 1/3 login (online)"
radio on
maestro test login.yaml -e COMPANY=e2e-test -e EMAIL=field_tech@e2e.thejobsite.test -e PASSWORD="${E2E_PASSWORD:?set E2E_PASSWORD - see mobile/.maestro/README.md}"

echo "== 2/3 log time with no network"
radio off
maestro test offline-log-time.yaml -e HOURS="$HOURS"

echo "== 3/3 reconnect + verify the row came back from the server"
radio on

# The sweep fires on AppState → active and otherwise only every 3 minutes, and the
# push is async — so foreground the app, give it room, then check. Retry a few times
# rather than picking one magic sleep: the first sweep after reconnect can still land
# mid-reassociation.
ok=0
for attempt in 1 2 3 4; do
  echo "-- verify attempt ${attempt}"
  "${ADB[@]}" shell input keyevent KEYCODE_HOME
  sleep 2
  "${ADB[@]}" shell monkey -p com.thejobsite.app -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1
  sleep 25   # let the sweep push before we look
  if maestro test verify-time-synced.yaml -e HOURS="$HOURS"; then ok=1; break; fi
done
[ "$ok" = 1 ] || { echo "!! offline entry never reached the server"; exit 1; }

echo "== offline sync round-trip OK (${HOURS}h)"
