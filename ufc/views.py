import requests
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import EventSerializer
import requests
from bs4 import BeautifulSoup
from .models import Event, Fight, FightCard
from datetime import datetime
import pytz


def parse_event_date(date_str):
    date_format = "%a, %b %d / %I:%M %p"
    date_str = date_str.rsplit(" ", 1)[0]
    dt = datetime.strptime(date_str, date_format)
    est = pytz.timezone("US/Eastern")
    dt = est.localize(dt)
    dt_utc = dt.astimezone(pytz.utc)
    return dt_utc


class ScraperView(APIView):
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
        fight_divs = soup.select(".c-card-event--result")[:3]
        for fight in fight_divs:
            a_tag = fight.find("a")
            if a_tag and "href" in a_tag.attrs:
                fight_url = "https://www.ufc.com" + a_tag["href"]
                response = requests.get(fight_url, headers=headers)
                soup = BeautifulSoup(response.content, "html.parser")
                if response.status_code != 200:
                    print(f"Failed to fetch fight page: {response.status_code}")
                name = soup.find(
                    "div", class_="field field--name-node-title field--type-ds field--label-hidden field__item").find("h1").text.strip()
                date = parse_event_date(soup.find("div", "c-hero__headline-suffix").text.strip())
                location = soup.find(
                    "div", class_="field field--name-venue field--type-entity-reference field--label-hidden field__item").text.strip().replace("\n", "")
                event = Event.objects.get_or_create(
                    name=name,
                    url=fight_url,
                    date=date,
                    location=location,
                )
                self.get_fights_for_card(soup.find("div", class_="main-card"), event[0], FightCard.MAIN)
                self.get_fights_for_card(soup.find("div", class_="fight-card-prelims"), event[0], FightCard.PRELIM)
                self.get_fights_for_card(soup.find("div", class_="fight-card-prelims-early"),
                                         event[0], FightCard.EARLY_PRELIM)
        events = Event.objects.all()
        serializer = EventSerializer(events, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def get_fights_for_card(self, card_listing, event, fight_card):
        main_card_fights = card_listing.select(".c-listing-fight__content") if card_listing else []
        order = 0
        for fight in main_card_fights:
            fight_row = fight.find("div", class_="c-listing-fight__content-row")
            details = fight_row.find("div", class_="c-listing-fight__details")
            weight_class = details.find("div", class_="c-listing-fight__class-text").text.strip()
            red_name = fight_row.find(
                "div", class_="c-listing-fight__corner-name--red").find("a").text.strip().replace("\n", " ")
            blue_name = fight_row.find(
                "div", class_="c-listing-fight__corner-name--blue").find("a").text.strip().replace("\n", " ")
            blue_img = fight_row.find("div", class_="c-listing-fight__corner-image--blue").find("a")["href"]
            red_corner = fight_row.find("div", class_="c-listing-fight__corner-body--red")
            red_winner = red_corner.find("div", class_="c-listing-fight__outcome--win")
            red_img = fight_row.find("div", class_="c-listing-fight__corner-image--red").find("a")["href"]
            winner = red_name if red_winner is not None else blue_name
            results = fight_row.find("div", class_="js-listing-fight__results")
            method_element = results.find("div", class_="c-listing-fight__result-text method")
            method = method_element.text.strip() if method_element else None
            round_element = results.find("div", class_="c-listing-fight__result-text round")
            round = int(round_element.text.strip()) if round_element and round_element.text.strip().isdigit() else None
            fight = Fight.objects.update_or_create(
                event_id=event.id,
                card=fight_card,
                order=order,
                weight_class=weight_class,
                blue_name=blue_name,
                blue_img=blue_img,
                red_name=red_name,
                red_img=red_img,
                winner=winner,
                method=method,
                round=round
            )
            order += 1


class EventList(APIView):
    def get(self, request):
        pass

    def post(self, request):
        pass
