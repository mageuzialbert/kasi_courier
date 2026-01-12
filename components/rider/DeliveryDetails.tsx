'use client';

import { useState } from 'react';
import { Package, MapPin, Phone, User, Clock, FileText } from 'lucide-react';
import StatusUpdateModal from './StatusUpdateModal';

interface Delivery {
  id: string;
  business_id: string;
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
  package_description: string | null;
  status: string;
  assigned_rider_id: string | null;
  created_at: string;
  delivered_at: string | null;
  businesses?: {
    id: string;
    name: string;
    phone: string;
  };
}

interface DeliveryEvent {
  id: string;
  status: string;
  note: string | null;
  created_at: string;
  created_by?: {
    id: string;
    name: string;
  };
}

interface DeliveryDetailsProps {
  delivery: Delivery;
  events?: DeliveryEvent[];
  onStatusUpdate: (status: string, note: string) => Promise<void>;
  loading?: boolean;
}

const statusColors: Record<string, string> = {
  ASSIGNED: 'bg-blue-100 text-blue-800',
  PICKED_UP: 'bg-yellow-100 text-yellow-800',
  IN_TRANSIT: 'bg-orange-100 text-orange-800',
  DELIVERED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
};

export default function DeliveryDetails({
  delivery,
  events = [],
  onStatusUpdate,
  loading = false,
}: DeliveryDetailsProps) {
  const [showStatusModal, setShowStatusModal] = useState(false);

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const canUpdateStatus = ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(delivery.status);

  return (
    <div className="space-y-4">
      {/* Status Badge */}
      <div className="flex items-center justify-between">
        <span
          className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
            statusColors[delivery.status] || statusColors.ASSIGNED
          }`}
        >
          {delivery.status.replace('_', ' ')}
        </span>
        {canUpdateStatus && (
          <button
            onClick={() => setShowStatusModal(true)}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium"
          >
            Update Status
          </button>
        )}
      </div>

      {/* Business Info */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center gap-2 mb-3">
          <Package className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-gray-900">Business</h3>
        </div>
        <div className="text-sm text-gray-700">
          <p className="font-medium">{delivery.businesses?.name || 'Unknown'}</p>
          <p className="text-gray-500">{delivery.businesses?.phone || ''}</p>
        </div>
      </div>

      {/* Pickup Information */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-gray-900">Pickup Location</h3>
        </div>
        <div className="space-y-2 text-sm">
          <div>
            <p className="font-medium text-gray-900">{delivery.pickup_name}</p>
            <p className="text-gray-600">{delivery.pickup_address}</p>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <Phone className="w-4 h-4" />
            <a href={`tel:${delivery.pickup_phone}`} className="hover:text-primary">
              {delivery.pickup_phone}
            </a>
          </div>
        </div>
      </div>

      {/* Dropoff Information */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-gray-900">Drop-off Location</h3>
        </div>
        <div className="space-y-2 text-sm">
          <div>
            <p className="font-medium text-gray-900">{delivery.dropoff_name}</p>
            <p className="text-gray-600">{delivery.dropoff_address}</p>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <Phone className="w-4 h-4" />
            <a href={`tel:${delivery.dropoff_phone}`} className="hover:text-primary">
              {delivery.dropoff_phone}
            </a>
          </div>
        </div>
      </div>

      {/* Package Description */}
      {delivery.package_description && (
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-gray-500" />
            <h3 className="font-semibold text-gray-900">Package Description</h3>
          </div>
          <p className="text-sm text-gray-700">{delivery.package_description}</p>
        </div>
      )}

      {/* Delivery Timeline */}
      {events.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-5 h-5 text-gray-500" />
            <h3 className="font-semibold text-gray-900">Delivery Timeline</h3>
          </div>
          <div className="space-y-3">
            {events.map((event, index) => (
              <div key={event.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  {index < events.length - 1 && (
                    <div className="w-0.5 h-full bg-gray-200 mt-1"></div>
                  )}
                </div>
                <div className="flex-1 pb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        statusColors[event.status] || statusColors.ASSIGNED
                      }`}
                    >
                      {event.status.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDateTime(event.created_at)}
                    </span>
                  </div>
                  {event.note && (
                    <p className="text-sm text-gray-600 mt-1">{event.note}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      <StatusUpdateModal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        onUpdate={onStatusUpdate}
        currentStatus={delivery.status}
        loading={loading}
      />
    </div>
  );
}
