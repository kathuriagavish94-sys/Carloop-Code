import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Fuel, Gauge, Settings } from 'lucide-react';

export const CarCard = ({ car }) => {
  const navigate = useNavigate();
  const isSoldOrBooked = car.status === 'Sold' || car.status === 'Booked';

  const formatPrice = (price) => {
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(2)} Cr`;
    } else if (price >= 100000) {
      return `₹${(price / 100000).toFixed(2)} Lakh`;
    }
    return `₹${price.toLocaleString('en-IN')}`;
  };

  const formatKm = (km) => {
    if (km >= 100000) {
      return `${(km / 100000).toFixed(1)} Lakh km`;
    } else if (km >= 1000) {
      return `${(km / 1000).toFixed(0)}K km`;
    }
    return `${km} km`;
  };

  return (
    <div className={`car-card bg-white rounded-lg border border-gray-200 overflow-hidden relative ${isSoldOrBooked ? 'opacity-70' : ''}`} data-testid={`car-card-${car.id}`}>
      {isSoldOrBooked && (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-40 z-10 flex items-center justify-center">
          <div className={`px-6 py-3 rounded-lg font-teko text-3xl font-bold text-white ${car.status === 'Sold' ? 'bg-red-600' : 'bg-yellow-600'}`}>
            {car.status.toUpperCase()}
          </div>
        </div>
      )}
      
      <div className="aspect-video relative overflow-hidden">
        <img
          src={car.image}
          alt={`${car.make} ${car.model}`}
          className="w-full h-full object-cover"
          data-testid="car-image"
        />
      </div>

      <div className="p-6">
        <h3 className="font-manrope font-bold text-xl text-gray-900 mb-1" data-testid="car-title">
          {car.make} {car.model}
        </h3>
        <p className="font-teko text-3xl font-bold text-primary mb-4" data-testid="car-price">
          {formatPrice(car.price)}
        </p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="flex items-center space-x-2 text-gray-600">
            <Calendar className="h-4 w-4" />
            <span className="font-manrope text-sm" data-testid="car-year">{car.year}</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <Gauge className="h-4 w-4" />
            <span className="font-manrope text-sm" data-testid="car-km">{formatKm(car.km_driven)}</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <Fuel className="h-4 w-4" />
            <span className="font-manrope text-sm" data-testid="car-fuel">{car.fuel_type}</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <Settings className="h-4 w-4" />
            <span className="font-manrope text-sm" data-testid="car-transmission">{car.transmission}</span>
          </div>
        </div>

        <button
          onClick={() => navigate(`/inventory/${car.id}`)}
          disabled={isSoldOrBooked}
          className={`w-full px-4 py-2 border-2 rounded-lg font-manrope font-semibold transition-colors ${
            isSoldOrBooked 
              ? 'border-gray-300 text-gray-400 cursor-not-allowed' 
              : 'border-primary text-primary hover:bg-primary hover:text-white'
          }`}
          data-testid="view-details-button"
        >
          {isSoldOrBooked ? car.status : 'View Details'}
        </button>
      </div>
    </div>
  );
};