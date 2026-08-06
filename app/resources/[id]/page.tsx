"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ArrowLeft, Clock, MapPin, CheckCircle2, AlertTriangle } from "lucide-react";

interface Resource {
  id: string;
  name: string;
  description: string;
  location: string;
  category: string;
  openTime: string;
  closeTime: string;
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
}

export default function ResourceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user, authFetch, loading: authLoading } = useAuth();
  const router = useRouter();

  const [resource, setResource] = useState<Resource | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  const [loadingResource, setLoadingResource] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(false);

  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [purpose, setPurpose] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [clashingSlot, setClashingSlot] = useState<{ startTime: string; endTime: string } | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const fetchResource = useCallback(async () => {
    try {
      const res = await authFetch(`/api/resources/${id}`);
      if (!res.ok) throw new Error("Resource not found");
      const data = await res.json();
      setResource(data);
    } catch {
      setApiError("Could not load this resource.");
    } finally {
      setLoadingResource(false);
    }
  }, [id, authFetch]);

  const fetchBookingsForDate = useCallback(async () => {
    setLoadingBookings(true);
    try {
      const res = await authFetch(`/api/resources/${id}/bookings?date=${selectedDate}`);
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } catch {
      
    } finally {
      setLoadingBookings(false);
    }
  }, [id, selectedDate, authFetch]);

  useEffect(() => {
    if (user) {
      fetchResource();
    }
  }, [user, fetchResource]);

  useEffect(() => {
    if (user && resource) {
      fetchBookingsForDate();
    }
  }, [user, resource, selectedDate, fetchBookingsForDate]);

  const handleSelectSlot = (startHour: number) => {
    if (user?.role === "admin") return;
    const startStr = `${selectedDate}T${String(startHour).padStart(2, "0")}:00`;
    const endStr = `${selectedDate}T${String(startHour + 1).padStart(2, "0")}:00`;
    setStartTime(startStr);
    setEndTime(endStr);
    setFieldErrors({});
    setApiError(null);
    setClashingSlot(null);
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setApiError(null);
    setClashingSlot(null);
    setSuccessMsg(null);

    setSubmitting(true);
    try {
      const res = await authFetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceId: id,
          startTime,
          endTime,
          purpose,
        }),
      });

      const data = await res.json();

      if (res.status === 409) {
        setApiError(data.error || "This slot clashes with an existing booking.");
        if (data.clashingSlot) {
          setClashingSlot(data.clashingSlot);
        }
        setSubmitting(false);
        return;
      }

      if (!res.ok) {
        if (data.details) {
          setFieldErrors(data.details);
        } else {
          setApiError(data.error || "Could not create booking.");
        }
        setSubmitting(false);
        return;
      }

      setSuccessMsg("Booking confirmed.");
      setPurpose("");
      fetchBookingsForDate();
    } catch {
      setApiError("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loadingResource) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-stone-300 border-t-[var(--color-ink)] dark:border-stone-700 dark:border-t-white"></div>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center">
        <h2 className="text-lg font-bold text-[var(--color-ink)] dark:text-white">Not found</h2>
        <Link href="/resources" className="mt-3 inline-block text-sm text-[var(--color-sandstone)] hover:underline">
          ← Back to rooms
        </Link>
      </div>
    );
  }

  const openHour = parseInt(resource.openTime.split(":")[0], 10) || 9;
  const closeHour = parseInt(resource.closeTime.split(":")[0], 10) || 21;
  const hoursArray = Array.from({ length: closeHour - openHour }, (_, i) => openHour + i);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link href="/resources" className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-[var(--color-ink)] dark:text-stone-400 dark:hover:text-white mb-6 transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        
        <div className="lg:col-span-7 space-y-6">
          
          <div>
            <p className="text-xs text-stone-400 dark:text-stone-500 capitalize">{resource.category}</p>
            <h1 className="mt-1 text-2xl font-bold text-[var(--color-ink)] dark:text-white">{resource.name}</h1>
            <p className="mt-2 text-sm text-stone-500 dark:text-stone-400 leading-relaxed">{resource.description}</p>
            <div className="mt-3 flex items-center gap-4 text-xs text-stone-500 dark:text-stone-400">
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {resource.location}</span>
              <span className="flex items-center gap-1 font-mono"><Clock className="h-3.5 w-3.5" /> {resource.openTime} – {resource.closeTime}</span>
            </div>
          </div>

          <div className="rounded-lg border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100 dark:border-stone-800">
              <h3 className="text-sm font-semibold text-[var(--color-ink)] dark:text-white">Schedule</h3>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="rounded-md border border-stone-300 px-2.5 py-1.5 text-sm font-mono text-[var(--color-ink)] focus:border-[var(--color-sandstone)] focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-white"
              />
            </div>

            {loadingBookings ? (
              <div className="py-10 text-center text-sm text-stone-400 animate-pulse">Loading schedule…</div>
            ) : (
              <div className="mt-4 flex flex-col gap-1.5">
                <div className="flex items-center gap-4 text-xs text-stone-400 mb-2">
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-6 rounded-sm border border-stone-300 dark:border-stone-600"></span> Open</span>
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-6 rounded-sm bg-stone-300 dark:bg-stone-600"></span> Booked</span>
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-6 rounded-sm bg-[var(--color-sandstone)]"></span> Selected</span>
                </div>

                {hoursArray.map((hour, index) => {
                  const slotStart = new Date(`${selectedDate}T${String(hour).padStart(2, "0")}:00:00`);
                  const slotEnd = new Date(`${selectedDate}T${String(hour + 1).padStart(2, "0")}:00:00`);

                  const matchedBooking = bookings.find((b) => {
                    const bStart = new Date(b.startTime);
                    const bEnd = new Date(b.endTime);
                    return slotStart < bEnd && slotEnd > bStart;
                  });

                  const isBooked = !!matchedBooking;
                  const isMine = isBooked && matchedBooking.user?.id === user?.id;

                  const formattedSlotStart = `${selectedDate}T${String(hour).padStart(2, "0")}:00`;
                  const isSelected = startTime === formattedSlotStart;

                  return (
                    <div
                      key={hour}
                      onClick={() => !isBooked && handleSelectSlot(hour)}
                      style={{ animationDelay: `${index * 30}ms` }}
                      className={`slot-enter flex items-center justify-between rounded-md border px-3 py-2.5 text-sm transition-colors ${
                        isMine
                          ? "border-stone-300 bg-stone-100 text-stone-600 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 cursor-default"
                          : isBooked
                          ? "border-stone-200 bg-stone-100 text-stone-400 dark:border-stone-800 dark:bg-stone-800/60 dark:text-stone-500 cursor-default"
                          : isSelected
                          ? "border-[var(--color-sandstone)] bg-amber-50 text-[var(--color-sandstone)] dark:bg-amber-950/30 dark:border-amber-600 font-semibold cursor-pointer"
                          : "border-stone-200 bg-white hover:border-[var(--color-sandstone)]/50 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-stone-600 cursor-pointer"
                      }`}
                    >
                      <span className="font-mono text-xs">
                        {String(hour).padStart(2, "0")}:00 – {String(hour + 1).padStart(2, "0")}:00
                      </span>

                      {isMine ? (
                        <span className="text-xs font-medium text-stone-500 dark:text-stone-400">Your booking</span>
                      ) : isBooked ? (
                        <span className="text-xs text-stone-400">Booked</span>
                      ) : isSelected ? (
                        <span className="text-xs font-semibold text-[var(--color-sandstone)]">✓ Selected</span>
                      ) : (
                        <span className="text-xs text-stone-400 group-hover:text-stone-600">Open</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="sticky top-20 rounded-lg border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
            <h2 className="text-base font-semibold text-[var(--color-ink)] dark:text-white">Book this slot</h2>

            {successMsg && (
              <div className="mt-4 rounded-md border border-[var(--color-sage)]/20 bg-emerald-50 px-3 py-2.5 text-sm text-[var(--color-sage)] dark:bg-emerald-950/30 dark:border-emerald-900/40 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {successMsg}
              </div>
            )}

            {apiError && (
              <div className="mt-4 rounded-md border border-[var(--color-clay)]/20 bg-orange-50 px-3 py-2.5 text-sm text-[var(--color-clay)] dark:bg-orange-950/30 dark:border-orange-900/40">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <p>{apiError}</p>
                    {clashingSlot && (
                      <p className="mt-1 text-xs font-mono">
                        Conflict: {format(parseISO(clashingSlot.startTime), "PP p")} – {format(parseISO(clashingSlot.endTime), "p")}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {user?.role === "admin" ? (
              <div className="mt-5 rounded-md border border-stone-200 bg-stone-50 p-4 dark:border-stone-700 dark:bg-stone-800">
                <p className="text-sm text-stone-600 dark:text-stone-300">
                  Admins can't create bookings. Use the{" "}
                  <Link href="/admin" className="text-[var(--color-sandstone)] hover:underline font-medium">
                    admin panel
                  </Link>{" "}
                  to review reservations.
                </p>
              </div>
            ) : (
              <form onSubmit={handleCreateBooking} className="mt-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                    Start time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="block w-full rounded-md border border-stone-300 px-3 py-2 text-sm font-mono text-[var(--color-ink)] focus:border-[var(--color-sandstone)] focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-white"
                  />
                  {fieldErrors.startTime && (
                    <p className="mt-1 text-xs text-[var(--color-clay)]">{fieldErrors.startTime}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                    End time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="block w-full rounded-md border border-stone-300 px-3 py-2 text-sm font-mono text-[var(--color-ink)] focus:border-[var(--color-sandstone)] focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-white"
                  />
                  {fieldErrors.endTime && (
                    <p className="mt-1 text-xs text-[var(--color-clay)]">{fieldErrors.endTime}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                    What's it for?
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="e.g. GDG club orientation session"
                    className="block w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-[var(--color-ink)] placeholder-stone-400 focus:border-[var(--color-sandstone)] focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-white"
                  />
                  {fieldErrors.purpose && (
                    <p className="mt-1 text-xs text-[var(--color-clay)]">{fieldErrors.purpose}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-md bg-[var(--color-sandstone)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50 transition-colors"
                >
                  {submitting ? "Confirming…" : "Confirm booking"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
