import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { PremiumCarCard } from '../components/PremiumCarCard';
import { 
  Search, Shield, FileCheck, Truck, CreditCard, Home as HomeIcon,
  CheckCircle2, Award, Clock, HeadphonesIcon, TrendingUp,
  ChevronRight, Star, Quote
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const HomePage = () => {
  const [featuredCars, setFeaturedCars] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchFilters, setSearchFilters] = useState({
    budget: '',
    brand: '',
    bodyType: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchFeaturedCars();
    fetchTestimonials();
  }, []);

  const fetchFeaturedCars = async () => {
    try {
      const response = await axios.get(`${API}/cars?featured=true`);
      setFeaturedCars(response.data.slice(0, 6));
    } catch (error) {
      console.error('Error fetching featured cars:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTestimonials = async () => {
    try {
      const response = await axios.get(`${API}/testimonials?active_only=true`);
      setTestimonials(response.data.slice(0, 3));
    } catch (error) {
      console.error('Error fetching testimonials:', error);
    }
  };

  const handleSearch = () => {
    navigate('/inventory');
  };

  const trustBadges = [
    {
      icon: Shield,
      title: 'Verified Cars',
      description: 'Every car inspected by experts'
    },
    {
      icon: FileCheck,
      title: 'No Hidden Charges',
      description: 'Transparent pricing guaranteed'
    },
    {
      icon: CreditCard,
      title: 'RC Transfer Support',
      description: 'Complete documentation help'
    },
    {
      icon: Award,
      title: 'Loan Assistance',
      description: 'Easy financing options'
    },
    {
      icon: Truck,
      title: 'Home Delivery',
      description: 'Doorstep delivery available'
    }
  ];

  const whyBuyFromUs = [
    {
      icon: CheckCircle2,
      title: 'Carefully Selected',
      description: 'Handpicked quality vehicles'
    },
    {
      icon: Shield,
      title: 'Verified Docs',
      description: 'All papers checked'
    },
    {
      icon: TrendingUp,
      title: 'Fair Pricing',
      description: 'Best market rates'
    },
    {
      icon: Clock,
      title: 'Quick Delivery',
      description: 'Fast processing'
    },
    {
      icon: HeadphonesIcon,
      title: 'After Sales',
      description: '24/7 support'
    }
  ];

  const budgetCategories = [
    { label: 'Under ₹2 Lakh', max: 200000, image: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=400' },
    { label: 'Under ₹3 Lakh', max: 300000, image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400' },
    { label: 'Under ₹5 Lakh', max: 500000, image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400' },
    { label: 'SUV Under Budget', type: 'SUV', image: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=400' },
    { label: 'Automatic Cars', transmission: 'Automatic', image: 'https://images.unsplash.com/photo-1617531653520-bd466115490d?w=400' }
  ];

  return (
    <div className=\"min-h-screen bg-background\">\n      {/* 1. Premium Hero Section */}\n      <section \n        className=\"relative min-h-[85vh] flex items-center bg-cover bg-center\"\n        style={{\n          backgroundImage: 'linear-gradient(rgba(10, 25, 47, 0.85), rgba(10, 25, 47, 0.75)), url(https://images.unsplash.com/photo-1758311177173-f1ffc7fa09bc?w=1920)'\n        }}\n        data-testid=\"hero-section\"\n      >\n        <div className=\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full\">\n          <div className=\"max-w-3xl\">\n            <h1 className=\"font-outfit font-bold text-5xl md:text-6xl lg:text-7xl text-white mb-6 leading-tight\">\n              Buy Trusted Used Cars <br />\n              <span className=\"text-accent\">Without the Stress</span>\n            </h1>\n            <p className=\"font-dmsans text-xl md:text-2xl text-gray-200 mb-8\">\n              Inspected | Verified | Transparent Pricing | Fast Delivery\n            </p>\n\n            {/* Quick Filters */}\n            <div className=\"bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 mb-8\">\n              <div className=\"grid grid-cols-1 md:grid-cols-3 gap-4 mb-4\">\n                <select \n                  className=\"px-4 py-3 bg-white rounded-xl font-dmsans text-text-primary focus:ring-2 focus:ring-accent border-0\"\n                  onChange={(e) => setSearchFilters({...searchFilters, budget: e.target.value})}\n                >\n                  <option value=\"\">Search by Budget</option>\n                  <option value=\"200000\">Under ₹2 Lakh</option>\n                  <option value=\"300000\">Under ₹3 Lakh</option>\n                  <option value=\"500000\">Under ₹5 Lakh</option>\n                  <option value=\"1000000\">₹5-10 Lakh</option>\n                </select>\n\n                <select \n                  className=\"px-4 py-3 bg-white rounded-xl font-dmsans text-text-primary focus:ring-2 focus:ring-accent border-0\"\n                  onChange={(e) => setSearchFilters({...searchFilters, brand: e.target.value})}\n                >\n                  <option value=\"\">Search by Brand</option>\n                  <option value=\"Maruti Suzuki\">Maruti Suzuki</option>\n                  <option value=\"Hyundai\">Hyundai</option>\n                  <option value=\"Honda\">Honda</option>\n                  <option value=\"Tata\">Tata</option>\n                  <option value=\"Mahindra\">Mahindra</option>\n                </select>\n\n                <select \n                  className=\"px-4 py-3 bg-white rounded-xl font-dmsans text-text-primary focus:ring-2 focus:ring-accent border-0\"\n                  onChange={(e) => setSearchFilters({...searchFilters, bodyType: e.target.value})}\n                >\n                  <option value=\"\">Search by Type</option>\n                  <option value=\"Hatchback\">Hatchback</option>\n                  <option value=\"Sedan\">Sedan</option>\n                  <option value=\"SUV\">SUV</option>\n                  <option value=\"MUV\">MUV</option>\n                </select>\n              </div>\n              <button \n                onClick={handleSearch}\n                className=\"w-full bg-accent hover:bg-accent-hover text-white px-8 py-4 rounded-full font-dmsans font-semibold text-lg transition-all duration-200 hover:shadow-button flex items-center justify-center space-x-2\"\n                data-testid=\"search-button\"\n              >\n                <Search className=\"h-5 w-5\" />\n                <span>Search Cars</span>\n              </button>\n            </div>\n\n            {/* Quick Action Chips */}\n            <div className=\"flex flex-wrap gap-3\">\n              {['Under ₹3 Lakh', 'SUV', 'Automatic', 'First Owner'].map((chip) => (\n                <button\n                  key={chip}\n                  onClick={() => navigate('/inventory')}\n                  className=\"px-5 py-2 bg-white/20 backdrop-blur-sm text-white rounded-full font-dmsans text-sm hover:bg-white/30 transition-colors border border-white/30\"\n                >\n                  {chip}\n                </button>\n              ))}\n            </div>\n          </div>\n        </div>\n      </section>\n\n      {/* 2. Trust Badge Section */}\n      <section className=\"py-16 bg-white\" data-testid=\"trust-badges\">\n        <div className=\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8\">\n          <div className=\"grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6\">\n            {trustBadges.map((badge, index) => {\n              const Icon = badge.icon;\n              return (\n                <div \n                  key={index}\n                  className=\"bg-success-bg rounded-card p-6 text-center group hover:shadow-card transition-all duration-300\"\n                >\n                  <div className=\"w-14 h-14 bg-success rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform\">\n                    <Icon className=\"h-7 w-7 text-white\" />\n                  </div>\n                  <h3 className=\"font-outfit font-semibold text-text-primary text-lg mb-1\">\n                    {badge.title}\n                  </h3>\n                  <p className=\"font-dmsans text-sm text-text-secondary\">\n                    {badge.description}\n                  </p>\n                </div>\n              );\n            })}\n          </div>\n        </div>\n      </section>\n\n      {/* 3. Featured Cars Section */}\n      <section className=\"py-20 bg-background\" data-testid=\"featured-cars\">\n        <div className=\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8\">\n          <div className=\"text-center mb-12\">\n            <h2 className=\"font-outfit font-bold text-4xl md:text-5xl text-text-primary mb-4\">\n              Featured <span className=\"text-accent\">Premium</span> Cars\n            </h2>\n            <p className=\"font-dmsans text-lg text-text-secondary max-w-2xl mx-auto\">\n              Handpicked selection of our finest verified pre-owned vehicles\n            </p>\n          </div>\n\n          {loading ? (\n            <div className=\"text-center py-12\">\n              <div className=\"inline-block animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-transparent\"></div>\n            </div>\n          ) : (\n            <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10\">\n              {featuredCars.map((car) => (\n                <PremiumCarCard key={car.id} car={car} />\n              ))}\n            </div>\n          )}\n\n          <div className=\"text-center\">\n            <button\n              onClick={() => navigate('/inventory')}\n              className=\"inline-flex items-center space-x-2 px-8 py-4 bg-primary text-white rounded-full font-dmsans font-semibold hover:bg-primary-hover transition-all duration-200 hover:shadow-button\"\n              data-testid=\"view-all-cars\"\n            >\n              <span>View All Cars</span>\n              <ChevronRight className=\"h-5 w-5\" />\n            </button>\n          </div>\n        </div>\n      </section>\n\n      {/* 4. Why Buy From Us */}\n      <section className=\"py-20 bg-white\" data-testid=\"why-buy\">\n        <div className=\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8\">\n          <div className=\"text-center mb-12\">\n            <h2 className=\"font-outfit font-bold text-4xl md:text-5xl text-text-primary mb-4\">\n              Why Buy From <span className=\"text-accent\">TruVant</span>\n            </h2>\n            <p className=\"font-dmsans text-lg text-text-secondary\">\n              Experience the difference with our premium service\n            </p>\n          </div>\n\n          <div className=\"grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6\">\n            {whyBuyFromUs.map((item, index) => {\n              const Icon = item.icon;\n              return (\n                <div \n                  key={index}\n                  className=\"bg-background rounded-card p-6 text-center hover:shadow-card transition-all duration-300 hover:-translate-y-1\"\n                >\n                  <div className=\"w-12 h-12 bg-accent-light rounded-full flex items-center justify-center mx-auto mb-3\">\n                    <Icon className=\"h-6 w-6 text-accent\" />\n                  </div>\n                  <h3 className=\"font-outfit font-semibold text-text-primary mb-1\">\n                    {item.title}\n                  </h3>\n                  <p className=\"font-dmsans text-xs text-text-secondary\">\n                    {item.description}\n                  </p>\n                </div>\n              );\n            })}\n          </div>\n        </div>\n      </section>\n\n      {/* 5. Budget-Based Discovery */}\n      <section className=\"py-20 bg-background\" data-testid=\"budget-discovery\">\n        <div className=\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8\">\n          <div className=\"text-center mb-12\">\n            <h2 className=\"font-outfit font-bold text-4xl md:text-5xl text-text-primary mb-4\">\n              Find Your <span className=\"text-accent\">Perfect Match</span>\n            </h2>\n            <p className=\"font-dmsans text-lg text-text-secondary\">\n              Browse by your budget and preferences\n            </p>\n          </div>\n\n          <div className=\"grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4\">\n            {budgetCategories.map((category, index) => (\n              <button\n                key={index}\n                onClick={() => navigate('/inventory')}\n                className=\"group relative aspect-square rounded-card overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300\"\n              >\n                <img \n                  src={category.image} \n                  alt={category.label}\n                  className=\"w-full h-full object-cover group-hover:scale-110 transition-transform duration-500\"\n                />\n                <div className=\"absolute inset-0 bg-gradient-to-t from-primary/90 to-primary/20 flex items-end\">\n                  <p className=\"font-outfit font-semibold text-white p-4 text-center w-full\">\n                    {category.label}\n                  </p>\n                </div>\n              </button>\n            ))}\n          </div>\n        </div>\n      </section>\n\n      {/* 6. Testimonials */}\n      {testimonials.length > 0 && (\n        <section className=\"py-20 bg-white\" data-testid=\"testimonials\">\n          <div className=\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8\">\n            <div className=\"text-center mb-12\">\n              <h2 className=\"font-outfit font-bold text-4xl md:text-5xl text-text-primary mb-4\">\n                Happy <span className=\"text-accent\">Customers</span>\n              </h2>\n              <p className=\"font-dmsans text-lg text-text-secondary\">\n                Real experiences from our satisfied customers\n              </p>\n            </div>\n\n            <div className=\"grid grid-cols-1 md:grid-cols-3 gap-8\">\n              {testimonials.map((testimonial) => (\n                <div key={testimonial.id} className=\"bg-background rounded-card overflow-hidden shadow-card\">\n                  <div className=\"aspect-video\">\n                    <iframe\n                      width=\"100%\"\n                      height=\"100%\"\n                      src={`https://www.youtube.com/embed/${testimonial.video_id}`}\n                      title={testimonial.customer_name}\n                      frameBorder=\"0\"\n                      allow=\"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture\"\n                      allowFullScreen\n                      className=\"w-full h-full\"\n                    ></iframe>\n                  </div>\n                  <div className=\"p-5\">\n                    <div className=\"flex items-center space-x-1 mb-2\">\n                      {[1,2,3,4,5].map((star) => (\n                        <Star key={star} className=\"h-4 w-4 fill-accent text-accent\" />\n                      ))}\n                    </div>\n                    <p className=\"font-outfit font-semibold text-text-primary\">\n                      {testimonial.customer_name}\n                    </p>\n                  </div>\n                </div>\n              ))}\n            </div>\n          </div>\n        </section>\n      )}\n\n      {/* 7. Final CTA */}\n      <section className=\"py-20 bg-primary text-white\" data-testid=\"final-cta\">\n        <div className=\"max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center\">\n          <h2 className=\"font-outfit font-bold text-4xl md:text-5xl mb-6\">\n            Looking For A Specific Car?\n          </h2>\n          <p className=\"font-dmsans text-xl text-gray-200 mb-8\">\n            Can't find what you're looking for? Tell us your requirements and we'll help you find the perfect car.\n          </p>\n          <button\n            onClick={() => navigate('/contact')}\n            className=\"inline-flex items-center space-x-2 px-10 py-5 bg-accent text-white rounded-full font-dmsans font-bold text-lg hover:bg-accent-hover transition-all duration-200 hover:shadow-button hover:-translate-y-1\"\n            data-testid=\"tell-requirement-button\"\n          >\n            <span>Tell Us Your Requirement</span>\n            <ChevronRight className=\"h-6 w-6\" />\n          </button>\n        </div>\n      </section>\n    </div>\n  );\n};
