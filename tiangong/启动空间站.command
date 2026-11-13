#!/bin/bash
# 双击本文件即可打开「中国空间站 · 三舱 T 字构型」交互模型。
# 它会在需要时启动本地静态服务，然后用默认浏览器打开页面。

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT" || exit 1
PORT=8731
URL="http://127.0.0.1:$PORT/tiangong/index.html"

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
  echo "操作提示：左键拖动旋转 · 滚轮缩放 · 右键平移 · 双击舱段聚焦"
  echo "右侧控制区可实时调整太阳翼展开角、机械臂关节、剖切、标注、光照与画质。"
  echo "关闭本终端窗口不会影响页面。"
else
  echo "无法启动本地服务。请确认已安装 python3，或手动在 $ROOT 执行："
  echo "  python3 -m http.server $PORT"
  exit 1
fi