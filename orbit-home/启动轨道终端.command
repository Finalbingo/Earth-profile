#!/bin/bash
# 双击本文件即可打开「轨道终端 · ORBIT TERMINAL」个人主页。
# 它会在需要时启动本地静态服务，然后用默认浏览器打开页面。

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT" || exit 1
PORT=8732
URL="http://127.0.0.1:$PORT/orbit-home/index.html"

probe() { curl -s -o /dev/null --max-time 2 "$URL"; }

if ! probe; then
  echo "启动本地服务：端口 $PORT"
  nohup python3 -m http.server "$PORT" --bind 127.0.0.1 >/dev/null 2>&1 &
  disown 2>/dev/null
  for _ in $(seq 1 40); do probe && break; sleep 0.25; done
fi

if probe; then
  echo "打开页面：$URL"
  open "$URL"
  echo
  echo "操作提示：拖动 = 转头 · 滚轮 = 变焦 · 双击舱段/作品可聚焦"
  echo "底部控制台可实时调整轨道高度、太阳方位、云量、伴飞距离与画质。"
  echo "关闭本终端窗口不会影响页面。"
else
  echo "无法启动本地服务。请确认已安装 python3，或手动在 $ROOT 执行："
  echo "  python3 -m http.server $PORT"
  exit 1
fi