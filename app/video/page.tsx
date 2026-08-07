"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function VideoPage() {
  const driveEmbedUrl = "https://drive.google.com/file/d/1ZJ-vDjCySGq9S538tbs2n7noiWxE7o9A/preview";

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
          <h1 className="text-3xl font-bold text-[var(--color-ink)] dark:text-white tracking-tight">
            CampusDesk Video Walkthrough
          </h1>
          <p className="mt-2 text-sm text-stone-500 dark:text-stone-400 leading-relaxed max-w-2xl">
            Watch a step-by-step video demonstration of CampusDesk.
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
      </div>
    </div>
  );
}
