#!/usr/bin/env bash
# AHJ inspection result recorded with no signal → reaches the server on reconnect.
#
#   mobile/.maestro/run-permit-result-offline.sh [emulator-5554]
#
# The permit list/detail render from the pull-only cache and the result is written to
# the local `inspections` row; the assertion is made against the SERVER, so it can only
# pass if the batch push delivered a result recorded with the radio off.
#
# Logs in as FOREMAN — the role that actually walks the inspection.
# Requires the seeded permit + milestones (api/src/scripts/seed-e2e-tenant.ts).
set -euo pipefail

SDK="${ANDROID_SDK_ROOT:-$HOME/Android/Sdk}"
export ANDROID_SDK_ROOT="$SDK" ANDROID_HOME="$SDK"
export PATH="$SDK/platform-tools:$HOME/.maestro/bin:$PATH"

cd "$(dirname "$0")"
SERIAL="${1:-}"
ADB=(adb)
[ -n "$SERIAL" ] && ADB=(adb -s "$SERIAL")

API="${E2E_API_URL:-https://api.thejobsite.app}"
UA='jobsite-e2e/1.0'
TENANT='e2e-test'
DOMAIN='e2e.thejobsite.test'   # NB: not the same string as the slug
PASSWORD="${E2E_PASSWORD:?set E2E_PASSWORD - see mobile/.maestro/README.md}"
# NB: the row's meta line is text-transform: capitalize, so "AHJ Inspector" renders as
# "Ahj Inspector" and an exact assert on the typed string fails. Keep the display form
# and the typed form identical. (The value sent to the API is unaffected either way.)
INSPECTOR="Inspector $RANDOM"

reachable() { "${ADB[@]}" shell ping -c1 -W2 8.8.8.8 >/dev/null 2>&1; }
radio() {
  local i
  if [ "$1" = off ]; then
    "${ADB[@]}" shell cmd connectivity airplane-mode enable >/dev/null 2>&1 \
      || { "${ADB[@]}" shell svc wifi disable; "${ADB[@]}" shell svc data disable; }
    for i in $(seq 20); do reachable || return 0; sleep 1; done
    echo "!! device still online after airplane-mode enable" >&2; return 1
  fi
  "${ADB[@]}" shell cmd connectivity airplane-mode disable >/dev/null 2>&1 \
    || { "${ADB[@]}" shell svc wifi enable; "${ADB[@]}" shell svc data enable; }
  for i in $(seq 60); do reachable && return 0; sleep 1; done
  echo "!! device never regained network" >&2; return 1
}

sweep() {
  "${ADB[@]}" shell input keyevent KEYCODE_HOME
  sleep 2
  "${ADB[@]}" shell monkey -p com.thejobsite.app -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1
  sleep "${1:-25}"
}

trap 'radio on || true' EXIT
echo "== inspector name for this run: ${INSPECTOR}"

echo "== 1/3 login as the foreman + pull the permit cache while online"
radio on
maestro test login.yaml -e COMPANY="$TENANT" -e EMAIL="foreman@$DOMAIN" -e PASSWORD="$PASSWORD"
# The cache has to be populated BEFORE the radio goes off — and asserting it here means
# a later offline failure can only be about the offline path, not an empty cache.
maestro test permit-open-online.yaml

echo "== 2/3 record the inspection result with no network"
radio off
maestro test permit-result-offline.yaml -e INSPECTOR="$INSPECTOR"

echo "== 3/3 reconnect, sweep, and confirm the SERVER has the result"
radio on
sweep 30

TOKEN="$(curl -sS -X POST "$API/v1/auth/login" -H "User-Agent: $UA" -H 'Content-Type: application/json' \
  -d "{\"email\":\"owner@$DOMAIN\",\"password\":\"$PASSWORD\",\"tenant_slug\":\"$TENANT\"}" \
  | python3 -c 'import sys,json; print(json.load(sys.stdin)["token"])')"
PROJECT_ID="$(curl -sS "$API/v1/projects?limit=100" -H "User-Agent: $UA" -H "Authorization: Bearer $TOKEN" \
  | python3 -c 'import sys,json; print(next(p["id"] for p in json.load(sys.stdin)["projects"] if p["name"]=="E2E Test Project"))')"

curl -sS "$API/v1/inspections?project_id=$PROJECT_ID&limit=100" -H "User-Agent: $UA" -H "Authorization: Bearer $TOKEN" \
  | INSPECTOR="$INSPECTOR" python3 -c '
import sys, json, os
rows = json.load(sys.stdin)["inspections"]
row = next((r for r in rows if r["title"] == "Rough-In Inspection"), None)
assert row is not None, "seeded milestone missing — re-run seed-e2e-tenant.ts"
assert row["inspector_name"] == os.environ["INSPECTOR"], "result never reached the server: %r" % (row["inspector_name"],)
assert row["result"] == "pass", row["result"]
# The API mirrors result -> status; the screen derives the same thing locally so the dot
# does not lie before the next pull.
assert row["status"] == "passed", row["status"]
print("-- server has the result, status mirrored")
'

echo "== permit result offline round-trip OK (${INSPECTOR})"
