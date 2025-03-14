from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import MatchupSerializer, SelectionSerializer
from .models import Matchup


class MatchupView(APIView):
    def post(self, request):
        serializer = MatchupSerializer(data=request.data)
        if serializer.is_valid():
            # TODO make save handle duplicates
            serializer.save()
            return Response({'matchup': serializer.data, }, status=status.HTTP_201_CREATED)
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
