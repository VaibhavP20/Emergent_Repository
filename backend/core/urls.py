from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterView, LoginView, MeView, UserViewSet, PropertyViewSet,
    LeaseViewSet, RentViewSet, ComplaintViewSet, NotificationViewSet,
    DashboardStatsView
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='users')
router.register(r'properties', PropertyViewSet, basename='properties')
router.register(r'leases', LeaseViewSet, basename='leases')
router.register(r'rents', RentViewSet, basename='rents')
router.register(r'complaints', ComplaintViewSet, basename='complaints')
router.register(r'notifications', NotificationViewSet, basename='notifications')

urlpatterns = [
    path('auth/register', RegisterView.as_view(), name='register'),
    path('auth/login', LoginView.as_view(), name='login'),
    path('auth/me', MeView.as_view(), name='me'),
    path('dashboard/stats', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('', include(router.urls)),
]
