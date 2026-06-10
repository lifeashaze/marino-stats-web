"use client";

import { isClosed } from "@/lib/academic-calendar";
import { etHourFraction, formatTimeLabel } from "@/lib/time";
import type { LatestReading, Reading } from "@/lib/queries";
import { ZoneAreaChart, type ChartPoint } from "@/components/dashboard/zone-area-chart";
import type { ZoneGroup } from "@/components/dashboard/zone-utils";

type ZoneChartsSectionProps = {
  zoneGroups: ZoneGroup[];
  readingsForDate: Map<number, Reading[]>;
  selectedDate: string;
  todayET: string;
  latestByZone: Map<number, LatestReading>;
};

export function ZoneChartsSection({
  zoneGroups,
  readingsForDate,
  selectedDate,
  todayET,
  latestByZone,
}: ZoneChartsSectionProps) {
  const isToday = selectedDate === todayET;

  return (
    <div className="space-y-8">
      {zoneGroups.map(({ facilityName, zones }) => (
        <div key={facilityName}>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {facilityName}
            </h2>
            <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
            <span className="text-sm text-neutral-500 dark:text-neutral-400">
              {zones.length} {zones.length === 1 ? "zone" : "zones"}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {zones.map((zone) => {
              const readings = readingsForDate.get(zone.locationId) ?? [];
              const points: ChartPoint[] = readings.map((r) => ({
                hourFraction: etHourFraction(r.recordedAt),
                count: r.count,
                label: formatTimeLabel(r.recordedAt),
              }));

              return (
                <ZoneAreaChart
                  key={zone.locationId}
                  zone={zone}
                  points={points}
                  isToday={isToday}
                  latest={latestByZone.get(zone.locationId)}
                  closedReason={
                    points.length === 0 ? isClosed(zone.facilityName, selectedDate) : null
                  }
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
