from django.conf import settings
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
    permission_classes = []  # auth checked in get()
    authentication_classes = [SessionAuthentication, BasicAuthentication]

    def get(self, request):
        # Allow: admin user, or valid SCRAPE_SECRET (query ?token=... or header X-Scrape-Token)
        scrape_secret = getattr(settings, 'SCRAPE_SECRET', '') or ''
        token = request.query_params.get('token') or request.headers.get('X-Scrape-Token') or ''
        if request.user.is_authenticated and request.user.is_staff:
            pass  # allowed
        elif scrape_secret and token and token == scrape_secret:
            pass  # allowed
        else:
            return Response(
                {'error': 'You must be a staff user or provide a valid token to access this endpoint'},
                status=status.HTTP_403_FORBIDDEN
            )
        scraper = Scraper()
        action = request.query_params.get('action', 'upcoming')
        if action not in ['past', 'upcoming', 'live']:
            return Response(
                {'error': f'Invalid action. Must be one of: past, upcoming, live'},
                status=status.HTTP_400_BAD_REQUEST
            )
        scraped_events, changes = scraper.scrape_fights_for_action(action)
        summary = [
            {'id': e.id, 'name': e.name, 'headline': e.headline, 'date': e.date.isoformat(), 'fight_count': e.fights.count()}
            for e in scraped_events
        ]
        return Response({
            'ok': True,
            'action': action,
            'events_updated': len(scraped_events),
            'events': summary,
            'changes': changes,
        }, status=status.HTTP_200_OK)
