'use client';

import { DollarSign, TrendingUp, FileText, AlertCircle } from 'lucide-react';

interface FinancialData {
  revenue: {
    total: number;
    thisWeek: number;
    thisMonth: number;
  };
  invoices: {
    total: number;
    pending: number;
    paid: number;
    draft: number;
    totalAmount: number;
    pendingAmount: number;
  };
  chargesBreakdown: Array<{
    id: string;
    amount: number;
    description: string | null;
    created_at: string;
    businesses?: {
      id: string;
      name: string;
    };
  }>;
  topBusinesses: Array<{
    businessId: string;
    businessName: string;
    revenue: number;
  }>;
  revenueTrends: Array<{
    date: string;
    revenue: number;
  }>;
}

interface FinancialDashboardProps {
  data: FinancialData;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export default function FinancialDashboard({ data }: FinancialDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Revenue Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(data.revenue.total)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-primary" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">This Week</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(data.revenue.thisWeek)}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(data.revenue.thisMonth)}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Invoices Overview */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Invoices Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-xl font-bold text-gray-900">{data.invoices.total}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-xl font-bold text-yellow-600">{data.invoices.pending}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Paid</p>
            <p className="text-xl font-bold text-green-600">{data.invoices.paid}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Draft</p>
            <p className="text-xl font-bold text-gray-600">{data.invoices.draft}</p>
          </div>
        </div>
        <div className="border-t pt-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total Invoice Amount</span>
            <span className="text-lg font-semibold text-gray-900">
              {formatCurrency(data.invoices.totalAmount)}
            </span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-gray-600">Pending Amount</span>
            <span className="text-lg font-semibold text-yellow-600">
              {formatCurrency(data.invoices.pendingAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* Top Businesses */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Top Businesses by Revenue</h3>
        {data.topBusinesses.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No business revenue data</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Rank
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Business
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.topBusinesses.map((business, index) => (
                  <tr key={business.businessId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">#{index + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {business.businessName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {formatCurrency(business.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Charges */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Charges (Last 30 Days)</h3>
        {data.chargesBreakdown.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No recent charges</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Business
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.chargesBreakdown.slice(0, 20).map((charge) => (
                  <tr key={charge.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(charge.created_at)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {charge.businesses?.name || 'Unknown'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {charge.description || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {formatCurrency(charge.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Revenue Trends */}
      {data.revenueTrends.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Revenue Trends (Last 7 Days)</h3>
          <div className="space-y-2">
            {data.revenueTrends.map((trend) => (
              <div key={trend.date} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{formatDate(trend.date)}</span>
                <div className="flex items-center gap-4">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{
                        width: `${
                          (trend.revenue / Math.max(...data.revenueTrends.map((t) => t.revenue))) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-24 text-right">
                    {formatCurrency(trend.revenue)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
