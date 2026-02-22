import os
from pathlib import Path
import dj_database_url
from urllib.parse import urlparse
from decouple import config
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = config('SECRET_KEY')

# Optional: set SCRAPE_SECRET to allow triggering the scraper with ?token=... or X-Scrape-Token header (no admin login)
SCRAPE_SECRET = config('SCRAPE_SECRET', default='')

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

    'backend.api',
    'backend.accounts',
    'backend.ufc',
    'backend.matchups',
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

ROOT_URLCONF = 'backend.core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'frontend' / 'dist'],
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

ASGI_APPLICATION = "backend.core.asgi.application"

# configure redis
redis_url = config("REDIS_URL", default="")
redis_configured = False

if redis_url:
    # Handle Upstash or other Redis URLs
    # If it's an HTTPS URL (Upstash REST endpoint), we need the Redis endpoint instead
    if redis_url.startswith("https://"):
        print(f"[SETTINGS] WARNING: REDIS_URL appears to be an HTTPS/REST endpoint: {redis_url}")
        print("[SETTINGS] You need the Redis connection URL (starts with redis:// or rediss://)")
        print("[SETTINGS] Check your Upstash dashboard for the 'Redis URL' (not REST URL)")
        # Try to convert Upstash REST URL to Redis URL (this is a guess, user should provide correct URL)
        host = redis_url.replace("https://", "").replace("http://", "").split("/")[0]
        redis_password = config("REDIS_PASSWORD", default="")
        redis_port = config("REDIS_PORT", default="6379")
        if redis_password:
            redis_url = f"rediss://:{redis_password}@{host}:{redis_port}"
            print(f"[SETTINGS] Attempting to construct Redis URL from components")
        else:
            print("[SETTINGS] ERROR: Cannot construct Redis URL. Please set REDIS_URL to the Redis connection string")
            redis_url = None

    if redis_url and not redis_url.startswith(("redis://", "rediss://", "unix://")):
        # If no scheme, assume redis://
        redis_url = f"redis://{redis_url}"

    if redis_url:
        url = urlparse(redis_url)
        # Validate scheme
        if url.scheme not in ("redis", "rediss", "unix"):
            print(f"[SETTINGS] ERROR: Invalid Redis URL scheme: {url.scheme}")
            print("[SETTINGS] Falling back to InMemoryChannelLayer")
        else:
            # Configure Redis channel layer
            if url.scheme == "rediss":  # add SSL options if using secure rediss
                redis_config = [{
                    "address": redis_url,
                    "ssl_cert_reqs": None,
                }]
            else:
                redis_config = [redis_url]

            CHANNEL_LAYERS = {
                "default": {
                    "BACKEND": "channels_redis.core.RedisChannelLayer",
                    "CONFIG": {
                        "hosts": redis_config,
                    },
                },
            }
            print(
                f"[SETTINGS] Redis channel layer configured with URL: {url.scheme}://{url.hostname}:{url.port or 'default'}")
            redis_configured = True

# Fallback to in-memory channel layer if Redis is not configured
if not redis_configured:
    CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "channels.layers.InMemoryChannelLayer",
        },
    }
    print("[SETTINGS] Redis not configured, using InMemoryChannelLayer (not suitable for production)")

# Database configuration with connection pooling for Neon
database_config = dj_database_url.config(default=config('DATABASE_URL'))

database_config.update({
    'CONN_MAX_AGE': 600,
    'OPTIONS': {
        'connect_timeout': 10,
    },
    'ATOMIC_REQUESTS': False,
})

DATABASES = {
    'default': database_config
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

# static files
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'backend' / 'staticfiles'
_frontend_static = BASE_DIR / 'frontend' / 'static'
STATICFILES_DIRS = [_frontend_static] if _frontend_static.exists() else []
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

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
