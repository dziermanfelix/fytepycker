from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Event, Fight


@receiver(post_save, sender=Fight)
def check_event_completion(sender, instance, **kwargs):
    event = instance.event

    main_event = instance.card == 'main' and instance.order == 0
    main_event_complete = main_event and instance.winner != None

    if main_event and main_event_complete and not event.complete:
        event.complete = True
        event.save(update_fields=["complete"])
