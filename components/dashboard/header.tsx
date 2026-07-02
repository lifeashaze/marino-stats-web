import Link from "next/link";
import { History } from "lucide-react";
import { HowItWorksDialog } from "@/components/dashboard/how-it-works-dialog";
import { pillLinkClass } from "@/components/dashboard/pill-link";
import { ThemeToggle } from "@/components/theme-toggle";

export function Header() {
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
                className="text-[#C8102E] dark:text-[#ff4f68] hover:underline"
              >
                Live Facility Counts
              </a>
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <HowItWorksDialog />
              <Link href="/changelog" className={pillLinkClass}>
                <History className="h-3.5 w-3.5 text-neutral-400 dark:text-neutral-500" />
                Changelog
              </Link>
            </div>
          </div>
        </div>
        <div className="shrink-0 pt-0.5">
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
