from django.urls import reverse
from django.utils import timezone
from datetime import datetime, timedelta
import pytz
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from bs4 import BeautifulSoup
from backend.matchups.models import Matchup, Selection
from .models import Event, Fight, FightCard
from .serializers import EventSerializer, EventCardSerializer
from .scraper import Scraper


User = get_user_model()


class EventTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(username='testuser', password='testpass')
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        self.scraper = Scraper()
        self.events_url = reverse('api:ufc:events')
        self.addDummyData()

    def addDummyData(self):
        event = Event.objects.get_or_create(
            name="UFC 999",
            headline="Beatle Showdown",
            url="https://ufc.com/ufc999",
            date=timezone.now() - timedelta(days=14),
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

    def test_get_events_returns_upcoming_cards_only(self):
        future_event = Event.objects.create(
            name="UFC Future",
            headline="Next",
            url="https://ufc.com/future",
            date=timezone.now() + timedelta(days=14),
            location="vegas",
            complete=False,
        )
        Fight.objects.create(
            event=future_event,
            blue_name="a",
            red_name="b",
            card="main",
            order=0,
            weight_class="heavyweight",
        )

        response = self.client.get(self.events_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn('past', response.data)
        self.assertEqual(len(response.data['upcoming']), 1)
        self.assertEqual(response.data['upcoming'][0], EventCardSerializer(future_event).data)
        self.assertNotIn('fights', response.data['upcoming'][0])
        self.assertTrue(response.data['upcoming'][0]['has_fights'])
        self.assertIn('bets_locked', response.data['upcoming'][0])
        self.assertFalse(response.data['upcoming'][0]['bets_locked'])
        self.assertIn('start', response.data['upcoming'][0])

    def test_get_events_include_past(self):
        response = self.client.get(self.events_url, {'include_past': 1})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['past']), 1)
        self.assertEqual(response.data['past'][0], EventCardSerializer(self.event).data)
        self.assertNotIn('fights', response.data['past'][0])

    def test_get_event_by_id(self):
        response = self.client.get(f'{self.events_url}{self.event.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['event']['id'], self.event.id)
        self.assertIn('fights', response.data['event'])
        self.assertIn('blue_name', response.data['event']['fights']['main'][0])

    def test_event_complete(self):
        future_event = Event.objects.create(
            name="UFC Live",
            headline="Tonight",
            url="https://ufc.com/live",
            date=timezone.now() + timedelta(hours=2),
            location="vegas",
            complete=False,
        )
        fight = Fight.objects.create(
            event=future_event,
            blue_name="paul",
            red_name="john",
            card="main",
            order=0,
            weight_class="heavyweight",
        )

        response = self.client.get(self.events_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['upcoming']), 1)
        self.assertEqual(response.data['upcoming'][0]['id'], future_event.id)

        fight.winner = "paul"
        fight.method = "RNC"
        fight.round = 1
        fight.save()

        response = self.client.get(self.events_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['upcoming'], [])

        response = self.client.get(self.events_url, {'include_past': 1})
        past_ids = [e['id'] for e in response.data['past']]
        self.assertIn(future_event.id, past_ids)


class ScraperTests(APITestCase):
    def setUp(self):
        self.scraper = Scraper()

    def test_parse_event_date(self):
        date_str = "Sun, Dec 25 / 2:00 AM UTC"
        result = self.scraper.parse_event_date(date_str)
        self.assertEqual(str(result), "2026-12-25 02:00:00+00:00")

        date_str = "Sun, Jan 25 / 2:00 AM UTC"
        result = self.scraper.parse_event_date(date_str)
        self.assertEqual(str(result), "2027-01-25 02:00:00+00:00")

        date_str = "Sun, Feb 23 / 2:00 AM UTC"
        result = self.scraper.parse_event_date(date_str)
        self.assertEqual(str(result), "2027-02-23 02:00:00+00:00")

        date_str = "Sat, Mar 15 / 11:00 PM UTC"
        result = self.scraper.parse_event_date(date_str)
        self.assertEqual(str(result), "2026-03-15 23:00:00+00:00")

    def test_normalize_name(self):
        result = self.scraper.normalize_name("Jan Błachowicz")
        self.assertEqual(str(result), "Jan Blachowicz")

        result = self.scraper.normalize_name("Jan Blachowicz")
        self.assertEqual(str(result), "Jan Blachowicz")


def _listing_fight_html(blue, red, winner=None, method="", round_text=""):
    red_outcome = '<div class="c-listing-fight__outcome--win"></div>' if winner == red else ""
    blue_outcome = '<div class="c-listing-fight__outcome--win"></div>' if winner == blue else ""
    return f"""
    <div class="c-listing-fight__content">
      <div class="c-listing-fight__content-row">
        <div class="c-listing-fight__details">
          <div class="c-listing-fight__class-text">Lightweight Bout</div>
        </div>
        <div class="c-listing-fight__corner-name--red"><a>{red}</a></div>
        <div class="c-listing-fight__corner-name--blue"><a>{blue}</a></div>
        <div class="c-listing-fight__corner--blue"><div class="layout__region--content"></div></div>
        <div class="c-listing-fight__corner-image--blue"><a href="/blue"></a></div>
        <div class="c-listing-fight__corner-body--red">{red_outcome}</div>
        <div class="c-listing-fight__corner-body--blue">{blue_outcome}</div>
        <div class="c-listing-fight__corner--red"><div class="layout__region--content"></div></div>
        <div class="c-listing-fight__corner-image--red"><a href="/red"></a></div>
        <div class="js-listing-fight__results">
          <div class="c-listing-fight__result-text method">{method}</div>
          <div class="c-listing-fight__result-text round">{round_text}</div>
        </div>
      </div>
    </div>
    """


def _main_card_listing(fights):
    inner = "".join(_listing_fight_html(**fight) for fight in fights)
    soup = BeautifulSoup(f'<div class="main-card">{inner}</div>', "html.parser")
    return soup.find("div", class_="main-card")


class FightCardCleanupTests(APITestCase):
    def setUp(self):
        self.scraper = Scraper()
        self.user = get_user_model().objects.create_user(
            username="testuser", email="testuser@gmail.com", password="testpass"
        )
        self.user2 = get_user_model().objects.create_user(
            username="testuser2", email="testuser2@gmail.com", password="testpass2"
        )
        self.event = Event.objects.create(
            name="UFC 330",
            headline="Makhachev Machado Garry",
            url="https://ufc.com/ufc330",
            date=timezone.now() + timedelta(hours=2),
            location="vegas",
        )

    def _create_fight(self, blue, red, order=0, winner=None, round=None):
        return Fight.objects.create(
            event=self.event,
            blue_name=blue,
            red_name=red,
            card=FightCard.MAIN,
            order=order,
            weight_class="Lightweight Bout",
            winner=winner,
            round=round,
        )

    def _create_matchup(self):
        return Matchup.objects.create(
            event=self.event,
            user_a=self.user,
            user_b=self.user2,
            first_pick=self.user,
        )

    def _confirm_picks(self, fight):
        selection = Selection.objects.get(fight=fight)
        selection.user_a_selection = fight.blue_name
        selection.user_b_selection = fight.red_name
        selection.confirmed = True
        selection.save()
        return selection

    def test_empty_listing_does_not_delete_fights(self):
        kept = self._create_fight("Eduardo Chapolin", "Charles Johnson")
        other = self._create_fight("Esteban Ribovics", "Edson Barboza", order=1)

        changes = self.scraper.get_fights_for_card(None, self.event, FightCard.MAIN)
        self.assertEqual(changes, [])
        self.assertTrue(Fight.objects.filter(id=kept.id).exists())
        self.assertTrue(Fight.objects.filter(id=other.id).exists())

        empty_listing = _main_card_listing([])
        changes = self.scraper.get_fights_for_card(empty_listing, self.event, FightCard.MAIN)
        self.assertEqual(changes, [])
        self.assertTrue(Fight.objects.filter(id=kept.id).exists())
        self.assertTrue(Fight.objects.filter(id=other.id).exists())

    def test_fight_with_winner_is_never_deleted(self):
        completed = self._create_fight(
            "Dustin Stoltzfus", "Mansur Abdul-Malik", winner="Dustin Stoltzfus", round=2
        )
        other = self._create_fight("Esteban Ribovics", "Edson Barboza", order=1)
        self._create_matchup()
        self._confirm_picks(completed)

        listing = _main_card_listing([
            {"blue": other.blue_name, "red": other.red_name},
        ])
        changes = self.scraper.get_fights_for_card(listing, self.event, FightCard.MAIN)

        self.assertTrue(Fight.objects.filter(id=completed.id).exists())
        self.assertTrue(Selection.objects.filter(fight=completed).exists())
        kept = [c for c in changes if c["type"] == "fight_missing_kept"]
        self.assertEqual(len(kept), 1)
        self.assertEqual(kept[0]["reason"], "winner")
        self.assertEqual(kept[0]["fight"]["id"], completed.id)

    def test_in_progress_fight_with_selections_survives_missing_scrape(self):
        live = self._create_fight("Eduardo Chapolin", "Charles Johnson", round=1)
        other = self._create_fight("Esteban Ribovics", "Edson Barboza", order=1)
        self._create_matchup()
        selection = self._confirm_picks(live)

        listing = _main_card_listing([
            {"blue": other.blue_name, "red": other.red_name},
        ])
        changes = self.scraper.get_fights_for_card(listing, self.event, FightCard.MAIN)

        live.refresh_from_db()
        selection.refresh_from_db()
        self.assertEqual(live.round, 1)
        self.assertEqual(selection.user_a_selection, "Eduardo Chapolin")
        self.assertEqual(selection.confirmed, True)
        kept = [c for c in changes if c["type"] == "fight_missing_kept"]
        self.assertEqual(len(kept), 1)
        self.assertEqual(kept[0]["reason"], "in_progress")

        relist = _main_card_listing([
            {"blue": other.blue_name, "red": other.red_name},
            {"blue": live.blue_name, "red": live.red_name, "winner": live.red_name, "method": "Submission", "round_text": "3"},
        ])
        changes = self.scraper.get_fights_for_card(relist, self.event, FightCard.MAIN)
        live.refresh_from_db()
        self.assertEqual(live.id, kept[0]["fight"]["id"])
        self.assertTrue(Selection.objects.filter(id=selection.id, fight_id=live.id).exists())
        self.assertEqual(live.winner, "Charles Johnson")
        updated = [c for c in changes if c["type"] == "fight_updated"]
        self.assertTrue(any(c["fight"]["id"] == live.id for c in updated))

    def test_unstarted_fight_with_selections_is_deleted(self):
        cancelled = self._create_fight("Vitor Petrino", "Serghei Spivac")
        other = self._create_fight("Esteban Ribovics", "Edson Barboza", order=1)
        self._create_matchup()
        self._confirm_picks(cancelled)

        listing = _main_card_listing([
            {"blue": other.blue_name, "red": other.red_name},
        ])
        changes = self.scraper.get_fights_for_card(listing, self.event, FightCard.MAIN)

        self.assertFalse(Fight.objects.filter(id=cancelled.id).exists())
        self.assertFalse(Selection.objects.filter(fight_id=cancelled.id).exists())
        removed = [c for c in changes if c["type"] == "fight_removed"]
        self.assertEqual(len(removed), 1)
        self.assertEqual(removed[0]["fight"]["blue_name"], "Vitor Petrino")

    def test_unstarted_fight_without_selections_is_deleted(self):
        churn = self._create_fight("Gauge Young", "Kody Steele")
        other = self._create_fight("Esteban Ribovics", "Edson Barboza", order=1)

        listing = _main_card_listing([
            {"blue": other.blue_name, "red": other.red_name},
        ])
        changes = self.scraper.get_fights_for_card(listing, self.event, FightCard.MAIN)

        self.assertFalse(Fight.objects.filter(id=churn.id).exists())
        removed = [c for c in changes if c["type"] == "fight_removed"]
        self.assertEqual(len(removed), 1)
        self.assertEqual(removed[0]["fight"]["blue_name"], "Gauge Young")


def _broadcaster_soup(*timestamps):
    nodes = "".join(
        f'<div class="c-event-fight-card-broadcaster__time" data-timestamp="{ts}"></div>'
        for ts in timestamps
    )
    return BeautifulSoup(f"<div>{nodes}</div>", "html.parser")


class EventStartDatetimeTests(APITestCase):
    def setUp(self):
        self.scraper = Scraper()
        self.event = Event.objects.create(
            name="UFC Start",
            headline="Start Times",
            url="https://ufc.com/start",
            date=timezone.now() + timedelta(days=7),
            location="vegas",
        )

    def test_earliest_of_early_prelim_and_main(self):
        early, prelim, main = 1787980000, 1787990000, 1787997600
        result = self.scraper.earliest_card_start(_broadcaster_soup(main, prelim, early))
        self.assertEqual(result, datetime.fromtimestamp(early, tz=pytz.utc))

    def test_earliest_of_prelim_and_main(self):
        prelim, main = 1787990000, 1787997600
        result = self.scraper.earliest_card_start(_broadcaster_soup(main, prelim))
        self.assertEqual(result, datetime.fromtimestamp(prelim, tz=pytz.utc))

    def test_main_only(self):
        main = 1787997600
        result = self.scraper.earliest_card_start(_broadcaster_soup(main))
        self.assertEqual(result, datetime.fromtimestamp(main, tz=pytz.utc))

    def test_no_nodes_returns_none(self):
        soup = BeautifulSoup("<div></div>", "html.parser")
        self.assertIsNone(self.scraper.earliest_card_start(soup))

    def test_skips_invalid_timestamps(self):
        soup = BeautifulSoup(
            """
            <div>
              <div class="c-event-fight-card-broadcaster__time" data-timestamp="not-a-number"></div>
              <div class="c-event-fight-card-broadcaster__time" data-timestamp="1787997600"></div>
            </div>
            """,
            "html.parser",
        )
        result = self.scraper.earliest_card_start(soup)
        self.assertEqual(result, datetime.fromtimestamp(1787997600, tz=pytz.utc))

    def test_update_sets_earliest_on_event(self):
        early, main = 1787980000, 1787997600
        self.scraper.update_start(self.event, _broadcaster_soup(main, early))
        self.event.refresh_from_db()
        self.assertEqual(self.event.start, datetime.fromtimestamp(early, tz=pytz.utc))

    def test_update_does_not_clear_existing_when_no_timestamps(self):
        existing = datetime.fromtimestamp(1787980000, tz=pytz.utc)
        self.event.start = existing
        self.event.save(update_fields=["start"])
        self.scraper.update_start(self.event, BeautifulSoup("<div></div>", "html.parser"))
        self.event.refresh_from_db()
        self.assertEqual(self.event.start, existing)

    def test_event_card_serializer_includes_bets_locked(self):
        self.event.start = timezone.now() + timedelta(days=1)
        self.event.save(update_fields=["start"])
        data = EventCardSerializer(self.event).data
        self.assertIn("start", data)
        self.assertFalse(data["bets_locked"])

        self.event.start = timezone.now() - timedelta(minutes=1)
        self.event.save(update_fields=["start"])
        data = EventCardSerializer(self.event).data
        self.assertTrue(data["bets_locked"])
