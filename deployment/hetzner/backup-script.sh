#!/bin/bash

# =================================================================
# Backup Script for Founder Diary - Hetzner Storage Box + Restic
# =================================================================

set -euo pipefail

# Configuration
BACKUP_NAME="founder-diary-$(date +%Y%m%d-%H%M%S)"
LOG_FILE="/var/log/backup-founder-diary.log"
RETENTION_DAYS=30
RETENTION_WEEKS=12
RETENTION_MONTHS=12

# Hetzner Storage Box Configuration
RESTIC_REPOSITORY="sftp:u123456@u123456.your-storagebox.de:23/backups/founder-diary"
RESTIC_PASSWORD_FILE="/etc/restic/password"
SSH_KEY="/etc/restic/ssh_key"

# Database Configuration
DB_CONTAINER="supabase-db"
DB_USER="postgres"
DB_NAME="postgres"
POSTGRES_PASSWORD_FILE="/etc/restic/postgres_password"

# Directories to backup
BACKUP_DIRS=(
    "/opt/founder-diary/volumes/db"
    "/opt/founder-diary/volumes/storage"
    "/opt/founder-diary/volumes/logs"
    "/var/log/caddy"
)

# Functions
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

error_exit() {
    log "ERROR: $1"
    exit 1
}

check_dependencies() {
    log "Checking dependencies..."
    
    command -v restic >/dev/null 2>&1 || error_exit "restic is not installed"
    command -v docker >/dev/null 2>&1 || error_exit "docker is not installed"
    
    # Check if password file exists
    [[ -f "$RESTIC_PASSWORD_FILE" ]] || error_exit "Restic password file not found: $RESTIC_PASSWORD_FILE"
    [[ -f "$POSTGRES_PASSWORD_FILE" ]] || error_exit "Postgres password file not found: $POSTGRES_PASSWORD_FILE"
    [[ -f "$SSH_KEY" ]] || error_exit "SSH key not found: $SSH_KEY"
    
    log "Dependencies check passed"
}

init_repository() {
    log "Initializing restic repository if needed..."
    
    export RESTIC_REPOSITORY
    export RESTIC_PASSWORD_FILE
    
    if ! restic snapshots >/dev/null 2>&1; then
        log "Repository not found, initializing..."
        restic init || error_exit "Failed to initialize repository"
    fi
    
    log "Repository ready"
}

backup_database() {
    log "Starting database backup..."
    
    local db_backup_dir="/tmp/db-backup-$(date +%s)"
    mkdir -p "$db_backup_dir"
    
    # Get postgres password
    local postgres_password
    postgres_password=$(cat "$POSTGRES_PASSWORD_FILE")
    
    # Create database dump
    docker exec -e PGPASSWORD="$postgres_password" "$DB_CONTAINER" \
        pg_dump -U "$DB_USER" -d "$DB_NAME" --verbose --no-owner --no-acl \
        > "$db_backup_dir/database.sql" || error_exit "Database dump failed"
    
    # Create schema-only dump
    docker exec -e PGPASSWORD="$postgres_password" "$DB_CONTAINER" \
        pg_dump -U "$DB_USER" -d "$DB_NAME" --schema-only --verbose --no-owner --no-acl \
        > "$db_backup_dir/schema.sql" || error_exit "Schema dump failed"
    
    # Create globals dump (users, roles, etc.)
    docker exec -e PGPASSWORD="$postgres_password" "$DB_CONTAINER" \
        pg_dumpall -U "$DB_USER" --globals-only --verbose \
        > "$db_backup_dir/globals.sql" || error_exit "Globals dump failed"
    
    # Add to backup directories
    BACKUP_DIRS+=("$db_backup_dir")
    
    log "Database backup completed: $db_backup_dir"
}

create_backup() {
    log "Starting backup: $BACKUP_NAME"
    
    export RESTIC_REPOSITORY
    export RESTIC_PASSWORD_FILE
    
    # Create backup with tags
    restic backup "${BACKUP_DIRS[@]}" \
        --tag "founder-diary" \
        --tag "$(date +%Y-%m-%d)" \
        --tag "$(date +%Y-%m)" \
        --tag "$(date +%Y)" \
        --verbose || error_exit "Backup failed"
    
    log "Backup completed successfully"
}

cleanup_temp() {
    log "Cleaning up temporary files..."
    
    # Remove temporary database backup
    find /tmp -name "db-backup-*" -type d -mmin +60 -exec rm -rf {} + 2>/dev/null || true
    
    log "Temporary cleanup completed"
}

prune_old_backups() {
    log "Pruning old backups..."
    
    export RESTIC_REPOSITORY
    export RESTIC_PASSWORD_FILE
    
    # Forget old snapshots
    restic forget \
        --tag "founder-diary" \
        --keep-daily "$RETENTION_DAYS" \
        --keep-weekly "$RETENTION_WEEKS" \
        --keep-monthly "$RETENTION_MONTHS" \
        --prune \
        --verbose || log "WARNING: Prune operation had issues"
    
    log "Pruning completed"
}

check_backup_integrity() {
    log "Checking backup integrity..."
    
    export RESTIC_REPOSITORY
    export RESTIC_PASSWORD_FILE
    
    # Check repository consistency
    restic check --verbose || log "WARNING: Repository check found issues"
    
    log "Integrity check completed"
}

send_notification() {
    local status=$1
    local message=$2
    
    # You can add webhook notification here
    # curl -X POST "https://hooks.slack.com/..." -d "{\"text\":\"$message\"}"
    
    log "Notification: $status - $message"
}

# Main execution
main() {
    log "=== Starting Founder Diary Backup ==="
    
    # Trap to ensure cleanup
    trap cleanup_temp EXIT
    
    check_dependencies
    init_repository
    backup_database
    create_backup
    prune_old_backups
    check_backup_integrity
    
    send_notification "SUCCESS" "Backup completed successfully: $BACKUP_NAME"
    log "=== Backup process completed successfully ==="
}

# Error handling
trap 'send_notification "ERROR" "Backup failed at line $LINENO"; exit 1' ERR

# Run main function
main "$@"
