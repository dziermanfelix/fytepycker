web: daphne -b 0.0.0.0 -p $PORT core.asgi:application
worker: celery -A core worker --loglevel=info
beat: celery -A core beat --loglevel=info --scheduler django_celery_beat.schedulers:DatabaseScheduler
release: python manage.py migrate && playwright install
