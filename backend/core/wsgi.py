"""
WSGI config for core project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/wsgi/
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.core.settings')

application = get_wsgi_application()

# Initialize APScheduler for event scraping (when using runserver)
# Note: The scheduler is singleton - only initializes once
try:
    from backend.ufc.scheduler import get_scheduler
    scheduler = get_scheduler()
    print("[WSGI] APScheduler initialized")
except ImportError:
    # APScheduler not installed - that's okay for dev
    pass
except Exception as e:
    print(f"[WSGI] Could not initialize scheduler: {e}")
