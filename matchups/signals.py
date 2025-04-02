from django.db.models.signals import post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from matchups.models import Matchup
from .models import Selection, SelectionResult, Fight
from asgiref.sync import async_to_sync


@receiver(post_save, sender=Selection)
def create_selection_result(sender, instance, created, **kwargs):
    """create selection result when selection is created"""
    if created:
        SelectionResult.objects.get_or_create(
            matchup=instance.matchup,
            fight=instance.fight
        )


@receiver(post_save, sender=Fight)
def update_selection_results(sender, instance, **kwargs):
    """update selection result when fight winner is set"""
    if instance.winner and instance.method and instance.round:
        selection_results = SelectionResult.objects.filter(fight=instance)

        for selection_result in selection_results:
            selections = Selection.objects.filter(matchup=selection_result.matchup, fight=instance)
            winning_selection = selections.filter(fight=instance, fighter=instance.winner).first()

            if winning_selection:
                selection_result.winner = winning_selection.user
            else:
                selection_result.winner = None

            selection_result.save()

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
