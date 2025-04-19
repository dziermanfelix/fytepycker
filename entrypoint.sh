#!/bin/bash
set -e

# Only run migrate and daphne if no other command was passed
if [[ "$1" == "daphne" ]]; then
  python manage.py migrate
  playwright install chromium
  daphne -b 0.0.0.0 -p $PORT core.asgi:application &
  celery -A core worker --loglevel=info &
  wait -n
else
  exec "$@"
fi
