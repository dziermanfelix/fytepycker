from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class AuthenticationTests(APITestCase):
    def setUp(self):
        self.test_user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.register_url = reverse('api:accounts:register')
        self.login_url = reverse('api:accounts:login')
        self.profile_url = reverse('api:accounts:profile')

    def test_user_registration(self):
        """Test user registration with valid data"""
        data = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'newpass123',
            'password2': 'newpass123',
        }

        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username='newuser').exists())
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_user_registration_invalid_data(self):
        """Test user registration with invalid data"""
        data = {
            'username': 'newuser',
            'password': 'newpass123',
        }

        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_login(self):
        """Test user login with valid credentials"""
        data = {
            'username': 'testuser',
            'password': 'testpass123'
        }

        response = self.client.post(self.login_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_user_login_user_not_exist(self):
        """Test user login with invalid credentials"""
        data = {
            'username': 'testuserdoesnotexist',
            'password': 'testpass123'
        }

        response = self.client.post(self.login_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data, {'error': 'Invalid credentials'})

    def test_user_login_invalid_credentials(self):
        """Test user login with invalid credentials"""
        data = {
            'username': 'testuser',
            'password': 'wrongpass'
        }

        response = self.client.post(self.login_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data, {'error': 'Invalid credentials'})

    def test_user_login_bad_request(self):
        """Test user login without required credentials"""
        data = {
            'username': 'testuser',
        }

        response = self.client.post(self.login_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_get_profile_authenticated(self):
        """Test getting user profile when authenticated"""
        # Get token for authentication
        refresh = RefreshToken.for_user(self.test_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], self.test_user.username)
        self.assertEqual(response.data['email'], self.test_user.email)

    def test_get_profile_unauthenticated(self):
        """Test getting user profile when not authenticated"""
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_update_profile(self):
        """Test updating user profile"""
        refresh = RefreshToken.for_user(self.test_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        data = {
            'email': 'testing@test.com'
        }

        response = self.client.put(self.profile_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], data['email'])

        # Verify the database was updated
        self.test_user.refresh_from_db()
        self.assertEqual(self.test_user.email, data['email'])
