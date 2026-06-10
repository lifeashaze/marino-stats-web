"use client";

import { isClosed } from "@/lib/academic-calendar";
import { comparableMsOf, minutesAgoET, utcToComparableMs, type ETParts } from "@/lib/time";
import type { LatestReading, Zone } from "@/lib/queries";
import { GoNowCard } from "@/components/dashboard/go-now-card";
import {
  CLASS_DRIVEN_LOCATION_IDS,
  type BaselineLookup,
  type ZoneGroup,
} from "@/components/dashboard/zone-utils";

export type Verdict = "quieter" | "typical" | "busier";

export type GoNowStatus =
  | { kind: "closed"; reason: string }
  | { kind: "no-data" }
  | { kind: "stale"; reading: LatestReading }
  | { kind: "class-driven"; reading: LatestReading; isOld: boolean }
  | {
      kind: "live";
      reading: LatestReading;
      verdict: Verdict | null;
      baselineAvg: number | null;
      isOld: boolean;
    };

/** Readings older than this get an "unchanged since" note instead of "as of". */
const STALE_MINUTES = 45;
/**
 * The scraper inserts a row only when a count changes upstream, and upstream
 * updates each zone every ~35 min in summer — so an old reading usually means
 * "unchanged", not "unknown". But across ALL zones the longest observed
 * open-hours silence is 50 min (14-day sample); past 60 the pipeline itself is
 * presumed down and readings can no longer be trusted as current.
 */
const PIPELINE_SILENT_MINUTES = 60;
const QUIETER_MAX = 0.75;
const BUSIER_MIN = 1.25;
/** Below this average, "busier than usual" is noise (2 vs 1 people). */
const MIN_BASELINE_FOR_VERDICT = 2;

export function getZoneStatus(args: {
  zone: Zone;
  latest: LatestReading | undefined;
  baselineLookup: BaselineLookup;
  now: ETParts;
  todayET: string;
  pipelineDown: boolean;
}): GoNowStatus {
  const { zone, latest, baselineLookup, now, todayET, pipelineDown } = args;

  const closedReason = isClosed(zone.facilityName, todayET);
  if (closedReason) return { kind: "closed", reason: closedReason };

  if (!latest) return { kind: "no-data" };

  const isOld = minutesAgoET(latest.recordedAt, now) > STALE_MINUTES;
  // An old reading while the pipeline is alive means the count simply hasn't
  // changed at the source; it only becomes untrustworthy when the scraper
  // itself is silent, or the reading is left over from a previous day.
  if (isOld && (pipelineDown || !latest.recordedAt.startsWith(todayET))) {
    return { kind: "stale", reading: latest };
  }

  if (CLASS_DRIVEN_LOCATION_IDS.has(zone.locationId)) {
    return { kind: "class-driven", reading: latest, isOld };
  }

  const baseline = baselineLookup.get(zone.locationId)?.get(now.dayOfWeek)?.get(now.hour);
  if (!baseline || baseline.avg < MIN_BASELINE_FOR_VERDICT) {
    return { kind: "live", reading: latest, verdict: null, baselineAvg: baseline?.avg ?? null, isOld };
  }

  const ratio = latest.count / baseline.avg;
  const verdict: Verdict = ratio < QUIETER_MAX ? "quieter" : ratio > BUSIER_MIN ? "busier" : "typical";
  return { kind: "live", reading: latest, verdict, baselineAvg: baseline.avg, isOld };
}

type GoNowSectionProps = {
  zoneGroups: ZoneGroup[];
  latestByZone: Map<number, LatestReading>;
  baselineLookup: BaselineLookup;
  now: ETParts;
  todayET: string;
};

export function GoNowSection({
  zoneGroups,
  latestByZone,
  baselineLookup,
  now,
  todayET,
}: GoNowSectionProps) {
  // Newest insert across ALL zones = pipeline heartbeat (fetched_at is true UTC).
  let latestFetchMs = -Infinity;
  for (const reading of latestByZone.values()) {
    latestFetchMs = Math.max(latestFetchMs, utcToComparableMs(reading.fetchedAt));
  }
  const pipelineDown =
    latestFetchMs === -Infinity ||
    comparableMsOf(now) - latestFetchMs > PIPELINE_SILENT_MINUTES * 60_000;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Right now</h2>
        <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          vs. typical for this hour
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {zoneGroups.flatMap(({ zones }) =>
          zones.map((zone) => (
            <GoNowCard
              key={zone.locationId}
              zone={zone}
              status={getZoneStatus({
                zone,
                latest: latestByZone.get(zone.locationId),
                baselineLookup,
                now,
                todayET,
                pipelineDown,
              })}
            />
          ))
        )}
      </div>
    </div>
  );
}
