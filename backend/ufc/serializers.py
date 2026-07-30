from rest_framework import serializers
from collections import defaultdict
from .models import Event, Fight


class FightSerializer(serializers.ModelSerializer):
    class Meta:
        model = Fight
        fields = "__all__"


class FightSummarySerializer(serializers.ModelSerializer):
    """Minimal fight fields for matchup list cards (turn status)."""

    class Meta:
        model = Fight
        fields = ("id", "card", "order", "winner")


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


class EventCardSerializer(serializers.ModelSerializer):
    """Event metadata only — for list/card views without fight payloads."""

    class Meta:
        model = Event
        fields = ("id", "name", "headline", "url", "date", "location", "complete")


class EventSummarySerializer(serializers.ModelSerializer):
    """Event with slim fights — for matchup list responses."""

    fights = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = ("id", "name", "headline", "url", "date", "location", "complete", "fights")

    def get_fights(self, event):
        fights_by_card = defaultdict(list)
        for fight in FightSummarySerializer(event.fights.all(), many=True).data:
            fights_by_card[fight["card"]].append(fight)
        return fights_by_card
