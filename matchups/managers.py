from django.db import models
from django.core.exceptions import ValidationError
import random as r


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
        kwargs['first_pick'] = r.choice(users)

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
            self.validate_selection(selection)
            k, fighter = next(iter(defaults.items()))
            # selection undo
            if fighter == getattr(selection, k, None):
                setattr(selection, k, None)
                selection.save()
            # selection change
            else:
                setattr(selection, k, fighter)
                selection.save()
            return self.get(**kwargs), False
        except self.model.DoesNotExist:
            params = {**kwargs, **defaults}
            return self.create(**params), True

    def validate_selection(self, selection):
        # verify fight is part of the matchup
        if selection.fight not in selection.matchup.event.fights.all():
            raise ValidationError(
                f"Fight {selection.fight} is not part of matchup {selection.matchup}"
            )

        # check if selections are valid for this fight
        selections = [selection.user_a_selection, selection.user_b_selection]
        valid_selections = selection.fight.get_fighters()
        for s in selections:
            if s is not None:
                if s not in valid_selections:
                    raise ValidationError(
                        f"Fighter '{s}' is not a valid selection for the fight {selection.fight}"
                    )

        # verify winner is valid
        winner = selection.winner
        if winner != None:
            valid_users = selection.matchup.get_users()
            if winner not in valid_users:
                raise ValidationError(
                    f"User {selection.winner.username} is not a participant in this matchup"
                )
