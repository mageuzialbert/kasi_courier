'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Users, UserCog, Bike, Building2, Package, Truck, ArrowRight } from 'lucide-react';
import { getUserRole } from '@/lib/roles';
import { useRouter } from 'next/navigation';

interface DashboardOverview {
  totalUsers: number;
  totalStaff: number;
  totalRiders: number;
  totalClients: number;
  totalDeliveries: number;
  totalSuppliers: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkRole() {
      const userRole = await getUserRole();
      if (userRole !== 'ADMIN') {
        router.push('/dashboard/business');
        return;
      }

      try {
        const response = await fetch('/api/admin/dashboard-overview');
        if (!response.ok) {
          throw new Error('Failed to load dashboard overview');
        }

        const data = await response.json();
        setOverview(data);
      } catch (fetchError) {
        console.error('Error loading admin overview:', fetchError);
        setError('Failed to load dashboard overview');
      } finally {
        setLoading(false);
      }
    }

    checkRole();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  const overviewCards = [
    {
      title: 'Total Users',
      value: overview?.totalUsers || 0,
      description: 'Staff and riders',
      icon: Users,
      color: 'text-blue-600',
    },
    {
      title: 'Staff Users',
      value: overview?.totalStaff || 0,
      description: 'Registered staff accounts',
      icon: UserCog,
      color: 'text-emerald-600',
    },
    {
      title: 'Riders',
      value: overview?.totalRiders || 0,
      description: 'Registered rider accounts',
      icon: Bike,
      color: 'text-orange-600',
    },
    {
      title: 'Registered Clients',
      value: overview?.totalClients || 0,
      description: 'Total client businesses',
      icon: Building2,
      color: 'text-indigo-600',
    },
    {
      title: 'Total Deliveries',
      value: overview?.totalDeliveries || 0,
      description: 'All recorded deliveries',
      icon: Package,
      color: 'text-rose-600',
    },
    {
      title: 'Total Suppliers',
      value: overview?.totalSuppliers || 0,
      description: 'Registered expense suppliers',
      icon: Truck,
      color: 'text-teal-600',
    },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Project overview and key platform totals</p>
        </div>
        <Link
          href="/dashboard/admin/modules"
          className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors w-fit"
        >
          View Modules
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {overviewCards.map((card) => (
          <div key={card.title} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600">{card.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
                <p className="text-sm text-gray-500 mt-2">{card.description}</p>
              </div>
              <card.icon className={`w-8 h-8 ${card.color}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Manage Platform Modules</h2>
        <p className="text-gray-600 mb-4">
          Open the modules page to manage clients, users, deliveries, invoices, CMS content, and other admin tools.
        </p>
        <Link
          href="/dashboard/admin/modules"
          className="inline-flex items-center gap-2 text-primary hover:text-primary-dark font-medium"
        >
          Go to Modules
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
