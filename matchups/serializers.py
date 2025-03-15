from rest_framework import serializers
from .models import Matchup, Selection


class SelectionSerializer(serializers.ModelSerializer):
    validators = []

    class Meta:
        model = Selection
        fields = "__all__"


class MatchupSerializer(serializers.ModelSerializer):
    selections = SelectionSerializer(many=True, read_only=True)
    validators = []

    class Meta:
        model = Matchup
        fields = "__all__"
