"use client";

import { isClosed } from "@/lib/academic-calendar";
import { buildForecast } from "@/lib/forecast";
import { etHourFraction, formatHourLabel, formatTimeLabel, type ETParts } from "@/lib/time";
import type { LatestReading, Reading } from "@/lib/queries";
import { ZoneAreaChart, type ChartPoint } from "@/components/dashboard/zone-area-chart";
import type { BaselineLookup, ZoneGroup } from "@/components/dashboard/zone-utils";

type ZoneChartsSectionProps = {
  zoneGroups: ZoneGroup[];
  readingsForDate: Map<number, Reading[]>;
  selectedDate: string;
  todayET: string;
  latestByZone: Map<number, LatestReading>;
  baselineLookup: BaselineLookup;
  now: ETParts;
};

export function ZoneChartsSection({
  zoneGroups,
  readingsForDate,
  selectedDate,
  todayET,
  latestByZone,
  baselineLookup,
  now,
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

              if (isToday && points.length > 0) {
                const dayBaselines = baselineLookup.get(zone.locationId)?.get(now.dayOfWeek);
                const baselineByHour = new Map<number, number>();
                for (const [hour, cell] of dayBaselines ?? []) baselineByHour.set(hour, cell.avg);

                const forecast = buildForecast({
                  todayPoints: points.map((p) => ({
                    hourFraction: p.hourFraction,
                    count: p.count!,
                  })),
                  baselineByHour,
                  nowHourFraction: now.hour + now.minute / 60,
                });

                if (forecast) {
                  // Bridge point so the dashed line connects to the last actual.
                  const last = points[points.length - 1];
                  last.forecast = last.count;
                  for (const fp of forecast.points) {
                    points.push({
                      hourFraction: fp.hourFraction,
                      forecast: fp.forecast,
                      label: `${formatHourLabel(fp.hourFraction)} (expected)`,
                    });
                  }
                }
              }

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
