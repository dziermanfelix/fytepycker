from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Event, Fight
from django.utils.timezone import now
from datetime import timedelta


@receiver(post_save, sender=Event)
def event_complete_if_in_past(sender, instance, **kwargs):
    event_date = instance.date
    current_time = now()

    if current_time - event_date >= timedelta(days=1):
        if not instance.complete:
            instance.complete = True
            instance.save(update_fields=["complete"])


@receiver(post_save, sender=Fight)
def event_complete_if_main_fight_has_winner(sender, instance, **kwargs):
    event = instance.event

    main_event = instance.card == 'main' and instance.order == 0
    main_event_complete = main_event and instance.winner != None

    if main_event and main_event_complete and not event.complete:
        event.complete = True
        event.save(update_fields=["complete"])
