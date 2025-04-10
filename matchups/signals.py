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
            Selection.objects.create(matchup=instance, fight=fight, dibs=next(user_cycle))

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
def update_selection_on_fight_winner(sender, instance, **kwargs):
    """update selection when fight winner is set"""
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
    matchups = Matchup.objects.filter(event=event)
    message = {
        'type': 'refetch_matchup',
    }
    channel_layer = get_channel_layer()
    for matchup in matchups:
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
