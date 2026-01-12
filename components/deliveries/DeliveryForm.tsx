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

interface Business {
  id: string;
  name: string;
}

interface DeliveryFormProps {
  onSubmit: (data: DeliveryFormData) => void;
  loading: boolean;
  error: string;
  businessId?: string | null; // Optional: if provided, show business selector
  showBusinessSelector?: boolean; // If true, allow selecting business
}

export interface DeliveryFormData {
  business_id?: string;
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

export default function DeliveryForm({ 
  onSubmit, 
  loading, 
  error,
  businessId,
  showBusinessSelector = false,
}: DeliveryFormProps) {
  const [regions, setRegions] = useState<Region[]>([]);
  const [pickupDistricts, setPickupDistricts] = useState<District[]>([]);
  const [dropoffDistricts, setDropoffDistricts] = useState<District[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loadingRegions, setLoadingRegions] = useState(true);
  const [loadingBusinesses, setLoadingBusinesses] = useState(false);

  const [formData, setFormData] = useState<DeliveryFormData>({
    business_id: businessId || undefined,
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
    if (showBusinessSelector) {
      async function loadBusinesses() {
        setLoadingBusinesses(true);
        try {
          const response = await fetch('/api/admin/businesses?limit=1000');
          if (response.ok) {
            const data = await response.json();
            setBusinesses(data);
          }
        } catch (error) {
          console.error('Error loading businesses:', error);
        } finally {
          setLoadingBusinesses(false);
        }
      }
      loadBusinesses();
    }
  }, [showBusinessSelector]);

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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(formData);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {showBusinessSelector && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Business *
          </label>
          <select
            value={formData.business_id || ''}
            onChange={(e) => setFormData({ ...formData, business_id: e.target.value })}
            required
            disabled={loadingBusinesses}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">Select a business</option>
            {businesses.map((business) => (
              <option key={business.id} value={business.id}>
                {business.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pickup Address *
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
            Pickup Name *
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
            Pickup Phone *
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
            Pickup Region
          </label>
          <select
            value={formData.pickup_region_id || ''}
            onChange={(e) => setFormData({ ...formData, pickup_region_id: e.target.value ? parseInt(e.target.value) : null })}
            disabled={loadingRegions}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">Select region</option>
            {regions.map((region) => (
              <option key={region.id} value={region.id}>
                {region.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pickup District
          </label>
          <select
            value={formData.pickup_district_id || ''}
            onChange={(e) => setFormData({ ...formData, pickup_district_id: e.target.value ? parseInt(e.target.value) : null })}
            disabled={!formData.pickup_region_id}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">Select district</option>
            {pickupDistricts.map((district) => (
              <option key={district.id} value={district.id}>
                {district.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="border-t pt-4">
        <h3 className="text-lg font-semibold mb-4">Drop-off Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Drop-off Address *
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
              Drop-off Name *
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
              Drop-off Phone *
            </label>
            <input
              type="tel"
              value={formData.dropoff_phone}
              onChange={(e) => setFormData({ ...formData, dropoff_phone: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Drop-off Region
            </label>
            <select
              value={formData.dropoff_region_id || ''}
              onChange={(e) => setFormData({ ...formData, dropoff_region_id: e.target.value ? parseInt(e.target.value) : null })}
              disabled={loadingRegions}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Select region</option>
              {regions.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Drop-off District
            </label>
            <select
              value={formData.dropoff_district_id || ''}
              onChange={(e) => setFormData({ ...formData, dropoff_district_id: e.target.value ? parseInt(e.target.value) : null })}
              disabled={!formData.dropoff_region_id}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Select district</option>
              {dropoffDistricts.map((district) => (
                <option key={district.id} value={district.id}>
                  {district.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Package Description
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
          disabled={loading}
          className="flex-1 bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? 'Creating...' : 'Create Delivery'}
        </button>
      </div>
    </form>
  );
}
