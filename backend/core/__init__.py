# Celery import commented out for free hosting
# Celery is replaced by APScheduler + GitHub Actions
# try:
#     from .celery import app as celery_app
#     __all__ = ('celery_app',)
# except ImportError:
#     __all__ = ()
__all__ = ()
