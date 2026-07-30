from django.urls import reverse
from django.utils import timezone
from datetime import timedelta
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Event, Fight
from .serializers import EventSerializer, EventCardSerializer
from .scraper import Scraper


User = get_user_model()


class EventTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(username='testuser', password='testpass')
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        self.scraper = Scraper()
        self.events_url = reverse('api:ufc:events')
        self.addDummyData()

    def addDummyData(self):
        event = Event.objects.get_or_create(
            name="UFC 999",
            headline="Beatle Showdown",
            url="https://ufc.com/ufc999",
            date=self.scraper.parse_event_date("Sun, Feb 23 / 2:00 AM UTC"),
            location="the sun",
        )
        self.event = event[0]
        fight = Fight.objects.update_or_create(
            event_id=self.event.id,
            blue_name="paul",
            red_name="john",
            defaults={
                "card": "main",
                "order": 0,
                "weight_class": "heavyweight",
                "blue_img": "https://url.img",
                "blue_url": "https://url.img",
                "red_img": "https://url.img",
                "red_url": "https://url.img",
                "winner": None,
                "method": None,
                "round": None,
            }
        )
        self.fight = fight[0]

    def test_get_events_returns_upcoming_cards_only(self):
        future_event = Event.objects.create(
            name="UFC Future",
            headline="Next",
            url="https://ufc.com/future",
            date=timezone.now() + timedelta(days=14),
            location="vegas",
            complete=False,
        )
        Fight.objects.create(
            event=future_event,
            blue_name="a",
            red_name="b",
            card="main",
            order=0,
            weight_class="heavyweight",
        )

        response = self.client.get(self.events_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn('past', response.data)
        self.assertEqual(len(response.data['upcoming']), 1)
        self.assertEqual(response.data['upcoming'][0], EventCardSerializer(future_event).data)
        self.assertNotIn('fights', response.data['upcoming'][0])

    def test_get_events_include_past(self):
        response = self.client.get(self.events_url, {'include_past': 1})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['past']), 1)
        self.assertEqual(response.data['past'][0], EventCardSerializer(self.event).data)
        self.assertNotIn('fights', response.data['past'][0])

    def test_get_event_by_id(self):
        response = self.client.get(f'{self.events_url}{self.event.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['event']['id'], self.event.id)
        self.assertIn('fights', response.data['event'])
        self.assertIn('blue_name', response.data['event']['fights']['main'][0])

    def test_event_complete(self):
        future_event = Event.objects.create(
            name="UFC Live",
            headline="Tonight",
            url="https://ufc.com/live",
            date=timezone.now() + timedelta(hours=2),
            location="vegas",
            complete=False,
        )
        fight = Fight.objects.create(
            event=future_event,
            blue_name="paul",
            red_name="john",
            card="main",
            order=0,
            weight_class="heavyweight",
        )

        response = self.client.get(self.events_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['upcoming']), 1)
        self.assertEqual(response.data['upcoming'][0]['id'], future_event.id)

        fight.winner = "paul"
        fight.method = "RNC"
        fight.round = 1
        fight.save()

        response = self.client.get(self.events_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['upcoming'], [])

        response = self.client.get(self.events_url, {'include_past': 1})
        past_ids = [e['id'] for e in response.data['past']]
        self.assertIn(future_event.id, past_ids)


class ScraperTests(APITestCase):
    def setUp(self):
        self.scraper = Scraper()

    def test_parse_event_date(self):
        date_str = "Sun, Dec 25 / 2:00 AM UTC"
        result = self.scraper.parse_event_date(date_str)
        self.assertEqual(str(result), "2026-12-25 02:00:00+00:00")

        date_str = "Sun, Jan 25 / 2:00 AM UTC"
        result = self.scraper.parse_event_date(date_str)
        self.assertEqual(str(result), "2027-01-25 02:00:00+00:00")

        date_str = "Sun, Feb 23 / 2:00 AM UTC"
        result = self.scraper.parse_event_date(date_str)
        self.assertEqual(str(result), "2026-02-23 02:00:00+00:00")

        date_str = "Sat, Mar 15 / 11:00 PM UTC"
        result = self.scraper.parse_event_date(date_str)
        self.assertEqual(str(result), "2026-03-15 23:00:00+00:00")

    def test_normalize_name(self):
        result = self.scraper.normalize_name("Jan Błachowicz")
        self.assertEqual(str(result), "Jan Blachowicz")

        result = self.scraper.normalize_name("Jan Blachowicz")
        self.assertEqual(str(result), "Jan Blachowicz")
