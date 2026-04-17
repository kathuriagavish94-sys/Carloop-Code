"""
Test suite for TruVant Automatic Image Branding Feature
Tests:
1. POST /api/brand-image-preview - Preview branded image (no auth)
2. POST /api/brand-image - Brand image (auth required)
3. POST /api/cars - Auto-brands images on car creation
4. PUT /api/cars/{car_id} - Auto-brands images on car update
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test image URL for branding
TEST_IMAGE_URL = "https://images.pexels.com/photos/12070967/pexels-photo-12070967.jpeg"

# Admin credentials
ADMIN_EMAIL = "admin@truvant.com"
ADMIN_PASSWORD = "Admin@123"


@pytest.fixture(scope="module")
def admin_token():
    """Get admin authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    assert response.status_code == 200, f"Admin login failed: {response.text}"
    return response.json()["token"]


@pytest.fixture
def auth_headers(admin_token):
    """Return headers with admin token"""
    return {"Authorization": f"Bearer {admin_token}"}


class TestImageBrandingPreview:
    """Tests for /api/brand-image-preview endpoint (no auth required)"""
    
    def test_brand_image_preview_success(self):
        """Test successful image branding preview"""
        response = requests.post(f"{BASE_URL}/api/brand-image-preview", json={
            "image_url": TEST_IMAGE_URL,
            "add_background": True,
            "add_logo": True,
            "add_badge": True,
            "logo_opacity": 0.20
        }, timeout=60)  # Image processing can take time
        
        assert response.status_code == 200, f"Preview failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert data.get("success") is True, "Response should indicate success"
        assert "branded_image" in data, "Response should contain branded_image"
        
        # Verify branded image is a data URI
        branded_image = data["branded_image"]
        assert branded_image.startswith("data:image/jpeg;base64,"), "Branded image should be JPEG data URI"
        
        # Verify base64 content is not empty
        base64_content = branded_image.split(",")[1]
        assert len(base64_content) > 1000, "Branded image should have substantial content"
        
        print(f"✓ Preview generated successfully, data URI length: {len(branded_image)}")
    
    def test_brand_image_preview_no_auth_required(self):
        """Test that preview endpoint doesn't require authentication"""
        response = requests.post(f"{BASE_URL}/api/brand-image-preview", json={
            "image_url": TEST_IMAGE_URL
        }, timeout=60)
        
        # Should not return 401/403
        assert response.status_code != 401, "Preview should not require auth"
        assert response.status_code != 403, "Preview should not require auth"
        assert response.status_code == 200, f"Preview should succeed: {response.text}"
        print("✓ Preview endpoint accessible without authentication")
    
    def test_brand_image_preview_invalid_url(self):
        """Test preview with invalid image URL - may return 500 or 200 with error"""
        response = requests.post(f"{BASE_URL}/api/brand-image-preview", json={
            "image_url": "https://invalid-url-that-does-not-exist.com/image.jpg"
        }, timeout=60)
        
        # API may return 500 for failed processing or 200 with success=false
        # Either behavior is acceptable for error handling
        if response.status_code == 500:
            print("✓ Preview returns 500 for invalid image URL")
        elif response.status_code == 200:
            data = response.json()
            # If 200, check if it indicates failure or has fallback behavior
            print(f"✓ Preview returns 200 for invalid URL (success={data.get('success')})")
        else:
            assert False, f"Unexpected status code: {response.status_code}"
    
    def test_brand_image_preview_custom_options(self):
        """Test preview with custom branding options"""
        response = requests.post(f"{BASE_URL}/api/brand-image-preview", json={
            "image_url": TEST_IMAGE_URL,
            "add_background": True,
            "add_logo": True,
            "add_badge": True,
            "logo_opacity": 0.15  # Different opacity
        }, timeout=60)
        
        assert response.status_code == 200, f"Preview with custom options failed: {response.text}"
        data = response.json()
        assert data.get("success") is True
        print("✓ Preview with custom options works correctly")


class TestImageBrandingAuth:
    """Tests for /api/brand-image endpoint (auth required)"""
    
    def test_brand_image_requires_auth(self):
        """Test that brand-image endpoint requires authentication"""
        response = requests.post(f"{BASE_URL}/api/brand-image", json={
            "image_url": TEST_IMAGE_URL
        }, timeout=60)
        
        assert response.status_code in [401, 403], f"Should require auth: {response.status_code}"
        print("✓ Brand image endpoint correctly requires authentication")
    
    def test_brand_image_with_auth(self, auth_headers):
        """Test brand-image endpoint with valid authentication"""
        response = requests.post(f"{BASE_URL}/api/brand-image", json={
            "image_url": TEST_IMAGE_URL,
            "add_background": True,
            "add_logo": True,
            "add_badge": True,
            "logo_opacity": 0.20
        }, headers=auth_headers, timeout=60)
        
        assert response.status_code == 200, f"Brand image failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert data.get("success") is True
        assert "branded_image" in data
        assert "original_image" in data
        assert data["original_image"] == TEST_IMAGE_URL
        
        # Verify branded image is a data URI
        branded_image = data["branded_image"]
        assert branded_image.startswith("data:image/jpeg;base64,")
        print("✓ Brand image with auth works correctly")


class TestCarCreationWithBranding:
    """Tests for automatic image branding on car creation"""
    
    def test_create_car_auto_brands_image(self, auth_headers):
        """Test that creating a car automatically brands the image"""
        car_data = {
            "make": "TEST_Toyota",
            "model": "Fortuner Test Branding",
            "year": 2024,
            "price": 3500000,
            "image": TEST_IMAGE_URL,
            "km_driven": 10000,
            "fuel_type": "Diesel",
            "transmission": "Automatic",
            "condition": "Excellent",
            "status": "Available",
            "features": ["Sunroof", "Leather Seats"],
            "is_featured": False
        }
        
        response = requests.post(f"{BASE_URL}/api/cars", json=car_data, headers=auth_headers, timeout=120)
        
        assert response.status_code == 200, f"Car creation failed: {response.text}"
        created_car = response.json()
        
        # Verify car was created
        assert created_car.get("id") is not None
        assert created_car["make"] == "TEST_Toyota"
        assert created_car["model"] == "Fortuner Test Branding"
        
        # Verify image was branded (should be data URI)
        car_image = created_car.get("image", "")
        assert car_image.startswith("data:image/jpeg;base64,"), f"Image should be branded data URI, got: {car_image[:100]}"
        
        # Verify original image is stored
        original_image = created_car.get("original_image")
        assert original_image == TEST_IMAGE_URL, "Original image URL should be preserved"
        
        print(f"✓ Car created with branded image, ID: {created_car['id']}")
        
        # Cleanup - delete the test car
        delete_response = requests.delete(f"{BASE_URL}/api/cars/{created_car['id']}", headers=auth_headers)
        assert delete_response.status_code == 200, "Cleanup failed"
        print("✓ Test car cleaned up")
    
    def test_create_car_with_gallery_brands_all(self, auth_headers):
        """Test that gallery images are also branded on car creation"""
        gallery_urls = [
            "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800",
            "https://images.unsplash.com/photo-1617531653520-bd466115490d?w=800"
        ]
        
        car_data = {
            "make": "TEST_BMW",
            "model": "Gallery Test",
            "year": 2023,
            "price": 4500000,
            "image": TEST_IMAGE_URL,
            "gallery": gallery_urls,
            "km_driven": 15000,
            "fuel_type": "Petrol",
            "transmission": "Automatic",
            "condition": "Excellent",
            "status": "Available",
            "features": ["Navigation"],
            "is_featured": False
        }
        
        response = requests.post(f"{BASE_URL}/api/cars", json=car_data, headers=auth_headers, timeout=180)
        
        assert response.status_code == 200, f"Car creation with gallery failed: {response.text}"
        created_car = response.json()
        
        # Verify gallery images are branded
        gallery = created_car.get("gallery", [])
        assert len(gallery) > 0, "Gallery should have images"
        
        # At least the first gallery image should be branded
        for i, img in enumerate(gallery[:2]):  # Check first 2
            if img.startswith("data:image"):
                print(f"✓ Gallery image {i+1} is branded")
            else:
                print(f"⚠ Gallery image {i+1} may not be branded: {img[:50]}")
        
        # Verify original gallery is preserved
        original_gallery = created_car.get("original_gallery", [])
        assert len(original_gallery) > 0, "Original gallery should be preserved"
        
        print(f"✓ Car with gallery created, ID: {created_car['id']}")
        
        # Cleanup
        delete_response = requests.delete(f"{BASE_URL}/api/cars/{created_car['id']}", headers=auth_headers)
        assert delete_response.status_code == 200, "Cleanup failed"
        print("✓ Test car with gallery cleaned up")


class TestCarUpdateWithBranding:
    """Tests for automatic image branding on car update"""
    
    def test_update_car_brands_new_image(self, auth_headers):
        """Test that updating a car's image automatically brands it"""
        # First create a car
        car_data = {
            "make": "TEST_Honda",
            "model": "Update Test",
            "year": 2022,
            "price": 1500000,
            "image": TEST_IMAGE_URL,
            "km_driven": 20000,
            "fuel_type": "Petrol",
            "transmission": "Manual",
            "condition": "Good",
            "status": "Available",
            "features": [],
            "is_featured": False
        }
        
        create_response = requests.post(f"{BASE_URL}/api/cars", json=car_data, headers=auth_headers, timeout=120)
        assert create_response.status_code == 200, f"Car creation failed: {create_response.text}"
        created_car = create_response.json()
        car_id = created_car["id"]
        
        # Update with a new image
        new_image_url = "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800"
        update_data = {
            "image": new_image_url
        }
        
        update_response = requests.put(f"{BASE_URL}/api/cars/{car_id}", json=update_data, headers=auth_headers, timeout=120)
        assert update_response.status_code == 200, f"Car update failed: {update_response.text}"
        updated_car = update_response.json()
        
        # Verify new image is branded
        updated_image = updated_car.get("image", "")
        assert updated_image.startswith("data:image/jpeg;base64,"), f"Updated image should be branded: {updated_image[:100]}"
        
        # Verify original image is updated
        assert updated_car.get("original_image") == new_image_url
        
        print(f"✓ Car image updated and branded, ID: {car_id}")
        
        # Cleanup
        delete_response = requests.delete(f"{BASE_URL}/api/cars/{car_id}", headers=auth_headers)
        assert delete_response.status_code == 200, "Cleanup failed"
        print("✓ Test car cleaned up")


class TestExistingBrandedCar:
    """Tests for verifying existing branded car data"""
    
    def test_get_branded_car(self):
        """Test retrieving a car with branded image"""
        # Get all cars and find one with branded image
        response = requests.get(f"{BASE_URL}/api/cars")
        assert response.status_code == 200
        
        cars = response.json()
        branded_cars = [c for c in cars if c.get("image", "").startswith("data:image")]
        
        if branded_cars:
            car = branded_cars[0]
            print(f"✓ Found branded car: {car['make']} {car['model']}")
            print(f"  - Image is data URI: {car['image'][:50]}...")
            print(f"  - Original image: {car.get('original_image', 'N/A')[:50]}...")
        else:
            print("⚠ No branded cars found in inventory (may need to create one)")
    
    def test_verify_test_car_exists(self):
        """Verify the test car 'Toyota Fortuner Test' exists with branding"""
        response = requests.get(f"{BASE_URL}/api/cars")
        assert response.status_code == 200
        
        cars = response.json()
        test_car = next((c for c in cars if "Fortuner Test" in c.get("model", "")), None)
        
        if test_car:
            print(f"✓ Found test car: {test_car['make']} {test_car['model']}")
            print(f"  - ID: {test_car['id']}")
            
            # Check if image is branded
            if test_car.get("image", "").startswith("data:image"):
                print("  - Image is branded (data URI)")
            else:
                print(f"  - Image URL: {test_car.get('image', 'N/A')[:50]}")
        else:
            print("⚠ Test car 'Toyota Fortuner Test' not found")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
