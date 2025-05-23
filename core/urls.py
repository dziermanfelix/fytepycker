import os
from django.contrib import admin
from django.urls import path, include, re_path
from .views import FrontendAppView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include('api.urls', namespace='api')),
    re_path(r'^(?!admin|api).*$', FrontendAppView.as_view()),
]

urlpatterns += static(settings.STATIC_URL, document_root=os.path.join(settings.BASE_DIR, 'frontend/dist'))
