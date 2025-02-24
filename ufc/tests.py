from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from .views import ScraperView


User = get_user_model()


class UfcTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(username='testuser', password='testpass')
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        self.scraper_view = ScraperView()
        self.events_url = reverse('api:ufc:events')

    def test_parse_event_date(self):
        date_str = "Sun, Feb 23 / 2:00 AM UTC"
        result = self.scraper_view.parse_event_date(date_str)
        self.assertEqual(str(result), "2025-02-23 02:00:00+00:00")

        date_str = "Sat, Mar 15 / 11:00 PM UTC"
        result = self.scraper_view.parse_event_date(date_str)
        self.assertEqual(str(result), "2025-03-15 23:00:00+00:00")
