#!/bin/bash
# 无头驱动：在 iframe 中打开 tiangong，按场景操作控件后截图
# 用法: ./drive.sh 名称 "步骤|步骤" [宽] [高] [视角] [虚拟时间ms]
CHROME="/Users/Admin/.cache/hyperframes/chrome/chrome-headless-shell/mac_arm-152.0.7977.30/chrome-headless-shell-mac-arm64/chrome-headless-shell"
ROOT="/Users/Admin/Documents/Qoder/2026-11-10/7416ea54"
NAME="${1:-drive}"
STEPS="${2:-}"
W="${3:-1600}"
H="${4:-1000}"
VIEW="${5:-}"
WAIT="${6:-9000}"
OUT="$ROOT/test-shots/${NAME}.png"
URL="http://127.0.0.1:8731/test-shots/drive.html?s=$(python3 -c "import urllib.parse,sys;print(urllib.parse.quote(sys.argv[1],safe=''))" "$STEPS")&v=$VIEW"
"$CHROME" --user-data-dir="/tmp/tg-drive-${NAME}" --window-size="${W},${H}" \
  --virtual-time-budget="${WAIT}" --hide-scrollbars --enable-unsafe-swiftshader \
  --enable-logging=stderr --v=0 --screenshot="$OUT" "$URL" 2>&1 \
  | grep -Ei "CONSOLE|uncaught|SyntaxError|TypeError|ReferenceError" | head -20
echo "--- $OUT"