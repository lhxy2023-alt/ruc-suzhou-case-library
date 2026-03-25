#!/bin/zsh
set -euo pipefail

ROOT="/Users/taofangzheng/.openclaw/workspace"
PORT="8011"
PID_FILE="/tmp/ruc_case_http_${PORT}.pid"
LOG_FILE="/tmp/ruc_case_http_${PORT}.log"
LOCAL_URL="http://127.0.0.1:${PORT}/ruc-suzhou-case-library/"
PUBLIC_URL="https://lhxy2023-alt.github.io/ruc-suzhou-case-library/"

cd "$ROOT"

echo "[1/5] 导出 Feishu 后台数据..."
python3 feishu-bitable-sync/export_frontend_data.py

echo "[2/5] 同步 GitHub Pages 发布目录..."
rm -rf docs
mkdir -p docs
cp -R ruc-suzhou-case-library/* docs/

echo "[3/5] 提交并推送到 GitHub..."
git add docs ruc-suzhou-case-library/src/data/generated/frontendData.js
if ! git diff --cached --quiet; then
  git commit -m "chore: sync case library data"
  git push origin main
else
  echo "没有新的发布改动，跳过提交与推送。"
fi

echo "[4/5] 重启本地预览服务 (${PORT})..."
if [[ -f "$PID_FILE" ]]; then
  kill "$(cat "$PID_FILE")" 2>/dev/null || true
fi
nohup python3 -m http.server "$PORT" >"$LOG_FILE" 2>&1 &
echo $! >"$PID_FILE"
sleep 1

echo "[5/5] 检查页面可访问性..."
curl --noproxy '*' -I "$LOCAL_URL" >/dev/null

echo "✅ 同步完成"
echo "本地预览：$LOCAL_URL"
echo "公网地址：$PUBLIC_URL"
echo "提示：GitHub Pages 更新通常需要几十秒到几分钟生效。"
