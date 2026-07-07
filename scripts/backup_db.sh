#!/usr/bin/env bash
# =============================================================================
# Designora — kunlik PostgreSQL backup skripti (XAVFSIZLIK bloki)
#
# Foydalanish (cron misoli — har kuni 03:00 da):
#   0 3 * * *  /path/to/scripts/backup_db.sh >> /var/log/designora-backup.log 2>&1
#
# Muhit o'zgaruvchilari:
#   DATABASE_URL       — postgres ulanish satri (majburiy)
#   BACKUP_DIR         — backuplar papkasi (default: ./backups)
#   BACKUP_RETENTION   — necha kunlik backup saqlanadi (default: 14)
# =============================================================================
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${BACKUP_RETENTION:-14}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
OUT_FILE="${BACKUP_DIR}/designora_${TIMESTAMP}.sql.gz"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "[backup] XATO: DATABASE_URL o'rnatilmagan" >&2
  exit 1
fi

mkdir -p "${BACKUP_DIR}"

echo "[backup] Boshlandi: ${TIMESTAMP}"
# pg_dump + gzip (siqilgan holda saqlanadi)
pg_dump "${DATABASE_URL}" | gzip > "${OUT_FILE}"
echo "[backup] Yaratildi: ${OUT_FILE} ($(du -h "${OUT_FILE}" | cut -f1))"

# Eski backuplarni tozalash (retention)
find "${BACKUP_DIR}" -name 'designora_*.sql.gz' -type f -mtime "+${RETENTION_DAYS}" -delete
echo "[backup] ${RETENTION_DAYS} kundan eski backuplar tozalandi"

# Ixtiyoriy: S3 / R2 ga yuklash (AWS CLI o'rnatilgan bo'lsa)
if [ -n "${BACKUP_S3_BUCKET:-}" ]; then
  aws s3 cp "${OUT_FILE}" "s3://${BACKUP_S3_BUCKET}/" && \
    echo "[backup] S3 ga yuklandi: ${BACKUP_S3_BUCKET}"
fi

echo "[backup] Tugadi"
