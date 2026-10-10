#!/usr/bin/env bash
# One command: cloud-build the Android APK on EAS, wait for it, download the
# artifact, and publish it to the get.thejobsite.app host. No manual steps.
#
# Usage:
#   scripts/build-and-publish.sh ["version label"]
#
# Note: the ~15 min build runs in Expo's cloud (no Android SDK needed locally),
# so the finished APK must be downloaded to this server before it can be hosted.
# That download is what this script automates — it is not a manual copy.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LABEL="${1:-}"

cd "$REPO_ROOT/mobile"
echo "==> Building on EAS (this waits for the cloud build to finish)…"
eas build --platform android --profile preview --non-interactive

echo "==> Downloading + publishing the finished APK…"
"$REPO_ROOT/scripts/publish-latest-build.sh" "$LABEL"
