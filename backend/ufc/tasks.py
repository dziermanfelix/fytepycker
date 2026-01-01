from celery import shared_task
from datetime import datetime, timedelta
import pytz
from .models import Event


@shared_task(name='ufc.tasks.midnight_scrape')
def midnight_scrape():
    from .scraper import Scraper
    scraper = Scraper()
    actions = ['past', 'upcoming', 'live']
    for action in actions:
        scraper.scrape_fights_for_action(action)


@shared_task
def scrape_until_complete(event_id):
    from .scraper import Scraper
    scraper = Scraper()

    try:
        event = Event.objects.get(id=event_id)
    except Event.DoesNotExist:
        print(f"[scrape_until_complete] Event {event_id} not found.")
        return

    if not scraper.is_today_in_eastern(event.date):
        print(f"[scrape_until_complete] Event {event_id} is not today in Eastern Time.")
        return

    # check if within 6 hours of main card
    now = datetime.now(pytz.utc)
    time_diff = event.date - now
    if time_diff > timedelta(hours=6):
        print(f"[scrape_until_complete] Too early for event {event_id}. Rescheduling in 30 mins.")
        scrape_until_complete.apply_async((event.id,), countdown=1800)
        return

    print(f"[scrape_until_complete] Scraping event {event_id} at {now}")
    scraper.scrape_fights_from_url(event.url)
    event.refresh_from_db()

    # scrape every 15 minutes until event is complete
    if not event.complete:
        print(f"[scrape_until_complete] Event {event_id} not complete. Rescheduling in 15 mins.")
        scrape_until_complete.apply_async((event.id,), countdown=900)
    else:
        print(f"[scrape_until_complete] Event {event_id} is complete.")
