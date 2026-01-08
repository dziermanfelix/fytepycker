#!/bin/bash
set -e

echo "[entrypoint] Running with args: $@"
echo "[entrypoint] Script path: $0"
echo "[entrypoint] Arg1: $1"
echo "[entrypoint] Arg2: $2"
echo "[entrypoint] Arg3: $3"
echo "[entrypoint] Arg4: $4"
echo "[entrypoint] All args: $@"

if [[ "$1" == "web" ]]; then
  echo "[entrypoint] Starting web server..."

  # Ensure public schema exists before migrations
  python -c "
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.core.settings')
import django
django.setup()
from django.db import connection
with connection.cursor() as cursor:
    cursor.execute('CREATE SCHEMA IF NOT EXISTS public;')
    cursor.execute('SET search_path TO public;')
    cursor.execute('GRANT ALL ON SCHEMA public TO public;')
" || true

  # run migrations
  echo "[entrypoint] Migrating DB..."
  python manage.py migrate

  # collect static
  echo "[entrypoint] Collecting static..."
  python manage.py collectstatic --noinput --clear

  echo "[entrypoint] Installing chromium..."
  playwright install chromium

  echo "[entrypoint] Starting daphne..."
  exec daphne -b 0.0.0.0 -p ${PORT:-8000} backend.core.asgi:application

  echo "[entrypoint] DAMN THE TORPEDOES"

else
  echo "[entrypoint] Running command directly: $@"
  exec "$@"
fi
