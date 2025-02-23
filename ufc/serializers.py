from rest_framework import serializers
from .models import Event, Fight


class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = "__all__"


class FightSerializer(serializers.ModelSerializer):
    class Meta:
        model = Fight
        fields = "__all__"
