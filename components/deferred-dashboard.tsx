"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Shown when build-time prerender can't reach Turso; refreshes on mount. */
export function DeferredDashboard() {
  const router = useRouter();

  useEffect(() => {
    router.refresh();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0a0a0a] p-4">
      <p className="text-sm text-neutral-500 dark:text-neutral-400">Loading gym data…</p>
    </div>
  );
}
