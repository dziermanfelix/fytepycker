from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .serializers import UserRegistrationSerializer, UserLoginSerializer, UserSerializer
from .models import User
from ..matchups.models import Matchup
from django.db.models import Q


class RegisterView(APIView):
    permission_classes = (AllowAny,)
    # Exclude SessionAuthentication to avoid CSRF requirements for unauthenticated requests
    authentication_classes = []

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()  # calls the create method
            refresh = RefreshToken.for_user(user)

            return Response({
                'user': serializer.data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = (AllowAny,)
    # Exclude SessionAuthentication to avoid CSRF requirements for unauthenticated requests
    authentication_classes = []

    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data['username']
            password = serializer.validated_data['password']
            user = authenticate(username=username, password=password)

            if user:
                refresh = RefreshToken.for_user(user)
                return Response({
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                })

            return Response({
                'error': 'Invalid credentials'
            }, status=status.HTTP_401_UNAUTHORIZED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response({"error": "Refresh token is required."}, status=status.HTTP_400_BAD_REQUEST)

            token = RefreshToken(refresh_token)
            token.blacklist()

            return Response({"message": "Successfully logged out."}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class UserView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AccountsView(APIView):
    def get(self, request):
        users = User.objects.all()
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AvailableUsersView(APIView):
    def get(self, request):
        user_id = request.query_params['user_id']
        event_id = request.query_params['event_id']
        user_ids = list(User.objects.values_list('id', flat=True))
        existing_matchup_users = Matchup.objects.filter((Q(user_a_id=user_id) | Q(user_b_id=user_id))
                                                        & (Q(event=event_id))).values_list('user_a_id', 'user_b_id')
        exclude_ids = list(set([uid for row in existing_matchup_users for uid in row]))
        available_ids = [x for x in user_ids if x not in exclude_ids]
        available_users = User.objects.filter(id__in=available_ids)
        serializer = UserSerializer(available_users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
