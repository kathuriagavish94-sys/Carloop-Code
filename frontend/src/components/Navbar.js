import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Phone, User, LogOut, Menu, X } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = location.pathname.startsWith('/admin');
  const [customerUser, setCustomerUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      checkCustomerAuth();
    }
  }, [location.pathname]);

  const checkCustomerAuth = async () => {
    try {
      const response = await axios.get(`${API}/customer/auth/me`, {
        withCredentials: true,
      });
      setCustomerUser(response.data);
    } catch (error) {
      setCustomerUser(null);
    }
  };

  const handleCustomerLogin = () => {
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const handleCustomerLogout = async () => {
    try {
      await axios.post(`${API}/customer/auth/logout`, {}, { withCredentials: true });
      setCustomerUser(null);
      setShowUserMenu(false);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('admin_token');
    window.location.href = '/';
  };

  if (isAdmin && location.pathname !== '/admin/login') {
    return (
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/admin" className="flex items-center space-x-2">
              <img 
                src="https://customer-assets.emergentagent.com/job_carloop-dealer/artifacts/1p0vv1ry_Gemini_Generated_Image_sp7phhsp7phhsp7p.png" 
                alt="TruVant Admin" 
                className="h-12 w-auto"
              />
            </Link>
            <button
              onClick={handleAdminLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 font-dmsans font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link to="/" className="flex items-center" data-testid="logo">
            <img 
              src="https://customer-assets.emergentagent.com/job_carloop-dealer/artifacts/1p0vv1ry_Gemini_Generated_Image_sp7phhsp7phhsp7p.png" 
              alt="TruVant" 
              className="h-14 w-auto"
            />
          </Link>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className={`font-dmsans font-medium hover:text-accent transition-colors ${
                location.pathname === '/' ? 'text-accent' : 'text-text-primary'
              }`}
              data-testid="nav-home"
            >
              Home
            </Link>
            <Link
              to="/inventory"
              className={`font-dmsans font-medium hover:text-accent transition-colors ${
                location.pathname === '/inventory' ? 'text-accent' : 'text-text-primary'
              }`}
              data-testid="nav-inventory"
            >
              Inventory
            </Link>
            <Link
              to="/contact"
              className={`font-dmsans font-medium hover:text-accent transition-colors ${
                location.pathname === '/contact' ? 'text-accent' : 'text-text-primary'
              }`}
              data-testid="nav-contact"
            >
              Contact
            </Link>

            <a
              href="tel:8683996996"
              className="flex items-center space-x-2 text-accent hover:text-accent-hover transition-colors font-dmsans font-semibold"
              data-testid="helpline-number"
            >
              <Phone className="h-4 w-4" />
              <span>8683-996-996</span>
            </a>

            {customerUser ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-full hover:bg-primary-hover transition-colors font-dmsans font-medium"
                  data-testid="user-menu-button"
                >
                  {customerUser.picture ? (
                    <img src={customerUser.picture} alt={customerUser.name} className="h-6 w-6 rounded-full" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                  <span className="max-w-[100px] truncate">{customerUser.name}</span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-card border border-gray-200 py-2">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="font-dmsans text-sm font-semibold text-text-primary">{customerUser.name}</p>
                      <p className="font-dmsans text-xs text-text-muted truncate">{customerUser.email}</p>
                    </div>
                    <button
                      onClick={handleCustomerLogout}
                      className="w-full px-4 py-2 text-left font-dmsans text-sm text-red-600 hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleCustomerLogin}
                className="flex items-center space-x-2 px-6 py-2 bg-primary text-white rounded-full hover:bg-primary-hover transition-all duration-200 hover:shadow-button font-dmsans font-medium"
                data-testid="customer-login-button"
              >
                <User className="h-4 w-4" />
                <span>Login</span>
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-4">
              <Link to="/" className="font-dmsans font-medium text-text-primary hover:text-accent">
                Home
              </Link>
              <Link to="/inventory" className="font-dmsans font-medium text-text-primary hover:text-accent">
                Inventory
              </Link>
              <Link to="/contact" className="font-dmsans font-medium text-text-primary hover:text-accent">
                Contact
              </Link>
              <a href="tel:8683996996" className="font-dmsans font-medium text-accent">
                Call: 8683-996-996
              </a>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};