from django.db import models
from django.core.exceptions import ValidationError


class MatchupManager(models.Manager):
    def get_or_create(self, defaults=None, **kwargs):
        defaults = defaults or {}
        event = kwargs.get('event')
        user_a = kwargs.get('user_a')
        user_b = kwargs.get('user_b')

        user_a, user_b = sorted([user_a, user_b], key=lambda u: u.id)

        existing = self.filter(
            event=event,
            user_a=user_a,
            user_b=user_b
        ).first()

        if existing:
            return existing, False

        users = sorted([user_a, user_b], key=lambda user: user.id)

        kwargs['user_a'] = users[0]
        kwargs['user_b'] = users[1]

        all_kwargs = {**kwargs, **defaults}

        return self.create(**all_kwargs), True


class SelectionManager(models.Manager):
    def create(self, **kwargs):
        selection = self.model(**kwargs)
        self.validate_selection(selection)
        selection.save(using=self._db)
        return selection

    def get_or_create(self, defaults=None, **kwargs):
        defaults = defaults or {}
        try:
            selection = self.get(**kwargs)
            # selection undo
            if selection.fighter == defaults.get('fighter'):
                selection.fighter = ''
                selection.save()
            # selection change
            else:
                selection.fighter = defaults.get('fighter')
                selection.save()
            return self.get(**kwargs), False
        except self.model.DoesNotExist:
            params = {**kwargs, **defaults}
            return self.create(**params), True

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
