import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Plus, Trash2, X, Image, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const AdminFamilies = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    image_url: '',
    caption: '',
  });

  const fetchDeliveries = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/family-deliveries`);
      setDeliveries(response.data);
    } catch (error) {
      console.error('Error fetching family deliveries:', error);
      toast.error('Failed to load family deliveries');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('admin_token');
    
    if (!formData.image_url) {
      toast.error('Please enter an image URL');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`${API}/family-deliveries`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Family delivery image added!');
      setShowModal(false);
      setFormData({ image_url: '', caption: '' });
      fetchDeliveries();
    } catch (error) {
      console.error('Error adding family delivery:', error);
      toast.error('Failed to add family delivery image');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return;
    
    const token = localStorage.getItem('admin_token');
    try {
      await axios.delete(`${API}/family-deliveries/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Image deleted successfully');
      fetchDeliveries();
    } catch (error) {
      console.error('Error deleting family delivery:', error);
      toast.error('Failed to delete image');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-manrope font-bold text-2xl text-gray-900">
            Families Catered
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            Manage images for the "Families Catered So Far" carousel on the homepage
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-[#01352a] transition-colors font-manrope font-semibold"
          data-testid="add-family-button"
        >
          <Plus className="h-5 w-5" />
          Add Image
        </button>
      </div>

      {/* Stats */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <Image className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900">{deliveries.length}</p>
            <p className="text-sm text-gray-600">Total Images in Carousel</p>
          </div>
        </div>
      </div>

      {/* Images Grid */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-2 text-gray-600">Loading images...</p>
        </div>
      ) : deliveries.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Image className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No images yet</h3>
          <p className="text-gray-600 mb-4">Add your first family delivery image to get started</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-[#01352a] transition-colors"
          >
            Add First Image
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {deliveries.map((delivery) => (
            <div
              key={delivery.id}
              className="group relative aspect-square rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow"
              data-testid={`family-image-${delivery.id}`}
            >
              <img
                src={delivery.image_url}
                alt={delivery.caption || 'Family delivery'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23f3f4f6" width="100" height="100"/><text x="50" y="50" text-anchor="middle" dominant-baseline="middle" fill="%239ca3af" font-size="12">Error</text></svg>';
                }}
              />
              {delivery.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                  <p className="text-white text-xs truncate">{delivery.caption}</p>
                </div>
              )}
              <button
                onClick={() => handleDelete(delivery.id)}
                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                data-testid={`delete-family-${delivery.id}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="font-manrope font-bold text-xl text-gray-900">
                Add Family Delivery Image
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block font-manrope font-semibold text-gray-700 mb-2">
                  Image URL *
                </label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  required
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  data-testid="family-image-url-input"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supports direct URLs and Google Drive links
                </p>
              </div>

              <div>
                <label className="block font-manrope font-semibold text-gray-700 mb-2">
                  Caption (Optional)
                </label>
                <input
                  type="text"
                  value={formData.caption}
                  onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                  placeholder="e.g., Happy family with their new car!"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  data-testid="family-caption-input"
                />
              </div>

              {/* Preview */}
              {formData.image_url && (
                <div>
                  <label className="block font-manrope font-semibold text-gray-700 mb-2">
                    Preview
                  </label>
                  <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23f3f4f6" width="100" height="100"/><text x="50" y="50" text-anchor="middle" dominant-baseline="middle" fill="%239ca3af" font-size="10">Invalid URL</text></svg>';
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-[#01352a] transition-colors font-manrope font-bold flex items-center justify-center gap-2 disabled:opacity-70"
                  data-testid="submit-family-button"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Image'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-manrope font-bold"
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
