import React, { useState } from 'react';
import axios from 'axios';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await axios.post(`${API}/enquiries`, formData);
      toast.success('Your message has been sent successfully! We will contact you soon.');
      setFormData({ name: '', email: '', phone: '', message: '' });
    } catch (error) {
      console.error('Error submitting enquiry:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-ceramic py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="font-teko text-6xl font-bold text-forest uppercase tracking-wide mb-4" data-testid="contact-title">
            Get In Touch
          </h1>
          <p className="font-manrope text-lg text-gray-600 max-w-2xl mx-auto">
            Have questions about our vehicles? We're here to help. Reach out and we'll respond as soon as possible.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-lg p-8" data-testid="contact-form">
            <h2 className="font-teko text-3xl font-bold text-forest uppercase mb-6">Send Us A Message</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block font-manrope font-semibold text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  placeholder="Your Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-manrope"
                  data-testid="contact-name-input"
                />
              </div>

              <div>
                <label className="block font-manrope font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-manrope"
                  data-testid="contact-email-input"
                />
              </div>

              <div>
                <label className="block font-manrope font-semibold text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-manrope"
                  data-testid="contact-phone-input"
                />
              </div>

              <div>
                <label className="block font-manrope font-semibold text-gray-700 mb-2">Message</label>
                <textarea
                  placeholder="Tell us about your requirements..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                  rows="6"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-manrope"
                  data-testid="contact-message-input"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full px-6 py-4 bg-primary text-white rounded-lg hover:bg-[#01352a] transition-colors font-manrope font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="contact-submit-button"
              >
                {submitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="font-teko text-3xl font-bold text-forest uppercase mb-6">Contact Information</h2>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-manrope font-bold text-gray-900 mb-1">Address</h3>
                    <p className="font-manrope text-gray-600">
                      Plot number 1528, Sector - 45<br />
                      Gurgaon, India
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-manrope font-bold text-gray-900 mb-1">Phone</h3>
                    <p className="font-manrope text-gray-600">8683-996-996</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-manrope font-bold text-gray-900 mb-1">Email</h3>
                    <p className="font-manrope text-gray-600">Kathuria.gavish94@gmail.com</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-manrope font-bold text-gray-900 mb-1">Business Hours</h3>
                    <p className="font-manrope text-gray-600">Monday - Saturday: 9:00 AM - 7:00 PM</p>
                    <p className="font-manrope text-gray-600">Sunday: 10:00 AM - 5:00 PM</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-forest rounded-lg shadow-lg p-8 text-white">
              <h3 className="font-teko text-2xl font-bold uppercase mb-4">Visit Our Showroom</h3>
              <p className="font-manrope mb-4">
                Experience our premium collection in person. Our expert team is ready to assist you in finding your perfect vehicle.
              </p>
              <p className="font-manrope font-semibold">
                Schedule a visit today!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};