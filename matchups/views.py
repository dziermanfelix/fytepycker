from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import MatchupSerializer, SelectionSerializer
from .models import Matchup


class MatchupView(APIView):
    def post(self, request):
        serializer = MatchupSerializer(data=request.data)

        if serializer.is_valid():
            matchup = serializer.save()
            return Response({
                'matchup': MatchupSerializer(matchup).data,
            }, status=status.HTTP_201_CREATED)

        else:
            print(f'Serializer errors: {serializer.errors}')

    def get(self, request):
        matchups = Matchup.objects.all()
        serializer = MatchupSerializer(matchups, many=True)
        return Response(serializer.data)
