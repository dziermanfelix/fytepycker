from django.db.models.signals import post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from itertools import cycle
from backend.ufc.models import Fight, Event
from .models import Matchup, Selection
from asgiref.sync import async_to_sync


def determine_dibs_for_new_fight(matchup, fight):
    other_user = matchup.user_b if matchup.first_pick_id == matchup.user_a_id else matchup.user_a
    fights = list(Fight.ordered_for_draft(matchup.event))
    try:
        index = next(i for i, f in enumerate(fights) if f.id == fight.id)
    except StopIteration:
        return matchup.first_pick or matchup.user_a

    adjacent_fight = None
    if index > 0:
        adjacent_fight = fights[index - 1]
    elif index + 1 < len(fights):
        adjacent_fight = fights[index + 1]

    if adjacent_fight is None:
        return matchup.first_pick or matchup.user_a

    adjacent_selection = Selection.objects.filter(matchup=matchup, fight=adjacent_fight).first()
    if not adjacent_selection or not adjacent_selection.dibs_id:
        return matchup.first_pick or matchup.user_a

    if adjacent_selection.dibs_id == matchup.user_a_id:
        return matchup.user_b
    if adjacent_selection.dibs_id == matchup.user_b_id:
        return matchup.user_a
    return other_user


@receiver(post_save, sender=Event)
def clear_empty_matchups(sender, instance, **kwargs):
    matchups = Matchup.objects.filter(event=instance)

    for matchup in matchups:
        has_confirmed = Selection.objects.filter(
            matchup=matchup,
            confirmed=True
        ).exists()

        if not has_confirmed:
            matchup.delete()


@receiver(post_save, sender=Matchup)
def create_matchup_related_objects(sender, instance, created, **kwargs):
    if created:
        # create selection for each fight
        user_cycle = cycle([instance.first_pick, instance.user_b if instance.first_pick ==
                           instance.user_a else instance.user_a])
        fights = Fight.ordered_for_draft(instance.event)

        for fight in fights:
            dibs = next(user_cycle)
            Selection.objects.create(matchup=instance, fight=fight, dibs=dibs,
                                     bet=determine_default_bet(fight))


@receiver(post_save, sender=Fight)
def update_selection_on_fight_update(sender, instance, **kwargs):
    """update selection when fight is updated"""

    # add selection if this is a new fight to the matchup (usually means a fight got updated)
    existing_matchups = Matchup.objects.filter(event=instance.event)
    if existing_matchups:
        for matchup in existing_matchups:
            existing_selection = Selection.objects.filter(matchup=matchup, fight=instance.id).exists()
            if not existing_selection:
                next_dibs = determine_dibs_for_new_fight(matchup, instance)
                Selection.objects.create(matchup=matchup, fight=instance, dibs=next_dibs,
                                         bet=determine_default_bet(instance))

    # update selection winner
    winning_fighter = instance.winner
    selections = Selection.objects.filter(fight=instance)
    for selection in selections:
        if winning_fighter:
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


def determine_default_bet(fight):
    default_bet = 30
    if 'title' in fight.weight_class.lower():
        default_bet = 100
    elif fight.card == 'main' and fight.order == 0:
        default_bet = 50
    return default_bet
