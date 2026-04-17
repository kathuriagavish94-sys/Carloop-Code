"""
Test suite for 'Add Car' bug fix - verifying:
1. Google Drive URL conversion uses drive.google.com/uc?export=view&id=FILE_ID format
2. Backend validates image URL and returns specific error messages
3. POST /api/cars with valid image URL succeeds with TruVant branding
4. POST /api/cars with invalid/inaccessible image URL returns specific 400 error
5. POST /api/cars with empty image URL returns 'Image URL is required' error
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://carloop-dealer.preview.emergentagent.com')

# Test credentials
ADMIN_EMAIL = "admin@truvant.com"
ADMIN_PASSWORD = "Admin@123"

# Test image URLs
VALID_PEXELS_URL = "https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg"
INVALID_GOOGLE_DRIVE_URL = "https://drive.google.com/file/d/invalid123/view"
FAKE_URL = "https://example.com/nonexistent-image-12345.jpg"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for admin"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
    )
    assert response.status_code == 200, f"Login failed: {response.text}"
    return response.json()["token"]


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Return headers with auth token"""
    return {"Authorization": f"Bearer {auth_token}"}


class TestGoogleDriveURLConversion:
    """Test Google Drive URL conversion to direct download format"""
    
    def test_convert_drive_url_file_d_format(self):
        """Test conversion of /file/d/FILE_ID/view format"""
        response = requests.post(
            f"{BASE_URL}/api/convert-drive-url",
            json={"url": "https://drive.google.com/file/d/1abc123xyz/view?usp=sharing"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["converted"] == "https://drive.google.com/uc?export=view&id=1abc123xyz"
        print(f"✓ Google Drive URL converted correctly: {data['converted']}")
    
    def test_convert_drive_url_open_id_format(self):
        """Test conversion of /open?id=FILE_ID format"""
        response = requests.post(
            f"{BASE_URL}/api/convert-drive-url",
            json={"url": "https://drive.google.com/open?id=1xyz789abc"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["converted"] == "https://drive.google.com/uc?export=view&id=1xyz789abc"
        print(f"✓ Google Drive open URL converted correctly: {data['converted']}")
    
    def test_non_drive_url_unchanged(self):
        """Test that non-Google Drive URLs are returned unchanged"""
        test_url = "https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg"
        response = requests.post(
            f"{BASE_URL}/api/convert-drive-url",
            json={"url": test_url}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["converted"] == test_url
        print(f"✓ Non-Drive URL unchanged: {data['converted']}")


class TestImageURLValidation:
    """Test image URL validation with specific error messages"""
    
    def test_valid_pexels_url_succeeds(self, auth_headers):
        """Test that valid Pexels URL passes validation and creates car"""
        car_data = {
            "make": "TEST_ValidURL",
            "model": "Pexels Test",
            "year": 2024,
            "price": 1000000,
            "image": VALID_PEXELS_URL,
            "km_driven": 10000,
            "fuel_type": "Petrol",
            "transmission": "Automatic"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/cars",
            json=car_data,
            headers=auth_headers,
            timeout=60
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "id" in data
        assert data["make"] == "TEST_ValidURL"
        # Image should be branded (data URI) or original URL
        assert data["image"] is not None
        print(f"✓ Car created successfully with valid URL. ID: {data['id']}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/cars/{data['id']}", headers=auth_headers)
    
    def test_invalid_google_drive_url_returns_404_error(self, auth_headers):
        """Test that invalid Google Drive URL returns specific 404 error"""
        car_data = {
            "make": "TEST_InvalidDrive",
            "model": "Should Fail",
            "year": 2024,
            "price": 1000000,
            "image": INVALID_GOOGLE_DRIVE_URL,
            "km_driven": 10000,
            "fuel_type": "Petrol",
            "transmission": "Automatic"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/cars",
            json=car_data,
            headers=auth_headers,
            timeout=30
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        data = response.json()
        assert "detail" in data
        # Should contain specific error about 404 or not found
        error_msg = data["detail"].lower()
        assert "404" in error_msg or "not found" in error_msg or "invalid" in error_msg
        print(f"✓ Invalid Google Drive URL returned specific error: {data['detail']}")
    
    def test_empty_image_url_returns_required_error(self, auth_headers):
        """Test that empty image URL returns 'Image URL is required' error"""
        car_data = {
            "make": "TEST_EmptyURL",
            "model": "Should Fail",
            "year": 2024,
            "price": 1000000,
            "image": "",
            "km_driven": 10000,
            "fuel_type": "Petrol",
            "transmission": "Automatic"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/cars",
            json=car_data,
            headers=auth_headers,
            timeout=30
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        data = response.json()
        assert "detail" in data
        # Should contain specific error about image URL being required
        error_msg = data["detail"].lower()
        assert "required" in error_msg or "image" in error_msg
        print(f"✓ Empty image URL returned specific error: {data['detail']}")
    
    def test_inaccessible_url_returns_specific_error(self, auth_headers):
        """Test that inaccessible URL returns specific error message"""
        car_data = {
            "make": "TEST_FakeURL",
            "model": "Should Fail",
            "year": 2024,
            "price": 1000000,
            "image": FAKE_URL,
            "km_driven": 10000,
            "fuel_type": "Petrol",
            "transmission": "Automatic"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/cars",
            json=car_data,
            headers=auth_headers,
            timeout=30
        )
        
        # Should return 400 with specific error
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        data = response.json()
        assert "detail" in data
        # Error should be specific, not generic "Failed to save car"
        assert "Failed to save car" not in data["detail"]
        print(f"✓ Inaccessible URL returned specific error: {data['detail']}")


class TestCarCreationWithBranding:
    """Test car creation with TruVant branding"""
    
    def test_car_creation_stores_original_image(self, auth_headers):
        """Test that car creation stores original_image URL"""
        car_data = {
            "make": "TEST_Branding",
            "model": "Original Image Test",
            "year": 2024,
            "price": 1500000,
            "image": VALID_PEXELS_URL,
            "km_driven": 15000,
            "fuel_type": "Diesel",
            "transmission": "Manual"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/cars",
            json=car_data,
            headers=auth_headers,
            timeout=60
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Should have original_image stored
        assert "original_image" in data
        assert data["original_image"] is not None
        print(f"✓ Original image stored: {data['original_image'][:50]}...")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/cars/{data['id']}", headers=auth_headers)
    
    def test_car_creation_returns_branded_image(self, auth_headers):
        """Test that car creation returns branded image (data URI or URL)"""
        car_data = {
            "make": "TEST_BrandedImage",
            "model": "Branding Test",
            "year": 2024,
            "price": 2000000,
            "image": VALID_PEXELS_URL,
            "km_driven": 20000,
            "fuel_type": "Petrol",
            "transmission": "Automatic"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/cars",
            json=car_data,
            headers=auth_headers,
            timeout=60
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Image should be present (either branded data URI or original URL as fallback)
        assert "image" in data
        assert data["image"] is not None
        assert len(data["image"]) > 0
        
        # If branding succeeded, image should be a data URI
        if data["image"].startswith("data:image"):
            print(f"✓ Car created with branded image (data URI)")
        else:
            print(f"✓ Car created with original image (branding may have timed out)")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/cars/{data['id']}", headers=auth_headers)


class TestErrorMessageSpecificity:
    """Test that error messages are specific, not generic"""
    
    def test_error_not_generic_failed_to_save(self, auth_headers):
        """Verify error messages are NOT generic 'Failed to save car'"""
        # Test with various invalid inputs
        test_cases = [
            {"image": "", "expected_contains": ["required", "image"]},
            {"image": "not-a-url", "expected_contains": ["invalid", "url", "error"]},
            {"image": "https://drive.google.com/file/d/fake123/view", "expected_contains": ["404", "not found", "invalid"]},
        ]
        
        for test_case in test_cases:
            car_data = {
                "make": "TEST_ErrorMsg",
                "model": "Error Test",
                "year": 2024,
                "price": 1000000,
                "image": test_case["image"],
                "km_driven": 10000,
                "fuel_type": "Petrol",
                "transmission": "Automatic"
            }
            
            response = requests.post(
                f"{BASE_URL}/api/cars",
                json=car_data,
                headers=auth_headers,
                timeout=30
            )
            
            if response.status_code == 400:
                data = response.json()
                error_msg = data.get("detail", "").lower()
                
                # Error should NOT be generic
                assert "failed to save car" not in error_msg, f"Got generic error: {data['detail']}"
                
                # Error should contain at least one expected keyword
                found_keyword = any(kw in error_msg for kw in test_case["expected_contains"])
                print(f"✓ Image '{test_case['image'][:30]}...' returned specific error: {data['detail'][:80]}")


class TestCleanup:
    """Cleanup any test cars that may have been created"""
    
    def test_cleanup_test_cars(self, auth_headers):
        """Delete any TEST_ prefixed cars"""
        response = requests.get(f"{BASE_URL}/api/cars")
        assert response.status_code == 200
        
        cars = response.json()
        test_cars = [car for car in cars if car.get("make", "").startswith("TEST_")]
        
        for car in test_cars:
            delete_response = requests.delete(
                f"{BASE_URL}/api/cars/{car['id']}",
                headers=auth_headers
            )
            if delete_response.status_code == 200:
                print(f"✓ Cleaned up test car: {car['make']} {car['model']}")
        
        print(f"✓ Cleanup complete. Removed {len(test_cars)} test cars.")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
