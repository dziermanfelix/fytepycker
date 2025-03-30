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

    def test_get_all_matchups_empty(self):
        response = self.client.get(self.matchups_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

    def test_create_matchup(self):
        data = {
            "event_id": self.event.id,
            "user_a_id": self.user.id,
            "user_b_id": self.user2.id,
        }
        response = self.client.post(self.matchups_url, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # verify with get
        response = self.client.get(f'{self.matchups_url}{self.user.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]['event']['id'], self.event.id)
        self.assertEqual(response.data[0]['user_a']['id'], self.user.id)
        self.assertEqual(response.data[0]['user_b']['id'], self.user2.id)

    def test_create_duplicate_matchup(self):
        data = {
            "event_id": self.event.id,
            "user_a_id": self.user.id,
            "user_b_id": self.user2.id,
        }
        data2 = {
            "event_id": self.event.id,
            "user_a_id": self.user2.id,
            "user_b_id": self.user.id,
        }
        response = self.client.post(self.matchups_url, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # verify with get
        response = self.client.get(f'{self.matchups_url}{self.user.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]['event']['id'], self.event.id)
        self.assertEqual(response.data[0]['user_a']['id'], self.user.id)
        self.assertEqual(response.data[0]['user_b']['id'], self.user2.id)
        # try duplicate (switching users)
        response = self.client.post(self.matchups_url, data=data2, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response = self.client.get(self.matchups_url)
        # verify with get
        response = self.client.get(f'{self.matchups_url}{self.user.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]['event']['id'], self.event.id)
        self.assertEqual(response.data[0]['user_a']['id'], self.user.id)
        self.assertEqual(response.data[0]['user_b']['id'], self.user2.id)

    def test_user_default_matchup(self):
        data = {
            "event_id": self.event.id,
            "user_a_id": self.user.id,
            "user_b_id": self.user.id,
        }
        # first time clicking on event
        response = self.client.post(self.matchups_url, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # user clicks on event multiple times, the result shouldn't change
        response = self.client.post(self.matchups_url, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response = self.client.post(self.matchups_url, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response = self.client.post(self.matchups_url, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response = self.client.post(self.matchups_url, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # verify with get
        response = self.client.get(f'{self.matchups_url}{self.user.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['event']['id'], self.event.id)
        self.assertEqual(response.data[0]['user_a']['id'], self.user.id)
        self.assertEqual(response.data[0]['user_b']['id'], self.user.id)

    def test_get_matchup_different_flavors(self):
        data = {
            "event_id": self.event.id,
            "user_a_id": self.user.id,
            "user_b_id": self.user2.id,
        }
        response = self.client.post(self.matchups_url, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # verify with get user 1
        response = self.client.get(f'{self.matchups_url}{self.user.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]['event']['id'], self.event.id)
        self.assertEqual(response.data[0]['user_a']['id'], self.user.id)
        self.assertEqual(response.data[0]['user_b']['id'], self.user2.id)
        # verify with get user 2
        response = self.client.get(f'{self.matchups_url}{self.user2.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]['event']['id'], self.event.id)
        self.assertEqual(response.data[0]['user_a']['id'], self.user.id)
        self.assertEqual(response.data[0]['user_b']['id'], self.user2.id)
        # verify with get user1, user2
        response = self.client.get(f'{self.matchups_url}{self.user.id}/{self.user2.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]['event']['id'], self.event.id)
        self.assertEqual(response.data[0]['user_a']['id'], self.user.id)
        self.assertEqual(response.data[0]['user_b']['id'], self.user2.id)
        # verify with get user2, user1
        response = self.client.get(f'{self.matchups_url}{self.user2.id}/{self.user.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]['event']['id'], self.event.id)
        self.assertEqual(response.data[0]['user_a']['id'], self.user.id)
        self.assertEqual(response.data[0]['user_b']['id'], self.user2.id)

    def test_get_matchup_user_not_exists(self):
        data = {
            "event_id": self.event.id,
            "user_a_id": self.user.id,
            "user_b_id": self.user2.id,
        }
        response = self.client.post(self.matchups_url, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # verify with bad user 1
        response = self.client.get(f'{self.matchups_url}999/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])
        # verify with get bad user1, user2
        response = self.client.get(f'{self.matchups_url}999/{self.user2.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])
        # verify with get bad user1, bad user2
        response = self.client.get(f'{self.matchups_url}{self.user.id}/999/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])


class SelectionTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(username='testuser', email='testuser@gmail.com', password='testpass')
        self.user2 = get_user_model().objects.create_user(username='testuser2', email='testuser2@gmail.com', password='testpass2')
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        self.selection_url = reverse('api:matchups:selections')
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
        fight2 = Fight.objects.update_or_create(
            event_id=self.event.id,
            blue_name="george",
            red_name="ringo",
            defaults={
                "card": "main",
                "order": 0,
                "weight_class": "lightweight",
                "blue_img": "https://url.img",
                "blue_url": "https://url.img",
                "red_img": "https://url.img",
                "red_url": "https://url.img",
                "winner": None,
                "method": None,
                "round": None,
            }
        )
        self.fight2 = fight2[0]
        fight3 = Fight.objects.update_or_create(
            event_id=self.event.id,
            blue_name="tim",
            red_name="lars",
            defaults={
                "card": "main",
                "order": 0,
                "weight_class": "bantamweight",
                "blue_img": "https://url.img",
                "blue_url": "https://url.img",
                "red_img": "https://url.img",
                "red_url": "https://url.img",
                "winner": None,
                "method": None,
                "round": None,
            }
        )
        self.fight3 = fight3[0]
        matchup = Matchup.objects.update_or_create(
            event_id=self.event.id,
            user_a=self.user,
            user_b=self.user2,
        )
        self.matchup = matchup[0]
        defaultMatchup = Matchup.objects.update_or_create(
            event_id=self.event.id,
            user_a=self.user,
            user_b=self.user
        )
        self.defaultmatchup = defaultMatchup[0]

    def test_create_selection_from_matchup(self):
        data = {
            "matchup": self.matchup.id,
            "fight": self.fight.id,
            "user": self.user.id,
            "fighter": self.fight.blue_name
        }
        response = self.client.post(self.selection_url, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_selection_from_event(self):
        data = {
            "event": self.event.id,
            "fight": self.fight.id,
            "user": self.user.id,
            "fighter": self.fight.blue_name
        }
        response = self.client.post(self.selection_url, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_selection_from_matchup_matchup_not_exist(self):
        data = {
            "matchup": 9999,
            "fight": self.fight.id,
            "user": self.user.id,
            "fighter": self.fight.blue_name
        }
        response = self.client.post(self.selection_url, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_selection_from_matchup_fight_not_exist(self):
        data = {
            "matchup": self.event.id,
            "fight": 9999,
            "user": self.user.id,
            "fighter": self.fight.blue_name
        }
        response = self.client.post(self.selection_url, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_selection_from_matchup_user_not_exist(self):
        data = {
            "matchup": self.event.id,
            "fight": self.fight.id,
            "user": 99999,
            "fighter": self.fight.blue_name
        }
        response = self.client.post(self.selection_url, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_selection_from_matchup_invalid_user(self):
        other_user = get_user_model().objects.create_user(username='otheruser', email='otheruser@gmail.com', password='otherpass1234')
        data = {
            "matchup": self.event.id,
            "fight": self.fight.id,
            "user": other_user.id,
            "fighter": self.fight.blue_name
        }
        response = self.client.post(self.selection_url, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_selection_from_matchup_invalid_fight(self):
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

    def test_create_selection_from_matchup_invalid_fighter(self):
        data = {
            "matchup": self.event.id,
            "fight": self.fight.id,
            "user": self.user.id,
            "fighter": "dingdong"
        }
        response = self.client.post(self.selection_url, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_selection_from_event_event_not_exist(self):
        data = {
            "event": 9999,
            "fight": self.fight.id,
            "user": self.user.id,
            "fighter": self.fight.blue_name
        }
        response = self.client.post(self.selection_url, data=data, format="json")
        self.assertEqual(response.data['error'], "Matchup not found for the given event and user")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_selection_from_event_user_not_exist(self):
        data = {
            "event": self.event.id,
            "fight": self.fight.id,
            "user": 9999,
            "fighter": self.fight.blue_name
        }
        response = self.client.post(self.selection_url, data=data, format="json")
        self.assertEqual(response.data['error'], "Matchup not found for the given event and user")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_selection_change(self):
        data = {
            "matchup": self.matchup.id,
            "fight": self.fight.id,
            "user": self.user.id,
            "fighter": self.fight.blue_name
        }
        response = self.client.post(self.selection_url, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['selection']['matchup'], self.matchup.id)
        self.assertEqual(response.data['selection']['fight'], self.fight.id)
        self.assertEqual(response.data['selection']['user'], self.user.id)
        self.assertEqual(response.data['selection']['fighter'], self.fight.blue_name)
        # verify with get
        response = self.client.get(self.selection_url, data={"matchup": self.matchup.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]['matchup'], self.matchup.id)
        self.assertEqual(response.data[0]['fight'], self.fight.id)
        self.assertEqual(response.data[0]['user'], self.user.id)
        self.assertEqual(response.data[0]['fighter'], self.fight.blue_name)
        data['fighter'] = self.fight.red_name
        response = self.client.post(self.selection_url, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['selection']['matchup'], self.matchup.id)
        self.assertEqual(response.data['selection']['fight'], self.fight.id)
        self.assertEqual(response.data['selection']['user'], self.user.id)
        self.assertEqual(response.data['selection']['fighter'], self.fight.red_name)
        # verify with get
        response = self.client.get(self.selection_url, data={"matchup": self.matchup.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]['matchup'], self.matchup.id)
        self.assertEqual(response.data[0]['fight'], self.fight.id)
        self.assertEqual(response.data[0]['user'], self.user.id)
        self.assertEqual(response.data[0]['fighter'], self.fight.red_name)

    def test_selection_undo(self):
        data = {
            "matchup": self.matchup.id,
            "fight": self.fight.id,
            "user": self.user.id,
            "fighter": self.fight.blue_name
        }
        response = self.client.post(self.selection_url, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['selection']['matchup'], self.matchup.id)
        self.assertEqual(response.data['selection']['fight'], self.fight.id)
        self.assertEqual(response.data['selection']['user'], self.user.id)
        self.assertEqual(response.data['selection']['fighter'], self.fight.blue_name)
        # verify with get
        response = self.client.get(self.selection_url, data={"matchup": self.matchup.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]['matchup'], self.matchup.id)
        self.assertEqual(response.data[0]['fight'], self.fight.id)
        self.assertEqual(response.data[0]['user'], self.user.id)
        self.assertEqual(response.data[0]['fighter'], self.fight.blue_name)
        response = self.client.post(self.selection_url, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['selection']['matchup'], self.matchup.id)
        self.assertEqual(response.data['selection']['fight'], self.fight.id)
        self.assertEqual(response.data['selection']['user'], self.user.id)
        self.assertEqual(response.data['selection']['fighter'], '')
        # verify with get
        response = self.client.get(self.selection_url, data={"matchup": self.matchup.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]['matchup'], self.matchup.id)
        self.assertEqual(response.data[0]['fight'], self.fight.id)
        self.assertEqual(response.data[0]['user'], self.user.id)
        self.assertEqual(response.data[0]['fighter'], '')

    def test_create_and_get_selection_by_matchup(self):
        data = {
            "matchup": self.matchup.id,
            "fight": self.fight.id,
            "user": self.user.id,
            "fighter": self.fight.blue_name
        }
        response = self.client.post(self.selection_url, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        response = self.client.get(self.selection_url, data={"matchup": self.matchup.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]['matchup'], self.matchup.id)
        self.assertEqual(response.data[0]['fight'], self.fight.id)
        self.assertEqual(response.data[0]['user'], self.user.id)
        self.assertEqual(response.data[0]['fighter'], self.fight.blue_name)

    def test_create_and_get_selection_by_event_and_user(self):
        data = {
            "event": self.event.id,
            "fight": self.fight.id,
            "user": self.user.id,
            "fighter": self.fight.blue_name
        }
        response = self.client.post(self.selection_url, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        response = self.client.get(self.selection_url, data={"event": self.event.id, "user": self.user.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]['matchup'], self.defaultmatchup.id)
        self.assertEqual(response.data[0]['fight'], self.fight.id)
        self.assertEqual(response.data[0]['user'], self.user.id)
        self.assertEqual(response.data[0]['fighter'], self.fight.blue_name)

    def test_two_users_select_different_fighters(self):
        response = self.client.post(self.selection_url, data={
            "matchup": self.matchup.id,
            "fight": self.fight.id,
            "user": self.user.id,
            "fighter": self.fight.blue_name
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        response = self.client.post(self.selection_url, data={
            "matchup": self.matchup.id,
            "fight": self.fight.id,
            "user": self.user2.id,
            "fighter": self.fight.red_name
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_two_users_select_same_fighter(self):
        response = self.client.post(self.selection_url, data={
            "matchup": self.matchup.id,
            "fight": self.fight.id,
            "user": self.user.id,
            "fighter": self.fight.blue_name
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        response = self.client.get(self.selection_url, data={"matchup": self.matchup.id})
        self.assertEqual(response.data[0]['user'], self.user.id)
        response = self.client.post(self.selection_url, data={
            "matchup": self.matchup.id,
            "fight": self.fight.id,
            "user": self.user2.id,
            "fighter": self.fight.blue_name
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        response = self.client.get(self.selection_url, data={"matchup": self.matchup.id})
        self.assertEqual(response.data[0]['user'], self.user.id)
