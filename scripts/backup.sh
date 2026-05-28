#!/usr/bin/env bash
set -euo pipefail

# Check mongodump is installed
if ! command -v mongodump &>/dev/null; then
  echo "❌  mongodump not found. Install with:"
  echo "    brew tap mongodb/brew && brew install mongodb-database-tools"
  exit 1
fi

# Load MONGODB_URI from .env.local
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_DIR/.env.local"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "❌  .env.local not found at $ENV_FILE"
  exit 1
fi

MONGODB_URI=$(grep '^MONGODB_URI=' "$ENV_FILE" | cut -d '=' -f2-)
if [[ -z "$MONGODB_URI" ]]; then
  echo "❌  MONGODB_URI not found in .env.local"
  exit 1
fi

BACKUPS_DIR="$PROJECT_DIR/backups"
mkdir -p "$BACKUPS_DIR"

# Xóa backup cũ
echo "🗑   Removing old backups…"
find "$BACKUPS_DIR" -name "*.tar.gz" -delete
find "$BACKUPS_DIR" -mindepth 1 -maxdepth 1 -type d -empty -delete

# Tạo backup mới
TIMESTAMP=$(date '+%Y-%m-%d_%H-%M-%S')
BACKUP_DIR="$BACKUPS_DIR/$TIMESTAMP"
mkdir -p "$BACKUP_DIR"

echo "⏳  Backing up to $BACKUP_DIR …"
mongodump --uri="$MONGODB_URI" --out="$BACKUP_DIR"

# Nén và xóa folder raw
tar -czf "${BACKUP_DIR}.tar.gz" -C "$BACKUPS_DIR" "$TIMESTAMP"
rm -rf "$BACKUP_DIR"

echo "✅  Backup saved: backups/${TIMESTAMP}.tar.gz"
