#!/usr/bin/env bash
set -euo pipefail
source /etc/restic.env

# Pre-dump Postgres if you prefer logical backups too (optional):
# docker exec -i supabase-db pg_dump -U postgres -Fc -d postgres > /opt/pgdumps/$(date +%F).dump

restic backup $RESTIC_BACKUP_SOURCES $RESTIC_BACKUP_EXCLUDES
# Keep 7 daily, 4 weekly, 6 monthly
restic forget --prune --keep-daily 7 --keep-weekly 4 --keep-monthly 6
