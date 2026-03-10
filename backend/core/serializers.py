from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, Property, Lease, Rent, Complaint, Notification


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'name', 'role', 'phone', 'created_at']
        read_only_fields = ['id', 'created_at']


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ['email', 'password', 'name', 'role', 'phone']

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, data):
        user = authenticate(username=data['email'], password=data['password'])
        if not user:
            raise serializers.ValidationError('Invalid credentials')
        data['user'] = user
        return data


class PropertySerializer(serializers.ModelSerializer):
    landlord_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    landlord_name = serializers.CharField(source='landlord.name', read_only=True, allow_null=True)

    class Meta:
        model = Property
        fields = ['id', 'name', 'address', 'property_type', 'units', 'description', 
                  'image_url', 'landlord_id', 'landlord_name', 'created_at']
        read_only_fields = ['id', 'created_at']

    def create(self, validated_data):
        landlord_id = validated_data.pop('landlord_id', None)
        if landlord_id:
            try:
                validated_data['landlord'] = User.objects.get(id=landlord_id)
            except User.DoesNotExist:
                pass
        return super().create(validated_data)

    def update(self, instance, validated_data):
        landlord_id = validated_data.pop('landlord_id', None)
        if landlord_id:
            try:
                validated_data['landlord'] = User.objects.get(id=landlord_id)
            except User.DoesNotExist:
                pass
        return super().update(instance, validated_data)


class LeaseSerializer(serializers.ModelSerializer):
    property_id = serializers.UUIDField(write_only=True)
    tenant_id = serializers.UUIDField(write_only=True)
    property_name = serializers.CharField(source='property.name', read_only=True)
    property_address = serializers.CharField(source='property.address', read_only=True)
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    landlord_name = serializers.CharField(source='property.landlord.name', read_only=True, allow_null=True)

    class Meta:
        model = Lease
        fields = ['id', 'property_id', 'tenant_id', 'start_date', 'end_date', 
                  'monthly_rent', 'security_deposit', 'status', 'property_name',
                  'property_address', 'tenant_name', 'landlord_name', 'created_at']
        read_only_fields = ['id', 'status', 'created_at']

    def create(self, validated_data):
        property_id = validated_data.pop('property_id')
        tenant_id = validated_data.pop('tenant_id')
        validated_data['property'] = Property.objects.get(id=property_id)
        validated_data['tenant'] = User.objects.get(id=tenant_id)
        return super().create(validated_data)


class LeaseUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lease
        fields = ['start_date', 'end_date', 'monthly_rent']


class RentSerializer(serializers.ModelSerializer):
    lease_id = serializers.UUIDField(write_only=True)
    tenant_name = serializers.SerializerMethodField()
    property_name = serializers.SerializerMethodField()

    class Meta:
        model = Rent
        fields = ['id', 'lease_id', 'amount', 'due_date', 'paid_date', 'period', 
                  'status', 'tenant_name', 'property_name', 'created_at']
        read_only_fields = ['id', 'status', 'paid_date', 'created_at']

    def get_tenant_name(self, obj):
        return obj.lease.tenant.name if obj.lease else None

    def get_property_name(self, obj):
        return obj.lease.property.name if obj.lease else None

    def create(self, validated_data):
        lease_id = validated_data.pop('lease_id')
        validated_data['lease'] = Lease.objects.get(id=lease_id)
        return super().create(validated_data)


class RentUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rent
        fields = ['status', 'paid_date']


class ComplaintSerializer(serializers.ModelSerializer):
    property_id = serializers.UUIDField(write_only=True)
    tenant_id = serializers.UUIDField(read_only=True, source='tenant.id', allow_null=True)
    tenant_name = serializers.SerializerMethodField()
    property_name = serializers.CharField(source='property.name', read_only=True)
    created_by_name = serializers.SerializerMethodField()
    complaint_type = serializers.CharField(default='tenant')

    class Meta:
        model = Complaint
        fields = ['id', 'property_id', 'tenant_id', 'title', 'description', 'priority',
                  'status', 'response', 'tenant_name', 'property_name', 'created_at', 
                  'resolved_at', 'complaint_type', 'created_by_name']
        read_only_fields = ['id', 'status', 'response', 'created_at', 'resolved_at']

    def get_tenant_name(self, obj):
        if obj.tenant:
            return obj.tenant.name
        return None

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.name
        return obj.tenant.name if obj.tenant else None

    def create(self, validated_data):
        property_id = validated_data.pop('property_id')
        validated_data['property'] = Property.objects.get(id=property_id)
        user = self.context['request'].user
        
        if user.role == 'tenant':
            validated_data['tenant'] = user
            validated_data['complaint_type'] = 'tenant'
        elif user.role == 'property_manager':
            validated_data['created_by'] = user
            validated_data['complaint_type'] = 'manager'
        
        return super().create(validated_data)


class ComplaintUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Complaint
        fields = ['status', 'response']


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'user_id', 'title', 'message', 'notification_type', 'is_read', 'created_at']
        read_only_fields = ['id', 'created_at']


class DashboardStatsSerializer(serializers.Serializer):
    total_properties = serializers.IntegerField()
    total_tenants = serializers.IntegerField()
    total_landlords = serializers.IntegerField()
    pending_complaints = serializers.IntegerField()
    pending_rent = serializers.IntegerField()
    total_rent_collected = serializers.DecimalField(max_digits=12, decimal_places=2)
