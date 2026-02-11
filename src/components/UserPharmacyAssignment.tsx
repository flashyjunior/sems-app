'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store/app';
import { Loader, AlertCircle, CheckCircle, MapPin } from 'lucide-react';

interface User {
  id: number;
  email: string;
  fullName: string;
  licenseNumber?: string;
  pharmacyId?: string | null;
  pharmacy?: {
    id: string;
    name: string;
    location?: string;
  } | null;
  role?: any;
}

interface Pharmacy {
  id: string;
  name: string;
  location?: string;
}

/**
 * User Pharmacy Assignment Component
 * Allows admins to assign pharmacies to users
 */
export function UserPharmacyAssignment() {
  const user = useAppStore((s) => s.user);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  
  const [isOpen, setIsOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedPharmacy, setSelectedPharmacy] = useState('');

  // Get auth token from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    setAuthToken(token);
  }, []);

  // Fetch users and pharmacies
  const fetchData = async () => {
    if (!authToken) return;
    
    setLoading(true);
    setError('');
    try {
      // Fetch users (use limit=100 which is the maximum allowed)
      const usersResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/users?page=1&limit=100`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        // Filter out HQ users (no pharmacyId), show only pharmacists and staff without assignments
        const fetchedUsers = usersData.data || [];
        setUsers(fetchedUsers);
        console.log('Fetched users:', fetchedUsers.length, fetchedUsers);
      } else {
        const errorText = await usersResponse.text();
        console.error('Users API error:', usersResponse.status, errorText);
        setError(`Failed to load users: ${usersResponse.status}`);
      }

      // Fetch pharmacies
      const pharmaResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/pharmacies`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (pharmaResponse.ok) {
        const pharmaData = await pharmaResponse.json();
        const fetchedPharmacies = pharmaData.data || [];
        setPharmacies(fetchedPharmacies);
        console.log('Fetched pharmacies:', fetchedPharmacies.length, fetchedPharmacies);
      } else {
        const errorText = await pharmaResponse.text();
        console.error('Pharmacy API error:', pharmaResponse.status, errorText);
        setError(`Failed to load pharmacies: ${pharmaResponse.status}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Assign pharmacy to user
  const handleAssignPharmacy = async () => {
    if (!selectedUser || !selectedPharmacy || !authToken) {
      setError('Please select both a user and a pharmacy');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/users/${selectedUser.id}/pharmacy`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            pharmacyId: selectedPharmacy,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const selectedPharmacyName = pharmacies.find(p => p.id === selectedPharmacy)?.name;
        setSuccess(`[OK] ${selectedUser.email} assigned to ${selectedPharmacyName}!`);
        setSelectedUser(null);
        setSelectedPharmacy('');
        // Refresh users list
        await fetchData();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to assign pharmacy');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error assigning pharmacy');
      console.error('Error assigning pharmacy:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && authToken) {
      fetchData();
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
        title="Admin: Assign pharmacies to users"
      >
         User Assignments
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Assign Users to Pharmacies</h2>
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

            {/* Assignment Form */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Select User & Pharmacy</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    User to Assign
                  </label>
                  {loading && users.length === 0 ? (
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-500 flex items-center gap-2">
                      <Loader className="w-4 h-4 animate-spin" />
                      Loading users...
                    </div>
                  ) : users.length === 0 ? (
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                      No users available
                    </div>
                  ) : (
                    <select
                      value={selectedUser?.id || ''}
                      onChange={(e) => {
                        const u = users.find(usr => usr.id === parseInt(e.target.value));
                        setSelectedUser(u || null);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">-- Select a user --</option>
                      {users.map((usr) => (
                        <option key={usr.id} value={usr.id}>
                          {usr.email} ({usr.fullName})
                          {usr.pharmacy ? ` - Assigned to ${usr.pharmacy.name}` : ' - No pharmacy'}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {selectedUser && (
                  <div className="bg-white p-3 rounded border border-blue-200">
                    <p className="text-sm font-medium text-gray-700">
                      <strong>Email:</strong> {selectedUser.email}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Name:</strong> {selectedUser.fullName}
                    </p>
                    {selectedUser.pharmacy && (
                      <p className="text-sm text-gray-600">
                        <strong>Current Pharmacy:</strong> {selectedUser.pharmacy.name}
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pharmacy to Assign
                  </label>
                  <select
                    value={selectedPharmacy}
                    onChange={(e) => setSelectedPharmacy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">-- Select a pharmacy --</option>
                    {pharmacies.map((pharm) => (
                      <option key={pharm.id} value={pharm.id}>
                        {pharm.name} {pharm.location ? `(${pharm.location})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleAssignPharmacy}
                  disabled={loading || !selectedUser || !selectedPharmacy}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <MapPin className="w-4 h-4" />
                      Assign Pharmacy to User
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Users List */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">
                User Assignments ({users.filter(u => u.pharmacyId).length}/{users.length})
              </h3>
              {loading && users.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Loader className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Loading...
                </div>
              ) : users.length === 0 ? (
                <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">
                  No users found
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {users.map((usr) => (
                    <div key={usr.id} className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{usr.email}</p>
                        <p className="text-sm text-gray-600">{usr.fullName}</p>
                      </div>
                      <div className="text-right">
                        {usr.pharmacy ? (
                          <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                            {usr.pharmacy.name}
                          </span>
                        ) : (
                          <span className="inline-block bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded">
                            No pharmacy assigned
                          </span>
                        )}
                      </div>
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
