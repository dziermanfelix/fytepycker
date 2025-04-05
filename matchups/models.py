from django.db import models
from ufc.models import Event, Fight
from accounts.models import User
from .managers import MatchupManager, SelectionManager


class Matchup(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="event_matchups")
    user_a = models.ForeignKey(User, on_delete=models.CASCADE, related_name="user_a_matchups")
    user_b = models.ForeignKey(User, on_delete=models.CASCADE, related_name="user_b_matchups")
    first_pick = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = MatchupManager()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["event", "user_a", "user_b"],
                name="unique_users_per_event"),
            models.CheckConstraint(
                check=models.Q(user_a__lte=models.F('user_b')),
                name="ensure_user_a_less_than_user_b"
            )
        ]

    def get_users(self):
        return [self.user_a, self.user_b]

    def __str__(self):
        return f"{{Matchup|{self.event}|{self.user_a.username}vs.{self.user_b.username}}}"


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
        return f"{{Matchup:{self.matchup}|Fight:{self.fight}|User:{self.user}|Fighter:{self.fighter}}}"


class SelectionResult(models.Model):
    matchup = models.ForeignKey(Matchup, on_delete=models.CASCADE, related_name="matchup_results")
    fight = models.ForeignKey(Fight, on_delete=models.CASCADE, related_name="fight_results")
    winner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="user_results")
    winnings = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    class Meta:
        unique_together = ('matchup', 'fight')

    def __str__(self):
        return f"{{Matchup:{self.matchup}|Fight:{self.fight}|Winner:{self.winner}|Winnings:{self.winnings}}}"
