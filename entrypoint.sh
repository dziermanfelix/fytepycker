#!/bin/bash
set -e

# Only run migrate and daphne if no other command was passed
if [[ "$1" == "daphne" ]]; then
  python manage.py migrate
  playwright install chromium
  exec daphne -b 0.0.0.0 -p $PORT core.asgi:application &
  exec celery -A core worker --loglevel=info &
  wait
else
  exec "$@"
fi
