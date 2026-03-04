"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, X, Loader2, RefreshCw, Building2, CalendarDays } from "lucide-react";
import { getUserRole } from "@/lib/roles";
import DeliveriesTable from "@/components/deliveries/DeliveriesTable";
import DeliveryForm, {
  DeliveryFormData,
} from "@/components/deliveries/DeliveryForm";
import RiderAssignmentModal from "@/components/deliveries/RiderAssignmentModal";

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
  delivery_fee?: number | null;
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

interface Business {
  id: string;
  name: string;
}

type TimePeriod = "all" | "today" | "this_week" | "this_month" | "this_year" | "custom";

function getDateRange(period: TimePeriod): { start_date: string; end_date: string } | null {
  if (period === "all") return null;

  const now = new Date();
  let start: Date;
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  switch (period) {
    case "today":
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "this_week": {
      const day = now.getDay();
      const diff = day === 0 ? 6 : day - 1;
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
      break;
    }
    case "this_month":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "this_year":
      start = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      return null;
  }

  return {
    start_date: start.toISOString(),
    end_date: end.toISOString(),
  };
}

export default function StaffDeliveriesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalCount, setTotalCount] = useState(0);

  // Filter state
  const [businessFilter, setBusinessFilter] = useState<string>("");
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // Businesses list for filter dropdown
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loadingBusinesses, setLoadingBusinesses] = useState(false);

  // Fee edit modal state
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [editingDeliveryId, setEditingDeliveryId] = useState<string | null>(
    null,
  );
  const [editingFee, setEditingFee] = useState<number>(0);
  const [savingFee, setSavingFee] = useState(false);

  // Load businesses for the filter dropdown
  useEffect(() => {
    async function loadBusinesses() {
      setLoadingBusinesses(true);
      try {
        const response = await fetch("/api/admin/businesses?limit=1000");
        if (response.ok) {
          const data = await response.json();
          const list = Array.isArray(data) ? data : data.businesses || [];
          setBusinesses(
            list.map((b: any) => ({ id: b.id, name: b.name })).sort((a: Business, b: Business) => a.name.localeCompare(b.name))
          );
        }
      } catch (err) {
        console.error("Error loading businesses:", err);
      } finally {
        setLoadingBusinesses(false);
      }
    }
    loadBusinesses();
  }, []);

  useEffect(() => {
    async function checkRole() {
      const userRole = await getUserRole();
      if (userRole !== "STAFF" && userRole !== "ADMIN") {
        router.push("/dashboard/business");
        return;
      }
      setRole(userRole);
      if (searchParams.get("action") === "create") {
        setShowCreateForm(true);
      }
    }
    checkRole();
  }, [router, searchParams]);

  // Load deliveries when filters change
  useEffect(() => {
    if (role) {
      loadDeliveries();
    }
  }, [page, pageSize, role, businessFilter, timePeriod, customStartDate, customEndDate]);

  async function loadDeliveries() {
    setLoading(true);
    try {
      const offset = (page - 1) * pageSize;
      const params = new URLSearchParams({
        limit: pageSize.toString(),
        offset: offset.toString(),
        include_totals: "true",
      });

      if (businessFilter) {
        params.set("business_id", businessFilter);
      }

      if (timePeriod === "custom") {
        if (customStartDate) {
          params.set("start_date", new Date(customStartDate).toISOString());
        }
        if (customEndDate) {
          const endDate = new Date(customEndDate);
          endDate.setHours(23, 59, 59, 999);
          params.set("end_date", endDate.toISOString());
        }
      } else {
        const range = getDateRange(timePeriod);
        if (range) {
          params.set("start_date", range.start_date);
          params.set("end_date", range.end_date);
        }
      }

      const response = await fetch(`/api/staff/deliveries?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setDeliveries(data.deliveries);
        setTotalCount(data.total);
      }
    } catch (error) {
      console.error("Error loading deliveries:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateDelivery(data: DeliveryFormData) {
    if (!data.business_id) {
      setError("Please select a client");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/staff/deliveries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create delivery");
      }

      setShowCreateForm(false);
      loadDeliveries();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create delivery",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAssignRider(riderId: string) {
    if (!selectedDeliveryId) return;

    setAssigning(true);
    setError("");

    try {
      const response = await fetch(
        `/api/staff/deliveries/${selectedDeliveryId}/assign`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rider_id: riderId }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to assign rider");
      }

      setShowAssignModal(false);
      setSelectedDeliveryId(null);
      loadDeliveries();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign rider");
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
    setError("");

    try {
      const response = await fetch(
        `/api/staff/deliveries/${deliveryId}/confirm`,
        {
          method: "PUT",
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        // Always reload to show fresh state after error
        await loadDeliveries();
        throw new Error(errorData.error || "Failed to confirm delivery");
      }

      loadDeliveries();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to confirm delivery",
      );
    } finally {
      setConfirming(false);
    }
  }

  async function handleRejectDelivery(deliveryId: string) {
    if (confirming) return;

    const reason = window.prompt("Enter rejection reason (optional):");
    if (reason === null) return; // User cancelled

    setConfirming(true);
    setError("");

    try {
      const response = await fetch(
        `/api/staff/deliveries/${deliveryId}/confirm`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: reason || undefined }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        // Always reload to show fresh state after error
        await loadDeliveries();
        throw new Error(errorData.error || "Failed to reject delivery");
      }

      loadDeliveries();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to reject delivery",
      );
    } finally {
      setConfirming(false);
    }
  }

  async function handleDeleteDelivery(deliveryId: string) {
    if (deleting) return;

    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this delivery? This action cannot be undone and will also delete all associated charges and events.",
    );
    if (!confirmed) return;

    setDeleting(true);
    setError("");

    try {
      const response = await fetch(`/api/staff/deliveries/${deliveryId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete delivery");
      }

      loadDeliveries();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete delivery",
      );
    } finally {
      setDeleting(false);
    }
  }

  function handleEditFeeClick(deliveryId: string, currentFee: number | null) {
    setEditingDeliveryId(deliveryId);
    setEditingFee(currentFee ?? 0);
    setShowFeeModal(true);
  }

  async function handleSaveFee() {
    if (!editingDeliveryId || savingFee) return;

    setSavingFee(true);
    setError("");

    try {
      const response = await fetch(
        `/api/staff/deliveries/${editingDeliveryId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ delivery_fee: editingFee }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update fee");
      }

      setShowFeeModal(false);
      setEditingDeliveryId(null);
      loadDeliveries();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update fee");
    } finally {
      setSavingFee(false);
    }
  }

  function handlePageChange(newPage: number) {
    setPage(newPage);
  }

  function handlePageSizeChange(newPageSize: number) {
    setPageSize(newPageSize);
    setPage(1); // Reset to first page when changing page size
  }

  function handleExport(format: "csv" | "excel") {
    const headers = [
      "ID",
      "Client",
      "Pickup Name",
      "Pickup Address",
      "Pickup Phone",
      "Dropoff Name",
      "Dropoff Address",
      "Dropoff Phone",
      "Status",
      "Rider",
      "Fee (TZS)",
      "Created",
    ];

    const rows = deliveries.map((d) => [
      d.id,
      d.businesses?.name || "",
      d.pickup_name,
      d.pickup_address,
      d.pickup_phone,
      d.dropoff_name,
      d.dropoff_address,
      d.dropoff_phone,
      d.status,
      d.assigned_rider?.name || "",
      d.delivery_fee?.toString() || "0",
      new Date(d.created_at).toLocaleString(),
    ]);

    const downloadDate = new Date().toISOString().split("T")[0];
    let blob: Blob;
    let extension: "csv" | "xls";

    if (format === "csv") {
      const csvContent = [
        headers.join(","),
        ...rows.map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
        ),
      ].join("\n");

      blob = new Blob(["\ufeff", csvContent], {
        type: "text/csv;charset=utf-8",
      });
      extension = "csv";
    } else {
      const escapeHtml = (value: string) =>
        value
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/\"/g, "&quot;")
          .replace(/'/g, "&#39;");

      const headerHtml = headers
        .map((header) => `<th>${escapeHtml(header)}</th>`)
        .join("");
      const rowsHtml = rows
        .map(
          (row) =>
            `<tr>${row
              .map(
                (cell) =>
                  `<td style="mso-number-format:'\\@';">${escapeHtml(String(cell))}</td>`,
              )
              .join("")}</tr>`,
        )
        .join("");

      const excelContent = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
  </head>
  <body>
    <table border="1">
      <thead><tr>${headerHtml}</tr></thead>
      <tbody>${rowsHtml}</tbody>
    </table>
  </body>
</html>`;

      blob = new Blob(["\ufeff", excelContent], {
        type: "application/vnd.ms-excel;charset=utf-8",
      });
      extension = "xls";
    }

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `deliveries-${downloadDate}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  if (loading && deliveries.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full min-w-0">
      {error && !showCreateForm && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start justify-between gap-4">
          <span className="flex-1">{error}</span>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => {
                setError("");
                loadDeliveries();
              }}
              className="flex items-center gap-1 text-red-600 hover:text-red-800 font-medium"
              title="Refresh deliveries list"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={() => setError("")}
              className="text-red-500 hover:text-red-700"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Deliveries Management
        </h1>
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

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          {/* Client Filter */}
          <div className="flex-1 min-w-[180px] max-w-xs">
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
              <Building2 className="w-3.5 h-3.5" />
              Client
            </label>
            <select
              value={businessFilter}
              onChange={(e) => {
                setBusinessFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">All Clients</option>
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Time Period Filter */}
          <div className="flex-1 min-w-[180px] max-w-xs">
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
              <CalendarDays className="w-3.5 h-3.5" />
              Time Period
            </label>
            <select
              value={timePeriod}
              onChange={(e) => {
                setTimePeriod(e.target.value as TimePeriod);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="this_year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Custom Date Pickers */}
          {timePeriod === "custom" && (
            <>
              <div className="min-w-[150px]">
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                  From
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => {
                    setCustomStartDate(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div className="min-w-[150px]">
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                  To
                </label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => {
                    setCustomEndDate(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </>
          )}

          {/* Clear Filters */}
          {(businessFilter || timePeriod !== "all") && (
            <button
              onClick={() => {
                setBusinessFilter("");
                setTimePeriod("all");
                setCustomStartDate("");
                setCustomEndDate("");
                setPage(1);
              }}
              className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>
      </div>

      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Create New Delivery</h2>
            <button
              onClick={() => {
                setShowCreateForm(false);
                setError("");
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
            showDeliveryFee={true}
          />
        </div>
      )}

      <DeliveriesTable
        deliveries={deliveries}
        onAssignRider={handleAssignClick}
        onConfirm={handleConfirmDelivery}
        onReject={handleRejectDelivery}
        onDelete={handleDeleteDelivery}
        onEditFee={handleEditFeeClick}
        onExport={handleExport}
        showBusiness={true}
        showActions={true}
        showFee={true}
        basePath="/dashboard/staff/deliveries"
        page={page}
        pageSize={pageSize}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />

      {/* Fee Edit Modal */}
      {showFeeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Edit Delivery Fee</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fee Amount (TZS)
              </label>
              <input
                type="number"
                min="0"
                step="100"
                value={editingFee}
                onChange={(e) => setEditingFee(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                autoFocus
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowFeeModal(false);
                  setEditingDeliveryId(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFee}
                disabled={savingFee}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {savingFee ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      <RiderAssignmentModal
        isOpen={showAssignModal}
        onClose={() => {
          setShowAssignModal(false);
          setSelectedDeliveryId(null);
        }}
        onAssign={handleAssignRider}
        deliveryId={selectedDeliveryId || ""}
        loading={assigning}
      />
    </div>
  );
}
