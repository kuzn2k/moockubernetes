#!/usr/bin/env bash
set -euo pipefail

required_env() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "Missing required env var: $name" >&2
    exit 1
  fi
}

required_env DB_HOST
required_env DB_PORT
required_env DB_USER
required_env DB_NAME
required_env PGPASSWORD
required_env GCS_BUCKET

timestamp="$(date -u +%Y-%m-%dT%H-%M-%SZ)"
file_name="backup-${DB_NAME}-${timestamp}.sql"
file_path="/backup/${file_name}"

pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -F p -f "$file_path"
gsutil cp "$file_path" "gs://${GCS_BUCKET}/${file_name}"
