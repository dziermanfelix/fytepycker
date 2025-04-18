#!/bin/bash

# Build the frontend
cd frontend
npm install
npm run build
cd ..

# Collect static files for Django
python manage.py collectstatic --noinput
