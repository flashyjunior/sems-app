'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, XCircle, Loader } from 'lucide-react';

interface TempDrug {
  id: string;
  genericName: string;
  tradeName?: string;
  strength: string;
  route: string;
  category: string;
  stgReference?: string;
  contraindications?: string;
  pregnancyCategory?: string;
  warnings?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdByPharmacistId: string;
  createdAt: string;
  approvedByAdminId?: string;
  approvedAt?: string;
  rejectionReason?: string;
}

interface TempDoseRegimen {
  id: string;
  tempDrugId: string;
  drugId?: string;
  ageMin?: number;
  ageMax?: number;
  weightMin?: number;
  weightMax?: number;
  ageGroup?: string;
  doseMg: number;
  frequency: string;
  duration: string;
  maxDoseMgDay?: number;
  route: string;
  instructions?: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface PendingDrug extends TempDrug {
  regimens: TempDoseRegimen[];
}

export default function PendingDrugsPage() {
  const [pendingDrugs, setPendingDrugs] = useState<PendingDrug[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [selectedDrugForReject, setSelectedDrugForReject] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingDrugs();
  }, []);

  const fetchPendingDrugs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/admin/pending-drugs?status=pending');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || `Failed to fetch pending drugs: ${response.statusText}`);
      }

      const data = await response.json();
      setPendingDrugs(Array.isArray(data) ? data : []);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMsg);
      console.error('Error fetching pending drugs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveDrug = async (drugId: string) => {
    try {
      setProcessingId(drugId);
      const response = await fetch('/api/admin/approve-drug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tempDrugId: drugId,
          adminId: 'current-admin-id', // TODO: Get from auth context
          approvalNotes: 'Approved by admin',
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to approve drug: ${response.statusText}`);
      }

      // Refresh the list
      await fetchPendingDrugs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve drug');
      console.error('Error approving drug:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectDrug = async (drugId: string) => {
    if (!rejectionReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }

    try {
      setProcessingId(drugId);
      const response = await fetch('/api/admin/approve-drug', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tempDrugId: drugId,
          adminId: 'current-admin-id', // TODO: Get from auth context
          rejectionReason: rejectionReason,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to reject drug: ${response.statusText}`);
      }

      // Reset and refresh
      setRejectionReason('');
      setSelectedDrugForReject(null);
      await fetchPendingDrugs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject drug');
      console.error('Error rejecting drug:', err);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <Loader className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-gray-600">Loading pending drugs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Pending Drug Approvals</h1>
        <p className="text-gray-600 mt-2">Review and approve drugs edited by pharmacists</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3 items-start">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900">Error</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {pendingDrugs.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <p className="text-gray-700 font-medium">No pending drugs</p>
          <p className="text-gray-500 text-sm">All drug edits have been reviewed</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingDrugs.map((drug) => (
            <div
              key={drug.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              {/* Drug Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900">
                    {drug.genericName}
                    {drug.tradeName && (
                      <span className="text-gray-600 font-normal ml-2">({drug.tradeName})</span>
                    )}
                  </h2>
                  <p className="text-gray-600 text-sm mt-1">
                    {drug.strength} - {drug.route} - {drug.category}
                  </p>
                </div>
                <div className="text-right ml-4">
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="text-sm font-medium text-gray-700">
                    {new Date(drug.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Drug Details */}
              <div className="bg-gray-50 rounded p-4 mb-4 space-y-3 text-sm">
                {drug.stgReference && (
                  <div>
                    <span className="font-medium text-gray-700">STG Reference: </span>
                    <span className="text-gray-600">{drug.stgReference}</span>
                  </div>
                )}
                {drug.pregnancyCategory && (
                  <div>
                    <span className="font-medium text-gray-700">Pregnancy Category: </span>
                    <span className="text-gray-600">{drug.pregnancyCategory}</span>
                  </div>
                )}
                {drug.contraindications && (
                  <div>
                    <span className="font-medium text-gray-700">Contraindications: </span>
                    <span className="text-gray-600">{drug.contraindications}</span>
                  </div>
                )}
                {drug.warnings && (
                  <div>
                    <span className="font-medium text-gray-700">Warnings: </span>
                    <span className="text-gray-600">{drug.warnings}</span>
                  </div>
                )}
              </div>

              {/* Regimens */}
              {drug.regimens.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Dose Regimens</h3>
                  <div className="space-y-2">
                    {drug.regimens.map((regimen) => (
                      <div key={regimen.id} className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
                        <p className="font-medium text-gray-800">
                          {regimen.doseMg}mg - {regimen.frequency} - {regimen.duration}
                        </p>
                        <p className="text-gray-600 text-xs mt-1">
                          {regimen.ageGroup || 'Age: varies'} - {regimen.route}
                        </p>
                        {regimen.instructions && (
                          <p className="text-gray-600 text-xs mt-1 italic">{regimen.instructions}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rejection Modal */}
              {selectedDrugForReject === drug.id && (
                <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded">
                  <label className="block font-medium text-gray-900 mb-2">Rejection Reason</label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Explain why this drug is being rejected..."
                    className="w-full p-2 border border-gray-300 rounded text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRejectDrug(drug.id)}
                      disabled={processingId === drug.id || !rejectionReason.trim()}
                      className="px-3 py-2 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {processingId === drug.id && <Loader className="w-4 h-4 animate-spin" />}
                      Confirm Rejection
                    </button>
                    <button
                      onClick={() => {
                        setSelectedDrugForReject(null);
                        setRejectionReason('');
                      }}
                      className="px-3 py-2 border border-gray-300 text-gray-700 rounded text-sm font-medium hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleApproveDrug(drug.id)}
                  disabled={processingId === drug.id}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processingId === drug.id ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Approve Drug
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    if (selectedDrugForReject === drug.id) {
                      setSelectedDrugForReject(null);
                      setRejectionReason('');
                    } else {
                      setSelectedDrugForReject(drug.id);
                      setRejectionReason('');
                    }
                  }}
                  disabled={processingId === drug.id}
                  className={`flex-1 px-4 py-2 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                    selectedDrugForReject === drug.id
                      ? 'bg-orange-100 border-2 border-orange-600 text-orange-900'
                      : 'bg-white border border-red-300 text-red-600 hover:bg-red-50'
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  {selectedDrugForReject === drug.id ? 'Reject (Enter Reason)' : 'Reject'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
