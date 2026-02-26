import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Star, X, Mail, Phone, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [cars, setCars] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('cars');
  const [showCarModal, setShowCarModal] = useState(false);
  const [showTestimonialModal, setShowTestimonialModal] = useState(false);
  const [editingCar, setEditingCar] = useState(null);
  const [carFormData, setCarFormData] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    price: '',
    image: '',
    km_driven: '',
    fuel_type: 'Petrol',
    transmission: 'Manual',
    condition: 'Excellent',
    features: '',
    is_featured: false,
  });
  const [testimonialFormData, setTestimonialFormData] = useState({
    customer_name: '',
    youtube_url: '',
    is_active: true,
  });
  const [uploadingCsv, setUploadingCsv] = useState(false);
  const [csvResult, setCsvResult] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const [carsRes, enquiriesRes, testimonialsRes] = await Promise.all([
        axios.get(`${API}/cars`),
        axios.get(`${API}/enquiries`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API}/testimonials`),
      ]);
      setCars(carsRes.data);
      setEnquiries(enquiriesRes.data);
      setTestimonials(testimonialsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('admin_token');
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddCar = () => {
    setEditingCar(null);
    setCarFormData({
      make: '',
      model: '',
      year: new Date().getFullYear(),
      price: '',
      image: '',
      km_driven: '',
      fuel_type: 'Petrol',
      transmission: 'Manual',
      condition: 'Excellent',
      features: '',
      is_featured: false,
    });
    setShowCarModal(true);
  };

  const handleEditCar = (car) => {
    setEditingCar(car);
    setCarFormData({
      make: car.make,
      model: car.model,
      year: car.year,
      price: car.price,
      image: car.image,
      km_driven: car.km_driven,
      fuel_type: car.fuel_type,
      transmission: car.transmission,
      condition: car.condition || 'Excellent',
      features: car.features?.join(', ') || '',
      is_featured: car.is_featured,
    });
    setShowCarModal(true);
  };

  const handleSubmitCar = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('admin_token');

    const submitData = {
      ...carFormData,
      price: parseFloat(carFormData.price),
      year: parseInt(carFormData.year),
      km_driven: parseInt(carFormData.km_driven),
      features: carFormData.features
        .split(',')
        .map((f) => f.trim())
        .filter(Boolean),
    };

    try {
      if (editingCar) {
        await axios.put(`${API}/cars/${editingCar.id}`, submitData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Car updated successfully!');
      } else {
        await axios.post(`${API}/cars`, submitData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Car added successfully!');
      }
      setShowCarModal(false);
      fetchData();
    } catch (error) {
      console.error('Error submitting car:', error);
      toast.error('Failed to save car');
    }
  };

  const handleDeleteCar = async (carId) => {
    if (!window.confirm('Are you sure you want to delete this car?')) return;

    const token = localStorage.getItem('admin_token');
    try {
      await axios.delete(`${API}/cars/${carId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Car deleted successfully!');
      fetchData();
    } catch (error) {
      console.error('Error deleting car:', error);
      toast.error('Failed to delete car');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await axios.get(`${API}/cars/template/download`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'carloop_inventory_template.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Template downloaded!');
    } catch (error) {
      console.error('Error downloading template:', error);
      toast.error('Failed to download template');
    }
  };

  const handleCsvUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadingCsv(true);
    setCsvResult(null);
    const token = localStorage.getItem('admin_token');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API}/cars/bulk-upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setCsvResult(response.data);
      toast.success(`Upload complete! Added: ${response.data.added}, Updated: ${response.data.updated}`);
      fetchData();
      event.target.value = '';
    } catch (error) {
      console.error('Error uploading CSV:', error);
      toast.error('Failed to upload CSV file');
    } finally {
      setUploadingCsv(false);
    }
  };

  const convertGoogleDriveUrl = async (url) => {
    if (!url || !url.includes('drive.google.com')) return url;
    
    try {
      const response = await axios.post(`${API}/convert-drive-url`, { url });
      return response.data.converted;
    } catch (error) {
      console.error('Error converting Google Drive URL:', error);
      return url;
    }
  };

  const handleAddTestimonial = () => {
    setTestimonialFormData({
      customer_name: '',
      youtube_url: '',
      is_active: true,
    });
    setShowTestimonialModal(true);
  };

  const handleSubmitTestimonial = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('admin_token');

    try {
      await axios.post(`${API}/testimonials`, testimonialFormData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Testimonial added successfully!');
      setShowTestimonialModal(false);
      fetchData();
    } catch (error) {
      console.error('Error submitting testimonial:', error);
      toast.error(error.response?.data?.detail || 'Failed to add testimonial. Please check the YouTube URL.');
    }
  };

  const handleDeleteTestimonial = async (testimonialId) => {
    if (!window.confirm('Are you sure you want to delete this testimonial?')) return;

    const token = localStorage.getItem('admin_token');
    try {
      await axios.delete(`${API}/testimonials/${testimonialId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Testimonial deleted successfully!');
      fetchData();
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      toast.error('Failed to delete testimonial');
    }
  };

  const formatPrice = (price) => {
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(2)} Cr`;
    } else if (price >= 100000) {
      return `₹${(price / 100000).toFixed(2)} Lakh`;
    }
    return `₹${price.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="font-teko text-5xl font-bold text-forest uppercase" data-testid="dashboard-title">
            Admin Dashboard
          </h1>
          <p className="font-manrope text-gray-600 mt-2">Manage your inventory and enquiries</p>
        </div>

        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('cars')}
                className={`px-6 py-4 font-manrope font-semibold ${
                  activeTab === 'cars'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-gray-600 hover:text-primary'
                }`}
                data-testid="cars-tab"
              >
                Inventory ({cars.length})
              </button>
              <button
                onClick={() => setActiveTab('enquiries')}
                className={`px-6 py-4 font-manrope font-semibold ${
                  activeTab === 'enquiries'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-gray-600 hover:text-primary'
                }`}
                data-testid="enquiries-tab"
              >
                Enquiries ({enquiries.length})
              </button>
              <button
                onClick={() => setActiveTab('testimonials')}
                className={`px-6 py-4 font-manrope font-semibold ${
                  activeTab === 'testimonials'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-gray-600 hover:text-primary'
                }`}
                data-testid="testimonials-tab"
              >
                Testimonials ({testimonials.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'cars' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="font-teko text-3xl font-bold text-forest uppercase">Manage Inventory</h2>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleDownloadTemplate}
                      className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-manrope font-semibold"
                      data-testid="download-template-button"
                    >
                      Download CSV Template
                    </button>
                    <label className="px-6 py-3 bg-accent text-white rounded-lg hover:bg-[#d94d0a] transition-colors font-manrope font-semibold cursor-pointer inline-flex items-center space-x-2">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleCsvUpload}
                        className="hidden"
                        disabled={uploadingCsv}
                        data-testid="csv-upload-input"
                      />
                      <span>{uploadingCsv ? 'Uploading...' : 'Upload CSV'}</span>
                    </label>
                    <button
                      onClick={handleAddCar}
                      className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-[#01352a] transition-colors font-manrope font-semibold flex items-center space-x-2"
                      data-testid="add-car-button"
                    >
                      <Plus className="h-5 w-5" />
                      <span>Add Car</span>
                    </button>
                  </div>
                </div>

                {csvResult && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg" data-testid="csv-result">
                    <h3 className="font-manrope font-bold text-green-800 mb-2">CSV Upload Results:</h3>
                    <div className="font-manrope text-sm text-green-700">
                      <p>✓ Added: {csvResult.added} cars</p>
                      <p>✓ Updated: {csvResult.updated} cars</p>
                      {csvResult.errors && csvResult.errors.length > 0 && (
                        <div className="mt-2">
                          <p className="text-red-700 font-semibold">Errors:</p>
                          <ul className="list-disc list-inside text-red-600">
                            {csvResult.errors.map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full" data-testid="cars-table">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left font-manrope font-semibold text-gray-700">Image</th>
                        <th className="px-4 py-3 text-left font-manrope font-semibold text-gray-700">Car</th>
                        <th className="px-4 py-3 text-left font-manrope font-semibold text-gray-700">Price</th>
                        <th className="px-4 py-3 text-left font-manrope font-semibold text-gray-700">Year</th>
                        <th className="px-4 py-3 text-left font-manrope font-semibold text-gray-700">KM</th>
                        <th className="px-4 py-3 text-left font-manrope font-semibold text-gray-700">Featured</th>
                        <th className="px-4 py-3 text-left font-manrope font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cars.map((car) => (
                        <tr key={car.id} className="border-b hover:bg-gray-50" data-testid={`car-row-${car.id}`}>
                          <td className="px-4 py-3">
                            <img
                              src={car.image}
                              alt={`${car.make} ${car.model}`}
                              className="w-20 h-14 object-cover rounded"
                            />
                          </td>
                          <td className="px-4 py-3 font-manrope font-semibold text-gray-900">
                            {car.make} {car.model}
                          </td>
                          <td className="px-4 py-3 font-manrope text-gray-700">{formatPrice(car.price)}</td>
                          <td className="px-4 py-3 font-manrope text-gray-700">{car.year}</td>
                          <td className="px-4 py-3 font-manrope text-gray-700">
                            {car.km_driven.toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            {car.is_featured && <Star className="h-5 w-5 text-accent fill-accent" />}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditCar(car)}
                                className="p-2 text-primary hover:bg-primary hover:text-white rounded transition-colors"
                                data-testid={`edit-car-${car.id}`}
                              >
                                <Edit className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleDeleteCar(car.id)}
                                className="p-2 text-red-600 hover:bg-red-600 hover:text-white rounded transition-colors"
                                data-testid={`delete-car-${car.id}`}
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'enquiries' && (
              <div>
                <h2 className="font-teko text-3xl font-bold text-forest uppercase mb-6">Customer Enquiries</h2>
                
                {enquiries.length === 0 ? (
                  <div className="text-center py-12" data-testid="no-enquiries">
                    <p className="font-manrope text-gray-600">No enquiries yet</p>
                  </div>
                ) : (
                  <div className="space-y-4" data-testid="enquiries-list">
                    {enquiries.map((enquiry) => (
                      <div
                        key={enquiry.id}
                        className="bg-gray-50 rounded-lg p-6 border border-gray-200"
                        data-testid={`enquiry-${enquiry.id}`}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-manrope font-bold text-lg text-gray-900">{enquiry.name}</h3>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                              <span className="flex items-center space-x-1">
                                <Mail className="h-4 w-4" />
                                <span>{enquiry.email}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <Phone className="h-4 w-4" />
                                <span>{enquiry.phone}</span>
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1 text-sm text-gray-500">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(enquiry.created_at)}</span>
                          </div>
                        </div>
                        <p className="font-manrope text-gray-700 mb-2">{enquiry.message}</p>
                        {enquiry.car_id && (
                          <div className="mt-3 pt-3 border-t border-gray-300">
                            <p className="font-manrope text-sm text-gray-600">
                              Enquiry for: <span className="font-semibold">Car ID {enquiry.car_id}</span>
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'testimonials' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="font-teko text-3xl font-bold text-forest uppercase">Manage Testimonials</h2>
                  <button
                    onClick={handleAddTestimonial}
                    className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-[#01352a] transition-colors font-manrope font-semibold flex items-center space-x-2"
                    data-testid="add-testimonial-button"
                  >
                    <Plus className="h-5 w-5" />
                    <span>Add Testimonial</span>
                  </button>
                </div>

                {testimonials.length === 0 ? (
                  <div className="text-center py-12" data-testid="no-testimonials">
                    <p className="font-manrope text-gray-600">No testimonials yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="testimonials-grid">
                    {testimonials.map((testimonial) => (
                      <div
                        key={testimonial.id}
                        className="bg-white rounded-lg overflow-hidden border border-gray-200"
                        data-testid={`testimonial-${testimonial.id}`}
                      >
                        <div className="aspect-video">
                          <iframe
                            width="100%"
                            height="100%"
                            src={`https://www.youtube.com/embed/${testimonial.video_id}`}
                            title={`Testimonial by ${testimonial.customer_name}`}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          ></iframe>
                        </div>
                        <div className="p-4">
                          <div className="flex justify-between items-center">
                            <p className="font-manrope font-semibold text-gray-900">{testimonial.customer_name}</p>
                            <button
                              onClick={() => handleDeleteTestimonial(testimonial.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                              data-testid={`delete-testimonial-${testimonial.id}`}
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                          <div className="mt-2">
                            <span className={`inline-block px-2 py-1 text-xs rounded ${testimonial.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                              {testimonial.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showTestimonialModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" data-testid="testimonial-modal">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="font-teko text-3xl font-bold text-forest uppercase">
                Add Testimonial
              </h3>
              <button
                onClick={() => setShowTestimonialModal(false)}
                className="text-gray-500 hover:text-gray-700"
                data-testid="close-testimonial-modal"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmitTestimonial} className="p-6 space-y-4" data-testid="testimonial-form">
              <div>
                <label className="block font-manrope font-semibold text-gray-700 mb-2">Customer Name</label>
                <input
                  type="text"
                  value={testimonialFormData.customer_name}
                  onChange={(e) => setTestimonialFormData({ ...testimonialFormData, customer_name: e.target.value })}
                  required
                  placeholder="John Doe"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-manrope"
                  data-testid="customer-name-input"
                />
              </div>

              <div>
                <label className="block font-manrope font-semibold text-gray-700 mb-2">YouTube Video URL</label>
                <input
                  type="url"
                  value={testimonialFormData.youtube_url}
                  onChange={(e) => setTestimonialFormData({ ...testimonialFormData, youtube_url: e.target.value })}
                  required
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-manrope"
                  data-testid="youtube-url-input"
                />
                <p className="text-sm text-gray-500 mt-1">Accepts: YouTube watch, share, embed, or shorts URLs</p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="testimonial_active"
                  checked={testimonialFormData.is_active}
                  onChange={(e) => setTestimonialFormData({ ...testimonialFormData, is_active: e.target.checked })}
                  className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                  data-testid="testimonial-active-checkbox"
                />
                <label htmlFor="testimonial_active" className="font-manrope font-semibold text-gray-700">
                  Show on Homepage
                </label>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-[#01352a] transition-colors font-manrope font-bold"
                  data-testid="submit-testimonial-button"
                >
                  Add Testimonial
                </button>
                <button
                  type="button"
                  onClick={() => setShowTestimonialModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-manrope font-bold"
                  data-testid="cancel-testimonial-button"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" data-testid="car-modal">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="font-teko text-3xl font-bold text-forest uppercase">
                {editingCar ? 'Edit Car' : 'Add New Car'}
              </h3>
              <button
                onClick={() => setShowCarModal(false)}
                className="text-gray-500 hover:text-gray-700"
                data-testid="close-modal"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmitCar} className="p-6 space-y-4" data-testid="car-form">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-manrope font-semibold text-gray-700 mb-2">Make</label>
                  <input
                    type="text"
                    value={carFormData.make}
                    onChange={(e) => setCarFormData({ ...carFormData, make: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-manrope"
                    data-testid="make-input"
                  />
                </div>

                <div>
                  <label className="block font-manrope font-semibold text-gray-700 mb-2">Model</label>
                  <input
                    type="text"
                    value={carFormData.model}
                    onChange={(e) => setCarFormData({ ...carFormData, model: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-manrope"
                    data-testid="model-input"
                  />
                </div>

                <div>
                  <label className="block font-manrope font-semibold text-gray-700 mb-2">Year</label>
                  <input
                    type="number"
                    value={carFormData.year}
                    onChange={(e) => setCarFormData({ ...carFormData, year: e.target.value })}
                    required
                    min="1990"
                    max={new Date().getFullYear() + 1}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-manrope"
                    data-testid="year-input"
                  />
                </div>

                <div>
                  <label className="block font-manrope font-semibold text-gray-700 mb-2">Price (₹)</label>
                  <input
                    type="number"
                    value={carFormData.price}
                    onChange={(e) => setCarFormData({ ...carFormData, price: e.target.value })}
                    required
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-manrope"
                    data-testid="price-input"
                  />
                </div>

                <div>
                  <label className="block font-manrope font-semibold text-gray-700 mb-2">KM Driven</label>
                  <input
                    type="number"
                    value={carFormData.km_driven}
                    onChange={(e) => setCarFormData({ ...carFormData, km_driven: e.target.value })}
                    required
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-manrope"
                    data-testid="km-input"
                  />
                </div>

                <div>
                  <label className="block font-manrope font-semibold text-gray-700 mb-2">Fuel Type</label>
                  <select
                    value={carFormData.fuel_type}
                    onChange={(e) => setCarFormData({ ...carFormData, fuel_type: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-manrope"
                    data-testid="fuel-input"
                  >
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                    <option value="CNG">CNG</option>
                    <option value="Electric">Electric</option>
                  </select>
                </div>

                <div>
                  <label className="block font-manrope font-semibold text-gray-700 mb-2">Transmission</label>
                  <select
                    value={carFormData.transmission}
                    onChange={(e) => setCarFormData({ ...carFormData, transmission: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-manrope"
                    data-testid="transmission-input"
                  >
                    <option value="Manual">Manual</option>
                    <option value="Automatic">Automatic</option>
                  </select>
                </div>

                <div>
                  <label className="block font-manrope font-semibold text-gray-700 mb-2">Condition</label>
                  <select
                    value={carFormData.condition}
                    onChange={(e) => setCarFormData({ ...carFormData, condition: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-manrope"
                    data-testid="condition-input"
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-manrope font-semibold text-gray-700 mb-2">Image URL</label>
                <input
                  type="url"
                  value={carFormData.image}
                  onChange={(e) => setCarFormData({ ...carFormData, image: e.target.value })}
                  required
                  placeholder="https://example.com/car-image.jpg"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-manrope"
                  data-testid="image-input"
                />
              </div>

              <div>
                <label className="block font-manrope font-semibold text-gray-700 mb-2">
                  Features (comma-separated)
                </label>
                <input
                  type="text"
                  value={carFormData.features}
                  onChange={(e) => setCarFormData({ ...carFormData, features: e.target.value })}
                  placeholder="Sunroof, Leather Seats, Navigation"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-manrope"
                  data-testid="features-input"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_featured"
                  checked={carFormData.is_featured}
                  onChange={(e) => setCarFormData({ ...carFormData, is_featured: e.target.checked })}
                  className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                  data-testid="featured-checkbox"
                />
                <label htmlFor="is_featured" className="font-manrope font-semibold text-gray-700">
                  Mark as Featured
                </label>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-[#01352a] transition-colors font-manrope font-bold"
                  data-testid="submit-car-button"
                >
                  {editingCar ? 'Update Car' : 'Add Car'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCarModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-manrope font-bold"
                  data-testid="cancel-button"
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
