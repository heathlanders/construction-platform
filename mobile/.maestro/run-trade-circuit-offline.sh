#!/usr/bin/env bash
# Circuit status flipped with no signal → reaches the server on reconnect.
#
#   mobile/.maestro/run-trade-circuit-offline.sh [emulator-5554]
#
# This edit used to ride the upload queue, where a 409 is a server verdict and the change
# is dropped. It now goes through the sync path, so this flow also guards that move.
#
# Same shape as run-offline-sync.sh: the harness owns the radio, the flow does the
# capture, and the assertion is made against the SERVER (via the API, as the owner) —
# a local-only check would pass even if the push never happened.
#
# Logs in as FOREMAN. Requires the seeded panel + circuit (seed-e2e-tenant.ts).
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
# No per-run value here: the circuit is seeded at `planned` and this flips it to
# `roughed_in`, so the assertion is the STATE CHANGE itself. The harness resets the
# circuit to planned first — otherwise a rerun asserts a status the PREVIOUS run set
# and would pass even if nothing synced.

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
echo "== flipping circuit 12: planned → roughed_in"

RESET_SQL="UPDATE electrical_circuits c SET status='planned' FROM tenants t WHERE t.id=c.tenant_id AND t.slug='e2e-test';"
(cd "$(dirname "$0")/../.." && docker compose exec -T postgres psql -U postgres -d platform_dev -c "$RESET_SQL") >/dev/null 2>&1 || true

echo "== 1/3 login as the foreman + prime the electrical cache while online"
radio on
maestro test login.yaml -e COMPANY="$TENANT" -e EMAIL="foreman@$DOMAIN" -e PASSWORD="$PASSWORD"
maestro test trade-open-online.yaml

echo "== 2/3 flip the circuit status with no network"
radio off
maestro test trade-circuit-offline.yaml

echo "== 3/3 reconnect, sweep, and confirm the SERVER took the status"
radio on
sweep 30

TOKEN="$(curl -sS -X POST "$API/v1/auth/login" -H "User-Agent: $UA" -H 'Content-Type: application/json' \
  -d "{\"email\":\"owner@$DOMAIN\",\"password\":\"$PASSWORD\",\"tenant_slug\":\"$TENANT\"}" \
  | python3 -c 'import sys,json; print(json.load(sys.stdin)["token"])')"
PROJECT_ID="$(curl -sS "$API/v1/projects?limit=100" -H "User-Agent: $UA" -H "Authorization: Bearer $TOKEN" \
  | python3 -c 'import sys,json; print(next(p["id"] for p in json.load(sys.stdin)["projects"] if p["name"]=="E2E Test Project"))')"
PANEL_ID="$(curl -sS "$API/v1/electrical-panels?project_id=$PROJECT_ID&limit=100" -H "User-Agent: $UA" -H "Authorization: Bearer $TOKEN" \
  | python3 -c 'import sys,json; print(json.load(sys.stdin)["electrical_panels"][0]["id"])')"

curl -sS "$API/v1/electrical-circuits?panel_id=$PANEL_ID&limit=100" -H "User-Agent: $UA" -H "Authorization: Bearer $TOKEN" \
  | python3 -c '
import sys, json
rows = json.load(sys.stdin)["electrical_circuits"]
row = next((r for r in rows if r["circuit_number"] == 12), None)
assert row is not None, "seeded circuit missing — re-run seed-e2e-tenant.ts"
assert row["status"] == "roughed_in", "status never reached the server: %r" % (row["status"],)
print("-- server has the circuit at roughed_in")
'

echo "== trade circuit offline round-trip OK"
