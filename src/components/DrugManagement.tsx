'use client';

import React, { useState, useEffect } from 'react';
import { Trash2, Edit2, Plus, Search } from 'lucide-react';

interface Drug {
  id: string;
  genericName: string;
  tradeName: string[];
  strength: string;
  route: string;
  category: string;
  stgReference: string | null;
  contraindications: string[];
  pregnancyCategory: string | null;
  warnings: string[];
  isActive: boolean;
}

interface CreateDrugForm {
  genericName: string;
  tradeName: string;
  strength: string;
  route: string;
  category: string;
  stgReference: string;
  contraindications: string;
  pregnancyCategory: string;
  warnings: string;
}

const ROUTES = ['oral', 'intravenous', 'intramuscular', 'topical', 'inhalation', 'rectal', 'sublingual'];
const CATEGORIES = [
  'Analgesic',
  'Antibiotic',
  'Antidiabetic',
  'ACE Inhibitor',
  'NSAID',
  'Macrolide',
  'PPI',
  'Statin',
  'Calcium Channel Blocker',
  'Fluoroquinolone',
  'Antifungal',
  'Antiviral',
  'Antihistamine',
];
const PREGNANCY_CATEGORIES = ['A', 'B', 'C', 'D', 'X'];

export function DrugManagement({ initialSearchTerm = '' }: { initialSearchTerm?: string }) {
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingDrugId, setEditingDrugId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);

  const [formData, setFormData] = useState<CreateDrugForm>({
    genericName: '',
    tradeName: '',
    strength: '',
    route: 'oral',
    category: '',
    stgReference: '',
    contraindications: '',
    pregnancyCategory: '',
    warnings: '',
  });

  const authToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

  useEffect(() => {
    fetchDrugs();
  }, []);

  const fetchDrugs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/drugs`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch drugs');
      const data = await response.json();
      setDrugs(data.data || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error fetching drugs';
      setError(msg);
      console.error('Error fetching drugs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        genericName: formData.genericName,
        tradeName: formData.tradeName ? [formData.tradeName] : [],
        strength: formData.strength,
        route: formData.route,
        category: formData.category,
        stgReference: formData.stgReference || null,
        contraindications: formData.contraindications ? formData.contraindications.split(',').map(s => s.trim()) : [],
        pregnancyCategory: formData.pregnancyCategory || null,
        warnings: formData.warnings ? formData.warnings.split(',').map(s => s.trim()) : [],
      };

      if (isEditMode && editingDrugId) {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/drugs/${editingDrugId}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify(payload),
          }
        );

        if (!response.ok) throw new Error('Failed to update drug');
        setSuccess('Drug updated successfully');
      } else {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/drugs`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify(payload),
          }
        );

        if (!response.ok) throw new Error('Failed to create drug');
        setSuccess('Drug created successfully');
      }

      setFormData({
        genericName: '',
        tradeName: '',
        strength: '',
        route: 'oral',
        category: '',
        stgReference: '',
        contraindications: '',
        pregnancyCategory: '',
        warnings: '',
      });
      setIsEditMode(false);
      setEditingDrugId(null);
      await fetchDrugs();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error saving drug';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (drug: Drug) => {
    setEditingDrugId(drug.id);
    setFormData({
      genericName: drug.genericName,
      tradeName: drug.tradeName[0] || '',
      strength: drug.strength,
      route: drug.route,
      category: drug.category,
      stgReference: drug.stgReference || '',
      contraindications: drug.contraindications.join(', '),
      pregnancyCategory: drug.pregnancyCategory || '',
      warnings: drug.warnings.join(', '),
    });
    setIsEditMode(true);
  };

  const handleDelete = async (drugId: string, drugName: string) => {
    if (!confirm(`Are you sure you want to delete "${drugName}"?`)) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/drugs/${drugId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to delete drug');
      setSuccess('Drug deleted successfully');
      await fetchDrugs();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error deleting drug';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      genericName: '',
      tradeName: '',
      strength: '',
      route: 'oral',
      category: '',
      stgReference: '',
      contraindications: '',
      pregnancyCategory: '',
      warnings: '',
    });
    setIsEditMode(false);
    setEditingDrugId(null);
  };

  const filteredDrugs = drugs.filter(
    (d) =>
      d.genericName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.tradeName.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase())) ||
      d.strength.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.route.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Drug Management</h2>
        <p className="text-gray-600 mt-1">Create and manage drugs in the cloud database</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">
          {success}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {isEditMode ? 'Edit Drug' : 'Add New Drug'}
        </h3>
        <form onSubmit={handleCreateOrUpdate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Generic Name *</label>
              <input
                type="text"
                value={formData.genericName}
                onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                placeholder="e.g., Paracetamol"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trade Name</label>
              <input
                type="text"
                value={formData.tradeName}
                onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
                placeholder="e.g., Panadol"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Strength *</label>
              <input
                type="text"
                value={formData.strength}
                onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                placeholder="e.g., 500mg"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Route *</label>
              <select
                value={formData.route}
                onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                required
              >
                {ROUTES.map((r) => (
                  <option key={r} value={r}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                required
              >
                <option value="">Select a category</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pregnancy Category</label>
              <select
                value={formData.pregnancyCategory}
                onChange={(e) => setFormData({ ...formData, pregnancyCategory: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              >
                <option value="">Select category</option>
                {PREGNANCY_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">STG Reference</label>
              <input
                type="text"
                value={formData.stgReference}
                onChange={(e) => setFormData({ ...formData, stgReference: e.target.value })}
                placeholder="e.g., STG-2024-001"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraindications (comma-separated)</label>
              <input
                type="text"
                value={formData.contraindications}
                onChange={(e) => setFormData({ ...formData, contraindications: e.target.value })}
                placeholder="e.g., Liver disease, Pregnancy, Allergies"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Warnings (comma-separated)</label>
              <input
                type="text"
                value={formData.warnings}
                onChange={(e) => setFormData({ ...formData, warnings: e.target.value })}
                placeholder="e.g., May cause drowsiness, Do not exceed 4g/day"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              {isEditMode ? 'Update Drug' : 'Add Drug'}
            </button>
            {isEditMode && (
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Drugs List
              {searchTerm && (
                <span className="text-sm font-normal text-gray-600 ml-2">
                  ({filteredDrugs.length} of {drugs.length} found)
                </span>
              )}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search drugs by name, strength, category, route..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 outline-none text-sm"
            />
          </div>
        </div>

        {loading && drugs.length === 0 ? (
          <div className="p-6 text-gray-600">Loading drugs...</div>
        ) : filteredDrugs.length === 0 ? (
          <div className="p-6 text-gray-600">No drugs found</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredDrugs.map((drug) => (
              <div key={drug.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900">{drug.genericName}</h4>
                    {drug.tradeName.length > 0 && (
                      <p className="text-sm text-gray-600">Trade: {drug.tradeName.join(', ')}</p>
                    )}
                    <p className="text-sm text-gray-600 mt-1">Strength: {drug.strength}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(drug)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(drug.id, drug.genericName)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mt-3">
                  <p><strong>Route:</strong> {drug.route}</p>
                  <p><strong>Category:</strong> {drug.category}</p>
                  {drug.pregnancyCategory && <p><strong>Pregnancy:</strong> {drug.pregnancyCategory}</p>}
                  {drug.stgReference && <p><strong>STG:</strong> {drug.stgReference}</p>}
                </div>

                {drug.contraindications.length > 0 && (
                  <div className="mt-2 text-sm">
                    <strong className="text-red-600">Contraindications:</strong>
                    <p className="text-gray-600">{drug.contraindications.join(', ')}</p>
                  </div>
                )}

                {drug.warnings.length > 0 && (
                  <div className="mt-2 text-sm">
                    <strong className="text-orange-600">Warnings:</strong>
                    <p className="text-gray-600">{drug.warnings.join(', ')}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


