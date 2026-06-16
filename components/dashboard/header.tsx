"use client";

import { useEffect, useId, useState } from "react";
import { Pin, Sparkles, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

type HeaderProps = {
  semesterLabel: string;
  weekNumber: number;
};

export function Header({ semesterLabel, weekNumber }: HeaderProps) {
  const [showFeatures, setShowFeatures] = useState(false);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!showFeatures) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowFeatures(false);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [showFeatures]);

  return (
    <div className="mb-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-sm sm:text-3xl font-semibold leading-tight tracking-tight whitespace-nowrap text-neutral-900 dark:text-neutral-100">
              Northeastern Recreation Capacity Analytics
            </h1>
            <span className="inline-flex items-center rounded-full bg-amber-100/80 px-2.5 py-0.5 text-[11px] font-medium text-amber-700 ring-1 ring-amber-300/60 dark:bg-amber-500/15 dark:text-amber-400 dark:ring-amber-500/50 sm:text-xs">
              {semesterLabel} · Week {weekNumber}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
              Data source:{" "}
              <a
                href="https://recreation.northeastern.edu/live-facility-counts/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-600 dark:text-amber-500 hover:underline"
              >
                Live Facility Counts
              </a>
            </p>
            <button
              type="button"
              onClick={() => setShowFeatures(true)}
              className="inline-flex cursor-pointer items-center rounded-full bg-amber-100/80 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-300/60 transition-colors hover:bg-amber-200/80 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/40 dark:hover:bg-amber-500/25 sm:text-sm"
            >
              what&apos;s new?
            </button>
          </div>
        </div>
        <div className="shrink-0 pt-0.5">
          <ThemeToggle />
        </div>
      </div>

      {showFeatures ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowFeatures(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xl dark:border-neutral-800 dark:bg-neutral-950"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                  New features
                </p>
                <h2
                  id={titleId}
                  className="mt-1 text-xl font-semibold text-neutral-950 dark:text-neutral-50"
                >
                  What changed?
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowFeatures(false)}
                aria-label="Close new features"
                className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p id={descriptionId} className="text-sm text-neutral-600 dark:text-neutral-400">
              A few dashboard updates are live:
            </p>
            <div className="mt-4 space-y-3">
              <div className="flex gap-3 rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                  <Pin className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-neutral-950 dark:text-neutral-50">
                    Pin zones
                  </h3>
                  <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                    Pin the zones you visit most so they appear in a dedicated Pinned zones section.
                    Pins stay local to your browser.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-neutral-950 dark:text-neutral-50">
                    Semester comparison
                  </h3>
                  <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                    Compare hourly occupancy patterns across semesters for the selected zone.
                  </p>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowFeatures(false)}
              className="mt-5 w-full cursor-pointer rounded-lg bg-amber-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-700 dark:bg-amber-500 dark:text-neutral-950 dark:hover:bg-amber-400"
            >
              Got it
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
