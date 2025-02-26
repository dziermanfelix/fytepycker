from django.db import models


class Event(models.Model):
    name = models.CharField(max_length=255)
    url = models.URLField(blank=True, null=True)
    date = models.DateTimeField()
    location = models.CharField(max_length=255)
    scraped_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["name", "date"], name="unique_name_and_date_per_event"),
        ]

    def __str__(self):
        return self.name


class FightCard(models.TextChoices):
    MAIN = "main", "Main Card"
    PRELIM = "prelim", "Prelims"
    EARLY_PRELIM = "early", "Early Prelims"


class Fight(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="fights")
    card = models.CharField(max_length=15, choices=FightCard.choices)
    order = models.PositiveIntegerField(null=True, blank=True, default=None)
    weight_class = models.CharField(max_length=255)
    blue_name = models.CharField(max_length=255)
    blue_img = models.URLField(blank=True, null=True)
    blue_url = models.URLField(blank=True, null=True)
    red_name = models.CharField(max_length=255)
    red_img = models.URLField(blank=True, null=True)
    red_url = models.URLField(blank=True, null=True)
    winner = models.CharField(max_length=255, null=True)
    method = models.CharField(max_length=255, null=True)
    round = models.PositiveIntegerField(null=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["event", "blue_name", "red_name"], name="unique_fight_per_event"),
            models.CheckConstraint(
                check=models.Q(winner__isnull=True) | models.Q(winner=models.F("blue_name")) | models.Q(winner=models.F("red_name")), name="winner_must_be_fighter",
            )
        ]

    def __str__(self):
        return f'Event({self.event_id}):{self.blue_name} vs. {self.red_name}'
