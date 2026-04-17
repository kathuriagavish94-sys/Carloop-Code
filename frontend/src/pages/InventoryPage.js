import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import { PremiumCarCard } from '../components/PremiumCarCard';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const InventoryPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [cars, setCars] = useState([]);
  const [filteredCars, setFilteredCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    fuelType: 'all',
    transmission: 'all',
    priceRange: 'all',
    status: 'all',
    bodyType: 'all',
  });
  const [showCallbackModal, setShowCallbackModal] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);
  const [callbackForm, setCallbackForm] = useState({
    name: '',
    phone: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Read URL parameters and set initial filters
  useEffect(() => {
    const priceRange = searchParams.get('priceRange');
    const transmission = searchParams.get('transmission');
    const bodyType = searchParams.get('bodyType');
    const fuelType = searchParams.get('fuelType');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    setFilters(prev => ({
      ...prev,
      priceRange: priceRange || 'all',
      transmission: transmission || 'all',
      bodyType: bodyType || 'all',
      fuelType: fuelType || 'all',
      status: status || 'all',
    }));

    if (search) {
      setSearchTerm(search);
    }
  }, [searchParams]);

  const fetchCars = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/cars`);
      setCars(response.data);
    } catch (error) {
      console.error('Error fetching cars:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const applyFilters = useCallback(() => {
    let filtered = [...cars];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (car) =>
          car.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
          car.model.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Fuel type filter
    if (filters.fuelType !== 'all') {
      filtered = filtered.filter((car) => car.fuel_type === filters.fuelType);
    }

    // Transmission filter
    if (filters.transmission !== 'all') {
      filtered = filtered.filter((car) => car.transmission === filters.transmission);
    }

    // Price range filter
    if (filters.priceRange !== 'all') {
      const [min, max] = filters.priceRange.split('-').map(Number);
      filtered = filtered.filter((car) => {
        const price = Number(car.price);
        return price >= min && price <= max;
      });
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter((car) => car.status === filters.status);
    }

    // Body type filter (SUV, Sedan, Hatchback, etc.)
    if (filters.bodyType !== 'all') {
      filtered = filtered.filter((car) => {
        // Check body_type field or infer from model name
        if (car.body_type) {
          return car.body_type.toLowerCase() === filters.bodyType.toLowerCase();
        }
        // Fallback: check if model name contains the body type
        const modelLower = car.model.toLowerCase();
        const bodyTypeLower = filters.bodyType.toLowerCase();
        return modelLower.includes(bodyTypeLower);
      });
    }

    setFilteredCars(filtered);
  }, [cars, searchTerm, filters]);

  useEffect(() => {
    fetchCars();
  }, [fetchCars]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

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

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({
      fuelType: 'all',
      transmission: 'all',
      priceRange: 'all',
      status: 'all',
      bodyType: 'all',
    });
    // Clear URL parameters
    setSearchParams({});
  };

  // Update URL when filters change
  const updateFilter = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Update URL params
    const params = new URLSearchParams();
    if (newFilters.priceRange !== 'all') params.set('priceRange', newFilters.priceRange);
    if (newFilters.transmission !== 'all') params.set('transmission', newFilters.transmission);
    if (newFilters.fuelType !== 'all') params.set('fuelType', newFilters.fuelType);
    if (newFilters.status !== 'all') params.set('status', newFilters.status);
    if (newFilters.bodyType !== 'all') params.set('bodyType', newFilters.bodyType);
    if (searchTerm) params.set('search', searchTerm);
    setSearchParams(params);
  };

  const hasActiveFilters = searchTerm || filters.fuelType !== 'all' || filters.transmission !== 'all' || filters.priceRange !== 'all' || filters.status !== 'all' || filters.bodyType !== 'all';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <section className="bg-gray-900 py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-outfit font-bold text-4xl md:text-5xl lg:text-6xl text-white mb-4" data-testid="inventory-title">
            Our <span className="text-orange-500">Inventory</span>
          </h1>
          <p className="font-dmsans text-lg md:text-xl text-gray-300 max-w-2xl">
            Browse our complete collection of premium pre-owned vehicles. Each car is thoroughly inspected and verified.
          </p>
        </div>
      </section>

      {/* Filter Section */}
      <section className="sticky top-[80px] z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Desktop Filters */}
          <div className="hidden md:grid grid-cols-5 gap-4" data-testid="filter-section">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by make or model..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent font-dmsans text-gray-900"
                data-testid="search-input"
              />
            </div>

            <select
              value={filters.fuelType}
              onChange={(e) => updateFilter('fuelType', e.target.value)}
              className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent font-dmsans text-gray-900 appearance-none cursor-pointer"
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
              onChange={(e) => updateFilter('transmission', e.target.value)}
              className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent font-dmsans text-gray-900 appearance-none cursor-pointer"
              data-testid="transmission-filter"
            >
              <option value="all">All Transmissions</option>
              <option value="Manual">Manual</option>
              <option value="Automatic">Automatic</option>
            </select>

            <select
              value={filters.priceRange}
              onChange={(e) => updateFilter('priceRange', e.target.value)}
              className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent font-dmsans text-gray-900 appearance-none cursor-pointer"
              data-testid="price-filter"
            >
              <option value="all">All Prices</option>
              <option value="0-200000">Under 2 Lakh</option>
              <option value="0-300000">Under 3 Lakh</option>
              <option value="0-500000">Under 5 Lakh</option>
              <option value="500000-1000000">5-10 Lakh</option>
              <option value="1000000-2000000">10-20 Lakh</option>
              <option value="2000000-5000000">20-50 Lakh</option>
              <option value="5000000-99999999">Above 50 Lakh</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => updateFilter('status', e.target.value)}
              className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent font-dmsans text-gray-900 appearance-none cursor-pointer"
              data-testid="status-filter"
            >
              <option value="all">All Status</option>
              <option value="Available">Available</option>
              <option value="Booked">Booked</option>
              <option value="Sold">Sold</option>
            </select>
          </div>

          {/* Mobile Filter Button */}
          <div className="md:hidden flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search cars..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 font-dmsans"
              />
            </div>
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="flex items-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-xl font-dmsans font-medium"
            >
              <SlidersHorizontal className="h-5 w-5" />
              Filters
            </button>
          </div>

          {/* Mobile Filters Dropdown */}
          {showMobileFilters && (
            <div className="md:hidden mt-4 p-4 bg-gray-50 rounded-xl space-y-3">
              <select
                value={filters.fuelType}
                onChange={(e) => updateFilter('fuelType', e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl font-dmsans"
              >
                <option value="all">All Fuel Types</option>
                <option value="Petrol">Petrol</option>
                <option value="Diesel">Diesel</option>
                <option value="CNG">CNG</option>
                <option value="Electric">Electric</option>
              </select>
              <select
                value={filters.transmission}
                onChange={(e) => updateFilter('transmission', e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl font-dmsans"
              >
                <option value="all">All Transmissions</option>
                <option value="Manual">Manual</option>
                <option value="Automatic">Automatic</option>
              </select>
              <select
                value={filters.priceRange}
                onChange={(e) => updateFilter('priceRange', e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl font-dmsans"
              >
                <option value="all">All Prices</option>
                <option value="0-200000">Under 2 Lakh</option>
                <option value="0-300000">Under 3 Lakh</option>
                <option value="0-500000">Under 5 Lakh</option>
                <option value="500000-1000000">5-10 Lakh</option>
                <option value="1000000-2000000">10-20 Lakh</option>
                <option value="2000000-5000000">20-50 Lakh</option>
                <option value="5000000-99999999">Above 50 Lakh</option>
              </select>
              <select
                value={filters.status}
                onChange={(e) => updateFilter('status', e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl font-dmsans"
              >
                <option value="all">All Status</option>
                <option value="Available">Available</option>
                <option value="Booked">Booked</option>
                <option value="Sold">Sold</option>
              </select>
            </div>
          )}

          {/* Active Filters & Clear */}
          {hasActiveFilters && (
            <div className="mt-4 flex items-center gap-2">
              <span className="font-dmsans text-sm text-gray-600">Active filters:</span>
              <button
                onClick={clearFilters}
                className="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-sm font-dmsans font-medium hover:bg-orange-200 transition-colors"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Results Section */}
      <section className="py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="text-center py-16" data-testid="loading-spinner">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
              <p className="mt-4 font-dmsans text-gray-600">Loading vehicles...</p>
            </div>
          ) : filteredCars.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl shadow-sm" data-testid="no-cars-message">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="font-outfit font-semibold text-xl text-gray-900 mb-2">No vehicles found</h3>
              <p className="font-dmsans text-gray-600 mb-4">Try adjusting your filters or search criteria.</p>
              <button
                onClick={clearFilters}
                className="px-6 py-2 bg-orange-500 text-white rounded-full font-dmsans font-medium hover:bg-orange-600 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-center justify-between">
                <p className="font-dmsans text-gray-600" data-testid="cars-count">
                  Showing <span className="font-semibold text-gray-900">{filteredCars.length}</span> {filteredCars.length === 1 ? 'vehicle' : 'vehicles'}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="inventory-grid">
                {filteredCars.map((car) => (
                  <PremiumCarCard key={car.id} car={car} onCallbackRequest={handleCallbackRequest} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Callback Modal */}
      {showCallbackModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" data-testid="callback-modal">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-start p-6 border-b border-gray-100">
              <div>
                <h3 className="font-outfit font-bold text-2xl text-gray-900">
                  Request A Call Back
                </h3>
                {selectedCar && (
                  <p className="font-dmsans text-sm text-gray-600 mt-1">
                    For: <span className="font-medium text-orange-500">{selectedCar.make} {selectedCar.model} ({selectedCar.year})</span>
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  setShowCallbackModal(false);
                  setSelectedCar(null);
                  setCallbackForm({ name: '', phone: '' });
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                data-testid="close-callback-modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCallback} className="p-6 space-y-4" data-testid="callback-form">
              <div>
                <label className="block font-dmsans font-medium text-gray-700 mb-2">Your Name</label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={callbackForm.name}
                  onChange={(e) => setCallbackForm({ ...callbackForm, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent font-dmsans"
                  data-testid="callback-name-input"
                />
              </div>

              <div>
                <label className="block font-dmsans font-medium text-gray-700 mb-2">Mobile Number</label>
                <input
                  type="tel"
                  placeholder="Enter 10-digit mobile number"
                  value={callbackForm.phone}
                  onChange={(e) => setCallbackForm({ ...callbackForm, phone: e.target.value })}
                  required
                  pattern="[0-9]{10}"
                  maxLength="10"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent font-dmsans"
                  data-testid="callback-phone-input"
                />
                <p className="text-xs text-gray-500 mt-2">We'll call you back within 2 hours during business hours</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-orange-500 text-white rounded-full font-dmsans font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-full font-dmsans font-semibold hover:bg-gray-50 transition-colors"
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
