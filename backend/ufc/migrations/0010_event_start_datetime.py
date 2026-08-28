from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ufc', '0009_add_performance_indexes'),
    ]

    operations = [
        migrations.AddField(
            model_name='event',
            name='start_datetime',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
