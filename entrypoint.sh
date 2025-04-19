#!/bin/bash
set -e

# Only run migrate and daphne if no other command was passed
if [[ "$1" == "daphne" ]]; then
  python manage.py migrate
  daphne -b 0.0.0.0 -p $PORT core.asgi:application
else
  exec "$@"
fi
