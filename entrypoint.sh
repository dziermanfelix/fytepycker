#!/bin/bash
set -e

# Only run migrate and daphne if no other command was passed
if [[ "$1" == "daphne" ]]; then
  python manage.py migrate
  exec "$@"
else
  exec "$@"
fi
