from django.urls import path
from . import views

app_name = 'matchups'

urlpatterns = [
    path('', views.MatchupView.as_view(), name='matchups'),
]
