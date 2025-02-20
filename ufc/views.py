import requests
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import UfcFightSerializer
from decouple import config


class UfcFightList(APIView):
    def get(self, request):
        url = "https://unofficial-tapology-api.p.rapidapi.com/api/schedule/events/69"
        headers = {
            "X-RapidAPI-Key": config('RAPID_API_KEY'),
            "X-RapidAPI-Host": "unofficial-tapology-api.p.rapidapi.com"
        }
        querystring = {"fields": "organization,datetime,broadcast,city,subregion,main_event,weight_class"}

        response = requests.get(url, headers=headers, params=querystring)

        if response.status_code == 200:
            upcoming_fights = response.json()
            serializer = UfcFightSerializer(upcoming_fights, many=True)
            return Response(serializer.data)

        return Response({"error": "Unable to fetch data from UFC API"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
