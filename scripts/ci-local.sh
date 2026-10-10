#!/usr/bin/env bash
# ci-local.sh — run the CI checks on this box instead of burning GitHub Actions minutes.
#
# Mirrors .github/workflows/ci.yml (API tests + PgBouncer gate + tsc, web tsc, docker builds) and
# adds the mobile gates CI never had (tsc + jest). Only the areas touched since the merge base with
# main run, unless --all. API tests use the local Docker stack (postgres/pgbouncer/redis from
# docker-compose.yml) via the root .env, same as `npx vitest run` by hand.
#
#   scripts/ci-local.sh              # changed areas only
#   scripts/ci-local.sh --all        # everything
#   scripts/ci-local.sh --docker     # also build the api + web images (slow, ~4 min)
#   scripts/ci-local.sh --report     # post the result as a `local-ci` commit status on GitHub
#                                    # (a status API call — costs no Actions minutes)
set -uo pipefail
cd "$(git rev-parse --show-toplevel)"

ALL=0; DOCKER=0; REPORT=0
for a in "$@"; do
  case "$a" in
    --all) ALL=1 ;; --docker) DOCKER=1 ;; --report) REPORT=1 ;;
    *) echo "unknown flag: $a"; exit 2 ;;
  esac
done

BASE=$(git merge-base HEAD origin/main 2>/dev/null || git merge-base HEAD main)
CHANGED=$( { git diff --name-only "$BASE"...HEAD; git diff --name-only HEAD; } | sort -u)
touched() { [ "$ALL" = 1 ] || grep -qE "$1" <<<"$CHANGED"; }

declare -a RESULTS=(); FAILED=0
step() {
  local name="$1"; shift
  local t0=$SECONDS
  echo; echo "▶ $name"
  if "$@"; then RESULTS+=("✅ $name ($((SECONDS - t0))s)")
  else RESULTS+=("❌ $name ($((SECONDS - t0))s)"); FAILED=1; fi
}

# api/ changes, plus prisma/ (migrations) and the shared root tsconfig.
if touched '^(api/|prisma/|tsconfig)'; then
  docker compose ps --status running --services 2>/dev/null | grep -q '^pgbouncer$' \
    || { echo "⚠ local stack not running — docker compose up -d postgres pgbouncer redis"; exit 1; }
  step "api: migrations up to date" bash -c 'cd api && ./node_modules/.bin/prisma migrate status --schema ../prisma/schema.prisma >/dev/null'
  step "api: pgbouncer isolation gate (T-43)" bash -c 'cd api && npx vitest run src/test/pgbouncer.test.ts'
  step "api: vitest" bash -c 'cd api && npx vitest run'
  step "api: tsc" bash -c 'cd api && npx tsc --noEmit'
fi

if touched '^web/'; then
  step "web: tsc" bash -c 'cd web && npx tsc --noEmit'
fi

if touched '^mobile/'; then
  # Same Checkout.tsx expo-camera carve-out as scripts/hooks/pre-push.
  step "mobile: tsc" bash -c 'cd mobile && ! npx tsc --noEmit 2>&1 | grep "error TS" | grep -v "Checkout.tsx"'
  step "mobile: jest" bash -c 'cd mobile && npx jest --silent'
fi

if [ "$DOCKER" = 1 ]; then
  step "docker: api image" docker build -q -f api/Dockerfile . -t ci-local/api
  step "docker: web image" docker build -q -f web/Dockerfile web/ -t ci-local/web
fi

echo; echo "── local CI ($(git rev-parse --short HEAD)) ──"
[ ${#RESULTS[@]} -eq 0 ] && echo "nothing to check (no api/web/mobile changes vs main)"
printf '%s\n' "${RESULTS[@]}"

if [ "$REPORT" = 1 ]; then
  if [ -n "$(git status --porcelain)" ]; then
    echo "⚠ uncommitted changes — not reporting a status for a commit you didn't test"
  else
    state=$([ "$FAILED" = 0 ] && echo success || echo failure)
    gh api -X POST "repos/{owner}/{repo}/statuses/$(git rev-parse HEAD)" \
      -f state="$state" -f context=local-ci \
      -f description="$(printf '%s; ' "${RESULTS[@]}" | cut -c1-140)" >/dev/null \
      && echo "reported local-ci=$state to GitHub"
  fi
fi
exit $FAILED
