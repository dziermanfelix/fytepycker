from rest_framework import serializers
from collections import defaultdict
from .models import Event, Fight


class FightSerializer(serializers.ModelSerializer):
    class Meta:
        model = Fight
        fields = "__all__"


class EventSerializer(serializers.ModelSerializer):
    fights = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = "__all__"

    def get_fights(self, event):
        fights_by_card = defaultdict(list)
        for fight in FightSerializer(event.fights.all().order_by("order"), many=True).data:
            if "card" in fight:
                fights_by_card[fight["card"]].append(fight)
        return fights_by_card
