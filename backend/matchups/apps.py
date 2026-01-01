from django.apps import AppConfig


class MatchupsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'backend.matchups'

    def ready(self):
        import backend.matchups.signals
        import backend.ufc.signals
