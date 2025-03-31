from django.urls import re_path
from core.consumers import SelectionConsumer

websocket_urlpatterns = [
    re_path(r'ws/selections/(?P<matchup_id>\d+)/$', SelectionConsumer.as_asgi()),
]
