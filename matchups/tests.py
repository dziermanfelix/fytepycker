from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from ufc.models import Event, Fight
from .models import Matchup
from ufc.views import ScraperView
from matchups.models import SelectionResult


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
        fight2 = Fight.objects.update_or_create(
            event_id=self.event.id,
            blue_name="george",
            red_name="ringo",
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
        self.fight2 = fight2[0]

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
        response = self.client.get(self.matchups_url, {'user_a_id': self.user.id, 'user_b_id': self.user2.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]['event']['id'], self.event.id)
        self.assertEqual(response.data[0]['user_a']['id'], self.user.id)
        self.assertEqual(response.data[0]['user_b']['id'], self.user2.id)
        self.assertIn(response.data[0]['first_pick'], [self.user.id, self.user2.id])

    def test_create_matchup_duplicate(self):
        data = {
            "event_id": self.event.id,
            "user_a_id": self.user.id,
            "user_b_id": self.user2.id,
        }
        response = self.client.post(self.matchups_url, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        response = self.client.post(self.matchups_url, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_get_matchup_by_id(self):
        data = {
            "event_id": self.event.id,
            "user_a_id": self.user.id,
            "user_b_id": self.user2.id,
        }
        response = self.client.post(self.matchups_url, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        matchup_id = response.data['matchup']['id']
        response = self.client.get(self.matchups_url, {'id': matchup_id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]['event']['id'], self.event.id)
        self.assertEqual(response.data[0]['user_a']['id'], self.user.id)
        self.assertEqual(response.data[0]['user_b']['id'], self.user2.id)
        self.assertIn(response.data[0]['first_pick'], [self.user.id, self.user2.id])

    def test_get_matchup_by_user_a_id(self):
        data = {
            "event_id": self.event.id,
            "user_a_id": self.user.id,
            "user_b_id": self.user2.id,
        }
        response = self.client.post(self.matchups_url, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        response = self.client.get(f'{self.matchups_url}', {'user_a_id': self.user.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]['event']['id'], self.event.id)
        self.assertEqual(response.data[0]['user_a']['id'], self.user.id)
        self.assertEqual(response.data[0]['user_b']['id'], self.user2.id)
        self.assertIn(response.data[0]['first_pick'], [self.user.id, self.user2.id])

    def test_get_matchup_by_user_b_id(self):
        data = {
            "event_id": self.event.id,
            "user_a_id": self.user.id,
            "user_b_id": self.user2.id,
        }
        response = self.client.post(self.matchups_url, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        response = self.client.get(f'{self.matchups_url}', {'user_b_id': self.user.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]['event']['id'], self.event.id)
        self.assertEqual(response.data[0]['user_a']['id'], self.user.id)
        self.assertEqual(response.data[0]['user_b']['id'], self.user2.id)
        self.assertIn(response.data[0]['first_pick'], [self.user.id, self.user2.id])

    def test_get_matchup_by_user_ids(self):
        data = {
            "event_id": self.event.id,
            "user_a_id": self.user.id,
            "user_b_id": self.user2.id,
        }
        response = self.client.post(self.matchups_url, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        response = self.client.get(f'{self.matchups_url}', {'user_a_id': self.user.id, 'user_b_id': self.user2.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]['event']['id'], self.event.id)
        self.assertEqual(response.data[0]['user_a']['id'], self.user.id)
        self.assertEqual(response.data[0]['user_b']['id'], self.user2.id)
        self.assertIn(response.data[0]['first_pick'], [self.user.id, self.user2.id])

    def test_get_matchup_by_user_ids_out_of_order(self):
        data = {
            "event_id": self.event.id,
            "user_a_id": self.user.id,
            "user_b_id": self.user2.id,
        }
        response = self.client.post(self.matchups_url, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        response = self.client.get(f'{self.matchups_url}', {'user_a_id': self.user2.id, 'user_b_id': self.user.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]['event']['id'], self.event.id)
        self.assertEqual(response.data[0]['user_a']['id'], self.user.id)
        self.assertEqual(response.data[0]['user_b']['id'], self.user2.id)
        self.assertIn(response.data[0]['first_pick'], [self.user.id, self.user2.id])

    def test_get_matchup_user_not_exists(self):
        data = {
            "event_id": self.event.id,
            "user_a_id": self.user.id,
            "user_b_id": self.user2.id,
        }
        response = self.client.post(self.matchups_url, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # verify with bad user 1
        response = self.client.get(self.matchups_url, {'user_a_id': 999, 'user_b_id': self.user2.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])
        # verify with get bad user2
        response = self.client.get(self.matchups_url, {'user_a_id': self.user.id, 'user_b_id': 999})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])
        # verify with get bad user1, bad user2
        response = self.client.get(self.matchups_url, {'user_a_id': 999, 'user_b_id': 989})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

    def test_delete_matchup(self):
        data = {
            "event_id": self.event.id,
            "user_a_id": self.user.id,
            "user_b_id": self.user2.id,
        }
        response = self.client.post(self.matchups_url, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # verify with get
        response = self.client.get(self.matchups_url, {'user_a_id': self.user.id, 'user_b_id': self.user2.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]['event']['id'], self.event.id)
        self.assertEqual(response.data[0]['user_a']['id'], self.user.id)
        self.assertEqual(response.data[0]['user_b']['id'], self.user2.id)
        self.assertIn(response.data[0]['first_pick'], [self.user.id, self.user2.id])
        response = self.client.delete(self.matchups_url,
                                      data={
                                          'event_id': self.event.id,
                                          'user_a_id': self.user.id,
                                          'user_b_id': self.user2.id},
                                      format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Matchup deleted successfully.')
        # confirm db
        matchup_exists = Matchup.objects.filter(
            event=self.event.id, user_a=self.user.id, user_b=self.user2.id).exists()
        self.assertFalse(matchup_exists, "Matchup still exists in the database.")

    def test_delete_matchup_error_matchup_not_found(self):
        response = self.client.delete(self.matchups_url,
                                      data={
                                          'event_id': self.event.id,
                                          'user_a_id': self.user.id,
                                          'user_b_id': self.user2.id},
                                      format="json")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['error'], 'Matchup not found.')


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
        matchup = Matchup.objects.update_or_create(
            event_id=self.event.id,
            user_a=self.user,
            user_b=self.user2,
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
        self.assertEqual(response.data['selection']['matchup'], self.matchup.id)
        self.assertEqual(response.data['selection']['fight'], self.fight.id)
        self.assertEqual(response.data['selection']['user_a_selection'], self.fight.blue_name)
        self.assertEqual(response.data['selection']['user_b_selection'], None)
        self.assertEqual(response.data['selection']['bet'], 0)
        self.assertEqual(response.data['selection']['winner'], None)
        self.assertEqual(response.data['selection']['dibs'], None)
        self.assertEqual(response.data['selection']['confirmed'], False)

    def test_create_selection_error_matchup_not_exists(self):
        data = {
            "matchup": 9999,
            "fight": self.fight.id,
            "user": self.user.id,
            "fighter": self.fight.blue_name
        }
        response = self.client.post(self.selection_url, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_selection_error_fight_not_exists(self):
        data = {
            "matchup": self.matchup.id,
            "fight": 9999,
            "user": self.user.id,
            "fighter": self.fight.blue_name
        }
        response = self.client.post(self.selection_url, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_selection_error_user_not_exists(self):
        data = {
            "matchup": self.matchup.id,
            "fight": self.fight.id,
            "user": 99999,
            "fighter": self.fight.blue_name
        }
        response = self.client.post(self.selection_url, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_selection_error_invalid_user(self):
        other_user = get_user_model().objects.create_user(username='otheruser', email='otheruser@gmail.com', password='otherpass1234')
        data = {
            "matchup": self.matchup.id,
            "fight": self.fight.id,
            "user": other_user.id,
            "fighter": self.fight.blue_name
        }
        response = self.client.post(self.selection_url, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_selection_error_invalid_fight(self):
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
            "matchup": self.matchup.id,
            "fight": other_fight.id,
            "user": self.user.id,
            "fighter": self.fight.blue_name
        }
        response = self.client.post(self.selection_url, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_selection_error_invalid_fighter(self):
        data = {
            "matchup": self.matchup.id,
            "fight": self.fight.id,
            "user": self.user.id,
            "fighter": "dingdong"
        }
        response = self.client.post(self.selection_url, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_get_selection(self):
        data = {
            "matchup": self.matchup.id,
            "fight": self.fight.id,
            "user": self.user.id,
            "fighter": self.fight.red_name
        }
        response = self.client.post(self.selection_url, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        response = self.client.get(self.selection_url, {"matchup_id": self.matchup.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]['matchup'], self.matchup.id)
        self.assertEqual(response.data[0]['fight'], self.fight.id)
        self.assertEqual(response.data[0]['user_a_selection'], self.fight.red_name)
        self.assertEqual(response.data[0]['user_b_selection'], None)
        self.assertEqual(response.data[0]['bet'], 0)
        self.assertEqual(response.data[0]['winner'], None)
        self.assertEqual(response.data[0]['dibs'], None)
        self.assertEqual(response.data[0]['confirmed'], False)

    def test_get_selection_error_matchup_id_not_provided(self):
        data = {
            "matchup": self.matchup.id,
            "fight": self.fight.id,
            "user": self.user.id,
            "fighter": self.fight.red_name
        }
        response = self.client.post(self.selection_url, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        response = self.client.get(self.selection_url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_change_selection(self):
        data = {
            "matchup": self.matchup.id,
            "fight": self.fight.id,
            "user": self.user.id,
            "fighter": self.fight.blue_name
        }
        response = self.client.post(self.selection_url, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        response = self.client.get(self.selection_url, data={"matchup_id": self.matchup.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]['matchup'], self.matchup.id)
        self.assertEqual(response.data[0]['fight'], self.fight.id)
        self.assertEqual(response.data[0]['user_a_selection'], self.fight.blue_name)
        self.assertEqual(response.data[0]['user_b_selection'], None)
        self.assertEqual(response.data[0]['bet'], 0)
        self.assertEqual(response.data[0]['winner'], None)
        self.assertEqual(response.data[0]['dibs'], None)
        self.assertEqual(response.data[0]['confirmed'], False)
        data = {
            "matchup": self.matchup.id,
            "fight": self.fight.id,
            "user": self.user.id,
            "fighter": self.fight.red_name
        }
        response = self.client.post(self.selection_url, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response = self.client.get(self.selection_url, data={"matchup_id": self.matchup.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]['matchup'], self.matchup.id)
        self.assertEqual(response.data[0]['fight'], self.fight.id)
        self.assertEqual(response.data[0]['user_a_selection'], self.fight.red_name)
        self.assertEqual(response.data[0]['user_b_selection'], None)
        self.assertEqual(response.data[0]['bet'], 0)
        self.assertEqual(response.data[0]['winner'], None)
        self.assertEqual(response.data[0]['dibs'], None)
        self.assertEqual(response.data[0]['confirmed'], False)

    def test_undo_selection(self):
        data = {
            "matchup": self.matchup.id,
            "fight": self.fight.id,
            "user": self.user.id,
            "fighter": self.fight.blue_name
        }
        response = self.client.post(self.selection_url, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        response = self.client.get(self.selection_url, data={"matchup_id": self.matchup.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]['matchup'], self.matchup.id)
        self.assertEqual(response.data[0]['fight'], self.fight.id)
        self.assertEqual(response.data[0]['user_a_selection'], self.fight.blue_name)
        self.assertEqual(response.data[0]['user_b_selection'], None)
        self.assertEqual(response.data[0]['bet'], 0)
        self.assertEqual(response.data[0]['winner'], None)
        self.assertEqual(response.data[0]['dibs'], None)
        self.assertEqual(response.data[0]['confirmed'], False)
        response = self.client.post(self.selection_url, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response = self.client.get(self.selection_url, data={"matchup_id": self.matchup.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]['matchup'], self.matchup.id)
        self.assertEqual(response.data[0]['fight'], self.fight.id)
        self.assertEqual(response.data[0]['user_a_selection'], None)
        self.assertEqual(response.data[0]['user_b_selection'], None)
        self.assertEqual(response.data[0]['bet'], 0)
        self.assertEqual(response.data[0]['winner'], None)
        self.assertEqual(response.data[0]['dibs'], None)
        self.assertEqual(response.data[0]['confirmed'], False)

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
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_two_users_select_same_fighter(self):
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
            "fighter": self.fight.blue_name
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class SelectionResultTest(APITestCase):
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
        matchup = Matchup.objects.update_or_create(
            event_id=self.event.id,
            user_a=self.user,
            user_b=self.user2,
        )
        self.matchup = matchup[0]

    def test_selection_result_created(self):
        data = {
            "matchup": self.matchup.id,
            "fight": self.fight.id,
            "user": self.user.id,
            "fighter": self.fight.blue_name
        }
        response = self.client.post(self.selection_url, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        response = self.client.get(self.selection_url, {"matchup_id": self.matchup.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        selection_result = SelectionResult.objects.filter(matchup=self.matchup, fight=self.fight).first()
        self.assertIsNotNone(selection_result, "SelectionResult should be created when a Selection is made")
        self.assertEqual(selection_result.matchup, self.matchup)
        self.assertEqual(selection_result.fight, self.fight)
        self.assertEqual(selection_result.winner, None)
        self.assertEqual(selection_result.winnings, 0)

    def test_selection_result_created_once(self):
        response = self.client.post(self.selection_url,
                                    data={
                                        "matchup": self.matchup.id,
                                        "fight": self.fight.id,
                                        "user": self.user.id,
                                        "fighter": self.fight.blue_name
                                    },
                                    format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        response = self.client.get(self.selection_url, {"matchup_id": self.matchup.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        response = self.client.post(self.selection_url,
                                    data={
                                        "matchup": self.matchup.id,
                                        "fight": self.fight.id,
                                        "user": self.user2.id,
                                        "fighter": self.fight.red_name
                                    },
                                    format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        response = self.client.get(self.selection_url, {"matchup_id": self.matchup.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        selection_results = SelectionResult.objects.filter(matchup=self.matchup, fight=self.fight)
        self.assertEqual(selection_results.count(), 1)
        selection_result = selection_results.first()
        self.assertIsNotNone(selection_result, "SelectionResult should be created when a Selection is made")
        self.assertEqual(selection_result.matchup, self.matchup)
        self.assertEqual(selection_result.fight, self.fight)
        self.assertEqual(selection_result.winner, None)
        self.assertEqual(selection_result.winnings, 0)

    def test_selection_result_updates_after_fight_winner(self):
        response = self.client.post(self.selection_url,
                                    data={
                                        "matchup": self.matchup.id,
                                        "fight": self.fight.id,
                                        "user": self.user.id,
                                        "fighter": self.fight.blue_name
                                    },
                                    format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        response = self.client.get(self.selection_url, {"matchup_id": self.matchup.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        response = self.client.post(self.selection_url,
                                    data={
                                        "matchup": self.matchup.id,
                                        "fight": self.fight.id,
                                        "user": self.user2.id,
                                        "fighter": self.fight.red_name
                                    },
                                    format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        response = self.client.get(self.selection_url, {"matchup_id": self.matchup.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        selection_results = SelectionResult.objects.filter(matchup=self.matchup, fight=self.fight)
        self.assertEqual(selection_results.count(), 1)
        selection_result = selection_results.first()
        self.assertIsNotNone(selection_result, "SelectionResult should be created when a Selection is made")
        self.assertEqual(selection_result.matchup, self.matchup)
        self.assertEqual(selection_result.fight, self.fight)
        self.assertEqual(selection_result.winner, None)
        self.assertEqual(selection_result.winnings, 0)
        # update fight winner
        updated_fight = Fight.objects.update_or_create(
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
                "winner": "john",
                "method": "submission",
                "round": 1,
            }
        )
        self.fight = updated_fight[0]
        # verify selection result update
        selection_results = SelectionResult.objects.filter(matchup=self.matchup, fight=self.fight)
        self.assertEqual(selection_results.count(), 1)
        selection_result = selection_results.first()
        self.assertIsNotNone(selection_result, "SelectionResult should be created when a Selection is made")
        self.assertEqual(selection_result.matchup, self.matchup)
        self.assertEqual(selection_result.fight, self.fight)
        self.assertEqual(selection_result.winner, self.user2)
        self.assertEqual(selection_result.winnings, 0)


class LifetimeTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(username='testuser', email='testuser@gmail.com', password='testpass')
        self.user2 = get_user_model().objects.create_user(username='testuser2', email='testuser2@gmail.com', password='testpass2')
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        self.selection_url = reverse('api:matchups:selections')
        self.lifetime_url = reverse('api:matchups:lifetime')
        self.addDummyData()

    def addDummyData(self):
        event = Event.objects.get_or_create(
            name="UFC 1969",
            url="https://ufc.com/ufc-1969",
            date=ScraperView.parse_event_date(ScraperView, "Sat, Mar 15 / 11:00 PM UTC"),
            location="Abbey Road",
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
        matchup = Matchup.objects.update_or_create(
            event_id=self.event.id,
            user_a=self.user,
            user_b=self.user2,
        )
        self.matchup = matchup[0]

    def test_get_lifetime(self):
        # user makes selections
        response = self.client.post(self.selection_url, data={
            "matchup": self.matchup.id,
            "fight": self.fight.id,
            "user": self.user.id,
            "fighter": self.fight.blue_name
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        response = self.client.post(self.selection_url, data={
            "matchup": self.matchup.id,
            "fight": self.fight2.id,
            "user": self.user.id,
            "fighter": self.fight2.blue_name
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # user2 makes selections
        response = self.client.post(self.selection_url, data={
            "matchup": self.matchup.id,
            "fight": self.fight.id,
            "user": self.user2.id,
            "fighter": self.fight.red_name
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        response = self.client.post(self.selection_url, data={
            "matchup": self.matchup.id,
            "fight": self.fight2.id,
            "user": self.user2.id,
            "fighter": self.fight2.red_name
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # update fights with winner, triggers SelectionResult update
        fight = Fight.objects.filter(id=self.fight.id).first()
        fight.winner = "john"
        fight.method = "TKO"
        fight.round = 2
        fight.save()
        fight2 = Fight.objects.filter(id=self.fight2.id).first()
        fight2.winner = "george"
        fight2.method = "Submission"
        fight2.round = 1
        fight2.save()
        response = self.client.get(self.lifetime_url, {'user_id': self.user.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]['opponent'], {'id': self.user2.id, 'username': self.user2.username})
        self.assertEqual(response.data[0]['wins'], 1)
        self.assertEqual(response.data[0]['losses'], 1)
        self.assertEqual(response.data[0]['win_percentage'], 50)

    def test_get_lifetime_error_missing_user_id(self):
        response = self.client.get(self.lifetime_url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
