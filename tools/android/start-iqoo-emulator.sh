#!/bin/sh
set -eu
sdk_path="${ANDROID_SDK_ROOT:-/opt/homebrew/share/android-commandlinetools}"
exec "$sdk_path/emulator/emulator" \
  -avd iQOO_Z10x_5G_I2404_API35 \
  -port 5556 \
  -no-snapshot-save \
  -no-audio \
  -vsync-rate 120
