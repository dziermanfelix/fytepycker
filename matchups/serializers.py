from rest_framework import serializers
from .models import Matchup, Selection


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


class MatchupSerializer(serializers.ModelSerializer):
    selections = SelectionSerializer(many=True, read_only=True)

    class Meta:
        model = Matchup
        fields = "__all__"
        validators = []
