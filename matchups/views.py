from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import MatchupSerializer, SelectionSerializer
from .models import Matchup


class MatchupView(APIView):
    def post(self, request):
        serializer = MatchupSerializer(data=request.data)
        if serializer.is_valid():
            validated_data = serializer.validated_data
            unique_fields = {
                'event': validated_data['event'],
                'creator': validated_data['creator'],
                'opponent': validated_data['opponent'],
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
        return Response(serializer.data)


class SelectionView(APIView):
    def post(self, request):
        serializer = SelectionSerializer(data=request.data)
        if serializer.is_valid():
            # TODO make save handle duplicates
            try:
                serializer.save()
                return Response({'selection': serializer.data, }, status=status.HTTP_201_CREATED)
            except:
                # TODO get error, cleanup logic
                return Response(None, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
