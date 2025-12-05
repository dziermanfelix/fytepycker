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
  python manage.py migrate
  playwright install chromium
  exec daphne -b 0.0.0.0 -p ${PORT:-8000} core.asgi:application

elif [[ "$1" == "worker" ]]; then
  echo "[entrypoint] Worker dyno is no longer needed for free hosting."
  echo "[entrypoint] Background tasks are handled by APScheduler in web process and GitHub Actions."
  exit 1

else
  echo "[entrypoint] Running command directly: $@"
  exec "$@"
fi
