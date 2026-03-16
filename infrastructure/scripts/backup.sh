#!/bin/bash
# ===========================================================
# PostgreSQL Automated Backup Script
# Following best practices for database backups
# ===========================================================

set -e

# Configuration
POSTGRES_HOST = "${POSTGRES_HOST:-postgres}"
POSTGRES_USER = "${POSTGRES_USER:-school_admin}"
POSTGRES_DB = "${POSTGRES_DB:-school_management_db}"
BACKUP_DIR = "/backups"
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE = "${BACKUP_DIR}/${POSTGRES_DB}_backup_${DATE}.sql.gz"

# Retention settings
RETENTION_DAYS = "${BACKUP_KEEP_DAYS:-7}"
RETENTION_WEEKS = "${BACKUP_KEEP_WEEKS:-4}"
RETENTION_MONTHS = "${BACKUP_KEEP_MONTHS:-6}"

echo "========================================================"
echo "Starting PostgreSQL backup for database: ${POSTGRES_DB}"
echo "Backup file will be stored at: ${BACKUP_FILE}"
echo "========================================================"

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}/daily"
mkdir -p "${BACKUP_DIR}/weekly"
mkdir -p "${BACKUP_DIR}/monthly"

# Perform the backup
echo "Creating backup..."
PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump -h "${POSTGRES_HOST}" -U "${POSTGRES_USER}" -F c "${POSTGRES_DB}" | gzip > "${BACKUP_FILE}"

# Verify backup creation
if [[ -f "${BACKUP_FILE}" ]]; then
    BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    echo "Backup created successfully: ${BACKUP_FILE} (${BACKUP_SIZE})"
else
    echo "Backup failed!"
    exit 1
fi

# Copy to appropriate retention folders
cp "${BACKUP_FILE}" "${BACKUP_DIR}/daily/"

# Weekly backup (every 7th day)
if [[ $(date +%u) -eq 7 ]]; then
    cp "${BACKUP_FILE}" "${BACKUP_DIR}/weekly/"
fi

# Monthly backup (1st day of the month)
if [[ $(date +%d) -eq 1 ]]; then
    cp "${BACKUP_FILE}" "${BACKUP_DIR}/monthly/"
    echo "Monthly backup created."
fi

# Cleanup old backups
echo "Cleaning up old backups..."

# Delete daily backups older than RETENTION_DAYS
find "${BACKUP_DIR}/daily/" -type f -name "*.sql.gz" -mtime +${RETENTION_DAYS} -exec rm {} \;

# Delete weekly backups older than RETENTION_WEEKS
find "${BACKUP_DIR}/weekly/" -type f -name "*.sql.gz" -mtime +$((RETENTION_WEEKS * 7)) -exec rm {} \;

# Delete monthly backups older than RETENTION_MONTHS
find "${BACKUP_DIR}/monthly/" -type f -name "*.sql.gz" -mtime +$((RETENTION_MONTHS * 30)) -exec rm {} \;
echo "Old backups cleaned up."

echo "========================================================="
echo "Backup process completed successfully."
echo "========================================================="

chmod +x infrastructure/scripts/backup.sh