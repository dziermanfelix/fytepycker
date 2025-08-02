from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status


class HealthCheckView(APIView):
    """
    A simple health check endpoint to verify the API is running
    """

    def get(self, request):
        return Response({
            "status": "healthy",
            "message": "API is running"
        }, status=status.HTTP_200_OK)


class VersionView(APIView):
    def get(self, request):
        version = open('VERSION.txt', 'r').readline().strip()
        return Response({
            "version": version
        }, status=status.HTTP_200_OK)
