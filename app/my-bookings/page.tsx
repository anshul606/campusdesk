"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { format, parseISO } from "date-fns";
import { Clock, MapPin, XCircle, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";

interface Booking {
  id: string;
  startTime: string;
  endTime: string;
  purpose: string;
  status: "confirmed" | "cancelled" | "completed";
  resource: {
    id: string;
    name: string;
    location: string;
    category: string;
  };
}

const TABS = [
  { id: "all", label: "All" },
  { id: "confirmed", label: "Confirmed" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

export default function MyBookingsPage() {
  const { user, authFetch, loading: authLoading } = useAuth();
  const router = useRouter();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else if (user.role === "admin") {
        router.push("/admin");
      }
    }
  }, [user, authLoading, router]);

  const fetchMyBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch(`/api/bookings/me?status=${activeTab}&page=${page}&limit=6`);
      if (!res.ok) throw new Error("Could not load bookings.");
      const data = await res.json();
      setBookings(data.data || []);
      setTotalPages(Math.ceil((data.total || 0) / 6) || 1);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, authFetch]);

  useEffect(() => {
    if (user && user.role !== "admin") {
      fetchMyBookings();
      const interval = setInterval(fetchMyBookings, 30000);
      return () => clearInterval(interval);
    }
  }, [fetchMyBookings, user]);

  const handleCancelBooking = async (bookingId: string) => {
    setError(null);
    setCancellingId(bookingId);

    const previousBookings = [...bookings];

    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: "cancelled" } : b))
    );

    try {
      const res = await authFetch(`/api/bookings/${bookingId}/cancel`, {
        method: "PATCH",
      });

      const data = await res.json();
      if (!res.ok) {
        setBookings(previousBookings);
        setError(data.error || "Could not cancel booking.");
      }
    } catch {
      setBookings(previousBookings);
      setError("Network error. Cancellation rolled back.");
    } finally {
      setCancellingId(null);
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "confirmed": return { text: "Confirmed", className: "text-[var(--color-sage)]" };
      case "completed": return { text: "Completed", className: "text-stone-400" };
      case "cancelled": return { text: "Cancelled", className: "text-[var(--color-clay)]" };
      default: return { text: status, className: "text-stone-400" };
    }
  };

  if (authLoading || (!user && !error) || user?.role === "admin") {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-stone-300 border-t-[var(--color-ink)] dark:border-stone-700 dark:border-t-white"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-[var(--color-ink)] dark:text-white">
        Your bookings
      </h1>


      <div className="mt-6 flex items-center gap-1 border-b border-stone-200 dark:border-stone-800 pb-0 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setPage(1);
            }}
            className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
              activeTab === tab.id
                ? "border-[var(--color-sandstone)] text-[var(--color-ink)] dark:text-white"
                : "border-transparent text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-5 rounded-md border border-[var(--color-clay)]/20 bg-orange-50 dark:bg-orange-950/30 px-4 py-3 text-sm text-[var(--color-clay)] flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-lg border border-stone-200 bg-stone-100 dark:bg-stone-900 dark:border-stone-800 animate-pulse"></div>
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="mt-12 text-center py-12">
          <p className="text-sm text-stone-500">No bookings here.</p>
          <p className="text-xs text-stone-400 mt-1">Try a different filter, or book something from the rooms page.</p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {bookings.map((booking) => {
            const startObj = parseISO(booking.startTime);
            const endObj = parseISO(booking.endTime);
            const canCancel = booking.status === "confirmed" && new Date() < startObj;
            const status = statusLabel(booking.status);

            return (
              <div
                key={booking.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-[var(--color-ink)] dark:text-white">{booking.resource.name}</h3>
                    <span className={`text-xs font-medium ${status.className}`}>
                      {status.text}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500 dark:text-stone-400">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="h-3.5 w-3.5" />
                      {format(startObj, "MMM d, yyyy · p")} – {format(endObj, "p")}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {booking.resource.location}
                    </span>
                  </div>

                  <p className="text-xs text-stone-400 italic">"{booking.purpose}"</p>
                </div>

                {canCancel && (
                  <button
                    onClick={() => handleCancelBooking(booking.id)}
                    disabled={cancellingId === booking.id}
                    className="flex items-center gap-1.5 rounded-md border border-stone-200 px-3 py-1.5 text-sm font-medium text-stone-600 hover:border-[var(--color-clay)]/30 hover:text-[var(--color-clay)] dark:border-stone-700 dark:text-stone-400 dark:hover:text-red-400 transition-colors disabled:opacity-50 self-start sm:self-center"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    {cancellingId === booking.id ? "Cancelling…" : "Cancel"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between border-t border-stone-200 pt-5 dark:border-stone-800">
          <p className="text-sm text-stone-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="flex items-center gap-1 rounded-md border border-stone-200 px-3 py-1.5 text-sm font-medium text-stone-600 hover:bg-stone-50 disabled:opacity-40 dark:border-stone-700 dark:text-stone-400 dark:hover:bg-stone-800 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="flex items-center gap-1 rounded-md border border-stone-200 px-3 py-1.5 text-sm font-medium text-stone-600 hover:bg-stone-50 disabled:opacity-40 dark:border-stone-700 dark:text-stone-400 dark:hover:bg-stone-800 transition-colors"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
