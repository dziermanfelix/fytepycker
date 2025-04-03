from rest_framework import serializers
from .models import Matchup, Selection, SelectionResult
from ufc.serializers import EventSerializer
from accounts.serializers import UserSerializer
from ufc.models import Event
from accounts.models import User


def fighter_uniqueness_validator(attrs):
    matchup = attrs.get('matchup')
    fight = attrs.get('fight')
    fighter = attrs.get('fighter')
    user = attrs.get('user')

    if matchup and fight and fighter:
        existing = Selection.objects.filter(
            matchup=matchup,
            fight=fight,
            fighter=fighter
        ).first()

        if existing and existing.user != user:
            raise serializers.ValidationError({"fighter": "This fighter has already been selected by another user."})

    return attrs


class SelectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Selection
        fields = "__all__"
        validators = [fighter_uniqueness_validator]


class SelectionResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = SelectionResult
        fields = "__all__"


class MatchupSerializer(serializers.ModelSerializer):
    event = EventSerializer(read_only=True)
    user_a = UserSerializer(read_only=True)
    user_b = UserSerializer(read_only=True)
    selections = SelectionSerializer(many=True, read_only=True, source='matchup_selections')
    selection_results = SelectionResultSerializer(many=True, read_only=True, source='matchup_results')

    # Write: Accept only IDs when creating/updating
    event_id = serializers.PrimaryKeyRelatedField(
        queryset=Event.objects.all(), source='event', write_only=True
    )
    user_a_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='user_a', write_only=True
    )
    user_b_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='user_b', write_only=True
    )

    class Meta:
        model = Matchup
        fields = "__all__"
        validators = []


class LifetimeSerializer(serializers.Serializer):
    opponent = serializers.SerializerMethodField()
    wins = serializers.IntegerField()
    losses = serializers.IntegerField()
    win_percentage = serializers.SerializerMethodField()

    def get_opponent(self, obj):
        from .models import User
        user = User.objects.filter(id=obj["opponent_id"]).first()
        return {"id": user.id, "username": user.username} if user else None

    def get_win_percentage(self, obj):
        total = obj["wins"] + obj["losses"]
        return round((obj["wins"] / total) * 100, 2) if total > 0 else 0
