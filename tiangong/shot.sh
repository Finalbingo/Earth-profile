#!/bin/bash
# 用法: ./shot.sh <输出名> [等待毫秒] [宽] [高] [hash]
CHROME="/Users/Admin/.cache/hyperframes/chrome/chrome-headless-shell/mac_arm-152.0.7977.30/chrome-headless-shell-mac-arm64/chrome-headless-shell"
NAME="${1:-shot}"
WAIT="${2:-4000}"
W="${3:-1600}"
H="${4:-1000}"
HASH="${5:-#iso}"
OUT="/Users/Admin/Documents/Qoder/2026-11-10/7416ea54/test-shots/${NAME}.png"
"$CHROME" --user-data-dir="/tmp/tg-shot-${NAME}" \
  --window-size="${W},${H}" --virtual-time-budget="${WAIT}" --hide-scrollbars \
  --enable-unsafe-swiftshader --enable-logging=stderr --v=0 \
  --screenshot="$OUT" "http://127.0.0.1:8731/tiangong/index.html${HASH}" 2>&1 \
  | grep -Ei "CONSOLE|uncaught|SyntaxError|TypeError|ReferenceError" | head -30
echo "--- $OUT"
ls -la "$OUT"