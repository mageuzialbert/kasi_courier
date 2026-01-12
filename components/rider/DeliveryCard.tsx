'use client';

import { Package, MapPin, Clock, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface Delivery {
  id: string;
  business_id: string;
  pickup_address: string;
  pickup_name: string;
  pickup_phone: string;
  dropoff_address: string;
  dropoff_name: string;
  dropoff_phone: string;
  package_description: string | null;
  status: string;
  created_at: string;
  businesses?: {
    id: string;
    name: string;
    phone: string;
  };
}

interface DeliveryCardProps {
  delivery: Delivery;
}

const statusColors: Record<string, string> = {
  ASSIGNED: 'bg-blue-100 text-blue-800 border border-blue-300',
  PICKED_UP: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
  IN_TRANSIT: 'bg-orange-100 text-orange-800 border border-orange-300',
  DELIVERED: 'bg-green-100 text-green-800 border border-green-300',
  FAILED: 'bg-red-100 text-red-800 border border-red-300',
};

const statusLabels: Record<string, string> = {
  ASSIGNED: 'Assigned',
  PICKED_UP: 'Picked Up',
  IN_TRANSIT: 'In Transit',
  DELIVERED: 'Delivered',
  FAILED: 'Failed',
};

export default function DeliveryCard({ delivery }: DeliveryCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <Link href={`/dashboard/rider/jobs/${delivery.id}`}>
      <div className="bg-white rounded-lg shadow-md p-4 mb-3 active:bg-gray-50 transition-colors border border-gray-200">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-5 h-5 text-primary" />
              <span className="font-semibold text-gray-900">
                {delivery.businesses?.name || 'Unknown Business'}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              <div className="flex items-center gap-1 mb-1">
                <MapPin className="w-4 h-4" />
                <span className="truncate">{delivery.pickup_address}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="truncate">{delivery.dropoff_address}</span>
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
              statusColors[delivery.status] || statusColors.ASSIGNED
            }`}
          >
            {statusLabels[delivery.status] || delivery.status}
          </span>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>{formatDate(delivery.created_at)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
