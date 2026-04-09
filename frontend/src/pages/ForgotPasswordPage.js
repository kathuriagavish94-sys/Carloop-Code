import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { CircularLogo } from '../components/CircularLogo';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API}/admin/forgot-password`, { email });
      setSubmitted(true);
      toast.success('Password reset link sent to your email');
    } catch (error) {
      console.error('Forgot password error:', error);
      // Still show success to prevent email enumeration
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="font-outfit font-bold text-2xl text-[#0F172A] mb-2">
              Check Your Email
            </h2>
            <p className="font-dmsans text-gray-600 mb-6">
              If an account exists with <span className="font-semibold">{email}</span>, you will receive a password reset link shortly.
            </p>
            <button
              onClick={() => navigate('/admin/login')}
              className="font-dmsans text-[#2563EB] hover:underline flex items-center justify-center gap-2 mx-auto"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <CircularLogo size="default" />
            </div>
            <h2 className="font-outfit font-bold text-2xl text-[#0F172A] mb-2" data-testid="forgot-password-title">
              Forgot Password?
            </h2>
            <p className="font-dmsans text-gray-600 text-sm">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" data-testid="forgot-password-form">
            <div>
              <label className="block font-dmsans font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@truvant.com"
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2563EB] focus:border-transparent font-dmsans"
                  data-testid="forgot-email-input"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#2563EB] text-white rounded-xl font-dmsans font-semibold text-lg hover:bg-[#1d4ed8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="forgot-password-submit"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/admin/login')}
              className="font-dmsans text-sm text-gray-600 hover:text-[#2563EB] flex items-center justify-center gap-2 mx-auto"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </button>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-xl">
            <p className="font-dmsans text-sm text-blue-700 text-center">
              <strong>Default Admin:</strong><br />
              Email: admin@truvant.com<br />
              Password: Admin@123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
