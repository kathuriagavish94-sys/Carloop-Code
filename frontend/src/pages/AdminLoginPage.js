import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Car } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const AdminLoginPage = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/login`, credentials);
      localStorage.setItem('admin_token', response.data.token);
      localStorage.setItem('admin_user', JSON.stringify(response.data.admin));
      toast.success('Login successful!');
      navigate('/admin');
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ceramic flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                <Car className="h-10 w-10 text-white" />
              </div>
            </div>
            <h2 className="font-teko text-4xl font-bold text-forest uppercase" data-testid="login-title">
              Admin Login
            </h2>
            <p className="font-manrope text-gray-600 mt-2">Sign in to manage your inventory</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" data-testid="login-form">
            <div>
              <label className="block font-manrope font-semibold text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={credentials.email}
                onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                required
                placeholder="admin@carloop.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-manrope"
                data-testid="email-input"
              />
            </div>

            <div>
              <label className="block font-manrope font-semibold text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                required
                placeholder="Enter your password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-manrope"
                data-testid="password-input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-4 bg-primary text-white rounded-lg hover:bg-[#01352a] transition-colors font-manrope font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="login-submit-button"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="font-manrope text-sm text-gray-600 text-center">
              <strong>Demo Credentials:</strong><br />
              Email: admin@carloop.com<br />
              Password: admin123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};