import requests
import sys
import json
from datetime import datetime, timedelta

class PropertyManagementAPITester:
    def __init__(self, base_url="https://rental-portal-23.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_resources = {
            'users': [],
            'properties': [],
            'leases': [],
            'rents': [],
            'complaints': []
        }

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json() if response.content else {}
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text}")

            return success, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_auth_flow(self):
        """Test authentication endpoints"""
        print("\n" + "="*50)
        print("TESTING AUTHENTICATION")
        print("="*50)
        
        # Test existing user login
        success, response = self.run_test(
            "Login with existing user",
            "POST",
            "auth/login",
            200,
            data={"email": "manager@test.com", "password": "password123"}
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            print(f"   Token obtained for user: {response['user']['name']} ({response['user']['role']})")
            return True
        
        # If existing user fails, try to register new users
        timestamp = datetime.now().strftime("%H%M%S")
        
        # Register property manager
        manager_data = {
            "email": f"testmanager_{timestamp}@test.com",
            "password": "TestPass123!",
            "name": "Test Manager",
            "role": "property_manager",
            "phone": "+1234567890"
        }
        
        success, response = self.run_test(
            "Register Property Manager",
            "POST",
            "auth/register",
            200,
            data=manager_data
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            self.created_resources['users'].append(response['user']['id'])
            print(f"   New manager created: {response['user']['name']}")
            
            # Register additional users for testing
            self.register_test_users(timestamp)
            return True
        
        return False

    def register_test_users(self, timestamp):
        """Register additional test users"""
        # Register landlord
        landlord_data = {
            "email": f"testlandlord_{timestamp}@test.com",
            "password": "TestPass123!",
            "name": "Test Landlord",
            "role": "landlord",
            "phone": "+1234567891"
        }
        
        success, response = self.run_test(
            "Register Landlord",
            "POST",
            "auth/register",
            200,
            data=landlord_data
        )
        if success:
            self.created_resources['users'].append(response['user']['id'])
        
        # Register tenant
        tenant_data = {
            "email": f"testtenant_{timestamp}@test.com",
            "password": "TestPass123!",
            "name": "Test Tenant",
            "role": "tenant",
            "phone": "+1234567892"
        }
        
        success, response = self.run_test(
            "Register Tenant",
            "POST",
            "auth/register",
            200,
            data=tenant_data
        )
        if success:
            self.created_resources['users'].append(response['user']['id'])

    def test_user_management(self):
        """Test user management endpoints"""
        print("\n" + "="*50)
        print("TESTING USER MANAGEMENT")
        print("="*50)
        
        # Get current user
        self.run_test("Get current user", "GET", "auth/me", 200)
        
        # Get all users
        self.run_test("Get all users", "GET", "users", 200)
        
        # Get users by role
        self.run_test("Get tenants", "GET", "users?role=tenant", 200)
        self.run_test("Get landlords", "GET", "users?role=landlord", 200)

    def test_property_management(self):
        """Test property management endpoints"""
        print("\n" + "="*50)
        print("TESTING PROPERTY MANAGEMENT")
        print("="*50)
        
        # Get landlords for property assignment
        success, users_response = self.run_test("Get landlords for assignment", "GET", "users?role=landlord", 200)
        landlord_id = None
        if success and users_response and len(users_response) > 0:
            landlord_id = users_response[0]['id']
        
        # Create property
        property_data = {
            "name": "Test Apartment Complex",
            "address": "123 Test Street, Test City, TC 12345",
            "property_type": "apartment",
            "units": 10,
            "description": "Modern apartment complex for testing",
            "landlord_id": landlord_id
        }
        
        success, response = self.run_test(
            "Create Property",
            "POST",
            "properties",
            200,
            data=property_data
        )
        
        property_id = None
        if success and 'id' in response:
            property_id = response['id']
            self.created_resources['properties'].append(property_id)
        
        # Get all properties
        self.run_test("Get all properties", "GET", "properties", 200)
        
        if property_id:
            # Get specific property
            self.run_test("Get specific property", "GET", f"properties/{property_id}", 200)
            
            # Update property
            update_data = {
                "name": "Updated Test Apartment Complex",
                "address": property_data["address"],
                "property_type": "apartment",
                "units": 12,
                "description": "Updated description"
            }
            self.run_test("Update property", "PUT", f"properties/{property_id}", 200, data=update_data)
        
        return property_id

    def test_lease_management(self, property_id):
        """Test lease management endpoints"""
        print("\n" + "="*50)
        print("TESTING LEASE MANAGEMENT")
        print("="*50)
        
        if not property_id:
            print("❌ Skipping lease tests - no property available")
            return None
        
        # Get tenants for lease assignment
        success, users_response = self.run_test("Get tenants for lease", "GET", "users?role=tenant", 200)
        tenant_id = None
        if success and users_response and len(users_response) > 0:
            tenant_id = users_response[0]['id']
        
        if not tenant_id:
            print("❌ Skipping lease tests - no tenant available")
            return None
        
        # Create lease
        start_date = datetime.now().strftime("%Y-%m-%d")
        end_date = (datetime.now() + timedelta(days=365)).strftime("%Y-%m-%d")
        
        lease_data = {
            "property_id": property_id,
            "tenant_id": tenant_id,
            "start_date": start_date,
            "end_date": end_date,
            "monthly_rent": 1500.00,
            "security_deposit": 1500.00
        }
        
        success, response = self.run_test(
            "Create Lease",
            "POST",
            "leases",
            200,
            data=lease_data
        )
        
        lease_id = None
        if success and 'id' in response:
            lease_id = response['id']
            self.created_resources['leases'].append(lease_id)
        
        # Get all leases
        self.run_test("Get all leases", "GET", "leases", 200)
        
        if lease_id:
            # Get specific lease
            self.run_test("Get specific lease", "GET", f"leases/{lease_id}", 200)
            
            # Update lease
            update_data = {
                "monthly_rent": 1600.00
            }
            self.run_test("Update lease", "PUT", f"leases/{lease_id}", 200, data=update_data)
        
        return lease_id

    def test_rent_management(self, lease_id):
        """Test rent management endpoints"""
        print("\n" + "="*50)
        print("TESTING RENT MANAGEMENT")
        print("="*50)
        
        if not lease_id:
            print("❌ Skipping rent tests - no lease available")
            return None
        
        # Create rent record
        due_date = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
        
        rent_data = {
            "lease_id": lease_id,
            "amount": 1500.00,
            "due_date": due_date,
            "period": f"{datetime.now().strftime('%B %Y')}"
        }
        
        success, response = self.run_test(
            "Create Rent Record",
            "POST",
            "rents",
            200,
            data=rent_data
        )
        
        rent_id = None
        if success and 'id' in response:
            rent_id = response['id']
            self.created_resources['rents'].append(rent_id)
        
        # Get all rents
        self.run_test("Get all rents", "GET", "rents", 200)
        
        if rent_id:
            # Mark rent as paid
            self.run_test(
                "Mark rent as paid",
                "PUT",
                f"rents/{rent_id}",
                200,
                data={"status": "paid", "paid_date": datetime.now().strftime("%Y-%m-%d")}
            )
            
            # Mark rent as pending again
            self.run_test(
                "Mark rent as pending",
                "PUT",
                f"rents/{rent_id}",
                200,
                data={"status": "pending"}
            )
        
        return rent_id

    def test_complaint_management(self, property_id):
        """Test complaint management endpoints"""
        print("\n" + "="*50)
        print("TESTING COMPLAINT MANAGEMENT")
        print("="*50)
        
        if not property_id:
            print("❌ Skipping complaint tests - no property available")
            return None
        
        # Switch to tenant role for creating complaint
        success, users_response = self.run_test("Get tenants for complaint", "GET", "users?role=tenant", 200)
        if not success or not users_response or len(users_response) == 0:
            print("❌ Skipping complaint tests - no tenant available")
            return None
        
        # Login as tenant to create complaint
        tenant_email = users_response[0]['email']
        success, response = self.run_test(
            "Login as tenant",
            "POST",
            "auth/login",
            200,
            data={"email": tenant_email, "password": "TestPass123!"}
        )
        
        if success and 'access_token' in response:
            old_token = self.token
            self.token = response['access_token']
            
            # Create complaint
            complaint_data = {
                "property_id": property_id,
                "title": "Leaky Faucet",
                "description": "The kitchen faucet is leaking and needs repair",
                "priority": "medium"
            }
            
            success, response = self.run_test(
                "Create Complaint",
                "POST",
                "complaints",
                200,
                data=complaint_data
            )
            
            complaint_id = None
            if success and 'id' in response:
                complaint_id = response['id']
                self.created_resources['complaints'].append(complaint_id)
            
            # Switch back to manager
            self.token = old_token
            
            # Get all complaints
            self.run_test("Get all complaints", "GET", "complaints", 200)
            
            if complaint_id:
                # Respond to complaint
                self.run_test(
                    "Respond to complaint",
                    "PUT",
                    f"complaints/{complaint_id}",
                    200,
                    data={"response": "We will send a maintenance person tomorrow", "status": "in_progress"}
                )
                
                # Resolve complaint
                self.run_test(
                    "Resolve complaint",
                    "PUT",
                    f"complaints/{complaint_id}",
                    200,
                    data={"status": "resolved"}
                )
            
            return complaint_id
        
        return None

    def test_notifications(self):
        """Test notification endpoints"""
        print("\n" + "="*50)
        print("TESTING NOTIFICATIONS")
        print("="*50)
        
        # Get notifications
        self.run_test("Get notifications", "GET", "notifications", 200)
        
        # Mark all notifications as read
        self.run_test("Mark all notifications as read", "PUT", "notifications/read-all", 200)

    def test_dashboard_stats(self):
        """Test dashboard statistics"""
        print("\n" + "="*50)
        print("TESTING DASHBOARD STATS")
        print("="*50)
        
        self.run_test("Get dashboard stats", "GET", "dashboard/stats", 200)

    def cleanup_resources(self):
        """Clean up created test resources"""
        print("\n" + "="*50)
        print("CLEANING UP TEST RESOURCES")
        print("="*50)
        
        # Delete complaints
        for complaint_id in self.created_resources['complaints']:
            # Note: No delete endpoint for complaints in the API
            pass
        
        # Delete rents
        for rent_id in self.created_resources['rents']:
            # Note: No delete endpoint for rents in the API
            pass
        
        # Delete leases
        for lease_id in self.created_resources['leases']:
            self.run_test(f"Delete lease {lease_id}", "DELETE", f"leases/{lease_id}", 200)
        
        # Delete properties
        for property_id in self.created_resources['properties']:
            self.run_test(f"Delete property {property_id}", "DELETE", f"properties/{property_id}", 200)
        
        # Delete users
        for user_id in self.created_resources['users']:
            self.run_test(f"Delete user {user_id}", "DELETE", f"users/{user_id}", 200)

def main():
    print("🏠 Property Management API Testing Suite")
    print("=" * 60)
    
    tester = PropertyManagementAPITester()
    
    try:
        # Test authentication
        if not tester.test_auth_flow():
            print("❌ Authentication failed, stopping tests")
            return 1
        
        # Test all modules
        tester.test_user_management()
        
        property_id = tester.test_property_management()
        lease_id = tester.test_lease_management(property_id)
        rent_id = tester.test_rent_management(lease_id)
        complaint_id = tester.test_complaint_management(property_id)
        
        tester.test_notifications()
        tester.test_dashboard_stats()
        
        # Cleanup
        tester.cleanup_resources()
        
        # Print results
        print("\n" + "="*60)
        print("📊 TEST RESULTS")
        print("="*60)
        print(f"Tests run: {tester.tests_run}")
        print(f"Tests passed: {tester.tests_passed}")
        print(f"Tests failed: {tester.tests_run - tester.tests_passed}")
        print(f"Success rate: {(tester.tests_passed / tester.tests_run * 100):.1f}%")
        
        if tester.tests_passed == tester.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("⚠️  Some tests failed")
            return 1
            
    except Exception as e:
        print(f"❌ Test suite failed with error: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())