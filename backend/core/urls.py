from django.urls import path
from .views import (
    RegisterView, LoginView, MeView, ForgotPasswordView, ResetPasswordView,
    UserListView, UserDetailView,
    PropertyListView, PropertyDetailView,
    LeaseListView, LeaseDetailView,
    RentListView, RentDetailView,
    ComplaintListView, ComplaintDetailView,
    NotificationListView, NotificationReadView, NotificationReadAllView,
    DashboardStatsView
)

urlpatterns = [
    # Auth
    path('auth/register', RegisterView.as_view(), name='register'),
    path('auth/login', LoginView.as_view(), name='login'),
    path('auth/me', MeView.as_view(), name='me'),
    path('auth/forgot-password', ForgotPasswordView.as_view(), name='forgot-password'),
    path('auth/reset-password', ResetPasswordView.as_view(), name='reset-password'),
    
    # Users
    path('users/', UserListView.as_view(), name='users-list'),
    path('users/<str:user_id>/', UserDetailView.as_view(), name='users-detail'),
    
    # Properties
    path('properties/', PropertyListView.as_view(), name='properties-list'),
    path('properties/<str:property_id>/', PropertyDetailView.as_view(), name='properties-detail'),
    
    # Leases
    path('leases/', LeaseListView.as_view(), name='leases-list'),
    path('leases/<str:lease_id>/', LeaseDetailView.as_view(), name='leases-detail'),
    
    # Rents
    path('rents/', RentListView.as_view(), name='rents-list'),
    path('rents/<str:rent_id>/', RentDetailView.as_view(), name='rents-detail'),
    
    # Complaints
    path('complaints/', ComplaintListView.as_view(), name='complaints-list'),
    path('complaints/<str:complaint_id>/', ComplaintDetailView.as_view(), name='complaints-detail'),
    
    # Notifications
    path('notifications/', NotificationListView.as_view(), name='notifications-list'),
    path('notifications/<str:notification_id>/read/', NotificationReadView.as_view(), name='notifications-read'),
    path('notifications/read-all/', NotificationReadAllView.as_view(), name='notifications-read-all'),
    
    # Dashboard
    path('dashboard/stats', DashboardStatsView.as_view(), name='dashboard-stats'),
]
