from django.urls import path
from . import views

app_name = 'matchups'

urlpatterns = [
    path('', views.MatchupView.as_view(), name='matchups'),
    path('selection', views.SelectionView.as_view(), name='selection'),
]
