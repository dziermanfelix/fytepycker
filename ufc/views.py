from django.utils import timezone
from rest_framework.permissions import IsAdminUser
from rest_framework.authentication import SessionAuthentication, BasicAuthentication
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from playwright.sync_api import sync_playwright
from rest_framework import status
from .serializers import EventSerializer
from bs4 import BeautifulSoup
from .models import Event
from datetime import datetime
import pytz
from django.shortcuts import get_object_or_404
from .scraper import Scraper


class EventView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request, *args, **kwargs):
        event_id = kwargs.get("event_id")
        if not event_id:
            past_events = Event.objects.prefetch_related('fights').filter(complete=True).order_by('-date')
            upcoming_events = Event.objects.prefetch_related('fights').filter(complete=False).order_by('date')
            return Response({
                'past': EventSerializer(past_events, many=True).data,
                'upcoming': EventSerializer(upcoming_events, many=True).data
            })
        event = get_object_or_404(Event.objects.prefetch_related('fights'), id=event_id)
        return Response({'event': EventSerializer(event).data})


class ScraperView(APIView):
    permission_classes = [IsAdminUser]
    authentication_classes = [SessionAuthentication, BasicAuthentication]

    def get(self, request):
        print(f'scraper get called')
        scraper = Scraper()
        action = request.query_params.get('action')
        scraper.scrape_fights_for_action(action)
        events = Event.objects.all()
        print(f'events = {events.__dict__}')
        serializer = EventSerializer(events, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
