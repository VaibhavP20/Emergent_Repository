from django.contrib import admin
from .models import User, Property, Lease, Rent, Complaint, Notification

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['email', 'name', 'role', 'created_at']
    list_filter = ['role']
    search_fields = ['email', 'name']

@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = ['name', 'address', 'property_type', 'landlord', 'created_at']
    list_filter = ['property_type']
    search_fields = ['name', 'address']

@admin.register(Lease)
class LeaseAdmin(admin.ModelAdmin):
    list_display = ['property', 'tenant', 'start_date', 'end_date', 'monthly_rent', 'status']
    list_filter = ['status']

@admin.register(Rent)
class RentAdmin(admin.ModelAdmin):
    list_display = ['lease', 'amount', 'due_date', 'status', 'paid_date']
    list_filter = ['status']

@admin.register(Complaint)
class ComplaintAdmin(admin.ModelAdmin):
    list_display = ['title', 'property', 'tenant', 'priority', 'status', 'created_at']
    list_filter = ['status', 'priority']

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'notification_type', 'is_read', 'created_at']
    list_filter = ['notification_type', 'is_read']
