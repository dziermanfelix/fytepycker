from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from .views import ScraperView


User = get_user_model()


class UfcTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.admin = get_user_model().objects.create_user(
            username='testadmin', email='admin@admin.com', password='testpass', is_staff=True)

        cls.scrape_url = reverse('api:ufc:scrape')

        client = APITestCase.client_class()
        client.force_login(cls.admin)
        response = client.get(cls.scrape_url)
        assert response.status_code == status.HTTP_200_OK

    def setUp(self):
        self.user = get_user_model().objects.create_user(username='testuser', password='testpass')
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        self.scraper_view = ScraperView()
        self.events_url = reverse('api:ufc:events')
        self.fights_url = reverse('api:ufc:fights')

    def test_parse_event_date(self):
        date_str = "Sun, Feb 23 / 2:00 AM UTC"
        result = self.scraper_view.parse_event_date(date_str)
        self.assertEqual(str(result), "2025-02-23 02:00:00+00:00")

        date_str = "Sat, Mar 15 / 11:00 PM UTC"
        result = self.scraper_view.parse_event_date(date_str)
        self.assertEqual(str(result), "2025-03-15 23:00:00+00:00")

    def test_get_events(self):
        response = self.client.get(self.events_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_get_fights(self):
        response = self.client.get(self.fights_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
