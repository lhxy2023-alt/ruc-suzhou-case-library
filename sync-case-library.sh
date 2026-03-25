#!/bin/zsh
set -euo pipefail

ROOT="/Users/taofangzheng/.openclaw/workspace"
PORT="8011"
PID_FILE="/tmp/ruc_case_http_${PORT}.pid"
LOG_FILE="/tmp/ruc_case_http_${PORT}.log"
URL="http://127.0.0.1:${PORT}/ruc-suzhou-case-library/"

cd "$ROOT"

echo "[1/3] 导出 Feishu 后台数据..."
python3 feishu-bitable-sync/export_frontend_data.py

echo "[2/3] 重启本地预览服务 (${PORT})..."
if [[ -f "$PID_FILE" ]]; then
  kill "$(cat "$PID_FILE")" 2>/dev/null || true
fi
nohup python3 -m http.server "$PORT" >"$LOG_FILE" 2>&1 &
echo $! >"$PID_FILE"
sleep 1

echo "[3/3] 检查页面可访问性..."
curl --noproxy '*' -I "$URL" >/dev/null

echo "✅ 同步完成"
echo "预览地址：$URL"
