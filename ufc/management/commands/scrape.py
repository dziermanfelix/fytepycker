import requests
from django.core.management.base import BaseCommand
from requests.auth import HTTPBasicAuth
from decouple import config


class Command(BaseCommand):
    help = "Triggers the scraper API"

    def handle(self, *args, **kwargs):
        url = config('SCRAPE_URL')
        username = config('ADMIN_USERNAME')
        password = config('ADMIN_PASSWORD')
        # actions = ['upcoming', 'past', 'live']
        actions = ['live']

        for action in actions:
            try:
                response = requests.get(f'{url}?action={action}', auth=HTTPBasicAuth(username, password))
                if response.status_code == 200:
                    self.stdout.write(self.style.SUCCESS(f"Scraper {action} ran successfully!"))
                else:
                    self.stderr.write(self.style.ERROR(f"Failed! ({action}), Status code: {response.status_code}"))
            except requests.RequestException as e:
                self.stderr.write(self.style.ERROR(f"Error ({action}): {e}"))
