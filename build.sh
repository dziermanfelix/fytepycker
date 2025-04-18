#!/bin/bash
set -e

cd frontend
npm install
npm run build
cd ..

python manage.py collectstatic --noinput
