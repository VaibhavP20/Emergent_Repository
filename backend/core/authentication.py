import jwt
from datetime import datetime, timezone
from rest_framework import authentication, exceptions
from django.conf import settings
from .db import users_collection


class JWTAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return None

        try:
            prefix, token = auth_header.split(' ')
            if prefix.lower() != 'bearer':
                return None
        except ValueError:
            return None

        try:
            payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
            user_id = payload.get('user_id')
            
            user = users_collection.find_one({"id": user_id}, {"_id": 0, "password": 0})
            if not user:
                raise exceptions.AuthenticationFailed('User not found')
            
            # Create a simple user object
            class User:
                def __init__(self, data):
                    self.id = data.get('id')
                    self.email = data.get('email')
                    self.name = data.get('name')
                    self.role = data.get('role')
                    self.phone = data.get('phone')
                    self.is_authenticated = True
            
            return (User(user), token)
            
        except jwt.ExpiredSignatureError:
            raise exceptions.AuthenticationFailed('Token expired')
        except jwt.InvalidTokenError:
            raise exceptions.AuthenticationFailed('Invalid token')

    def authenticate_header(self, request):
        return 'Bearer'
