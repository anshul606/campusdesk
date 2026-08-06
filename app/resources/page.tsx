"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Search, MapPin, Clock, ChevronLeft, ChevronRight, ArrowRight, AlertCircle } from "lucide-react";

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

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "hall", label: "Halls" },
  { id: "room", label: "Rooms" },
  { id: "equipment", label: "Equipment" },
  { id: "other", label: "Labs" },
];

export default function ResourcesPage() {
  const { user, authFetch, loading: authLoading } = useAuth();
  const router = useRouter();

  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 400);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchResources = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `/api/resources?search=${encodeURIComponent(debouncedSearch)}&category=${selectedCategory}&page=${page}&limit=6`;
      const res = await authFetch(url);
      if (!res.ok) {
        throw new Error("Could not load resources.");
      }
      const data = await res.json();
      setResources(data.data || []);
      setTotalPages(Math.ceil((data.total || 0) / 6) || 1);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedCategory, page, authFetch]);

  useEffect(() => {
    if (user) {
      fetchResources();
    }
  }, [fetchResources, user]);

  if (authLoading || (!user && !error)) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-stone-300 border-t-[var(--color-ink)] dark:border-stone-700 dark:border-t-white"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-[var(--color-ink)] dark:text-white">
        Rooms & equipment
      </h1>


      <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or location…"
            className="w-full rounded-md border border-stone-300 bg-white pl-9 pr-3 py-2 text-sm text-[var(--color-ink)] placeholder-stone-400 focus:border-[var(--color-sandstone)] focus:outline-none dark:border-stone-700 dark:bg-stone-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setPage(1);
              }}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap ${
                selectedCategory === cat.id
                  ? "bg-[var(--color-ink)] text-white dark:bg-white dark:text-[var(--color-night)]"
                  : "text-stone-500 hover:text-[var(--color-ink)] dark:text-stone-400 dark:hover:text-white"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-md border border-[var(--color-clay)]/20 bg-orange-50 dark:bg-orange-950/30 px-4 py-3 text-sm text-[var(--color-clay)] flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 rounded-lg border border-stone-200 bg-stone-100 dark:bg-stone-900 dark:border-stone-800 animate-pulse"></div>
          ))}
        </div>
      ) : resources.length === 0 ? (
        <div className="mt-12 text-center py-16">
          <p className="text-sm text-stone-500">No resources match your search.</p>
          <p className="text-xs text-stone-400 mt-1">Try a different search term or category.</p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource) => (
            <div
              key={resource.id}
              className="flex flex-col justify-between rounded-lg border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900 hover:border-[var(--color-sandstone)]/40 transition-colors"
            >
              <div>
                <p className="text-xs text-stone-400 dark:text-stone-500 capitalize">{resource.category}</p>
                <h3 className="mt-1 text-base font-semibold text-[var(--color-ink)] dark:text-white">
                  {resource.name}
                </h3>
                <p className="mt-1.5 text-sm text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed">
                  {resource.description}
                </p>

                <div className="mt-4 flex flex-col gap-1.5 text-xs text-stone-500 dark:text-stone-400">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                    <span className="truncate">{resource.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                    <span className="font-mono text-xs">{resource.openTime} – {resource.closeTime}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-stone-100 dark:border-stone-800">
                <Link
                  href={`/resources/${resource.id}`}
                  className="flex items-center justify-between w-full rounded-md bg-[var(--color-ink)] px-3.5 py-2 text-sm font-medium text-white hover:bg-stone-800 dark:bg-white dark:text-[var(--color-night)] dark:hover:bg-stone-200 transition-colors"
                >
                  View schedule
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-10 flex items-center justify-between border-t border-stone-200 pt-5 dark:border-stone-800">
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
