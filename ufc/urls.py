from django.urls import path, include
from . import views

app_name = 'ufc'

urlpatterns = [
    path('upcoming/', views.UfcFightList.as_view(), name='upcoming'),
]
