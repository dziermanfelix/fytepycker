# Generated by Django 5.1.6 on 2025-02-21 00:55

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='UfcEvent',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('date', models.DateTimeField()),
                ('location', models.CharField(max_length=255)),
                ('main_event', models.CharField(blank=True, max_length=255, null=True)),
                ('scraped_at', models.DateTimeField(auto_now_add=True)),
            ],
        ),
    ]
