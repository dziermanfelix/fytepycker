#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"

# Only load DB URLs — .env may contain bash-special chars (e.g. SECRET_KEY).
if [ -f .env ]; then
  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in
      LOCAL_DATABASE_URL=*|PROD_DATABASE_URL=*|DATABASE_URL=*)
        export "$line"
        ;;
    esac
  done < .env
fi

if [ -z "${LOCAL_DATABASE_URL:-}" ]; then
  echo "Error: LOCAL_DATABASE_URL is not set. Add it to .env or export it." >&2
  exit 1
fi

if [ -z "${PROD_DATABASE_URL:-}" ]; then
  echo "Error: PROD_DATABASE_URL is not set. Add it to .env or export it." >&2
  exit 1
fi

BACKUP_DIR="$PROJECT_ROOT/scripts/db/backups"
mkdir -p "$BACKUP_DIR"

TIMESTAMP="$(date -u +%Y-%m-%dT%H-%M-%S)"
BACKUP_FILE="$BACKUP_DIR/fytepycker-prod-$TIMESTAMP.sql"

echo "Dumping prod public schema to $BACKUP_FILE ..."
pg_dump "$PROD_DATABASE_URL" --schema=public --no-owner --no-acl --clean --if-exists -f "$BACKUP_FILE"

echo "Dropping Supabase leftovers on local ..."
psql "$LOCAL_DATABASE_URL" -v ON_ERROR_STOP=0 -c "
  DROP EVENT TRIGGER IF EXISTS ensure_rls;
  DROP EVENT TRIGGER IF EXISTS issue_graphql_placeholder;
  DROP EVENT TRIGGER IF EXISTS issue_pg_cron_access;
  DROP EVENT TRIGGER IF EXISTS issue_pg_graphql_access;
  DROP EVENT TRIGGER IF EXISTS issue_pg_net_access;
  DROP EVENT TRIGGER IF EXISTS pgrst_ddl_watch;
  DROP EVENT TRIGGER IF EXISTS pgrst_drop_watch;
  DROP FUNCTION IF EXISTS public.rls_auto_enable() CASCADE;
" || true

echo "Wiping local public schema before restore ..."
psql "$LOCAL_DATABASE_URL" -v ON_ERROR_STOP=1 -c "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;"

echo "Restoring to local ..."
psql "$LOCAL_DATABASE_URL" -f "$BACKUP_FILE"

echo "Applying pending migrations ..."
DATABASE_URL="$LOCAL_DATABASE_URL" python manage.py migrate

echo "Done. Backup saved to $BACKUP_FILE"
