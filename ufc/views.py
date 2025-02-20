import requests
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import UfcFightSerializer
from decouple import config


class UfcFightList(APIView):
    def get(self, request):
        url = "https://ufc-data1.p.rapidapi.com/Events/FindEventsByDateRange/1-1-24/1-31-24"
        headers = {
            "X-RapidAPI-Key": config('RAPID_API_KEY'),
            "X-RapidAPI-Host": "ufc-data1.p.rapidapi.com"
        }
        querystring = {"limit": "10"}

        response = requests.get(url, headers=headers, params=querystring)
        print("Status Code:", response.status_code)
        print("Raw Response:", response.text[:500])
        # print(response.json())

        if response.status_code == 200:
            upcoming_fights = response.json()
            serializer = UfcFightSerializer(upcoming_fights, many=True)
            return Response(serializer.data)

        return Response({"error": "Unable to fetch data from UFC API"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
