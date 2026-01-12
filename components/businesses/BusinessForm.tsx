'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface Business {
  id: string;
  name: string;
  phone: string;
  delivery_fee: number | null;
  active: boolean;
  created_at: string;
  user?: {
    id: string;
    name: string;
    phone: string;
    role: string;
  };
}

interface BusinessFormProps {
  business?: Business | null;
  onSubmit: (data: BusinessFormData) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  error: string;
}

export interface BusinessFormData {
  name: string;
  phone: string;
  delivery_fee: string;
  active: boolean;
}

export default function BusinessForm({
  business,
  onSubmit,
  onCancel,
  loading,
  error,
}: BusinessFormProps) {
  const [formData, setFormData] = useState<BusinessFormData>({
    name: business?.name || '',
    phone: business?.phone || '',
    delivery_fee: business?.delivery_fee?.toString() || '',
    active: business?.active ?? true,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit(formData);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Business Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone *
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
            placeholder="+255759561311"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Delivery Fee (TZS)
          </label>
          <input
            type="number"
            value={formData.delivery_fee}
            onChange={(e) => setFormData({ ...formData, delivery_fee: e.target.value })}
            step="0.01"
            min="0"
            placeholder="0.00"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <p className="mt-1 text-xs text-gray-500">Leave empty to use default pricing</p>
        </div>

        <div className="flex items-center gap-2 pt-6">
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
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? 'Saving...' : business ? 'Update Business' : 'Create Business'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
