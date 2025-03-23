from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import MatchupSerializer, SelectionSerializer
from .models import Matchup, Selection


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

    def get(self, request):
        matchups = Matchup.objects.all()
        serializer = MatchupSerializer(matchups, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class SelectionView(APIView):
    def post(self, request):
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
        selections = Selection.objects.filter(matchup=matchup)
        serializer = SelectionSerializer(selections, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
