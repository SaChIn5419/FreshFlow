#!/bin/bash

# Configuration
BACKUP_DIR="/home/sachindb/Documents/opalessence/backend/backups"
DB_NAME="freshflow" # or from DATABASE_URL
DB_USER="postgres"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.sql"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Run backup
# Check if we are using SQLite (test.sqlite) or PostgreSQL
if [ -f "/home/sachindb/Documents/opalessence/backend/test.sqlite" ]; then
    echo "Running SQLite backup..."
    cp "/home/sachindb/Documents/opalessence/backend/test.sqlite" "$BACKUP_DIR/backup_$DATE.sqlite"
    echo "SQLite backup completed: $BACKUP_DIR/backup_$DATE.sqlite"
else
    echo "Running PostgreSQL backup..."
    pg_dump -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE"
    
    # Check if backup was successful
    if [ $? -eq 0 ]; then
        echo "PostgreSQL backup completed successfully: $BACKUP_FILE"
        # Optional: gzip the backup
        gzip "$BACKUP_FILE"
    else
        echo "PostgreSQL backup failed"
        exit 1
    fi
fi

# Cleanup old backups (older than 7 days)
find "$BACKUP_DIR" -type f -mtime +7 -name "backup_*" -exec rm {} \;
echo "Cleaned up old backups."
