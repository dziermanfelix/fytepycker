import requests
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import EventSerializer
from decouple import config
import requests
from bs4 import BeautifulSoup
from django.utils import timezone
from .models import Event, FightCard


class EventList(APIView):
    def get(self, request):
        url = "https://www.ufc.com/events"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        response = requests.get(url, headers=headers)
        if response.status_code != 200:
            print(f"Failed to fetch page: {response.status_code}")
        soup = BeautifulSoup(response.content, "html.parser")
        num_events = int(soup.find("div", "althelete-total").text.split()[0])
        # fights = soup.select(".c-card-event--result")[:num_events - 1]
        fights = soup.select(".c-card-event--result")[:1]
        for fight in fights:
            a_tag = fight.find("a")
            if a_tag and "href" in a_tag.attrs:
                fight_url = "https://www.ufc.com" + a_tag["href"]
                response = requests.get(fight_url, headers=headers)
                soup = BeautifulSoup(response.content, "html.parser")
                if response.status_code != 200:
                    print(f"Failed to fetch fight page: {response.status_code}")
                name = soup.find(
                    "div", "field field--name-node-title field--type-ds field--label-hidden field__item").find("h1").text.strip()
                date_str = soup.find("div", "c-hero__headline-suffix").text.strip()
                location = soup.find(
                    "div", "field field--name-venue field--type-entity-reference field--label-hidden field__item").text.strip().replace("\n", "")
                # save event
                self.get_fights_for_card(soup.find("div", "main-card"), 'event', FightCard.MAIN)
                self.get_fights_for_card(soup.find("div", "fight-card-prelims"), 'event', FightCard.PRELIM)
                self.get_fights_for_card(soup.find("div", "fight-card-prelims-early"), 'event', FightCard.EARLY_PRELIM)
        return Response()

    def get_fights_for_card(self, card_listing, event, fight_card):
        main_card_fights = card_listing.select(".c-listing-fight__content") if card_listing else []
        order = 0
        for fight in main_card_fights:
            fight_row = fight.find("div", "c-listing-fight__content-row")
            details = fight_row.find("div", "c-listing-fight__details")
            weight_class = details.find("div", "c-listing-fight__class-text").text.strip()
            red_name = fight_row.find(
                "div", "c-listing-fight__corner-name--red").find("a").text.strip().replace("\n", " ")
            blue_name = fight_row.find(
                "div", "c-listing-fight__corner-name--blue").find("a").text.strip().replace("\n", " ")
            blue_img = fight_row.find("div", "c-listing-fight__corner-image--blue").find("a")["href"]
            red_corner = fight_row.find("div", "c-listing-fight__corner-body--red")
            red_winner = red_corner.find("div", "c-listing-fight__outcome--win")
            red_img = fight_row.find("div", "c-listing-fight__corner-image--red").find("a")["href"]
            winner = red_name if red_winner is not None else blue_name
            results = fight_row.find("div", "js-listing-fight__results")
            method = results.find("div", "c-listing-fight__result-text method").text.strip()
            round = results.find("div", "c-listing-fight__result-text round").text.strip()
            # save fight
            print(
                f'fight={event},{fight_card},{order},{weight_class},{blue_name},{blue_img},{red_name},{red_img};{winner},{method},{round}')
            order += 1


class UfcFightCardList(APIView):
    def post(self, request):
        pass
