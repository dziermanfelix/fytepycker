from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup
from .models import Event, Fight, FightCard
from datetime import datetime
import pytz
from unidecode import unidecode
from bs4 import BeautifulSoup
from .models import Event
import pytz
from .tasks import scrape_until_complete
from django.utils import timezone


class Scraper:
    def scrape_fights_for_action(self, action):
        html_content = self.get_html_content('https://www.ufc.com/events', 200)
        soup = BeautifulSoup(html_content, "html.parser")
        all_fight_divs = soup.select(".c-card-event--result")
        fight_divs = list()
        if action == 'upcoming':
            fight_divs = all_fight_divs[:1]
        elif action == 'past':
            for fight_div in all_fight_divs:
                date_div = fight_div.find("div", "c-card-event--result__date")
                main_card_date = date_div.get("data-main-card")
                if self.parse_event_date(main_card_date) < timezone.now():
                    fight_divs.append(fight_div)
                    break
        elif action == 'live':
            now = datetime.now(pytz.utc).replace(hour=0, minute=0, second=0, microsecond=0)
            next_event = Event.objects.filter(date__gte=now).order_by('date').first()
            if self.is_today_in_eastern(next_event.date):
                scrape_until_complete(next_event.id)
        for fight in fight_divs:
            a_tag = fight.find("a")
            if a_tag and "href" in a_tag.attrs:
                fight_url = "https://www.ufc.com" + a_tag["href"]
                self.scrape_fights_from_url(fight_url)

    def scrape_fights_from_url(self, url):
        print(f"[scraper.scrape_fights_from_url] url={url}.")
        html_content = self.get_html_content(url, 3000)
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
        card_fights = card_listing.select(".c-listing-fight__content") if card_listing else []
        order = 0
        for fight in card_fights:
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
            blue_corner = fight_row.find("div", class_="c-listing-fight__corner-body--blue")
            blue_winner = blue_corner.find("div", class_="c-listing-fight__outcome--win")
            red_img_tag = fight_row.select_one(".c-listing-fight__corner--red .layout__region--content img")
            red_img = red_img_tag["src"] if red_img_tag else None
            red_url = fight_row.find("div", class_="c-listing-fight__corner-image--red").find("a")["href"]
            winner = red_name if red_winner is not None else blue_name if blue_winner is not None else None
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

    def is_today_in_eastern(self, event_dt_utc):
        eastern = pytz.timezone('US/Eastern')
        now_et = datetime.now(eastern).date()
        event_et_date = event_dt_utc.astimezone(eastern).date()
        return event_et_date == now_et

    def normalize_name(self, name):
        return unidecode(name)

    def parse_event_date(self, date_str):
        date_str = date_str.strip()
        dt = datetime.strptime(date_str, "%a, %b %d / %I:%M %p UTC")
        dt = dt.replace(year=datetime.now().year)
        utc_zone = pytz.utc
        dt = utc_zone.localize(dt)
        return dt
