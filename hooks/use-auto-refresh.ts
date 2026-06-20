"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const REFRESH_INTERVAL_MS = 90_000;
const THROTTLE_MS = 5_000;

/**
 * Re-fetches server component data via router.refresh() when the tab becomes
 * active again or on a periodic interval while visible. Throttled so focus +
 * visibilitychange don't double-fire.
 */
export function useAutoRefresh() {
  const router = useRouter();
  const lastRefreshAt = useRef(0);

  useEffect(() => {
    const refresh = () => {
      const now = Date.now();
      if (now - lastRefreshAt.current < THROTTLE_MS) return;
      lastRefreshAt.current = now;
      router.refresh();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") refresh();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", refresh);
    window.addEventListener("pageshow", refresh);

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, REFRESH_INTERVAL_MS);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("pageshow", refresh);
      clearInterval(interval);
    };
  }, [router]);
}
