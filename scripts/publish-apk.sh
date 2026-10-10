#!/usr/bin/env bash
# Publish a built APK to the get.thejobsite.app download host.
# Copies the APK into the nginx volume dir and stamps a version label
# the download page reads at runtime. No container restart needed
# (volume-mounted) — the new file + label are live immediately.
#
# Usage:
#   scripts/publish-apk.sh <path-to.apk> [version-label]
#
# Examples:
#   scripts/publish-apk.sh ~/Downloads/build-1234.apk
#   scripts/publish-apk.sh ./app.apk "1.0.0 (build 12)"

set -euo pipefail

SRC="${1:-}"
LABEL="${2:-}"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST_DIR="$REPO_ROOT/infra/apk/html"
DEST_APK="$DEST_DIR/thejobsite.apk"
VERSION_FILE="$DEST_DIR/version.txt"

if [[ -z "$SRC" ]]; then
  echo "error: no APK path given" >&2
  echo "usage: $0 <path-to.apk> [version-label]" >&2
  exit 1
fi
if [[ ! -f "$SRC" ]]; then
  echo "error: file not found: $SRC" >&2
  exit 1
fi

# Default label = app version from app.json + UTC date
if [[ -z "$LABEL" ]]; then
  APP_VER="$(grep -m1 '"version"' "$REPO_ROOT/mobile/app.json" | sed -E 's/.*"version" *: *"([^"]+)".*/\1/')"
  LABEL="v${APP_VER:-?} · $(date -u +%Y-%m-%d)"
fi

cp "$SRC" "$DEST_APK"
printf '%s' "$LABEL" > "$VERSION_FILE"

SIZE="$(du -h "$DEST_APK" | cut -f1)"
echo "published: $DEST_APK ($SIZE)"
echo "label:     $LABEL"
echo "live at:   https://get.thejobsite.app/  (drop is instant — no restart)"
