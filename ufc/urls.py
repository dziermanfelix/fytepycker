from django.urls import path, include
from . import views

app_name = 'ufc'

urlpatterns = [
    path('scrape/', views.ScraperView.as_view(), name='scrape'),
    path('events/', views.EventList.as_view(), name='events'),
]
