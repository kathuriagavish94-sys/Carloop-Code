"""
Test suite for Filter System and Families Catered features
- Issue 1: Filters - Budget, transmission, bodyType filters
- Issue 2: Families Catered - GET/POST/DELETE endpoints for family deliveries
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://carloop-dealer.preview.emergentagent.com')

# Test credentials
ADMIN_EMAIL = "admin@truvant.com"
ADMIN_PASSWORD = "Admin@123"


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def auth_token(api_client):
    """Get authentication token for admin"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip("Authentication failed - skipping authenticated tests")


@pytest.fixture(scope="module")
def authenticated_client(api_client, auth_token):
    """Session with auth header"""
    api_client.headers.update({"Authorization": f"Bearer {auth_token}"})
    return api_client


class TestCarsAPI:
    """Test cars API for filter functionality"""
    
    def test_get_all_cars(self, api_client):
        """Test GET /api/cars returns list of cars"""
        response = api_client.get(f"{BASE_URL}/api/cars")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Total cars in inventory: {len(data)}")
        
        # Verify car structure
        if len(data) > 0:
            car = data[0]
            assert "id" in car
            assert "make" in car
            assert "model" in car
            assert "price" in car
            assert "transmission" in car
            assert "fuel_type" in car
    
    def test_cars_have_transmission_field(self, api_client):
        """Verify cars have transmission field for filtering"""
        response = api_client.get(f"{BASE_URL}/api/cars")
        assert response.status_code == 200
        data = response.json()
        
        automatic_count = 0
        manual_count = 0
        
        for car in data:
            assert "transmission" in car, f"Car {car.get('id')} missing transmission field"
            if car["transmission"] == "Automatic":
                automatic_count += 1
            elif car["transmission"] == "Manual":
                manual_count += 1
        
        print(f"Automatic cars: {automatic_count}, Manual cars: {manual_count}")
        assert automatic_count > 0 or manual_count > 0, "No cars with transmission data"
    
    def test_cars_have_price_field(self, api_client):
        """Verify cars have price field for budget filtering"""
        response = api_client.get(f"{BASE_URL}/api/cars")
        assert response.status_code == 200
        data = response.json()
        
        under_5_lakh = 0
        above_5_lakh = 0
        
        for car in data:
            assert "price" in car, f"Car {car.get('id')} missing price field"
            price = car["price"]
            assert isinstance(price, (int, float)), f"Price should be numeric, got {type(price)}"
            
            if price <= 500000:
                under_5_lakh += 1
            else:
                above_5_lakh += 1
        
        print(f"Cars under 5 Lakh: {under_5_lakh}, Cars above 5 Lakh: {above_5_lakh}")
    
    def test_cars_have_body_type_or_specifications(self, api_client):
        """Verify cars have body_type for SUV filtering"""
        response = api_client.get(f"{BASE_URL}/api/cars")
        assert response.status_code == 200
        data = response.json()
        
        suv_count = 0
        sedan_count = 0
        hatchback_count = 0
        
        for car in data:
            # Check body_type field or specifications.body_type
            body_type = car.get("body_type") or car.get("specifications", {}).get("body_type", "")
            body_type_lower = body_type.lower() if body_type else ""
            
            if "suv" in body_type_lower:
                suv_count += 1
            elif "sedan" in body_type_lower:
                sedan_count += 1
            elif "hatchback" in body_type_lower:
                hatchback_count += 1
        
        print(f"SUVs: {suv_count}, Sedans: {sedan_count}, Hatchbacks: {hatchback_count}")
    
    def test_get_featured_cars(self, api_client):
        """Test GET /api/cars?featured=true"""
        response = api_client.get(f"{BASE_URL}/api/cars?featured=true")
        assert response.status_code == 200
        data = response.json()
        
        for car in data:
            assert car.get("is_featured") == True, f"Car {car.get('id')} should be featured"
        
        print(f"Featured cars: {len(data)}")


class TestFamilyDeliveriesAPI:
    """Test Family Deliveries API for Families Catered feature"""
    
    def test_get_family_deliveries_public(self, api_client):
        """Test GET /api/family-deliveries (public endpoint)"""
        response = api_client.get(f"{BASE_URL}/api/family-deliveries")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Total family deliveries: {len(data)}")
        
        # Verify structure if data exists
        if len(data) > 0:
            delivery = data[0]
            assert "id" in delivery
            assert "image_url" in delivery
            # caption is optional
    
    def test_get_family_deliveries_with_limit(self, api_client):
        """Test GET /api/family-deliveries?limit=5"""
        response = api_client.get(f"{BASE_URL}/api/family-deliveries?limit=5")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) <= 5
        print(f"Family deliveries with limit=5: {len(data)}")
    
    def test_create_family_delivery_requires_auth(self, api_client):
        """Test POST /api/family-deliveries requires authentication"""
        # Create fresh client without auth
        fresh_client = requests.Session()
        fresh_client.headers.update({"Content-Type": "application/json"})
        
        response = fresh_client.post(f"{BASE_URL}/api/family-deliveries", json={
            "image_url": "https://example.com/test.jpg",
            "caption": "Test caption"
        })
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("POST /api/family-deliveries correctly requires authentication")
    
    def test_create_family_delivery_authenticated(self, api_client, auth_token):
        """Test POST /api/family-deliveries with auth"""
        test_image_url = "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=400"
        test_caption = "TEST_Happy family with new car"
        
        response = api_client.post(
            f"{BASE_URL}/api/family-deliveries", 
            json={
                "image_url": test_image_url,
                "caption": test_caption
            },
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code in [200, 201], f"Expected 200/201, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "id" in data
        assert data["image_url"] == test_image_url
        assert data["caption"] == test_caption
        
        print(f"Created family delivery with ID: {data['id']}")
    
    def test_delete_family_delivery_requires_auth(self, api_client):
        """Test DELETE /api/family-deliveries/{id} requires authentication"""
        # Create fresh client without auth
        fresh_client = requests.Session()
        fresh_client.headers.update({"Content-Type": "application/json"})
        
        response = fresh_client.delete(f"{BASE_URL}/api/family-deliveries/fake-id")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("DELETE /api/family-deliveries correctly requires authentication")
    
    def test_create_and_delete_family_delivery(self, api_client, auth_token):
        """Test full CRUD flow: Create -> Verify -> Delete -> Verify deletion"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Create
        test_image_url = "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400"
        test_caption = "TEST_CRUD_Family delivery test"
        
        create_response = api_client.post(
            f"{BASE_URL}/api/family-deliveries", 
            json={
                "image_url": test_image_url,
                "caption": test_caption
            },
            headers=headers
        )
        assert create_response.status_code in [200, 201], f"Create failed: {create_response.status_code} - {create_response.text}"
        created_id = create_response.json()["id"]
        print(f"Created test family delivery: {created_id}")
        
        # Verify it exists in list
        list_response = api_client.get(f"{BASE_URL}/api/family-deliveries")
        assert list_response.status_code == 200
        deliveries = list_response.json()
        found = any(d["id"] == created_id for d in deliveries)
        assert found, f"Created delivery {created_id} not found in list"
        print(f"Verified delivery exists in list")
        
        # Delete
        delete_response = api_client.delete(
            f"{BASE_URL}/api/family-deliveries/{created_id}",
            headers=headers
        )
        assert delete_response.status_code == 200, f"Delete failed: {delete_response.status_code}"
        print(f"Deleted test family delivery: {created_id}")
        
        # Verify deletion
        list_response2 = api_client.get(f"{BASE_URL}/api/family-deliveries")
        deliveries2 = list_response2.json()
        found_after_delete = any(d["id"] == created_id for d in deliveries2)
        assert not found_after_delete, f"Deleted delivery {created_id} still found in list"
        print("Verified delivery was deleted")
    
    def test_delete_nonexistent_family_delivery(self, api_client, auth_token):
        """Test DELETE /api/family-deliveries/{id} with non-existent ID"""
        response = api_client.delete(
            f"{BASE_URL}/api/family-deliveries/nonexistent-id-12345",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 404
        print("DELETE non-existent family delivery correctly returns 404")


class TestAdminAuth:
    """Test admin authentication"""
    
    def test_admin_login_success(self, api_client):
        """Test admin login with correct credentials"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "admin" in data
        assert data["admin"]["email"] == ADMIN_EMAIL
        print(f"Admin login successful: {data['admin']['name']}")
    
    def test_admin_login_invalid_credentials(self, api_client):
        """Test admin login with wrong password"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("Admin login with wrong password correctly returns 401")


class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_family_deliveries(self, authenticated_client):
        """Remove any TEST_ prefixed family deliveries"""
        response = authenticated_client.get(f"{BASE_URL}/api/family-deliveries")
        if response.status_code == 200:
            deliveries = response.json()
            deleted_count = 0
            for delivery in deliveries:
                caption = delivery.get("caption", "")
                if caption and caption.startswith("TEST_"):
                    del_response = authenticated_client.delete(f"{BASE_URL}/api/family-deliveries/{delivery['id']}")
                    if del_response.status_code == 200:
                        deleted_count += 1
            print(f"Cleaned up {deleted_count} test family deliveries")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
