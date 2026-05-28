#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKUP_SCRIPT="$SCRIPT_DIR/backup.sh"
LOG_FILE="$SCRIPT_DIR/../backups/backup.log"

# Chạy lúc 2:00 AM mỗi ngày
CRON_SCHEDULE="0 2 * * *"
CRON_CMD="$CRON_SCHEDULE $BACKUP_SCRIPT >> $LOG_FILE 2>&1"

# Kiểm tra đã có cron job này chưa
if crontab -l 2>/dev/null | grep -qF "$BACKUP_SCRIPT"; then
  echo "ℹ️   Cron job đã tồn tại, bỏ qua."
  exit 0
fi

# Thêm vào crontab
(crontab -l 2>/dev/null; echo "$CRON_CMD") | crontab -

echo "✅  Cron job đã được đăng ký:"
echo "    $CRON_CMD"
echo ""
echo "📋  Kiểm tra bằng lệnh: crontab -l"
echo "🗑   Xóa cron job bằng: bash scripts/remove-cron.sh"
