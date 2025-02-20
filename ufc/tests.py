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

        self.upcoming_url = reverse('api:ufc:upcoming')

    # def test_upcoming(self):
    #     """Test upcoming"""

    #     response = self.client.get(self.upcoming_url, format='json')
        # self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # self.assertTrue(User.objects.filter(username='newuser').exists())
        # self.assertIn('access', response.data)
        # self.assertIn('refresh', response.data)
