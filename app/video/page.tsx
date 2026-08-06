"use client";

import Link from "next/link";
import { ArrowLeft, ExternalLink, Play, Sparkles, CheckCircle2, Video } from "lucide-react";

export default function VideoPage() {
  const driveEmbedUrl = "https://drive.google.com/file/d/1j-E0ONqH6TFvw5q1e0urZ45lUsszwQp1/preview";
  const driveDirectUrl = "https://drive.google.com/file/d/1j-E0ONqH6TFvw5q1e0urZ45lUsszwQp1/view?usp=sharing";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link
        href="/resources"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-[var(--color-ink)] dark:text-stone-400 dark:hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      <div className="space-y-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-50 dark:bg-amber-950/30 px-3 py-1 text-xs font-semibold text-[var(--color-sandstone)] mb-3">
            <Video className="h-3.5 w-3.5" /> Project Walkthrough & Explanation
          </div>
          <h1 className="text-3xl font-bold text-[var(--color-ink)] dark:text-white tracking-tight">
            CampusDesk Video Walkthrough
          </h1>
          <p className="mt-2 text-sm text-stone-500 dark:text-stone-400 leading-relaxed max-w-2xl">
            Watch a step-by-step video demonstration of CampusDesk, covering passwordless OTP login, real-time availability timeline grid, conflict-free booking engine, and administrative controls.
          </p>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-stone-200 bg-black shadow-xl dark:border-stone-800">
          <div className="aspect-video w-full">
            <iframe
              src={driveEmbedUrl}
              className="h-full w-full border-0"
              allow="autoplay"
              allowFullScreen
              title="CampusDesk Explanation Video"
            ></iframe>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
          <div>
            <h3 className="text-base font-semibold text-[var(--color-ink)] dark:text-white">
              Having trouble loading the embedded player?
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              You can also open and watch the video directly on Google Drive.
            </p>
          </div>
          <a
            href={driveDirectUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--color-sandstone)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 transition-colors shrink-0"
          >
            Open in Google Drive
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        <div className="mt-8 rounded-xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900">
          <h2 className="text-lg font-bold text-[var(--color-ink)] dark:text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[var(--color-sandstone)]" />
            Key Covered Topics in the Video
          </h2>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 rounded-lg border border-stone-100 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-800/40">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-[var(--color-ink)] dark:text-white">Email OTP Authentication</h4>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">Rate-limited passwordless authentication with Nodemailer Ethereal Mail preview URLs.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-stone-100 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-800/40">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-[var(--color-ink)] dark:text-white">Interactive Availability Grid</h4>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">Live hourly timeline slot grid with instant pre-filling and automatic past-slot disabling.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-stone-100 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-800/40">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-[var(--color-ink)] dark:text-white">Conflict-Free Engine</h4>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">Prisma PostgreSQL atomic database transactions preventing concurrent double-bookings.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-stone-100 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-800/40">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-[var(--color-ink)] dark:text-white">Admin Oversight & Optimistic UI</h4>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">Global reservation oversight, instant cancellations with automatic rollback, and caching.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
