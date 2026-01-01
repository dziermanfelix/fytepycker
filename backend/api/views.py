from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from pathlib import Path


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
        version_path = Path(settings.BASE_DIR) / 'VERSION.txt'
        with open(version_path, 'r') as f:
            version = f.readline().strip()
        return Response({
            "version": version
        }, status=status.HTTP_200_OK)
