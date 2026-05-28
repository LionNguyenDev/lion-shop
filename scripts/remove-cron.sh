#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKUP_SCRIPT="$SCRIPT_DIR/backup.sh"

if ! crontab -l 2>/dev/null | grep -qF "$BACKUP_SCRIPT"; then
  echo "ℹ️   Không tìm thấy cron job để xóa."
  exit 0
fi

crontab -l 2>/dev/null | grep -vF "$BACKUP_SCRIPT" | crontab -
echo "✅  Đã xóa cron job backup."
