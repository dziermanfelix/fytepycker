from django.utils import timezone
from rest_framework import generics
from rest_framework.permissions import IsAdminUser
from rest_framework.authentication import SessionAuthentication, BasicAuthentication
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from playwright.sync_api import sync_playwright
from rest_framework import status
from .serializers import EventSerializer
from bs4 import BeautifulSoup
from .models import Event, Fight, FightCard
from datetime import datetime
import pytz
from unidecode import unidecode
from django.shortcuts import get_object_or_404


class EventView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request, *args, **kwargs):
        event_id = kwargs.get("event_id")
        if not event_id:
            now = timezone.now()
            past_events = Event.objects.prefetch_related('fights').filter(date__lt=now).order_by('-date')
            upcoming_events = Event.objects.prefetch_related('fights').filter(date__gte=now).order_by('date')

            return Response({
                'past': EventSerializer(past_events, many=True).data,
                'upcoming': EventSerializer(upcoming_events, many=True).data
            })
        event = get_object_or_404(Event.objects.prefetch_related('fights'), id=event_id)
        return Response({'event': EventSerializer(event).data})


class ScraperView(APIView):
    permission_classes = [IsAdminUser]
    authentication_classes = [SessionAuthentication, BasicAuthentication]

    def get(self, request):
        html_content = self.get_html_content('https://www.ufc.com/events', 200)
        soup = BeautifulSoup(html_content, "html.parser")
        num_upcoming_events = int(soup.find("div", "althelete-total").text.split()[0])
        all_fight_divs = soup.select(".c-card-event--result")
        fight_divs = all_fight_divs[:2] + all_fight_divs[num_upcoming_events:num_upcoming_events + 2]
        for fight in fight_divs:
            a_tag = fight.find("a")
            if a_tag and "href" in a_tag.attrs:
                fight_url = "https://www.ufc.com" + a_tag["href"]
                self.scrape_fight_from_url(fight_url)
        events = Event.objects.all()
        serializer = EventSerializer(events, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def scrape_fight_from_url(self, url):
        html_content = self.get_html_content(url, 2000)
        soup = BeautifulSoup(html_content, "html.parser")
        name = soup.find(
            "div", class_="field field--name-node-title field--type-ds field--label-hidden field__item").find("h1").text.strip()
        headline_div = soup.find("div", class_="c-hero__headline")
        headline = headline_div.find("span", class_="e-divider__top").get_text(strip=True) + \
            " " + headline_div.find("span", class_="e-divider__bottom").get_text(strip=True)
        date = self.parse_event_date(soup.find("div", "c-hero__headline-suffix").text.strip())
        location = soup.find(
            "div", class_="field field--name-venue field--type-entity-reference field--label-hidden field__item").text.strip().replace("\n", "")
        event = Event.objects.get_or_create(
            name=name,
            headline=headline,
            url=url,
            date=date,
            location=location,
        )
        self.get_fights_for_card(soup.find("div", class_="main-card"), event[0], FightCard.MAIN)
        self.get_fights_for_card(soup.find("div", class_="fight-card-prelims"), event[0], FightCard.PRELIM)
        self.get_fights_for_card(soup.find("div", class_="fight-card-prelims-early"), event[0], FightCard.EARLY_PRELIM)

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
            red_name = self.normalize_name(fight_row.find(
                "div", class_="c-listing-fight__corner-name--red").find("a").text.strip().replace("\n", " "))
            blue_name = self.normalize_name(fight_row.find(
                "div", class_="c-listing-fight__corner-name--blue").find("a").text.strip().replace("\n", " "))
            blue_img_tag = fight_row.select_one(".c-listing-fight__corner--blue .layout__region--content img")
            blue_img = blue_img_tag["src"] if blue_img_tag else None
            blue_url = fight_row.find("div", class_="c-listing-fight__corner-image--blue").find("a")["href"]
            red_corner = fight_row.find("div", class_="c-listing-fight__corner-body--red")
            red_winner = red_corner.find("div", class_="c-listing-fight__outcome--win")
            red_img_tag = fight_row.select_one(".c-listing-fight__corner--red .layout__region--content img")
            red_img = red_img_tag["src"] if red_img_tag else None
            red_url = fight_row.find("div", class_="c-listing-fight__corner-image--red").find("a")["href"]
            winner = red_name if red_winner is not None else blue_name
            results = fight_row.find("div", class_="js-listing-fight__results")
            method_element = results.find("div", class_="c-listing-fight__result-text method")
            method = method_element.text.strip() if method_element else None
            round_element = results.find("div", class_="c-listing-fight__result-text round")
            round = int(round_element.text.strip()) if round_element and round_element.text.strip().isdigit() else None
            fight = Fight.objects.update_or_create(
                event_id=event.id,
                blue_name=blue_name,
                red_name=red_name,
                defaults={
                    "card": fight_card,
                    "order": order,
                    "weight_class": weight_class,
                    "blue_img": blue_img,
                    "blue_url": blue_url,
                    "red_img": red_img,
                    "red_url": red_url,
                    "winner": winner,
                    "method": method,
                    "round": round,
                }
            )
            order += 1

    def normalize_name(self, name):
        return unidecode(name)

    def parse_event_date(self, date_str):
        date_str = date_str.strip()
        dt = datetime.strptime(date_str, "%a, %b %d / %I:%M %p UTC")
        dt = dt.replace(year=datetime.now().year)
        utc_zone = pytz.utc
        dt = utc_zone.localize(dt)
        return dt
