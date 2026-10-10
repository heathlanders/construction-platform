#!/usr/bin/env bash
# Concrete QA test recorded with no signal → reaches the server on reconnect.
#
#   mobile/.maestro/run-concrete-test-offline.sh [emulator-5554]
#
# Same shape as run-offline-sync.sh: the harness owns the radio, the flow does the
# capture, and the assertion is made against the SERVER (via the API, as the owner) —
# a local-only check would pass even if the push never happened.
#
# Logs in as FOREMAN — the role standing at the pour when the slump cone comes off.
# Requires the seeded pour (api/src/scripts/seed-e2e-tenant.ts).
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
# 1.0–9.9 inches: a plausible slump, and unique enough per run that a stale row can't
# make the assertion pass.
MEASURED="$(awk -v s="$RANDOM" 'BEGIN{srand(s);printf "%.1f", 1+rand()*8.9}')"
# Identity comes from the SAMPLE ID, not the reading. Slump is measured to a tenth of an
# inch, so there are ~90 possible values and a run can match a PREVIOUS run's row by
# coincidence — which it did (two runs both produced 6.8). A sample id is unique per run
# and is what a real cylinder set carries anyway.
SAMPLE="E2E-$RANDOM"

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
echo "== slump for this run: ${MEASURED} in (sample ${SAMPLE})"

echo "== 1/3 login as the foreman + prime the pour cache while online"
radio on
maestro test login.yaml -e COMPANY="$TENANT" -e EMAIL="foreman@$DOMAIN" -e PASSWORD="$PASSWORD"
maestro test concrete-open-online.yaml

echo "== 2/3 record the slump test with no network"
radio off
maestro test concrete-test-offline.yaml -e MEASURED="$MEASURED" -e SAMPLE="$SAMPLE"

echo "== 3/3 reconnect, sweep, and confirm the SERVER has the test"
radio on
sweep 30

TOKEN="$(curl -sS -X POST "$API/v1/auth/login" -H "User-Agent: $UA" -H 'Content-Type: application/json' \
  -d "{\"email\":\"owner@$DOMAIN\",\"password\":\"$PASSWORD\",\"tenant_slug\":\"$TENANT\"}" \
  | python3 -c 'import sys,json; print(json.load(sys.stdin)["token"])')"
PROJECT_ID="$(curl -sS "$API/v1/projects?limit=100" -H "User-Agent: $UA" -H "Authorization: Bearer $TOKEN" \
  | python3 -c 'import sys,json; print(next(p["id"] for p in json.load(sys.stdin)["projects"] if p["name"]=="E2E Test Project"))')"
POUR_ID="$(curl -sS "$API/v1/concrete-pours?project_id=$PROJECT_ID&limit=100" -H "User-Agent: $UA" -H "Authorization: Bearer $TOKEN" \
  | python3 -c 'import sys,json; print(json.load(sys.stdin)["concrete_pours"][0]["id"])')"

curl -sS "$API/v1/concrete-test-records?pour_id=$POUR_ID&limit=100" -H "User-Agent: $UA" -H "Authorization: Bearer $TOKEN" \
  | MEASURED="$MEASURED" SAMPLE="$SAMPLE" python3 -c '
import sys, json, os
rows = json.load(sys.stdin)["concrete_test_records"]
row = next((r for r in rows if r.get("sample_id") == os.environ["SAMPLE"]), None)
assert row is not None, "test never reached the server (sample ids seen: %r)" % ([r.get("sample_id") for r in rows],)
want = float(os.environ["MEASURED"])
assert abs(float(row["measured_value"]) - want) < 0.001, row["measured_value"]
assert row["test_type"] == "slump", row["test_type"]
# The unit is implied by the test type on the device, so this proves that mapping too.
assert row["unit"] == "in", row["unit"]
print("-- server has the slump test, unit intact")
'

echo "== concrete QA test offline round-trip OK (${MEASURED} in, ${SAMPLE})"
