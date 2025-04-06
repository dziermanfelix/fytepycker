from django.db.models.signals import post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from ufc.models import Fight
from .models import Matchup, Selection, MatchupResult
from asgiref.sync import async_to_sync


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
