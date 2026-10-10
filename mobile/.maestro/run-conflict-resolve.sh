#!/usr/bin/env bash
# The T-13/T-14 round-trip: an offline edit that loses a race with the server, and the
# worker resolving it field by field.
#
#   mobile/.maestro/run-conflict-resolve.sh [emulator-5554]
#
# A conflict needs two writers, so the harness plays the second one — it PATCHes the
# same inspection through the API while the device is offline holding a stale version.
# That's how conflicts actually happen in the field; simulating one by hand-poking the
# local DB would test the resolve UI without testing the thing that produces its input.
#
#   1. login + create an inspection ONLINE, and let it sync (it needs a server row)
#   2. radio OFF → change status on the device (row goes `pending`, version now stale)
#   3. API PATCH the same row to a DIFFERENT status (server version moves on)
#   4. radio ON → the sweep pushes, gets 409, flags the row `conflict`
#   5. resolve it in the UI: badge → inbox → side-by-side → apply → inbox empty
#
# Roles: inspection status editing is owner/PM/foreman/safety_officer, so the device
# logs in as FOREMAN. The API side acts as the owner — two different people, which is
# also the realistic version of this race.
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
# NB: the tenant SLUG is `e2e-test` but the seeded emails are @e2e.thejobsite.test —
# they are not the same string, and interpolating the slug quietly produces a user
# that doesn't exist (login just fails at the first assertion).
DOMAIN='e2e.thejobsite.test'
PASSWORD="${E2E_PASSWORD:?set E2E_PASSWORD - see mobile/.maestro/README.md}"
TITLE="E2E Conflict $RANDOM"

api() {  # api <method> <path> [json]
  local method="$1" path="$2" body="${3:-}"
  if [ -n "$body" ]; then
    curl -sS -X "$method" "$API/v1$path" -H "User-Agent: $UA" -H 'Content-Type: application/json' \
      ${TOKEN:+-H "Authorization: Bearer $TOKEN"} -d "$body"
  else
    curl -sS -X "$method" "$API/v1$path" -H "User-Agent: $UA" \
      ${TOKEN:+-H "Authorization: Bearer $TOKEN"}
  fi
}

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

sweep() {  # foreground transition = AppState active = runSyncSweep
  "${ADB[@]}" shell input keyevent KEYCODE_HOME
  sleep 2
  "${ADB[@]}" shell monkey -p com.thejobsite.app -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1
  sleep "${1:-25}"
}

trap 'radio on || true' EXIT
echo "== inspection title for this run: ${TITLE}"

echo "== 1/5 login + create the inspection online"
radio on
maestro test login.yaml -e COMPANY="$TENANT" -e EMAIL="foreman@$DOMAIN" -e PASSWORD="$PASSWORD"
maestro test inspection-create.yaml -e TITLE="$TITLE"
sweep 25   # let the create push so the server has a row to conflict with

echo "== 2/5 find it through the API (as the owner)"
TOKEN=""
TOKEN="$(api POST /auth/login "{\"email\":\"owner@$DOMAIN\",\"password\":\"$PASSWORD\",\"tenant_slug\":\"$TENANT\"}" \
  | python3 -c 'import sys,json; print(json.load(sys.stdin)["token"])')"
PROJECT_ID="$(api GET '/projects?limit=100' \
  | python3 -c 'import sys,json; print(next(p["id"] for p in json.load(sys.stdin)["projects"] if p["name"]=="E2E Test Project"))')"
read -r INSP_ID INSP_VER <<<"$(api GET "/inspections?project_id=$PROJECT_ID&limit=100" \
  | TITLE="$TITLE" python3 -c 'import sys,json,os
d=json.load(sys.stdin)["inspections"]
r=next(x for x in d if x["title"]==os.environ["TITLE"])
print(r["id"], r["version"])')"
echo "-- inspection $INSP_ID v$INSP_VER"

echo "== 3/5 device edits it with no network"
radio off
maestro test inspection-status-offline.yaml -e TITLE="$TITLE"

echo "== 4/5 server moves on while the device is offline"
radio on
api PATCH "/inspections/$INSP_ID" "{\"status\":\"failed\",\"version\":$INSP_VER}" >/dev/null
sweep 30   # the device pushes a stale version → 409 → row flagged `conflict`

echo "== 5/5 resolve it in the UI"
maestro test conflict-resolve.yaml -e TITLE="$TITLE"

echo "== conflict round-trip OK (${TITLE})"
