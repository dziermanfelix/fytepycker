import os
from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include('api.urls', namespace='api')),
    path('', TemplateView.as_view(template_name=os.path.join(settings.STATIC_ROOT, 'index.html'))),
    path('<path:path>', TemplateView.as_view(template_name=os.path.join(settings.STATIC_ROOT, 'index.html')))]
