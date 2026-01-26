'use client';

import React, { useState, useEffect } from 'react';
import { Trash2, Edit2, Plus } from 'lucide-react';

interface Role {
  id: number;
  name: string;
  description: string | null;
  permissions: Permission[];
}

interface Permission {
  id: number;
  name: string;
  description: string | null;
}

interface CreateRoleForm {
  name: string;
  description: string;
  permissionIds: number[];
}

/**
 * Role Management - Create, edit, delete roles in PostgreSQL
 * Roles sync to cloud and then to local databases
 */
export function RoleManagement() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<number | null>(null);

  const [formData, setFormData] = useState<CreateRoleForm>({
    name: '',
    description: '',
    permissionIds: [],
  });

  const authToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/roles`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch roles');
      const data = await response.json();
      setRoles(data.data || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error fetching roles';
      setError(msg);
      console.error('Error fetching roles:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/permissions`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch permissions');
      const data = await response.json();
      setPermissions(data.data || []);
    } catch (err) {
      console.error('Error fetching permissions:', err);
    }
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isEditMode && editingRoleId) {
        // Update existing role
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/roles/${editingRoleId}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({
              name: formData.name,
              description: formData.description,
              permissionIds: formData.permissionIds,
            }),
          }
        );

        if (!response.ok) throw new Error('Failed to update role');
        setSuccess('Role updated successfully');
      } else {
        // Create new role
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/roles`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({
              name: formData.name,
              description: formData.description,
              permissionIds: formData.permissionIds,
            }),
          }
        );

        if (!response.ok) throw new Error('Failed to create role');
        setSuccess('Role created successfully');
      }

      // Reset form
      setFormData({ name: '', description: '', permissionIds: [] });
      setIsEditMode(false);
      setEditingRoleId(null);

      // Reload roles
      await fetchRoles();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error saving role';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (role: Role) => {
    setEditingRoleId(role.id);
    setFormData({
      name: role.name,
      description: role.description || '',
      permissionIds: role.permissions.map((p) => p.id),
    });
    setIsEditMode(true);
  };

  const handleDelete = async (roleId: number, roleName: string) => {
    if (!confirm(`Are you sure you want to delete the "${roleName}" role?`)) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/roles/${roleId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to delete role');
      setSuccess('Role deleted successfully');
      await fetchRoles();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error deleting role';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', description: '', permissionIds: [] });
    setIsEditMode(false);
    setEditingRoleId(null);
  };

  const handlePermissionChange = (permissionId: number) => {
    setFormData((prev) => ({
      ...prev,
      permissionIds: prev.permissionIds.includes(permissionId)
        ? prev.permissionIds.filter((id) => id !== permissionId)
        : [...prev.permissionIds, permissionId],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Role Management</h2>
        <p className="text-gray-600 mt-1">Create and manage user roles</p>
      </div>

      {/* Alerts */}
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

      {/* Create/Edit Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {isEditMode ? 'Edit Role' : 'Create New Role'}
        </h3>
        <form onSubmit={handleCreateOrUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Pharmacist, Technician"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of this role"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Permissions</label>
            <div className="space-y-2">
              {permissions.map((permission) => (
                <label
                  key={permission.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.permissionIds.includes(permission.id)}
                    onChange={() => handlePermissionChange(permission.id)}
                    className="w-4 h-4 rounded"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{permission.name}</div>
                    {permission.description && (
                      <div className="text-sm text-gray-600">{permission.description}</div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              {isEditMode ? 'Update Role' : 'Create Role'}
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

      {/* Roles List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Existing Roles</h3>
        </div>

        {loading && roles.length === 0 ? (
          <div className="p-6 text-gray-600">Loading roles...</div>
        ) : roles.length === 0 ? (
          <div className="p-6 text-gray-600">No roles found</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {roles.map((role) => (
              <div key={role.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900">{role.name}</h4>
                    {role.description && (
                      <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(role)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(role.id, role.name)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {role.permissions.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-2">Permissions:</p>
                    <div className="flex flex-wrap gap-2">
                      {role.permissions.map((perm) => (
                        <span
                          key={perm.id}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
                        >
                          {perm.name}
                        </span>
                      ))}
                    </div>
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


