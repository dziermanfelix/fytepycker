from rest_framework import serializers
from .models import Matchup, Selection, SelectionResult
from ufc.serializers import EventSerializer
from accounts.serializers import UserSerializer
from ufc.models import Event, Fight
from accounts.models import User


class CustomSelectionPostSerializer(serializers.Serializer):
    matchup = serializers.PrimaryKeyRelatedField(queryset=Matchup.objects.all())
    fight = serializers.PrimaryKeyRelatedField(queryset=Fight.objects.all())
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    fighter = serializers.CharField()

    def validate(self, data):
        matchup = data.get('matchup')
        fight = data.get('fight')
        user = data.get('user')
        fighter = data.get('fighter')

        # Check if the selection is already taken by another user for the same fight
        existing_selection = Selection.objects.filter(matchup=matchup, fight=fight).first()

        k = 'user_a_selection' if user == matchup.user_b else 'user_b_selection'
        if existing_selection:
            existing_fighter = getattr(existing_selection, k, "Attribute not found")
            if existing_fighter == fighter:
                raise serializers.ValidationError(f"The fighter {fighter} has already been selected for this fight.")

        return data


class SelectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Selection
        fields = "__all__"
        validators = []


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
