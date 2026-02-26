import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { CarCard } from '../components/CarCard';
import { ChevronRight } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const HomePage = () => {
  const [featuredCars, setFeaturedCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFeaturedCars();
  }, []);

  const fetchFeaturedCars = async () => {
    try {
      const response = await axios.get(`${API}/cars?featured=true`);
      setFeaturedCars(response.data.slice(0, 3));
    } catch (error) {
      console.error('Error fetching featured cars:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <section
        className="hero-section bg-forest relative"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1585649543966-8b3f478c50e8?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NzR8MHwxfHNlYXJjaHwzfHxsdXh1cnklMjBjYXIlMjBvbiUyMHJvYWQlMjBjaW5lbWF0aWMlMjBsaWdodGluZ3xlbnwwfHx8fDE3NzIwODQ4OTJ8MA&ixlib=rb-4.1.0&q=85)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        data-testid="hero-section"
      >
        <div className="hero-gradient absolute inset-0"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="max-w-3xl">
            <h1 className="font-teko text-6xl md:text-7xl lg:text-8xl font-bold text-white uppercase tracking-wide mb-6" data-testid="hero-title">
              DRIVE THE EXCEPTIONAL
            </h1>
            <p className="font-manrope text-xl md:text-2xl text-gray-200 mb-8 leading-relaxed" data-testid="hero-subtitle">
              Curated inventory for the discerning driver. Premium pre-owned vehicles with unmatched quality.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => navigate('/inventory')}
                className="px-8 py-4 bg-accent text-white rounded-lg hover:bg-[#d94d0a] transition-colors font-manrope font-bold text-lg flex items-center justify-center space-x-2"
                data-testid="view-inventory-button"
              >
                <span>View Inventory</span>
                <ChevronRight className="h-5 w-5" />
              </button>
              <button
                onClick={() => navigate('/contact')}
                className="px-8 py-4 bg-white text-forest border-2 border-white rounded-lg hover:bg-transparent hover:text-white transition-colors font-manrope font-bold text-lg"
                data-testid="sell-car-button"
              >
                Sell Your Car
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-ceramic" data-testid="featured-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-teko text-5xl font-bold text-forest uppercase tracking-wide mb-4" data-testid="featured-title">
              Featured Vehicles
            </h2>
            <p className="font-manrope text-lg text-gray-600 max-w-2xl mx-auto">
              Handpicked selection of our finest pre-owned vehicles. Each car undergoes rigorous inspection.
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12" data-testid="loading-spinner">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" data-testid="featured-cars-grid">
              {featuredCars.map((car) => (
                <CarCard key={car.id} car={car} />
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <button
              onClick={() => navigate('/inventory')}
              className="px-8 py-3 bg-primary text-white rounded-lg hover:bg-[#01352a] transition-colors font-manrope font-semibold inline-flex items-center space-x-2"
              data-testid="view-all-button"
            >
              <span>View All Vehicles</span>
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="font-teko text-3xl font-bold text-white">1</span>
              </div>
              <h3 className="font-teko text-2xl font-bold text-forest uppercase mb-3">Quality Assured</h3>
              <p className="font-manrope text-gray-600">
                Every vehicle undergoes comprehensive inspection before listing.
              </p>
            </div>

            <div className="text-center p-8">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="font-teko text-3xl font-bold text-white">2</span>
              </div>
              <h3 className="font-teko text-2xl font-bold text-forest uppercase mb-3">Best Prices</h3>
              <p className="font-manrope text-gray-600">
                Competitive pricing with transparent valuation process.
              </p>
            </div>

            <div className="text-center p-8">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="font-teko text-3xl font-bold text-white">3</span>
              </div>
              <h3 className="font-teko text-2xl font-bold text-forest uppercase mb-3">Easy Process</h3>
              <p className="font-manrope text-gray-600">
                Simple documentation and hassle-free buying experience.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};