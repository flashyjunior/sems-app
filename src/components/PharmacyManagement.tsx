'use client';

import React, { useEffect, useState } from 'react';
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

interface PharmacyManagementProps {
  isFullPage?: boolean;
}

export function PharmacyManagement({ isFullPage = false }: PharmacyManagementProps) {
  const user = useAppStore((s) => s.user);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(isFullPage);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreatePharmacyForm>({
    name: '',
    location: '',
    address: '',
    phone: '',
    email: '',
    licenseNumber: '',
    manager: '',
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAuthToken(localStorage.getItem('authToken'));
    }
  }, []);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  const fetchPharmacies = async () => {
    if (!authToken) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${apiBase}/api/pharmacies`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) throw new Error('Failed to load pharmacies');
      const data = await res.json();
      setPharmacies(data.data || []);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Error fetching pharmacies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && authToken) fetchPharmacies();
  }, [isOpen, authToken]);

  const handleEditClick = (pharmacy: Pharmacy) => {
    setEditingId(pharmacy.id);
    setFormData({
      name: pharmacy.name || '',
      location: pharmacy.location || '',
      address: pharmacy.address || '',
      phone: pharmacy.phone || '',
      email: pharmacy.email || '',
      licenseNumber: pharmacy.licenseNumber || '',
      manager: pharmacy.manager || '',
    });
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ name: '', location: '', address: '', phone: '', email: '', licenseNumber: '', manager: '' });
  };

  const handleSavePharmacy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken) return;
    if (!formData.name.trim()) {
      setError('Pharmacy name is required');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    const isEdit = !!editingId;
    const url = isEdit ? `${apiBase}/api/pharmacies/${editingId}` : `${apiBase}/api/pharmacies`;
    try {
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        if (res.status === 409) setError('Pharmacy with this name already exists');
        else {
          const err = await res.json().catch(() => ({}));
          setError(err.message || (isEdit ? 'Failed to update pharmacy' : 'Failed to create pharmacy'));
        }
        return;
      }
      const data = await res.json();
      setSuccess(`[OK] Pharmacy "${data.data?.name || formData.name}" ${isEdit ? 'updated' : 'created'} successfully!`);
      await fetchPharmacies();
      handleCancelEdit();
    } catch (err) {
      console.error('Error saving pharmacy:', err);
      setError(err instanceof Error ? err.message : 'Error saving pharmacy');
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'admin') return null;

  const content = (
      <div className="bg-white rounded-lg shadow p-6 w-full max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Pharmacy Management</h2>
          {!isFullPage && (
            <button
              title="Admin: Manage pharmacies"
              className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
              onClick={() => setIsOpen((v) => !v)}
            >
              Pharmacies
            </button>
          )}
        </div>

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800 flex gap-2 items-center">
            <CheckCircle className="w-4 h-4" />
            <div>{success}</div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 flex gap-2 items-center">
            <AlertCircle className="w-4 h-4" />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSavePharmacy} className="space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <div className="text-sm font-medium text-gray-700 mb-1">Pharmacy Name <span className="text-red-600">*</span></div>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </label>

            <label className="block">
              <div className="text-sm font-medium text-gray-700 mb-1">Location</div>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </label>

            <label className="block">
              <div className="text-sm font-medium text-gray-700 mb-1">Address</div>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </label>

            <label className="block">
              <div className="text-sm font-medium text-gray-700 mb-1">Phone</div>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                type="tel"
              />
            </label>

            <label className="block">
              <div className="text-sm font-medium text-gray-700 mb-1">Email</div>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                type="email"
              />
            </label>

            <label className="block">
              <div className="text-sm font-medium text-gray-700 mb-1">License Number</div>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.licenseNumber}
                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
              />
            </label>

            <label className="block col-span-2">
              <div className="text-sm font-medium text-gray-700 mb-1">Manager</div>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.manager}
                onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                placeholder="Name of pharmacy manager"
              />
            </label>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? <><Loader className="w-4 h-4 animate-spin" /> Saving...</> : editingId ? <><Save className="w-4 h-4"/> Save Changes</> : <><Plus className="w-4 h-4"/> Create Pharmacy</>}
            </button>

            {editingId && (
              <button type="button" onClick={handleCancelEdit} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
                Cancel Edit
              </button>
            )}
          </div>
        </form>

        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Existing Pharmacies ({pharmacies.length})</h3>

          {loading && pharmacies.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Loader className="w-6 h-6 animate-spin mx-auto mb-2" />
              Loading...
            </div>
          ) : pharmacies.length === 0 ? (
            <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">No pharmacies created yet</div>
          ) : (
            <div className="space-y-3">
              {pharmacies.map((pharmacy) => (
                <div key={pharmacy.id} className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                  <Building2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">{pharmacy.name}</h4>
                        <p className="text-xs text-gray-500 mt-1">ID: {pharmacy.id} | Users: {pharmacy.userCount || 0}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium px-2 py-1 rounded ${pharmacy.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {pharmacy.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <button
                          onClick={() => handleEditClick(pharmacy)}
                          className="px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100 rounded transition-colors flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" /> Edit
                        </button>
                      </div>
                    </div>

                    <div className="mt-2 text-sm text-gray-600">
                      {pharmacy.phone && <p>{pharmacy.phone}</p>}
                      {pharmacy.manager && <p>Manager: {pharmacy.manager}</p>}
                      {pharmacy.address && <p>{pharmacy.address}</p>}
                      {pharmacy.location && <p>{pharmacy.location}</p>}
                    </div>

                    {editingId === pharmacy.id && <span className="text-xs text-yellow-700 mt-1">Editing (top form)</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );

  if (!isFullPage) {
    return (
      <>
        <div className="mb-4">
          <button className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg" onClick={() => setIsOpen(true)}>
            Pharmacies
          </button>
        </div>
        {isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-end">
                <button className="text-gray-500 hover:text-gray-700" onClick={() => setIsOpen(false)} aria-label="Close">
                  <X />
                </button>
              </div>
              {content}
            </div>
          </div>
        )}
      </>
    );
  }

  return content;
}
