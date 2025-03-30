from django.apps import AppConfig


class MatchupsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'matchups'

    def ready(self):
        import matchups.signals
