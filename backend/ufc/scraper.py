from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup
from .models import Event, Fight, FightCard
from datetime import datetime
import pytz
from unidecode import unidecode
from django.utils import timezone


def _fight_change_info(fight):
    return {
        "id": fight.id,
        "blue_name": fight.blue_name,
        "red_name": fight.red_name,
        "weight_class": fight.weight_class,
        "card": fight.card,
        "winner": fight.winner,
        "method": fight.method,
        "round": fight.round,
    }


class Scraper:
    GOTO_TIMEOUT_MS = 60_000

    def scrape_fights_for_action(self, action):
        all_changes = []
        if action == 'live':
            now = datetime.now(pytz.utc).replace(hour=0, minute=0, second=0, microsecond=0)
            next_event = Event.objects.filter(date__gte=now).order_by('date').first()
            if next_event and self.is_today_in_eastern(next_event.date):
                print(f"[live action] Scheduling scrape_until_complete for event {next_event.id}")
                from .scheduler import schedule_event_scraping
                schedule_event_scraping(next_event.id)
            # rescrape incomplete past events
            scraped_events = []
            incomplete_past_fights = Event.objects.filter(complete=False, date__lt=timezone.now())
            for event in incomplete_past_fights:
                result = self.scrape_fights_from_url(event.url)
                if result:
                    ev, changes = result
                    if ev not in scraped_events:
                        scraped_events.append(ev)
                    all_changes.extend(changes)
            return scraped_events, all_changes

        html_content = self.get_html_content('https://www.ufc.com/events', wait_after_ms=200)
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

        # scrape fights from web page
        scraped_urls = list()
        scraped_events = list()
        for fight in fight_divs:
            a_tag = fight.find("a")
            if a_tag and "href" in a_tag.attrs:
                fight_url = "https://www.ufc.com" + a_tag["href"]
                result = self.scrape_fights_from_url(fight_url)
                scraped_urls.append(fight_url)
                if result:
                    ev, changes = result
                    scraped_events.append(ev)
                    all_changes.extend(changes)

        # rescrape incomplete past fights
        incomplete_past_fights = Event.objects.filter(complete=False, date__lt=timezone.now())
        for fight in incomplete_past_fights:
            if fight.url not in scraped_urls:
                result = self.scrape_fights_from_url(fight.url)
                if result:
                    ev, changes = result
                    if ev not in scraped_events:
                        scraped_events.append(ev)
                    all_changes.extend(changes)

        return scraped_events, all_changes

    def scrape_fights_from_url(self, url):
        print(f"[scraper.scrape_fights_from_url] url={url}.")
        html_content = self.get_html_content(url, wait_after_ms=3000)
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
            date=date,
            defaults={
                'name': name,
                'headline': headline,
                'url': url,
                'location': location,
            }
        )
        ev = event[0]
        changes = []
        changes.extend(self.get_fights_for_card(soup.find("div", class_="main-card"), ev, FightCard.MAIN))
        changes.extend(self.get_fights_for_card(soup.find("div", class_="fight-card-prelims"), ev, FightCard.PRELIM))
        changes.extend(self.get_fights_for_card(
            soup.find("div", class_="fight-card-prelims-early"), ev, FightCard.EARLY_PRELIM))
        return ev, changes

    def get_fights_for_card(self, card_listing, event, fight_card):
        existing_fights = list(Fight.objects.filter(event=event, card=fight_card))
        existing_by_key = {(f.blue_name, f.red_name): f for f in existing_fights}
        newly_scraped_fights = []
        changes = []
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
            blue_img_url = blue_img_tag["src"] if blue_img_tag else None
            blue_img = blue_img_url if blue_img_url and blue_img_url.startswith("https://ufc.com/") else None
            blue_url = fight_row.find("div", class_="c-listing-fight__corner-image--blue").find("a")["href"]
            red_corner = fight_row.find("div", class_="c-listing-fight__corner-body--red")
            red_winner = red_corner.find("div", class_="c-listing-fight__outcome--win")
            blue_corner = fight_row.find("div", class_="c-listing-fight__corner-body--blue")
            blue_winner = blue_corner.find("div", class_="c-listing-fight__outcome--win")
            red_img_tag = fight_row.select_one(".c-listing-fight__corner--red .layout__region--content img")
            red_img_url = red_img_tag["src"] if red_img_tag else None
            red_img = red_img_url if red_img_url and red_img_url.startswith("https://ufc.com/") else None
            red_url = fight_row.find("div", class_="c-listing-fight__corner-image--red").find("a")["href"]
            winner = red_name if red_winner is not None else blue_name if blue_winner is not None else None
            results = fight_row.find("div", class_="js-listing-fight__results")
            method_element = results.find("div", class_="c-listing-fight__result-text method")
            method = method_element.text.strip() if method_element else None
            round_element = results.find("div", class_="c-listing-fight__result-text round")
            round = int(round_element.text.strip()) if round_element and round_element.text.strip().isdigit() else None

            defaults = {
                "card": fight_card,
                "order": order,
                "weight_class": weight_class,
                "blue_url": blue_url,
                "red_url": red_url,
                "winner": winner,
                "method": method,
                "round": round,
            }

            if blue_img is not None:
                defaults["blue_img"] = blue_img

            if red_img is not None:
                defaults["red_img"] = red_img

            existing_fight = existing_by_key.get((blue_name, red_name))
            fight_obj, created = Fight.objects.update_or_create(
                event_id=event.id,
                blue_name=blue_name,
                red_name=red_name,
                defaults=defaults
            )

            order += 1
            newly_scraped_fights.append(fight_obj)

            if created:
                changes.append({
                    "type": "fight_created",
                    "event_id": event.id,
                    "event_name": event.headline,
                    "fight": _fight_change_info(fight_obj),
                })
            elif existing_fight:
                updated_fields = []
                if existing_fight.winner != winner:
                    updated_fields.append("winner")
                if existing_fight.method != method:
                    updated_fields.append("method")
                if existing_fight.round != round:
                    updated_fields.append("round")
                if updated_fields:
                    changes.append({
                        "type": "fight_updated",
                        "event_id": event.id,
                        "event_name": event.headline,
                        "fight": _fight_change_info(fight_obj),
                        "updated_fields": updated_fields,
                    })

        # clean up fights that have changed or been canceled
        if existing_fights:
            newly_scraped_keys = set((f.blue_name, f.red_name) for f in newly_scraped_fights)
            for fight in existing_fights:
                key = (fight.blue_name, fight.red_name)
                if key not in newly_scraped_keys:
                    changes.append({
                        "type": "fight_removed",
                        "event_id": event.id,
                        "event_name": event.headline,
                        "fight": {"blue_name": fight.blue_name, "red_name": fight.red_name, "card": fight.card},
                    })
                    fight.delete()

        return changes

    def get_html_content(self, url, wait_after_ms=0, timeout_ms=None):
        timeout_ms = timeout_ms or self.GOTO_TIMEOUT_MS
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            page.goto(url, wait_until="domcontentloaded", timeout=timeout_ms)
            if wait_after_ms:
                page.wait_for_timeout(wait_after_ms)
            html_content = page.content()
            browser.close()
        return html_content

    def is_today_in_eastern(self, event_dt_utc):
        eastern = pytz.timezone('US/Eastern')
        now_et = datetime.now(eastern).date()
        event_et_date = event_dt_utc.astimezone(eastern).date()
        return event_et_date == now_et

    def normalize_name(self, name):
        return unidecode(name)

    def parse_event_date(self, date_str):
        date_str = date_str.strip()
        base_dt = datetime.strptime(date_str, "%a, %b %d / %I:%M %p UTC")

        utc = pytz.utc
        now = timezone.now().astimezone(utc)

        candidates = []
        for year_offset in (-1, 0, 1):
            candidate = base_dt.replace(year=now.year + year_offset)
            candidate = utc.localize(candidate)
            candidates.append(candidate)

        closest = min(candidates, key=lambda d: abs(d - now))
        return closest
