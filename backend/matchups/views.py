from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q, Prefetch
from .serializers import (
    MatchupSerializer,
    MatchupListSerializer,
    CustomSelectionPostSerializer,
    SelectionSerializer,
    RecordListSerializer,
    RecordDetailSerializer,
)
from .models import Matchup, Selection
from backend.accounts.models import User
from backend.ufc.models import Fight


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
            event = unique_fields['event']
            user_a = unique_fields['user_a']
            user_b = unique_fields['user_b']
            existing = Matchup.objects.filter(event=event).filter(
                (Q(user_a=user_a) & Q(user_b=user_b)) |
                (Q(user_a=user_b) & Q(user_b=user_a))
            ).first()
            if existing:
                result_serializer = MatchupSerializer(existing)
                return Response({'matchup': result_serializer.data, }, status=status.HTTP_200_OK)
            if event.is_betting_locked():
                return Response(
                    {'error': 'Picks are locked. The card has started.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
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
        incomplete = request.GET.get("incomplete") in ("1", "true", "True")

        matchups = Matchup.objects.select_related('event', 'user_a', 'user_b').prefetch_related(
            Prefetch(
                'matchup_selections',
                queryset=Selection.with_draft_ordering().select_related('fight', 'winner', 'dibs'),
            ),
            Prefetch('event__fights', queryset=Fight.objects.order_by('order')),
        )

        if matchup_id:
            matchups = matchups.filter(id=matchup_id)
            serializer_class = MatchupSerializer
        else:
            if incomplete:
                matchups = matchups.exclude(event__complete=True)
            if user_a_id and user_b_id:
                matchups = matchups.filter(
                    (Q(user_a_id=user_a_id) & Q(user_b_id=user_b_id)) |
                    (Q(user_a_id=user_b_id) & Q(user_b_id=user_a_id))
                )
            elif user_a_id:
                matchups = matchups.filter(Q(user_a_id=user_a_id) | Q(user_b_id=user_a_id))
            serializer_class = MatchupListSerializer

        serializer = serializer_class(matchups, many=True, context={'request': request})
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

        selections = Selection.ordered_for_draft(matchup_id).select_related(
            'matchup', 'matchup__event', 'matchup__user_a', 'matchup__user_b',
            'fight', 'fight__event', 'winner', 'dibs'
        )
        serializer = SelectionSerializer(selections, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class RecordView(APIView):
    def get(self, request, *args, **kwargs):
        user_id = request.GET.get("user_id")
        opponent_id = request.GET.get("opponent_id")

        if not user_id:
            return Response({"error": "user_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            current_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        matchups = Matchup.objects.filter(
            (Q(user_a_id=user_id) | Q(user_b_id=user_id)) & Q(event__complete=True)
        ).select_related(
            'event', 'user_a', 'user_b'
        ).prefetch_related(
            'matchup_selections',
            'matchup_selections__winner',
        )

        if opponent_id:
            try:
                opponent = User.objects.get(id=opponent_id)
            except User.DoesNotExist:
                return Response({"error": "Opponent not found"}, status=status.HTTP_404_NOT_FOUND)

            matchups = matchups.filter(
                (Q(user_a_id=user_id) & Q(user_b_id=opponent_id)) |
                (Q(user_a_id=opponent_id) & Q(user_b_id=user_id))
            ).order_by('-event__date')
            bets, winnings = self._aggregate_stats(matchups, current_user, opponent)
            record_data = {
                'user': opponent,
                'bets': bets,
                'winnings': winnings,
                'matchups': list(matchups),
            }
            serialized_data = RecordDetailSerializer(record_data, context={'request': request}).data
            return Response(serialized_data, status=status.HTTP_200_OK)

        opponent_map = {}
        for matchup in matchups:
            opponent = matchup.user_b if str(matchup.user_a_id) == str(user_id) else matchup.user_a
            entry = opponent_map.setdefault(
                opponent.id,
                {'user': opponent, 'bets': 0, 'winnings': 0, 'matchup_count': 0, 'wins': 0, 'losses': 0},
            )
            entry['matchup_count'] += 1
            selections = matchup.matchup_selections.all()
            entry['bets'] += sum(s.bet or 0 for s in selections)
            matchup_winnings = 0
            for selection in selections:
                if selection.winner == current_user:
                    matchup_winnings += selection.bet or 0
                elif selection.winner == opponent:
                    matchup_winnings -= selection.bet or 0
            entry['winnings'] += matchup_winnings
            if matchup_winnings > 0:
                entry['wins'] += 1
            elif matchup_winnings < 0:
                entry['losses'] += 1

        serialized_data = RecordListSerializer(
            sorted(opponent_map.values(), key=lambda entry: entry['user'].username.lower()),
            many=True,
        ).data
        return Response(serialized_data, status=status.HTTP_200_OK)

    def _aggregate_stats(self, matchups, current_user, opponent):
        bets = 0
        winnings = 0
        for matchup in matchups:
            selections = matchup.matchup_selections.all()
            bets += sum(s.bet or 0 for s in selections)
            for selection in selections:
                if selection.winner == current_user:
                    winnings += selection.bet or 0
                elif selection.winner == opponent:
                    winnings -= selection.bet or 0
        return bets, winnings
