"""
Management command to run daily scraping tasks.
Called by GitHub Actions cron job to replace Celery beat.
"""
from django.core.management.base import BaseCommand
from ufc.scraper import Scraper


class Command(BaseCommand):
    help = "Runs daily scraping tasks (replaces Celery midnight_scrape)"

    def handle(self, *args, **options):
        scraper = Scraper()
        actions = ['past', 'upcoming', 'live']
        
        for action in actions:
            try:
                self.stdout.write(f"Scraping {action} events...")
                scraper.scrape_fights_for_action(action)
                self.stdout.write(self.style.SUCCESS(f"Successfully scraped {action} events"))
            except Exception as e:
                self.stderr.write(self.style.ERROR(f"Error scraping {action}: {str(e)}"))


