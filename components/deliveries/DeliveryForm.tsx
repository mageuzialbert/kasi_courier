'use client';

import { useState, useEffect } from 'react';
import { useLoadScript } from '@react-google-maps/api';
import { Loader2, MapPin, User, Phone, Package, AlertCircle } from 'lucide-react';
import LocationPicker from '@/components/common/LocationPicker';

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
  onCancel?: () => void;
  loading: boolean;
  error: string;
  businessId?: string | null;
  showBusinessSelector?: boolean;
}

export interface DeliveryFormData {
  business_id?: string;
  pickup_address: string;
  pickup_latitude: number | null;
  pickup_longitude: number | null;
  pickup_name: string;
  pickup_phone: string;
  pickup_region_id: number | null;
  pickup_district_id: number | null;
  dropoff_address: string;
  dropoff_latitude: number | null;
  dropoff_longitude: number | null;
  dropoff_name: string;
  dropoff_phone: string;
  dropoff_region_id: number | null;
  dropoff_district_id: number | null;
  package_description: string;
}

export default function DeliveryForm({ 
  onSubmit, 
  onCancel,
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
  const [loadingPickupDistricts, setLoadingPickupDistricts] = useState(false);
  const [loadingDropoffDistricts, setLoadingDropoffDistricts] = useState(false);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places'],
  });

  const [formData, setFormData] = useState<DeliveryFormData>({
    business_id: businessId || undefined,
    pickup_address: '',
    pickup_latitude: null,
    pickup_longitude: null,
    pickup_name: '',
    pickup_phone: '',
    pickup_region_id: null,
    pickup_district_id: null,
    dropoff_address: '',
    dropoff_latitude: null,
    dropoff_longitude: null,
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

      setLoadingPickupDistricts(true);
      try {
        const response = await fetch(`/api/districts?region_id=${formData.pickup_region_id}`);
        if (response.ok) {
          const data = await response.json();
          setPickupDistricts(data);
        }
      } catch (error) {
        console.error('Error loading districts:', error);
      } finally {
        setLoadingPickupDistricts(false);
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

      setLoadingDropoffDistricts(true);
      try {
        const response = await fetch(`/api/districts?region_id=${formData.dropoff_region_id}`);
        if (response.ok) {
          const data = await response.json();
          setDropoffDistricts(data);
        }
      } catch (error) {
        console.error('Error loading districts:', error);
      } finally {
        setLoadingDropoffDistricts(false);
      }
    }
    loadDropoffDistricts();
  }, [formData.dropoff_region_id]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(formData);
  }

  const inputClass = "w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";
  const sectionHeaderClass = "flex items-center gap-2 text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {loadError && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>Google Maps failed to load. Address search and map features are unavailable. You can still enter addresses manually.</span>
        </div>
      )}

      {!isLoaded && !loadError && (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-2 text-gray-500">Loading maps...</span>
        </div>
      )}

      {/* Business Selector */}
      {showBusinessSelector && (
        <div className="bg-gray-50 rounded-lg p-4">
          <label className={labelClass}>
            Business <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.business_id || ''}
            onChange={(e) => setFormData({ ...formData, business_id: e.target.value })}
            required
            disabled={loadingBusinesses}
            className={inputClass}
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

      {/* Pickup and Dropoff - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pickup Details - Left Column */}
        <div className="bg-green-50/50 rounded-xl p-5 border border-green-100">
          <div className={sectionHeaderClass}>
            <div className="p-2 bg-green-100 rounded-lg">
              <MapPin className="w-5 h-5 text-green-600" />
            </div>
            <span>Pickup Details</span>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className={labelClass}>
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-gray-400" />
                  Contact Name <span className="text-red-500">*</span>
                </span>
              </label>
              <input
                type="text"
                value={formData.pickup_name}
                onChange={(e) => setFormData({ ...formData, pickup_name: e.target.value })}
                required
                placeholder="Who to pick up from"
                className={inputClass}
              />
            </div>
            
            <div>
              <label className={labelClass}>
                <span className="flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-gray-400" />
                  Phone Number <span className="text-red-500">*</span>
                </span>
              </label>
              <input
                type="tel"
                value={formData.pickup_phone}
                onChange={(e) => setFormData({ ...formData, pickup_phone: e.target.value })}
                required
                placeholder="+255..."
                className={inputClass}
              />
            </div>
            
            <div>
              {isLoaded ? (
                <LocationPicker
                  label="Pickup Address *"
                  value={formData.pickup_address}
                  onChange={(address, lat, lng) => 
                    setFormData({ 
                      ...formData, 
                      pickup_address: address,
                      pickup_latitude: lat,
                      pickup_longitude: lng
                    })
                  }
                  error={formData.pickup_address ? undefined : "Address is required"}
                />
              ) : (
                <>
                  <label className={labelClass}>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      Address <span className="text-red-500">*</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    value={formData.pickup_address}
                    onChange={(e) => setFormData({ ...formData, pickup_address: e.target.value })}
                    required
                    placeholder="Street address, building, etc."
                    className={inputClass}
                  />
                </>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Region</label>
                <select
                  value={formData.pickup_region_id || ''}
                  onChange={(e) => setFormData({ ...formData, pickup_region_id: e.target.value ? parseInt(e.target.value) : null })}
                  disabled={loadingRegions}
                  className={inputClass}
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
                <label className={labelClass}>District</label>
                <select
                  value={formData.pickup_district_id || ''}
                  onChange={(e) => setFormData({ ...formData, pickup_district_id: e.target.value ? parseInt(e.target.value) : null })}
                  disabled={!formData.pickup_region_id || loadingPickupDistricts}
                  className={inputClass}
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
          </div>
        </div>

        {/* Dropoff Details - Right Column */}
        <div className="bg-blue-50/50 rounded-xl p-5 border border-blue-100">
          <div className={sectionHeaderClass}>
            <div className="p-2 bg-blue-100 rounded-lg">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <span>Drop-off Details</span>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className={labelClass}>
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-gray-400" />
                  Recipient Name <span className="text-red-500">*</span>
                </span>
              </label>
              <input
                type="text"
                value={formData.dropoff_name}
                onChange={(e) => setFormData({ ...formData, dropoff_name: e.target.value })}
                required
                placeholder="Who to deliver to"
                className={inputClass}
              />
            </div>
            
            <div>
              <label className={labelClass}>
                <span className="flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-gray-400" />
                  Phone Number <span className="text-red-500">*</span>
                </span>
              </label>
              <input
                type="tel"
                value={formData.dropoff_phone}
                onChange={(e) => setFormData({ ...formData, dropoff_phone: e.target.value })}
                required
                placeholder="+255..."
                className={inputClass}
              />
            </div>
            
            <div>
              {isLoaded ? (
                <LocationPicker
                  label="Drop-off Address *"
                  value={formData.dropoff_address}
                  onChange={(address, lat, lng) => 
                    setFormData({ 
                      ...formData, 
                      dropoff_address: address,
                      dropoff_latitude: lat,
                      dropoff_longitude: lng
                    })
                  }
                  error={formData.dropoff_address ? undefined : "Address is required"}
                />
              ) : (
                <>
                  <label className={labelClass}>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      Address <span className="text-red-500">*</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    value={formData.dropoff_address}
                    onChange={(e) => setFormData({ ...formData, dropoff_address: e.target.value })}
                    required
                    placeholder="Street address, building, etc."
                    className={inputClass}
                  />
                </>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Region</label>
                <select
                  value={formData.dropoff_region_id || ''}
                  onChange={(e) => setFormData({ ...formData, dropoff_region_id: e.target.value ? parseInt(e.target.value) : null })}
                  disabled={loadingRegions}
                  className={inputClass}
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
                <label className={labelClass}>District</label>
                <select
                  value={formData.dropoff_district_id || ''}
                  onChange={(e) => setFormData({ ...formData, dropoff_district_id: e.target.value ? parseInt(e.target.value) : null })}
                  disabled={!formData.dropoff_region_id || loadingDropoffDistricts}
                  className={inputClass}
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
        </div>
      </div>

      {/* Special Instructions */}
      <div className="bg-amber-50/50 rounded-xl p-5 border border-amber-100">
        <div className={sectionHeaderClass}>
          <div className="p-2 bg-amber-100 rounded-lg">
            <Package className="w-5 h-5 text-amber-600" />
          </div>
          <span>Special Instructions <span className="text-red-500">*</span></span>
        </div>
        <textarea
          value={formData.package_description}
          onChange={(e) => setFormData({ ...formData, package_description: e.target.value })}
          required
          rows={3}
          placeholder="Package details, handling instructions, delivery notes..."
          className={inputClass + " resize-none"}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium shadow-sm"
        >
          {loading && <Loader2 className="w-5 h-5 animate-spin" />}
          {loading ? 'Creating Delivery...' : 'Create Delivery'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
