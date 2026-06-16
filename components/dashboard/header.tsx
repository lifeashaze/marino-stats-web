"use client";

import { useEffect, useId, useState } from "react";
import { Pin, Sparkles, TrendingUp, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export function Header() {
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
          <h1 className="text-sm sm:text-3xl font-semibold leading-tight tracking-tight whitespace-nowrap text-neutral-900 dark:text-neutral-100">
            Northeastern Recreation Capacity Analytics
          </h1>
          <div className="mt-2">
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
              className="mt-1 block cursor-pointer text-left text-xs font-medium text-amber-700 underline underline-offset-4 transition-colors hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 sm:text-sm"
            >
              What&apos;s new?
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
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-950"
          >
            <div className="border-b border-neutral-200 bg-neutral-50 p-5 dark:border-neutral-800 dark:bg-neutral-900/60">
              <div className="flex items-start justify-between gap-3">
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
                  <p
                    id={descriptionId}
                    className="mt-2 max-w-sm text-sm text-neutral-600 dark:text-neutral-400"
                  >
                    A few updates are live to make the dashboard easier to scan and compare.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFeatures(false)}
                  aria-label="Close new features"
                  className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-neutral-700 dark:text-neutral-300">
                <span className="rounded-full bg-white px-2.5 py-1 shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-950 dark:ring-neutral-800">
                  3 updates
                </span>
                <span className="rounded-full bg-white px-2.5 py-1 shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-950 dark:ring-neutral-800">
                  Local pins
                </span>
                <span className="rounded-full bg-white px-2.5 py-1 shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-950 dark:ring-neutral-800">
                  Better comparisons
                </span>
              </div>
            </div>

            <div className="p-5">
              <div className="space-y-3">
                <div className="flex gap-3 rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                    <Pin className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-950 dark:text-neutral-50">
                      Pin zones
                    </h3>
                    <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                      Pin the zones you visit most so they appear in a dedicated Pinned zones
                      section. Pins stay local to your browser.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-950 dark:text-neutral-50">
                      Crowd forecast
                    </h3>
                    <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                      Today&apos;s zone charts now include a dashed rest-of-day forecast based on
                      recent activity and day-of-week patterns.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300">
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
        </div>
      ) : null}
    </div>
  );
}
