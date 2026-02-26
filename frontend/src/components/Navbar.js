import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Car } from 'lucide-react';

export const Navbar = () => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const token = localStorage.getItem('admin_token');

  const handleLogout = () => {
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
              onClick={handleLogout}
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
          <Link to="/" className="flex items-center space-x-2" data-testid="logo">
            <Car className="h-10 w-10 text-primary" />
            <span className="font-teko text-3xl font-bold text-primary tracking-wide">CARLOOP</span>
          </Link>
          
          <div className="hidden md:flex space-x-8 font-manrope font-medium">
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

          <Link
            to="/admin/login"
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-[#01352a] transition-colors font-manrope font-semibold"
            data-testid="admin-login-link"
          >
            Admin
          </Link>
        </div>
      </div>
    </nav>
  );
};