"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/resources");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-stone-300 border-t-[var(--color-ink)] dark:border-stone-700 dark:border-t-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center px-4 sm:px-6">
      <div className="mx-auto w-full max-w-2xl py-20">
        <p className="font-display text-2xl text-[var(--color-ink)] dark:text-[#E8E4DC] mb-5">
          Campus<em className="text-[var(--color-sandstone)]">Desk</em>
        </p>
        <h1 className="font-display italic text-4xl sm:text-5xl md:text-6xl leading-[1.1] text-[var(--color-ink)] dark:text-[#E8E4DC]">
          Book a room, lab, or projector at LNMIIT.
        </h1>



        <Link
          href="/login"
          className="mt-8 inline-flex items-center gap-2 rounded-md bg-[var(--color-sandstone)] px-5 py-3 text-sm font-semibold text-white hover:bg-amber-700 transition-colors"
        >
          Sign in to get started
          <ArrowRight className="h-4 w-4" />
        </Link>


      </div>
    </div>
  );
}
