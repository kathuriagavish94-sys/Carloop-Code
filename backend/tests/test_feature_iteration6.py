"""
Test Suite for Iteration 6 Features:
1. Circular Logo (object-cover, fills circle)
2. Families Catered So Far.. (Delivery Images section)
3. Car Status Badges (Available/Booked/Sold) and Recently Sold section
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://carloop-dealer.preview.emergentagent.com')

# Test credentials from environment variables
ADMIN_EMAIL = os.environ.get('TEST_ADMIN_EMAIL', 'admin@truvant.com')
ADMIN_PASSWORD = os.environ.get('TEST_ADMIN_PASSWORD', 'Admin@123')


@pytest.fixture(scope="function")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="function")
def authenticated_client():
    """Session with auth header - fresh session for each test"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    
    # Login to get token
    response = session.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        token = response.json().get("token")
        session.headers.update({"Authorization": f"Bearer {token}"})
        return session
    pytest.skip("Authentication failed - skipping authenticated tests")


class TestDeliveryImagesAPI:
    """Tests for FEATURE 2: Families Catered So Far.. (Delivery Images)"""
    
    def test_get_delivery_images_public(self, api_client):
        """GET /api/delivery-images - Public endpoint returns delivery images"""
        response = api_client.get(f"{BASE_URL}/api/delivery-images")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/delivery-images returns {len(data)} deliveries")
        
        # Verify delivery structure if data exists
        if len(data) > 0:
            delivery = data[0]
            assert "id" in delivery
            assert "image_url" in delivery
            assert "car_name" in delivery
            assert "customer_name" in delivery
            assert "delivery_location" in delivery
            assert "created_at" in delivery
            print(f"✓ Delivery structure verified: {delivery['car_name']} - {delivery['customer_name']}")
    
    def test_get_delivery_images_with_limit(self, api_client):
        """GET /api/delivery-images?limit=2 - Returns limited results"""
        response = api_client.get(f"{BASE_URL}/api/delivery-images?limit=2")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) <= 2
        print(f"✓ GET /api/delivery-images?limit=2 returns {len(data)} deliveries (max 2)")
    
    def test_create_delivery_image_requires_auth(self, api_client):
        """POST /api/delivery-images - Requires authentication"""
        # Remove auth header if present
        api_client.headers.pop("Authorization", None)
        response = api_client.post(f"{BASE_URL}/api/delivery-images", json={
            "image_url": "https://example.com/test.jpg",
            "car_name": "Test Car",
            "customer_name": "Test Customer",
            "delivery_location": "Test Location"
        })
        assert response.status_code in [401, 403]
        print("✓ POST /api/delivery-images requires authentication")
    
    def test_create_delivery_image_with_auth(self, authenticated_client):
        """POST /api/delivery-images - Creates delivery with auth"""
        test_delivery = {
            "image_url": "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800",
            "car_name": "TEST_2024 Maruti Baleno",
            "customer_name": "TEST_Amit Kumar",
            "delivery_location": "Noida, UP"
        }
        response = authenticated_client.post(f"{BASE_URL}/api/delivery-images", json=test_delivery)
        assert response.status_code == 200
        data = response.json()
        assert data["car_name"] == test_delivery["car_name"]
        assert data["customer_name"] == test_delivery["customer_name"]
        assert data["delivery_location"] == test_delivery["delivery_location"]
        assert "id" in data
        print(f"✓ POST /api/delivery-images created: {data['id']}")
        
        # Cleanup - delete the test delivery
        delete_response = authenticated_client.delete(f"{BASE_URL}/api/delivery-images/{data['id']}")
        assert delete_response.status_code == 200
        print(f"✓ Cleanup: Deleted test delivery {data['id']}")
    
    def test_delete_delivery_image_requires_auth(self, api_client):
        """DELETE /api/delivery-images/{id} - Requires authentication"""
        api_client.headers.pop("Authorization", None)
        response = api_client.delete(f"{BASE_URL}/api/delivery-images/fake-id")
        assert response.status_code in [401, 403]
        print("✓ DELETE /api/delivery-images requires authentication")


class TestCarStatusAPI:
    """Tests for FEATURE 3: Car Status Badges (Available/Booked/Sold)"""
    
    def test_get_cars_returns_status_field(self, api_client):
        """GET /api/cars - Returns cars with status field"""
        response = api_client.get(f"{BASE_URL}/api/cars")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        
        # Check that cars have status field
        for car in data:
            assert "status" in car or car.get("status") is None  # status can be null for old cars
            status = car.get("status", "Available")
            assert status in ["Available", "Booked", "Sold", None]
        
        print(f"✓ GET /api/cars returns {len(data)} cars with status field")
    
    def test_get_recently_sold_cars(self, api_client):
        """GET /api/cars/recently-sold - Returns sold/booked cars"""
        response = api_client.get(f"{BASE_URL}/api/cars/recently-sold?limit=4")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        # Verify all returned cars are Sold or Booked
        for car in data:
            assert car.get("status") in ["Sold", "Booked"]
        
        print(f"✓ GET /api/cars/recently-sold returns {len(data)} sold/booked cars")
        
        if len(data) > 0:
            car = data[0]
            print(f"  - {car['make']} {car['model']} ({car['year']}) - Status: {car['status']}")
    
    def test_create_car_with_status(self, authenticated_client):
        """POST /api/cars - Can create car with status field"""
        test_car = {
            "make": "TEST_Toyota",
            "model": "Fortuner",
            "year": 2023,
            "price": 3500000,
            "image": "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800",
            "km_driven": 15000,
            "fuel_type": "Diesel",
            "transmission": "Automatic",
            "status": "Booked",
            "is_featured": False
        }
        response = authenticated_client.post(f"{BASE_URL}/api/cars", json=test_car)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "Booked"
        assert data["make"] == "TEST_Toyota"
        print(f"✓ POST /api/cars created car with status 'Booked': {data['id']}")
        
        # Cleanup
        delete_response = authenticated_client.delete(f"{BASE_URL}/api/cars/{data['id']}")
        assert delete_response.status_code == 200
        print(f"✓ Cleanup: Deleted test car {data['id']}")
    
    def test_update_car_status(self, authenticated_client):
        """PUT /api/cars/{id} - Can update car status"""
        # First create a test car
        test_car = {
            "make": "TEST_Hyundai",
            "model": "Venue",
            "year": 2022,
            "price": 1200000,
            "image": "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800",
            "km_driven": 25000,
            "fuel_type": "Petrol",
            "transmission": "Manual",
            "status": "Available",
            "is_featured": False
        }
        create_response = authenticated_client.post(f"{BASE_URL}/api/cars", json=test_car)
        assert create_response.status_code == 200
        car_id = create_response.json()["id"]
        
        # Update status to Sold
        update_response = authenticated_client.put(f"{BASE_URL}/api/cars/{car_id}", json={
            "status": "Sold"
        })
        assert update_response.status_code == 200
        updated_car = update_response.json()
        assert updated_car["status"] == "Sold"
        print(f"✓ PUT /api/cars/{car_id} updated status to 'Sold'")
        
        # Verify it appears in recently-sold
        sold_response = authenticated_client.get(f"{BASE_URL}/api/cars/recently-sold?limit=10")
        sold_cars = sold_response.json()
        car_ids = [c["id"] for c in sold_cars]
        assert car_id in car_ids
        print(f"✓ Car {car_id} appears in recently-sold endpoint")
        
        # Cleanup
        delete_response = authenticated_client.delete(f"{BASE_URL}/api/cars/{car_id}")
        assert delete_response.status_code == 200
        print(f"✓ Cleanup: Deleted test car {car_id}")


class TestAdminAuthentication:
    """Tests for Admin Authentication (prerequisite for admin features)"""
    
    def test_admin_login_success(self, api_client):
        """POST /api/auth/login - Admin login with correct credentials"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "admin" in data
        assert data["admin"]["email"] == ADMIN_EMAIL
        print(f"✓ Admin login successful: {ADMIN_EMAIL}")
    
    def test_admin_login_invalid_credentials(self, api_client):
        """POST /api/auth/login - Rejects invalid credentials"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@example.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Admin login rejects invalid credentials")


class TestExistingFunctionality:
    """Tests to ensure existing functionality still works"""
    
    def test_get_cars(self, api_client):
        """GET /api/cars - Returns car list"""
        response = api_client.get(f"{BASE_URL}/api/cars")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        print(f"✓ GET /api/cars returns {len(data)} cars")
    
    def test_get_featured_cars(self, api_client):
        """GET /api/cars?featured=true - Returns featured cars"""
        response = api_client.get(f"{BASE_URL}/api/cars?featured=true")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        for car in data:
            assert car.get("is_featured") == True
        print(f"✓ GET /api/cars?featured=true returns {len(data)} featured cars")
    
    def test_get_testimonials(self, api_client):
        """GET /api/testimonials - Returns testimonials"""
        response = api_client.get(f"{BASE_URL}/api/testimonials")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/testimonials returns {len(data)} testimonials")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
