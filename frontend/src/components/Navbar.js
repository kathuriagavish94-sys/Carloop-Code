import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Car, Phone, User, LogOut } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = location.pathname.startsWith('/admin');
  const adminToken = localStorage.getItem('admin_token');
  const [customerUser, setCustomerUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

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
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
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
            <Link to="/admin" className="flex items-center space-x-2" data-testid="admin-logo">
              <Car className="h-8 w-8 text-primary" />
              <span className="font-teko text-2xl font-bold text-primary">CARLOOP ADMIN</span>
            </Link>
            <button
              onClick={handleAdminLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-manrope"
              data-testid="logout-button"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="glass-nav sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link to="/" className="flex items-center space-x-3" data-testid="logo">
            <img 
              src="https://customer-assets.emergentagent.com/job_carloop-dealer/artifacts/ouflwbng_Bold%20%27Carloop%27%20Logo%20with%20Circular%20Emblem.png" 
              alt="Carloop" 
              className="h-12 w-auto"
            />
          </Link>
          
          <div className="hidden md:flex items-center space-x-8">
            <div className="flex space-x-8 font-manrope font-medium">
              <Link
                to="/"
                className={`hover:text-primary transition-colors ${location.pathname === '/' ? 'text-primary' : 'text-gray-700'}`}
                data-testid="nav-home"
              >
                Home
              </Link>
              <Link
                to="/inventory"
                className={`hover:text-primary transition-colors ${location.pathname === '/inventory' ? 'text-primary' : 'text-gray-700'}`}
                data-testid="nav-inventory"
              >
                Inventory
              </Link>
              <Link
                to="/contact"
                className={`hover:text-primary transition-colors ${location.pathname === '/contact' ? 'text-primary' : 'text-gray-700'}`}
                data-testid="nav-contact"
              >
                Contact
              </Link>
            </div>

            <a
              href="tel:8683996996"
              className="flex items-center space-x-2 text-accent hover:text-[#d94d0a] transition-colors font-manrope font-semibold"
              data-testid="helpline-number"
            >
              <Phone className="h-5 w-5" />
              <span>8683-996-996</span>
            </a>

            {customerUser ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-[#01352a] transition-colors font-manrope font-semibold"
                  data-testid="user-menu-button"
                >
                  {customerUser.picture ? (
                    <img src={customerUser.picture} alt={customerUser.name} className="h-6 w-6 rounded-full" />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                  <span className="max-w-[100px] truncate">{customerUser.name}</span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="font-manrope text-sm font-semibold text-gray-900">{customerUser.name}</p>
                      <p className="font-manrope text-xs text-gray-600 truncate">{customerUser.email}</p>
                    </div>
                    <button
                      onClick={handleCustomerLogout}
                      className="w-full px-4 py-2 text-left font-manrope text-sm text-red-600 hover:bg-gray-50 flex items-center space-x-2"
                      data-testid="customer-logout-button"
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
                className="flex items-center space-x-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-[#01352a] transition-colors font-manrope font-semibold"
                data-testid="customer-login-button"
              >
                <User className="h-5 w-5" />
                <span>Login</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
