"""
Scheduler module to handle recurring scraping tasks.
Replaces Celery for free hosting.
Uses APScheduler to run tasks in the web process.
"""
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime, timedelta
import pytz
import atexit


def scrape_until_complete(event_id):
    """
    Scrape an event until it's complete. Runs every 15 minutes.
    This replaces the Celery task scrape_until_complete.
    """
    from django.apps import apps
    from django.db import close_old_connections
    from .scraper import Scraper

    # Background thread may use a DB connection that was closed (idle timeout, etc).
    # Force Django to discard stale connections so the next query uses a fresh one.
    close_old_connections()

    try:
        Event = apps.get_model('ufc', 'Event')
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
            print(f"[scrape_until_complete] Too early for event {event_id}. Will retry later.")
            return

        print(f"[scrape_until_complete] Scraping event {event_id} at {now}")
        scraper.scrape_fights_from_url(event.url)  # returns (ev, changes), we only need side effects
        event.refresh_from_db()

        # If event is complete, stop scheduling
        if event.complete:
            print(f"[scrape_until_complete] Event {event_id} is complete.")
            # Remove this job from scheduler
            scheduler = get_scheduler()
            job_id = f'scrape_event_{event_id}'
            try:
                scheduler.remove_job(job_id)
            except Exception:
                pass
        else:
            print(f"[scrape_until_complete] Event {event_id} not complete. Will scrape again in 15 mins.")
    finally:
        close_old_connections()


_scheduler = None


def get_scheduler():
    """Get or create the background scheduler."""
    global _scheduler
    if _scheduler is None:
        _scheduler = BackgroundScheduler()
        _scheduler.start()
        # Ensure scheduler shuts down when app exits
        atexit.register(lambda: _scheduler.shutdown())
    return _scheduler


def schedule_event_scraping(event_id):
    """
    Schedule scraping for a specific event every 15 minutes.
    """
    scheduler = get_scheduler()
    job_id = f'scrape_event_{event_id}'

    # Remove existing job if it exists
    try:
        scheduler.remove_job(job_id)
    except:
        pass

    # Add new job to run every 15 minutes
    scheduler.add_job(
        scrape_until_complete,
        IntervalTrigger(minutes=15),
        args=[event_id],
        id=job_id,
        replace_existing=True,
        max_instances=1
    )
    print(f"[scheduler] Scheduled scraping for event {event_id} every 15 minutes")
