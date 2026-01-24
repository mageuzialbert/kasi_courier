'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Package, User, MapPin, Calendar, Filter, Eye } from 'lucide-react';

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
  assigned_rider_id: string | null;
  created_at: string;
  delivered_at: string | null;
  businesses?: {
    id: string;
    name: string;
    phone: string;
  };
  assigned_rider?: {
    id: string;
    name: string;
    phone: string;
  } | null;
}

interface DeliveriesTableProps {
  deliveries: Delivery[];
  onAssignRider?: (deliveryId: string) => void;
  showBusiness?: boolean;
  showActions?: boolean;
  basePath?: string;
}

const statusColors: Record<string, string> = {
  CREATED: 'bg-gray-100 text-gray-800 border border-gray-300',
  ASSIGNED: 'bg-blue-100 text-blue-800 border border-blue-300',
  PICKED_UP: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
  IN_TRANSIT: 'bg-orange-100 text-orange-800 border border-orange-300',
  DELIVERED: 'bg-green-100 text-green-800 border border-green-300',
  FAILED: 'bg-red-100 text-red-800 border border-red-300',
};

export default function DeliveriesTable({
  deliveries,
  onAssignRider,
  showBusiness = false,
  showActions = true,
  basePath = '/dashboard/business/deliveries',
}: DeliveriesTableProps) {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredDeliveries = deliveries.filter((delivery) => {
    if (statusFilter === 'ALL') return true;
    return delivery.status === statusFilter;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="ALL">All Statuses</option>
            <option value="CREATED">Created</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="PICKED_UP">Picked Up</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="DELIVERED">Delivered</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
        <div className="text-sm text-gray-600">
          Showing {filteredDeliveries.length} of {deliveries.length} deliveries
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {showBusiness && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Business
                  </th>
                )}
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
                  Rider
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                {showActions && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDeliveries.length === 0 ? (
                <tr>
                  <td
                    colSpan={showBusiness && showActions ? 7 : showBusiness || showActions ? 6 : 5}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No deliveries found
                  </td>
                </tr>
              ) : (
                filteredDeliveries.map((delivery) => (
                  <tr key={delivery.id} className="hover:bg-gray-50">
                    {showBusiness && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {delivery.businesses?.name || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {delivery.businesses?.phone || ''}
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {delivery.pickup_name}
                      </div>
                      <div className="text-sm text-gray-500">{delivery.pickup_address}</div>
                      <div className="text-xs text-gray-400">{delivery.pickup_phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {delivery.dropoff_name}
                      </div>
                      <div className="text-sm text-gray-500">{delivery.dropoff_address}</div>
                      <div className="text-xs text-gray-400">{delivery.dropoff_phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          statusColors[delivery.status] || statusColors.CREATED
                        }`}
                      >
                        {delivery.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {delivery.assigned_rider ? (
                        <div>
                          <div className="font-medium">{delivery.assigned_rider.name}</div>
                          <div className="text-xs">{delivery.assigned_rider.phone}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">Not assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(delivery.created_at)}
                    </td>
                    {showActions && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-3">
                          <Link
                             href={`${basePath}/${delivery.id}`}
                             className="text-gray-600 hover:text-primary flex items-center gap-1"
                             title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                            <span className="sr-only">View</span>
                          </Link>
                          {!delivery.assigned_rider_id && onAssignRider && (
                            <button
                              onClick={() => onAssignRider(delivery.id)}
                              className="text-primary hover:text-primary-dark"
                            >
                              Assign Rider
                            </button>
                          )}
                        </div>
                      </td>
                    )}
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
