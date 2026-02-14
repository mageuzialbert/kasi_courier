'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUserRole } from '@/lib/roles';
import { Loader2, Plus, Edit, Trash2 } from 'lucide-react';

interface Supplier {
  id: string;
  name: string;
  phone: string;
  email: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface SupplierFormData {
  name: string;
  phone: string;
  email: string;
  active: boolean;
}

export default function AdminSuppliersPage() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<SupplierFormData>({
    name: '',
    phone: '',
    email: '',
    active: true,
  });

  useEffect(() => {
    async function checkRole() {
      const userRole = await getUserRole();
      if (userRole !== 'ADMIN' && userRole !== 'STAFF') {
        router.push('/dashboard/business');
        return;
      }
      setRole(userRole);
      loadSuppliers();
    }
    checkRole();
  }, [router]);

  async function loadSuppliers() {
    try {
      const response = await fetch('/api/admin/suppliers');
      if (response.ok) {
        const data = await response.json();
        setSuppliers(data);
      }
    } catch (err) {
      console.error('Error loading suppliers:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleNewSupplier() {
    setEditingSupplier(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      active: true,
    });
    setError('');
    setShowForm(true);
  }

  function handleEdit(supplier: Supplier) {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      phone: supplier.phone || '',
      email: supplier.email || '',
      active: supplier.active,
    });
    setError('');
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (!formData.name.trim()) {
        throw new Error('Supplier name is required');
      }

      const url = editingSupplier
        ? `/api/admin/suppliers/${editingSupplier.id}`
        : '/api/admin/suppliers';
      const method = editingSupplier ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: formData.phone.trim() || null,
          email: formData.email.trim() || null,
          active: formData.active,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save supplier');
      }

      setShowForm(false);
      setEditingSupplier(null);
      loadSuppliers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save supplier');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(supplier: Supplier) {
    if (!confirm(`Are you sure you want to ${supplier.active ? 'deactivate' : 'delete'} this supplier?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/suppliers/${supplier.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete supplier');
      }

      loadSuppliers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete supplier');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-gray-600 mt-1">Manage suppliers used in expenses</p>
        </div>
        <button
          onClick={handleNewSupplier}
          className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Supplier
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {suppliers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No suppliers found
                </td>
              </tr>
            ) : (
              suppliers.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{supplier.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{supplier.phone || '-'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500">{supplier.email || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        supplier.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {supplier.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(supplier)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {role === 'ADMIN' && (
                        <button
                          onClick={() => handleDelete(supplier)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingSupplier ? 'Edit Supplier' : 'New Supplier'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="e.g., Puma Oil Station"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="+2557XXXXXXXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="supplier@example.com"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <label htmlFor="active" className="text-sm font-medium text-gray-700">
                  Active
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingSupplier(null);
                    setError('');
                  }}
                  disabled={submitting}
                  className="flex-1 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {submitting ? 'Saving...' : editingSupplier ? 'Update Supplier' : 'Create Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
