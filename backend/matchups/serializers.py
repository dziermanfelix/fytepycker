from rest_framework import serializers
from .models import Matchup, Selection
from backend.ufc.serializers import EventSerializer, EventSummarySerializer, EventCardSerializer
from backend.accounts.serializers import UserSerializer
from backend.ufc.models import Event, Fight
from backend.accounts.models import User


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
        other_fighter = next(f for f in fight.get_fighters() if f != fighter)
        data['other_fighter'] = other_fighter

        existing_selection = Selection.objects.filter(matchup=matchup, fight=fight).first()
        if not existing_selection:
            raise serializers.ValidationError("No selection exists for this fight in the matchup.")

        if existing_selection.confirmed:
            raise serializers.ValidationError("This fight has already been picked.")

        if existing_selection.dibs_id != user.id:
            raise serializers.ValidationError("You do not have dibs on this fight.")

        k = 'user_a_selection' if user == matchup.user_b else 'user_b_selection'
        existing_fighter = getattr(existing_selection, k, None)
        if existing_fighter == fighter:
            raise serializers.ValidationError(f"The fighter {fighter} has already been selected for this fight.")

        return data


class SelectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Selection
        fields = "__all__"
        validators = []


class MatchupSerializerBase(serializers.ModelSerializer):
    user_a = UserSerializer(read_only=True)
    user_b = UserSerializer(read_only=True)
    selections = SelectionSerializer(many=True, read_only=True, source='matchup_selections')
    bets = serializers.SerializerMethodField()
    winnings = serializers.SerializerMethodField()

    def get_bets(self, obj):
        return sum(s.bet or 0 for s in obj.matchup_selections.all())

    def get_winnings(self, obj):
        request = self.context.get('request')
        if not request or not hasattr(request, 'user'):
            return 0
        username = request.user
        winnings = 0
        for s in obj.matchup_selections.all():
            if s.winner == username:
                winnings += s.bet
            elif s.winner in [obj.user_a, obj.user_b]:
                winnings -= s.bet
        return winnings

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


class MatchupSerializer(MatchupSerializerBase):
    """Full matchup including event fights — for detail/create responses."""

    event = EventSerializer(read_only=True)


class MatchupListSerializer(MatchupSerializerBase):
    """Slim matchup for list views — event fights are id/card/order/winner only."""

    event = EventSummarySerializer(read_only=True)


class RecordMatchupSerializer(serializers.ModelSerializer):
    user_a = UserSerializer(read_only=True)
    user_b = UserSerializer(read_only=True)
    event = EventCardSerializer(read_only=True)
    bets = serializers.SerializerMethodField()
    winnings = serializers.SerializerMethodField()

    def get_bets(self, obj):
        return sum(s.bet or 0 for s in obj.matchup_selections.all())

    def get_winnings(self, obj):
        request = self.context.get('request')
        if not request or not hasattr(request, 'user'):
            return 0
        username = request.user
        winnings = 0
        for s in obj.matchup_selections.all():
            if s.winner == username:
                winnings += s.bet
            elif s.winner in [obj.user_a, obj.user_b]:
                winnings -= s.bet
        return winnings

    class Meta:
        model = Matchup
        fields = (
            'id',
            'event',
            'user_a',
            'user_b',
            'first_pick',
            'bets',
            'winnings',
        )


class RecordListSerializer(serializers.Serializer):
    user = UserSerializer(read_only=True)
    bets = serializers.FloatField(read_only=True)
    winnings = serializers.FloatField(read_only=True)
    matchup_count = serializers.IntegerField(read_only=True)
    wins = serializers.IntegerField(read_only=True)
    losses = serializers.IntegerField(read_only=True)


class RecordDetailSerializer(serializers.Serializer):
    user = UserSerializer(read_only=True)
    bets = serializers.FloatField(read_only=True)
    winnings = serializers.FloatField(read_only=True)
    matchups = RecordMatchupSerializer(many=True, read_only=True)
