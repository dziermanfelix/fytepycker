from django.urls import path
from . import views

app_name = 'ufc'

urlpatterns = [
    path('scrape/', views.ScraperView.as_view(), name='scrape'),
    path('events/', views.EventView.as_view(), name='events'),
    path('events/<int:event_id>/', views.EventView.as_view(), name='event_by_id'),
]
