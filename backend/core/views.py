import uuid
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.conf import settings
from .db import (
    users_collection, properties_collection, leases_collection,
    rents_collection, complaints_collection, notifications_collection
)


# ==================== HELPERS ====================

def hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password, hashed):
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id, role):
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=settings.JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

def user_to_response(user):
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
        "phone": user.get("phone"),
        "created_at": user["created_at"]
    }

def create_notification(user_id, title, message, notification_type):
    notification = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "title": title,
        "message": message,
        "notification_type": notification_type,
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    notifications_collection.insert_one(notification)


# ==================== AUTH VIEWS ====================

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data
        
        # Check if email exists
        if users_collection.find_one({"email": data.get("email")}):
            return Response({"detail": "Email already registered"}, status=status.HTTP_400_BAD_REQUEST)
        
        user_id = str(uuid.uuid4())
        user_doc = {
            "id": user_id,
            "email": data.get("email"),
            "password": hash_password(data.get("password")),
            "name": data.get("name"),
            "role": data.get("role"),
            "phone": data.get("phone"),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        users_collection.insert_one(user_doc)
        
        token = create_token(user_id, data.get("role"))
        return Response({
            "access_token": token,
            "token_type": "bearer",
            "user": user_to_response(user_doc)
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data
        user = users_collection.find_one({"email": data.get("email")})
        
        if not user or not verify_password(data.get("password"), user["password"]):
            return Response({"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
        
        token = create_token(user["id"], user["role"])
        return Response({
            "access_token": token,
            "token_type": "bearer",
            "user": user_to_response(user)
        })


class MeView(APIView):
    def get(self, request):
        user = users_collection.find_one({"id": request.user.id}, {"_id": 0, "password": 0})
        return Response(user_to_response(user))


# ==================== USER VIEWS ====================

class UserListView(APIView):
    def get(self, request):
        if request.user.role != 'property_manager':
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
        
        role = request.query_params.get('role')
        query = {"role": role} if role else {}
        users = list(users_collection.find(query, {"_id": 0, "password": 0}).limit(500))
        return Response(users)

    def post(self, request):
        if request.user.role != 'property_manager':
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
        
        data = request.data
        if users_collection.find_one({"email": data.get("email")}):
            return Response({"email": ["Email already exists"]}, status=status.HTTP_400_BAD_REQUEST)
        
        user_id = str(uuid.uuid4())
        user_doc = {
            "id": user_id,
            "email": data.get("email"),
            "password": hash_password(data.get("password")),
            "name": data.get("name"),
            "role": data.get("role"),
            "phone": data.get("phone"),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        users_collection.insert_one(user_doc)
        return Response(user_to_response(user_doc), status=status.HTTP_201_CREATED)


class UserDetailView(APIView):
    def get(self, request, user_id):
        user = users_collection.find_one({"id": user_id}, {"_id": 0, "password": 0})
        if not user:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(user)

    def delete(self, request, user_id):
        if request.user.role != 'property_manager':
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
        
        result = users_collection.delete_one({"id": user_id})
        if result.deleted_count == 0:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response({"message": "User deleted"})


# ==================== PROPERTY VIEWS ====================

class PropertyListView(APIView):
    def get(self, request):
        user = request.user
        query = {}
        
        if user.role == 'landlord':
            query["landlord_id"] = user.id
        elif user.role == 'tenant':
            leases = list(leases_collection.find({"tenant_id": user.id}, {"property_id": 1, "_id": 0}).limit(100))
            property_ids = [l["property_id"] for l in leases]
            query["id"] = {"$in": property_ids}
        
        properties = list(properties_collection.find(query, {"_id": 0}).limit(500))
        return Response(properties)

    def post(self, request):
        if request.user.role != 'property_manager':
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
        
        data = request.data
        landlord_name = None
        if data.get("landlord_id"):
            landlord = users_collection.find_one({"id": data.get("landlord_id")}, {"_id": 0})
            if landlord:
                landlord_name = landlord.get("name")
        
        property_doc = {
            "id": str(uuid.uuid4()),
            "name": data.get("name"),
            "address": data.get("address"),
            "property_type": data.get("property_type"),
            "units": data.get("units", 1),
            "description": data.get("description"),
            "image_url": data.get("image_url"),
            "landlord_id": data.get("landlord_id"),
            "landlord_name": landlord_name,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        properties_collection.insert_one(property_doc)
        del property_doc["_id"]
        return Response(property_doc, status=status.HTTP_201_CREATED)


class PropertyDetailView(APIView):
    def get(self, request, property_id):
        prop = properties_collection.find_one({"id": property_id}, {"_id": 0})
        if not prop:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(prop)

    def put(self, request, property_id):
        if request.user.role != 'property_manager':
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
        
        data = request.data
        update_data = {
            "name": data.get("name"),
            "address": data.get("address"),
            "property_type": data.get("property_type"),
            "units": data.get("units"),
            "description": data.get("description"),
        }
        
        result = properties_collection.update_one({"id": property_id}, {"$set": update_data})
        if result.matched_count == 0:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        
        prop = properties_collection.find_one({"id": property_id}, {"_id": 0})
        return Response(prop)

    def delete(self, request, property_id):
        if request.user.role != 'property_manager':
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
        
        result = properties_collection.delete_one({"id": property_id})
        if result.deleted_count == 0:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response({"message": "Property deleted"})


# ==================== LEASE VIEWS ====================

class LeaseListView(APIView):
    def get(self, request):
        user = request.user
        query = {}
        
        if user.role == 'tenant':
            query["tenant_id"] = user.id
        elif user.role == 'landlord':
            props = list(properties_collection.find({"landlord_id": user.id}, {"id": 1, "_id": 0}).limit(100))
            property_ids = [p["id"] for p in props]
            query["property_id"] = {"$in": property_ids}
        
        leases = list(leases_collection.find(query, {"_id": 0}).limit(500))
        return Response(leases)

    def post(self, request):
        if request.user.role != 'property_manager':
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
        
        data = request.data
        prop = properties_collection.find_one({"id": data.get("property_id")}, {"_id": 0})
        tenant = users_collection.find_one({"id": data.get("tenant_id")}, {"_id": 0})
        
        lease_doc = {
            "id": str(uuid.uuid4()),
            "property_id": data.get("property_id"),
            "tenant_id": data.get("tenant_id"),
            "start_date": data.get("start_date"),
            "end_date": data.get("end_date"),
            "monthly_rent": float(data.get("monthly_rent")),
            "security_deposit": float(data.get("security_deposit")),
            "property_name": prop.get("name") if prop else None,
            "property_address": prop.get("address") if prop else None,
            "tenant_name": tenant.get("name") if tenant else None,
            "landlord_name": prop.get("landlord_name") if prop else None,
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        leases_collection.insert_one(lease_doc)
        del lease_doc["_id"]
        return Response(lease_doc, status=status.HTTP_201_CREATED)


class LeaseDetailView(APIView):
    def get(self, request, lease_id):
        lease = leases_collection.find_one({"id": lease_id}, {"_id": 0})
        if not lease:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(lease)

    def put(self, request, lease_id):
        if request.user.role != 'property_manager':
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
        
        data = request.data
        update_data = {}
        if data.get("start_date"):
            update_data["start_date"] = data.get("start_date")
        if data.get("end_date"):
            update_data["end_date"] = data.get("end_date")
        if data.get("monthly_rent"):
            update_data["monthly_rent"] = float(data.get("monthly_rent"))
        
        result = leases_collection.update_one({"id": lease_id}, {"$set": update_data})
        if result.matched_count == 0:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        
        lease = leases_collection.find_one({"id": lease_id}, {"_id": 0})
        return Response(lease)

    def delete(self, request, lease_id):
        if request.user.role != 'property_manager':
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
        
        result = leases_collection.delete_one({"id": lease_id})
        if result.deleted_count == 0:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response({"message": "Lease deleted"})


# ==================== RENT VIEWS ====================

class RentListView(APIView):
    def get(self, request):
        user = request.user
        query = {}
        
        if user.role == 'tenant':
            leases = list(leases_collection.find({"tenant_id": user.id}, {"id": 1, "_id": 0}))
            lease_ids = [l["id"] for l in leases]
            query["lease_id"] = {"$in": lease_ids}
        elif user.role == 'landlord':
            props = list(properties_collection.find({"landlord_id": user.id}, {"id": 1, "_id": 0}))
            property_ids = [p["id"] for p in props]
            leases = list(leases_collection.find({"property_id": {"$in": property_ids}}, {"id": 1, "_id": 0}))
            lease_ids = [l["id"] for l in leases]
            query["lease_id"] = {"$in": lease_ids}
        
        rents = list(rents_collection.find(query, {"_id": 0}))
        return Response(rents)

    def post(self, request):
        if request.user.role != 'property_manager':
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
        
        data = request.data
        lease = leases_collection.find_one({"id": data.get("lease_id")}, {"_id": 0})
        
        rent_doc = {
            "id": str(uuid.uuid4()),
            "lease_id": data.get("lease_id"),
            "amount": float(data.get("amount")),
            "due_date": data.get("due_date"),
            "period": data.get("period"),
            "tenant_name": lease.get("tenant_name") if lease else None,
            "property_name": lease.get("property_name") if lease else None,
            "status": "pending",
            "paid_date": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        rents_collection.insert_one(rent_doc)
        
        # Notify tenant
        if lease:
            create_notification(
                lease["tenant_id"],
                "Rent Due",
                f"Your rent of ${data.get('amount')} for {lease.get('property_name')} is due on {data.get('due_date')}",
                "rent_due"
            )
        
        del rent_doc["_id"]
        return Response(rent_doc, status=status.HTTP_201_CREATED)


class RentDetailView(APIView):
    def put(self, request, rent_id):
        if request.user.role != 'property_manager':
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
        
        data = request.data
        update_data = {"status": data.get("status")}
        if data.get("status") == "paid":
            update_data["paid_date"] = data.get("paid_date") or datetime.now(timezone.utc).strftime("%Y-%m-%d")
        
        result = rents_collection.update_one({"id": rent_id}, {"$set": update_data})
        if result.matched_count == 0:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        
        rent = rents_collection.find_one({"id": rent_id}, {"_id": 0})
        return Response(rent)


# ==================== COMPLAINT VIEWS ====================

class ComplaintListView(APIView):
    def get(self, request):
        user = request.user
        query = {}
        
        if user.role == 'tenant':
            query = {"tenant_id": user.id, "complaint_type": "tenant"}
        elif user.role == 'landlord':
            props = list(properties_collection.find({"landlord_id": user.id}, {"_id": 0}))
            property_ids = [p["id"] for p in props]
            query = {"property_id": {"$in": property_ids}, "complaint_type": "manager"}
        
        complaints = list(complaints_collection.find(query, {"_id": 0}))
        return Response(complaints)

    def post(self, request):
        user = request.user
        if user.role not in ['tenant', 'property_manager']:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
        
        data = request.data
        prop = properties_collection.find_one({"id": data.get("property_id")}, {"_id": 0})
        
        complaint_doc = {
            "id": str(uuid.uuid4()),
            "property_id": data.get("property_id"),
            "title": data.get("title"),
            "description": data.get("description"),
            "priority": data.get("priority", "medium"),
            "property_name": prop.get("name") if prop else None,
            "status": "open",
            "response": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "resolved_at": None
        }
        
        if user.role == 'tenant':
            complaint_doc["tenant_id"] = user.id
            complaint_doc["tenant_name"] = user.name
            complaint_doc["complaint_type"] = "tenant"
            complaint_doc["created_by_name"] = user.name
            # Notify managers using bulk insert
            managers = list(users_collection.find({"role": "property_manager"}, {"id": 1, "_id": 0}))
            if managers:
                notifications = [{
                    "id": str(uuid.uuid4()),
                    "user_id": m["id"],
                    "title": "New Tenant Complaint",
                    "message": f"New complaint from {user.name}: {data.get('title')}",
                    "notification_type": "complaint",
                    "is_read": False,
                    "created_at": datetime.now(timezone.utc).isoformat()
                } for m in managers]
                notifications_collection.insert_many(notifications)
        else:
            complaint_doc["tenant_id"] = None
            complaint_doc["tenant_name"] = None
            complaint_doc["complaint_type"] = "manager"
            complaint_doc["created_by_id"] = user.id
            complaint_doc["created_by_name"] = user.name
            # Notify landlord
            if prop and prop.get("landlord_id"):
                create_notification(prop["landlord_id"], "New Complaint from Property Manager", f"Property Manager raised: {data.get('title')}", "complaint")
        
        complaints_collection.insert_one(complaint_doc)
        del complaint_doc["_id"]
        return Response(complaint_doc, status=status.HTTP_201_CREATED)


class ComplaintDetailView(APIView):
    def put(self, request, complaint_id):
        user = request.user
        complaint = complaints_collection.find_one({"id": complaint_id}, {"_id": 0})
        
        if not complaint:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        
        # Check permissions
        if complaint.get("complaint_type") == "tenant" and user.role != "property_manager":
            return Response({"detail": "Only property managers can respond to tenant complaints"}, status=status.HTTP_403_FORBIDDEN)
        
        if complaint.get("complaint_type") == "manager" and user.role != "landlord":
            return Response({"detail": "Only landlords can respond to manager complaints"}, status=status.HTTP_403_FORBIDDEN)
        
        data = request.data
        update_data = {}
        if data.get("status"):
            update_data["status"] = data.get("status")
            if data.get("status") == "resolved":
                update_data["resolved_at"] = datetime.now(timezone.utc).isoformat()
        if data.get("response"):
            update_data["response"] = data.get("response")
        
        complaints_collection.update_one({"id": complaint_id}, {"$set": update_data})
        
        # Notify
        if complaint.get("complaint_type") == "tenant" and complaint.get("tenant_id"):
            create_notification(complaint["tenant_id"], "Complaint Updated", f"Your complaint '{complaint['title']}' has been updated", "complaint_update")
        elif complaint.get("complaint_type") == "manager" and complaint.get("created_by_id"):
            create_notification(complaint["created_by_id"], "Complaint Response from Landlord", f"Landlord responded to: {complaint['title']}", "complaint_update")
        
        updated = complaints_collection.find_one({"id": complaint_id}, {"_id": 0})
        return Response(updated)


# ==================== NOTIFICATION VIEWS ====================

class NotificationListView(APIView):
    def get(self, request):
        notifications = list(notifications_collection.find(
            {"user_id": request.user.id}, 
            {"_id": 0}
        ).sort("created_at", -1).limit(100))
        return Response(notifications)


class NotificationReadView(APIView):
    def put(self, request, notification_id):
        result = notifications_collection.update_one(
            {"id": notification_id, "user_id": request.user.id},
            {"$set": {"is_read": True}}
        )
        if result.matched_count == 0:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response({"message": "Notification marked as read"})


class NotificationReadAllView(APIView):
    def put(self, request):
        notifications_collection.update_many(
            {"user_id": request.user.id},
            {"$set": {"is_read": True}}
        )
        return Response({"message": "All notifications marked as read"})


# ==================== DASHBOARD VIEWS ====================

class DashboardStatsView(APIView):
    def get(self, request):
        user = request.user
        stats = {
            "total_properties": 0,
            "total_tenants": 0,
            "total_landlords": 0,
            "pending_complaints": 0,
            "pending_rent": 0,
            "total_rent_collected": 0
        }
        
        if user.role == 'property_manager':
            stats["total_properties"] = properties_collection.count_documents({})
            stats["total_tenants"] = users_collection.count_documents({"role": "tenant"})
            stats["total_landlords"] = users_collection.count_documents({"role": "landlord"})
            stats["pending_complaints"] = complaints_collection.count_documents({"status": "open"})
            stats["pending_rent"] = rents_collection.count_documents({"status": "pending"})
            paid_rents = list(rents_collection.find({"status": "paid"}, {"amount": 1, "_id": 0}))
            stats["total_rent_collected"] = sum(r.get("amount", 0) for r in paid_rents)
        
        elif user.role == 'landlord':
            props = list(properties_collection.find({"landlord_id": user.id}, {"id": 1, "_id": 0}))
            property_ids = [p["id"] for p in props]
            stats["total_properties"] = len(props)
            
            leases = list(leases_collection.find({"property_id": {"$in": property_ids}}, {"id": 1, "tenant_id": 1, "_id": 0}))
            lease_ids = [l["id"] for l in leases]
            stats["total_tenants"] = len(set(l["tenant_id"] for l in leases))
            
            stats["pending_complaints"] = complaints_collection.count_documents({
                "property_id": {"$in": property_ids},
                "status": "open",
                "complaint_type": "manager"
            })
            stats["pending_rent"] = rents_collection.count_documents({
                "lease_id": {"$in": lease_ids},
                "status": "pending"
            })
            paid_rents = list(rents_collection.find({"lease_id": {"$in": lease_ids}, "status": "paid"}, {"amount": 1, "_id": 0}))
            stats["total_rent_collected"] = sum(r.get("amount", 0) for r in paid_rents)
        
        elif user.role == 'tenant':
            leases = list(leases_collection.find({"tenant_id": user.id}, {"id": 1, "_id": 0}))
            lease_ids = [l["id"] for l in leases]
            stats["total_properties"] = len(leases)
            stats["pending_complaints"] = complaints_collection.count_documents({"tenant_id": user.id, "status": "open"})
            stats["pending_rent"] = rents_collection.count_documents({"lease_id": {"$in": lease_ids}, "status": "pending"})
        
        return Response(stats)
