# Generated by Django 5.1.6 on 2025-03-28 01:37

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ufc', '0004_fight_blue_url_fight_red_url'),
    ]

    operations = [
        migrations.AddField(
            model_name='event',
            name='headline',
            field=models.CharField(default='No headline', max_length=255),
        ),
    ]
