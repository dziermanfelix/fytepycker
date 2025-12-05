from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q
from .serializers import MatchupSerializer, CustomSelectionPostSerializer, SelectionSerializer, RecordSerializer
from .models import Matchup, Selection
from accounts.models import User


class MatchupView(APIView):
    def post(self, request):
        serializer = MatchupSerializer(data=request.data)
        if serializer.is_valid():
            validated_data = serializer.validated_data
            unique_fields = {
                'event': validated_data['event'],
                'user_a': validated_data['user_a'],
                'user_b': validated_data['user_b'],
            }
            defaults = {k: v for k, v in validated_data.items() if k not in unique_fields}
            matchup, created = Matchup.objects.get_or_create(
                **unique_fields,
                defaults=defaults
            )
            result_serializer = MatchupSerializer(matchup)
            status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
            return Response({'matchup': result_serializer.data, }, status=status_code)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request, *args, **kwargs):
        matchup_id = request.GET.get("id")
        user_a_id = request.GET.get("user_a_id")
        user_b_id = request.GET.get("user_b_id")
        matchups = Matchup.objects.select_related('event', 'user_a', 'user_b').all()
        if matchup_id:
            matchups = matchups.filter(id=matchup_id)
        elif user_a_id and user_b_id:
            matchups = matchups.filter(
                (Q(user_a_id=user_a_id) & Q(user_b_id=user_b_id)) |
                (Q(user_a_id=user_b_id) & Q(user_b_id=user_a_id))
            )
        elif user_a_id:
            matchups = matchups.filter(Q(user_a_id=user_a_id) | Q(user_b_id=user_a_id))
        serializer = MatchupSerializer(matchups, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request):
        serializer = MatchupSerializer(data=request.data)
        if serializer.is_valid():
            validated_data = serializer.validated_data
            unique_fields = {
                'event': validated_data['event'],
                'user_a': validated_data['user_a'],
                'user_b': validated_data['user_b'],
            }

            try:
                matchup = Matchup.objects.get(**unique_fields)
                matchup.delete()
                return Response({"message": "Matchup deleted successfully."}, status=status.HTTP_200_OK)
            except Matchup.DoesNotExist:
                return Response({"error": "Matchup not found."}, status=status.HTTP_404_NOT_FOUND)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SelectionView(APIView):
    def post(self, request):
        serializer = CustomSelectionPostSerializer(data=request.data)
        if serializer.is_valid():
            validated_data = serializer.validated_data

            matchup = validated_data['matchup']
            user = validated_data['user']
            fighter = validated_data['fighter']
            other_fighter = validated_data['other_fighter']
            fight = validated_data['fight']

            unique_fields = {
                'matchup': validated_data['matchup'],
                'fight': validated_data['fight'],
            }

            try:
                valid_users = Matchup.get_users(matchup)
                if user not in valid_users:
                    raise ValueError('Invalid user')

                valid_fighters = fight.get_fighters()
                if fighter not in valid_fighters:
                    return Response({"error": f"Fighter '{fighter}' is not valid for fight {fight.id}"}, status=status.HTTP_400_BAD_REQUEST)

                user_select_string = 'user_a_selection' if user == valid_users[0] else 'user_b_selection'
                other_user_select_string = 'user_b_selection' if user == valid_users[0] else 'user_a_selection'
                defaults = {user_select_string: fighter, other_user_select_string: other_fighter}

                # TODO figure out how to confirm selections later if we need to
                # or just remove it from the db
                defaults['confirmed'] = True

                selection, created = Selection.objects.update_or_create(
                    **unique_fields,
                    defaults=defaults
                )

                result_serializer = SelectionSerializer(selection)
                status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
                return Response({'selection': result_serializer.data, }, status=status_code)

            except (ValueError, Exception) as e:
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request):
        matchup_id = request.GET.get("matchup_id")

        if not matchup_id:
            return Response({"error": "matchup_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        selections = []
        selections = Selection.objects.filter(matchup=matchup_id)
        serializer = SelectionSerializer(selections, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class RecordView(APIView):
    def get(self, request, *args, **kwargs):
        user_id = request.GET.get("user_id")
        username = User.objects.filter(id=user_id).first()

        if not user_id:
            return Response({"error": "user_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        all_users = User.objects.exclude(id=user_id)

        matchups = Matchup.objects.filter(
            ((Q(user_a_id=user_id) & Q(user_b__in=all_users)) |
             (Q(user_b_id=user_id) & Q(user_a__in=all_users))) &
            Q(event__complete=True)
        )

        user_map = {user.id: {"user": user, "matchups": [], "bets": 0, "winnings": 0} for user in all_users}
        for m in matchups:
            opponent = m.user_b if str(m.user_a.id) == user_id else m.user_a
            if opponent.id in user_map:
                user_map[opponent.id]["matchups"].append(m)

                selections = m.matchup_selections.all()
                user_map[opponent.id]["bets"] += sum(s.bet or 0 for s in selections)
                for s in selections:
                    if s.winner == username:
                        user_map[opponent.id]["winnings"] += s.bet
                    elif s.winner == opponent:
                        user_map[opponent.id]["winnings"] -= s.bet

        record_data = list(user_map.values())
        serialized_data = RecordSerializer(record_data, many=True, context={'request': request}).data
        return Response(serialized_data, status=status.HTTP_200_OK)
