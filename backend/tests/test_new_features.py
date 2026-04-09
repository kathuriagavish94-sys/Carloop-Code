"""
Test suite for TruVant new features:
1. Customer Lead Capture API
2. Admin Forgot/Reset Password Flow
3. New Admin Credentials (admin@truvant.com / Admin@123)
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://carloop-dealer.preview.emergentagent.com').rstrip('/')

class TestAdminAuthentication:
    """Test admin authentication with both old and new credentials"""
    
    def test_login_with_new_truvant_admin(self):
        """Test login with new admin@truvant.com / Admin@123 credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@truvant.com",
            "password": "Admin@123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data, "Token not in response"
        assert "admin" in data, "Admin info not in response"
        assert data["admin"]["email"] == "admin@truvant.com"
        print(f"SUCCESS: New admin login works - admin@truvant.com")
    
    def test_login_with_old_carloop_admin(self):
        """Test login with legacy admin@carloop.com / admin123 credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@carloop.com",
            "password": "admin123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["admin"]["email"] == "admin@carloop.com"
        print(f"SUCCESS: Legacy admin login works - admin@carloop.com")
    
    def test_login_with_invalid_credentials(self):
        """Test login with wrong credentials returns 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@email.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("SUCCESS: Invalid credentials correctly rejected")


class TestCustomerLeads:
    """Test customer lead capture functionality"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token for authenticated requests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@truvant.com",
            "password": "Admin@123"
        })
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Admin authentication failed")
    
    def test_create_customer_lead(self):
        """Test creating a new customer lead"""
        unique_id = str(uuid.uuid4())[:8]
        lead_data = {
            "name": f"TEST_Lead_{unique_id}",
            "email": f"test_{unique_id}@example.com",
            "mobile": "9876543210",
            "budget": "10_20_lakh",
            "car_interest": "suv",
            "source": "login_click"
        }
        
        response = requests.post(f"{BASE_URL}/api/customer-leads", json=lead_data)
        assert response.status_code == 200, f"Create lead failed: {response.text}"
        
        data = response.json()
        assert data["name"] == lead_data["name"]
        assert data["email"] == lead_data["email"]
        assert data["mobile"] == lead_data["mobile"]
        assert data["budget"] == lead_data["budget"]
        assert data["car_interest"] == lead_data["car_interest"]
        assert data["source"] == lead_data["source"]
        assert "id" in data
        assert "created_at" in data
        print(f"SUCCESS: Customer lead created - {data['id']}")
        return data["id"]
    
    def test_create_lead_minimal_data(self):
        """Test creating lead with only required fields"""
        unique_id = str(uuid.uuid4())[:8]
        lead_data = {
            "name": f"TEST_MinimalLead_{unique_id}",
            "email": f"minimal_{unique_id}@example.com",
            "mobile": "1234567890",
            "source": "login_click"
        }
        
        response = requests.post(f"{BASE_URL}/api/customer-leads", json=lead_data)
        assert response.status_code == 200, f"Create lead failed: {response.text}"
        
        data = response.json()
        assert data["name"] == lead_data["name"]
        assert data["budget"] is None
        assert data["car_interest"] is None
        print("SUCCESS: Minimal lead created without optional fields")
    
    def test_get_customer_leads_requires_auth(self):
        """Test that getting leads requires admin authentication"""
        response = requests.get(f"{BASE_URL}/api/customer-leads")
        assert response.status_code in [401, 403], f"Expected auth error, got {response.status_code}"
        print("SUCCESS: Customer leads endpoint requires authentication")
    
    def test_get_customer_leads_with_auth(self, admin_token):
        """Test getting customer leads with admin token"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/customer-leads", headers=headers)
        assert response.status_code == 200, f"Get leads failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Retrieved {len(data)} customer leads")
    
    def test_search_customer_leads(self, admin_token):
        """Test searching customer leads"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/customer-leads?search=TEST", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Search returned {len(data)} leads matching 'TEST'")
    
    def test_filter_leads_by_source(self, admin_token):
        """Test filtering leads by source"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/customer-leads?source=login_click", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        for lead in data:
            assert lead["source"] == "login_click"
        print(f"SUCCESS: Filter by source returned {len(data)} leads")
    
    def test_export_customer_leads_csv(self, admin_token):
        """Test exporting customer leads as CSV"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/customer-leads/export", headers=headers)
        assert response.status_code == 200
        assert "text/csv" in response.headers.get("content-type", "")
        
        # Check CSV content
        csv_content = response.text
        assert "Name" in csv_content
        assert "Email" in csv_content
        assert "Mobile" in csv_content
        print("SUCCESS: CSV export works correctly")


class TestForgotPassword:
    """Test admin forgot/reset password flow"""
    
    def test_forgot_password_valid_email(self):
        """Test forgot password with valid admin email"""
        response = requests.post(f"{BASE_URL}/api/admin/forgot-password", json={
            "email": "admin@truvant.com"
        })
        assert response.status_code == 200, f"Forgot password failed: {response.text}"
        
        data = response.json()
        assert "message" in data
        print("SUCCESS: Forgot password request accepted for valid email")
    
    def test_forgot_password_invalid_email(self):
        """Test forgot password with non-existent email (should still return 200 to prevent enumeration)"""
        response = requests.post(f"{BASE_URL}/api/admin/forgot-password", json={
            "email": "nonexistent@example.com"
        })
        # Should return 200 to prevent email enumeration
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("SUCCESS: Forgot password returns 200 even for invalid email (prevents enumeration)")
    
    def test_verify_reset_token_invalid(self):
        """Test verifying an invalid reset token"""
        response = requests.get(f"{BASE_URL}/api/admin/verify-reset-token?token=invalid-token-123")
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("SUCCESS: Invalid reset token correctly rejected")
    
    def test_reset_password_invalid_token(self):
        """Test reset password with invalid token"""
        response = requests.post(f"{BASE_URL}/api/admin/reset-password", json={
            "token": "invalid-token-123",
            "new_password": "NewPassword123"
        })
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("SUCCESS: Reset password with invalid token correctly rejected")


class TestExistingFunctionality:
    """Verify existing functionality still works"""
    
    def test_get_cars(self):
        """Test getting car inventory"""
        response = requests.get(f"{BASE_URL}/api/cars")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        print(f"SUCCESS: Retrieved {len(data)} cars")
    
    def test_get_featured_cars(self):
        """Test getting featured cars"""
        response = requests.get(f"{BASE_URL}/api/cars?featured=true")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        for car in data:
            assert car["is_featured"] == True
        print(f"SUCCESS: Retrieved {len(data)} featured cars")
    
    def test_get_testimonials(self):
        """Test getting testimonials"""
        response = requests.get(f"{BASE_URL}/api/testimonials?active_only=true")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Retrieved {len(data)} testimonials")
    
    def test_create_enquiry(self):
        """Test creating a contact enquiry"""
        unique_id = str(uuid.uuid4())[:8]
        enquiry_data = {
            "name": f"TEST_Enquiry_{unique_id}",
            "email": f"enquiry_{unique_id}@example.com",
            "phone": "9876543210",
            "message": "Test enquiry message"
        }
        
        response = requests.post(f"{BASE_URL}/api/enquiries", json=enquiry_data)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == enquiry_data["name"]
        print("SUCCESS: Contact enquiry created")
    
    def test_create_callback_request(self):
        """Test creating a callback request"""
        unique_id = str(uuid.uuid4())[:8]
        callback_data = {
            "name": f"TEST_Callback_{unique_id}",
            "phone": "9876543210"
        }
        
        response = requests.post(f"{BASE_URL}/api/callback-requests", json=callback_data)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == callback_data["name"]
        print("SUCCESS: Callback request created")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
