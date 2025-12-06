from django.urls import reverse
from django.contrib.auth import get_user_model
from django.conf import settings
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from pathlib import Path


class VersionTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(username='testuser', email='testuser@gmail.com', password='testpass')
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        self.version_url = reverse('api:version')

    def test_version_check(self):
        response = self.client.get(self.version_url)
        version_path = Path(settings.BASE_DIR) / 'VERSION.txt'
        with open(version_path, 'r') as f:
            version = f.readline().strip()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['version'], version)
