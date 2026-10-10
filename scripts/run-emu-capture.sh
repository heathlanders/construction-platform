#!/usr/bin/env bash
# Boot headless x86 emulator, install the published APK, capture the native crash log.
set -uo pipefail
export JAVA_HOME=/home/user/jdk17
export PATH=/home/user/jdk17/bin:$PATH
SDK=/home/user/Android/Sdk
export ANDROID_SDK_ROOT=$SDK ANDROID_HOME=$SDK
export PATH=$SDK/platform-tools:$SDK/emulator:$SDK/cmdline-tools/latest/bin:$PATH
ADB=$SDK/platform-tools/adb
APK=$HOME/construction-platform/infra/apk/html/thejobsite.apk
PKG=com.thejobsite.app

echo "=== create AVD ==="
echo "no" | avdmanager create avd -n jobsite -k "system-images;android-30;google_apis;x86" -d pixel --force 2>&1 | tail -3

echo "=== boot emulator (headless) ==="
# -partition-size caps the userdata partition. The default (~7.4GB) is absurd for a
# single APK and makes the boot FATAL out ("Not enough space to create userdata
# partition") whenever the host disk is tight — which is how this harness silently
# died at "wait for device" on 2026-07-25. 2GB is plenty.
$SDK/emulator/emulator -avd jobsite -no-window -no-audio -no-boot-anim \
  -partition-size 2048 \
  -gpu swiftshader_indirect -no-snapshot -accel on >/tmp/emu.log 2>&1 &
EMU_PID=$!
echo "emulator pid $EMU_PID"

echo "=== wait for device ==="
$ADB wait-for-device
# wait for full boot
until [ "$($ADB shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ]; do sleep 2; done
echo "booted"

echo "=== install apk ==="
$ADB install -r "$APK" 2>&1 | tail -5

echo "=== clear log, launch, capture ==="
$ADB logcat -c
$ADB shell monkey -p $PKG -c android.intent.category.LAUNCHER 1 2>&1 | tail -2
sleep 8
$ADB logcat -d > /tmp/crash-full.log 2>&1
echo "=== FATAL / crash lines ==="
grep -iE "FATAL|AndroidRuntime|thejobsite|watermelon|UnsatisfiedLink|expo|dlopen|SIGABRT|abort" /tmp/crash-full.log | head -80
echo "=== full log at /tmp/crash-full.log ($(wc -l </tmp/crash-full.log) lines) ==="
