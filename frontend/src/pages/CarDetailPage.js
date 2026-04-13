import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Calendar, Fuel, Gauge, Settings, CheckCircle, Phone, MessageCircle,
  ChevronLeft, Shield, Award, Users, MapPin, Share2
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const CarDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [showCallbackForm, setShowCallbackForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchCarDetails = useCallback(async () => {
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
  }, [id, navigate]);

  useEffect(() => {
    fetchCarDetails();
  }, [fetchCarDetails]);

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
      return `${(price / 10000000).toFixed(2)} Cr`;
    } else if (price >= 100000) {
      return `${(price / 100000).toFixed(2)} Lakh`;
    }
    return price.toLocaleString('en-IN');
  };

  const formatKm = (km) => {
    if (km >= 100000) return `${(km / 100000).toFixed(1)} Lakh km`;
    if (km >= 1000) return `${(km / 1000).toFixed(0)}K km`;
    return `${km} km`;
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${car.make} ${car.model} - TruVant`,
        text: `Check out this ${car.year} ${car.make} ${car.model} for ₹${formatPrice(car.price)}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const galleryImages = car?.gallery_urls?.length > 0 
    ? [car.image, ...car.gallery_urls] 
    : [car?.image];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" data-testid="loading-spinner">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
          <p className="mt-4 font-dmsans text-gray-600">Loading vehicle details...</p>
        </div>
      </div>
    );
  }

  if (!car) return null;

  const isSoldOrBooked = car.status === 'Sold' || car.status === 'Booked';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-[80px] z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/inventory')}
              className="flex items-center gap-2 font-dmsans text-gray-600 hover:text-gray-900 transition-colors"
              data-testid="back-button"
            >
              <ChevronLeft className="h-5 w-5" />
              <span>Back to Inventory</span>
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Share2 className="h-5 w-5" />
              <span className="hidden sm:inline font-dmsans">Share</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100">
              <img
                src={galleryImages[activeImage]}
                alt={`${car.make} ${car.model}`}
                className="w-full h-full object-cover"
                data-testid="car-detail-image"
              />
              {isSoldOrBooked && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className={`px-8 py-4 rounded-xl font-outfit font-bold text-3xl text-white ${
                    car.status === 'Sold' ? 'bg-red-600' : 'bg-yellow-500'
                  }`}>
                    {car.status.toUpperCase()}
                  </span>
                </div>
              )}
              {car.is_featured && !isSoldOrBooked && (
                <div className="absolute top-4 left-4 px-4 py-2 bg-orange-500 text-white rounded-lg font-dmsans font-semibold text-sm">
                  FEATURED
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {galleryImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {galleryImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      activeImage === index ? 'border-orange-500' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`View ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Car Details */}
          <div className="space-y-6">
            {/* Title & Price */}
            <div>
              <h1 className="font-outfit font-bold text-3xl md:text-4xl text-gray-900 mb-2" data-testid="car-detail-title">
                {car.year} {car.make} {car.model}
              </h1>
              <div className="flex items-baseline gap-2">
                <span className="font-outfit font-bold text-4xl text-orange-500" data-testid="car-detail-price">
                  ₹{formatPrice(car.price)}
                </span>
              </div>
            </div>

            {/* Quick Specs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-gray-200">
                <Calendar className="h-5 w-5 text-orange-500 mb-2" />
                <p className="font-dmsans text-xs text-gray-500">Year</p>
                <p className="font-dmsans font-semibold text-gray-900" data-testid="car-detail-year">{car.year}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-200">
                <Gauge className="h-5 w-5 text-orange-500 mb-2" />
                <p className="font-dmsans text-xs text-gray-500">KM Driven</p>
                <p className="font-dmsans font-semibold text-gray-900" data-testid="car-detail-km">{formatKm(car.km_driven)}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-200">
                <Fuel className="h-5 w-5 text-orange-500 mb-2" />
                <p className="font-dmsans text-xs text-gray-500">Fuel Type</p>
                <p className="font-dmsans font-semibold text-gray-900" data-testid="car-detail-fuel">{car.fuel_type}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-200">
                <Settings className="h-5 w-5 text-orange-500 mb-2" />
                <p className="font-dmsans text-xs text-gray-500">Transmission</p>
                <p className="font-dmsans font-semibold text-gray-900" data-testid="car-detail-transmission">{car.transmission}</p>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full">
                <Shield className="h-4 w-4" />
                <span className="font-dmsans text-sm font-medium">Verified</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full">
                <Award className="h-4 w-4" />
                <span className="font-dmsans text-sm font-medium">{car.owners || 1} Owner</span>
              </div>
              {car.rto && (
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-full">
                  <MapPin className="h-4 w-4" />
                  <span className="font-dmsans text-sm font-medium">{car.rto}</span>
                </div>
              )}
            </div>

            {/* Features */}
            {car.features && car.features.length > 0 && (
              <div className="bg-white p-6 rounded-2xl border border-gray-200">
                <h3 className="font-outfit font-semibold text-lg text-gray-900 mb-4">Features</h3>
                <div className="grid grid-cols-2 gap-3">
                  {car.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span className="font-dmsans text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA Buttons */}
            {!isSoldOrBooked && (
              <div className="space-y-3">
                <button
                  onClick={() => setShowCallbackForm(!showCallbackForm)}
                  className="w-full px-6 py-4 bg-orange-500 text-white rounded-full font-dmsans font-semibold text-lg hover:bg-orange-600 transition-all duration-200 shadow-lg hover:shadow-xl"
                  data-testid="callback-button"
                >
                  Get A Call Back
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <a
                    href="tel:8683996996"
                    className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-900 text-gray-900 rounded-full font-dmsans font-semibold hover:bg-gray-900 hover:text-white transition-colors"
                  >
                    <Phone className="h-5 w-5" />
                    <span>Call Now</span>
                  </a>
                  <a
                    href={`https://wa.me/918683996996?text=${encodeURIComponent(`Hi! I'm interested in ${car.year} ${car.make} ${car.model} priced at ₹${formatPrice(car.price)}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white rounded-full font-dmsans font-semibold hover:bg-green-600 transition-colors"
                  >
                    <MessageCircle className="h-5 w-5" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            )}

            {/* Callback Form */}
            {showCallbackForm && !isSoldOrBooked && (
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200" data-testid="callback-form">
                <h3 className="font-outfit font-semibold text-lg text-gray-900 mb-4">Request A Call Back</h3>
                <form onSubmit={handleSubmitCallback} className="space-y-4">
                  <input
                    type="text"
                    placeholder="Your Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent font-dmsans"
                    data-testid="callback-name-input"
                  />
                  <input
                    type="tel"
                    placeholder="Your Mobile Number"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    pattern="[0-9]{10}"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent font-dmsans"
                    data-testid="callback-phone-input"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full px-6 py-3 bg-gray-900 text-white rounded-full font-dmsans font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    data-testid="callback-submit-button"
                  >
                    {submitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                </form>
                <p className="mt-3 text-xs text-gray-500 font-dmsans">
                  Our team will call you back within 2 hours during business hours.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
