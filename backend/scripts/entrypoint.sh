#!/usr/bin/env bash
set -euo pipefail

max_attempts="${MIGRATION_MAX_ATTEMPTS:-30}"
attempt=1
while [ "$attempt" -le "$max_attempts" ]; do
  if alembic upgrade head; then
    exec "$@"
  fi
  echo "Alembic migration attempt ${attempt}/${max_attempts} failed; retrying..." >&2
  attempt=$((attempt + 1))
  sleep "${MIGRATION_RETRY_SECONDS:-2}"
done

echo "Database migrations failed after ${max_attempts} attempts" >&2
exit 1
