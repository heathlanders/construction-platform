#!/usr/bin/env bash
# JSA captured with no signal → reaches the server on reconnect.
#
#   mobile/.maestro/run-jsa-offline.sh [emulator-5554]
#
# Same shape as run-offline-sync.sh: the harness owns the radio, the flow does the
# capture, and the assertion is made against the SERVER (via the API, as the owner) —
# a local-only check would pass even if the push never happened.
#
# Logs in as SAFETY_OFFICER: the JSA is their artifact, and it also exercises the tile
# gate for a role whose mobile surface was empty until now.
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
TITLE="E2E JSA $RANDOM"

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
echo "== JSA title for this run: ${TITLE}"

echo "== 1/3 login as the safety officer"
radio on
maestro test login.yaml -e COMPANY="$TENANT" -e EMAIL="safety_officer@$DOMAIN" -e PASSWORD="$PASSWORD"

echo "== 2/3 capture the JSA with no network"
radio off
maestro test jsa-offline.yaml -e TITLE="$TITLE"

echo "== 3/3 reconnect, sweep, and confirm the SERVER has it"
radio on
sweep 30

TOKEN="$(curl -sS -X POST "$API/v1/auth/login" -H "User-Agent: $UA" -H 'Content-Type: application/json' \
  -d "{\"email\":\"owner@$DOMAIN\",\"password\":\"$PASSWORD\",\"tenant_slug\":\"$TENANT\"}" \
  | python3 -c 'import sys,json; print(json.load(sys.stdin)["token"])')"
PROJECT_ID="$(curl -sS "$API/v1/projects?limit=100" -H "User-Agent: $UA" -H "Authorization: Bearer $TOKEN" \
  | python3 -c 'import sys,json; print(next(p["id"] for p in json.load(sys.stdin)["projects"] if p["name"]=="E2E Test Project"))')"

curl -sS "$API/v1/jsa-records?project_id=$PROJECT_ID&limit=100" -H "User-Agent: $UA" -H "Authorization: Bearer $TOKEN" \
  | TITLE="$TITLE" python3 -c '
import sys, json, os
rows = json.load(sys.stdin)["jsa_records"]
row = next((r for r in rows if r["title"] == os.environ["TITLE"]), None)
assert row is not None, "JSA never reached the server"
# The whole point is that the JSONB payload survived the local JSON-TEXT round trip.
hz = row["hazards"]; at = row["attendees"]
assert len(hz) == 1, "hazards lost in transit: %r" % (hz,)
assert hz[0]["severity"] == "high", hz[0]
assert len(at) == 1, "attendees lost in transit: %r" % (at,)
print("-- server has it, with hazards + attendees intact")
'

echo "== JSA offline round-trip OK (${TITLE})"
