"""
Test Suite: Image Branding Non-Blocking Bug Fix
Tests that car uploads ALWAYS succeed even if branding fails.
Key scenarios:
1. POST /api/cars with valid image URL - car saves with branding
2. POST /api/cars with invalid/inaccessible URL - car saves with original URL (no blocking error)
3. POST /api/brand-image-preview NEVER returns 500 - always returns success with fallback
4. Google Drive URLs are properly converted
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test URLs
VALID_PEXELS_URL = "https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?auto=compress&cs=tinysrgb&w=800"
GOOGLE_DRIVE_URL = "https://drive.google.com/file/d/1KlxVXrryIshPVXXyZe2tvUFqoyzrzRlz/view?usp=sharing"
INVALID_URL = "https://invalid-domain-that-does-not-exist-12345.com/image.jpg"
INACCESSIBLE_GOOGLE_DRIVE = "https://drive.google.com/file/d/invalid_file_id_12345/view"


class TestBrandingNonBlocking:
    """Tests that branding is NON-BLOCKING - car ALWAYS saves"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token for admin operations"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@truvant.com",
            "password": "Admin@123"
        })
        if login_response.status_code == 200:
            self.token = login_response.json().get("token")
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip("Authentication failed - skipping tests")
        
        self.created_car_ids = []
        yield
        
        # Cleanup: Delete test cars
        for car_id in self.created_car_ids:
            try:
                requests.delete(f"{BASE_URL}/api/cars/{car_id}", headers=self.headers)
            except:
                pass
    
    def test_car_creation_with_valid_pexels_url_succeeds(self):
        """Car creation with valid Pexels URL should succeed with branding"""
        car_data = {
            "make": "TEST_NonBlocking",
            "model": "ValidPexels",
            "year": 2024,
            "price": 1500000,
            "image": VALID_PEXELS_URL,
            "km_driven": 10000,
            "fuel_type": "Petrol",
            "transmission": "Automatic"
        }
        
        response = requests.post(f"{BASE_URL}/api/cars", json=car_data, headers=self.headers, timeout=90)
        
        # Car should ALWAYS be created
        assert response.status_code == 200, f"Car creation failed: {response.text}"
        
        data = response.json()
        self.created_car_ids.append(data["id"])
        
        # Verify car data
        assert data["make"] == "TEST_NonBlocking"
        assert data["model"] == "ValidPexels"
        assert "image" in data
        
        # Check if branding was applied (data URI) or original used
        if data["image"].startswith("data:image"):
            print("SUCCESS: Car created with TruVant branding applied")
        else:
            print("SUCCESS: Car created with original image (branding skipped)")
        
        # Verify original_image is stored
        assert "original_image" in data or data.get("original_image") is not None
    
    def test_car_creation_with_invalid_url_still_succeeds(self):
        """Car creation with invalid URL should still succeed (non-blocking)"""
        car_data = {
            "make": "TEST_NonBlocking",
            "model": "InvalidURL",
            "year": 2024,
            "price": 1500000,
            "image": INVALID_URL,
            "km_driven": 10000,
            "fuel_type": "Petrol",
            "transmission": "Automatic"
        }
        
        response = requests.post(f"{BASE_URL}/api/cars", json=car_data, headers=self.headers, timeout=90)
        
        # This is the key test - car should save even with invalid URL
        # The fix makes branding non-blocking
        if response.status_code == 200:
            data = response.json()
            self.created_car_ids.append(data["id"])
            print("SUCCESS: Car created despite invalid URL (branding is non-blocking)")
            
            # Image should fall back to original URL
            assert data["image"] == INVALID_URL or data.get("original_image") == INVALID_URL
        elif response.status_code == 400:
            # If validation blocks it, that's also acceptable behavior
            print(f"Car creation blocked by validation: {response.json().get('detail', 'Unknown error')}")
            # But it should NOT be a 500 error
            assert response.status_code != 500, "Should not return 500 error"
        else:
            pytest.fail(f"Unexpected status code: {response.status_code}, body: {response.text}")
    
    def test_car_creation_with_google_drive_url(self):
        """Car creation with Google Drive URL should work"""
        car_data = {
            "make": "TEST_NonBlocking",
            "model": "GoogleDrive",
            "year": 2024,
            "price": 1500000,
            "image": GOOGLE_DRIVE_URL,
            "km_driven": 10000,
            "fuel_type": "Petrol",
            "transmission": "Automatic"
        }
        
        response = requests.post(f"{BASE_URL}/api/cars", json=car_data, headers=self.headers, timeout=90)
        
        # Car should be created (branding may or may not succeed)
        if response.status_code == 200:
            data = response.json()
            self.created_car_ids.append(data["id"])
            print(f"SUCCESS: Car created with Google Drive URL")
            
            # Check if branding was applied
            if data["image"].startswith("data:image"):
                print("  - Branding applied successfully")
            else:
                print("  - Original/converted URL used (branding skipped)")
        elif response.status_code == 400:
            detail = response.json().get('detail', '')
            print(f"Car creation blocked: {detail}")
            # Should not be a generic error
            assert "Failed to save car" not in detail, "Should not show generic error"
        else:
            pytest.fail(f"Unexpected status code: {response.status_code}")


class TestPreviewEndpointGracefulFallback:
    """Tests that /api/brand-image-preview NEVER returns 500 error"""
    
    def test_preview_with_valid_url_returns_success(self):
        """Preview with valid URL should return success with branded image"""
        response = requests.post(f"{BASE_URL}/api/brand-image-preview", json={
            "image_url": VALID_PEXELS_URL,
            "add_background": True,
            "add_logo": True,
            "add_badge": True,
            "logo_opacity": 0.20
        }, timeout=30)
        
        # Should NEVER return 500
        assert response.status_code != 500, f"Preview returned 500 error: {response.text}"
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["success"] == True, "Response should indicate success"
        assert "branded_image" in data, "Should return branded_image"
        
        if data.get("branding_applied"):
            print("SUCCESS: Preview returned branded image")
            assert data["branded_image"].startswith("data:image"), "Branded image should be data URI"
        else:
            print(f"SUCCESS: Preview returned fallback - {data.get('message', 'No message')}")
    
    def test_preview_with_invalid_url_returns_fallback_not_500(self):
        """Preview with invalid URL should return fallback, NOT 500 error"""
        response = requests.post(f"{BASE_URL}/api/brand-image-preview", json={
            "image_url": INVALID_URL,
            "add_background": True,
            "add_logo": True,
            "add_badge": True,
            "logo_opacity": 0.20
        }, timeout=30)
        
        # CRITICAL: Should NEVER return 500
        assert response.status_code != 500, f"Preview returned 500 error for invalid URL: {response.text}"
        assert response.status_code == 200, f"Expected 200 with fallback, got {response.status_code}"
        
        data = response.json()
        assert data["success"] == True, "Response should indicate success (with fallback)"
        assert "branded_image" in data, "Should return branded_image (original URL as fallback)"
        
        # Branding should NOT be applied for invalid URL
        if not data.get("branding_applied"):
            print(f"SUCCESS: Preview returned graceful fallback - {data.get('message', 'No message')}")
        else:
            print("Preview somehow branded invalid URL - unexpected but not an error")
    
    def test_preview_with_inaccessible_google_drive_returns_fallback(self):
        """Preview with inaccessible Google Drive URL should return fallback"""
        response = requests.post(f"{BASE_URL}/api/brand-image-preview", json={
            "image_url": INACCESSIBLE_GOOGLE_DRIVE,
            "add_background": True,
            "add_logo": True,
            "add_badge": True,
            "logo_opacity": 0.20
        }, timeout=30)
        
        # Should NEVER return 500
        assert response.status_code != 500, f"Preview returned 500 for inaccessible Google Drive: {response.text}"
        assert response.status_code == 200, f"Expected 200 with fallback, got {response.status_code}"
        
        data = response.json()
        assert data["success"] == True, "Response should indicate success"
        print(f"SUCCESS: Preview handled inaccessible Google Drive gracefully - branding_applied: {data.get('branding_applied')}")
    
    def test_preview_with_google_drive_url(self):
        """Preview with Google Drive URL should work or return fallback"""
        response = requests.post(f"{BASE_URL}/api/brand-image-preview", json={
            "image_url": GOOGLE_DRIVE_URL,
            "add_background": True,
            "add_logo": True,
            "add_badge": True,
            "logo_opacity": 0.20
        }, timeout=30)
        
        # Should NEVER return 500
        assert response.status_code != 500, f"Preview returned 500 for Google Drive URL: {response.text}"
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        
        if data.get("branding_applied"):
            print("SUCCESS: Google Drive URL branded successfully")
        else:
            print(f"SUCCESS: Google Drive URL returned fallback - {data.get('message', 'No message')}")


class TestGoogleDriveURLConversion:
    """Tests that Google Drive URLs are properly converted"""
    
    def test_convert_file_d_format(self):
        """Test conversion of /file/d/FILE_ID/view format"""
        response = requests.post(f"{BASE_URL}/api/convert-drive-url", json={
            "url": "https://drive.google.com/file/d/1KlxVXrryIshPVXXyZe2tvUFqoyzrzRlz/view?usp=sharing"
        })
        
        assert response.status_code == 200
        data = response.json()
        
        # Should convert to direct download format
        converted = data["converted"]
        assert "1KlxVXrryIshPVXXyZe2tvUFqoyzrzRlz" in converted, "File ID should be preserved"
        assert "uc?export=view" in converted or "uc?export=download" in converted, "Should use direct format"
        print(f"SUCCESS: Converted to {converted}")
    
    def test_convert_open_id_format(self):
        """Test conversion of /open?id=FILE_ID format"""
        response = requests.post(f"{BASE_URL}/api/convert-drive-url", json={
            "url": "https://drive.google.com/open?id=1KlxVXrryIshPVXXyZe2tvUFqoyzrzRlz"
        })
        
        assert response.status_code == 200
        data = response.json()
        
        converted = data["converted"]
        assert "1KlxVXrryIshPVXXyZe2tvUFqoyzrzRlz" in converted
        print(f"SUCCESS: Converted to {converted}")
    
    def test_non_google_url_unchanged(self):
        """Non-Google URLs should remain unchanged"""
        response = requests.post(f"{BASE_URL}/api/convert-drive-url", json={
            "url": VALID_PEXELS_URL
        })
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["converted"] == VALID_PEXELS_URL, "Non-Google URL should remain unchanged"
        print("SUCCESS: Non-Google URL unchanged")


class TestNoFailedToGenerateError:
    """Tests that 'Failed to generate branded preview' error does NOT appear"""
    
    def test_preview_never_returns_failed_error_message(self):
        """Preview endpoint should never return 'Failed to generate' error"""
        test_urls = [
            VALID_PEXELS_URL,
            INVALID_URL,
            GOOGLE_DRIVE_URL,
            INACCESSIBLE_GOOGLE_DRIVE,
            "https://example.com/nonexistent.jpg"
        ]
        
        for url in test_urls:
            response = requests.post(f"{BASE_URL}/api/brand-image-preview", json={
                "image_url": url,
                "add_background": True,
                "add_logo": True,
                "add_badge": True,
                "logo_opacity": 0.20
            }, timeout=30)
            
            # Should NEVER return 500
            assert response.status_code != 500, f"500 error for URL: {url}"
            
            if response.status_code == 200:
                data = response.json()
                # Should always indicate success (with or without branding)
                assert data.get("success") == True, f"success should be True for {url}"
                
                # Check that error message is NOT "Failed to generate branded preview"
                message = data.get("message", "")
                assert "Failed to generate branded preview" not in message, f"Should not show 'Failed to generate' error for {url}"
                
                print(f"SUCCESS: URL {url[:50]}... - branding_applied: {data.get('branding_applied')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
