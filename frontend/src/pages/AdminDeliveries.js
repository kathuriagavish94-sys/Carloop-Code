import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Upload, Trash2, MapPin, Car, User, Image as ImageIcon, Plus } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const AdminDeliveries = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    image_url: '',
    car_name: '',
    customer_name: '',
    delivery_location: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const fetchDeliveries = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/delivery-images`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDeliveries(response.data);
    } catch (error) {
      console.error('Error fetching deliveries:', error);
      toast.error('Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = localStorage.getItem('admin_token');
      await axios.post(`${API}/delivery-images`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Delivery added successfully!');
      setShowForm(false);
      setFormData({ image_url: '', car_name: '', customer_name: '', delivery_location: '' });
      fetchDeliveries();
    } catch (error) {
      console.error('Error adding delivery:', error);
      toast.error('Failed to add delivery');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this delivery?')) return;

    try {
      const token = localStorage.getItem('admin_token');
      await axios.delete(`${API}/delivery-images/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Delivery deleted successfully!');
      fetchDeliveries();
    } catch (error) {
      console.error('Error deleting delivery:', error);
      toast.error('Failed to delete delivery');
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6" data-testid="admin-deliveries">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
            <Car className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="font-outfit font-bold text-2xl text-gray-900">Recent Deliveries</h2>
            <p className="font-dmsans text-sm text-gray-500">{deliveries.length} deliveries uploaded</p>
          </div>
        </div>
        
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors font-dmsans font-medium"
          data-testid="add-delivery-button"
        >
          <Plus className="h-4 w-4" />
          Add Delivery
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm" data-testid="delivery-form">
          <h3 className="font-outfit font-semibold text-lg text-gray-900 mb-4">Add New Delivery</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block font-dmsans font-medium text-gray-700 mb-2 text-sm">
                Image URL <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  required
                  placeholder="https://example.com/delivery-image.jpg"
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-transparent font-dmsans"
                  data-testid="delivery-image-input"
                />
              </div>
            </div>

            <div>
              <label className="block font-dmsans font-medium text-gray-700 mb-2 text-sm">
                Car Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Car className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.car_name}
                  onChange={(e) => setFormData({ ...formData, car_name: e.target.value })}
                  required
                  placeholder="e.g., 2022 Maruti Swift"
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-transparent font-dmsans"
                  data-testid="delivery-car-input"
                />
              </div>
            </div>

            <div>
              <label className="block font-dmsans font-medium text-gray-700 mb-2 text-sm">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  required
                  placeholder="e.g., Rahul Sharma"
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-transparent font-dmsans"
                  data-testid="delivery-customer-input"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block font-dmsans font-medium text-gray-700 mb-2 text-sm">
                Delivery Location <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.delivery_location}
                  onChange={(e) => setFormData({ ...formData, delivery_location: e.target.value })}
                  required
                  placeholder="e.g., Gurgaon, Haryana"
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-transparent font-dmsans"
                  data-testid="delivery-location-input"
                />
              </div>
            </div>

            <div className="md:col-span-2 flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-dmsans font-medium disabled:opacity-50"
                data-testid="delivery-submit-button"
              >
                <Upload className="h-4 w-4" />
                {submitting ? 'Uploading...' : 'Upload Delivery'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-dmsans font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Deliveries Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#2563EB] border-t-transparent mx-auto"></div>
            <p className="mt-2 text-gray-500 font-dmsans">Loading deliveries...</p>
          </div>
        ) : deliveries.length === 0 ? (
          <div className="p-8 text-center">
            <Car className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-dmsans">No deliveries uploaded yet</p>
            <p className="text-sm text-gray-400 font-dmsans mt-1">Click "Add Delivery" to upload your first delivery photo</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" data-testid="deliveries-table">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-dmsans font-semibold text-gray-700 text-sm">Image</th>
                  <th className="px-4 py-3 text-left font-dmsans font-semibold text-gray-700 text-sm">Car Name</th>
                  <th className="px-4 py-3 text-left font-dmsans font-semibold text-gray-700 text-sm">Customer</th>
                  <th className="px-4 py-3 text-left font-dmsans font-semibold text-gray-700 text-sm">Location</th>
                  <th className="px-4 py-3 text-left font-dmsans font-semibold text-gray-700 text-sm">Date</th>
                  <th className="px-4 py-3 text-left font-dmsans font-semibold text-gray-700 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {deliveries.map((delivery) => (
                  <tr key={delivery.id} className="hover:bg-gray-50 transition-colors" data-testid={`delivery-row-${delivery.id}`}>
                    <td className="px-4 py-3">
                      <img 
                        src={delivery.image_url} 
                        alt={delivery.car_name}
                        className="w-20 h-14 object-cover rounded-lg"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-dmsans font-medium text-gray-900">{delivery.car_name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-dmsans text-gray-700">{delivery.customer_name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-dmsans text-gray-600 flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {delivery.delivery_location}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-dmsans text-gray-500 text-sm">{formatDate(delivery.created_at)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(delivery.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        data-testid={`delete-delivery-${delivery.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
