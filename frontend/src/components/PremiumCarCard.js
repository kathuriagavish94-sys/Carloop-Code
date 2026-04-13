import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Fuel, Gauge, Settings, Star, MessageCircle } from 'lucide-react';

export const PremiumCarCard = ({ car }) => {
  const navigate = useNavigate();
  const isSoldOrBooked = car.status === 'Sold' || car.status === 'Booked';

  const formatPrice = (price) => {
    if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
    if (price >= 100000) return `₹${(price / 100000).toFixed(2)} L`;
    return `₹${price.toLocaleString('en-IN')}`;
  };

  const formatKm = (km) => {
    if (km >= 100000) return `${(km / 100000).toFixed(1)}L km`;
    if (km >= 1000) return `${(km / 1000).toFixed(0)}K km`;
    return `${km} km`;
  };

  // Get status badge with proper colors
  const getStatusBadge = () => {
    if (car.status === 'Sold') {
      return { text: 'SOLD', bgColor: 'bg-red-600', textColor: 'text-white' };
    }
    if (car.status === 'Booked') {
      return { text: 'BOOKED', bgColor: 'bg-yellow-500', textColor: 'text-white' };
    }
    if (car.status === 'Available' || !car.status) {
      return { text: 'AVAILABLE', bgColor: 'bg-green-500', textColor: 'text-white' };
    }
    return null;
  };

  // Get feature badge (Featured, New Arrival, etc.)
  const getFeatureBadge = () => {
    if (car.is_featured) return { text: 'FEATURED', color: 'bg-orange-500 text-white' };
    if (car.year >= 2023) return { text: 'NEW ARRIVAL', color: 'bg-blue-500 text-white' };
    return null;
  };

  const statusBadge = getStatusBadge();
  const featureBadge = getFeatureBadge();

  return (
    <div 
      className={`group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col h-full ${
        isSoldOrBooked ? 'opacity-75' : ''
      }`}
      data-testid={`car-card-${car.id}`}
    >
      {/* Image Section */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-50">
        <img
          src={car.image}
          alt={`${car.make} ${car.model}`}
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
            isSoldOrBooked ? 'grayscale-[30%]' : ''
          }`}
          loading="lazy"
        />
        
        {/* Status Badge - Top Left */}
        {statusBadge && (
          <div 
            className={`absolute top-4 left-4 px-3 py-1.5 rounded-lg text-xs font-bold ${statusBadge.bgColor} ${statusBadge.textColor} shadow-lg`}
            data-testid={`status-badge-${car.id}`}
          >
            {statusBadge.text}
          </div>
        )}
        
        {/* Feature Badge - Top Right */}
        {featureBadge && !isSoldOrBooked && (
          <div 
            className={`absolute top-4 right-4 px-3 py-1.5 rounded-lg text-xs font-bold ${featureBadge.color} shadow-lg`}
          >
            {featureBadge.text}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-5 flex flex-col flex-grow">
        {/* Car Title */}
        <h3 className="font-outfit font-semibold text-lg text-gray-900 mb-1 truncate">
          {car.year} {car.make} {car.model}
        </h3>

        {/* Specs Grid */}
        <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
          <div className="flex items-center space-x-1.5 text-gray-600">
            <Gauge className="h-4 w-4" />
            <span className="font-dmsans">{formatKm(car.km_driven)}</span>
          </div>
          <div className="flex items-center space-x-1.5 text-gray-600">
            <Fuel className="h-4 w-4" />
            <span className="font-dmsans">{car.fuel_type}</span>
          </div>
          <div className="flex items-center space-x-1.5 text-gray-600">
            <Settings className="h-4 w-4" />
            <span className="font-dmsans">{car.transmission}</span>
          </div>
          <div className="flex items-center space-x-1.5 text-gray-600">
            <Calendar className="h-4 w-4" />
            <span className="font-dmsans">{car.owners || 1} Owner</span>
          </div>
        </div>

        {/* Price */}
        <div className="mt-auto">
          <p className={`font-outfit font-bold text-2xl mb-4 ${isSoldOrBooked ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
            {formatPrice(car.price)}
          </p>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            {isSoldOrBooked ? (
              <>
                <button
                  disabled
                  className="px-4 py-2.5 rounded-full font-dmsans font-medium text-sm bg-gray-200 text-gray-500 cursor-not-allowed col-span-2"
                  data-testid="sold-out-button"
                >
                  {car.status === 'Sold' ? 'SOLD OUT' : 'BOOKED'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate(`/inventory/${car.id}`)}
                  className="px-4 py-2.5 rounded-full font-dmsans font-medium text-sm transition-all duration-200 bg-gray-900 text-white hover:bg-gray-800 hover:shadow-lg"
                  data-testid="view-details-button"
                >
                  View Details
                </button>
                <a
                  href={`https://wa.me/918683996996?text=Hi! I'm interested in ${car.make} ${car.model} (${car.year})`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center space-x-1 px-4 py-2.5 rounded-full font-dmsans font-medium text-sm transition-all duration-200 border-2 border-orange-500 text-orange-500 hover:bg-orange-50"
                  data-testid="whatsapp-button"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>WhatsApp</span>
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
