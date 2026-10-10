#!/usr/bin/env bash
# Post-ship E2E smoke: apply the freshly-published OTA on the emulator and run the
# Maestro flows against it.
#
#   scripts/mobile-e2e-smoke.sh [emulator-5554]
#
# WHY POST-SHIP AND NOT A PRE-PUSH GATE
# The E2E runs against the JS bundle the *device* has, and the device gets its bundle
# from the production OTA channel. Before `eas update` runs, the emulator is still on
# the PREVIOUS bundle — so a "gate" here would pass or fail on code you are not about
# to ship, which is worse than no gate at all: it looks like verification and isn't.
#
# So: ship, then verify what actually shipped. If this goes red, roll back by
# republishing the last good update:
#     cd mobile && eas update:list --branch production
#     cd mobile && eas update:republish --group <last-good-group-id>
#
# Requires: a booted emulator with the app installed (scripts/run-emu-capture.sh),
# and the seeded test tenant (api/src/scripts/seed-e2e-tenant.ts).
set -euo pipefail

SDK="${ANDROID_SDK_ROOT:-$HOME/Android/Sdk}"
export ANDROID_SDK_ROOT="$SDK" ANDROID_HOME="$SDK"
export PATH="$SDK/platform-tools:$HOME/.maestro/bin:$PATH"

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SERIAL="${1:-}"
ADB=(adb)
[ -n "$SERIAL" ] && ADB=(adb -s "$SERIAL")

command -v adb >/dev/null || { echo "[e2e] adb not found — skipping."; exit 0; }
command -v maestro >/dev/null || { echo "[e2e] maestro not found — skipping."; exit 0; }
"${ADB[@]}" get-state >/dev/null 2>&1 || { echo "[e2e] no device — skipping (boot one with scripts/run-emu-capture.sh)."; exit 0; }

# expo-updates uses fallbackToCacheTimeout: 0 — the launch that DOWNLOADS an update
# still runs the cached bundle, so the new one only takes effect on the NEXT launch.
# Two cycles, or the smoke tests the code you just replaced.
echo "[e2e] applying OTA (two launches)…"
for _ in 1 2; do
  "${ADB[@]}" shell am force-stop com.thejobsite.app
  sleep 2
  "${ADB[@]}" shell monkey -p com.thejobsite.app -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1
  sleep 18
done

cd "$REPO_ROOT/mobile/.maestro"
fail=0
maestro test login.yaml -e COMPANY=e2e-test -e EMAIL=field_tech@e2e.thejobsite.test -e PASSWORD="${E2E_PASSWORD:?set E2E_PASSWORD - see mobile/.maestro/README.md}" || fail=1
maestro test project-tiles.yaml || fail=1
./run-offline-sync.sh ${SERIAL:+"$SERIAL"} || fail=1
./run-conflict-resolve.sh ${SERIAL:+"$SERIAL"} || fail=1
./run-jsa-offline.sh ${SERIAL:+"$SERIAL"} || fail=1
./run-permit-result-offline.sh ${SERIAL:+"$SERIAL"} || fail=1
./run-concrete-test-offline.sh ${SERIAL:+"$SERIAL"} || fail=1
./run-structural-qa-offline.sh ${SERIAL:+"$SERIAL"} || fail=1
./run-trade-circuit-offline.sh ${SERIAL:+"$SERIAL"} || fail=1

if [ "$fail" = 0 ]; then
  echo "[e2e] ✓ all flows green against the shipped bundle."
else
  echo "[e2e] ✗ FLOWS RED against the SHIPPED bundle — consider republishing the last good update."
fi
exit "$fail"
