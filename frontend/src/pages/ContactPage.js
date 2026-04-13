import React, { useState } from 'react';
import axios from 'axios';
import { MapPin, Phone, Mail, Clock, Send, MessageCircle, CheckCircle } from 'lucide-react';
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
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await axios.post(`${API}/enquiries`, formData);
      toast.success('Your message has been sent successfully!');
      setFormData({ name: '', email: '', phone: '', message: '' });
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 5000);
    } catch (error) {
      console.error('Error submitting enquiry:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: 'Address',
      content: 'Plot number 1528, Sector - 45\nGurgaon, India',
      color: 'bg-orange-500',
    },
    {
      icon: Phone,
      title: 'Phone',
      content: '8683-996-996',
      link: 'tel:8683996996',
      color: 'bg-green-500',
    },
    {
      icon: Mail,
      title: 'Email',
      content: 'Kathuria.gavish94@gmail.com',
      link: 'mailto:Kathuria.gavish94@gmail.com',
      color: 'bg-blue-500',
    },
    {
      icon: Clock,
      title: 'Business Hours',
      content: 'Mon - Sat: 9:00 AM - 7:00 PM\nSunday: 10:00 AM - 5:00 PM',
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gray-900 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-outfit font-bold text-4xl md:text-5xl lg:text-6xl text-white mb-4" data-testid="contact-title">
            Get In <span className="text-orange-500">Touch</span>
          </h1>
          <p className="font-dmsans text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
            Have questions about our vehicles? We're here to help. Reach out and we'll respond as soon as possible.
          </p>
        </div>
      </section>

      {/* Contact Cards */}
      <section className="py-12 -mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {contactInfo.map((item) => {
              const Icon = item.icon;
              const Content = item.link ? (
                <a key={item.title} href={item.link} className="hover:text-orange-500 transition-colors">
                  {item.content}
                </a>
              ) : (
                <span className="whitespace-pre-line">{item.content}</span>
              );

              return (
                <div
                  key={item.title}
                  className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-shadow"
                >
                  <div className={`w-12 h-12 ${item.color} rounded-xl flex items-center justify-center mb-4`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-outfit font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="font-dmsans text-sm text-gray-600">{Content}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contact Form */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8" data-testid="contact-form">
              <h2 className="font-outfit font-bold text-2xl text-gray-900 mb-2">Send Us A Message</h2>
              <p className="font-dmsans text-gray-600 mb-6">Fill out the form below and we'll get back to you within 24 hours.</p>

              {submitted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                  <h3 className="font-outfit font-semibold text-xl text-gray-900 mb-2">Message Sent!</h3>
                  <p className="font-dmsans text-gray-600">We'll get back to you soon.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block font-dmsans font-medium text-gray-700 mb-2">Name</label>
                    <input
                      type="text"
                      placeholder="Your Name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent font-dmsans transition-all"
                      data-testid="contact-name-input"
                    />
                  </div>

                  <div>
                    <label className="block font-dmsans font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      placeholder="your.email@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent font-dmsans transition-all"
                      data-testid="contact-email-input"
                    />
                  </div>

                  <div>
                    <label className="block font-dmsans font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent font-dmsans transition-all"
                      data-testid="contact-phone-input"
                    />
                  </div>

                  <div>
                    <label className="block font-dmsans font-medium text-gray-700 mb-2">Message</label>
                    <textarea
                      placeholder="Tell us about your requirements..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                      rows="5"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent font-dmsans transition-all resize-none"
                      data-testid="contact-message-input"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-orange-500 text-white rounded-full font-dmsans font-semibold text-lg hover:bg-orange-600 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    data-testid="contact-submit-button"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5" />
                        <span>Send Message</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Quick Contact */}
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 text-white">
                <h3 className="font-outfit font-bold text-2xl mb-4">Need Immediate Help?</h3>
                <p className="font-dmsans text-gray-300 mb-6">
                  Our team is available to assist you. Reach out via phone or WhatsApp for quick responses.
                </p>
                <div className="space-y-3">
                  <a
                    href="tel:8683996996"
                    className="flex items-center justify-center gap-2 w-full px-6 py-4 bg-white text-gray-900 rounded-full font-dmsans font-semibold hover:bg-gray-100 transition-colors"
                  >
                    <Phone className="h-5 w-5" />
                    <span>Call 8683-996-996</span>
                  </a>
                  <a
                    href="https://wa.me/918683996996?text=Hi!%20I%20have%20a%20query%20about%20your%20vehicles."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full px-6 py-4 bg-green-500 text-white rounded-full font-dmsans font-semibold hover:bg-green-600 transition-colors"
                  >
                    <MessageCircle className="h-5 w-5" />
                    <span>WhatsApp Us</span>
                  </a>
                </div>
              </div>

              {/* Visit Showroom */}
              <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                <h3 className="font-outfit font-bold text-xl text-gray-900 mb-4">Visit Our Showroom</h3>
                <p className="font-dmsans text-gray-600 mb-4">
                  Experience our premium collection in person. Our expert team is ready to assist you in finding your perfect vehicle.
                </p>
                <div className="aspect-video rounded-xl overflow-hidden bg-gray-100">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3509.4511!2d77.0528!3d28.4134!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjjCsDI0JzQ4LjIiTiA3N8KwMDMnMTAuMSJF!5e0!3m2!1sen!2sin!4v1234567890"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="TruVant Location"
                  ></iframe>
                </div>
                <p className="font-dmsans text-sm text-gray-500 mt-3">
                  Plot number 1528, Sector - 45, Gurgaon, India
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
