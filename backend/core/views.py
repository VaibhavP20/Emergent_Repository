from rest_framework import viewsets, status, permissions
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.db.models import Sum
from django.utils import timezone
from .models import User, Property, Lease, Rent, Complaint, Notification
from .serializers import (
    UserSerializer, UserCreateSerializer, LoginSerializer,
    PropertySerializer, LeaseSerializer, LeaseUpdateSerializer,
    RentSerializer, RentUpdateSerializer, ComplaintSerializer,
    ComplaintUpdateSerializer, NotificationSerializer, DashboardStatsSerializer
)


class IsPropertyManager(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'property_manager'


class IsPropertyManagerOrLandlord(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role in ['property_manager', 'landlord']


class IsTenant(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'tenant'


# Auth Views
class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = UserCreateSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'access_token': str(refresh.access_token),
                'token_type': 'bearer',
                'user': UserSerializer(user).data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            refresh = RefreshToken.for_user(user)
            return Response({
                'access_token': str(refresh.access_token),
                'token_type': 'bearer',
                'user': UserSerializer(user).data
            })
        return Response({'detail': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)


class MeView(APIView):
    def get(self, request):
        return Response(UserSerializer(request.user).data)


# User Views
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsPropertyManager]

    def get_queryset(self):
        queryset = User.objects.all()
        role = self.request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role)
        return queryset

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Property Views
class PropertyViewSet(viewsets.ModelViewSet):
    queryset = Property.objects.all()
    serializer_class = PropertySerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsPropertyManager()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'landlord':
            return Property.objects.filter(landlord=user)
        elif user.role == 'tenant':
            lease_property_ids = Lease.objects.filter(tenant=user).values_list('property_id', flat=True)
            return Property.objects.filter(id__in=lease_property_ids)
        return Property.objects.all()


# Lease Views
class LeaseViewSet(viewsets.ModelViewSet):
    queryset = Lease.objects.all()
    serializer_class = LeaseSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsPropertyManager()]
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        if self.action in ['update', 'partial_update']:
            return LeaseUpdateSerializer
        return LeaseSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'tenant':
            return Lease.objects.filter(tenant=user)
        elif user.role == 'landlord':
            return Lease.objects.filter(property__landlord=user)
        return Lease.objects.all()


# Rent Views
class RentViewSet(viewsets.ModelViewSet):
    queryset = Rent.objects.all()
    serializer_class = RentSerializer
    http_method_names = ['get', 'post', 'put', 'patch']

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.IsAuthenticated(), IsPropertyManager()]
        if self.action in ['update', 'partial_update']:
            return [permissions.IsAuthenticated(), IsPropertyManagerOrLandlord()]
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        if self.action in ['update', 'partial_update']:
            return RentUpdateSerializer
        return RentSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'tenant':
            return Rent.objects.filter(lease__tenant=user)
        elif user.role == 'landlord':
            return Rent.objects.filter(lease__property__landlord=user)
        return Rent.objects.all()

    def perform_create(self, serializer):
        rent = serializer.save()
        # Create notification for tenant
        Notification.objects.create(
            user=rent.lease.tenant,
            title='Rent Due',
            message=f'Your rent of ${rent.amount} for {rent.lease.property.name} is due on {rent.due_date}',
            notification_type='rent_due'
        )

    def perform_update(self, serializer):
        instance = serializer.save()
        if instance.status == 'paid' and not instance.paid_date:
            instance.paid_date = timezone.now().date()
            instance.save()


# Complaint Views
class ComplaintViewSet(viewsets.ModelViewSet):
    queryset = Complaint.objects.all()
    serializer_class = ComplaintSerializer
    http_method_names = ['get', 'post', 'put', 'patch']

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.IsAuthenticated(), IsTenant()]
        if self.action in ['update', 'partial_update']:
            return [permissions.IsAuthenticated(), IsPropertyManager()]
        if self.action == 'list' or self.action == 'retrieve':
            # Only property managers and tenants can view complaints
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        if self.action in ['update', 'partial_update']:
            return ComplaintUpdateSerializer
        return ComplaintSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'tenant':
            return Complaint.objects.filter(tenant=user)
        elif user.role == 'property_manager':
            return Complaint.objects.all()
        # Landlords cannot see complaints
        return Complaint.objects.none()

    def perform_create(self, serializer):
        complaint = serializer.save()
        # Notify property managers
        managers = User.objects.filter(role='property_manager')
        for manager in managers:
            Notification.objects.create(
                user=manager,
                title='New Complaint',
                message=f'New complaint from {complaint.tenant.name}: {complaint.title}',
                notification_type='complaint'
            )

    def perform_update(self, serializer):
        instance = serializer.save()
        if instance.status == 'resolved' and not instance.resolved_at:
            instance.resolved_at = timezone.now()
            instance.save()
        # Notify tenant
        Notification.objects.create(
            user=instance.tenant,
            title='Complaint Updated',
            message=f"Your complaint '{instance.title}' has been updated",
            notification_type='complaint_update'
        )


# Notification Views
class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    http_method_names = ['get', 'put', 'patch']

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    @action(detail=True, methods=['put'], url_path='read')
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'message': 'Notification marked as read'})

    @action(detail=False, methods=['put'], url_path='read-all')
    def mark_all_read(self, request):
        Notification.objects.filter(user=request.user).update(is_read=True)
        return Response({'message': 'All notifications marked as read'})


# Dashboard Stats
class DashboardStatsView(APIView):
    def get(self, request):
        user = request.user
        stats = {
            'total_properties': 0,
            'total_tenants': 0,
            'total_landlords': 0,
            'pending_complaints': 0,
            'pending_rent': 0,
            'total_rent_collected': 0
        }

        if user.role == 'property_manager':
            stats['total_properties'] = Property.objects.count()
            stats['total_tenants'] = User.objects.filter(role='tenant').count()
            stats['total_landlords'] = User.objects.filter(role='landlord').count()
            stats['pending_complaints'] = Complaint.objects.filter(status='open').count()
            stats['pending_rent'] = Rent.objects.filter(status='pending').count()
            paid_rents = Rent.objects.filter(status='paid').aggregate(total=Sum('amount'))
            stats['total_rent_collected'] = paid_rents['total'] or 0

        elif user.role == 'landlord':
            properties = Property.objects.filter(landlord=user)
            stats['total_properties'] = properties.count()
            leases = Lease.objects.filter(property__in=properties)
            stats['total_tenants'] = leases.values('tenant').distinct().count()
            stats['pending_complaints'] = Complaint.objects.filter(property__in=properties, status='open').count()
            stats['pending_rent'] = Rent.objects.filter(lease__in=leases, status='pending').count()
            paid_rents = Rent.objects.filter(lease__in=leases, status='paid').aggregate(total=Sum('amount'))
            stats['total_rent_collected'] = paid_rents['total'] or 0

        elif user.role == 'tenant':
            leases = Lease.objects.filter(tenant=user)
            stats['total_properties'] = leases.count()
            stats['pending_complaints'] = Complaint.objects.filter(tenant=user, status='open').count()
            stats['pending_rent'] = Rent.objects.filter(lease__in=leases, status='pending').count()

        return Response(stats)
