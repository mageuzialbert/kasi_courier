'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUserRole } from '@/lib/roles';
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  Bike,
  DollarSign,
  CheckCircle,
  Calendar,
  Filter,
} from 'lucide-react';

interface RiderStat {
  id: string;
  name: string;
  phone: string;
  active: boolean;
  deliveryCount: number;
  deliveredCount: number;
  failedCount: number;
  inProgressCount: number;
  successRate: number;
  failedRate: number;
  revenue: number;
  salaryBurn: number;
  net: number;
  activeDays: number;
  avgDeliveriesPerDay: number;
}

interface Summary {
  totalDeliveries: number;
  totalDelivered: number;
  totalRevenue: number;
  totalSalaryBurn: number;
  totalNet: number;
}

type TimeFrame = 'today' | 'this_week' | 'this_month' | 'this_year' | 'custom';

function getDateRange(timeFrame: TimeFrame): { start: string; end: string } {
  const today = new Date();
  const end = today.toISOString().split('T')[0];

  switch (timeFrame) {
    case 'today':
      return { start: end, end };
    case 'this_week': {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      return { start: startOfWeek.toISOString().split('T')[0], end };
    }
    case 'this_month': {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      return { start: startOfMonth.toISOString().split('T')[0], end };
    }
    case 'this_year': {
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      return { start: startOfYear.toISOString().split('T')[0], end };
    }
    default:
      return { start: '', end: '' };
  }
}

export default function RidersActivityDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [riders, setRiders] = useState<RiderStat[]>([]);
  const [summary, setSummary] = useState<Summary>({
    totalDeliveries: 0,
    totalDelivered: 0,
    totalRevenue: 0,
    totalSalaryBurn: 0,
    totalNet: 0,
  });
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('this_month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [selectedRider, setSelectedRider] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortField, setSortField] = useState<keyof RiderStat>('deliveryCount');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    async function checkRole() {
      const userRole = await getUserRole();
      if (userRole !== 'ADMIN' && userRole !== 'STAFF') {
        router.push('/dashboard/business');
        return;
      }
      loadStats();
    }
    checkRole();
  }, [router]);

  useEffect(() => {
    loadStats();
  }, [timeFrame, customStart, customEnd]);

  async function loadStats() {
    try {
      setLoading(true);
      let start: string, end: string;

      if (timeFrame === 'custom') {
        start = customStart;
        end = customEnd;
      } else {
        const range = getDateRange(timeFrame);
        start = range.start;
        end = range.end;
      }

      const params = new URLSearchParams();
      if (start) params.set('start', start);
      if (end) params.set('end', end);

      const response = await fetch(`/api/admin/rider-stats?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setRiders(data.riders || []);
      }
    } catch (error) {
      console.error('Error loading rider stats:', error);
    } finally {
      setLoading(false);
    }
  }

  // Derive filtered list and summary based on selectedRider
  const filteredRiders = riders
    .filter((r) => !selectedRider || r.id === selectedRider)
    .filter((r) => statusFilter === 'all' || (statusFilter === 'active' ? r.active : !r.active));

  const derivedSummary: Summary = {
    totalDeliveries: filteredRiders.reduce((s, r) => s + r.deliveryCount, 0),
    totalDelivered: filteredRiders.reduce((s, r) => s + r.deliveredCount, 0),
    totalRevenue: filteredRiders.reduce((s, r) => s + r.revenue, 0),
    totalSalaryBurn: filteredRiders.reduce((s, r) => s + r.salaryBurn, 0),
    totalNet: filteredRiders.reduce((s, r) => s + r.net, 0),
  };

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
    }).format(amount);
  }

  function handleSort(field: keyof RiderStat) {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  }

  const sortedRiders = [...filteredRiders].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    }
    const aStr = String(aVal || '');
    const bStr = String(bVal || '');
    return sortDir === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
  });

  const SortHeader = ({ field, label }: { field: keyof RiderStat; label: string }) => (
    <th
      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortField === field && (
          <span className="text-primary">{sortDir === 'asc' ? '↑' : '↓'}</span>
        )}
      </div>
    </th>
  );

  if (loading && riders.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Rider Activity</h1>
        <p className="text-gray-600 mt-1">
          Track delivery performance, revenue, and salary burn rate for each rider
        </p>
      </div>

      {/* Time Frame Filter */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Period:</span>
          </div>
          {[
            { key: 'today' as TimeFrame, label: 'Today' },
            { key: 'this_week' as TimeFrame, label: 'This Week' },
            { key: 'this_month' as TimeFrame, label: 'This Month' },
            { key: 'this_year' as TimeFrame, label: 'This Year' },
            { key: 'custom' as TimeFrame, label: 'Custom' },
          ].map((opt) => (
            <button
              key={opt.key}
              onClick={() => setTimeFrame(opt.key)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                timeFrame === opt.key
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
          {timeFrame === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <span className="text-gray-400">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          )}
          <div className="h-6 w-px bg-gray-300 mx-1"></div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Rider:</span>
            <select
              value={selectedRider}
              onChange={(e) => setSelectedRider(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-transparent min-w-[200px]"
            >
              <option value="">All Riders</option>
              {riders.map((rider) => (
                <option key={rider.id} value={rider.id}>
                  {rider.name || 'Unnamed Rider'} - {rider.phone}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Total Deliveries</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{derivedSummary.totalDeliveries}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <Bike className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">{derivedSummary.totalDelivered} delivered</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {derivedSummary.totalDeliveries > 0
                  ? Math.round((derivedSummary.totalDelivered / derivedSummary.totalDeliveries) * 100)
                  : 0}%
              </p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(derivedSummary.totalRevenue)}</p>
            </div>
            <div className="bg-emerald-50 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Salary Burn</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(derivedSummary.totalSalaryBurn)}</p>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Net Contribution</p>
              <p className={`text-2xl font-bold mt-1 ${derivedSummary.totalNet >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(derivedSummary.totalNet)}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${derivedSummary.totalNet >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <DollarSign className={`w-6 h-6 ${derivedSummary.totalNet >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Revenue − Salary</p>
        </div>
      </div>

      {/* Per-Rider Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Per-Rider Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <SortHeader field="name" label="Rider" />
                <SortHeader field="deliveryCount" label="Deliveries" />
                <SortHeader field="deliveredCount" label="Delivered" />
                <SortHeader field="successRate" label="Success %" />
                <SortHeader field="revenue" label="Revenue" />
                <SortHeader field="salaryBurn" label="Salary Burn" />
                <SortHeader field="net" label="Net" />
                <SortHeader field="activeDays" label="Active Days" />
                <SortHeader field="avgDeliveriesPerDay" label="Avg/Day" />
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedRiders.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                    No rider data found for the selected period
                  </td>
                </tr>
              ) : (
                sortedRiders.map((rider) => (
                  <tr key={rider.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{rider.name || 'Unnamed'}</div>
                        <div className="text-xs text-gray-500">{rider.phone}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {rider.deliveryCount}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {rider.deliveredCount}
                      {rider.failedCount > 0 && (
                        <span className="text-xs text-red-500 ml-1">({rider.failedCount} failed)</span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              rider.successRate >= 80
                                ? 'bg-green-500'
                                : rider.successRate >= 50
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${rider.successRate}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-900">{rider.successRate}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(rider.revenue)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-red-600">
                      {rider.salaryBurn > 0 ? formatCurrency(rider.salaryBurn) : '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`text-sm font-semibold ${
                          rider.net >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {formatCurrency(rider.net)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        {rider.activeDays}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {rider.avgDeliveriesPerDay}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {rider.active ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Inactive
                        </span>
                      )}
                    </td>
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
