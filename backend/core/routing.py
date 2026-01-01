from django.urls import re_path
from backend.core.consumers import SelectionConsumer

websocket_urlpatterns = [
    re_path(r'ws/matchups/(?P<matchup_id>\d+)/$', SelectionConsumer.as_asgi()),
]
