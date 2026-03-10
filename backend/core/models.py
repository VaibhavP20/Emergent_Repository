# Models are not used - we use MongoDB directly via PyMongo
# This file is kept for reference only

"""
MongoDB Collections:

users:
    - id: str (UUID)
    - email: str
    - password: str (hashed)
    - name: str
    - role: str (tenant, landlord, property_manager)
    - phone: str (optional)
    - created_at: str (ISO datetime)

properties:
    - id: str (UUID)
    - name: str
    - address: str
    - property_type: str
    - units: int
    - description: str (optional)
    - image_url: str (optional)
    - landlord_id: str (optional)
    - landlord_name: str (optional)
    - created_at: str

leases:
    - id: str (UUID)
    - property_id: str
    - tenant_id: str
    - start_date: str
    - end_date: str
    - monthly_rent: float
    - security_deposit: float
    - property_name: str
    - property_address: str
    - tenant_name: str
    - landlord_name: str
    - status: str
    - created_at: str

rents:
    - id: str (UUID)
    - lease_id: str
    - amount: float
    - due_date: str
    - period: str
    - status: str (pending, paid)
    - paid_date: str (optional)
    - tenant_name: str
    - property_name: str
    - created_at: str

complaints:
    - id: str (UUID)
    - property_id: str
    - tenant_id: str (optional)
    - created_by_id: str (optional)
    - complaint_type: str (tenant, manager)
    - title: str
    - description: str
    - priority: str
    - status: str
    - response: str (optional)
    - property_name: str
    - tenant_name: str (optional)
    - created_by_name: str
    - created_at: str
    - resolved_at: str (optional)

notifications:
    - id: str (UUID)
    - user_id: str
    - title: str
    - message: str
    - notification_type: str
    - is_read: bool
    - created_at: str
"""
