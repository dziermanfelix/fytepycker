from django.urls import path, include
from . import views

app_name = 'api'

urlpatterns = [
    path('health/', views.HealthCheckView.as_view(), name='health'),
    path('version/', views.VersionView.as_view(), name='version'),
    path('auth/', include('accounts.urls', namespace='accounts')),
    path('ufc/', include('ufc.urls', namespace='ufc')),
    path('matchups/', include('matchups.urls', namespace='matchups')),
]
