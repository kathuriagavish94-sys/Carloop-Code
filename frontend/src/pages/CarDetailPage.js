import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Fuel, Gauge, Settings, CheckCircle, Phone, Mail } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const CarDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCallbackForm, setShowCallbackForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCarDetails();
  }, [id]);

  const fetchCarDetails = async () => {
    try {
      const response = await axios.get(`${API}/cars/${id}`);
      setCar(response.data);
    } catch (error) {
      console.error('Error fetching car details:', error);
      toast.error('Failed to load car details');
      navigate('/inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitCallback = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await axios.post(`${API}/callback-requests`, {
        ...formData,
        car_id: id,
      });
      toast.success('Callback request submitted! We will call you back soon.');
      setShowCallbackForm(false);
      setFormData({ name: '', phone: '' });
    } catch (error) {
      console.error('Error submitting callback:', error);
      toast.error('Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price) => {
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(2)} Crore`;
    } else if (price >= 100000) {
      return `₹${(price / 100000).toFixed(2)} Lakh`;
    }
    return `₹${price.toLocaleString('en-IN')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ceramic flex items-center justify-center" data-testid="loading-spinner">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!car) return null;

  return (
    <div className="min-h-screen bg-ceramic py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate('/inventory')}
          className="mb-6 font-manrope text-primary hover:underline"
          data-testid="back-button"
        >
          ← Back to Inventory
        </button>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="p-8">
              <img
                src={car.image}
                alt={`${car.make} ${car.model}`}
                className="w-full rounded-lg"
                data-testid="car-detail-image"
              />
            </div>

            <div className="p-8">
              <h1 className="font-teko text-5xl font-bold text-forest uppercase mb-2" data-testid="car-detail-title">
                {car.make} {car.model}
              </h1>
              <p className="font-teko text-4xl font-bold text-accent mb-6" data-testid="car-detail-price">
                {formatPrice(car.price)}
              </p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <Calendar className="h-6 w-6 text-primary" />
                  <div>
                    <p className="font-manrope text-sm text-gray-500">Year</p>
                    <p className="font-manrope font-semibold text-gray-900" data-testid="car-detail-year">{car.year}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <Gauge className="h-6 w-6 text-primary" />
                  <div>
                    <p className="font-manrope text-sm text-gray-500">KM Driven</p>
                    <p className="font-manrope font-semibold text-gray-900" data-testid="car-detail-km">{car.km_driven.toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <Fuel className="h-6 w-6 text-primary" />
                  <div>
                    <p className="font-manrope text-sm text-gray-500">Fuel Type</p>
                    <p className="font-manrope font-semibold text-gray-900" data-testid="car-detail-fuel">{car.fuel_type}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <Settings className="h-6 w-6 text-primary" />
                  <div>
                    <p className="font-manrope text-sm text-gray-500">Transmission</p>
                    <p className="font-manrope font-semibold text-gray-900" data-testid="car-detail-transmission">{car.transmission}</p>
                  </div>
                </div>
              </div>

              {car.features && car.features.length > 0 && (
                <div className="mb-8">
                  <h3 className="font-teko text-2xl font-bold text-forest uppercase mb-4">Features</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {car.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-accent" />
                        <span className="font-manrope text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <button
                  onClick={() => setShowCallbackForm(!showCallbackForm)}
                  className="w-full px-6 py-4 bg-primary text-white rounded-lg hover:bg-[#01352a] transition-colors font-manrope font-bold text-lg"
                  data-testid="callback-button"
                >
                  Get A Call Back
                </button>

                <div className="flex space-x-4">
                  <a
                    href="tel:+919876543210"
                    className="flex-1 px-6 py-3 border-2 border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-colors font-manrope font-semibold flex items-center justify-center space-x-2"
                  >
                    <Phone className="h-5 w-5" />
                    <span>Call Now</span>
                  </a>
                  <a
                    href="mailto:info@carloop.com"
                    className="flex-1 px-6 py-3 border-2 border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-colors font-manrope font-semibold flex items-center justify-center space-x-2"
                  >
                    <Mail className="h-5 w-5" />
                    <span>Email</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {showEnquiryForm && (
            <div className="border-t border-gray-200 p-8 bg-gray-50" data-testid="enquiry-form">
              <h3 className="font-teko text-3xl font-bold text-forest uppercase mb-6">Send Enquiry</h3>
              <form onSubmit={handleSubmitEnquiry} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input
                  type="text"
                  placeholder="Your Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-manrope"
                  data-testid="enquiry-name-input"
                />
                <input
                  type="email"
                  placeholder="Your Email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-manrope"
                  data-testid="enquiry-email-input"
                />
                <input
                  type="tel"
                  placeholder="Your Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-manrope"
                  data-testid="enquiry-phone-input"
                />
                <textarea
                  placeholder="Your Message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                  rows="4"
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-manrope md:col-span-2"
                  data-testid="enquiry-message-input"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="md:col-span-2 px-6 py-3 bg-accent text-white rounded-lg hover:bg-[#d94d0a] transition-colors font-manrope font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="enquiry-submit-button"
                >
                  {submitting ? 'Submitting...' : 'Submit Enquiry'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};