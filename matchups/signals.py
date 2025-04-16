from django.db.models.signals import post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from itertools import cycle
from ufc.models import Fight
from .models import Matchup, Selection, MatchupResult
from asgiref.sync import async_to_sync


@receiver(post_save, sender=Matchup)
def create_matchup_related_objects(sender, instance, created, **kwargs):
    if created:
        # create selection for each fight
        user_cycle = cycle([instance.first_pick, instance.user_b if instance.first_pick ==
                           instance.user_a else instance.user_a])
        fights = Fight.objects.filter(event=instance.event).order_by('id')
        for fight in fights:
            Selection.objects.create(matchup=instance, fight=fight, dibs=next(user_cycle),
                                     bet=determine_default_bet(fight))

        # create matchup result
        if not MatchupResult.objects.filter(matchup=instance).exists():
            MatchupResult.objects.create(matchup=instance)


@receiver(post_save, sender=Selection)
def create_matchup_result(sender, instance, created, **kwargs):
    """create matchup result when selection is created"""
    if created:
        MatchupResult.objects.get_or_create(
            matchup=instance.matchup,
        )


@receiver(post_save, sender=Fight)
def update_selection_on_fight_update(sender, instance, **kwargs):
    """update selection when fight is updated"""

    # add selection if this is a new fight to the matchup (usually means a fight got updated)
    existing_matchups = Matchup.objects.filter(event=instance.event)
    if existing_matchups:
        for matchup in existing_matchups:
            existing_selection = Selection.objects.filter(matchup=matchup, fight=instance.id).exists()
            if not existing_selection:
                order = instance.order
                adjacent_fight = Fight.objects.filter(event=instance.event, order=order - 1).first()
                if not adjacent_fight:
                    adjacent_fight = Fight.objects.filter(event=instance.event, order=order + 1).first()
                adjacent_selection = Selection.objects.filter(matchup=matchup, fight=adjacent_fight).first()
                next_dibs = matchup.user_a if adjacent_selection.dibs == matchup.user_b else matchup.user_b
                Selection.objects.create(matchup=matchup, fight=instance, dibs=next_dibs,
                                         bet=determine_default_bet(instance))

    # update selection winner
    if instance.winner:
        selections = Selection.objects.filter(fight=instance)

        winning_fighter = instance.winner

        for selection in selections:
            if selection.user_a_selection == winning_fighter:
                selection.winner = selection.matchup.user_a
            elif selection.user_b_selection == winning_fighter:
                selection.winner = selection.matchup.user_b
            else:
                selection.winner = None

            selection.save()

    # broadcast to websocket
    event = instance.event
    existing_matchups = Matchup.objects.filter(event=event)
    message = {
        'type': 'refetch_matchup',
    }
    channel_layer = get_channel_layer()
    for matchup in existing_matchups:
        room_group_name = f'matchup_{matchup.id}'
        async_to_sync(channel_layer.group_send)(
            room_group_name,
            message
        )


@receiver(post_save, sender=Selection)
def update_matchup_result_on_winner_change(sender, instance, **kwargs):
    if not instance.winner:
        return

    matchup = instance.matchup

    selections = Selection.objects.filter(matchup=matchup)
    user_wins = {user: 0 for user in matchup.get_users()}

    for sel in selections:
        if sel.winner:
            user_wins[sel.winner] += 1

    winning_user = max(user_wins, key=user_wins.get)
    tied = list(user_wins.values()).count(user_wins[winning_user]) > 1

    defaults = {"winner": winning_user}
    if tied:
        defaults = {"winner": None}

    MatchupResult.objects.update_or_create(
        matchup=matchup,
        defaults=defaults
    )


def determine_default_bet(fight):
    default_bet = 30
    if 'title' in fight.weight_class:
        default_bet = 100
    elif fight.card == 'main' and fight.order == 0:
        default_bet = 50
    return default_bet
