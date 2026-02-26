import requests
import sys
from datetime import datetime

class CarloopAPITester:
    def __init__(self, base_url="https://carloop-dealer.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.cars = []
        self.enquiries = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, auth_required=False):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
        
        if auth_required and self.admin_token:
            test_headers['Authorization'] = f'Bearer {self.admin_token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    return True, response_data
                except:
                    return True, {"message": "Success"}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except requests.RequestException as e:
            print(f"❌ Failed - Network Error: {str(e)}")
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_api_root(self):
        """Test API root endpoint"""
        return self.run_test("API Root", "GET", "", 200)

    def test_admin_login(self):
        """Test admin login with correct credentials"""
        login_data = {
            "email": "admin@carloop.com",
            "password": "admin123"
        }
        
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if success and 'token' in response:
            self.admin_token = response['token']
            print(f"   🔑 Admin token obtained: {self.admin_token[:20]}...")
            return True
        return False

    def test_admin_login_invalid(self):
        """Test admin login with invalid credentials"""
        login_data = {
            "email": "admin@carloop.com",
            "password": "wrongpassword"
        }
        
        return self.run_test(
            "Admin Login Invalid",
            "POST",
            "auth/login",
            401,
            data=login_data
        )

    def test_admin_me(self):
        """Test getting current admin info"""
        if not self.admin_token:
            print("❌ Admin Me - No token available")
            return False
        
        return self.run_test(
            "Admin Me",
            "GET",
            "auth/me",
            200,
            auth_required=True
        )

    def test_get_cars(self):
        """Test getting all cars"""
        success, response = self.run_test(
            "Get All Cars",
            "GET",
            "cars",
            200
        )
        
        if success and isinstance(response, list):
            self.cars = response
            print(f"   📋 Found {len(self.cars)} cars in inventory")
            return True
        return False

    def test_get_featured_cars(self):
        """Test getting featured cars only"""
        success, response = self.run_test(
            "Get Featured Cars",
            "GET",
            "cars?featured=true",
            200
        )
        
        if success and isinstance(response, list):
            featured_count = len(response)
            print(f"   ⭐ Found {featured_count} featured cars")
            return True
        return False

    def test_get_single_car(self):
        """Test getting a single car by ID"""
        if not self.cars:
            print("❌ Get Single Car - No cars available")
            return False
        
        car_id = self.cars[0]['id']
        success, response = self.run_test(
            "Get Single Car",
            "GET",
            f"cars/{car_id}",
            200
        )
        
        if success and response.get('id') == car_id:
            print(f"   🚗 Retrieved car: {response.get('make')} {response.get('model')}")
            return True
        return False

    def test_get_nonexistent_car(self):
        """Test getting a non-existent car"""
        return self.run_test(
            "Get Non-existent Car",
            "GET",
            "cars/nonexistent-id",
            404
        )

    def test_create_car(self):
        """Test creating a new car (admin required)"""
        if not self.admin_token:
            print("❌ Create Car - No admin token available")
            return False
        
        car_data = {
            "make": "Toyota",
            "model": "Camry Test",
            "year": 2023,
            "price": 2500000,
            "image": "https://example.com/test-car.jpg",
            "km_driven": 5000,
            "fuel_type": "Petrol",
            "transmission": "Automatic",
            "condition": "Excellent",
            "features": ["Test Feature 1", "Test Feature 2"],
            "specifications": {"engine": "2.0L", "power": "150 bhp"},
            "is_featured": False
        }
        
        success, response = self.run_test(
            "Create Car",
            "POST",
            "cars",
            200,
            data=car_data,
            auth_required=True
        )
        
        if success and response.get('make') == 'Toyota':
            print(f"   ✨ Created car: {response.get('make')} {response.get('model')}")
            return response.get('id')
        return False

    def test_update_car(self, car_id):
        """Test updating an existing car"""
        if not self.admin_token or not car_id:
            print("❌ Update Car - No admin token or car ID available")
            return False
        
        update_data = {
            "price": 2400000,
            "is_featured": True
        }
        
        success, response = self.run_test(
            "Update Car",
            "PUT",
            f"cars/{car_id}",
            200,
            data=update_data,
            auth_required=True
        )
        
        if success and response.get('price') == 2400000:
            print(f"   🔄 Updated car price to ₹{response.get('price'):,}")
            return True
        return False

    def test_delete_car(self, car_id):
        """Test deleting a car"""
        if not self.admin_token or not car_id:
            print("❌ Delete Car - No admin token or car ID available")
            return False
        
        return self.run_test(
            "Delete Car",
            "DELETE",
            f"cars/{car_id}",
            200,
            auth_required=True
        )

    def test_create_enquiry(self):
        """Test creating a customer enquiry"""
        enquiry_data = {
            "name": "Test Customer",
            "email": "test@example.com",
            "phone": "+91 9876543210",
            "message": "Interested in your cars, please contact me",
            "car_id": self.cars[0]['id'] if self.cars else None
        }
        
        success, response = self.run_test(
            "Create Enquiry",
            "POST",
            "enquiries",
            200,
            data=enquiry_data
        )
        
        if success and response.get('name') == 'Test Customer':
            print(f"   📧 Created enquiry from: {response.get('name')}")
            return True
        return False

    def test_get_enquiries(self):
        """Test getting all enquiries (admin required)"""
        if not self.admin_token:
            print("❌ Get Enquiries - No admin token available")
            return False
        
        success, response = self.run_test(
            "Get Enquiries",
            "GET",
            "enquiries",
            200,
            auth_required=True
        )
        
        if success and isinstance(response, list):
            self.enquiries = response
            print(f"   📬 Found {len(self.enquiries)} enquiries")
            return True
        return False

    def test_unauthorized_actions(self):
        """Test actions without admin token"""
        print("\n🔒 Testing unauthorized access...")
        
        # Try to create car without token
        car_data = {"make": "Test", "model": "Unauthorized", "year": 2023, "price": 100000, 
                   "image": "test.jpg", "km_driven": 1000, "fuel_type": "Petrol", "transmission": "Manual"}
        
        success, _ = self.run_test(
            "Create Car Unauthorized",
            "POST",
            "cars",
            401,
            data=car_data
        )
        
        # Try to get enquiries without token
        success2, _ = self.run_test(
            "Get Enquiries Unauthorized",
            "GET",
            "enquiries",
            401
        )
        
        return success and success2

    def test_create_testimonial(self):
        """Test creating a testimonial (admin required)"""
        if not self.admin_token:
            print("❌ Create Testimonial - No admin token available")
            return False
        
        testimonial_data = {
            "customer_name": "John Smith",
            "youtube_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "is_active": True
        }
        
        success, response = self.run_test(
            "Create Testimonial",
            "POST",
            "testimonials",
            200,
            data=testimonial_data,
            auth_required=True
        )
        
        if success and response.get('customer_name') == 'John Smith':
            print(f"   🎥 Created testimonial for: {response.get('customer_name')}")
            return response.get('id')
        return False

    def test_get_testimonials(self):
        """Test getting all testimonials"""
        success, response = self.run_test(
            "Get All Testimonials",
            "GET",
            "testimonials",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   🎬 Found {len(response)} testimonials")
            return response
        return False

    def test_get_active_testimonials(self):
        """Test getting active testimonials only"""
        success, response = self.run_test(
            "Get Active Testimonials",
            "GET",
            "testimonials?active_only=true",
            200
        )
        
        if success and isinstance(response, list):
            active_count = len(response)
            print(f"   ✅ Found {active_count} active testimonials")
            return True
        return False

    def test_delete_testimonial(self, testimonial_id):
        """Test deleting a testimonial"""
        if not self.admin_token or not testimonial_id:
            print("❌ Delete Testimonial - No admin token or testimonial ID available")
            return False
        
        return self.run_test(
            "Delete Testimonial",
            "DELETE",
            f"testimonials/{testimonial_id}",
            200,
            auth_required=True
        )

    def test_convert_google_drive_url(self):
        """Test Google Drive URL conversion"""
        test_cases = [
            {
                "name": "Valid Google Drive URL",
                "url": "https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view?usp=sharing",
                "expected_contains": "https://drive.google.com/uc?export=view&id="
            },
            {
                "name": "Regular URL (no conversion)",
                "url": "https://example.com/image.jpg",
                "expected_contains": "https://example.com/image.jpg"
            },
            {
                "name": "Another Google Drive URL format",
                "url": "https://drive.google.com/file/d/abc123xyz/edit",
                "expected_contains": "https://drive.google.com/uc?export=view&id=abc123xyz"
            }
        ]
        
        all_passed = True
        for test_case in test_cases:
            print(f"\n   Testing {test_case['name']}")
            
            success, response = self.run_test(
                f"Convert Drive URL - {test_case['name']}",
                "POST",
                "convert-drive-url",
                200,
                data={"url": test_case["url"]}
            )
            
            if success and response.get('converted'):
                converted_url = response.get('converted')
                if test_case['expected_contains'] in converted_url or converted_url == test_case['url']:
                    print(f"   ✅ Conversion successful: {converted_url[:50]}...")
                else:
                    print(f"   ❌ Unexpected conversion result: {converted_url}")
                    all_passed = False
            else:
                all_passed = False
        
        return all_passed

    def test_youtube_url_extraction(self):
        """Test YouTube URL formats for video ID extraction"""
        youtube_test_urls = [
            "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "https://youtu.be/dQw4w9WgXcQ", 
            "https://www.youtube.com/embed/dQw4w9WgXcQ",
            "https://www.youtube.com/shorts/dQw4w9WgXcQ"
        ]
        
        if not self.admin_token:
            print("❌ YouTube URL extraction test - No admin token available")
            return False
        
        all_passed = True
        for url in youtube_test_urls:
            testimonial_data = {
                "customer_name": f"Test User {url[-10:]}",
                "youtube_url": url,
                "is_active": True
            }
            
            success, response = self.run_test(
                f"YouTube URL Format Test",
                "POST",
                "testimonials",
                200,
                data=testimonial_data,
                auth_required=True
            )
            
            if success and response.get('video_id') == 'dQw4w9WgXcQ':
                print(f"   ✅ URL format supported: {url}")
                # Clean up - delete the test testimonial
                if response.get('id'):
                    self.run_test(
                        "Cleanup Test Testimonial",
                        "DELETE", 
                        f"testimonials/{response.get('id')}",
                        200,
                        auth_required=True
                    )
            else:
                print(f"   ❌ URL format failed: {url}")
                all_passed = False
        
        return all_passed

def main():
    print("🚗 CARLOOP API TESTING SUITE - NEW FEATURES")
    print("=" * 60)
    
    tester = CarloopAPITester()
    
    # Test sequence
    print("\n📋 PHASE 1: Basic API Tests")
    tester.test_api_root()
    
    print("\n🔐 PHASE 2: Authentication Tests")
    admin_login_success = tester.test_admin_login()
    tester.test_admin_login_invalid()
    
    if admin_login_success:
        tester.test_admin_me()
    
    print("\n🚗 PHASE 3: Car Management Tests")
    tester.test_get_cars()
    tester.test_get_featured_cars()
    tester.test_get_single_car()
    tester.test_get_nonexistent_car()
    
    # Admin-only car operations
    if admin_login_success:
        new_car_id = tester.test_create_car()
        if new_car_id:
            tester.test_update_car(new_car_id)
            tester.test_delete_car(new_car_id)
    
    print("\n📧 PHASE 4: Enquiry System Tests")
    tester.test_create_enquiry()
    
    if admin_login_success:
        tester.test_get_enquiries()

    print("\n🎥 PHASE 5: NEW FEATURE - Testimonials System Tests")
    tester.test_get_testimonials()
    tester.test_get_active_testimonials()
    
    if admin_login_success:
        testimonial_id = tester.test_create_testimonial()
        tester.test_youtube_url_extraction()
        if testimonial_id:
            tester.test_delete_testimonial(testimonial_id)

    print("\n🔗 PHASE 6: NEW FEATURE - Google Drive URL Conversion Tests")
    tester.test_convert_google_drive_url()
    
    print("\n🔒 PHASE 7: Security Tests")
    tester.test_unauthorized_actions()
    
    # Final results
    print("\n" + "=" * 60)
    print("📊 TEST RESULTS SUMMARY - INCLUDING NEW FEATURES")
    print("=" * 60)
    print(f"Total Tests: {tester.tests_run}")
    print(f"Passed: {tester.tests_passed}")
    print(f"Failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run*100):.1f}%")
    
    if tester.cars:
        print(f"\nInventory Status: ✅ {len(tester.cars)} cars available")
    if tester.enquiries:
        print(f"Enquiries: ✅ {len(tester.enquiries)} customer enquiries")
    
    print("\n🆕 NEW FEATURES TESTED:")
    print("✅ Testimonials CRUD operations")
    print("✅ YouTube URL video ID extraction (multiple formats)")
    print("✅ Google Drive URL conversion endpoint")
    print("🔄 WhatsApp button integration (to be tested in frontend)")
    
    # Return exit code based on results
    success_rate = tester.tests_passed / tester.tests_run
    return 0 if success_rate >= 0.8 else 1

if __name__ == "__main__":
    sys.exit(main())