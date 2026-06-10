"use client";

import { isClosed } from "@/lib/academic-calendar";
import { minutesAgoET, type ETParts } from "@/lib/time";
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
  | { kind: "stale"; reading: LatestReading; minutesAgo: number }
  | { kind: "class-driven"; reading: LatestReading }
  | { kind: "live"; reading: LatestReading; verdict: Verdict | null; baselineAvg: number | null };

const STALE_MINUTES = 45;
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
}): GoNowStatus {
  const { zone, latest, baselineLookup, now, todayET } = args;

  const closedReason = isClosed(zone.facilityName, todayET);
  if (closedReason) return { kind: "closed", reason: closedReason };

  if (!latest) return { kind: "no-data" };

  const minutesAgo = minutesAgoET(latest.recordedAt);
  if (minutesAgo > STALE_MINUTES) {
    return { kind: "stale", reading: latest, minutesAgo };
  }

  if (CLASS_DRIVEN_LOCATION_IDS.has(zone.locationId)) {
    return { kind: "class-driven", reading: latest };
  }

  const baseline = baselineLookup.get(zone.locationId)?.get(now.dayOfWeek)?.get(now.hour);
  if (!baseline || baseline.avg < MIN_BASELINE_FOR_VERDICT) {
    return { kind: "live", reading: latest, verdict: null, baselineAvg: baseline?.avg ?? null };
  }

  const ratio = latest.count / baseline.avg;
  const verdict: Verdict = ratio < QUIETER_MAX ? "quieter" : ratio > BUSIER_MIN ? "busier" : "typical";
  return { kind: "live", reading: latest, verdict, baselineAvg: baseline.avg };
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
              })}
            />
          ))
        )}
      </div>
    </div>
  );
}
