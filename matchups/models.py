from django.db import models
from ufc.models import Event, Fight
from accounts.models import User
from .managers import SelectionManager


class Matchup(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="event_matchups")
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name="creator_matchups")
    opponent = models.ForeignKey(User, on_delete=models.CASCADE, related_name="opponent_matchups")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["event", "creator", "opponent"],
                                    name="unique_creator_and_opponent_per_event"),
        ]

    def get_users(self):
        return [self.creator, self.opponent]

    def __str__(self):
        return f"Matchup for {self.event}, creator {self.creator.username}, opponent {self.opponent.username}"


class Selection(models.Model):
    matchup = models.ForeignKey(Matchup, on_delete=models.CASCADE, related_name="matchup_selections")
    fight = models.ForeignKey(Fight, on_delete=models.CASCADE, related_name="fight_selections")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="user_selections")
    fighter = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = SelectionManager()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["matchup", "fight", "user"],
                name="unique_user_selection_per_fight_per_matchup"
            ),
        ]

    def __str__(self):
        return f"{self.user.username} selects {self.fighter} for {self.fight} in matchup {self.matchup}"
