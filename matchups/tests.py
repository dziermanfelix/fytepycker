from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from itertools import cycle
from ufc.models import Event, Fight
from .models import Matchup, Selection
from matchups.models import MatchupResult
from ufc.scraper import Scraper


User = get_user_model()


class MatchupTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(username='testuser', email='testuser@gmail.com', password='testpass')
        self.user2 = get_user_model().objects.create_user(username='testuser2', email='testuser2@gmail.com', password='testpass2')
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        self.scraper = Scraper()

        self.matchups_url = reverse('api:matchups:matchups')
        self.addDummyData()

    def addDummyData(self):
        event = Event.objects.get_or_create(
            name="UFC 999",
            headline="beatlemania",
            url="https://ufc.com/ufc999",
            date=self.scraper.parse_event_date("Sat, Mar 15 / 11:00 PM UTC"),
            location="the sun",
        )
        self.event = event[0]
        fight = Fight.objects.update_or_create(
            event_id=self.event.id,
            blue_name="paul",
            red_name="john",
            defaults={
                "card": "Main Card",
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
                "card": "Main Card",
                "order": 1,
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

    def test_create_matchup_side_effects(self):
        data = {
            "event_id": self.event.id,
            "user_a_id": self.user.id,
            "user_b_id": self.user2.id,
        }
        response = self.client.post(self.matchups_url, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        matchup = Matchup.objects.filter(event=self.event, user_a=self.user, user_b=self.user2).first()

        # matchup result
        matchup_result = MatchupResult.objects.filter(matchup=matchup.id).first()
        self.assertEqual(matchup_result.matchup, matchup)
        self.assertEqual(matchup_result.winner, None)
        self.assertEqual(matchup_result.winnings, 0)

        # selections
        selections = Selection.objects.filter(matchup=matchup.id)
        for s in selections:
            self.assertEqual(s.matchup, matchup)
            self.assertEqual(s.user_a_selection, None)
            self.assertEqual(s.user_b_selection, None)
            self.assertEqual(s.winner, None)
            self.assertEqual(s.confirmed, False)
        user_cycle = cycle([matchup.first_pick, matchup.user_b if matchup.first_pick ==
                           matchup.user_a else matchup.user_a])
        self.assertEqual(selections[0].fight, self.fight)
        self.assertEqual(selections[0].dibs, next(user_cycle))
        self.assertEqual(selections[0].bet, 50)
        self.assertEqual(selections[1].fight, self.fight2)
        self.assertEqual(selections[1].dibs, next(user_cycle))
        self.assertEqual(selections[1].bet, 30)

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
        self.scraper = Scraper()

        self.selection_url = reverse('api:matchups:selections')
        self.addDummyData()

    def addDummyData(self):
        event = Event.objects.get_or_create(
            name="UFC 999",
            headline="beatlemania",
            url="https://ufc.com/ufc999",
            date=self.scraper.parse_event_date("Sat, Mar 15 / 11:00 PM UTC"),
            location="the sun",
        )
        self.event = event[0]
        fight = Fight.objects.update_or_create(
            event_id=self.event.id,
            blue_name="paul",
            red_name="john",
            defaults={
                "card": "Main Card",
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
                "card": "Main Card",
                "order": 1,
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

    def test_selections_created_from_matchup(self):
        selections = Selection.objects.filter(matchup=self.matchup.id)
        for s in selections:
            self.assertEqual(s.matchup, self.matchup)
            self.assertEqual(s.user_a_selection, None)
            self.assertEqual(s.user_b_selection, None)
            self.assertEqual(s.winner, None)
            self.assertEqual(s.confirmed, False)
        user_cycle = cycle([self.matchup.first_pick, self.matchup.user_b if self.matchup.first_pick ==
                           self.matchup.user_a else self.matchup.user_a])
        self.assertEqual(selections[0].fight, self.fight)
        self.assertEqual(selections[0].dibs, next(user_cycle))
        self.assertEqual(selections[0].bet, 50)
        self.assertEqual(selections[1].fight, self.fight2)
        self.assertEqual(selections[1].dibs, next(user_cycle))
        self.assertEqual(selections[1].bet, 30)

    def test_create_selection(self):
        data = {
            "matchup": self.matchup.id,
            "fight": self.fight.id,
            "user": self.user.id,
            "fighter": self.fight.blue_name
        }
        response = self.client.post(self.selection_url, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['selection']['matchup'], self.matchup.id)
        self.assertEqual(response.data['selection']['fight'], self.fight.id)
        self.assertEqual(response.data['selection']['user_a_selection'], self.fight.blue_name)
        self.assertEqual(response.data['selection']['user_b_selection'], None)
        self.assertEqual(response.data['selection']['bet'], 50)
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
            headline="beatlemania",
            url="https://ufc.com/ufc1000",
            date=self.scraper.parse_event_date("Sat, Mar 15 / 11:00 PM UTC"),
            location="the moon",
        )
        other_event = other_event[0]
        other_fight = Fight.objects.update_or_create(
            event_id=other_event.id,
            blue_name="ringo",
            red_name="george",
            defaults={
                "card": "Main Card",
                "order": 3,
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
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response = self.client.get(self.selection_url, {"matchup_id": self.matchup.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]['matchup'], self.matchup.id)
        self.assertEqual(response.data[0]['fight'], self.fight.id)
        self.assertEqual(response.data[0]['user_a_selection'], self.fight.red_name)
        self.assertEqual(response.data[0]['user_b_selection'], None)
        self.assertEqual(response.data[0]['bet'], 50)
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
        self.assertEqual(response.status_code, status.HTTP_200_OK)
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
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response = self.client.get(self.selection_url, data={"matchup_id": self.matchup.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]['matchup'], self.matchup.id)
        self.assertEqual(response.data[0]['fight'], self.fight.id)
        self.assertEqual(response.data[0]['user_a_selection'], self.fight.blue_name)
        self.assertEqual(response.data[0]['user_b_selection'], None)
        self.assertEqual(response.data[0]['bet'], 50)
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
        self.assertEqual(response.data[0]['bet'], 50)
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
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response = self.client.get(self.selection_url, data={"matchup_id": self.matchup.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]['matchup'], self.matchup.id)
        self.assertEqual(response.data[0]['fight'], self.fight.id)
        self.assertEqual(response.data[0]['user_a_selection'], self.fight.blue_name)
        self.assertEqual(response.data[0]['user_b_selection'], None)
        self.assertEqual(response.data[0]['bet'], 50)
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
        self.assertEqual(response.data[0]['bet'], 50)
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
        self.assertEqual(response.status_code, status.HTTP_200_OK)
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
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response = self.client.post(self.selection_url, data={
            "matchup": self.matchup.id,
            "fight": self.fight.id,
            "user": self.user2.id,
            "fighter": self.fight.blue_name
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_selection_confirmed(self):
        selection = Selection.objects.filter(matchup=self.matchup.id, fight=self.fight.id).first()
        self.assertEqual(selection.confirmed, False)
        data = {
            "matchup": self.matchup.id,
            "fight": self.fight.id,
            "user": self.user.id,
            "fighter": self.fight.blue_name
        }
        response = self.client.post(self.selection_url, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        selection = Selection.objects.filter(matchup=self.matchup.id, fight=self.fight.id).first()
        self.assertEqual(selection.confirmed, False)
        data = {
            "matchup": self.matchup.id,
            "fight": self.fight.id,
            "user": self.user2.id,
            "fighter": self.fight.red_name
        }
        response = self.client.post(self.selection_url, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        selection = Selection.objects.filter(matchup=self.matchup.id, fight=self.fight.id).first()
        self.assertEqual(selection.confirmed, True)

    def test_selection_winner_updates_after_fight_win(self):
        selection = Selection.objects.filter(matchup=self.matchup.id, fight=self.fight.id).first()
        self.assertEqual(selection.winner, None)
        data = {
            "matchup": self.matchup.id,
            "fight": self.fight.id,
            "user": self.user.id,
            "fighter": self.fight.blue_name
        }
        response = self.client.post(self.selection_url, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = {
            "matchup": self.matchup.id,
            "fight": self.fight.id,
            "user": self.user2.id,
            "fighter": self.fight.red_name
        }
        response = self.client.post(self.selection_url, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        updated_fight = Fight.objects.update_or_create(
            event_id=self.event.id,
            blue_name="paul",
            red_name="john",
            defaults={
                "card": "Main Card",
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
        selection = Selection.objects.filter(matchup=self.matchup.id, fight=self.fight.id).first()
        self.assertEqual(selection.winner, self.user2)

    def test_selection_updates_from_fight_change(self):
        # simulate what the scraper does, it will add the new fight before deleting the old
        newFight1 = Fight.objects.update_or_create(
            event_id=self.event.id,
            blue_name="paul",
            red_name="ozzy",
            defaults={
                "card": "Main Card",
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
        newFight1 = newFight1[0]

        # delete existing fight1
        fight1 = Fight.objects.filter(id=self.fight.id).first()
        fight1.delete()

        # verify selection gets added for new fight
        selections = Selection.objects.filter(matchup=self.matchup)
        first_selection_dibs = selections[0].dibs

        # original fight2
        self.assertEqual(selections[0].matchup, self.matchup)
        self.assertEqual(selections[0].fight, self.fight2)
        self.assertEqual(selections[0].user_a_selection, None)
        self.assertEqual(selections[0].user_b_selection, None)
        self.assertEqual(selections[0].bet, 30)
        self.assertEqual(selections[0].winner, None)
        self.assertEqual(selections[0].dibs, first_selection_dibs)
        self.assertEqual(selections[0].confirmed, False)

        # new fight1
        self.assertEqual(selections[1].matchup, self.matchup)
        self.assertEqual(selections[1].fight, newFight1)
        self.assertEqual(selections[1].user_a_selection, None)
        self.assertEqual(selections[1].user_b_selection, None)
        self.assertEqual(selections[1].bet, 50)
        self.assertEqual(selections[1].winner, None)
        self.assertEqual(selections[1].dibs, self.user if first_selection_dibs == self.user2 else self.user2)
        self.assertEqual(selections[1].confirmed, False)


class MatchupResultTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(username='testuser', email='testuser@gmail.com', password='testpass')
        self.user2 = get_user_model().objects.create_user(username='testuser2', email='testuser2@gmail.com', password='testpass2')
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        self.scraper = Scraper()

        self.selection_url = reverse('api:matchups:selections')
        self.addDummyData()

    def addDummyData(self):
        event = Event.objects.get_or_create(
            name="UFC 999",
            headline="beatlemania",
            url="https://ufc.com/ufc999",
            date=self.scraper.parse_event_date("Sat, Mar 15 / 11:00 PM UTC"),
            location="the sun",
        )
        self.event = event[0]
        fight = Fight.objects.update_or_create(
            event_id=self.event.id,
            blue_name="paul",
            red_name="john",
            defaults={
                "card": "Main Card",
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
                "card": "Main Card",
                "order": 1,
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

    def test_matchup_result_created_from_matchup(self):
        matchup_result = MatchupResult.objects.filter(matchup=self.matchup.id).first()
        self.assertEqual(matchup_result.matchup, self.matchup)
        self.assertEqual(matchup_result.winner, None)
        self.assertEqual(matchup_result.winnings, 0)

    def test_matchup_result_updates_with_selection_winner(self):
        matchup_result = MatchupResult.objects.filter(matchup=self.matchup.id).first()
        self.assertEqual(matchup_result.matchup, self.matchup)
        self.assertEqual(matchup_result.winner, None)
        self.assertEqual(matchup_result.winnings, 0)

        data = {
            "matchup": self.matchup.id,
            "fight": self.fight.id,
            "user": self.user.id,
            "fighter": self.fight.blue_name
        }
        response = self.client.post(self.selection_url, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        selection = Selection.objects.filter(matchup=self.matchup.id, fight=self.fight.id).first()
        self.assertEqual(selection.confirmed, False)
        data = {
            "matchup": self.matchup.id,
            "fight": self.fight.id,
            "user": self.user2.id,
            "fighter": self.fight.red_name
        }
        response = self.client.post(self.selection_url, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        updated_fight = Fight.objects.update_or_create(
            event_id=self.event.id,
            blue_name="paul",
            red_name="john",
            defaults={
                "card": "Main Card",
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

        selection = Selection.objects.filter(matchup=self.matchup.id, fight=self.fight.id).first()
        self.assertEqual(selection.winner, self.user2)

        matchup_result = MatchupResult.objects.filter(matchup=self.matchup.id).first()
        self.assertEqual(matchup_result.winner, self.user2)
        self.assertEqual(matchup_result.winnings, 0)

    def test_matchup_result_tie(self):
        matchup_result = MatchupResult.objects.filter(matchup=self.matchup.id).first()
        self.assertEqual(matchup_result.matchup, self.matchup)
        self.assertEqual(matchup_result.winner, None)
        self.assertEqual(matchup_result.winnings, 0)

        data = {
            "matchup": self.matchup.id,
            "fight": self.fight.id,
            "user": self.user.id,
            "fighter": self.fight.blue_name
        }
        response = self.client.post(self.selection_url, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        selection = Selection.objects.filter(matchup=self.matchup.id, fight=self.fight.id).first()
        self.assertEqual(selection.confirmed, False)
        data = {
            "matchup": self.matchup.id,
            "fight": self.fight.id,
            "user": self.user2.id,
            "fighter": self.fight.red_name
        }
        response = self.client.post(self.selection_url, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = {
            "matchup": self.matchup.id,
            "fight": self.fight2.id,
            "user": self.user.id,
            "fighter": self.fight2.blue_name
        }
        response = self.client.post(self.selection_url, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = {
            "matchup": self.matchup.id,
            "fight": self.fight2.id,
            "user": self.user2.id,
            "fighter": self.fight2.red_name
        }
        response = self.client.post(self.selection_url, data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        updated_fight = Fight.objects.update_or_create(
            event_id=self.event.id,
            blue_name="paul",
            red_name="john",
            defaults={
                "card": "Main Card",
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

        updated_fight2 = Fight.objects.update_or_create(
            event_id=self.event.id,
            blue_name="george",
            red_name="ringo",
            defaults={
                "card": "Main Card",
                "order": 1,
                "weight_class": "lightweight",
                "blue_img": "https://url.img",
                "blue_url": "https://url.img",
                "red_img": "https://url.img",
                "red_url": "https://url.img",
                "winner": "george",
                "method": "body slam",
                "round": 1,
            }
        )
        self.fight2 = updated_fight2[0]

        matchup_result = MatchupResult.objects.filter(matchup=self.matchup.id).first()
        self.assertEqual(matchup_result.winner, None)
        self.assertEqual(matchup_result.winnings, 0)


class LifetimeTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(username='testuser', email='testuser@gmail.com', password='testpass')
        self.user2 = get_user_model().objects.create_user(username='testuser2', email='testuser2@gmail.com', password='testpass2')
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        self.selection_url = reverse('api:matchups:selections')
        self.lifetime_url = reverse('api:matchups:lifetime')
        self.scraper = Scraper()
        self.addDummyData()

    def addDummyData(self):
        event = Event.objects.get_or_create(
            name="UFC 1969",
            headline="beatlemania",
            url="https://ufc.com/ufc-1969",
            date=self.scraper.parse_event_date("Sat, Mar 15 / 11:00 PM UTC"),
            location="Abbey Road",
        )
        self.event = event[0]
        fight = Fight.objects.update_or_create(
            event_id=self.event.id,
            blue_name="paul",
            red_name="john",
            defaults={
                "card": "Main Card",
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
                "card": "Main Card",
                "order": 1,
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
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response = self.client.post(self.selection_url, data={
            "matchup": self.matchup.id,
            "fight": self.fight2.id,
            "user": self.user.id,
            "fighter": self.fight2.blue_name
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # user2 makes selections
        response = self.client.post(self.selection_url, data={
            "matchup": self.matchup.id,
            "fight": self.fight.id,
            "user": self.user2.id,
            "fighter": self.fight.red_name
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response = self.client.post(self.selection_url, data={
            "matchup": self.matchup.id,
            "fight": self.fight2.id,
            "user": self.user2.id,
            "fighter": self.fight2.red_name
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        fight = Fight.objects.filter(id=self.fight.id).first()
        fight.winner = "paul"
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
        self.assertEqual(response.data[0]['losses'], 0)
        self.assertEqual(response.data[0]['win_percentage'], 100)

    def test_get_lifetime_error_missing_user_id(self):
        response = self.client.get(self.lifetime_url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
