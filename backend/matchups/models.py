from django.db import models
from django.core.validators import MaxValueValidator
from backend.ufc.models import Event, Fight
from backend.accounts.models import User
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
        indexes = [
            models.Index(fields=['user_a'], name='matchups_ma_user_a_idx'),
            models.Index(fields=['user_b'], name='matchups_ma_user_b_idx'),
            models.Index(fields=['event', 'user_a', 'user_b'], name='matchups_ma_event_user_idx'),
        ]

    def get_users(self):
        return [self.user_a, self.user_b]

    def __str__(self):
        return f"{{Matchup|{self.event}|{self.user_a.username}vs.{self.user_b.username}}}"


class Selection(models.Model):
    matchup = models.ForeignKey(Matchup, on_delete=models.CASCADE, related_name="matchup_selections")
    fight = models.ForeignKey(Fight, on_delete=models.CASCADE, related_name="fight_selections")
    user_a_selection = models.CharField(max_length=255, null=True, blank=True, default=None)
    user_b_selection = models.CharField(max_length=255, null=True, blank=True,  default=None)
    bet = models.IntegerField(default=0, validators=[MaxValueValidator(500)])
    dibs = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="dib_users")
    confirmed = models.BooleanField(default=False)
    winner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="winner_users")
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True, db_index=True)

    objects = SelectionManager()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["matchup", "fight"],
                name="unique_selection_per_fight_per_matchup"
            ),
        ]
        indexes = [
            models.Index(fields=['matchup'], name='matchups_se_matchup_idx'),
            models.Index(fields=['fight'], name='matchups_se_fight_idx'),
            models.Index(fields=['winner'], name='matchups_se_winner_idx'),
        ]

    def __str__(self):
        return f"{{Matchup:{self.matchup}|Fight:{self.fight}|UserASelection:{self.user_a_selection}|UserBSelection:{self.user_b_selection}}}"
