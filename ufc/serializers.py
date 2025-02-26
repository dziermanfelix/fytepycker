from rest_framework import serializers
from .models import Event, Fight


class FightSerializer(serializers.ModelSerializer):
    class Meta:
        model = Fight
        fields = "__all__"


class EventSerializer(serializers.ModelSerializer):
    fights = FightSerializer(many=True, read_only=True)

    class Meta:
        model = Event
        fields = "__all__"
