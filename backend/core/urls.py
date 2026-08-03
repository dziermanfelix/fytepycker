import os
from django.contrib import admin
from django.urls import path, include, re_path
from .views import FrontendAppView, ManifestView, AppleTouchIconView, PwaIconView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include('backend.api.urls', namespace='api')),
    path('manifest.webmanifest', ManifestView.as_view()),
    path('apple-touch-icon.png', AppleTouchIconView.as_view()),
    path('icons/<path:path>', PwaIconView.as_view()),
    # Keep SPA catch-all from swallowing PWA asset routes if URL order changes
    re_path(r'^(?!admin|api|manifest\.webmanifest|apple-touch-icon\.png|icons/).*$', FrontendAppView.as_view()),
]

urlpatterns += static(settings.STATIC_URL, document_root=os.path.join(settings.BASE_DIR, '../../frontend/static'))
