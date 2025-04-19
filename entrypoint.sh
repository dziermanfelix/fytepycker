#!/bin/bash
set -e

if [[ "$1" == "web" ]]; then
  echo "[entrypoint] Starting web dyno..."
  python manage.py migrate
  playwright install chromium
  exec daphne -b 0.0.0.0 -p $PORT core.asgi:application
  
elif [[ "$1" == "worker" ]]; then
  echo "[entrypoint] Starting worker dyno..."
  exec celery -A core worker --loglevel=info

else
  exec "$@"
fi
