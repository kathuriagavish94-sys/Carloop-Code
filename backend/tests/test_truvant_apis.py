"""
TruVant Car Dealer API Tests
Tests for: Inventory, Car Details, Callback Requests, Contact Enquiries
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://carloop-dealer.preview.emergentagent.com').rstrip('/')

class TestCarsAPI:
    """Tests for car inventory endpoints"""
    
    def test_get_all_cars(self):
        """Test GET /api/cars returns list of cars"""
        response = requests.get(f"{BASE_URL}/api/cars")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        # Verify car structure
        car = data[0]
        assert "id" in car
        assert "make" in car
        assert "model" in car
        assert "year" in car
        assert "price" in car
        assert "fuel_type" in car
        assert "transmission" in car
        print(f"✓ GET /api/cars returned {len(data)} cars")
    
    def test_get_featured_cars(self):
        """Test GET /api/cars?featured=true returns only featured cars"""
        response = requests.get(f"{BASE_URL}/api/cars?featured=true")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # All returned cars should be featured
        for car in data:
            assert car.get("is_featured") == True
        print(f"✓ GET /api/cars?featured=true returned {len(data)} featured cars")
    
    def test_get_single_car(self):
        """Test GET /api/cars/{id} returns car details"""
        # First get a car ID
        cars_response = requests.get(f"{BASE_URL}/api/cars")
        cars = cars_response.json()
        car_id = cars[0]["id"]
        
        response = requests.get(f"{BASE_URL}/api/cars/{car_id}")
        assert response.status_code == 200
        car = response.json()
        assert car["id"] == car_id
        assert "make" in car
        assert "model" in car
        assert "features" in car
        assert "specifications" in car
        print(f"✓ GET /api/cars/{car_id} returned car: {car['make']} {car['model']}")
    
    def test_get_nonexistent_car(self):
        """Test GET /api/cars/{id} returns 404 for non-existent car"""
        response = requests.get(f"{BASE_URL}/api/cars/nonexistent-id-12345")
        assert response.status_code == 404
        print("✓ GET /api/cars/nonexistent-id returns 404")


class TestCallbackRequestsAPI:
    """Tests for callback request endpoints"""
    
    def test_create_callback_request_without_car(self):
        """Test POST /api/callback-requests without car_id"""
        payload = {
            "name": "TEST_Callback User",
            "phone": "9876543210"
        }
        response = requests.post(f"{BASE_URL}/api/callback-requests", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == payload["name"]
        assert data["phone"] == payload["phone"]
        assert "id" in data
        assert "created_at" in data
        print(f"✓ POST /api/callback-requests created callback: {data['id']}")
    
    def test_create_callback_request_with_car(self):
        """Test POST /api/callback-requests with car_id"""
        # Get a car ID first
        cars_response = requests.get(f"{BASE_URL}/api/cars")
        cars = cars_response.json()
        car_id = cars[0]["id"]
        car_make = cars[0]["make"]
        car_model = cars[0]["model"]
        
        payload = {
            "name": "TEST_Callback With Car",
            "phone": "9876543211",
            "car_id": car_id
        }
        response = requests.post(f"{BASE_URL}/api/callback-requests", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == payload["name"]
        assert data["phone"] == payload["phone"]
        assert data["car_id"] == car_id
        # Verify car_details is populated
        assert data["car_details"] is not None
        assert car_make in data["car_details"]
        print(f"✓ POST /api/callback-requests with car created: {data['car_details']}")
    
    def test_callback_request_missing_fields(self):
        """Test POST /api/callback-requests with missing required fields"""
        payload = {"name": "Only Name"}  # Missing phone
        response = requests.post(f"{BASE_URL}/api/callback-requests", json=payload)
        assert response.status_code == 422  # Validation error
        print("✓ POST /api/callback-requests validates required fields")


class TestEnquiriesAPI:
    """Tests for contact enquiry endpoints"""
    
    def test_create_enquiry(self):
        """Test POST /api/enquiries creates a contact enquiry"""
        payload = {
            "name": "TEST_Contact User",
            "email": "test@example.com",
            "phone": "9876543212",
            "message": "Testing contact form submission"
        }
        response = requests.post(f"{BASE_URL}/api/enquiries", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == payload["name"]
        assert data["email"] == payload["email"]
        assert data["phone"] == payload["phone"]
        assert data["message"] == payload["message"]
        assert "id" in data
        assert "created_at" in data
        print(f"✓ POST /api/enquiries created enquiry: {data['id']}")
    
    def test_enquiry_missing_fields(self):
        """Test POST /api/enquiries with missing required fields"""
        payload = {"name": "Only Name"}  # Missing email, phone, message
        response = requests.post(f"{BASE_URL}/api/enquiries", json=payload)
        assert response.status_code == 422  # Validation error
        print("✓ POST /api/enquiries validates required fields")
    
    def test_enquiry_invalid_email(self):
        """Test POST /api/enquiries with invalid email format"""
        payload = {
            "name": "Test User",
            "email": "invalid-email",
            "phone": "9876543213",
            "message": "Test message"
        }
        response = requests.post(f"{BASE_URL}/api/enquiries", json=payload)
        assert response.status_code == 422  # Validation error for invalid email
        print("✓ POST /api/enquiries validates email format")


class TestAuthAPI:
    """Tests for admin authentication"""
    
    def test_admin_login_success(self):
        """Test POST /api/auth/login with valid credentials"""
        payload = {
            "email": "admin@carloop.com",
            "password": "admin123"
        }
        response = requests.post(f"{BASE_URL}/api/auth/login", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "admin" in data
        assert data["admin"]["email"] == payload["email"]
        print(f"✓ POST /api/auth/login successful for {payload['email']}")
        return data["token"]
    
    def test_admin_login_invalid_credentials(self):
        """Test POST /api/auth/login with invalid credentials"""
        payload = {
            "email": "admin@carloop.com",
            "password": "wrongpassword"
        }
        response = requests.post(f"{BASE_URL}/api/auth/login", json=payload)
        assert response.status_code == 401
        print("✓ POST /api/auth/login rejects invalid credentials")
    
    def test_get_current_admin(self):
        """Test GET /api/auth/me with valid token"""
        # First login to get token
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@carloop.com",
            "password": "admin123"
        })
        token = login_response.json()["token"]
        
        # Get current admin
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "admin@carloop.com"
        print(f"✓ GET /api/auth/me returned admin: {data['email']}")


class TestProtectedEndpoints:
    """Tests for admin-protected endpoints"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@carloop.com",
            "password": "admin123"
        })
        return response.json()["token"]
    
    def test_get_callback_requests_authenticated(self, auth_token):
        """Test GET /api/callback-requests with auth"""
        response = requests.get(
            f"{BASE_URL}/api/callback-requests",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/callback-requests returned {len(data)} callbacks")
    
    def test_get_callback_requests_unauthenticated(self):
        """Test GET /api/callback-requests without auth"""
        response = requests.get(f"{BASE_URL}/api/callback-requests")
        assert response.status_code in [401, 403]
        print("✓ GET /api/callback-requests requires authentication")
    
    def test_get_enquiries_authenticated(self, auth_token):
        """Test GET /api/enquiries with auth"""
        response = requests.get(
            f"{BASE_URL}/api/enquiries",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/enquiries returned {len(data)} enquiries")
    
    def test_get_enquiries_unauthenticated(self):
        """Test GET /api/enquiries without auth"""
        response = requests.get(f"{BASE_URL}/api/enquiries")
        assert response.status_code in [401, 403]
        print("✓ GET /api/enquiries requires authentication")


class TestAPIRoot:
    """Tests for API root endpoint"""
    
    def test_api_root(self):
        """Test GET /api/ returns API info"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ GET /api/ returned: {data['message']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
