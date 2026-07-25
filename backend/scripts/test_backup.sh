#!/bin/bash
# test_backup.sh
# Simulates a database backup process for the production environment.

set -e

# Default values
DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-"5432"}
DB_USER=${DB_USER:-"postgres"}
DB_NAME=${DB_NAME:-"freshflow"}
BACKUP_DIR=${BACKUP_DIR:-"./backups"}

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_backup_${TIMESTAMP}.sql"

echo "========================================"
echo "Starting Database Backup for $DB_NAME"
echo "========================================"

# We use pg_isready to check if the DB is up before backing up
if command -v pg_isready > /dev/null; then
    pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" || { echo "Database is not reachable."; exit 1; }
fi

if command -v pg_dump > /dev/null; then
    echo "Running pg_dump..."
    # Note: Requires PGPASSWORD to be set in the environment or ~/.pgpass
    pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -F c -f "$BACKUP_FILE"
    echo "Backup completed successfully: $BACKUP_FILE"
else
    echo "WARNING: pg_dump not found in PATH."
    echo "Simulating backup creation for testing purposes..."
    sleep 2
    echo "-- Simulated Backup for $DB_NAME at $TIMESTAMP" > "$BACKUP_FILE"
    echo "Simulated Backup completed: $BACKUP_FILE"
fi

# Rotate old backups (keep last 7)
echo "Rotating old backups (keeping last 7 days)..."
find "$BACKUP_DIR" -type f -name "${DB_NAME}_backup_*.sql" -mtime +7 -exec rm {} \;

echo "Backup process finished."
exit 0
