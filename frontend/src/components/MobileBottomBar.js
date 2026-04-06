import React, { useState } from 'react';
import { Phone, MessageCircle, SlidersHorizontal, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export const MobileBottomBar = ({ onFilterClick }) => {
  const location = useLocation();
  const phoneNumber = '918683996996';
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent('Hi! I am interested in your vehicles. Can you help me?')}`;

  // Only show on certain pages
  const showOnPages = ['/', '/inventory', '/contact'];
  const isInventoryPage = location.pathname === '/inventory';
  
  if (!showOnPages.includes(location.pathname) && !location.pathname.startsWith('/inventory/')) {
    return null;
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
      {/* Glassmorphism background */}
      <div className="bg-white/90 backdrop-blur-xl border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
        <div className="flex items-center justify-around py-3 px-4">
          {/* Call Button */}
          <a
            href="tel:8683996996"
            className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors"
            data-testid="mobile-call-btn"
          >
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <Phone className="h-5 w-5 text-white" />
            </div>
            <span className="font-dmsans text-xs font-medium text-gray-700">Call</span>
          </a>

          {/* WhatsApp Button */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors"
            data-testid="mobile-whatsapp-btn"
          >
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-white" />
            </div>
            <span className="font-dmsans text-xs font-medium text-gray-700">WhatsApp</span>
          </a>

          {/* Filter Button - Only on Inventory Page */}
          {isInventoryPage && onFilterClick && (
            <button
              onClick={onFilterClick}
              className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors"
              data-testid="mobile-filter-btn"
            >
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                <SlidersHorizontal className="h-5 w-5 text-white" />
              </div>
              <span className="font-dmsans text-xs font-medium text-gray-700">Filters</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
