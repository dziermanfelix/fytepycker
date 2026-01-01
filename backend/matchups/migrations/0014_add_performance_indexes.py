# Generated manually for performance optimization

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('matchups', '0013_delete_matchupresult'),
    ]

    operations = [
        migrations.AddIndex(
            model_name='matchup',
            index=models.Index(fields=['user_a'], name='matchups_ma_user_a_idx'),
        ),
        migrations.AddIndex(
            model_name='matchup',
            index=models.Index(fields=['user_b'], name='matchups_ma_user_b_idx'),
        ),
        migrations.AddIndex(
            model_name='matchup',
            index=models.Index(fields=['event', 'user_a', 'user_b'], name='matchups_ma_event_user_idx'),
        ),
        migrations.AddIndex(
            model_name='selection',
            index=models.Index(fields=['matchup'], name='matchups_se_matchup_idx'),
        ),
        migrations.AddIndex(
            model_name='selection',
            index=models.Index(fields=['fight'], name='matchups_se_fight_idx'),
        ),
        migrations.AddIndex(
            model_name='selection',
            index=models.Index(fields=['winner'], name='matchups_se_winner_idx'),
        ),
    ]
