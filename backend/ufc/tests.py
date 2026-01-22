from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Event, Fight
from .serializers import EventSerializer
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

    def test_get_events(self):
        response = self.client.get(self.events_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['past']), 0)
        self.assertEqual(len(response.data['upcoming']), 1)
        self.assertEqual(response.data['upcoming'][0], EventSerializer(self.event).data)

    def test_get_event_by_id(self):
        response = self.client.get(f'{self.events_url}{self.event.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_event_complete(self):
        response = self.client.get(self.events_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['past']), 0)
        self.assertEqual(len(response.data['upcoming']), 1)
        self.assertEqual(response.data['upcoming'][0], EventSerializer(self.event).data)

        fight = Fight.objects.filter(id=self.fight.id).first()
        fight.winner = "paul"
        fight.method = "RNC"
        fight.round = 1
        fight.save()

        response = self.client.get(self.events_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['upcoming'], [])
        self.assertEqual(len(response.data['past']), 1)
        expected = EventSerializer(self.event).data
        expected['complete'] = True
        self.assertEqual(response.data['past'][0], expected)


class ScraperTests(APITestCase):
    def setUp(self):
        self.scraper = Scraper()

    def test_parse_event_date(self):
        date_str = "Sun, Dec 25 / 2:00 AM UTC"
        result = self.scraper.parse_event_date(date_str)
        self.assertEqual(str(result), "2025-12-25 02:00:00+00:00")

        date_str = "Sun, Jan 25 / 2:00 AM UTC"
        result = self.scraper.parse_event_date(date_str)
        self.assertEqual(str(result), "2026-01-25 02:00:00+00:00")

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
