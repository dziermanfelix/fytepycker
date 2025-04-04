# Generated by Django 5.1.6 on 2025-03-30 20:19

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('matchups', '0001_initial'),
        ('ufc', '0005_event_headline'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='SelectionResult',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('winnings', models.DecimalField(decimal_places=2, default=0.0, max_digits=10)),
                ('fight', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='fight_results', to='ufc.fight')),
                ('matchup', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='matchup_results', to='matchups.matchup')),
                ('winner', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='user_results', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
