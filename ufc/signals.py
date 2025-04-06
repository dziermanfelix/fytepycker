from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Event, Fight


@receiver(post_save, sender=Fight)
def check_event_completion(sender, instance, **kwargs):
    event = instance.event

    all_complete = event.fights.exclude(winner__isnull=False).count() == 0

    if all_complete and not event.complete:
        event.complete = True
        event.save(update_fields=["complete"])
