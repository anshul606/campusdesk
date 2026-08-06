"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { format, parseISO } from "date-fns";
import { Plus, Trash2, Edit2, AlertCircle, CheckCircle2 } from "lucide-react";

interface Resource {
  id: string;
  name: string;
  description: string;
  location: string;
  category: string;
  openTime: string;
  closeTime: string;
  isActive: boolean;
}

interface Booking {
  id: string;
  startTime: string;
  endTime: string;
  purpose: string;
  status: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  resource: {
    id: string;
    name: string;
  };
}

export default function AdminPage() {
  const { user, authFetch, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"resources" | "bookings">("resources");

  const [resources, setResources] = useState<Resource[]>([]);
  const [loadingResources, setLoadingResources] = useState(true);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    location: "",
    category: "hall",
    openTime: "09:00",
    closeTime: "21:00",
  });

  const [filterResource, setFilterResource] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDate, setFilterDate] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      router.push("/resources");
    }
  }, [user, authLoading, router]);

  const fetchResources = useCallback(async () => {
    setLoadingResources(true);
    try {
      const res = await authFetch("/api/resources?limit=100");
      if (res.ok) {
        const data = await res.json();
        setResources(data.data || []);
      }
    } catch {
      
    } finally {
      setLoadingResources(false);
    }
  }, [authFetch]);

  const fetchAllBookings = useCallback(async () => {
    setLoadingBookings(true);
    try {
      let url = `/api/admin/bookings?limit=50`;
      if (filterResource !== "all") url += `&resourceId=${filterResource}`;
      if (filterStatus !== "all") url += `&status=${filterStatus}`;
      if (filterDate) url += `&date=${filterDate}`;

      const res = await authFetch(url);
      if (res.ok) {
        const data = await res.json();
        setBookings(data.data || []);
      }
    } catch {
      
    } finally {
      setLoadingBookings(false);
    }
  }, [filterResource, filterStatus, filterDate, authFetch]);

  useEffect(() => {
    if (user && user.role === "admin") {
      fetchResources();
    }
  }, [fetchResources, user]);

  useEffect(() => {
    if (user && user.role === "admin" && activeTab === "bookings") {
      fetchAllBookings();
      const interval = setInterval(fetchAllBookings, 30000);
      return () => clearInterval(interval);
    }
  }, [activeTab, fetchAllBookings, user]);

  const handleSaveResource = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      const url = editingResource ? `/api/resources/${editingResource.id}` : "/api/resources";
      const method = editingResource ? "PATCH" : "POST";

      const res = await authFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not save resource.");
        setSubmitting(false);
        return;
      }

      setSuccess(editingResource ? "Resource updated." : "Resource created.");
      setShowAddModal(false);
      setEditingResource(null);
      setFormData({ name: "", description: "", location: "", category: "hall", openTime: "09:00", closeTime: "21:00" });
      fetchResources();
    } catch {
      setError("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSoftDelete = async (resourceId: string) => {
    if (!confirm("Deactivate this resource?")) return;

    try {
      const res = await authFetch(`/api/resources/${resourceId}`, { method: "DELETE" });
      if (res.ok) {
        setSuccess("Resource deactivated.");
        fetchResources();
      }
    } catch {
      setError("Could not deactivate resource.");
    }
  };

  const handleAdminCancelBooking = async (bookingId: string) => {
    if (!confirm("Cancel this booking?")) return;

    try {
      const res = await authFetch(`/api/bookings/${bookingId}/cancel`, { method: "PATCH" });
      if (res.ok) {
        setSuccess("Booking cancelled.");
        fetchAllBookings();
      }
    } catch {
      setError("Could not cancel booking.");
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "text-[var(--color-sage)]";
      case "completed": return "text-stone-400";
      case "cancelled": return "text-[var(--color-clay)]";
      default: return "text-stone-400";
    }
  };

  if (authLoading || (user && user.role !== "admin")) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-stone-300 border-t-[var(--color-ink)] dark:border-stone-700 dark:border-t-white"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-ink)] dark:text-white">Admin</h1>
        </div>

        <button
          onClick={() => {
            setEditingResource(null);
            setFormData({ name: "", description: "", location: "", category: "hall", openTime: "09:00", closeTime: "21:00" });
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 rounded-md bg-[var(--color-ink)] px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 dark:bg-white dark:text-[var(--color-night)] dark:hover:bg-stone-200 transition-colors self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" /> Add resource
        </button>
      </div>

      <div className="mt-6 flex items-center gap-1 border-b border-stone-200 dark:border-stone-800 pb-0">
        <button
          onClick={() => setActiveTab("resources")}
          className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "resources"
              ? "border-[var(--color-sandstone)] text-[var(--color-ink)] dark:text-white"
              : "border-transparent text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
          }`}
        >
          Resources ({resources.length})
        </button>
        <button
          onClick={() => setActiveTab("bookings")}
          className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "bookings"
              ? "border-[var(--color-sandstone)] text-[var(--color-ink)] dark:text-white"
              : "border-transparent text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
          }`}
        >
          All bookings
        </button>
      </div>

      {success && (
        <div className="mt-4 rounded-md border border-[var(--color-sage)]/20 bg-emerald-50 px-3 py-2.5 text-sm text-[var(--color-sage)] dark:bg-emerald-950/30 dark:border-emerald-900/40 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {success}
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-md border border-[var(--color-clay)]/20 bg-orange-50 px-3 py-2.5 text-sm text-[var(--color-clay)] dark:bg-orange-950/30 dark:border-orange-900/40 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {activeTab === "resources" ? (
        <div className="mt-5">
          {loadingResources ? (
            <div className="py-12 text-center text-sm text-stone-400">Loading…</div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-stone-200 dark:border-stone-800">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-stone-50 text-xs font-medium text-stone-500 uppercase dark:bg-stone-900 dark:text-stone-400">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Hours</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 bg-white dark:divide-stone-800 dark:bg-stone-900">
                  {resources.map((res) => (
                    <tr key={res.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-[var(--color-ink)] dark:text-white">{res.name}</p>
                        <p className="text-xs text-stone-400 line-clamp-1 mt-0.5">{res.description}</p>
                      </td>
                      <td className="px-4 py-3 text-stone-500 capitalize text-xs">{res.category}</td>
                      <td className="px-4 py-3 text-stone-500 text-xs">{res.location}</td>
                      <td className="px-4 py-3 font-mono text-xs text-stone-500">{res.openTime} – {res.closeTime}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium ${res.isActive ? "text-[var(--color-sage)]" : "text-stone-400"}`}>
                          {res.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditingResource(res);
                              setFormData({
                                name: res.name,
                                description: res.description,
                                location: res.location,
                                category: res.category,
                                openTime: res.openTime,
                                closeTime: res.closeTime,
                              });
                              setShowAddModal(true);
                            }}
                            className="rounded p-1.5 text-stone-400 hover:text-[var(--color-ink)] hover:bg-stone-100 dark:hover:bg-stone-800 dark:hover:text-white transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          {res.isActive && (
                            <button
                              onClick={() => handleSoftDelete(res.id)}
                              className="rounded p-1.5 text-stone-400 hover:text-[var(--color-clay)] hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-colors"
                              title="Deactivate"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={filterResource}
              onChange={(e) => setFilterResource(e.target.value)}
              className="rounded-md border border-stone-300 px-3 py-1.5 text-sm text-[var(--color-ink)] dark:border-stone-700 dark:bg-stone-900 dark:text-white"
            >
              <option value="all">All resources</option>
              {resources.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-md border border-stone-300 px-3 py-1.5 text-sm text-[var(--color-ink)] dark:border-stone-700 dark:bg-stone-900 dark:text-white"
            >
              <option value="all">All statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="rounded-md border border-stone-300 px-3 py-1.5 text-sm font-mono text-[var(--color-ink)] dark:border-stone-700 dark:bg-stone-900 dark:text-white"
            />
          </div>

          {loadingBookings ? (
            <div className="py-12 text-center text-sm text-stone-400">Loading…</div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-stone-200 dark:border-stone-800">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-stone-50 text-xs font-medium text-stone-500 uppercase dark:bg-stone-900 dark:text-stone-400">
                  <tr>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Resource</th>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Purpose</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 bg-white dark:divide-stone-800 dark:bg-stone-900">
                  {bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-[var(--color-ink)] dark:text-white">{b.user.name}</p>
                        <p className="text-xs text-stone-400 font-mono">{b.user.email}</p>
                      </td>
                      <td className="px-4 py-3 text-stone-600 dark:text-stone-300">{b.resource.name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-stone-500">
                        {format(parseISO(b.startTime), "MMM d, p")} – {format(parseISO(b.endTime), "p")}
                      </td>
                      <td className="px-4 py-3 text-stone-500 italic max-w-xs truncate text-xs">{b.purpose}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium ${statusColor(b.status)}`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {b.status === "confirmed" && (
                          <button
                            onClick={() => handleAdminCancelBooking(b.id)}
                            className="text-xs font-medium text-stone-400 hover:text-[var(--color-clay)] transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}


      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
            <h3 className="text-lg font-semibold text-[var(--color-ink)] dark:text-white">
              {editingResource ? "Edit resource" : "New resource"}
            </h3>

            <form onSubmit={handleSaveResource} className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="block w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-[var(--color-ink)] dark:border-stone-700 dark:bg-stone-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Description</label>
                <textarea
                  required
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="block w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-[var(--color-ink)] dark:border-stone-700 dark:bg-stone-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Location</label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="block w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-[var(--color-ink)] dark:border-stone-700 dark:bg-stone-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="block w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-[var(--color-ink)] dark:border-stone-700 dark:bg-stone-800 dark:text-white"
                  >
                    <option value="hall">Hall</option>
                    <option value="room">Room</option>
                    <option value="equipment">Equipment</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Opens (HH:MM)</label>
                  <input
                    type="text"
                    required
                    value={formData.openTime}
                    onChange={(e) => setFormData({ ...formData, openTime: e.target.value })}
                    className="block w-full rounded-md border border-stone-300 px-3 py-2 text-sm font-mono text-[var(--color-ink)] dark:border-stone-700 dark:bg-stone-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Closes (HH:MM)</label>
                  <input
                    type="text"
                    required
                    value={formData.closeTime}
                    onChange={(e) => setFormData({ ...formData, closeTime: e.target.value })}
                    className="block w-full rounded-md border border-stone-300 px-3 py-2 text-sm font-mono text-[var(--color-ink)] dark:border-stone-700 dark:bg-stone-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-md border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-md bg-[var(--color-ink)] px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 dark:bg-white dark:text-[var(--color-night)] dark:hover:bg-stone-200 disabled:opacity-50 transition-colors"
                >
                  {submitting ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
