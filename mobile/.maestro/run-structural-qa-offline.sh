#!/usr/bin/env bash
# Roofing QA + framing correction recorded with no signal → both reach the server.
#
#   mobile/.maestro/run-structural-qa-offline.sh [emulator-5554]
#
# Two surfaces in ONE offline window: another full login cycle per surface would add
# minutes to every smoke run for no extra signal.
#
# Same shape as run-offline-sync.sh: the harness owns the radio, the flow does the
# capture, and the assertion is made against the SERVER (via the API, as the owner) —
# a local-only check would pass even if the push never happened.
#
# Logs in as FOREMAN. Requires the seeded roof system + framing inspection
# (api/src/scripts/seed-e2e-tenant.ts).
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
# Identity by a per-run value in each record: a pull-out load in lbf, and the
# correction text. (Randomise an identifier, not a measurement — see the concrete flow.)
PULL="$((150 + RANDOM % 400))"
CORRECTION="Missing tie $RANDOM"

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
echo "== this run: pull ${PULL} lbf · correction \"${CORRECTION}\""

echo "== 1/3 login as the foreman + prime the roofing/framing caches while online"
radio on
maestro test login.yaml -e COMPANY="$TENANT" -e EMAIL="foreman@$DOMAIN" -e PASSWORD="$PASSWORD"
maestro test structural-open-online.yaml

echo "== 2/3 record a roofing check + a framing correction with no network"
radio off
maestro test structural-qa-offline.yaml -e PULL="$PULL" -e CORRECTION="$CORRECTION"

echo "== 3/3 reconnect, sweep, and confirm the SERVER has both"
radio on
sweep 30

TOKEN="$(curl -sS -X POST "$API/v1/auth/login" -H "User-Agent: $UA" -H 'Content-Type: application/json' \
  -d "{\"email\":\"owner@$DOMAIN\",\"password\":\"$PASSWORD\",\"tenant_slug\":\"$TENANT\"}" \
  | python3 -c 'import sys,json; print(json.load(sys.stdin)["token"])')"
PROJECT_ID="$(curl -sS "$API/v1/projects?limit=100" -H "User-Agent: $UA" -H "Authorization: Bearer $TOKEN" \
  | python3 -c 'import sys,json; print(next(p["id"] for p in json.load(sys.stdin)["projects"] if p["name"]=="E2E Test Project"))')"
SYS_ID="$(curl -sS "$API/v1/roofing-systems?project_id=$PROJECT_ID&limit=100" -H "User-Agent: $UA" -H "Authorization: Bearer $TOKEN" \
  | python3 -c 'import sys,json; print(json.load(sys.stdin)["roofing_systems"][0]["id"])')"
INSP_ID="$(curl -sS "$API/v1/framing-inspections?project_id=$PROJECT_ID&limit=100" -H "User-Agent: $UA" -H "Authorization: Bearer $TOKEN" \
  | python3 -c 'import sys,json; print(json.load(sys.stdin)["framing_inspections"][0]["id"])')"

curl -sS "$API/v1/roofing-qa-records?roofing_system_id=$SYS_ID&limit=100" -H "User-Agent: $UA" -H "Authorization: Bearer $TOKEN" \
  | PULL="$PULL" python3 -c '
import sys, json, os
rows = json.load(sys.stdin)["roofing_qa_records"]
want = float(os.environ["PULL"])
row = next((r for r in rows if r["measured_value"] is not None and abs(float(r["measured_value"]) - want) < 0.001), None)
assert row is not None, "roofing check never reached the server: %r" % ([r["measured_value"] for r in rows],)
assert row["qa_type"] == "fastener_pull", row["qa_type"]
# The unit is attached on the device for this test type only — this proves that rule.
assert row["unit"] == "lbf", row["unit"]
print("-- server has the roofing check")
'

curl -sS "$API/v1/framing-correction-items?framing_inspection_id=$INSP_ID&limit=100" -H "User-Agent: $UA" -H "Authorization: Bearer $TOKEN" \
  | CORRECTION="$CORRECTION" python3 -c '
import sys, json, os
rows = json.load(sys.stdin)["framing_correction_items"]
row = next((r for r in rows if r["description"] == os.environ["CORRECTION"]), None)
assert row is not None, "correction never reached the server"
assert row["severity"] == "major", row["severity"]
assert row["status"] == "open", row["status"]
print("-- server has the framing correction")
'

echo "== structural QA offline round-trip OK (${PULL} lbf, ${CORRECTION})"
