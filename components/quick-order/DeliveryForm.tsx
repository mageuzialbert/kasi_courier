'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface Region {
  id: number;
  name: string;
}

interface District {
  id: number;
  name: string;
  region_id: number;
}

interface DeliveryFormProps {
  onSubmit: (data: DeliveryFormData) => void;
  loading: boolean;
  error: string;
}

export interface DeliveryFormData {
  pickup_address: string;
  pickup_name: string;
  pickup_phone: string;
  pickup_region_id: number | null;
  pickup_district_id: number | null;
  dropoff_address: string;
  dropoff_name: string;
  dropoff_phone: string;
  dropoff_region_id: number | null;
  dropoff_district_id: number | null;
  package_description: string;
}

export default function DeliveryForm({ onSubmit, loading, error }: DeliveryFormProps) {
  const [regions, setRegions] = useState<Region[]>([]);
  const [pickupDistricts, setPickupDistricts] = useState<District[]>([]);
  const [dropoffDistricts, setDropoffDistricts] = useState<District[]>([]);
  const [loadingRegions, setLoadingRegions] = useState(true);

  const [formData, setFormData] = useState<DeliveryFormData>({
    pickup_address: '',
    pickup_name: '',
    pickup_phone: '',
    pickup_region_id: null,
    pickup_district_id: null,
    dropoff_address: '',
    dropoff_name: '',
    dropoff_phone: '',
    dropoff_region_id: null,
    dropoff_district_id: null,
    package_description: '',
  });

  useEffect(() => {
    async function loadRegions() {
      try {
        const response = await fetch('/api/regions');
        if (response.ok) {
          const data = await response.json();
          setRegions(data);
        }
      } catch (error) {
        console.error('Error loading regions:', error);
      } finally {
        setLoadingRegions(false);
      }
    }
    loadRegions();
  }, []);

  useEffect(() => {
    async function loadPickupDistricts() {
      if (!formData.pickup_region_id) {
        setPickupDistricts([]);
        setFormData(prev => ({ ...prev, pickup_district_id: null }));
        return;
      }

      try {
        const response = await fetch(`/api/districts?region_id=${formData.pickup_region_id}`);
        if (response.ok) {
          const data = await response.json();
          setPickupDistricts(data);
        }
      } catch (error) {
        console.error('Error loading districts:', error);
      }
    }
    loadPickupDistricts();
  }, [formData.pickup_region_id]);

  useEffect(() => {
    async function loadDropoffDistricts() {
      if (!formData.dropoff_region_id) {
        setDropoffDistricts([]);
        setFormData(prev => ({ ...prev, dropoff_district_id: null }));
        return;
      }

      try {
        const response = await fetch(`/api/districts?region_id=${formData.dropoff_region_id}`);
        if (response.ok) {
          const data = await response.json();
          setDropoffDistricts(data);
        }
      } catch (error) {
        console.error('Error loading districts:', error);
      }
    }
    loadDropoffDistricts();
  }, [formData.dropoff_region_id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Pickup Section */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pickup Details</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Region *
            </label>
            <select
              value={formData.pickup_region_id || ''}
              onChange={(e) => setFormData({ ...formData, pickup_region_id: e.target.value ? Number(e.target.value) : null, pickup_district_id: null })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              disabled={loadingRegions}
            >
              <option value="">Select Region</option>
              {regions.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              District *
            </label>
            <select
              value={formData.pickup_district_id || ''}
              onChange={(e) => setFormData({ ...formData, pickup_district_id: e.target.value ? Number(e.target.value) : null })}
              required
              disabled={!formData.pickup_region_id || loadingRegions}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100"
            >
              <option value="">Select District</option>
              {pickupDistricts.map((district) => (
                <option key={district.id} value={district.id}>
                  {district.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address *
            </label>
            <input
              type="text"
              value={formData.pickup_address}
              onChange={(e) => setFormData({ ...formData, pickup_address: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Name *
              </label>
              <input
                type="text"
                value={formData.pickup_name}
                onChange={(e) => setFormData({ ...formData, pickup_name: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Phone *
              </label>
              <input
                type="tel"
                value={formData.pickup_phone}
                onChange={(e) => setFormData({ ...formData, pickup_phone: e.target.value })}
                required
                placeholder="+255759561311"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Dropoff Section */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Drop-off Details</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Region *
            </label>
            <select
              value={formData.dropoff_region_id || ''}
              onChange={(e) => setFormData({ ...formData, dropoff_region_id: e.target.value ? Number(e.target.value) : null, dropoff_district_id: null })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              disabled={loadingRegions}
            >
              <option value="">Select Region</option>
              {regions.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              District *
            </label>
            <select
              value={formData.dropoff_district_id || ''}
              onChange={(e) => setFormData({ ...formData, dropoff_district_id: e.target.value ? Number(e.target.value) : null })}
              required
              disabled={!formData.dropoff_region_id || loadingRegions}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100"
            >
              <option value="">Select District</option>
              {dropoffDistricts.map((district) => (
                <option key={district.id} value={district.id}>
                  {district.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address *
            </label>
            <input
              type="text"
              value={formData.dropoff_address}
              onChange={(e) => setFormData({ ...formData, dropoff_address: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Name *
              </label>
              <input
                type="text"
                value={formData.dropoff_name}
                onChange={(e) => setFormData({ ...formData, dropoff_name: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Phone *
              </label>
              <input
                type="tel"
                value={formData.dropoff_phone}
                onChange={(e) => setFormData({ ...formData, dropoff_phone: e.target.value })}
                required
                placeholder="+255759561311"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Package Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Package Description (Optional)
        </label>
        <textarea
          value={formData.package_description}
          onChange={(e) => setFormData({ ...formData, package_description: e.target.value })}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary text-white font-semibold py-3 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Creating delivery...</span>
          </>
        ) : (
          'Create Delivery'
        )}
      </button>
    </form>
  );
}
