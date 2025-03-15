from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from ufc.models import Event, Fight
from .models import Matchup
from ufc.views import ScraperView


User = get_user_model()


class MatchupTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(username='testuser', email='testuser@gmail.com', password='testpass')
        self.user2 = get_user_model().objects.create_user(username='testuser2', email='testuser2@gmail.com', password='testpass2')
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        self.matchups_url = reverse('api:matchups:matchups')
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

    def test_get_matchups(self):
        response = self.client.get(self.matchups_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

    def test_create_matchup(self):
        def create():
            data = {
                "event": self.event.id,
                "creator": self.user.id,
                "opponent": self.user2.id,
            }
            response = self.client.post(self.matchups_url, data=data, format="json")
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        def get():
            response = self.client.get(self.matchups_url)
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertEqual(response.data[0]['event'], self.event.id)
            self.assertEqual(response.data[0]['creator'], self.user.id)
            self.assertEqual(response.data[0]['opponent'], self.user2.id)

        create()
        get()

    def test_create_duplicate_matchup(self):
        def get():
            response = self.client.get(self.matchups_url)
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertEqual(response.data[0]['event'], self.event.id)
            self.assertEqual(response.data[0]['creator'], self.user.id)
            self.assertEqual(response.data[0]['opponent'], self.user2.id)
        data = {
            "event": self.event.id,
            "creator": self.user.id,
            "opponent": self.user2.id,
        }
        # post request (first time user clicks event)
        response = self.client.post(self.matchups_url, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        get()
        # post request again (user clicks event later)
        response = self.client.post(self.matchups_url, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        get()


class SelectionTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(username='testuser', email='testuser@gmail.com', password='testpass')
        self.user2 = get_user_model().objects.create_user(username='testuser2', email='testuser2@gmail.com', password='testpass2')
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        self.selection_url = reverse('api:matchups:selection')
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
        matchup = Matchup.objects.update_or_create(
            event_id=self.event.id,
            creator=self.user,
            opponent=self.user2,
        )
        self.matchup = matchup[0]

    def test_create_selection(self):
        data = {
            "matchup": self.matchup.id,
            "fight": self.fight.id,
            "user": self.user.id,
            "fighter": self.fight.blue_name
        }
        response = self.client.post(self.selection_url, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_selection_matchup_not_exist(self):
        data = {
            "matchup": 9999,
            "fight": self.fight.id,
            "user": self.user.id,
            "fighter": self.fight.blue_name
        }
        response = self.client.post(self.selection_url, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_selection_fight_not_exist(self):
        data = {
            "matchup": self.event.id,
            "fight": 9999,
            "user": self.user.id,
            "fighter": self.fight.blue_name
        }
        response = self.client.post(self.selection_url, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_selection_user_not_exist(self):
        data = {
            "matchup": self.event.id,
            "fight": self.fight.id,
            "user": 99999,
            "fighter": self.fight.blue_name
        }
        response = self.client.post(self.selection_url, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_selection_invalid_user(self):
        other_user = get_user_model().objects.create_user(username='otheruser', email='otheruser@gmail.com', password='otherpass1234')
        data = {
            "matchup": self.event.id,
            "fight": self.fight.id,
            "user": other_user.id,
            "fighter": self.fight.blue_name
        }
        response = self.client.post(self.selection_url, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        # TODO assert error message

    def test_create_selection_invalid_fight(self):
        other_event = Event.objects.get_or_create(
            name="UFC 1000",
            url="https://ufc.com/ufc1000",
            date=ScraperView.parse_event_date(ScraperView, "Sat, Mar 15 / 11:00 PM UTC"),
            location="the moon",
        )
        other_event = other_event[0]
        other_fight = Fight.objects.update_or_create(
            event_id=other_event.id,
            blue_name="ringo",
            red_name="george",
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
        other_fight = other_fight[0]
        data = {
            "matchup": self.event.id,
            "fight": other_fight.id,
            "user": self.user.id,
            "fighter": self.fight.blue_name
        }
        response = self.client.post(self.selection_url, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        # TODO assert error message

    def test_create_selection_invalid_fighter(self):
        data = {
            "matchup": self.event.id,
            "fight": self.fight.id,
            "user": self.user.id,
            "fighter": "dingdong"
        }
        response = self.client.post(self.selection_url, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        # TODO assert error message

    # TODO add test for multiple selections in same matchup, realistic test
