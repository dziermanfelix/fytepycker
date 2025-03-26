from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from .views import ScraperView
from .models import Event, Fight


User = get_user_model()


class UfcTests(APITestCase):
    # run scraper
    # @classmethod
    # def setUpTestData(cls):
    #     cls.admin = get_user_model().objects.create_user(
    #         username='testadmin', email='admin@admin.com', password='testpass', is_staff=True)

    #     cls.scrape_url = reverse('api:ufc:scrape')

    #     client = APITestCase.client_class()
    #     client.force_login(cls.admin)
    #     response = client.get(cls.scrape_url)
    #     assert response.status_code == status.HTTP_200_OK

    def setUp(self):
        self.user = get_user_model().objects.create_user(username='testuser', password='testpass')
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        self.scraper_view = ScraperView()
        self.events_url = reverse('api:ufc:events')
        self.addDummyData()

    def addDummyData(self):
        event = Event.objects.get_or_create(
            name="UFC 999",
            url="https://ufc.com/ufc999",
            date=ScraperView.parse_event_date(ScraperView, "Sat, Mar 15 / 11:00 PM UTC"),
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

    def test_parse_event_date(self):
        date_str = "Sun, Feb 23 / 2:00 AM UTC"
        result = self.scraper_view.parse_event_date(date_str)
        self.assertEqual(str(result), "2025-02-23 02:00:00+00:00")

        date_str = "Sat, Mar 15 / 11:00 PM UTC"
        result = self.scraper_view.parse_event_date(date_str)
        self.assertEqual(str(result), "2025-03-15 23:00:00+00:00")

    def test_normalize_name(self):
        result = self.scraper_view.normalize_name("Jan Błachowicz")
        self.assertEqual(str(result), "Jan Blachowicz")

        result = self.scraper_view.normalize_name("Jan Blachowicz")
        self.assertEqual(str(result), "Jan Blachowicz")

    def test_get_events(self):
        response = self.client.get(self.events_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_get_event_by_id(self):
        response = self.client.get(f'{self.events_url}{self.event.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['event']['id'], self.event.id)
