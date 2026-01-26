'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store/app';
import { db } from '@/lib/db';
import { RoleManagement } from './RoleManagement';
import { DrugManagement } from './DrugManagement';
import { DoseRegimenManagement } from './DoseRegimenManagement';

interface User {
  id: number;
  email: string;
  fullName: string;
  licenseNumber: string;
  specialization?: string;
  roleId?: number;
  isActive: boolean;
}

interface CreateUserForm {
  email: string;
  fullName: string;
  licenseNumber: string;
  password: string;
  specialization?: string;
  roleId?: number;
}

interface EditUserForm {
  id: number;
  email: string;
  fullName: string;
  licenseNumber: string;
  specialization?: string;
  roleId?: number;
  isActive: boolean;
}

interface Role {
  id: number;
  name: string;
}

interface AdminUsersManagerProps {
  onBack?: () => void;
}

/**
 * Admin Users Manager - Manage users and roles in PostgreSQL
 * This is the authoritative source - users/roles sync from here to local dbs
 */
export function AdminUsersManager({ onBack }: AdminUsersManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditUserForm | null>(null);
  const [formData, setFormData] = useState<CreateUserForm>({
    email: '',
    fullName: '',
    licenseNumber: '',
    password: '',
    specialization: '',
    roleId: 1,
  });

  const user = useAppStore((s) => s.user);
  const authToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

  // Fetch users from PostgreSQL
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/users?limit=100`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.data || []);
      setSuccess(`Loaded ${data.data?.length || 0} users`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error fetching users';
      setError(msg);
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch roles from PostgreSQL
  const fetchRoles = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/roles`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setRoles(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching roles:', err);
    }
  };

  // Start editing a user
  const handleEditUser = (u: User) => {
    setEditingUserId(u.id);
    setEditForm({
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      licenseNumber: u.licenseNumber,
      specialization: u.specialization,
      roleId: u.roleId || 1,
      isActive: u.isActive,
    });
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditForm(null);
  };

  // Save user changes
  const handleSaveUser = async () => {
    if (!editForm) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/users/${editForm.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            email: editForm.email,
            fullName: editForm.fullName,
            licenseNumber: editForm.licenseNumber,
            specialization: editForm.specialization,
            roleId: editForm.roleId,
            isActive: editForm.isActive,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update user');
      }

      setSuccess(`User "${editForm.fullName}" updated successfully`);
      setEditingUserId(null);
      setEditForm(null);

      // Refresh user list
      await fetchUsers();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error updating user';
      setError(msg);
      console.error('Error updating user:', err);
    } finally {
      setLoading(false);
    }
  };

  // Delete user
  const handleDeleteUser = async (userId: number, userName: string) => {
    if (!confirm(`Are you sure you want to delete "${userName}"? This cannot be undone.`)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/users/${userId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete user');
      }

      setSuccess(`User "${userName}" deleted successfully`);

      // Refresh user list
      await fetchUsers();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error deleting user';
      setError(msg);
      console.error('Error deleting user:', err);
    } finally {
      setLoading(false);
    }
  };

  // Create new user in PostgreSQL
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/users`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            email: formData.email,
            fullName: formData.fullName,
            licenseNumber: formData.licenseNumber,
            password: formData.password,
            specialization: formData.specialization || undefined,
            roleId: formData.roleId || 1,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create user');
      }

      const data = await response.json();
      setSuccess(`User "${formData.fullName}" created successfully`);
      setFormData({
        email: '',
        fullName: '',
        licenseNumber: '',
        password: '',
        specialization: '',
        roleId: 1,
      });

      // Refresh user list
      await fetchUsers();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error creating user';
      setError(msg);
      console.error('Error creating user:', err);
    } finally {
      setLoading(false);
    }
  };

  // Sync users from PostgreSQL to local databases (users only)
  const handleSyncToLocal = async () => {
    setLoading(true);
    setError(null);

    try {
      const usersResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/sync/pull-users`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!usersResponse.ok) {
        const data = await usersResponse.json();
        throw new Error(data.error || 'Failed to sync users');
      }

      const usersData = await usersResponse.json();
      
      // Save users to IndexedDB on client side
      if (usersData.users && usersData.users.length > 0) {
        for (const user of usersData.users) {
          try {
            const existing = await db.users.get(user.id);
            if (existing) {
              await db.users.update(user.id, user);
            } else {
              await db.users.add(user);
            }
          } catch (err) {
            console.error('Error saving user to IndexDB:', err);
          }
        }
      }
      
      setSuccess(`✅ Synced ${usersData.users?.length || 0} users to local database`);
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error syncing users';
      setError(msg);
      console.error('Error syncing users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && authToken) {
      fetchUsers();
      fetchRoles();
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
        title="Admin: Manage users and roles"
      >
        👥 Admin Users
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Admin: User Management</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 font-bold text-xl"
              >
                ✕
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto">
              <button
                onClick={() => setActiveTab('users')}
                className={`px-4 py-2 font-medium whitespace-nowrap ${
                  activeTab === 'users'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Users
              </button>
              <button
                onClick={() => setActiveTab('roles')}
                className={`px-4 py-2 font-medium whitespace-nowrap ${
                  activeTab === 'roles'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Roles
              </button>
            </div>

            {/* Messages */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                ❌ {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                {success}
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                {/* Create User Form */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-4">Create New User</h3>
                  <form onSubmit={handleCreateUser} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email *
                        </label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          License Number *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.licenseNumber}
                          onChange={(e) =>
                            setFormData({ ...formData, licenseNumber: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.fullName}
                          onChange={(e) =>
                            setFormData({ ...formData, fullName: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Password *
                        </label>
                        <input
                          type="password"
                          required
                          value={formData.password}
                          onChange={(e) =>
                            setFormData({ ...formData, password: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Specialization
                        </label>
                        <input
                          type="text"
                          value={formData.specialization}
                          onChange={(e) =>
                            setFormData({ ...formData, specialization: e.target.value })
                          }
                          placeholder="e.g., General Practitioner"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
                    >
                      {loading ? 'Creating...' : 'Create User'}
                    </button>
                  </form>
                </div>

                {/* Users List */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-900">Users in PostgreSQL</h3>
                    <button
                      onClick={handleSyncToLocal}
                      disabled={loading}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium transition-colors"
                      title="Pull users from PostgreSQL to IndexDB and SQLite"
                    >
                      📥 Sync to Local
                    </button>
                  </div>

                  {loading && users.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">Loading users...</div>
                  ) : users.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No users found</div>
                  ) : (
                    <div className="space-y-3">
                      {users.map((u) => (
                        <div key={u.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                          {editingUserId === u.id && editForm ? (
                            // Edit Mode
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email
                                  </label>
                                  <input
                                    type="email"
                                    value={editForm.email}
                                    onChange={(e) =>
                                      setEditForm({ ...editForm, email: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 bg-white"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Full Name
                                  </label>
                                  <input
                                    type="text"
                                    value={editForm.fullName}
                                    onChange={(e) =>
                                      setEditForm({ ...editForm, fullName: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 bg-white"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    License Number
                                  </label>
                                  <input
                                    type="text"
                                    value={editForm.licenseNumber}
                                    onChange={(e) =>
                                      setEditForm({ ...editForm, licenseNumber: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 bg-white"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Role
                                  </label>
                                  <select
                                    value={editForm.roleId || 1}
                                    onChange={(e) =>
                                      setEditForm({ ...editForm, roleId: parseInt(e.target.value) })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 bg-white"
                                  >
                                    {roles.map((r) => (
                                      <option key={r.id} value={r.id}>
                                        {r.name.charAt(0).toUpperCase() + r.name.slice(1)}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Specialization
                                  </label>
                                  <input
                                    type="text"
                                    value={editForm.specialization || ''}
                                    onChange={(e) =>
                                      setEditForm({ ...editForm, specialization: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 bg-white"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Status
                                  </label>
                                  <select
                                    value={editForm.isActive ? 'active' : 'inactive'}
                                    onChange={(e) =>
                                      setEditForm({
                                        ...editForm,
                                        isActive: e.target.value === 'active',
                                      })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 bg-white"
                                  >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                  </select>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={handleSaveUser}
                                  disabled={loading}
                                  className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium text-sm transition-colors"
                                >
                                  {loading ? 'Saving...' : '✓ Save'}
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  disabled={loading}
                                  className="flex-1 px-3 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 disabled:opacity-50 font-medium text-sm transition-colors"
                                >
                                  ✕ Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            // View Mode
                            <div>
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900">{u.fullName}</h4>
                                  <p className="text-sm text-gray-600">{u.email}</p>
                                  <div className="mt-2 flex gap-2 flex-wrap">
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                      {u.licenseNumber}
                                    </span>
                                    <span
                                      className={`text-xs px-2 py-1 rounded font-medium ${
                                        u.isActive
                                          ? 'bg-green-100 text-green-800'
                                          : 'bg-red-100 text-red-800'
                                      }`}
                                    >
                                      {u.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2 pt-3 border-t border-gray-200">
                                <button
                                  onClick={() => handleEditUser(u)}
                                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors"
                                >
                                  ✏️ Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(u.id, u.fullName)}
                                  className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm transition-colors"
                                >
                                  🗑️ Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Roles Tab */}
            {activeTab === 'roles' && (
              <RoleManagement />
            )}

            <div className="mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

