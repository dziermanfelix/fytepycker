import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import core.routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

# Initialize Django before importing scheduler
django_asgi_app = get_asgi_application()

# Initialize APScheduler for event scraping (replaces Celery for free hosting)
# This runs in the web process and handles live event scraping
try:
    from ufc.scheduler import get_scheduler
    # Get scheduler instance to start it
    scheduler = get_scheduler()
    print("[ASGI] APScheduler initialized for event scraping")
except ImportError as e:
    print(f"[ASGI] APScheduler not available: {e}")
    print("[ASGI] Install APScheduler with: pip install APScheduler")
except Exception as e:
    print(f"[ASGI] Could not initialize scheduler: {e}")

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AuthMiddlewareStack(
        URLRouter(core.routing.websocket_urlpatterns)
    ),
})
