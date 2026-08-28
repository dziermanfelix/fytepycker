from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('ufc', '0010_event_start_datetime'),
    ]

    operations = [
        migrations.RenameField(
            model_name='event',
            old_name='start_datetime',
            new_name='start',
        ),
    ]
