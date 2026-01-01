from django.urls import path, include
from . import views

app_name = 'api'

urlpatterns = [
    path('health/', views.HealthCheckView.as_view(), name='health'),
    path('version/', views.VersionView.as_view(), name='version'),
    path('auth/', include('backend.accounts.urls', namespace='accounts')),
    path('ufc/', include('backend.ufc.urls', namespace='ufc')),
    path('matchups/', include('backend.matchups.urls', namespace='matchups')),
]
