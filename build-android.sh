#!/usr/bin/env bash
# Build the Screen Editor Player Android APK and copy it to server/data/downloads/
# Usage: ./build-android.sh [release|debug]   (default: release)

set -e

MODE="${1:-release}"
ANDROID_DIR="$(cd "$(dirname "$0")/android" && pwd)"
SERVER_DIR="$(cd "$(dirname "$0")/server" && pwd)"
DOWNLOADS_DIR="$SERVER_DIR/data/downloads"

echo "▶  Building Android APK ($MODE)…"
echo "   Source : $ANDROID_DIR"

# Verify android project exists
if [ ! -f "$ANDROID_DIR/gradlew" ]; then
  echo "✗  Android project not found at $ANDROID_DIR"
  exit 1
fi

mkdir -p "$DOWNLOADS_DIR"

cd "$ANDROID_DIR"
chmod +x gradlew

if [ "$MODE" = "debug" ]; then
  ./gradlew assembleDebug --quiet
  APK_SRC=$(find app/build/outputs/apk/debug -name "*.apk" | head -1)
else
  ./gradlew assembleRelease --quiet
  APK_SRC=$(find app/build/outputs/apk/release -name "*.apk" | head -1)
fi

if [ -z "$APK_SRC" ]; then
  echo "✗  APK not found after build"
  exit 1
fi

DEST="$DOWNLOADS_DIR/screen-editor-player.apk"
cp "$APK_SRC" "$DEST"

echo "✓  APK copied to $DEST"
echo "   Download URL: http://localhost:3001/download/screen-editor-player.apk"
