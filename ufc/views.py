from rest_framework import generics
from rest_framework.permissions import IsAdminUser
from rest_framework.authentication import SessionAuthentication, BasicAuthentication
from rest_framework.views import APIView
from rest_framework.response import Response
from playwright.sync_api import sync_playwright
from rest_framework import status
from .serializers import EventSerializer, FightSerializer
from bs4 import BeautifulSoup
from .models import Event, Fight, FightCard
from datetime import datetime
import pytz


class EventList(generics.ListCreateAPIView):
    queryset = Event.objects.all()
    serializer_class = EventSerializer


class FightList(generics.ListCreateAPIView):
    queryset = Fight.objects.all()
    serializer_class = FightSerializer


class ScraperView(APIView):
    permission_classes = [IsAdminUser]
    authentication_classes = [SessionAuthentication, BasicAuthentication]

    def get(self, request):
        html_content = self.get_html_content("https://www.ufc.com/events", 200)
        soup = BeautifulSoup(html_content, "html.parser")
        num_events = int(soup.find("div", "althelete-total").text.split()[0])
        num_events = 3
        fight_divs = soup.select(".c-card-event--result")[:num_events - 1]
        for fight in fight_divs:
            a_tag = fight.find("a")
            if a_tag and "href" in a_tag.attrs:
                fight_url = "https://www.ufc.com" + a_tag["href"]
                html_content = self.get_html_content(fight_url, 2000)
                soup = BeautifulSoup(html_content, "html.parser")
                name = soup.find(
                    "div", class_="field field--name-node-title field--type-ds field--label-hidden field__item").find("h1").text.strip()
                date = self.parse_event_date(soup.find("div", "c-hero__headline-suffix").text.strip())
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

    def get_html_content(self, url, timeout):
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            page.goto(url)
            page.wait_for_timeout(timeout)
            html_content = page.content()
            browser.close()
        return html_content

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

    def parse_event_date(self, date_str):
        date_str = date_str.strip()
        dt = datetime.strptime(date_str, "%a, %b %d / %I:%M %p UTC")
        dt = dt.replace(year=datetime.now().year)
        utc_zone = pytz.utc
        dt = utc_zone.localize(dt)
        return dt
