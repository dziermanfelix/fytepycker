# Generated by Django 5.1.6 on 2025-04-06 19:16

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ufc', '0006_alter_fight_method_alter_fight_round_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='event',
            name='complete',
            field=models.BooleanField(blank=True, default=False, null=True),
        ),
    ]
