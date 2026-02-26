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
                <CarCard key={car.id} car={car} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};