import os
from pathlib import Path
import dj_database_url
from urllib.parse import urlparse
from decouple import config
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config('SECRET_KEY')

DEBUG = config('DEBUG', default=True, cast=bool)

# ALLOWED_HOSTS - Render automatically sets RENDER_EXTERNAL_HOSTNAME
render_hostname = config("RENDER_EXTERNAL_HOSTNAME", default="")
allowed_hosts_list = ["127.0.0.1", "localhost"]
if render_hostname:
    # Render provides just the hostname (e.g., "fytepycker.onrender.com")
    allowed_hosts_list.append(render_hostname)
# Also check ALLOWED_HOSTS env var if explicitly set
allowed_hosts_env = config("ALLOWED_HOSTS", default="")
if allowed_hosts_env:
    allowed_hosts_list.extend([h.strip() for h in allowed_hosts_env.split(",") if h.strip()])
ALLOWED_HOSTS = allowed_hosts_list

# CSRF_TRUSTED_ORIGINS - must include https:// scheme (Django 4.0+ requirement)
frontend_urls = config('FRONTEND_URLS', default='')
if not frontend_urls and render_hostname:
    # Auto-generate from Render hostname if FRONTEND_URLS not set
    frontend_urls = f'https://{render_hostname}'

csrf_origins = []
if frontend_urls:
    # Ensure all URLs have https:// scheme
    for url in frontend_urls.split(','):
        url = url.strip().strip('/')
        if url:
            # Add https:// if missing
            if not url.startswith('http://') and not url.startswith('https://'):
                url = f'https://{url}'
            csrf_origins.append(url)
else:
    # Fallback for local dev
    csrf_origins = ['https://localhost', 'http://localhost']

CSRF_TRUSTED_ORIGINS = csrf_origins

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    'rest_framework',
    'rest_framework.authtoken',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',

    'channels',
    # 'django_celery_beat',  # Commented out for free hosting - using APScheduler + GitHub Actions instead

    'api',
    'accounts',
    'ufc',
    'matchups',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'frontend' / 'dist', os.path.join(BASE_DIR, 'staticfiles')],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

ASGI_APPLICATION = "core.asgi.application"

# configure redis
redis_url = config("REDIS_URL", default="redis://localhost:6379")
url = urlparse(redis_url)
redis_config = {
    "address": redis_url,
}
if url.scheme == "rediss":  # add SSL options if using secure rediss
    redis_config["ssl_cert_reqs"] = None
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [redis_config],
        },
    },
}

DATABASES = {
    'default': dj_database_url.config(default=config('DATABASE_URL'))
}

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Custom user model
AUTH_USER_MODEL = 'accounts.User'

# REST Framework settings
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=30),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'BLACKLIST_AFTER_ROTATION': True,
}

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
if DEBUG:
    TEMPLATES[0]['DIRS'] = []
    STATICFILES_DIRS = []
    STATICFILES_STORAGE = "django.contrib.staticfiles.storage.StaticFilesStorage"
else:
    TEMPLATES[0]['DIRS'] = [BASE_DIR / "frontend" / "dist"]
    STATICFILES_DIRS = [BASE_DIR / "frontend" / "dist"]
    STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# CORS
if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True
else:
    CORS_ALLOW_ALL_ORIGINS = False
    frontend_urls = config('FRONTEND_URLS', default='')
    if not frontend_urls and render_hostname:
        # Auto-generate from Render hostname if FRONTEND_URLS not set
        frontend_urls = f'https://{render_hostname}'

    if frontend_urls:
        # Ensure all URLs have https:// scheme for CORS
        cors_origins = []
        for url in frontend_urls.split(','):
            url = url.strip().strip('/')
            if url:
                # Add https:// if missing
                if not url.startswith('http://') and not url.startswith('https://'):
                    url = f'https://{url}'
                cors_origins.append(url)
        CORS_ALLOWED_ORIGINS = cors_origins
    else:
        CORS_ALLOWED_ORIGINS = []

# Celery configuration removed for free hosting
# Using APScheduler + GitHub Actions instead
# CELERY_BROKER_URL = config('REDIS_URL')
# CELERY_ACCEPT_CONTENT = ['json']
# CELERY_TASK_SERIALIZER = 'json'
# CELERY_BEAT_SCHEDULE = {
#     'midnight-scrape': {
#         'task': 'ufc.tasks.midnight_scrape',
#         'schedule': crontab(minute=0, hour=0),  # midnight UTC
#     },
# }

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
}
