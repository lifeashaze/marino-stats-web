"use client";

import { CircularProgress } from "@/components/ui/circular-progress";
import { formatTimeLabel } from "@/lib/time";
import type { Zone } from "@/lib/queries";
import type { GoNowStatus, Verdict } from "@/components/dashboard/go-now-section";
import { getCompactZoneName } from "@/components/dashboard/zone-utils";

type GoNowCardProps = {
  zone: Zone;
  status: GoNowStatus;
};

const VERDICT_STYLES: Record<Verdict, { label: string; className: string }> = {
  quieter: {
    label: "Quieter than usual",
    className:
      "bg-green-100/80 text-green-700 dark:bg-green-500/15 dark:text-green-400",
  },
  typical: {
    label: "Typical",
    className:
      "bg-neutral-100/90 text-neutral-600 dark:bg-neutral-800/70 dark:text-neutral-400",
  },
  busier: {
    label: "Busier than usual",
    className: "bg-red-100/80 text-red-700 dark:bg-red-500/15 dark:text-red-400",
  },
};

export function GoNowCard({ zone, status }: GoNowCardProps) {
  const compactName = getCompactZoneName(zone.locationName);

  const utilization =
    status.kind === "live" || status.kind === "stale" || status.kind === "class-driven"
      ? zone.totalCapacity
        ? (status.reading.count / zone.totalCapacity) * 100
        : null
      : null;

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-4">
      <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400 truncate" title={zone.locationName}>
        {compactName}
      </div>
      {zone.facilityName && (
        <div className="text-[10px] text-neutral-400 dark:text-neutral-600 truncate">
          {zone.facilityName}
        </div>
      )}

      {status.kind === "closed" && (
        <div className="mt-3">
          <div className="text-xl font-semibold text-neutral-400 dark:text-neutral-600">
            Closed
          </div>
          <div className="text-xs text-neutral-400 dark:text-neutral-600 mt-1">
            {status.reason}
          </div>
        </div>
      )}

      {status.kind === "no-data" && (
        <div className="mt-3 text-xl font-semibold text-neutral-400 dark:text-neutral-600">—</div>
      )}

      {(status.kind === "live" || status.kind === "stale" || status.kind === "class-driven") && (
        <>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={[
                "text-3xl font-bold",
                status.kind === "stale"
                  ? "text-neutral-400 dark:text-neutral-600"
                  : "text-amber-600 dark:text-amber-500",
              ].join(" ")}
            >
              {status.reading.count}
            </span>
            {zone.totalCapacity && (
              <CircularProgress value={status.reading.count} max={zone.totalCapacity} size={32} />
            )}
            {utilization != null && (
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                {Math.round(utilization)}%
              </span>
            )}
          </div>

          <div className="mt-2 min-h-5">
            {status.kind === "live" && status.verdict && (
              <span
                className={[
                  "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
                  VERDICT_STYLES[status.verdict].className,
                ].join(" ")}
              >
                {VERDICT_STYLES[status.verdict].label}
              </span>
            )}
            {status.kind === "class-driven" && (
              <span className="text-[11px] text-neutral-400 dark:text-neutral-600">
                Class-driven space
              </span>
            )}
            {status.kind === "stale" && (
              <span className="text-[11px] text-neutral-400 dark:text-neutral-600">
                No recent reading
              </span>
            )}
          </div>

          <div className="mt-1 text-[11px] text-neutral-400 dark:text-neutral-500">
            {status.kind !== "stale" && status.isOld
              ? `unchanged since ${formatTimeLabel(status.reading.recordedAt)}`
              : `as of ${formatTimeLabel(status.reading.recordedAt)}`}
          </div>
        </>
      )}
    </div>
  );
}
