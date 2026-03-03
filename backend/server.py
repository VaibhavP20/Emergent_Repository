from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'property-management-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

security = HTTPBearer()

# Create the main app
app = FastAPI(title="Property Management Portal")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ==================== MODELS ====================

class UserRole:
    TENANT = "tenant"
    LANDLORD = "landlord"
    PROPERTY_MANAGER = "property_manager"

class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: str
    phone: Optional[str] = None

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    phone: Optional[str] = None
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class PropertyBase(BaseModel):
    name: str
    address: str
    property_type: str
    units: int = 1
    description: Optional[str] = None
    image_url: Optional[str] = None

class PropertyCreate(PropertyBase):
    landlord_id: Optional[str] = None

class PropertyResponse(PropertyBase):
    id: str
    landlord_id: Optional[str] = None
    landlord_name: Optional[str] = None
    created_at: str

class LeaseBase(BaseModel):
    property_id: str
    tenant_id: str
    start_date: str
    end_date: str
    monthly_rent: float
    security_deposit: float

class LeaseCreate(LeaseBase):
    pass

class LeaseUpdate(BaseModel):
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    monthly_rent: Optional[float] = None

class LeaseResponse(LeaseBase):
    id: str
    property_name: Optional[str] = None
    property_address: Optional[str] = None
    tenant_name: Optional[str] = None
    landlord_name: Optional[str] = None
    status: str
    created_at: str

class RentBase(BaseModel):
    lease_id: str
    amount: float
    due_date: str
    period: str

class RentCreate(RentBase):
    pass

class RentUpdate(BaseModel):
    status: str
    paid_date: Optional[str] = None

class RentResponse(RentBase):
    id: str
    status: str
    paid_date: Optional[str] = None
    tenant_name: Optional[str] = None
    property_name: Optional[str] = None
    created_at: str

class ComplaintBase(BaseModel):
    property_id: str
    title: str
    description: str
    priority: str = "medium"

class ComplaintCreate(ComplaintBase):
    pass

class ComplaintUpdate(BaseModel):
    status: Optional[str] = None
    response: Optional[str] = None

class ComplaintResponse(ComplaintBase):
    id: str
    tenant_id: str
    tenant_name: Optional[str] = None
    property_name: Optional[str] = None
    status: str
    response: Optional[str] = None
    created_at: str
    resolved_at: Optional[str] = None

class NotificationBase(BaseModel):
    title: str
    message: str
    notification_type: str

class NotificationResponse(NotificationBase):
    id: str
    user_id: str
    is_read: bool
    created_at: str

class DashboardStats(BaseModel):
    total_properties: int = 0
    total_tenants: int = 0
    total_landlords: int = 0
    pending_complaints: int = 0
    pending_rent: int = 0
    total_rent_collected: float = 0

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def require_role(allowed_roles: List[str]):
    async def role_checker(user: dict = Depends(get_current_user)):
        if user["role"] not in allowed_roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return role_checker

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "password": hash_password(user_data.password),
        "name": user_data.name,
        "role": user_data.role,
        "phone": user_data.phone,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    token = create_token(user_id, user_data.role)
    user_response = UserResponse(
        id=user_id,
        email=user_data.email,
        name=user_data.name,
        role=user_data.role,
        phone=user_data.phone,
        created_at=user_doc["created_at"]
    )
    return TokenResponse(access_token=token, user=user_response)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"], user["role"])
    user_response = UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        role=user["role"],
        phone=user.get("phone"),
        created_at=user["created_at"]
    )
    return TokenResponse(access_token=token, user=user_response)

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    return UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        role=user["role"],
        phone=user.get("phone"),
        created_at=user["created_at"]
    )

# ==================== USER ROUTES ====================

@api_router.get("/users", response_model=List[UserResponse])
async def get_users(
    role: Optional[str] = None,
    user: dict = Depends(require_role([UserRole.PROPERTY_MANAGER]))
):
    query = {}
    if role:
        query["role"] = role
    users = await db.users.find(query, {"_id": 0, "password": 0}).to_list(1000)
    return [UserResponse(**u) for u in users]

@api_router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, user: dict = Depends(get_current_user)):
    found = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not found:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse(**found)

@api_router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    user: dict = Depends(require_role([UserRole.PROPERTY_MANAGER]))
):
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted"}

# ==================== PROPERTY ROUTES ====================

@api_router.post("/properties", response_model=PropertyResponse)
async def create_property(
    property_data: PropertyCreate,
    user: dict = Depends(require_role([UserRole.PROPERTY_MANAGER]))
):
    property_id = str(uuid.uuid4())
    landlord_name = None
    if property_data.landlord_id:
        landlord = await db.users.find_one({"id": property_data.landlord_id}, {"_id": 0})
        if landlord:
            landlord_name = landlord["name"]
    
    property_doc = {
        "id": property_id,
        **property_data.model_dump(),
        "landlord_name": landlord_name,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.properties.insert_one(property_doc)
    return PropertyResponse(**{k: v for k, v in property_doc.items() if k != "_id"})

@api_router.get("/properties", response_model=List[PropertyResponse])
async def get_properties(user: dict = Depends(get_current_user)):
    query = {}
    if user["role"] == UserRole.LANDLORD:
        query["landlord_id"] = user["id"]
    elif user["role"] == UserRole.TENANT:
        leases = await db.leases.find({"tenant_id": user["id"]}, {"_id": 0}).to_list(100)
        property_ids = [l["property_id"] for l in leases]
        query["id"] = {"$in": property_ids}
    
    properties = await db.properties.find(query, {"_id": 0}).to_list(1000)
    return [PropertyResponse(**p) for p in properties]

@api_router.get("/properties/{property_id}", response_model=PropertyResponse)
async def get_property(property_id: str, user: dict = Depends(get_current_user)):
    prop = await db.properties.find_one({"id": property_id}, {"_id": 0})
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    return PropertyResponse(**prop)

@api_router.put("/properties/{property_id}", response_model=PropertyResponse)
async def update_property(
    property_id: str,
    property_data: PropertyBase,
    user: dict = Depends(require_role([UserRole.PROPERTY_MANAGER]))
):
    result = await db.properties.update_one(
        {"id": property_id},
        {"$set": property_data.model_dump()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Property not found")
    prop = await db.properties.find_one({"id": property_id}, {"_id": 0})
    return PropertyResponse(**prop)

@api_router.delete("/properties/{property_id}")
async def delete_property(
    property_id: str,
    user: dict = Depends(require_role([UserRole.PROPERTY_MANAGER]))
):
    result = await db.properties.delete_one({"id": property_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Property not found")
    return {"message": "Property deleted"}

# ==================== LEASE ROUTES ====================

@api_router.post("/leases", response_model=LeaseResponse)
async def create_lease(
    lease_data: LeaseCreate,
    user: dict = Depends(require_role([UserRole.PROPERTY_MANAGER]))
):
    lease_id = str(uuid.uuid4())
    
    prop = await db.properties.find_one({"id": lease_data.property_id}, {"_id": 0})
    tenant = await db.users.find_one({"id": lease_data.tenant_id}, {"_id": 0})
    
    lease_doc = {
        "id": lease_id,
        **lease_data.model_dump(),
        "property_name": prop["name"] if prop else None,
        "property_address": prop["address"] if prop else None,
        "tenant_name": tenant["name"] if tenant else None,
        "landlord_name": prop.get("landlord_name") if prop else None,
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.leases.insert_one(lease_doc)
    return LeaseResponse(**{k: v for k, v in lease_doc.items() if k != "_id"})

@api_router.get("/leases", response_model=List[LeaseResponse])
async def get_leases(user: dict = Depends(get_current_user)):
    query = {}
    if user["role"] == UserRole.TENANT:
        query["tenant_id"] = user["id"]
    elif user["role"] == UserRole.LANDLORD:
        props = await db.properties.find({"landlord_id": user["id"]}, {"_id": 0}).to_list(100)
        property_ids = [p["id"] for p in props]
        query["property_id"] = {"$in": property_ids}
    
    leases = await db.leases.find(query, {"_id": 0}).to_list(1000)
    return [LeaseResponse(**l) for l in leases]

@api_router.get("/leases/{lease_id}", response_model=LeaseResponse)
async def get_lease(lease_id: str, user: dict = Depends(get_current_user)):
    lease = await db.leases.find_one({"id": lease_id}, {"_id": 0})
    if not lease:
        raise HTTPException(status_code=404, detail="Lease not found")
    return LeaseResponse(**lease)

@api_router.put("/leases/{lease_id}", response_model=LeaseResponse)
async def update_lease(
    lease_id: str,
    lease_data: LeaseUpdate,
    user: dict = Depends(require_role([UserRole.PROPERTY_MANAGER]))
):
    update_data = {k: v for k, v in lease_data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    result = await db.leases.update_one({"id": lease_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Lease not found")
    
    lease = await db.leases.find_one({"id": lease_id}, {"_id": 0})
    return LeaseResponse(**lease)

@api_router.delete("/leases/{lease_id}")
async def delete_lease(
    lease_id: str,
    user: dict = Depends(require_role([UserRole.PROPERTY_MANAGER]))
):
    result = await db.leases.delete_one({"id": lease_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Lease not found")
    return {"message": "Lease deleted"}

# ==================== RENT ROUTES ====================

@api_router.post("/rents", response_model=RentResponse)
async def create_rent(
    rent_data: RentCreate,
    user: dict = Depends(require_role([UserRole.PROPERTY_MANAGER]))
):
    rent_id = str(uuid.uuid4())
    
    lease = await db.leases.find_one({"id": rent_data.lease_id}, {"_id": 0})
    
    rent_doc = {
        "id": rent_id,
        **rent_data.model_dump(),
        "tenant_name": lease.get("tenant_name") if lease else None,
        "property_name": lease.get("property_name") if lease else None,
        "status": "pending",
        "paid_date": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.rents.insert_one(rent_doc)
    
    # Create notification for tenant
    if lease:
        await create_notification(
            lease["tenant_id"],
            "Rent Due",
            f"Your rent of ${rent_data.amount} for {lease.get('property_name')} is due on {rent_data.due_date}",
            "rent_due"
        )
    
    return RentResponse(**{k: v for k, v in rent_doc.items() if k != "_id"})

@api_router.get("/rents", response_model=List[RentResponse])
async def get_rents(user: dict = Depends(get_current_user)):
    query = {}
    if user["role"] == UserRole.TENANT:
        leases = await db.leases.find({"tenant_id": user["id"]}, {"_id": 0}).to_list(100)
        lease_ids = [l["id"] for l in leases]
        query["lease_id"] = {"$in": lease_ids}
    elif user["role"] == UserRole.LANDLORD:
        props = await db.properties.find({"landlord_id": user["id"]}, {"_id": 0}).to_list(100)
        property_ids = [p["id"] for p in props]
        leases = await db.leases.find({"property_id": {"$in": property_ids}}, {"_id": 0}).to_list(100)
        lease_ids = [l["id"] for l in leases]
        query["lease_id"] = {"$in": lease_ids}
    
    rents = await db.rents.find(query, {"_id": 0}).to_list(1000)
    return [RentResponse(**r) for r in rents]

@api_router.put("/rents/{rent_id}", response_model=RentResponse)
async def update_rent(
    rent_id: str,
    rent_data: RentUpdate,
    user: dict = Depends(require_role([UserRole.PROPERTY_MANAGER, UserRole.LANDLORD]))
):
    update_data = {"status": rent_data.status}
    if rent_data.status == "paid":
        update_data["paid_date"] = rent_data.paid_date or datetime.now(timezone.utc).isoformat()
    
    result = await db.rents.update_one({"id": rent_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Rent not found")
    
    rent = await db.rents.find_one({"id": rent_id}, {"_id": 0})
    return RentResponse(**rent)

# ==================== COMPLAINT ROUTES ====================

@api_router.post("/complaints", response_model=ComplaintResponse)
async def create_complaint(
    complaint_data: ComplaintCreate,
    user: dict = Depends(require_role([UserRole.TENANT]))
):
    complaint_id = str(uuid.uuid4())
    
    prop = await db.properties.find_one({"id": complaint_data.property_id}, {"_id": 0})
    
    complaint_doc = {
        "id": complaint_id,
        **complaint_data.model_dump(),
        "tenant_id": user["id"],
        "tenant_name": user["name"],
        "property_name": prop["name"] if prop else None,
        "status": "open",
        "response": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "resolved_at": None
    }
    await db.complaints.insert_one(complaint_doc)
    
    # Notify property manager and landlord
    managers = await db.users.find({"role": UserRole.PROPERTY_MANAGER}, {"_id": 0}).to_list(100)
    for manager in managers:
        await create_notification(
            manager["id"],
            "New Complaint",
            f"New complaint from {user['name']}: {complaint_data.title}",
            "complaint"
        )
    
    return ComplaintResponse(**{k: v for k, v in complaint_doc.items() if k != "_id"})

@api_router.get("/complaints", response_model=List[ComplaintResponse])
async def get_complaints(user: dict = Depends(get_current_user)):
    query = {}
    if user["role"] == UserRole.TENANT:
        query["tenant_id"] = user["id"]
    elif user["role"] == UserRole.LANDLORD:
        props = await db.properties.find({"landlord_id": user["id"]}, {"_id": 0}).to_list(100)
        property_ids = [p["id"] for p in props]
        query["property_id"] = {"$in": property_ids}
    
    complaints = await db.complaints.find(query, {"_id": 0}).to_list(1000)
    return [ComplaintResponse(**c) for c in complaints]

@api_router.put("/complaints/{complaint_id}", response_model=ComplaintResponse)
async def update_complaint(
    complaint_id: str,
    complaint_data: ComplaintUpdate,
    user: dict = Depends(require_role([UserRole.PROPERTY_MANAGER, UserRole.LANDLORD]))
):
    update_data = {}
    if complaint_data.status:
        update_data["status"] = complaint_data.status
        if complaint_data.status == "resolved":
            update_data["resolved_at"] = datetime.now(timezone.utc).isoformat()
    if complaint_data.response:
        update_data["response"] = complaint_data.response
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    result = await db.complaints.update_one({"id": complaint_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    complaint = await db.complaints.find_one({"id": complaint_id}, {"_id": 0})
    
    # Notify tenant
    await create_notification(
        complaint["tenant_id"],
        "Complaint Updated",
        f"Your complaint '{complaint['title']}' has been updated",
        "complaint_update"
    )
    
    return ComplaintResponse(**complaint)

# ==================== NOTIFICATION ROUTES ====================

async def create_notification(user_id: str, title: str, message: str, notification_type: str):
    notification_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "title": title,
        "message": message,
        "notification_type": notification_type,
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.notifications.insert_one(notification_doc)

@api_router.get("/notifications", response_model=List[NotificationResponse])
async def get_notifications(user: dict = Depends(get_current_user)):
    notifications = await db.notifications.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return [NotificationResponse(**n) for n in notifications]

@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    user: dict = Depends(get_current_user)
):
    result = await db.notifications.update_one(
        {"id": notification_id, "user_id": user["id"]},
        {"$set": {"is_read": True}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Notification marked as read"}

@api_router.put("/notifications/read-all")
async def mark_all_notifications_read(user: dict = Depends(get_current_user)):
    await db.notifications.update_many(
        {"user_id": user["id"]},
        {"$set": {"is_read": True}}
    )
    return {"message": "All notifications marked as read"}

# ==================== DASHBOARD ROUTES ====================

@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(user: dict = Depends(get_current_user)):
    stats = DashboardStats()
    
    if user["role"] == UserRole.PROPERTY_MANAGER:
        stats.total_properties = await db.properties.count_documents({})
        stats.total_tenants = await db.users.count_documents({"role": UserRole.TENANT})
        stats.total_landlords = await db.users.count_documents({"role": UserRole.LANDLORD})
        stats.pending_complaints = await db.complaints.count_documents({"status": "open"})
        stats.pending_rent = await db.rents.count_documents({"status": "pending"})
        
        paid_rents = await db.rents.find({"status": "paid"}, {"_id": 0}).to_list(1000)
        stats.total_rent_collected = sum(r["amount"] for r in paid_rents)
    
    elif user["role"] == UserRole.LANDLORD:
        props = await db.properties.find({"landlord_id": user["id"]}, {"_id": 0}).to_list(100)
        property_ids = [p["id"] for p in props]
        stats.total_properties = len(props)
        
        leases = await db.leases.find({"property_id": {"$in": property_ids}}, {"_id": 0}).to_list(100)
        lease_ids = [l["id"] for l in leases]
        stats.total_tenants = len(set(l["tenant_id"] for l in leases))
        
        stats.pending_complaints = await db.complaints.count_documents({
            "property_id": {"$in": property_ids},
            "status": "open"
        })
        stats.pending_rent = await db.rents.count_documents({
            "lease_id": {"$in": lease_ids},
            "status": "pending"
        })
        
        paid_rents = await db.rents.find({
            "lease_id": {"$in": lease_ids},
            "status": "paid"
        }, {"_id": 0}).to_list(1000)
        stats.total_rent_collected = sum(r["amount"] for r in paid_rents)
    
    elif user["role"] == UserRole.TENANT:
        leases = await db.leases.find({"tenant_id": user["id"]}, {"_id": 0}).to_list(10)
        lease_ids = [l["id"] for l in leases]
        stats.total_properties = len(leases)
        
        stats.pending_complaints = await db.complaints.count_documents({
            "tenant_id": user["id"],
            "status": "open"
        })
        stats.pending_rent = await db.rents.count_documents({
            "lease_id": {"$in": lease_ids},
            "status": "pending"
        })
    
    return stats

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
