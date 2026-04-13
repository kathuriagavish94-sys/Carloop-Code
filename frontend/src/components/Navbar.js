import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Phone, User, LogOut, Menu, X } from 'lucide-react';
import axios from 'axios';
import { CircularLogo } from './CircularLogo';
import { LeadCaptureModal } from './LeadCaptureModal';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = location.pathname.startsWith('/admin');
  const [customerUser, setCustomerUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLeadModal, setShowLeadModal] = useState(false);

  const checkCustomerAuth = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/customer/auth/me`, {
        withCredentials: true,
      });
      setCustomerUser(response.data);
    } catch (error) {
      setCustomerUser(null);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      checkCustomerAuth();
    }
  }, [isAdmin, checkCustomerAuth]);

  const handleLoginClick = () => {
    // Open lead capture modal instead of direct login
    setShowLeadModal(true);
  };

  const proceedToLogin = () => {
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

  // Admin navbar (when logged in)
  if (isAdmin && location.pathname !== '/admin/login' && !location.pathname.startsWith('/admin/forgot-password') && !location.pathname.startsWith('/admin/reset-password')) {
    return (
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/admin" className="flex items-center gap-3">
              <CircularLogo size="small" />
              <span className="font-outfit font-bold text-xl text-[#0F172A]">TruVant Admin</span>
            </Link>
            <button
              onClick={handleAdminLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 font-dmsans font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <>
      <nav className="bg-white/95 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3" data-testid="logo">
              <CircularLogo size="default" />
              <span className="hidden sm:block font-outfit font-bold text-xl md:text-2xl text-[#0F172A]">
                TruVant
              </span>
            </Link>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <Link
                to="/"
                className={`font-dmsans font-medium transition-colors ${
                  location.pathname === '/' ? 'text-[#2563EB]' : 'text-gray-700 hover:text-[#2563EB]'
                }`}
                data-testid="nav-home"
              >
                Home
              </Link>
              <Link
                to="/inventory"
                className={`font-dmsans font-medium transition-colors ${
                  location.pathname === '/inventory' ? 'text-[#2563EB]' : 'text-gray-700 hover:text-[#2563EB]'
                }`}
                data-testid="nav-inventory"
              >
                Inventory
              </Link>
              <Link
                to="/contact"
                className={`font-dmsans font-medium transition-colors ${
                  location.pathname === '/contact' ? 'text-[#2563EB]' : 'text-gray-700 hover:text-[#2563EB]'
                }`}
                data-testid="nav-contact"
              >
                Contact
              </Link>

              <a
                href="tel:8683996996"
                className="flex items-center space-x-2 text-[#2563EB] hover:text-[#1d4ed8] transition-colors font-dmsans font-semibold"
                data-testid="helpline-number"
              >
                <Phone className="h-4 w-4" />
                <span>8683-996-996</span>
              </a>

              {customerUser ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 px-4 py-2 bg-[#0F172A] text-white rounded-full hover:bg-[#1e293b] transition-colors font-dmsans font-medium"
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
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2">
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p className="font-dmsans text-sm font-semibold text-gray-900">{customerUser.name}</p>
                        <p className="font-dmsans text-xs text-gray-500 truncate">{customerUser.email}</p>
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
                  onClick={handleLoginClick}
                  className="flex items-center space-x-2 px-6 py-2.5 bg-[#2563EB] text-white rounded-full hover:bg-[#1d4ed8] transition-all duration-200 shadow-md hover:shadow-lg font-dmsans font-medium"
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
                <Link to="/" className="font-dmsans font-medium text-gray-700 hover:text-[#2563EB]" onClick={() => setMobileMenuOpen(false)}>
                  Home
                </Link>
                <Link to="/inventory" className="font-dmsans font-medium text-gray-700 hover:text-[#2563EB]" onClick={() => setMobileMenuOpen(false)}>
                  Inventory
                </Link>
                <Link to="/contact" className="font-dmsans font-medium text-gray-700 hover:text-[#2563EB]" onClick={() => setMobileMenuOpen(false)}>
                  Contact
                </Link>
                <a href="tel:8683996996" className="font-dmsans font-medium text-[#2563EB]">
                  Call: 8683-996-996
                </a>
                {!customerUser && (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLoginClick();
                    }}
                    className="flex items-center justify-center space-x-2 px-6 py-3 bg-[#2563EB] text-white rounded-full font-dmsans font-medium"
                  >
                    <User className="h-4 w-4" />
                    <span>Login</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Lead Capture Modal */}
      <LeadCaptureModal
        isOpen={showLeadModal}
        onClose={() => setShowLeadModal(false)}
        onSuccess={proceedToLogin}
      />
    </>
  );
};
