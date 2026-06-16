"use client";

import { ThemeToggle } from "@/components/theme-toggle";

type HeaderProps = {
  semesterLabel: string;
  weekNumber: number;
};

export function Header({ semesterLabel, weekNumber }: HeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-sm sm:text-3xl font-semibold leading-tight tracking-tight whitespace-nowrap text-neutral-900 dark:text-neutral-100">
            Northeastern Recreation Capacity Analytics
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-amber-100/80 px-2.5 py-0.5 text-[11px] sm:text-xs font-medium text-amber-700 ring-1 ring-amber-300/60 dark:bg-amber-500/15 dark:text-amber-400 dark:ring-amber-500/50">
              {semesterLabel} · Week {weekNumber}
            </span>
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
          </div>
        </div>
        <div className="shrink-0 pt-0.5">
          <ThemeToggle />
        </div>
      </div>
      <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs text-amber-900 shadow-sm dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200">
        <span className="font-semibold">New:</span> pin the zones you visit most and compare
        hourly occupancy across semesters.
      </div>
    </div>
  );
}
