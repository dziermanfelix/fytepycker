from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count, Q, Prefetch
from .serializers import MatchupSerializer, SelectionSerializer, LifetimeSerializer
from .models import Matchup, Selection, SelectionResult
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
        serializer = MatchupSerializer(matchups, many=True)
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
        event_id = request.data.get('event')
        user_id = request.data.get('user')
        if event_id and user_id:
            try:
                matchup = Matchup.objects.get(event_id=event_id, user_a_id=user_id, user_b_id=user_id)
                request.data['matchup'] = matchup.id
            except Matchup.DoesNotExist:
                return Response({'error': 'Matchup not found for the given event and user'}, status=status.HTTP_404_NOT_FOUND)
        serializer = SelectionSerializer(data=request.data)
        if serializer.is_valid():
            validated_data = serializer.validated_data
            unique_fields = {
                'matchup': validated_data['matchup'],
                'fight': validated_data['fight'],
                'user': validated_data['user'],
            }
            defaults = {k: v for k, v in validated_data.items() if k not in unique_fields}
            try:
                selection, created = Selection.objects.get_or_create(
                    **unique_fields,
                    defaults=defaults
                )
                result_serializer = SelectionSerializer(selection)
                status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
                return Response({'selection': result_serializer.data, }, status=status_code)
            except Exception as e:
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request):
        matchup = request.query_params.get('matchup')
        event = request.query_params.get('event')
        user = request.query_params.get('user')
        selections = []
        if matchup:
            selections = Selection.objects.filter(matchup=matchup)
        elif event and user:
            matchup = Matchup.objects.filter(event_id=event, user_a=user, user_b=user).first()
            if matchup:
                selections = Selection.objects.filter(matchup=matchup)
        serializer = SelectionSerializer(selections, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class LifetimeView(APIView):
    def get(self, request, *args, **kwargs):
        user_id = request.GET.get("user_id")
        user = User.objects.get(id=user_id)
        if not user_id:
            return Response({"error": "user_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        matchups = Matchup.objects.prefetch_related(
            Prefetch("matchup_results", queryset=SelectionResult.objects.only("winner"))
        ).filter(Q(user_a_id=user_id) | Q(user_b_id=user_id))

        user_stats = {}

        for matchup in matchups:
            opponent_id = matchup.user_b_id if matchup.user_a_id == int(user_id) else matchup.user_a_id

            if opponent_id not in user_stats:
                user_stats[opponent_id] = {"opponent_id": opponent_id, "wins": 0, "losses": 0}

            for result in matchup.matchup_results.all():
                winner = result.winner.username if result.winner else None
                if winner == user.username:
                    user_stats[opponent_id]["wins"] += 1
                else:
                    user_stats[opponent_id]["losses"] += 1

        serialized_data = LifetimeSerializer(user_stats.values(), many=True).data
        return Response(serialized_data, status=status.HTTP_200_OK)
