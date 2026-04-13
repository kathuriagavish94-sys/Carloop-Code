import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { PremiumCarCard } from '../components/PremiumCarCard';
import { 
  Search, Shield, FileCheck, Truck, CreditCard, 
  CheckCircle2, Award, Clock, HeadphonesIcon, TrendingUp,
  ChevronRight, Star, MapPin, Heart
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const HomePage = () => {
  const [featuredCars, setFeaturedCars] = useState([]);
  const [recentlySoldCars, setRecentlySoldCars] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchFeaturedCars = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/cars?featured=true`);
      setFeaturedCars(response.data.slice(0, 6));
    } catch (error) {
      console.error('Error fetching featured cars:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRecentlySoldCars = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/cars/recently-sold?limit=4`);
      setRecentlySoldCars(response.data);
    } catch (error) {
      console.error('Error fetching recently sold cars:', error);
    }
  }, []);

  const fetchDeliveries = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/delivery-images?limit=6`);
      setDeliveries(response.data);
    } catch (error) {
      console.error('Error fetching deliveries:', error);
    }
  }, []);

  const fetchTestimonials = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/testimonials?active_only=true`);
      setTestimonials(response.data.slice(0, 3));
    } catch (error) {
      console.error('Error fetching testimonials:', error);
    }
  }, []);

  useEffect(() => {
    fetchFeaturedCars();
    fetchRecentlySoldCars();
    fetchDeliveries();
    fetchTestimonials();
  }, [fetchFeaturedCars, fetchRecentlySoldCars, fetchDeliveries, fetchTestimonials]);

  const trustBadges = [
    { icon: Shield, title: 'Verified Cars', description: 'Every car inspected by experts' },
    { icon: FileCheck, title: 'No Hidden Charges', description: 'Transparent pricing guaranteed' },
    { icon: CreditCard, title: 'RC Transfer Support', description: 'Complete documentation help' },
    { icon: Award, title: 'Loan Assistance', description: 'Easy financing options' },
    { icon: Truck, title: 'Home Delivery', description: 'Doorstep delivery available' }
  ];

  const whyBuyFromUs = [
    { icon: CheckCircle2, title: 'Carefully Selected', description: 'Handpicked quality vehicles' },
    { icon: Shield, title: 'Verified Docs', description: 'All papers checked' },
    { icon: TrendingUp, title: 'Fair Pricing', description: 'Best market rates' },
    { icon: Clock, title: 'Quick Delivery', description: 'Fast processing' },
    { icon: HeadphonesIcon, title: 'After Sales', description: '24/7 support' }
  ];

  const budgetCategories = [
    { label: 'Under ₹2 Lakh', image: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=400' },
    { label: 'Under ₹3 Lakh', image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400' },
    { label: 'Under ₹5 Lakh', image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400' },
    { label: 'SUV Under Budget', image: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=400' },
    { label: 'Automatic Cars', image: 'https://images.unsplash.com/photo-1617531653520-bd466115490d?w=400' }
  ];

  const formatPrice = (price) => {
    if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
    if (price >= 100000) return `₹${(price / 100000).toFixed(2)} L`;
    return `₹${price.toLocaleString('en-IN')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section 
        className="relative min-h-screen flex items-center bg-cover bg-center"
        style={{
          backgroundImage: 'linear-gradient(rgba(15, 23, 42, 0.85), rgba(15, 23, 42, 0.75)), url(https://images.unsplash.com/photo-1758311177173-f1ffc7fa09bc?w=1920)'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="max-w-3xl">
            <h1 className="font-bold text-5xl md:text-6xl lg:text-7xl text-white mb-6 leading-tight">
              Buy Trusted Used Cars
              <br />
              <span className="text-orange-500">Without the Stress</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 mb-8">
              Inspected | Verified | Transparent Pricing | Fast Delivery
            </p>

            <div className="bg-white bg-opacity-10 backdrop-blur-lg border border-white border-opacity-20 rounded-2xl p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <select className="px-4 py-3 bg-white rounded-xl text-gray-900 focus:ring-2 focus:ring-orange-500 border-0">
                  <option value="">Search by Budget</option>
                  <option value="200000">Under ₹2 Lakh</option>
                  <option value="300000">Under ₹3 Lakh</option>
                  <option value="500000">Under ₹5 Lakh</option>
                  <option value="1000000">₹5-10 Lakh</option>
                </select>

                <select className="px-4 py-3 bg-white rounded-xl text-gray-900 focus:ring-2 focus:ring-orange-500 border-0">
                  <option value="">Search by Brand</option>
                  <option value="Maruti Suzuki">Maruti Suzuki</option>
                  <option value="Hyundai">Hyundai</option>
                  <option value="Honda">Honda</option>
                  <option value="Tata">Tata</option>
                  <option value="Mahindra">Mahindra</option>
                </select>

                <select className="px-4 py-3 bg-white rounded-xl text-gray-900 focus:ring-2 focus:ring-orange-500 border-0">
                  <option value="">Search by Type</option>
                  <option value="Hatchback">Hatchback</option>
                  <option value="Sedan">Sedan</option>
                  <option value="SUV">SUV</option>
                  <option value="MUV">MUV</option>
                </select>
              </div>
              <button 
                onClick={() => navigate('/inventory')}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
              >
                <Search className="h-5 w-5" />
                <span>Search Cars</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-3">
              {['Under ₹3 Lakh', 'SUV', 'Automatic', 'First Owner'].map((chip) => (
                <button
                  key={chip}
                  onClick={() => navigate('/inventory')}
                  className="px-5 py-2 bg-white bg-opacity-20 backdrop-blur-sm text-white rounded-full text-sm hover:bg-opacity-30 transition-colors border border-white border-opacity-30"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badge Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {trustBadges.map((badge) => {
              const Icon = badge.icon;
              return (
                <div 
                  key={badge.title}
                  className="bg-green-50 rounded-2xl p-6 text-center group hover:shadow-xl transition-all duration-300"
                >
                  <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-lg mb-1">
                    {badge.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {badge.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Cars Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-bold text-4xl md:text-5xl text-gray-900 mb-4">
              Featured <span className="text-orange-500">Premium</span> Cars
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Handpicked selection of our finest verified pre-owned vehicles
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {featuredCars.map((car) => (
                <PremiumCarCard key={car.id} car={car} />
              ))}
            </div>
          )}

          <div className="text-center">
            <button
              onClick={() => navigate('/inventory')}
              className="inline-flex items-center space-x-2 px-8 py-4 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <span>View All Cars</span>
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Recent Deliveries Section - "Families Catered So Far.." */}
      {deliveries.length > 0 && (
        <section className="py-20 bg-white" data-testid="deliveries-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="font-bold text-4xl md:text-5xl text-gray-900 mb-4">
                Families Catered <span className="text-orange-500">So Far..</span>
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Happy moments from our recent deliveries
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {deliveries.map((delivery) => (
                <div 
                  key={delivery.id}
                  className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100"
                  data-testid={`delivery-card-${delivery.id}`}
                >
                  <div className="aspect-[4/3] overflow-hidden relative">
                    <img
                      src={delivery.image_url}
                      alt={`${delivery.customer_name} - ${delivery.car_name}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                      <div className="flex items-center space-x-2 text-white">
                        <Heart className="h-4 w-4 text-red-500 fill-red-500" />
                        <span className="font-dmsans text-sm">Happy Customer</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-outfit font-semibold text-gray-900 mb-1">
                      {delivery.car_name}
                    </h3>
                    <p className="font-dmsans text-sm text-gray-600 mb-2">
                      Delivered to {delivery.customer_name}
                    </p>
                    <div className="flex items-center text-gray-500 text-sm">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span className="font-dmsans">{delivery.delivery_location}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recently Sold/Booked Cars Section */}
      {recentlySoldCars.length > 0 && (
        <section className="py-20 bg-gray-50" data-testid="recently-sold-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="font-bold text-4xl md:text-5xl text-gray-900 mb-4">
                Recently <span className="text-orange-500">Sold</span> Cars
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                These cars found their new homes. More coming soon!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {recentlySoldCars.map((car) => (
                <div 
                  key={car.id}
                  className="group bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100 opacity-80"
                  data-testid={`sold-car-${car.id}`}
                >
                  <div className="aspect-[4/3] overflow-hidden relative">
                    <img
                      src={car.image}
                      alt={`${car.make} ${car.model}`}
                      className="w-full h-full object-cover grayscale"
                      loading="lazy"
                    />
                    {/* Status Badge */}
                    <div className={`absolute top-4 left-4 px-4 py-2 rounded-lg font-bold text-sm text-white shadow-lg ${
                      car.status === 'Sold' ? 'bg-red-600' : 'bg-yellow-500'
                    }`}>
                      {car.status.toUpperCase()}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-outfit font-semibold text-gray-900 mb-1 truncate">
                      {car.year} {car.make} {car.model}
                    </h3>
                    <p className="font-outfit font-bold text-xl text-gray-500 line-through">
                      {formatPrice(car.price)}
                    </p>
                    <button
                      disabled
                      className="w-full mt-3 py-2 bg-gray-200 text-gray-500 rounded-full font-dmsans font-medium cursor-not-allowed"
                    >
                      {car.status === 'Sold' ? 'SOLD OUT' : 'BOOKED'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Why Buy From Us */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-bold text-4xl md:text-5xl text-gray-900 mb-4">
              Why Buy From <span className="text-orange-500">TruVant</span>
            </h2>
            <p className="text-lg text-gray-600">
              Experience the difference with our premium service
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {whyBuyFromUs.map((item) => {
              const Icon = item.icon;
              return (
                <div 
                  key={item.title}
                  className="bg-gray-50 rounded-2xl p-6 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Icon className="h-6 w-6 text-orange-500" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-600">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Budget-Based Discovery */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-bold text-4xl md:text-5xl text-gray-900 mb-4">
              Find Your <span className="text-orange-500">Perfect Match</span>
            </h2>
            <p className="text-lg text-gray-600">
              Browse by your budget and preferences
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {budgetCategories.map((category) => (
              <button
                key={category.label}
                onClick={() => navigate('/inventory')}
                className="group relative aspect-square rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
              >
                <img 
                  src={category.image} 
                  alt={category.label}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900 via-opacity-50 to-transparent flex items-end">
                  <p className="font-semibold text-white p-4 text-center w-full">
                    {category.label}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="font-bold text-4xl md:text-5xl text-gray-900 mb-4">
                Happy <span className="text-orange-500">Customers</span>
              </h2>
              <p className="text-lg text-gray-600">
                Real experiences from our satisfied customers
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial) => (
                <div key={testimonial.id} className="bg-gray-50 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
                  <div className="aspect-video">
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${testimonial.video_id}`}
                      title={testimonial.customer_name}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    ></iframe>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center space-x-1 mb-2">
                      {[1,2,3,4,5].map((star) => (
                        <Star key={star} className="h-4 w-4 fill-orange-500 text-orange-500" />
                      ))}
                    </div>
                    <p className="font-semibold text-gray-900">
                      {testimonial.customer_name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section className="py-20 bg-blue-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-bold text-4xl md:text-5xl mb-6">
            Looking For A Specific Car?
          </h2>
          <p className="text-xl text-gray-200 mb-8">
            Can't find what you're looking for? Tell us your requirements and we'll help you find the perfect car.
          </p>
          <button
            onClick={() => navigate('/contact')}
            className="inline-flex items-center space-x-2 px-10 py-5 bg-orange-500 text-white rounded-full font-bold text-lg hover:bg-orange-600 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-1"
          >
            <span>Tell Us Your Requirement</span>
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      </section>
    </div>
  );
};
