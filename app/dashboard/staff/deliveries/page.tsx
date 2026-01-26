'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, X, Loader2 } from 'lucide-react';
import { getUserRole } from '@/lib/roles';
import DeliveriesTable from '@/components/deliveries/DeliveriesTable';
import DeliveryForm, { DeliveryFormData } from '@/components/deliveries/DeliveryForm';
import RiderAssignmentModal from '@/components/deliveries/RiderAssignmentModal';

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

export default function StaffDeliveriesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function checkRole() {
      const userRole = await getUserRole();
      if (userRole !== 'STAFF' && userRole !== 'ADMIN') {
        router.push('/dashboard/business');
        return;
      }
      setRole(userRole);
      if (searchParams.get('action') === 'create') {
        setShowCreateForm(true);
      }
      loadDeliveries();
    }
    checkRole();
  }, [router, searchParams]);

  async function loadDeliveries() {
    try {
      const response = await fetch('/api/staff/deliveries?limit=1000');
      if (response.ok) {
        const data = await response.json();
        setDeliveries(data);
      }
    } catch (error) {
      console.error('Error loading deliveries:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateDelivery(data: DeliveryFormData) {
    if (!data.business_id) {
      setError('Please select a business');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/staff/deliveries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create delivery');
      }

      setShowCreateForm(false);
      loadDeliveries();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create delivery');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAssignRider(riderId: string) {
    if (!selectedDeliveryId) return;

    setAssigning(true);
    setError('');

    try {
      const response = await fetch(`/api/staff/deliveries/${selectedDeliveryId}/assign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rider_id: riderId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign rider');
      }

      setShowAssignModal(false);
      setSelectedDeliveryId(null);
      loadDeliveries();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign rider');
    } finally {
      setAssigning(false);
    }
  }

  function handleAssignClick(deliveryId: string) {
    setSelectedDeliveryId(deliveryId);
    setShowAssignModal(true);
  }

  async function handleConfirmDelivery(deliveryId: string) {
    if (confirming) return;
    
    setConfirming(true);
    setError('');

    try {
      const response = await fetch(`/api/staff/deliveries/${deliveryId}/confirm`, {
        method: 'PUT',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to confirm delivery');
      }

      loadDeliveries();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm delivery');
    } finally {
      setConfirming(false);
    }
  }

  async function handleRejectDelivery(deliveryId: string) {
    if (confirming) return;
    
    const reason = window.prompt('Enter rejection reason (optional):');
    if (reason === null) return; // User cancelled

    setConfirming(true);
    setError('');

    try {
      const response = await fetch(`/api/staff/deliveries/${deliveryId}/confirm`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason || undefined }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reject delivery');
      }

      loadDeliveries();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject delivery');
    } finally {
      setConfirming(false);
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
        <h1 className="text-3xl font-bold text-gray-900">Deliveries Management</h1>
        {!showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Delivery
          </button>
        )}
      </div>

      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Create New Delivery</h2>
            <button
              onClick={() => {
                setShowCreateForm(false);
                setError('');
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <DeliveryForm
            onSubmit={handleCreateDelivery}
            loading={submitting}
            error={error}
            showBusinessSelector={true}
          />
        </div>
      )}

      <DeliveriesTable
        deliveries={deliveries}
        onAssignRider={handleAssignClick}
        onConfirm={handleConfirmDelivery}
        onReject={handleRejectDelivery}
        showBusiness={true}
        showActions={true}
        basePath="/dashboard/staff/deliveries"
      />

      <RiderAssignmentModal
        isOpen={showAssignModal}
        onClose={() => {
          setShowAssignModal(false);
          setSelectedDeliveryId(null);
        }}
        onAssign={handleAssignRider}
        deliveryId={selectedDeliveryId || ''}
        loading={assigning}
      />
    </div>
  );
}
