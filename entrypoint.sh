#!/bin/bash

python manage.py migrate

exec daphne -b 0.0.0.0 -p $PORT core.asgi:application
