from django.urls import path
from . import views

app_name = 'matchups'

urlpatterns = [
    path('', views.MatchupView.as_view(), name='matchups'),
    path('selections/', views.SelectionView.as_view(), name='selections'),
    path('record/', views.RecordView.as_view(), name='record'),
]
