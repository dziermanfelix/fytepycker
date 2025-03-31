from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model

User = get_user_model()


class AuthenticationTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

        refresh = RefreshToken.for_user(self.user)
        self.refresh_token = str(refresh)
        self.access_token = str(refresh.access_token)

        self.authenticated_client = APIClient()
        self.authenticated_client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')

        self.register_url = reverse('api:accounts:register')
        self.login_url = reverse('api:accounts:login')
        self.logout_url = reverse('api:accounts:logout')
        self.user_url = reverse('api:accounts:user')
        self.token_refresh_url = reverse('api:accounts:token_refresh')
        self.users_url = reverse('api:accounts:users')

    def test_get_users(self):
        data = {
            'username': 'john',
            'email': 'john@beatles.com',
            'password': 'password1234',
            'password2': 'password1234',
        }
        data2 = {
            'username': 'paul',
            'email': 'paul@beatles.com',
            'password': 'password1234',
            'password2': 'password1234',
        }
        data3 = {
            'username': 'george',
            'email': 'george@beatles.com',
            'password': 'password1234',
            'password2': 'password1234',
        }
        data4 = {
            'username': 'ringo',
            'email': 'ringo@beatles.com',
            'password': 'password1234',
            'password2': 'password1234',
        }
        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        response = self.client.post(self.register_url, data2, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        response = self.client.post(self.register_url, data3, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        response = self.client.post(self.register_url, data4, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        response = self.authenticated_client.get(self.users_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 5)

    def test_token_refresh(self):
        """Test the /token/refresh/ endpoint."""
        data = {'refresh': self.refresh_token}
        response = self.client.post(self.token_refresh_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertNotEqual(response.data['access'], self.access_token)

    def test_token_refresh_invalid_refresh_token(self):
        """Test the /token/refresh/ endpoint with an invalid refresh token."""
        data = {'refresh': 'invalid-refresh-token'}
        response = self.client.post(self.token_refresh_url, data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(str(response.data['detail']), 'Token is invalid or expired')

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
            'username': 'newuser90',
            'password': 'newpass123',
            'password2': 'newpass123',
        }

        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data, {'email': ['This field is required.']})

    def test_user_registration_unmatching_passwords(self):
        """Test user registration with passwords that do not match"""
        data = {
            'username': 'newuser',
            'email': 'cool@gmail.com',
            'password': 'newpass123',
            'password2': 'newpass456',
        }

        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data, {'password': ['Password fields do not match.']})

    def test_create_invalid_username_length(self):
        """Test user registration with username lengthy username"""
        data = {
            'username': 'testusertestusertestusertestusertestuser',
            'email': 'test11@example.com',
            'password': 'testpass123',
            'password2': 'testpass123',
        }

        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data, {'username': ['Ensure this field has no more than 24 characters.']})

    def test_create_duplicate_username(self):
        """Test user registration with nonunique username"""
        data = {
            'username': 'testuser',
            'email': 'test123@example.com',
            'password': 'testpass123',
            'password2': 'testpass123',
        }

        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data, {'username': ['user with this username already exists.']})

    def test_create_duplicate_email(self):
        """Test user registration with nonunique email"""
        data = {
            'username': 'testuser12',
            'email': 'test@example.com',
            'password': 'testpass123',
            'password2': 'testpass123',
        }

        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data, {'email': ['user with this email address already exists.']})

    def test_create_invalid_symbol(self):
        """Test user registration with invalid symbol in username"""
        data = {
            'username': 'user!@#$%^',
            'email': 'test1@example.com',
            'password': 'testpass123',
            'password2': 'testpass123',
        }

        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data,
                         {'username': ['Username may contain only letters, numbers, and ./-/_ characters.']})

    def test_create_invalid_email(self):
        """Test user registration with invalid email address"""
        data = {
            'username': 'user1',
            'email': 'test1@examplecom',
            'password': 'testpass123',
            'password2': 'testpass123',
        }

        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data, {'email': ['Enter a valid email address.']})

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
        self.assertEqual(response.data, {'password': ['This field is required.']})

    def test_get_user_authenticated(self):
        """Test getting user when authenticated"""
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        response = self.client.get(self.user_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], self.user.username)
        self.assertEqual(response.data['email'], self.user.email)

    def test_get_user_unauthenticated(self):
        """Test getting user when not authenticated"""
        response = self.client.get(self.user_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_update_user(self):
        """Test updating user"""
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        data = {
            'email': 'testing@test.com'
        }

        response = self.client.put(self.user_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], data['email'])

        # verify db
        self.user.refresh_from_db()
        self.assertEqual(self.user.email, data['email'])

    def test_user_logout(self):
        """Test user login with valid credentials"""
        data = {
            'username': 'testuser',
            'password': 'testpass123'
        }

        response = self.client.post(self.login_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        response = self.authenticated_client.post(
            self.logout_url, {'refresh': response.data['refresh']}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Successfully logged out.')

    def test_user_logout_no_refresh_token(self):
        """Test user login with valid credentials"""
        data = {
            'username': 'testuser',
            'password': 'testpass123'
        }

        response = self.client.post(self.login_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        response = self.authenticated_client.post(self.logout_url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'Refresh token is required.')
