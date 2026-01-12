'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { X, Plus, Loader2, Filter } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Delivery {
  id: string;
  pickup_address: string;
  pickup_name: string;
  pickup_phone: string;
  dropoff_address: string;
  dropoff_name: string;
  dropoff_phone: string;
  package_description: string | null;
  status: string;
  assigned_rider_id: string | null;
  created_at: string;
  delivered_at: string | null;
}

const statusColors: Record<string, string> = {
  CREATED: 'bg-gray-100 text-gray-800 border border-gray-300',
  ASSIGNED: 'bg-blue-100 text-blue-800 border border-blue-300',
  PICKED_UP: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
  IN_TRANSIT: 'bg-orange-100 text-orange-800 border border-orange-300',
  DELIVERED: 'bg-green-100 text-green-800 border border-green-300',
  FAILED: 'bg-red-100 text-red-800 border border-red-300',
};

const statusOptions = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'CREATED', label: 'Created' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'PICKED_UP', label: 'Picked Up' },
  { value: 'IN_TRANSIT', label: 'In Transit' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'FAILED', label: 'Failed' },
];

function BusinessDeliveriesContent() {
  const searchParams = useSearchParams();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [filteredDeliveries, setFilteredDeliveries] = useState<Delivery[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    pickup_address: '',
    pickup_name: '',
    pickup_phone: '',
    dropoff_address: '',
    dropoff_name: '',
    dropoff_phone: '',
    package_description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if we should show create form
    if (searchParams.get('action') === 'create') {
      setShowCreateForm(true);
    }
    loadDeliveries();
  }, [searchParams]);

  async function loadDeliveries() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get business ID
      const { data: business } = await supabase
        .from('businesses')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!business) return;

      // Get deliveries
      const { data, error } = await supabase
        .from('deliveries')
        .select('*')
        .eq('business_id', business.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeliveries(data || []);
      setFilteredDeliveries(data || []);
    } catch (err) {
      console.error('Error loading deliveries:', err);
    } finally {
      setLoading(false);
    }
  }

  // Filter deliveries based on status
  useEffect(() => {
    if (statusFilter === 'ALL') {
      setFilteredDeliveries(deliveries);
    } else {
      setFilteredDeliveries(deliveries.filter(d => d.status === statusFilter));
    }
  }, [statusFilter, deliveries]);

  async function handleCreateDelivery(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get business ID
      const { data: business } = await supabase
        .from('businesses')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!business) throw new Error('Business not found');

      // Create delivery
      const { error: createError } = await supabase
        .from('deliveries')
        .insert({
          business_id: business.id,
          pickup_address: formData.pickup_address,
          pickup_name: formData.pickup_name,
          pickup_phone: formData.pickup_phone,
          dropoff_address: formData.dropoff_address,
          dropoff_name: formData.dropoff_name,
          dropoff_phone: formData.dropoff_phone,
          package_description: formData.package_description || null,
          status: 'CREATED',
          created_by: user.id,
        });

      if (createError) throw createError;

      // Reset form and reload
      setFormData({
        pickup_address: '',
        pickup_name: '',
        pickup_phone: '',
        dropoff_address: '',
        dropoff_name: '',
        dropoff_phone: '',
        package_description: '',
      });
      setShowCreateForm(false);
      loadDeliveries();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create delivery');
    } finally {
      setSubmitting(false);
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
        <h1 className="text-3xl font-bold text-gray-900">Deliveries</h1>
        {!showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center space-x-2 bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-dark transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            <span>Create Delivery</span>
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Create Delivery Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Create New Delivery</h2>
            <button
              onClick={() => setShowCreateForm(false)}
              className="text-gray-500 hover:text-gray-700 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleCreateDelivery} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pickup Address
                </label>
                <input
                  type="text"
                  value={formData.pickup_address}
                  onChange={(e) => setFormData({ ...formData, pickup_address: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pickup Name
                </label>
                <input
                  type="text"
                  value={formData.pickup_name}
                  onChange={(e) => setFormData({ ...formData, pickup_name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pickup Phone
                </label>
                <input
                  type="tel"
                  value={formData.pickup_phone}
                  onChange={(e) => setFormData({ ...formData, pickup_phone: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Drop-off Address
                </label>
                <input
                  type="text"
                  value={formData.dropoff_address}
                  onChange={(e) => setFormData({ ...formData, dropoff_address: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Drop-off Name
                </label>
                <input
                  type="text"
                  value={formData.dropoff_name}
                  onChange={(e) => setFormData({ ...formData, dropoff_name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Drop-off Phone
                </label>
                <input
                  type="tel"
                  value={formData.dropoff_phone}
                  onChange={(e) => setFormData({ ...formData, dropoff_phone: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Package Description (Optional)
              </label>
              <textarea
                value={formData.package_description}
                onChange={(e) => setFormData({ ...formData, package_description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-dark transition-colors disabled:opacity-50 font-medium"
              >
                {submitting ? 'Creating...' : 'Create Delivery'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Status Filter */}
      <div className="mb-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-sm font-medium"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {statusFilter !== 'ALL' && (
          <span className="text-sm text-gray-600">
            Showing {filteredDeliveries.length} of {deliveries.length} deliveries
          </span>
        )}
      </div>

      {/* Deliveries Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pickup
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Drop-off
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDeliveries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    {deliveries.length === 0 
                      ? 'No deliveries found. Create your first delivery!'
                      : `No deliveries found with status "${statusOptions.find(o => o.value === statusFilter)?.label}".`
                    }
                  </td>
                </tr>
              ) : (
                filteredDeliveries.map((delivery) => (
                  <tr key={delivery.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {delivery.id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="font-medium">{delivery.pickup_name}</div>
                      <div className="text-xs text-gray-500">{delivery.pickup_address}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="font-medium">{delivery.dropoff_name}</div>
                      <div className="text-xs text-gray-500">{delivery.dropoff_address}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${
                          statusColors[delivery.status] || statusColors.CREATED
                        }`}
                      >
                        {delivery.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(delivery.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function BusinessDeliveriesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    }>
      <BusinessDeliveriesContent />
    </Suspense>
  );
}
