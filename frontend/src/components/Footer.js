import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin } from 'lucide-react';
import { CircularLogo } from './CircularLogo';

export const Footer = () => {
  return (
    <footer className="bg-[#0F172A] text-white" data-testid="footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <CircularLogo size="small" />
              <span className="font-outfit font-bold text-xl">TruVant</span>
            </div>
            <p className="font-dmsans text-gray-400 text-sm">
              Your trusted partner in finding the perfect pre-owned vehicle.
            </p>
          </div>

          <div>
            <h3 className="font-outfit text-xl font-semibold mb-4 uppercase">Quick Links</h3>
            <ul className="space-y-2 font-dmsans text-sm">
              <li>
                <Link to="/" className="text-gray-300 hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/inventory" className="text-gray-300 hover:text-white transition-colors">
                  Inventory
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-300 hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-outfit text-xl font-semibold mb-4 uppercase">Contact Info</h3>
            <ul className="space-y-3 font-dmsans text-sm text-gray-300">
              <li className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <a href="tel:8683996996" className="hover:text-white transition-colors">
                  8683-996-996
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <a href="mailto:Kathuria.gavish94@gmail.com" className="hover:text-white transition-colors">
                  Kathuria.gavish94@gmail.com
                </a>
              </li>
              <li className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 mt-1" />
                <span>Plot number 1528, Sector - 45 Gurgaon</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-outfit text-xl font-semibold mb-4 uppercase">Business Hours</h3>
            <ul className="space-y-2 font-dmsans text-sm text-gray-300">
              <li>Monday - Saturday</li>
              <li className="font-semibold text-white">9:00 AM - 7:00 PM</li>
              <li className="mt-4">Sunday</li>
              <li className="font-semibold text-white">10:00 AM - 5:00 PM</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-600 mt-8 pt-8 text-center">
          <p className="font-dmsans text-sm text-gray-300">
            © 2026 TruVant. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};