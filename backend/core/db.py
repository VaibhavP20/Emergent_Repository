from pymongo import MongoClient
from django.conf import settings

# MongoDB connection
client = MongoClient(settings.MONGO_URL)
db = client[settings.DB_NAME]

# Collections
users_collection = db.users
properties_collection = db.properties
leases_collection = db.leases
rents_collection = db.rents
complaints_collection = db.complaints
notifications_collection = db.notifications


def get_db():
    return db
