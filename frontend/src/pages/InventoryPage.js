import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { CarCard } from '../components/CarCard';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const InventoryPage = () => {
  const [cars, setCars] = useState([]);
  const [filteredCars, setFilteredCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    fuelType: 'all',
    transmission: 'all',
    priceRange: 'all',
  });
  const [showCallbackModal, setShowCallbackModal] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);
  const [callbackForm, setCallbackForm] = useState({
    name: '',
    phone: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCars();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [cars, searchTerm, filters]);

  const fetchCars = async () => {
    try {
      const response = await axios.get(`${API}/cars`);
      setCars(response.data);
    } catch (error) {
      console.error('Error fetching cars:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...cars];

    if (searchTerm) {
      filtered = filtered.filter(
        (car) =>
          car.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
          car.model.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filters.fuelType !== 'all') {
      filtered = filtered.filter((car) => car.fuel_type === filters.fuelType);
    }

    if (filters.transmission !== 'all') {
      filtered = filtered.filter((car) => car.transmission === filters.transmission);
    }

    if (filters.priceRange !== 'all') {
      const [min, max] = filters.priceRange.split('-').map(Number);
      filtered = filtered.filter((car) => car.price >= min && car.price <= max);
    }

    setFilteredCars(filtered);
  };

  const handleCallbackRequest = (car) => {
    setSelectedCar(car);
    setShowCallbackModal(true);
  };

  const handleSubmitCallback = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await axios.post(`${API}/callback-requests`, {
        ...callbackForm,
        car_id: selectedCar?.id,
      });
      toast.success('Callback request submitted! We will call you back soon.');
      setShowCallbackModal(false);
      setCallbackForm({ name: '', phone: '' });
      setSelectedCar(null);
    } catch (error) {
      console.error('Error submitting callback:', error);
      toast.error('Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-ceramic py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="font-teko text-6xl font-bold text-forest uppercase tracking-wide mb-4" data-testid="inventory-title">
            Our Inventory
          </h1>
          <p className="font-manrope text-lg text-gray-600">
            Browse our complete collection of premium pre-owned vehicles.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-8" data-testid="filter-section">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by make or model..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-manrope"
                data-testid="search-input"
              />
            </div>

            <select
              value={filters.fuelType}
              onChange={(e) => setFilters({ ...filters, fuelType: e.target.value })}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-manrope"
              data-testid="fuel-filter"
            >
              <option value="all">All Fuel Types</option>
              <option value="Petrol">Petrol</option>
              <option value="Diesel">Diesel</option>
              <option value="CNG">CNG</option>
              <option value="Electric">Electric</option>
            </select>

            <select
              value={filters.transmission}
              onChange={(e) => setFilters({ ...filters, transmission: e.target.value })}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-manrope"
              data-testid="transmission-filter"
            >
              <option value="all">All Transmissions</option>
              <option value="Manual">Manual</option>
              <option value="Automatic">Automatic</option>
            </select>

            <select
              value={filters.priceRange}
              onChange={(e) => setFilters({ ...filters, priceRange: e.target.value })}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-manrope"
              data-testid="price-filter"
            >
              <option value="all">All Prices</option>
              <option value="0-1000000">Under 10 Lakh</option>
              <option value="1000000-2000000">10-20 Lakh</option>
              <option value="2000000-5000000">20-50 Lakh</option>
              <option value="5000000-99999999">Above 50 Lakh</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12" data-testid="loading-spinner">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          </div>
        ) : filteredCars.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg" data-testid="no-cars-message">
            <p className="font-manrope text-lg text-gray-600">No vehicles found matching your criteria.</p>
          </div>
        ) : (
          <>
            <div className="mb-4 font-manrope text-gray-600" data-testid="cars-count">
              Showing {filteredCars.length} {filteredCars.length === 1 ? 'vehicle' : 'vehicles'}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" data-testid="inventory-grid">
              {filteredCars.map((car) => (
                <div key={car.id} className="relative">
                  <CarCard car={car} />
                  {car.status === 'Available' && (
                    <button
                      onClick={() => handleCallbackRequest(car)}
                      className="mt-4 w-full px-4 py-3 bg-accent text-white rounded-lg hover:bg-[#d94d0a] transition-colors font-manrope font-semibold"
                      data-testid={`callback-btn-${car.id}`}
                    >
                      Get A Call Back
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {showCallbackModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" data-testid="callback-modal">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <div>
                <h3 className="font-teko text-3xl font-bold text-forest uppercase">
                  Request A Call Back
                </h3>
                {selectedCar && (
                  <p className="font-manrope text-sm text-gray-600 mt-1">
                    For: {selectedCar.make} {selectedCar.model} ({selectedCar.year})
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  setShowCallbackModal(false);
                  setSelectedCar(null);
                  setCallbackForm({ name: '', phone: '' });
                }}
                className="text-gray-500 hover:text-gray-700"
                data-testid="close-callback-modal"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmitCallback} className="p-6 space-y-4" data-testid="callback-form">
              <div>
                <label className="block font-manrope font-semibold text-gray-700 mb-2">Your Name</label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={callbackForm.name}
                  onChange={(e) => setCallbackForm({ ...callbackForm, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-manrope"
                  data-testid="callback-name-input"
                />
              </div>

              <div>
                <label className="block font-manrope font-semibold text-gray-700 mb-2">Mobile Number</label>
                <input
                  type="tel"
                  placeholder="Enter 10-digit mobile number"
                  value={callbackForm.phone}
                  onChange={(e) => setCallbackForm({ ...callbackForm, phone: e.target.value })}
                  required
                  pattern="[0-9]{10}"
                  maxLength="10"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-manrope"
                  data-testid="callback-phone-input"
                />
                <p className="text-xs text-gray-500 mt-1">We'll call you back within 2 hours during business hours</p>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-[#01352a] transition-colors font-manrope font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="callback-submit-button"
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCallbackModal(false);
                    setSelectedCar(null);
                    setCallbackForm({ name: '', phone: '' });
                  }}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-manrope font-bold"
                  data-testid="callback-cancel-button"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};