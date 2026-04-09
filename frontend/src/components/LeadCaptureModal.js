import React, { useState } from 'react';
import { X, User, Phone, Mail, Wallet, Car } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const LeadCaptureModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    budget: '',
    car_interest: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const budgetOptions = [
    { value: '', label: 'Select Budget (Optional)' },
    { value: 'under_5_lakh', label: 'Under ₹5 Lakh' },
    { value: '5_10_lakh', label: '₹5 - 10 Lakh' },
    { value: '10_20_lakh', label: '₹10 - 20 Lakh' },
    { value: '20_50_lakh', label: '₹20 - 50 Lakh' },
    { value: 'above_50_lakh', label: 'Above ₹50 Lakh' },
  ];

  const carTypeOptions = [
    { value: '', label: 'Select Car Type (Optional)' },
    { value: 'sedan', label: 'Sedan' },
    { value: 'suv', label: 'SUV' },
    { value: 'hatchback', label: 'Hatchback' },
    { value: 'luxury', label: 'Luxury' },
    { value: 'electric', label: 'Electric' },
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!/^[0-9]{10}$/.test(formData.mobile)) {
      newErrors.mobile = 'Enter a valid 10-digit mobile number';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSubmitting(true);

    try {
      await axios.post(`${API}/customer-leads`, {
        name: formData.name,
        email: formData.email,
        mobile: formData.mobile,
        budget: formData.budget || null,
        car_interest: formData.car_interest || null,
        source: 'login_click'
      });

      toast.success('Thank you! Redirecting to login...');
      
      // Clear form
      setFormData({
        name: '',
        mobile: '',
        email: '',
        budget: '',
        car_interest: '',
      });
      
      // Close modal and proceed to login
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 1000);

    } catch (error) {
      console.error('Error submitting lead:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // For mobile, only allow digits
    if (name === 'mobile') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({ ...prev, [name]: digitsOnly }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300"
        data-testid="lead-capture-modal"
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-[#0F172A] to-[#1e293b] px-6 py-8 text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            data-testid="close-lead-modal"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="w-16 h-16 bg-[#2563EB] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Car className="h-8 w-8 text-white" />
          </div>
          
          <h2 className="font-outfit font-bold text-2xl text-white mb-2">
            Access Exclusive Car Deals
          </h2>
          <p className="font-dmsans text-gray-300 text-sm">
            Share your details to continue
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block font-dmsans font-medium text-gray-700 mb-2 text-sm">
              Your Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your name"
                className={`w-full pl-12 pr-4 py-3 bg-gray-50 border ${errors.name ? 'border-red-400' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-[#2563EB] focus:border-transparent font-dmsans transition-all`}
                data-testid="lead-name-input"
              />
            </div>
            {errors.name && <p className="text-red-500 text-xs mt-1 font-dmsans">{errors.name}</p>}
          </div>

          {/* Mobile */}
          <div>
            <label className="block font-dmsans font-medium text-gray-700 mb-2 text-sm">
              Mobile Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="tel"
                name="mobile"
                value={formData.mobile}
                onChange={handleInputChange}
                placeholder="10-digit mobile number"
                maxLength="10"
                className={`w-full pl-12 pr-4 py-3 bg-gray-50 border ${errors.mobile ? 'border-red-400' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-[#2563EB] focus:border-transparent font-dmsans transition-all`}
                data-testid="lead-mobile-input"
              />
            </div>
            {errors.mobile && <p className="text-red-500 text-xs mt-1 font-dmsans">{errors.mobile}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block font-dmsans font-medium text-gray-700 mb-2 text-sm">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="your.email@example.com"
                className={`w-full pl-12 pr-4 py-3 bg-gray-50 border ${errors.email ? 'border-red-400' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-[#2563EB] focus:border-transparent font-dmsans transition-all`}
                data-testid="lead-email-input"
              />
            </div>
            {errors.email && <p className="text-red-500 text-xs mt-1 font-dmsans">{errors.email}</p>}
          </div>

          {/* Budget (Optional) */}
          <div>
            <label className="block font-dmsans font-medium text-gray-700 mb-2 text-sm">
              Budget Range
            </label>
            <div className="relative">
              <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                name="budget"
                value={formData.budget}
                onChange={handleInputChange}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2563EB] focus:border-transparent font-dmsans appearance-none cursor-pointer"
                data-testid="lead-budget-select"
              >
                {budgetOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Car Interest (Optional) */}
          <div>
            <label className="block font-dmsans font-medium text-gray-700 mb-2 text-sm">
              Interested Car Type
            </label>
            <div className="relative">
              <Car className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                name="car_interest"
                value={formData.car_interest}
                onChange={handleInputChange}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2563EB] focus:border-transparent font-dmsans appearance-none cursor-pointer"
                data-testid="lead-car-type-select"
              >
                {carTypeOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-[#2563EB] text-white rounded-xl font-dmsans font-semibold text-lg hover:bg-[#1d4ed8] transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            data-testid="lead-submit-button"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                Processing...
              </span>
            ) : (
              'Continue to Login'
            )}
          </button>

          <p className="text-center text-xs text-gray-500 font-dmsans mt-4">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </form>
      </div>
    </div>
  );
};
