from django.db import models
from django.core.exceptions import ValidationError


class SelectionManager(models.Manager):
    def create(self, **kwargs):
        selection = self.model(**kwargs)
        self.validate_selection(selection)
        selection.save(using=self._db)
        return selection

    def validate_selection(self, selection):
        # Check if the user is part of the matchup
        matchup_users = selection.matchup.get_users()
        if selection.user not in matchup_users:
            raise ValidationError(
                f"User {selection.user.username} is not a participant in this matchup"
            )

        # Verify that the fight is part of the matchup
        if selection.fight not in selection.matchup.event.fights.all():
            raise ValidationError(
                f"Fight {selection.fight} is not part of matchup {selection.matchup}"
            )

        # Check if fighter is valid for this fight
        valid_fighters = selection.fight.get_fighters()
        if selection.fighter not in valid_fighters:
            raise ValidationError(
                f"Fighter '{selection.fighter}' is not valid for the fight {selection.fight}"
            )
