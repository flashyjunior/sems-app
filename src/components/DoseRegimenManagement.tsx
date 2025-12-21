'use client';

import React, { useState, useEffect } from 'react';
import { Trash2, Edit2, Plus } from 'lucide-react';

interface DoseRegimen {
  id: string;
  drugId: string;
  ageMin: number | null;
  ageMax: number | null;
  weightMin: number | null;
  weightMax: number | null;
  ageGroup: string;
  doseMg: string;
  frequency: string;
  duration: string;
  maxDoseMgDay: string | null;
  route: string;
  instructions: string | null;
  isActive: boolean;
}

interface Drug {
  id: string;
  genericName: string;
}

interface CreateRegimenForm {
  drugId: string;
  ageMin: string;
  ageMax: string;
  weightMin: string;
  weightMax: string;
  ageGroup: string;
  doseMg: string;
  frequency: string;
  duration: string;
  maxDoseMgDay: string;
  route: string;
  instructions: string;
}

const AGE_GROUPS = ['adult', 'pediatric', 'neonatal', 'geriatric'];
const ROUTES = ['oral', 'intravenous', 'intramuscular', 'topical', 'inhalation', 'rectal', 'sublingual'];

export function DoseRegimenManagement() {
  const [regimens, setRegimens] = useState<DoseRegimen[]>([]);
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingRegimenId, setEditingRegimenId] = useState<string | null>(null);
  const [selectedDrugFilter, setSelectedDrugFilter] = useState('');

  const [formData, setFormData] = useState<CreateRegimenForm>({
    drugId: '',
    ageMin: '',
    ageMax: '',
    weightMin: '',
    weightMax: '',
    ageGroup: 'adult',
    doseMg: '',
    frequency: '',
    duration: '',
    maxDoseMgDay: '',
    route: 'oral',
    instructions: '',
  });

  const authToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

  useEffect(() => {
    fetchDrugs();
    fetchRegimens();
  }, []);

  const fetchDrugs = async () => {
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
      console.error('Error fetching drugs:', err);
    }
  };

  const fetchRegimens = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/dose-regimens`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch regimens');
      const data = await response.json();
      setRegimens(data.data || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error fetching regimens';
      setError(msg);
      console.error('Error fetching regimens:', err);
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
        drugId: formData.drugId,
        ageMin: formData.ageMin ? parseInt(formData.ageMin) : null,
        ageMax: formData.ageMax ? parseInt(formData.ageMax) : null,
        weightMin: formData.weightMin ? parseFloat(formData.weightMin) : null,
        weightMax: formData.weightMax ? parseFloat(formData.weightMax) : null,
        ageGroup: formData.ageGroup,
        doseMg: formData.doseMg,
        frequency: formData.frequency,
        duration: formData.duration,
        maxDoseMgDay: formData.maxDoseMgDay || null,
        route: formData.route,
        instructions: formData.instructions || null,
      };

      if (isEditMode && editingRegimenId) {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/dose-regimens/${editingRegimenId}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify(payload),
          }
        );

        if (!response.ok) throw new Error('Failed to update regimen');
        setSuccess('Dose regimen updated successfully');
      } else {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/dose-regimens`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify(payload),
          }
        );

        if (!response.ok) throw new Error('Failed to create regimen');
        setSuccess('Dose regimen created successfully');
      }

      setFormData({
        drugId: '',
        ageMin: '',
        ageMax: '',
        weightMin: '',
        weightMax: '',
        ageGroup: 'adult',
        doseMg: '',
        frequency: '',
        duration: '',
        maxDoseMgDay: '',
        route: 'oral',
        instructions: '',
      });
      setIsEditMode(false);
      setEditingRegimenId(null);
      await fetchRegimens();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error saving regimen';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (regimen: DoseRegimen) => {
    setEditingRegimenId(regimen.id);
    setFormData({
      drugId: regimen.drugId,
      ageMin: regimen.ageMin ? regimen.ageMin.toString() : '',
      ageMax: regimen.ageMax ? regimen.ageMax.toString() : '',
      weightMin: regimen.weightMin ? regimen.weightMin.toString() : '',
      weightMax: regimen.weightMax ? regimen.weightMax.toString() : '',
      ageGroup: regimen.ageGroup,
      doseMg: regimen.doseMg,
      frequency: regimen.frequency,
      duration: regimen.duration,
      maxDoseMgDay: regimen.maxDoseMgDay || '',
      route: regimen.route,
      instructions: regimen.instructions || '',
    });
    setIsEditMode(true);
  };

  const handleDelete = async (regimenId: string) => {
    if (!confirm('Are you sure you want to delete this regimen?')) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/dose-regimens/${regimenId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to delete regimen');
      setSuccess('Dose regimen deleted successfully');
      await fetchRegimens();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error deleting regimen';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      drugId: '',
      ageMin: '',
      ageMax: '',
      weightMin: '',
      weightMax: '',
      ageGroup: 'adult',
      doseMg: '',
      frequency: '',
      duration: '',
      maxDoseMgDay: '',
      route: 'oral',
      instructions: '',
    });
    setIsEditMode(false);
    setEditingRegimenId(null);
  };

  const filteredRegimens = selectedDrugFilter
    ? regimens.filter((r) => r.drugId === selectedDrugFilter)
    : regimens;

  const getDrugName = (drugId: string) => {
    return drugs.find((d) => d.id === drugId)?.genericName || drugId;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Dose Regimen Management</h2>
        <p className="text-gray-600 mt-1">Create and manage dose regimens for drugs</p>
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
          {isEditMode ? 'Edit Dose Regimen' : 'Add New Dose Regimen'}
        </h3>
        <form onSubmit={handleCreateOrUpdate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Drug *</label>
              <select
                value={formData.drugId}
                onChange={(e) => setFormData({ ...formData, drugId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a drug</option>
                {drugs.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.genericName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age Group *</label>
              <select
                value={formData.ageGroup}
                onChange={(e) => setFormData({ ...formData, ageGroup: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {AGE_GROUPS.map((ag) => (
                  <option key={ag} value={ag}>
                    {ag.charAt(0).toUpperCase() + ag.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age Min (years)</label>
              <input
                type="number"
                value={formData.ageMin}
                onChange={(e) => setFormData({ ...formData, ageMin: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age Max (years)</label>
              <input
                type="number"
                value={formData.ageMax}
                onChange={(e) => setFormData({ ...formData, ageMax: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weight Min (kg)</label>
              <input
                type="number"
                step="0.1"
                value={formData.weightMin}
                onChange={(e) => setFormData({ ...formData, weightMin: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weight Max (kg)</label>
              <input
                type="number"
                step="0.1"
                value={formData.weightMax}
                onChange={(e) => setFormData({ ...formData, weightMax: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dose (mg) *</label>
              <input
                type="text"
                value={formData.doseMg}
                onChange={(e) => setFormData({ ...formData, doseMg: e.target.value })}
                placeholder="e.g., 500"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Frequency *</label>
              <input
                type="text"
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                placeholder="e.g., Three times daily"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration *</label>
              <input
                type="text"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="e.g., 7 days"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Route *</label>
              <select
                value={formData.route}
                onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ROUTES.map((r) => (
                  <option key={r} value={r}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Dose/Day (mg)</label>
              <input
                type="text"
                value={formData.maxDoseMgDay}
                onChange={(e) => setFormData({ ...formData, maxDoseMgDay: e.target.value })}
                placeholder="e.g., 4000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
              <textarea
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                placeholder="e.g., Take with food, Do not exceed maximum dose"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
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
              {isEditMode ? 'Update Regimen' : 'Add Regimen'}
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Drug</label>
            <select
              value={selectedDrugFilter}
              onChange={(e) => setSelectedDrugFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Drugs</option>
              {drugs.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.genericName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading && regimens.length === 0 ? (
          <div className="p-6 text-gray-600">Loading regimens...</div>
        ) : filteredRegimens.length === 0 ? (
          <div className="p-6 text-gray-600">No regimens found</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredRegimens.map((regimen) => (
              <div key={regimen.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900">
                      {getDrugName(regimen.drugId)} - {regimen.ageGroup}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Dose: {regimen.doseMg} mg | Frequency: {regimen.frequency}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(regimen)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(regimen.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mt-3">
                  {regimen.ageMin && <p><strong>Age Min:</strong> {regimen.ageMin} years</p>}
                  {regimen.ageMax && <p><strong>Age Max:</strong> {regimen.ageMax} years</p>}
                  {regimen.weightMin && <p><strong>Weight Min:</strong> {regimen.weightMin} kg</p>}
                  {regimen.weightMax && <p><strong>Weight Max:</strong> {regimen.weightMax} kg</p>}
                  <p><strong>Duration:</strong> {regimen.duration}</p>
                  <p><strong>Route:</strong> {regimen.route}</p>
                  {regimen.maxDoseMgDay && <p><strong>Max/Day:</strong> {regimen.maxDoseMgDay} mg</p>}
                </div>

                {regimen.instructions && (
                  <div className="mt-3 p-3 bg-blue-50 rounded text-sm text-gray-700">
                    <strong>Instructions:</strong> {regimen.instructions}
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
