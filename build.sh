#!/bin/bash
set -e

echo "[build] Building frontend..."
cd frontend
rm -rf static
npm install
npm run build
cd ..

python manage.py collectstatic --noinput
