from django.urls import path, include
from . import views

app_name = 'api'

urlpatterns = [
    path('health/', views.HealthCheckView.as_view(), name='health'),
    path('auth/', include('accounts.urls', namespace='accounts')),
    path('ufc/', include('ufc.urls', namespace='ufc')),
]
