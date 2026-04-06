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

  const getBadge = () => {
    if (car.is_featured) return { text: 'FEATURED', color: 'bg-accent text-white' };
    if (car.status === 'Sold') return { text: 'SOLD', color: 'bg-red-600 text-white' };
    if (car.status === 'Booked') return { text: 'BOOKED', color: 'bg-yellow-500 text-white' };
    if (car.year >= 2023) return { text: 'NEW ARRIVAL', color: 'bg-success text-white' };
    return null;
  };

  const badge = getBadge();

  return (
    <div 
      className={`group bg-white rounded-card overflow-hidden border border-gray-100 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 flex flex-col h-full ${
        isSoldOrBooked ? 'opacity-60' : ''
      }`}
      data-testid={`car-card-${car.id}`}
    >
      {/* Image Section */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-50">
        <img
          src={car.image}
          alt={`${car.make} ${car.model}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {badge && (
          <div className={`absolute top-4 left-4 px-3 py-1.5 rounded-badge text-xs font-bold ${badge.color} shadow-lg`}>
            {badge.text}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-5 flex flex-col flex-grow">
        {/* Car Title */}
        <h3 className="font-outfit font-semibold text-lg text-text-primary mb-1 truncate">
          {car.year} {car.make} {car.model}
        </h3>

        {/* Specs Grid */}
        <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
          <div className="flex items-center space-x-1.5 text-text-secondary">
            <Gauge className="h-4 w-4" />
            <span className="font-dmsans">{formatKm(car.km_driven)}</span>
          </div>
          <div className="flex items-center space-x-1.5 text-text-secondary">
            <Fuel className="h-4 w-4" />
            <span className="font-dmsans">{car.fuel_type}</span>
          </div>
          <div className="flex items-center space-x-1.5 text-text-secondary">
            <Settings className="h-4 w-4" />
            <span className="font-dmsans">{car.transmission}</span>
          </div>
          <div className="flex items-center space-x-1.5 text-text-secondary">
            <Calendar className="h-4 w-4" />
            <span className="font-dmsans">{car.owners || 1} Owner</span>
          </div>
        </div>

        {/* Price */}
        <div className="mt-auto">
          <p className="font-outfit font-bold text-2xl text-primary mb-4">
            {formatPrice(car.price)}
          </p>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate(`/inventory/${car.id}`)}
              disabled={isSoldOrBooked}
              className={`px-4 py-2.5 rounded-full font-dmsans font-medium text-sm transition-all duration-200 ${
                isSoldOrBooked
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-primary text-white hover:bg-primary-hover hover:shadow-button'
              }`}
              data-testid="view-details-button"
            >
              View Details
            </button>
            <a
              href={`https://wa.me/918683996996?text=Hi! I'm interested in ${car.make} ${car.model} (${car.year})`}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-center space-x-1 px-4 py-2.5 rounded-full font-dmsans font-medium text-sm transition-all duration-200 ${
                isSoldOrBooked
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none'
                  : 'border-2 border-accent text-accent hover:bg-accent-light'
              }`}
              data-testid="whatsapp-button"
            >
              <MessageCircle className="h-4 w-4" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};