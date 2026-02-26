import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Car, Heart, User as UserIcon, ShoppingBag } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const CustomerDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(location.state?.user || null);
  const [isAuthenticated, setIsAuthenticated] = useState(location.state?.user ? true : null);
  const [loading, setLoading] = useState(!location.state?.user);

  useEffect(() => {
    if (location.state?.user) return;
    
    const checkAuth = async () => {
      try {
        const response = await axios.get(`${API}/customer/auth/me`, {
          withCredentials: true,
        });
        setUser(response.data);
        setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(false);
        navigate('/');  
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate, location.state]);

  if (loading || isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-ceramic flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-ceramic py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center space-x-4 mb-6">
            {user.picture ? (
              <img src={user.picture} alt={user.name} className="h-20 w-20 rounded-full" />
            ) : (
              <div className="h-20 w-20 bg-primary rounded-full flex items-center justify-center">
                <UserIcon className="h-10 w-10 text-white" />
              </div>
            )}
            <div>
              <h1 className="font-teko text-4xl font-bold text-forest uppercase">Welcome, {user.name}!</h1>
              <p className="font-manrope text-gray-600">{user.email}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center hover:shadow-xl transition-shadow cursor-pointer" onClick={() => navigate('/inventory')}>
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Car className="h-8 w-8 text-white" />
            </div>
            <h3 className="font-teko text-2xl font-bold text-forest uppercase mb-2">Browse Inventory</h3>
            <p className="font-manrope text-gray-600">Explore our premium collection of vehicles</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 text-center hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="h-8 w-8 text-white" />
            </div>
            <h3 className="font-teko text-2xl font-bold text-forest uppercase mb-2">Saved Cars</h3>
            <p className="font-manrope text-gray-600">Coming Soon</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 text-center hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="h-8 w-8 text-white" />
            </div>
            <h3 className="font-teko text-2xl font-bold text-forest uppercase mb-2">My Bookings</h3>
            <p className="font-manrope text-gray-600">Coming Soon</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 mt-8">
          <h2 className="font-teko text-3xl font-bold text-forest uppercase mb-6">Quick Actions</h2>
          <div className="space-y-4">
            <button
              onClick={() => navigate('/inventory')}
              className="w-full px-6 py-4 bg-primary text-white rounded-lg hover:bg-[#01352a] transition-colors font-manrope font-bold text-left"
            >
              View All Vehicles
            </button>
            <button
              onClick={() => navigate('/contact')}
              className="w-full px-6 py-4 border-2 border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-colors font-manrope font-bold text-left"
            >
              Contact Us
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};