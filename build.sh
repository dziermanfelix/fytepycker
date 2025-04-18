#!/bin/bash

# Build the frontend
cd frontend
npm install
npm run build
cd ..

mkdir -p staticfiles
cp frontend/dist/* staticfiles

# Collect static files for Django
python manage.py collectstatic --noinput
