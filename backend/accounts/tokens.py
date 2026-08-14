from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken

STANDALONE_CLIENT_MODE = 'standalone'
PERSISTENT_CLAIM = 'persistent'
CLIENT_MODE_HEADER = 'X-Client-Mode'


def pwa_refresh_lifetime():
    return settings.PWA_REFRESH_TOKEN_LIFETIME


def request_wants_persistent(request, refresh=None):
    if refresh is not None and refresh.get(PERSISTENT_CLAIM):
        return True
    if request is None:
        return False
    header = request.headers.get(CLIENT_MODE_HEADER, '')
    if header.lower() == STANDALONE_CLIENT_MODE:
        return True
    data = getattr(request, 'data', None) or {}
    return data.get('persistent') in (True, 'true', 'True', 1, '1')


def apply_persistent_claims(refresh):
    refresh[PERSISTENT_CLAIM] = True
    refresh.set_exp(lifetime=pwa_refresh_lifetime())


def issue_refresh_for_user(user, request=None):
    refresh = RefreshToken.for_user(user)
    if request_wants_persistent(request, refresh):
        apply_persistent_claims(refresh)
    return refresh


def rotate_persistent_refresh(refresh):
    try:
        refresh.blacklist()
    except AttributeError:
        pass
    refresh.set_jti()
    refresh.set_iat()
    apply_persistent_claims(refresh)
    return refresh
