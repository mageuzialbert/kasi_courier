'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { getUserRole } from '@/lib/roles';
import FinancialDashboard from '@/components/financial/FinancialDashboard';

export default function StaffFinancialPage() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    async function checkRole() {
      const userRole = await getUserRole();
      if (userRole !== 'STAFF' && userRole !== 'ADMIN') {
        router.push('/dashboard/business');
        return;
      }
      setRole(userRole);
      loadFinancialData();
    }
    checkRole();
  }, [router]);

  async function loadFinancialData() {
    try {
      const response = await fetch('/api/staff/financial');
      if (response.ok) {
        const financialData = await response.json();
        setData(financialData);
      }
    } catch (error) {
      console.error('Error loading financial data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8 text-gray-500">
        Failed to load financial data
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Financial Analytics</h1>
      <FinancialDashboard data={data} />
    </div>
  );
}
