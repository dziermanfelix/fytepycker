#!/bin/bash
set -e

echo "[entrypoint] Running with args: $@"
echo "[entrypoint] Script path: $0"
echo "[entrypoint] Arg1: $1"
echo "[entrypoint] Arg2: $2"
echo "[entrypoint] Arg3: $3"
echo "[entrypoint] Arg4: $4"
echo "[entrypoint] All args: $@"
echo "ls /app..."
ls -la /app

if [[ "$4" == "web" ]]; then
  echo "[entrypoint] Starting web dyno..."
  python manage.py migrate
  playwright install chromium
  exec daphne -b 0.0.0.0 -p $PORT core.asgi:application

elif [[ "$4" == "worker" ]]; then
  echo "[entrypoint] Starting worker dyno..."
  exec celery -A core worker --loglevel=info

else
  echo "[entrypoint] Running command directly: $@"
  exec "$@"
fi
