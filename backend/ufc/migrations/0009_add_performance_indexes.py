# Generated manually for performance optimization

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ufc', '0008_alter_fight_card'),
    ]

    operations = [
        migrations.AddIndex(
            model_name='event',
            index=models.Index(fields=['complete'], name='ufc_event_complete_idx'),
        ),
        migrations.AddIndex(
            model_name='event',
            index=models.Index(fields=['date'], name='ufc_event_date_idx'),
        ),
        migrations.AddIndex(
            model_name='fight',
            index=models.Index(fields=['event'], name='ufc_fight_event_idx'),
        ),
        migrations.AddIndex(
            model_name='fight',
            index=models.Index(fields=['event', 'order'], name='ufc_fight_event_order_idx'),
        ),
    ]
