import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Search, Download, Users, Calendar, Mail, Phone, Filter } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const AdminCustomerLeads = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');

  const fetchLeads = useCallback(async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (sourceFilter) params.append('source', sourceFilter);
      
      const response = await axios.get(`${API}/customer-leads?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLeads(response.data);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Failed to load customer leads');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, sourceFilter]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/customer-leads/export`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `customer_leads_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Leads exported successfully!');
    } catch (error) {
      console.error('Error exporting leads:', error);
      toast.error('Failed to export leads');
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getBudgetLabel = (budget) => {
    const labels = {
      'under_5_lakh': 'Under ₹5 Lakh',
      '5_10_lakh': '₹5-10 Lakh',
      '10_20_lakh': '₹10-20 Lakh',
      '20_50_lakh': '₹20-50 Lakh',
      'above_50_lakh': 'Above ₹50 Lakh'
    };
    return labels[budget] || budget || '-';
  };

  const getCarTypeLabel = (carType) => {
    const labels = {
      'sedan': 'Sedan',
      'suv': 'SUV',
      'hatchback': 'Hatchback',
      'luxury': 'Luxury',
      'electric': 'Electric'
    };
    return labels[carType] || carType || '-';
  };

  return (
    <div className="space-y-6" data-testid="admin-customer-leads">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#2563EB] rounded-xl flex items-center justify-center">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="font-outfit font-bold text-2xl text-gray-900">Customer Leads</h2>
            <p className="font-dmsans text-sm text-gray-500">{leads.length} total leads captured</p>
          </div>
        </div>
        
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-dmsans font-medium"
          data-testid="export-leads-button"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-transparent font-dmsans"
            data-testid="search-leads-input"
          />
        </div>
        
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="pl-10 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-transparent font-dmsans appearance-none cursor-pointer min-w-[150px]"
            data-testid="filter-source-select"
          >
            <option value="">All Sources</option>
            <option value="login_click">Login Click</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#2563EB] border-t-transparent mx-auto"></div>
            <p className="mt-2 text-gray-500 font-dmsans">Loading leads...</p>
          </div>
        ) : leads.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-dmsans">No customer leads found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" data-testid="leads-table">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-dmsans font-semibold text-gray-700 text-sm">Name</th>
                  <th className="px-4 py-3 text-left font-dmsans font-semibold text-gray-700 text-sm">Email</th>
                  <th className="px-4 py-3 text-left font-dmsans font-semibold text-gray-700 text-sm">Mobile</th>
                  <th className="px-4 py-3 text-left font-dmsans font-semibold text-gray-700 text-sm">Budget</th>
                  <th className="px-4 py-3 text-left font-dmsans font-semibold text-gray-700 text-sm">Interest</th>
                  <th className="px-4 py-3 text-left font-dmsans font-semibold text-gray-700 text-sm">Source</th>
                  <th className="px-4 py-3 text-left font-dmsans font-semibold text-gray-700 text-sm">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50 transition-colors" data-testid={`lead-row-${lead.id}`}>
                    <td className="px-4 py-3">
                      <span className="font-dmsans font-medium text-gray-900">{lead.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <a href={`mailto:${lead.email}`} className="font-dmsans text-[#2563EB] hover:underline flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {lead.email}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <a href={`tel:${lead.mobile}`} className="font-dmsans text-gray-700 hover:text-[#2563EB] flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {lead.mobile}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-dmsans text-gray-600 text-sm">{getBudgetLabel(lead.budget)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-dmsans text-gray-600 text-sm">{getCarTypeLabel(lead.car_interest)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-dmsans font-medium">
                        {lead.source === 'login_click' ? 'Login Click' : lead.source}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-dmsans text-gray-500 text-sm flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(lead.created_at)}
                      </span>
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
