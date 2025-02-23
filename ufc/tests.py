from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken


User = get_user_model()


class UfcTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(username='testuser', password='testpass')
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        self.scrape_url = reverse('api:ufc:scrape')
        self.events_url = reverse('api:ufc:events')

    def test_scrape(self):
        """Test scrape endpoint"""

        response = self.client.get(self.scrape_url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
