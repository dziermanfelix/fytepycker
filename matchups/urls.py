from django.urls import path
from . import views

app_name = 'matchups'

urlpatterns = [
    path('', views.MatchupView.as_view(), name='matchups'),
    path('<int:user_a_id>/', views.MatchupView.as_view(), name='matchups_by_user_id'),
    path('<int:user_a_id>/<int:user_b_id>/', views.MatchupView.as_view(), name='matchups_by_user_id'),
    path('selection/', views.SelectionView.as_view(), name='selection'),
]
