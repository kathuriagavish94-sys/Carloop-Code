import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Star, X, Mail, Phone, Calendar, Users, Car, Image, Loader2, Eye, EyeOff, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { AdminCustomerLeads } from './AdminCustomerLeads';
import { AdminDeliveries } from './AdminDeliveries';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [cars, setCars] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [callbackRequests, setCallbackRequests] = useState([]);
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
    gallery: '',
    km_driven: '',
    fuel_type: 'Petrol',
    transmission: 'Manual',
    condition: 'Excellent',
    status: 'Available',
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
  
  // Image branding states
  const [imagePreview, setImagePreview] = useState(null);
  const [brandedPreview, setBrandedPreview] = useState(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [showBrandedPreview, setShowBrandedPreview] = useState(true);
  const [isSubmittingCar, setIsSubmittingCar] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const [carsRes, enquiriesRes, testimonialsRes, callbacksRes] = await Promise.all([
        axios.get(`${API}/cars`),
        axios.get(`${API}/enquiries`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API}/testimonials`),
        axios.get(`${API}/callback-requests`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setCars(carsRes.data);
      setEnquiries(enquiriesRes.data);
      setTestimonials(testimonialsRes.data);
      setCallbackRequests(callbacksRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('admin_token');
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchData();
  }, [navigate, fetchData]);

  const handleAddCar = () => {
    setEditingCar(null);
    setCarFormData({
      make: '',
      model: '',
      year: new Date().getFullYear(),
      price: '',
      image: '',
      gallery: '',
      km_driven: '',
      fuel_type: 'Petrol',
      transmission: 'Manual',
      condition: 'Excellent',
      features: '',
      is_featured: false,
    });
    setImagePreview(null);
    setBrandedPreview(null);
    setShowBrandedPreview(true);
    setShowCarModal(true);
  };

  const handleEditCar = (car) => {
    setEditingCar(car);
    setCarFormData({
      make: car.make,
      model: car.model,
      year: car.year,
      price: car.price,
      image: car.original_image || car.image,
      gallery: car.original_gallery?.join('|') || car.gallery?.join('|') || '',
      km_driven: car.km_driven,
      fuel_type: car.fuel_type,
      transmission: car.transmission,
      condition: car.condition || 'Excellent',
      status: car.status || 'Available',
      features: car.features?.join(', ') || '',
      is_featured: car.is_featured,
    });
    setImagePreview(car.original_image || car.image);
    setBrandedPreview(car.image);
    setShowBrandedPreview(true);
    setShowCarModal(true);
  };

  // Generate branded image preview
  const generateBrandedPreview = useCallback(async (imageUrl) => {
    if (!imageUrl) {
      setBrandedPreview(null);
      return;
    }
    
    setIsGeneratingPreview(true);
    try {
      const response = await axios.post(`${API}/brand-image-preview`, {
        image_url: imageUrl,
        add_background: true,
        add_logo: true,
        add_badge: true,
        logo_opacity: 0.20
      }, { timeout: 30000 }); // 30 second timeout
      
      if (response.data.success) {
        setBrandedPreview(response.data.branded_image);
        
        // Show appropriate message based on whether branding was applied
        if (response.data.branding_applied) {
          toast.success('Branded preview generated!');
        } else {
          // Branding was skipped but we got the original image back
          setImagePreview(response.data.branded_image);
          toast.info(response.data.message || 'Preview ready (branding will be attempted on save)');
        }
      }
    } catch (error) {
      console.error('Error generating branded preview:', error);
      // Don't show error toast - just show the original image
      toast.info('Preview unavailable - original image will be used');
      // Keep the original image preview
      setImagePreview(imageUrl);
      setBrandedPreview(null);
    } finally {
      setIsGeneratingPreview(false);
    }
  }, []);

  // Handle image URL change with debouncing
  const handleImageUrlChange = useCallback((url) => {
    setCarFormData(prev => ({ ...prev, image: url }));
    setImagePreview(url);
    setBrandedPreview(null);
  }, []);

  // Validate image URL on the client side
  const validateImageUrl = useCallback((url) => {
    return new Promise((resolve) => {
      if (!url) {
        resolve({ valid: false, message: 'Image URL is required' });
        return;
      }
      
      // Check if it's a valid URL format
      try {
        new URL(url);
      } catch {
        resolve({ valid: false, message: 'Invalid URL format' });
        return;
      }
      
      // For Google Drive URLs, assume valid (backend will validate)
      if (url.includes('drive.google.com') || url.includes('googleusercontent.com')) {
        resolve({ valid: true, message: 'Google Drive URL detected' });
        return;
      }
      
      // Try to load the image
      const img = new window.Image();
      img.onload = () => resolve({ valid: true, message: 'Image loaded successfully' });
      img.onerror = () => resolve({ valid: false, message: 'Unable to load image. Please check the URL is correct and publicly accessible.' });
      img.src = url;
      
      // Timeout after 10 seconds
      setTimeout(() => {
        resolve({ valid: true, message: 'Image validation timed out, will attempt to use' });
      }, 10000);
    });
  }, []);

  const handleSubmitCar = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('admin_token');

    // Validate image URL first (client-side quick check)
    const imageValidation = await validateImageUrl(carFormData.image);
    if (!imageValidation.valid) {
      toast.error(imageValidation.message);
      return;
    }

    const submitData = {
      ...carFormData,
      price: parseFloat(carFormData.price),
      year: parseInt(carFormData.year),
      km_driven: parseInt(carFormData.km_driven),
      gallery: carFormData.gallery
        ? carFormData.gallery.split('|').map((url) => url.trim()).filter(Boolean)
        : [],
      features: carFormData.features
        .split(',')
        .map((f) => f.trim())
        .filter(Boolean),
    };

    setIsSubmittingCar(true);
    try {
      let response;
      if (editingCar) {
        response = await axios.put(`${API}/cars/${editingCar.id}`, submitData, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 60000, // 60 second timeout for branding
        });
        // Check if branding was applied based on the returned image
        const isBranded = response.data?.image?.startsWith('data:image');
        if (isBranded) {
          toast.success('Car updated with TruVant branding!');
        } else {
          toast.success('Car updated successfully!');
        }
      } else {
        response = await axios.post(`${API}/cars`, submitData, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 60000, // 60 second timeout for branding
        });
        // Check if branding was applied based on the returned image
        const isBranded = response.data?.image?.startsWith('data:image');
        if (isBranded) {
          toast.success('Car added with TruVant branding!');
        } else {
          toast.success('Car added successfully! (Original image used)');
        }
      }
      setShowCarModal(false);
      setImagePreview(null);
      setBrandedPreview(null);
      fetchData();
    } catch (error) {
      console.error('Error submitting car:', error);
      
      // Extract and show specific error message from backend
      let errorMessage = 'Failed to save car';
      
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        errorMessage = 'Request timed out. Image branding may take longer for large images. Please try again with a smaller image.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Session expired. Please login again.';
        localStorage.removeItem('admin_token');
        navigate('/admin/login');
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data?.detail || 'Invalid data provided';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (!navigator.onLine) {
        errorMessage = 'No internet connection. Please check your network.';
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmittingCar(false);
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
                onClick={() => setActiveTab('callbacks')}
                className={`px-6 py-4 font-manrope font-semibold ${
                  activeTab === 'callbacks'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-gray-600 hover:text-primary'
                }`}
                data-testid="callbacks-tab"
              >
                Call Requests ({callbackRequests.length})
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
              <button
                onClick={() => setActiveTab('leads')}
                className={`px-6 py-4 font-manrope font-semibold flex items-center gap-2 ${
                  activeTab === 'leads'
                    ? 'border-b-2 border-[#2563EB] text-[#2563EB]'
                    : 'text-gray-600 hover:text-[#2563EB]'
                }`}
                data-testid="leads-tab"
              >
                <Users className="h-4 w-4" />
                Customer Leads
              </button>
              <button
                onClick={() => setActiveTab('deliveries')}
                className={`px-6 py-4 font-manrope font-semibold flex items-center gap-2 ${
                  activeTab === 'deliveries'
                    ? 'border-b-2 border-green-600 text-green-600'
                    : 'text-gray-600 hover:text-green-600'
                }`}
                data-testid="deliveries-tab"
              >
                <Car className="h-4 w-4" />
                Deliveries
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
                        <th className="px-4 py-3 text-left font-manrope font-semibold text-gray-700">Status</th>
                        <th className="px-4 py-3 text-left font-manrope font-semibold text-gray-700">Featured</th>
                        <th className="px-4 py-3 text-left font-manrope font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cars.map((car) => (
                        <tr key={car.id} className="border-b hover:bg-gray-50" data-testid={`car-row-${car.id}`}>
                          <td className="px-4 py-3">
                            <div className="relative">
                              <img
                                src={car.image}
                                alt={`${car.make} ${car.model}`}
                                className="w-20 h-14 object-cover rounded"
                              />
                              {car.image?.startsWith('data:image') && (
                                <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-[8px] px-1 rounded flex items-center gap-0.5">
                                  <Sparkles className="h-2 w-2" />
                                  <span>Branded</span>
                                </div>
                              )}
                            </div>
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
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              car.status === 'Sold' ? 'bg-red-100 text-red-700' :
                              car.status === 'Booked' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {car.status || 'Available'}
                            </span>
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

            {activeTab === 'callbacks' && (
              <div>
                <h2 className="font-teko text-3xl font-bold text-forest uppercase mb-6">Callback Requests</h2>
                
                {callbackRequests.length === 0 ? (
                  <div className="text-center py-12" data-testid="no-callbacks">
                    <p className="font-manrope text-gray-600">No callback requests yet</p>
                  </div>
                ) : (
                  <div className="space-y-4" data-testid="callbacks-list">
                    {callbackRequests.map((callback) => (
                      <div
                        key={callback.id}
                        className="bg-gray-50 rounded-lg p-6 border border-gray-200"
                        data-testid={`callback-${callback.id}`}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-manrope font-bold text-lg text-gray-900">{callback.name}</h3>
                            <div className="flex items-center space-x-2 mt-2">
                              <Phone className="h-4 w-4 text-primary" />
                              <a href={`tel:${callback.phone}`} className="font-manrope text-primary font-semibold hover:underline">
                                {callback.phone}
                              </a>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1 text-sm text-gray-500">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(callback.created_at)}</span>
                          </div>
                        </div>
                        {callback.car_details && (
                          <div className="mt-3 pt-3 border-t border-gray-300">
                            <p className="font-manrope text-sm text-gray-600">
                              Interested in: <span className="font-semibold text-primary">{callback.car_details}</span>
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
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

            {activeTab === 'leads' && (
              <AdminCustomerLeads />
            )}

            {activeTab === 'deliveries' && (
              <AdminDeliveries />
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

                <div>
                  <label className="block font-manrope font-semibold text-gray-700 mb-2">Status</label>
                  <select
                    value={carFormData.status || 'Available'}
                    onChange={(e) => setCarFormData({ ...carFormData, status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-manrope"
                    data-testid="status-input"
                  >
                    <option value="Available">Available</option>
                    <option value="Booked">Booked</option>
                    <option value="Sold">Sold</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-manrope font-semibold text-gray-700 mb-2">Image URL</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={carFormData.image}
                    onChange={(e) => handleImageUrlChange(e.target.value)}
                    required
                    placeholder="https://example.com/car-image.jpg"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-manrope"
                    data-testid="image-input"
                  />
                  <button
                    type="button"
                    onClick={() => generateBrandedPreview(carFormData.image)}
                    disabled={!carFormData.image || isGeneratingPreview}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    data-testid="generate-preview-button"
                  >
                    {isGeneratingPreview ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    <span className="hidden sm:inline">{isGeneratingPreview ? 'Branding...' : 'Preview'}</span>
                  </button>
                </div>
                
                {/* Image Preview Section */}
                {(imagePreview || brandedPreview) && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-manrope font-semibold text-gray-700 flex items-center gap-2">
                        <Image className="h-4 w-4" />
                        Image Preview
                      </h4>
                      {brandedPreview && (
                        <button
                          type="button"
                          onClick={() => setShowBrandedPreview(!showBrandedPreview)}
                          className="flex items-center gap-2 px-3 py-1 text-sm bg-white border border-gray-300 rounded-full hover:bg-gray-100 transition-colors"
                          data-testid="toggle-preview-button"
                        >
                          {showBrandedPreview ? (
                            <>
                              <Eye className="h-4 w-4 text-blue-600" />
                              <span className="text-blue-600 font-medium">Branded</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-4 w-4 text-gray-600" />
                              <span className="text-gray-600 font-medium">Original</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-white shadow-sm">
                      {isGeneratingPreview && (
                        <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center z-10">
                          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
                          <p className="text-sm text-gray-600 font-manrope">Adding TruVant branding...</p>
                        </div>
                      )}
                      <img
                        src={showBrandedPreview && brandedPreview ? brandedPreview : imagePreview}
                        alt="Car preview"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🚗</text></svg>';
                        }}
                      />
                      {showBrandedPreview && brandedPreview && (
                        <div className="absolute bottom-2 right-2 px-2 py-1 bg-blue-600 text-white text-xs rounded-full font-medium flex items-center gap-1">
                          <Sparkles className="h-3 w-3" />
                          TruVant Branded
                        </div>
                      )}
                    </div>
                    
                    {!brandedPreview && imagePreview && (
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        Click "Preview" to see how TruVant branding will look on this image
                      </p>
                    )}
                  </div>
                )}
                
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-manrope font-semibold text-blue-900 mb-1">📸 Auto-Branding Enabled!</p>
                  <p className="text-xs text-blue-800 mb-2">
                    Images are automatically branded with the TruVant logo, verified badge, and premium styling when saved.
                  </p>
                  <p className="text-xs font-manrope font-semibold text-blue-900 mt-2">Google Drive Images:</p>
                  <ol className="text-xs font-manrope text-blue-800 space-y-1 ml-4 list-decimal">
                    <li>Upload image to Google Drive</li>
                    <li>Right-click → Share → Change to <strong>"Anyone with the link"</strong></li>
                    <li>Copy and paste the share link here</li>
                    <li>System auto-converts to direct image URL ✨</li>
                  </ol>
                </div>
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
                <p className="text-xs text-gray-500 mt-1">Separate multiple features with commas</p>
              </div>

              <div>
                <label className="block font-manrope font-semibold text-gray-700 mb-2">
                  Gallery Images (optional)
                </label>
                <textarea
                  value={carFormData.gallery || ''}
                  onChange={(e) => setCarFormData({ ...carFormData, gallery: e.target.value })}
                  placeholder="https://example.com/image1.jpg|https://drive.google.com/file/d/ABC/view|https://example.com/image3.jpg"
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-manrope"
                  data-testid="gallery-input"
                />
                <p className="text-xs text-gray-500 mt-1">Separate multiple image URLs with | (pipe). Google Drive links supported!</p>
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
                  disabled={isSubmittingCar}
                  className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-[#01352a] transition-colors font-manrope font-bold flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  data-testid="submit-car-button"
                >
                  {isSubmittingCar ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Processing & Branding...</span>
                    </>
                  ) : (
                    <span>{editingCar ? 'Update Car' : 'Add Car'}</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCarModal(false);
                    setImagePreview(null);
                    setBrandedPreview(null);
                  }}
                  disabled={isSubmittingCar}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-manrope font-bold disabled:opacity-50"
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
