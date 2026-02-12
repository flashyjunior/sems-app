'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store/app';
import { Building2, Plus, Loader, AlertCircle, CheckCircle, Edit3, Save, X } from 'lucide-react';

interface Pharmacy {
  id: string;
  name: string;
  location?: string;
  address?: string;
  phone?: string;
  email?: string;
  licenseNumber?: string;
  manager?: string;
  isActive: boolean;
  userCount?: number;
}

interface CreatePharmacyForm {
  name: string;
  location: string;
  address: string;
  phone: string;
  email: string;
  licenseNumber: string;
  manager: string;
}

/**
 * Pharmacy Management Component
 * Allows admins to create and manage pharmacies
 */
export function PharmacyManagement() {
  const user = useAppStore((s) => s.user);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  
  const [isOpen, setIsOpen] = useState(false);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<CreatePharmacyForm | null>(null);
  
  // Get auth token from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    setAuthToken(token);
  }, []);
  
  const [formData, setFormData] = useState<CreatePharmacyForm>({
    name: '',
    location: '',
    address: '',
    phone: '',
    email: '',
    licenseNumber: '',
    manager: '',
  });

  // Fetch pharmacies
  const fetchPharmacies = async () => {
    if (!authToken) return;
    
    setLoading(true);
    setError('');
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/pharmacies`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPharmacies(data.data || []);
      } else {
        setError('Failed to load pharmacies');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching pharmacies');
      console.error('Error fetching pharmacies:', err);
    } finally {
      setLoading(false);
    }
  };

  // Create pharmacy
  const handleCreatePharmacy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken) return;

    if (!formData.name.trim()) {
      setError('Pharmacy name is required');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/pharmacies`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSuccess(`[OK] Pharmacy "${data.data.name}" created successfully!`);
        setFormData({
          name: '',
          location: '',
          address: '',
          phone: '',
          email: '',
          licenseNumber: '',
          manager: '',
        });
        // Refresh the list
        await fetchPharmacies();
      } else if (response.status === 409) {
        setError('Pharmacy with this name already exists');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to create pharmacy');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating pharmacy');
      console.error('Error creating pharmacy:', err);
    } finally {
      setLoading(false);
    }
  };

  // Start editing a pharmacy
  const handleEditClick = (pharmacy: Pharmacy) => {
    setEditingId(pharmacy.id);
    setEditFormData({
      name: pharmacy.name,
      location: pharmacy.location || '',
      address: pharmacy.address || '',
      phone: pharmacy.phone || '',
      email: pharmacy.email || '',
      licenseNumber: pharmacy.licenseNumber || '',
      manager: pharmacy.manager || '',
    });
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData(null);
  };

  // Update pharmacy
  const handleUpdatePharmacy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken || !editingId || !editFormData) return;

    if (!editFormData.name.trim()) {
      setError('Pharmacy name is required');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/pharmacies/${editingId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(editFormData),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSuccess(`[OK] Pharmacy "${data.data.name}" updated successfully!`);
        setEditingId(null);
        setEditFormData(null);
        // Refresh the list
        await fetchPharmacies();
      } else if (response.status === 409) {
        setError('Pharmacy with this name already exists');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update pharmacy');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating pharmacy');
      console.error('Error updating pharmacy:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && authToken) {
      fetchPharmacies();
    }
  }, [isOpen, authToken]);

  // Only show for admins
  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        title="Admin: Manage pharmacies"
      >
         Pharmacies
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Pharmacy Management</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 font-bold text-xl"
              >
                
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 flex gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800 flex gap-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {success}
              </div>
            )}

            {/* Create Pharmacy Form */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Create New Pharmacy</h3>
                <span className="text-xs text-red-600 font-medium">* Required field</span>
              </div>
              <form onSubmit={handleCreatePharmacy} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pharmacy Name <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Central Pharmacy"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Ward A, Building 2"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      placeholder="Full physical address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      placeholder="Phone number"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="Pharmacy email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      License Number
                    </label>
                    <input
                      type="text"
                      placeholder="License ID"
                      value={formData.licenseNumber}
                      onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Manager Name
                    </label>
                    <input
                      type="text"
                      placeholder="Name of pharmacy manager"
                      value={formData.manager}
                      onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Create Pharmacy
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Pharmacies List */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Existing Pharmacies ({pharmacies.length})</h3>
              {loading && pharmacies.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Loader className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Loading...
                </div>
              ) : pharmacies.length === 0 ? (
                <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">
                  No pharmacies created yet
                </div>
              ) : (
                <div className="space-y-3">
                  {pharmacies.map((pharmacy) => (
                    <div key={pharmacy.id}>
                      {editingId === pharmacy.id && editFormData ? (
                        // Edit form
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-900 mb-4">Edit Pharmacy</h4>
                          <form onSubmit={handleUpdatePharmacy} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Pharmacy Name <span className="text-red-600">*</span>
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={editFormData.name}
                                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Location
                                </label>
                                <input
                                  type="text"
                                  value={editFormData.location}
                                  onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>

                              <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Address
                                </label>
                                <input
                                  type="text"
                                  value={editFormData.address}
                                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Phone
                                </label>
                                <input
                                  type="tel"
                                  value={editFormData.phone}
                                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Email
                                </label>
                                <input
                                  type="email"
                                  value={editFormData.email}
                                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  License Number
                                </label>
                                <input
                                  type="text"
                                  value={editFormData.licenseNumber}
                                  onChange={(e) => setEditFormData({ ...editFormData, licenseNumber: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>

                              <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Manager Name
                                </label>
                                <input
                                  type="text"
                                  value={editFormData.manager}
                                  onChange={(e) => setEditFormData({ ...editFormData, manager: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
                              >
                                {loading ? (
                                  <>
                                    <Loader className="w-4 h-4 animate-spin" />
                                    Saving...
                                  </>
                                ) : (
                                  <>
                                    <Save className="w-4 h-4" />
                                    Save Changes
                                  </>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelEdit}
                                disabled={loading}
                                className="flex-1 bg-gray-300 text-gray-800 py-2 rounded-lg hover:bg-gray-400 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
                              >
                                <X className="w-4 h-4" />
                                Cancel
                              </button>
                            </div>
                          </form>
                        </div>
                      ) : (
                        // View mode
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              <Building2 className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900">{pharmacy.name}</h4>
                                {pharmacy.location && (
                                  <p className="text-sm text-gray-600"> {pharmacy.location}</p>
                                )}
                                {pharmacy.address && (
                                  <p className="text-sm text-gray-600"> {pharmacy.address}</p>
                                )}
                                {pharmacy.manager && (
                                  <p className="text-sm text-gray-600"> Manager: {pharmacy.manager}</p>
                                )}
                                {pharmacy.phone && (
                                  <p className="text-sm text-gray-600"> {pharmacy.phone}</p>
                                )}
                                <p className="text-xs text-gray-500 mt-1">
                                  ID: {pharmacy.id} | Users: {pharmacy.userCount || 0}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className={`text-xs font-medium px-2 py-1 rounded ${
                                pharmacy.isActive 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {pharmacy.isActive ? 'Active' : 'Inactive'}
                              </span>
                              <button
                                onClick={() => handleEditClick(pharmacy)}
                                className="px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100 rounded transition-colors flex items-center gap-1"
                              >
                                <Edit3 className="w-3 h-3" />
                                Edit
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
