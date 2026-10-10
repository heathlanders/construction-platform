#!/usr/bin/env bash
# Download the newest EAS Android build artifact and publish it to the
# get.thejobsite.app host. One pipe-free command (terminal paste-safe).
#
# Usage:
#   scripts/publish-latest-build.sh ["version label"]
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LABEL="${1:-}"

cd "$REPO_ROOT/mobile"
URL="$(eas build:list --platform android --limit 1 --json --non-interactive \
  | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const b=JSON.parse(s)[0];if(!b||!b.artifacts||!b.artifacts.buildUrl){console.error('no artifact on latest build');process.exit(1)}console.log(b.artifacts.buildUrl)})")"

echo "artifact: $URL"
curl -L "$URL" -o /tmp/thejobsite.apk
"$REPO_ROOT/scripts/publish-apk.sh" /tmp/thejobsite.apk "$LABEL"
